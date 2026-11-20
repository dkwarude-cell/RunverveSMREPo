"""
predict.py - run both trained classifiers on one image (this is what the Cloud Run service will call).

Usage:
    python predict.py path/to/image.jpg

Output (JSON):
{
  "body_part": {"label": "Knee", "confidence": 0.94, "top3": [["Knee", 0.94], ["Elbow", 0.03], ...]},
  "wound":     {"label": "No_Wound", "confidence": 0.97, "has_wound": false, "top3": [...]}
}
"""
import json
import sys
from pathlib import Path

import torch
from PIL import Image, ImageOps

from data import eval_transform
from evaluate import load_checkpoint

HERE = Path(__file__).resolve().parent


class SmartHealClassifier:
    def __init__(self, runs_dir=HERE / "runs", device=None):
        self.device = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))
        self.models = {}
        for task in ("body", "wound"):
            model, ckpt = load_checkpoint(Path(runs_dir) / task / "best.pt", self.device)
            self.models[task] = (model, ckpt["classes"], eval_transform(ckpt["img_size"]))

    @torch.no_grad()
    def _run(self, task, img):
        model, classes, tf = self.models[task]
        x = tf(img).unsqueeze(0).to(self.device, memory_format=torch.channels_last)
        p = (torch.softmax(model(x).float(), 1) + torch.softmax(model(torch.flip(x, dims=[3])).float(), 1)) / 2
        p = p[0].cpu()
        top = torch.topk(p, k=min(3, len(classes)))
        return {"label": classes[int(top.indices[0])], "confidence": round(float(top.values[0]), 4),
                "top3": [[classes[int(i)], round(float(v), 4)] for v, i in zip(top.values, top.indices)]}

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
    print(json.dumps(SmartHealClassifier().predict(sys.argv[1]), indent=2))
