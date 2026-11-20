"""
train.py - train a YOLO classification model (Ultralytics) on the shared split.

Usage (from this folder):
    python train.py --task body
    python train.py --task wound
    python train.py --task all                    # both
    python train.py --task all --model yolo11s-cls.pt   # try the newer YOLO11 family

Outputs go to runs/<task>/ : best.pt, results.csv, curves.png, test metrics, confusion matrix, ...
After training, the held-out TEST split is evaluated automatically (with flip test-time augmentation).
"""
import argparse
import shutil
import time
from pathlib import Path

import common
from prepare_data import prepare

HERE = Path(__file__).resolve().parent

HYP = dict(
    imgsz=224,
    epochs=60,
    patience=15,
    batch=64,
    optimizer="AdamW",
    lr0=0.0005,
    lrf=0.01,
    cos_lr=True,
    warmup_epochs=2,
    weight_decay=0.0005,
    dropout=0.2,
    auto_augment="randaugment",
    erasing=0.3,
    hsv_h=0.01,           # keep hue shifts small: colour matters for wound type
    hsv_s=0.4,
    hsv_v=0.3,
    fliplr=0.5,
    cache="ram",
    workers=4,
    amp=True,
    seed=42,
    deterministic=False,
    plots=True,
)


def history_from_results(csv_path):
    import csv
    rows = []
    with open(csv_path, newline="") as f:
        for r in csv.DictReader(f):
            r = {k.strip(): v.strip() for k, v in r.items()}
            rows.append(dict(epoch=int(float(r["epoch"])),
                             train_loss=float(r["train/loss"]),
                             train_acc=None,
                             val_loss=float(r["val/loss"]),
                             val_acc=float(r["metrics/accuracy_top1"])))
    return rows


def train_task(task, args):
    from ultralytics import YOLO
    data_root = prepare(task)
    split = common.make_split(task)
    print(f"\n{'='*70}\n YOLO ({args.model}) | task={task}\n{'='*70}")
    print(common.split_summary(split))

    hyp = dict(HYP)
    if args.epochs: hyp["epochs"] = args.epochs
    if args.batch: hyp["batch"] = args.batch
    if args.workers is not None: hyp["workers"] = args.workers

    out_dir = HERE / "runs" / task
    t0 = time.time()
    model = YOLO(args.model)
    model.train(data=str(data_root), project=str(HERE / "runs"), name=task, exist_ok=True,
                device=0 if args.device == "auto" else args.device, **hyp)
    minutes = (time.time() - t0) / 60

    best = out_dir / "weights" / "best.pt"
    shutil.copy2(best, out_dir / "best.pt")
    hist = history_from_results(out_dir / "results.csv")
    common.plot_history(hist, out_dir / "curves.png", f"YOLO ({Path(args.model).stem}) - {common.TASK_TITLES[task]}")
    common.save_json({"model": args.model, "train_minutes": round(minutes, 2), "hyperparameters": hyp,
                      "best_epoch": max(hist, key=lambda h: h["val_acc"])["epoch"]}, out_dir / "train_info.json")
    print(f"training time {minutes:.1f} min -> {out_dir/'best.pt'}")

    from evaluate import evaluate_weights
    evaluate_weights(out_dir / "best.pt", task, "test", tta=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--task", choices=["body", "wound", "all"], default="all")
    ap.add_argument("--model", default="yolov8s-cls.pt",
                    help="yolov8n-cls.pt / yolov8s-cls.pt / yolov8m-cls.pt / yolo11s-cls.pt ...")
    ap.add_argument("--epochs", type=int, default=None)
    ap.add_argument("--batch", type=int, default=None)
    ap.add_argument("--workers", type=int, default=None)
    ap.add_argument("--device", default="auto", help="'auto' (GPU 0), 'cpu', or a GPU index")
    args = ap.parse_args()
    for t in (["body", "wound"] if args.task == "all" else [args.task]):
        train_task(t, args)


if __name__ == "__main__":       # required on Windows
    main()
