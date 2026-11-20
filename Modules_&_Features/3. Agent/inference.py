"""
inference.py - runs the two trained models used by SmartHeal.

  1. ResNet50 (PyTorch)    : image -> body part, wound type (with confidence)
  2. Random Forest (sklearn): 10 user values -> 13 heat / vibration / TENS values

Quick test without Gemini:
    python inference.py path/to/photo.jpg
"""
import io
import sys
from pathlib import Path

import joblib
import pandas as pd
import torch
import torch.nn as nn
from PIL import Image, ImageOps
from torchvision import models, transforms

MODELS_DIR = Path(__file__).resolve().parent / "models"
torch.set_num_threads(2)

# the 10 inputs, in the same order used for training
INPUT_COLS = ["Age", "BMI", "Body_Fat_Percent", "Skin_Temperature_C", "Diabetic",
              "Pain_Level", "Pain_Duration_Weeks", "Neuropathic_Score",
              "Stiffness_Level", "Muscle_Spasm_Level"]


# ----------------------------------------------------------------------------- ResNet50
def load_resnet(path):
    """Rebuild the ResNet50 used in training and load the saved weights."""
    ckpt = torch.load(path, map_location="cpu", weights_only=False)
    model = models.resnet50(weights=None)
    model.fc = nn.Sequential(nn.Dropout(0.3), nn.Linear(model.fc.in_features, len(ckpt["classes"])))
    model.load_state_dict(ckpt["state_dict"])
    model.eval()
    return model, ckpt["classes"], ckpt.get("img_size", 224)


body_model, body_classes, IMG_SIZE = load_resnet(MODELS_DIR / "resnet50_body.pt")
wound_model, wound_classes, _ = load_resnet(MODELS_DIR / "resnet50_wound.pt")

# same preprocessing as evaluation during training
image_transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225)),
])


def open_image(image_bytes):
    img = Image.open(io.BytesIO(image_bytes))
    img = ImageOps.exif_transpose(img)          # phone photos can be rotated
    return img.convert("RGB")


@torch.no_grad()
def classify(model, classes, img):
    x = image_transform(img).unsqueeze(0)
    probs = torch.softmax(model(x), dim=1)
    probs = (probs + torch.softmax(model(torch.flip(x, dims=[3])), dim=1)) / 2   # + mirrored image
    probs = probs[0]
    top = torch.topk(probs, k=3)
    return {
        "label": classes[int(top.indices[0])],
        "confidence": round(float(top.values[0]), 4),
        "top3": [{"label": classes[int(i)], "confidence": round(float(p), 4)}
                 for p, i in zip(top.values, top.indices)],
    }


def run_cnn(image_bytes):
    img = open_image(image_bytes)
    return {"body_part": classify(body_model, body_classes, img),
            "wound": classify(wound_model, wound_classes, img)}


def image_for_gemini(image_bytes, max_side=1280):
    """Smaller JPEG copy of the photo for Gemini (faster upload, same content)."""
    img = open_image(image_bytes)
    img.thumbnail((max_side, max_side))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


# ----------------------------------------------------------------------------- Random Forest
rf_models = joblib.load(MODELS_DIR / "random_forest.pkl")

HEAT = {"Low": (37.0, 40.0, 30, 40), "Medium": (40.0, 46.0, 20, 25), "High": (46.5, 48.0, 10, 15)}
VIB_FREQ_BANDS = [(5, 20), (20, 50), (100, 150)]
VIB_AMP_BANDS = [(0.2, 0.5), (1.0, 2.0)]
TENS = {"Conventional": (80, 150, 50, 100, 20, 30, "Strong But Comfortable"),
        "AL-TENS": (2, 10, 150, 300, 30, 60, "Motor Threshold"),
        "Burst": (100, 100, 150, 250, 20, 40, "Motor Threshold")}


def clip(v, lo, hi):
    return max(lo, min(hi, v))


