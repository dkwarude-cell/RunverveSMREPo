"""
evaluate.py - evaluate a trained checkpoint on the held-out split.

Usage:
    python evaluate.py --task body              # test split, with flip TTA
    python evaluate.py --task wound --split val
    python evaluate.py --task all --no-tta

Writes to runs/<task>/: metrics_<split>.json, report_<split>.txt, confusion_<split>.png,
predictions_<split>.csv (per-image predictions) and prints a summary.
"""
import argparse
import csv
import time
from pathlib import Path

import numpy as np
import torch

import common
from data import eval_transform, make_loader
from model_def import build_model, count_parameters

HERE = Path(__file__).resolve().parent


def load_checkpoint(path, device):
    ckpt = torch.load(path, map_location="cpu", weights_only=False)
    model, _, _ = build_model(ckpt["arch"], len(ckpt["classes"]), ckpt["config"]["dropout"], pretrained=False)
    model.load_state_dict(ckpt["state_dict"])
    model = model.to(device, memory_format=torch.channels_last).eval()
    return model, ckpt


@torch.no_grad()
def predict_loader(model, loader, device, tta=True):
    probs = []
    for x, _ in loader:
        x = x.to(device, non_blocking=True, memory_format=torch.channels_last)
        with torch.autocast("cuda", dtype=torch.float16, enabled=device.type == "cuda"):
            logits = model(x).float()
            p = torch.softmax(logits, 1)
            if tta:
                p = (p + torch.softmax(model(torch.flip(x, dims=[3])).float(), 1)) / 2
        probs.append(p.cpu())
    return torch.cat(probs).numpy()


@torch.no_grad()
def measure_latency(model, size, device, n=50):
    x = torch.randn(1, 3, size, size, device=device).to(memory_format=torch.channels_last)
    for _ in range(10):
        with torch.autocast("cuda", dtype=torch.float16, enabled=device.type == "cuda"):
            model(x)
    if device.type == "cuda":
        torch.cuda.synchronize()
    t = time.perf_counter()
    for _ in range(n):
        with torch.autocast("cuda", dtype=torch.float16, enabled=device.type == "cuda"):
            model(x)
    if device.type == "cuda":
        torch.cuda.synchronize()
    return (time.perf_counter() - t) / n * 1000


def evaluate_checkpoint(ckpt_path, split_name="test", tta=True, workers=4):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model, ckpt = load_checkpoint(ckpt_path, device)
    task, classes, size = ckpt["task"], ckpt["classes"], ckpt["img_size"]
    split = common.make_split(task)
    if split["classes"] != classes:
        raise RuntimeError("Class list in checkpoint does not match the dataset split.")
    common.build_cache(task, split)
    items = split["splits"][split_name]
    c2i = {c: i for i, c in enumerate(classes)}
    loader = make_loader(task, items, c2i, eval_transform(size), 64, False, workers)
    probs = predict_loader(model, loader, device, tta)
    y = np.array(loader.dataset.labels)
    m = common.compute_metrics(y, probs, classes)
    m.update(model=ckpt["arch"], task=task, split=split_name, tta=tta,
             total_params=count_parameters(model)[0],
             model_size_mb=round(Path(ckpt_path).stat().st_size / 1e6, 1),
             latency_ms_per_image=round(measure_latency(model, size, device), 2),
             device=torch.cuda.get_device_name(0) if device.type == "cuda" else "cpu",
             best_epoch=ckpt.get("best_epoch"), train_minutes=ckpt.get("train_minutes"))

    out = Path(ckpt_path).parent
    common.save_json(m, out / f"metrics_{split_name}.json")
    title = f"{ckpt['arch'].upper()} - {common.TASK_TITLES[task]} ({split_name}, {m['n_images']} images)"
    report = common.format_report(m, title)
    (out / f"report_{split_name}.txt").write_text(report)
    common.plot_confusion(m["confusion_matrix"], classes, out / f"confusion_{split_name}.png",
                          f"{ckpt['arch'].upper()} - {common.TASK_TITLES[task]} "
                          f"(accuracy {m['accuracy']*100:.2f}%)")
    with open(out / f"predictions_{split_name}.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["image", "true", "predicted", "confidence", "correct"])
        for rel, t, p in zip(loader.dataset.rel, y, probs):
            k = int(p.argmax())
            w.writerow([rel, classes[t], classes[k], f"{p[k]:.4f}", int(k == t)])
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
    ap.add_argument("--workers", type=int, default=4)
    a = ap.parse_args()
    for t in (["body", "wound"] if a.task == "all" else [a.task]):
        ck = HERE / "runs" / t / "best.pt"
        if not ck.exists():
            print(f"[skip] {ck} not found - train first: python train.py --task {t}")
            continue
        evaluate_checkpoint(ck, a.split, not a.no_tta, a.workers)


if __name__ == "__main__":
    main()
