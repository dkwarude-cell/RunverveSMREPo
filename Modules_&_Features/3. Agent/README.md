# SmartHeal backend (Cloud Run)

```
Agent/
├── models/                     ← put your 3 trained models here (see below)
│   ├── resnet50_body.pt
│   ├── resnet50_wound.pt
│   └── random_forest.pkl
├── smartheal_agent/
│   ├── __init__.py
│   └── agent.py                ← Gemini agent (verifies the model predictions)
├── inference.py                ← runs ResNet50 + Random Forest (+ safety ranges)
├── main.py                     ← FastAPI server: POST /analyze
├── test_local.py               ← sends a test request
├── requirements.txt
├── Dockerfile
├── .dockerignore
└── .env                        ← your Google Cloud settings (not uploaded to the image)
```

## 1. Copy the models (rename them)
| From | To |
|---|---|
| `CNNs/resnet50/runs/body/best.pt` | `models/resnet50_body.pt` |
| `CNNs/resnet50/runs/wound/best.pt` | `models/resnet50_wound.pt` |
| `Regression/models/random_forest.pkl` | `models/random_forest.pkl` |

## 2. Run locally (PowerShell, inside `Agent/`)
```
python -m venv .venv
.venv\Scripts\activate
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
gcloud auth application-default login
```
Check the models alone (no Gemini):
```
python inference.py path\to\photo.jpg
```
Start the server:
```
uvicorn main:app --port 8080
```
In a second terminal (same venv):
```
python test_local.py path\to\photo.jpg
```

## 3. Deploy to Cloud Run
```
gcloud run deploy smartheal-agent --source . --region us-west1 --memory 4Gi --cpu 2 --timeout 300 --allow-unauthenticated --set-env-vars GOOGLE_GENAI_USE_VERTEXAI=TRUE,GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID,GOOGLE_CLOUD_LOCATION=YOUR_LOCATION
```
Use the same three values that are in your `.env`. The command prints the service URL.
Test it:
```
python test_local.py path\to\photo.jpg https://YOUR-SERVICE-URL
```

## API
`POST /analyze` (multipart/form-data)

| Field | Type | Range |
|---|---|---|
| image | file | jpg / png |
| age | int | 18–100 |
| bmi | float | 10–60 |
| body_fat_percent | float | 3–70 |
| skin_temperature_c | float | 30–42 |
| diabetic | int | 0 / 1 |
| pain_level | int | 1–10 |
| pain_duration_weeks | int | 0–520 |
| neuropathic_score | int | 0–3 |
| stiffness_level | int | 0–10 |
| muscle_spasm_level | int | 0–10 |

Response (JSON):
```
{
  "analysis": "...agent text (markdown, same style as before)...",
  "cnn": { "body_part": {"label", "confidence", "top3"}, "wound": {...} },
  "therapy_model": { "Heat_Setting": "Low", "Heat_Temperature_C": 38.8, ... 13 values },
  "safety_adjustments": [ ... ],
  "inputs": { ... the 10 values ... },
  "timing_ms": { "models": ..., "agent": ... }
}
```
