"""
predict.py - run both trained YOLO classifiers on one image.

Usage:
    python predict.py path/to/image.jpg
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

HERE = Path(__file__).resolve().parent


class SmartHealYOLO:
    def __init__(self, runs_dir=HERE / "runs"):
        from ultralytics import YOLO
        self.models = {t: YOLO(str(Path(runs_dir) / t / "best.pt")) for t in ("body", "wound")}

    def _run(self, task, img):
        m = self.models[task]
        names = [m.names[i] for i in range(len(m.names))]
        p = m.predict(img, imgsz=224, verbose=False)[0].probs.data.float().cpu().numpy()
        p = (p + m.predict(ImageOps.mirror(img), imgsz=224, verbose=False)[0].probs.data.float().cpu().numpy()) / 2
        top = np.argsort(-p)[:3]
        return {"label": names[top[0]], "confidence": round(float(p[top[0]]), 4),
                "top3": [[names[i], round(float(p[i]), 4)] for i in top]}

    def predict(self, image):
        img = Image.open(image) if not isinstance(image, Image.Image) else image
        img = ImageOps.exif_transpose(img).convert("RGB")
        body = self._run("body", img)
        wound = self._run("wound", img)
        wound["has_wound"] = wound["label"] != "No_Wound"
        return {"body_part": body, "wound": wound}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("usage: python predict.py image.jpg"); sys.exit(1)
    print(json.dumps(SmartHealYOLO().predict(sys.argv[1]), indent=2))