def nearest_band(v, bands):
    """Keep v if it is inside a band, otherwise move it to the closest band edge."""
    for lo, hi in bands:
        if lo <= v <= hi:
            return v
    edges = [e for band in bands for e in band]
    return min(edges, key=lambda e: abs(e - v))


def apply_safety(user, t):
    """Keep every value inside the guideline (PDF) range of its predicted category,
    plus the hard heat-safety rules. Returns the fixed values and a list of changes."""
    changes = []

    # heat: hard rules first
    if (user["Diabetic"] == 1 or user["Neuropathic_Score"] >= 2 or user["Skin_Temperature_C"] >= 37.5) \
            and t["Heat_Setting"] != "Low":
        changes.append(f"Heat setting {t['Heat_Setting']} -> Low (diabetic / nerve pain / warm skin)")
        t["Heat_Setting"] = "Low"
    if t["Heat_Setting"] == "High" and user["Pain_Duration_Weeks"] < 2:
        changes.append("Heat setting High -> Medium (pain under 2 weeks old)")
        t["Heat_Setting"] = "Medium"
    tmin, tmax, dmin, dmax = HEAT[t["Heat_Setting"]]
    if user["Age"] >= 65:
        tmax = min(tmax, 43.0)
    t["Heat_Temperature_C"] = clip(t["Heat_Temperature_C"], tmin, tmax)
    t["Heat_Duration_Min"] = clip(t["Heat_Duration_Min"], dmin, dmax)

    # vibration
    t["Vibration_Frequency_Hz"] = nearest_band(t["Vibration_Frequency_Hz"], VIB_FREQ_BANDS)
    t["Vibration_Amplitude_mm"] = nearest_band(t["Vibration_Amplitude_mm"], VIB_AMP_BANDS)
    t["Vibration_Duration_Min"] = clip(t["Vibration_Duration_Min"], 10, 30)

    # TENS: values must fit the predicted mode
    f0, f1, p0, p1, d0, d1, intensity = TENS[t["TENS_Mode"]]
    t["TENS_Frequency_Hz"] = clip(t["TENS_Frequency_Hz"], f0, f1)
    t["TENS_Pulse_Width_us"] = clip(t["TENS_Pulse_Width_us"], p0, p1)
    t["TENS_Duration_Min"] = clip(t["TENS_Duration_Min"], d0, d1)
    if t["TENS_Intensity"] != intensity:
        changes.append(f"TENS intensity -> {intensity} (matches {t['TENS_Mode']} mode)")
        t["TENS_Intensity"] = intensity
    return t, changes


def run_therapy(user):
    X = pd.DataFrame([user])[INPUT_COLS]
    raw = {}
    for name, model in rf_models.items():
        v = model.predict(X)[0]
        raw[name] = v if isinstance(v, str) else float(v)
    fixed, changes = apply_safety(user, dict(raw))

    # tidy rounding for display: minutes, Hz and us as whole numbers
    for k, v in fixed.items():
        if isinstance(v, str):
            continue
        if k == "Vibration_Amplitude_mm":
            fixed[k] = round(v, 2)
        elif k == "Heat_Temperature_C":
            fixed[k] = round(v, 1)
        else:
            fixed[k] = int(round(v))
    return fixed, changes


# ----------------------------------------------------------------------------- quick test
if __name__ == "__main__":
    example_user = {"Age": 58, "BMI": 28.0, "Body_Fat_Percent": 38.0, "Skin_Temperature_C": 34.2,
                    "Diabetic": 1, "Pain_Level": 6, "Pain_Duration_Weeks": 30, "Neuropathic_Score": 2,
                    "Stiffness_Level": 5, "Muscle_Spasm_Level": 2}
    if len(sys.argv) > 1:
        print("CNN:", run_cnn(Path(sys.argv[1]).read_bytes()))
    therapy, notes = run_therapy(example_user)
    print("Therapy:", therapy)
    print("Safety changes:", notes)