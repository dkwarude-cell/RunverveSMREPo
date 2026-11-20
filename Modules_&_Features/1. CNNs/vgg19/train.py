"""
train.py - fine-tune an ImageNet-pretrained CNN (architecture set in config.py).

Usage (from this folder, in VS Code terminal):
    python train.py --task body      # body-part classifier (10 classes)
    python train.py --task wound     # wound-type classifier (9 wound types + No_Wound)
    python train.py --task all       # both, one after the other

Outputs go to runs/<task>/ : best.pt, history.csv, curves.png, test metrics, confusion matrix, ...
After training, the held-out TEST split is evaluated automatically (with flip test-time augmentation).
"""
import argparse
import csv
import math
import random
import time
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from torch.optim.swa_utils import AveragedModel, get_ema_multi_avg_fn

import common
from config import CFG
from data import eval_transform, make_loader, train_transform
from model_def import build_model, count_parameters

HERE = Path(__file__).resolve().parent


def seed_everything(seed):
    random.seed(seed); np.random.seed(seed); torch.manual_seed(seed); torch.cuda.manual_seed_all(seed)


def class_weights(labels, n):
    counts = np.bincount(labels, minlength=n).astype(np.float64)
    w = (counts.sum() / (n * np.maximum(counts, 1))) ** 0.5   # softened inverse frequency
    return torch.tensor(w / w.mean(), dtype=torch.float32)


@torch.no_grad()
def run_eval(model, loader, device, criterion=None):
    model.eval()
    probs, labels, loss_sum = [], [], 0.0
    for x, y in loader:
        x = x.to(device, non_blocking=True, memory_format=torch.channels_last)
        y = y.to(device, non_blocking=True)
        with torch.autocast("cuda", dtype=torch.float16, enabled=device.type == "cuda"):
            out = model(x)
            if criterion is not None:
                loss_sum += criterion(out.float(), y).item() * x.size(0)
        probs.append(torch.softmax(out.float(), 1).cpu()); labels.append(y.cpu())
    probs = torch.cat(probs).numpy(); labels = torch.cat(labels).numpy()
    acc = float((probs.argmax(1) == labels).mean())
    return probs, labels, loss_sum / max(len(labels), 1), acc


def macro_f1(labels, probs, n):
    from sklearn.metrics import f1_score
    return float(f1_score(labels, probs.argmax(1), labels=list(range(n)), average="macro", zero_division=0))


