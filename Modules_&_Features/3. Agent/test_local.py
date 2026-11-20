"""
test_local.py - send one test request to the SmartHeal API.

    python test_local.py path/to/photo.jpg                      # local server (http://localhost:8080)
    python test_local.py path/to/photo.jpg https://YOUR-URL     # deployed Cloud Run service
"""
import json
import sys

import requests

image_path = sys.argv[1]
url = (sys.argv[2] if len(sys.argv) > 2 else "http://localhost:8080").rstrip("/") + "/analyze"

user = {
    "age": 58, "bmi": 28.0, "body_fat_percent": 38.0, "skin_temperature_c": 34.2, "diabetic": 1,
    "pain_level": 6, "pain_duration_weeks": 30, "neuropathic_score": 2,
    "stiffness_level": 5, "muscle_spasm_level": 2,
}

with open(image_path, "rb") as f:
    r = requests.post(url, data=user, files={"image": ("photo.jpg", f, "image/jpeg")}, timeout=180)

print("Status:", r.status_code)
res = r.json()
if r.status_code != 200:
    print(json.dumps(res, indent=2))
    sys.exit(1)

print("\n=== CNN ===")
print(json.dumps(res["cnn"], indent=2))
print("\n=== Therapy model ===")
print(json.dumps(res["therapy_model"], indent=2))
print("Safety adjustments:", res["safety_adjustments"])
print("Timing (ms):", res["timing_ms"])
print("\n=== Agent analysis ===\n")
print(res["analysis"])
