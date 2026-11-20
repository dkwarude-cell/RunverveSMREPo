"""
evaluate.py - evaluate trained YOLO classifiers on the held-out split (same metrics as vgg19/ and resnet50/).

Usage:
    python evaluate.py --task all              # test split, flip TTA
    python evaluate.py --task body --split val --no-tta
"""
import argparse
import csv
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

import common

HERE = Path(__file__).resolve().parent


def _probs(model, images, imgsz, batch=32):
    out = []
    for i in range(0, len(images), batch):
        res = model.predict(images[i:i + batch], imgsz=imgsz, verbose=False)
        out.extend(r.probs.data.float().cpu().numpy() for r in res)
    return np.stack(out)


def evaluate_weights(weights, task, split_name="test", tta=True):
    from ultralytics import YOLO
    import torch
    model = YOLO(str(weights))
    split = common.make_split(task)
    common.build_cache(task, split)
    classes = split["classes"]
    names = [model.names[i] for i in range(len(model.names))]
    if sorted(names) != sorted(classes):
        raise RuntimeError(f"model classes {names} differ from dataset classes {classes}")
    order = [names.index(c) for c in classes]           # reorder model outputs to dataset class order

    items = split["splits"][split_name]
    imgs = []
    for rel, _ in items:
        with Image.open(common.cache_path(task, rel)) as im:
            imgs.append(im.convert("RGB"))
    imgsz = 224                                          # same size used in training (train.py HYP)
    p = _probs(model, imgs, imgsz)
    if tta:
        p = (p + _probs(model, [ImageOps.mirror(im) for im in imgs], imgsz)) / 2
    p = p[:, order]
    c2i = {c: i for i, c in enumerate(classes)}
    y = np.array([c2i[c] for _, c in items])
    m = common.compute_metrics(y, p, classes)

    # latency: single image, after warm-up
    for _ in range(5):
        model.predict(imgs[0], imgsz=imgsz, verbose=False)
    t = time.perf_counter()
    for k in range(30):
        model.predict(imgs[k % len(imgs)], imgsz=imgsz, verbose=False)
    latency = (time.perf_counter() - t) / 30 * 1000

    m.update(model="yolo", task=task, split=split_name, tta=tta,
             total_params=int(sum(q.numel() for q in model.model.parameters())),
             model_size_mb=round(Path(weights).stat().st_size / 1e6, 1),
             latency_ms_per_image=round(latency, 2),
             device=torch.cuda.get_device_name(0) if torch.cuda.is_available() else "cpu")
    info = Path(weights).parent / "train_info.json"
    if info.exists():
        import json
        ti = json.loads(info.read_text())
        m.update(train_minutes=ti.get("train_minutes"), best_epoch=ti.get("best_epoch"), base_model=ti.get("model"))

    out = Path(weights).parent
    common.save_json(m, out / f"metrics_{split_name}.json")
    title = f"YOLO - {common.TASK_TITLES[task]} ({split_name}, {m['n_images']} images)"
    report = common.format_report(m, title)
    (out / f"report_{split_name}.txt").write_text(report)
    common.plot_confusion(m["confusion_matrix"], classes, out / f"confusion_{split_name}.png",
                          f"YOLO - {common.TASK_TITLES[task]} (accuracy {m['accuracy']*100:.2f}%)")
    with open(out / f"predictions_{split_name}.csv", "w", newline="") as f:
        w = csv.writer(f); w.writerow(["image", "true", "predicted", "confidence", "correct"])
        for (rel, cls), pr in zip(items, p):
            k = int(pr.argmax()); w.writerow([rel, cls, classes[k], f"{pr[k]:.4f}", int(classes[k] == cls)])
    print("\n" + report)
    print(f"\nparams {m['total_params']/1e6:.2f} M | size {m['model_size_mb']} MB | "
          f"latency {m['latency_ms_per_image']} ms/image on {m['device']}")
    print(f"saved metrics, report, confusion matrix and predictions to {out}")
    return m


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--task", choices=["body", "wound", "all"], default="all")
    ap.add_argument("--split", choices=["train", "val", "test"], default="test")
    ap.add_argument("--no-tta", action="store_true")
    a = ap.parse_args()
    for t in (["body", "wound"] if a.task == "all" else [a.task]):
        w = HERE / "runs" / t / "best.pt"
        if not w.exists():
            print(f"[skip] {w} not found - train first: python train.py --task {t}")
            continue
        evaluate_weights(w, t, a.split, not a.no_tta)


if __name__ == "__main__":
    main()