def train_task(task: str, args):
    cfg = dict(CFG)
    if args.epochs: cfg["epochs"] = args.epochs
    if args.batch_size: cfg["batch_size"] = args.batch_size
    if args.workers is not None: cfg["num_workers"] = args.workers
    seed_everything(cfg["seed"])

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    if device.type == "cuda":
        torch.backends.cudnn.benchmark = True
        torch.backends.cuda.matmul.allow_tf32 = True
        torch.backends.cudnn.allow_tf32 = True
    print(f"\n{'='*70}\n {cfg['arch'].upper()} | task={task} | device={device}"
          f"{' ('+torch.cuda.get_device_name(0)+')' if device.type=='cuda' else ''}\n{'='*70}")

    split = common.make_split(task)
    common.build_cache(task, split)
    classes = split["classes"]; n_cls = len(classes)
    c2i = {c: i for i, c in enumerate(classes)}
    print(common.split_summary(split))

    size = cfg["img_size"]
    train_loader = make_loader(task, split["splits"]["train"], c2i, train_transform(size),
                               cfg["batch_size"], True, cfg["num_workers"])
    val_loader = make_loader(task, split["splits"]["val"], c2i, eval_transform(size),
                             cfg["batch_size"] * 2, False, cfg["num_workers"])

    model, head, backbone = build_model(cfg["arch"], n_cls, cfg["dropout"])
    model = model.to(device, memory_format=torch.channels_last)
    total_params, _ = count_parameters(model)

    weights = class_weights(train_loader.dataset.labels, n_cls).to(device)
    criterion = nn.CrossEntropyLoss(weight=weights, label_smoothing=cfg["label_smoothing"])
    eval_criterion = nn.CrossEntropyLoss()

    optimizer = torch.optim.AdamW(
        [{"params": backbone, "lr": cfg["lr_backbone"]}, {"params": head, "lr": cfg["lr_head"]}],
        weight_decay=cfg["weight_decay"])
    steps_per_epoch = len(train_loader)
    total_steps = cfg["epochs"] * steps_per_epoch
    warm = cfg["warmup_epochs"] * steps_per_epoch

    def lr_lambda(step):
        if step < warm:
            return (step + 1) / warm
        prog = (step - warm) / max(1, total_steps - warm)
        return 0.01 + 0.99 * 0.5 * (1 + math.cos(math.pi * prog))
    scheduler = torch.optim.lr_scheduler.LambdaLR(optimizer, lr_lambda)
    scaler = torch.amp.GradScaler("cuda", enabled=device.type == "cuda")
    use_ema_cfg = bool(cfg.get("ema", True))
    ema = AveragedModel(model, multi_avg_fn=get_ema_multi_avg_fn(cfg["ema_decay"]), use_buffers=True) if use_ema_cfg else None

    out_dir = HERE / "runs" / task
    out_dir.mkdir(parents=True, exist_ok=True)
    history, best_score, best_epoch, bad_epochs = [], -1.0, 0, 0
    best_state, best_source = None, "model"
    t_start = time.time()

    for epoch in range(1, cfg["epochs"] + 1):
        frozen = epoch <= cfg["freeze_epochs"]
        for p in backbone:
            p.requires_grad_(not frozen)
        model.train()
        t0 = time.time(); run_loss = 0.0; correct = 0; seen = 0
        for x, y in train_loader:
            x = x.to(device, non_blocking=True, memory_format=torch.channels_last)
            y = y.to(device, non_blocking=True)
            with torch.autocast("cuda", dtype=torch.float16, enabled=device.type == "cuda"):
                out = model(x)
                loss = criterion(out, y)
            optimizer.zero_grad(set_to_none=True)
            scaler.scale(loss).backward()
            scaler.unscale_(optimizer)
            nn.utils.clip_grad_norm_(model.parameters(), 2.0)
            scaler.step(optimizer); scaler.update(); scheduler.step()
            if ema is not None:
                ema.update_parameters(model)
            run_loss += loss.item() * x.size(0)
            correct += (out.argmax(1) == y).sum().item(); seen += x.size(0)

        vp, vl, vloss, vacc = run_eval(model, val_loader, device, eval_criterion)
        f_model = macro_f1(vl, vp, n_cls)
        if ema is not None:
            ep_, el_, eloss, eacc = run_eval(ema.module, val_loader, device, eval_criterion)
            f_ema = macro_f1(el_, ep_, n_cls)
        else:
            eloss, eacc, f_ema = vloss, vacc, -1.0
        use_ema = f_ema > f_model and not frozen
        score = f_ema if use_ema else f_model
        rec = dict(epoch=epoch, train_loss=run_loss / seen, train_acc=correct / seen,
                   val_loss=eloss if use_ema else vloss, val_acc=eacc if use_ema else vacc,
                   val_f1_macro=score, val_acc_raw=vacc, val_acc_ema=eacc,
                   lr_backbone=optimizer.param_groups[0]["lr"], lr_head=optimizer.param_groups[1]["lr"],
                   frozen_backbone=frozen, seconds=round(time.time() - t0, 1))
        history.append(rec)
        flag = ""
        if score > best_score:
            best_score, best_epoch, bad_epochs = score, epoch, 0
            src = ema.module if use_ema else model
            best_state = {k: v.detach().cpu().clone() for k, v in src.state_dict().items()}
            best_source = "ema" if use_ema else "model"
            flag = "  <- best"
        else:
            bad_epochs += 1
        print(f"ep {epoch:02d}/{cfg['epochs']} | train loss {rec['train_loss']:.4f} acc {rec['train_acc']*100:5.1f}% "
              f"| val acc {vacc*100:5.1f}% (ema {eacc*100:5.1f}%) F1 {score*100:5.1f}% "
              f"| {rec['seconds']:.0f}s{' [head only]' if frozen else ''}{flag}")
        if bad_epochs >= cfg["patience"] and epoch > cfg["freeze_epochs"] + 3:
            print(f"early stopping (no improvement for {cfg['patience']} epochs)")
            break

    train_minutes = (time.time() - t_start) / 60
    with open(out_dir / "history.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(history[0].keys())); w.writeheader(); w.writerows(history)
    common.plot_history(history, out_dir / "curves.png", f"{cfg['arch'].upper()} - {common.TASK_TITLES[task]}")

    ckpt = dict(arch=cfg["arch"], task=task, classes=classes, img_size=size, state_dict=best_state,
                best_epoch=best_epoch, best_val_f1_macro=best_score, weights_source=best_source,
                config=cfg, total_params=total_params, train_minutes=round(train_minutes, 2))
    torch.save(ckpt, out_dir / "best.pt")
    print(f"\nbest epoch {best_epoch} (val macro-F1 {best_score*100:.2f}%, weights={best_source}); "
          f"training time {train_minutes:.1f} min -> saved {out_dir/'best.pt'}")

    from evaluate import evaluate_checkpoint
    evaluate_checkpoint(out_dir / "best.pt", split_name="test", tta=True, workers=cfg["num_workers"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--task", choices=["body", "wound", "all"], default="all")
    ap.add_argument("--epochs", type=int, default=None)
    ap.add_argument("--batch-size", type=int, default=None)
    ap.add_argument("--workers", type=int, default=None, help="DataLoader workers (use 0 if you get worker errors)")
    args = ap.parse_args()
    for t in (["body", "wound"] if args.task == "all" else [args.task]):
        train_task(t, args)


if __name__ == "__main__":       # required on Windows for DataLoader workers
    main()
