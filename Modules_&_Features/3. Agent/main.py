"""
main.py - SmartHeal backend (FastAPI), deployed on Cloud Run.

POST /analyze  (multipart form)
    image                : photo file
    age, bmi, body_fat_percent, skin_temperature_c, diabetic,
    pain_level, pain_duration_weeks, neuropathic_score, stiffness_level, muscle_spasm_level

Flow: photo -> ResNet50 (body part + wound) | 10 values -> Random Forest (therapy)
      -> both results + photo + inputs -> Gemini agent (verifies) -> final answer

Run locally:   uvicorn main:app --port 8080
"""
import time
import uuid

from dotenv import load_dotenv

load_dotenv()   # GOOGLE_GENAI_USE_VERTEXAI, GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

import inference
from smartheal_agent.agent import root_agent

APP_NAME = "smartheal"
app = FastAPI(title="SmartHeal API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

session_service = InMemorySessionService()
runner = Runner(agent=root_agent, app_name=APP_NAME, session_service=session_service)


def build_prompt(user, cnn, therapy, changes):
    """Text that goes to the agent together with the photo."""
    b, w = cnn["body_part"], cnn["wound"]
    t = therapy
    lines = [
        "Analyze this image and follow your instructions.",
        "",
        "USER INPUTS:",
        f"- Age: {user['Age']} years, BMI: {user['BMI']}, Body fat: {user['Body_Fat_Percent']}%, "
        f"Skin temperature: {user['Skin_Temperature_C']} C, Diabetic: {'Yes' if user['Diabetic'] else 'No'}",
        f"- Pain level: {user['Pain_Level']}/10, Pain duration: {user['Pain_Duration_Weeks']} weeks, "
        f"Neuropathic score: {user['Neuropathic_Score']}/3, Stiffness: {user['Stiffness_Level']}/10, "
        f"Muscle spasm: {user['Muscle_Spasm_Level']}/10",
        "",
        "CNN PREDICTIONS (ResNet50 image model, may be inaccurate; test accuracy: body part 82%, wound 98%):",
        f"- Body part: {b['label']} ({b['confidence']:.0%}); other options: "
        + ", ".join(f"{x['label']} {x['confidence']:.0%}" for x in b["top3"][1:]),
        f"- Wound: {w['label']} ({w['confidence']:.0%}); other options: "
        + ", ".join(f"{x['label']} {x['confidence']:.0%}" for x in w["top3"][1:]),
        "",
        "THERAPY MODEL PREDICTIONS (Random Forest, may be inaccurate):",
        f"- Heat: {t['Heat_Setting']}, {t['Heat_Temperature_C']} C, {t['Heat_Duration_Min']} min",
        f"- Vibration: {t['Vibration_Frequency_Hz']} Hz, {t['Vibration_Amplitude_mm']} mm, "
        f"{t['Vibration_Pattern']}, {t['Vibration_Duration_Min']} min",
        f"- TENS: {t['TENS_Mode']}, {t['TENS_Frequency_Hz']} Hz, {t['TENS_Pulse_Width_us']} us, "
        f"{t['TENS_Intensity']}, {t['TENS_Duration_Min']} min, {t['TENS_Electrode_Placement']} placement",
    ]
    if changes:
        lines += ["", "Safety rules already applied to the therapy model output:"] + [f"- {c}" for c in changes]
    lines += ["", "Verify all of the above yourself, then give the final answer."]
    return "\n".join(lines)


async def ask_agent(image_jpeg, prompt):
    session = await session_service.create_session(app_name=APP_NAME, user_id=f"user-{uuid.uuid4().hex[:8]}")
    message = types.Content(role="user", parts=[
        types.Part.from_bytes(data=image_jpeg, mime_type="image/jpeg"),
        types.Part(text=prompt),
    ])
    answer = ""
    async for event in runner.run_async(user_id=session.user_id, session_id=session.id, new_message=message):
        if event.is_final_response() and event.content and event.content.parts:
            answer = "".join(p.text or "" for p in event.content.parts)
    await session_service.delete_session(app_name=APP_NAME, user_id=session.user_id, session_id=session.id)
    return answer.strip()


@app.get("/")
def health():
    return {"status": "ok", "service": "SmartHeal API"}


@app.post("/analyze")
async def analyze(
    image: UploadFile = File(...),
    age: int = Form(..., ge=18, le=100),
    bmi: float = Form(..., ge=10, le=60),
    body_fat_percent: float = Form(..., ge=3, le=70),
    skin_temperature_c: float = Form(..., ge=30, le=42),
    diabetic: int = Form(..., ge=0, le=1),
    pain_level: int = Form(..., ge=1, le=10),
    pain_duration_weeks: int = Form(..., ge=0, le=520),
    neuropathic_score: int = Form(..., ge=0, le=3),
    stiffness_level: int = Form(..., ge=0, le=10),
    muscle_spasm_level: int = Form(..., ge=0, le=10),
):
    t0 = time.time()
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image")

    user = {"Age": age, "BMI": bmi, "Body_Fat_Percent": body_fat_percent,
            "Skin_Temperature_C": skin_temperature_c, "Diabetic": diabetic,
            "Pain_Level": pain_level, "Pain_Duration_Weeks": pain_duration_weeks,
            "Neuropathic_Score": neuropathic_score, "Stiffness_Level": stiffness_level,
            "Muscle_Spasm_Level": muscle_spasm_level}

    # 1. the two ML models
    try:
        cnn = inference.run_cnn(image_bytes)
        image_jpeg = inference.image_for_gemini(image_bytes)
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read the image file")
    therapy, changes = inference.run_therapy(user)
    t_models = time.time()

    # 2. Gemini agent verifies and writes the final answer
    try:
        analysis = await ask_agent(image_jpeg, build_prompt(user, cnn, therapy, changes))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI agent failed: {e}")

    return {
        "analysis": analysis,
        "cnn": cnn,
        "therapy_model": therapy,
        "safety_adjustments": changes,
        "inputs": user,
        "timing_ms": {"models": int((t_models - t0) * 1000), "agent": int((time.time() - t_models) * 1000)},
    }
