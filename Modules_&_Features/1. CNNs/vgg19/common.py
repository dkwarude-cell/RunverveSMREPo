"""
common.py - shared utilities used by vgg19/, resnet50/ and yolo/ (identical copy in each folder).

Responsibilities
  * Locate the dataset:            SH-Final/data/{Body_Parts, Wound_Type}/<class>/*.jpg
  * Build ONE fixed split per task (train/val/test = 70/15/15, stratified, seed 42) and save it
    to SH-Final/splits/<task>_split.json. Every model reads the same file, so all three models
    are trained and tested on exactly the same images (fair comparison for the paper).
  * Duplicate-aware splitting: near-identical images (perceptual dHash, Hamming <= 4) are kept
    together in the same split so the test set never contains a copy of a training image.
  * Resized image cache (shorter side 256 px) in SH-Final/cache/ -> much faster data loading.
  * Metrics (accuracy, precision, recall, F1, log-loss, top-2, confusion matrix) and plots.
"""
from __future__ import annotations

import json
import random
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

# ----------------------------------------------------------------------------- paths & constants
ROOT = Path(__file__).resolve().parent.parent          # SH-Final/
DATA_DIR = ROOT / "data"
SPLIT_DIR = ROOT / "splits"
CACHE_DIR = ROOT / "cache"

TASKS = {"body": "Body_Parts", "wound": "Wound_Type"}
TASK_TITLES = {"body": "Body-part classification", "wound": "Wound-type classification"}
IMG_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

SEED = 42
RATIOS = (0.70, 0.15, 0.15)          # train / val / test
DUP_HAMMING = 4                      # dHash distance treated as "same image"
CACHE_SIZE = 256                     # shorter side of cached images


# ----------------------------------------------------------------------------- listing & hashing
def list_images(task: str) -> list[tuple[str, str]]:
    """Return sorted [(relative_path, class_name)] for a task."""
    base = DATA_DIR / TASKS[task]
    if not base.exists():
        raise FileNotFoundError(f"Dataset folder not found: {base}")
    items = []
    for cls_dir in sorted(p for p in base.iterdir() if p.is_dir()):
        for f in sorted(cls_dir.rglob("*")):
            if f.is_file() and f.suffix.lower() in IMG_EXT:
                items.append((f.relative_to(base).as_posix(), cls_dir.name))
    return items


def _open_rgb(path: Path) -> Image.Image:
    img = Image.open(path)
    img = ImageOps.exif_transpose(img)
    return img.convert("RGB")


def dhash(path: Path, size: int = 8) -> int | None:
    """64-bit difference hash; None if the file cannot be read."""
    try:
        img = _open_rgb(path).convert("L").resize((size + 1, size), Image.Resampling.LANCZOS)
    except Exception:
        return None
    a = np.asarray(img, dtype=np.int16)
    bits = (a[:, 1:] > a[:, :-1]).flatten()
    return int("".join("1" if b else "0" for b in bits), 2)


def _group_duplicates(hashes: np.ndarray, thresh: int) -> np.ndarray:
    """Union-find over all pairs with Hamming distance <= thresh. Returns group id per item."""
    n = len(hashes)
    parent = np.arange(n)

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    h8 = hashes.astype(">u8").view(np.uint8).reshape(n, 8)
    for start in range(0, n, 256):
        block = h8[start:start + 256]
        x = np.bitwise_xor(block[:, None, :], h8[None, :, :])
        dist = np.unpackbits(x, axis=2).sum(axis=2)
        rows, cols = np.nonzero(dist <= thresh)
        for r, c in zip(rows + start, cols):
            if c > r:
                ra, rb = find(r), find(c)
                if ra != rb:
                    parent[rb] = ra
    return np.array([find(i) for i in range(n)])


# ----------------------------------------------------------------------------- split
def split_path(task: str) -> Path:
    return SPLIT_DIR / f"{task}_split.json"


def make_split(task: str, force: bool = False) -> dict:
    """Load the saved split, or create it (identical for every model)."""
    sp = split_path(task)
    items = list_images(task)
    if sp.exists() and not force:
        split = json.loads(sp.read_text())
        saved = {tuple(x) for s in ("train", "val", "test") for x in split["splits"][s]}
        current = set(items)
        if not saved - current and len(current - saved) <= len(split.get("excluded", [])):
            return split
        print(f"[split] dataset changed since {sp.name} was created -> rebuilding")

    print(f"[split] building split for '{task}' ({len(items)} images) ...")
    base = DATA_DIR / TASKS[task]
    with ThreadPoolExecutor(max_workers=8) as ex:
        hashes = list(ex.map(lambda it: dhash(base / it[0]), items))
    excluded = [items[i][0] for i, h in enumerate(hashes) if h is None]
    keep = [i for i, h in enumerate(hashes) if h is not None]
    items = [items[i] for i in keep]
    hashes = np.array([hashes[i] for i in keep], dtype=np.uint64)
    groups = _group_duplicates(hashes, DUP_HAMMING)

    classes = sorted({c for _, c in items})
    rng = random.Random(SEED)
    assign: dict[int, str] = {}                       # group id -> split name
    cross = []
    for g in np.unique(groups):
        cls_in_group = {items[i][1] for i in np.nonzero(groups == g)[0]}
        if len(cls_in_group) > 1:
            cross.append(sorted(items[i][0] for i in np.nonzero(groups == g)[0]))

    for cls in classes:
        idx = [i for i, (_, c) in enumerate(items) if c == cls]
        cls_groups = sorted({int(groups[i]) for i in idx})
        rng.shuffle(cls_groups)
        n = len(idx)
        target = {"train": RATIOS[0] * n, "val": RATIOS[1] * n, "test": RATIOS[2] * n}
        count = {"train": 0, "val": 0, "test": 0}
        for i in idx:                                  # groups already placed by another class
            if int(groups[i]) in assign:
                count[assign[int(groups[i])]] += 1
        for g in cls_groups:
            if g in assign:
                continue
            size = sum(1 for i in idx if groups[i] == g)
            # place into the split that is furthest below its target (test, val first for small classes)
            name = max(("test", "val", "train"), key=lambda s: target[s] - count[s])
            assign[g] = name
            count[name] += size

    splits = {"train": [], "val": [], "test": []}
    for i, (rel, cls) in enumerate(items):
        splits[assign[int(groups[i])]].append([rel, cls])
    n_dup_images = int(sum(np.bincount(groups)[np.bincount(groups) > 1]))

    split = {
        "task": task, "classes": classes, "seed": SEED, "ratios": RATIOS,
        "created": time.strftime("%Y-%m-%d %H:%M:%S"),
        "duplicate_hamming_threshold": DUP_HAMMING,
        "images_in_duplicate_groups": n_dup_images,
        "cross_class_duplicate_groups": cross,
        "excluded": excluded,
        "counts": {s: len(v) for s, v in splits.items()},
        "splits": splits,
    }
    SPLIT_DIR.mkdir(parents=True, exist_ok=True)
    sp.write_text(json.dumps(split, indent=1))
    print(f"[split] saved {sp} -> {split['counts']}; images in duplicate groups: {n_dup_images}; "
          f"cross-class duplicate groups: {len(cross)}; unreadable files excluded: {len(excluded)}")
    if cross:
        print("[split] WARNING: some identical images appear in more than one class folder. "
              f"See 'cross_class_duplicate_groups' in {sp.name} and consider removing them.")
    return split


def split_summary(split: dict) -> str:
    lines = [f"{'class':<18}{'train':>7}{'val':>7}{'test':>7}"]
    for c in split["classes"]:
        n = [sum(1 for _, k in split["splits"][s] if k == c) for s in ("train", "val", "test")]
        lines.append(f"{c:<18}{n[0]:>7}{n[1]:>7}{n[2]:>7}")
    lines.append(f"{'TOTAL':<18}" + "".join(f"{split['counts'][s]:>7}" for s in ("train", "val", "test")))
    return "\n".join(lines)


# ----------------------------------------------------------------------------- cache
def cache_path(task: str, rel: str) -> Path:
    return CACHE_DIR / f"{task}_{CACHE_SIZE}" / (Path(rel).with_suffix(".jpg").as_posix())


def _cache_one(args):
    task, rel = args
    dst = cache_path(task, rel)
    if dst.exists():
        return
    img = _open_rgb(DATA_DIR / TASKS[task] / rel)
    w, h = img.size
    s = CACHE_SIZE / min(w, h)
    img = img.resize((max(1, round(w * s)), max(1, round(h * s))), Image.Resampling.BICUBIC)
    dst.parent.mkdir(parents=True, exist_ok=True)
    img.save(dst, quality=95)


def build_cache(task: str, split: dict) -> None:
    todo = [(task, rel) for s in ("train", "val", "test") for rel, _ in split["splits"][s]
            if not cache_path(task, rel).exists()]
    if not todo:
        return
    print(f"[cache] resizing {len(todo)} images to shorter side {CACHE_SIZE}px (one-time) ...")
    with ThreadPoolExecutor(max_workers=8) as ex:
        list(ex.map(_cache_one, todo))


# ----------------------------------------------------------------------------- metrics
def compute_metrics(y_true, probs, classes) -> dict:
    from sklearn.metrics import (accuracy_score, confusion_matrix, log_loss,
                                 precision_recall_fscore_support, top_k_accuracy_score)
    y_true = np.asarray(y_true)
    probs = np.asarray(probs, dtype=np.float64)
    probs = probs / probs.sum(axis=1, keepdims=True)
    y_pred = probs.argmax(1)
    labels = list(range(len(classes)))
    out = {"n_images": int(len(y_true)), "accuracy": float(accuracy_score(y_true, y_pred))}
    out["error_rate"] = 1 - out["accuracy"]
    for avg in ("macro", "weighted"):
        p, r, f, _ = precision_recall_fscore_support(y_true, y_pred, labels=labels,
                                                     average=avg, zero_division=0)
        out[f"precision_{avg}"], out[f"recall_{avg}"], out[f"f1_{avg}"] = float(p), float(r), float(f)
    out["log_loss"] = float(log_loss(y_true, np.clip(probs, 1e-12, 1), labels=labels))
    out["top2_accuracy"] = float(top_k_accuracy_score(y_true, probs, k=2, labels=labels)) if len(classes) > 2 else out["accuracy"]
    p, r, f, s = precision_recall_fscore_support(y_true, y_pred, labels=labels, zero_division=0)
    out["per_class"] = {c: {"precision": float(p[i]), "recall": float(r[i]), "f1": float(f[i]),
                            "support": int(s[i])} for i, c in enumerate(classes)}
    out["confusion_matrix"] = confusion_matrix(y_true, y_pred, labels=labels).tolist()
    out["classes"] = list(classes)
    return out


def format_report(m: dict, title: str = "") -> str:
    lines = [title, "=" * max(40, len(title))] if title else []
    lines += [f"Images            : {m['n_images']}",
              f"Accuracy          : {m['accuracy']*100:.2f}%",
              f"Precision (macro) : {m['precision_macro']*100:.2f}%   (weighted {m['precision_weighted']*100:.2f}%)",
              f"Recall    (macro) : {m['recall_macro']*100:.2f}%   (weighted {m['recall_weighted']*100:.2f}%)",
              f"F1        (macro) : {m['f1_macro']*100:.2f}%   (weighted {m['f1_weighted']*100:.2f}%)",
              f"Top-2 accuracy    : {m['top2_accuracy']*100:.2f}%",
              f"Log-loss          : {m['log_loss']:.4f}",
              f"Error rate        : {m['error_rate']*100:.2f}%", "",
              f"{'class':<18}{'precision':>10}{'recall':>9}{'f1':>8}{'support':>9}"]
    for c, v in m["per_class"].items():
        lines.append(f"{c:<18}{v['precision']:>10.3f}{v['recall']:>9.3f}{v['f1']:>8.3f}{v['support']:>9}")
    return "\n".join(lines)


# ----------------------------------------------------------------------------- plots
def plot_confusion(cm, classes, path, title):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    cm = np.asarray(cm)
    norm = cm / np.maximum(cm.sum(1, keepdims=True), 1)
    k = len(classes)
    fig, ax = plt.subplots(figsize=(1.0 + 0.62 * k, 0.8 + 0.55 * k))
    ax.imshow(norm, cmap="Blues", vmin=0, vmax=1)
    for i in range(k):
        for j in range(k):
            if cm[i, j]:
                ax.text(j, i, str(cm[i, j]), ha="center", va="center", fontsize=8,
                        color="white" if norm[i, j] > 0.55 else "#222222")
    ax.set_xticks(range(k)); ax.set_yticks(range(k))
    ax.set_xticklabels(classes, rotation=50, ha="right", fontsize=8)
    ax.set_yticklabels(classes, fontsize=8)
    ax.set_xlabel("Predicted"); ax.set_ylabel("Actual"); ax.set_title(title, fontsize=10)
    fig.tight_layout(); fig.savefig(path, dpi=200); plt.close(fig)


def plot_history(history: list[dict], path, title):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    ep = [h["epoch"] for h in history]
    fig, ax = plt.subplots(1, 2, figsize=(10, 3.6))
    ax[0].plot(ep, [h["train_loss"] for h in history], label="train")
    ax[0].plot(ep, [h["val_loss"] for h in history], label="validation")
    ax[0].set_title("Loss"); ax[0].set_xlabel("epoch"); ax[0].legend()
    if "train_acc" in history[0] and history[0]["train_acc"] is not None:
        ax[1].plot(ep, [h["train_acc"] * 100 for h in history], label="train")
    ax[1].plot(ep, [h["val_acc"] * 100 for h in history], label="validation")
    ax[1].set_title("Accuracy (%)"); ax[1].set_xlabel("epoch"); ax[1].legend()
    for a in ax:
        a.grid(alpha=0.3)
    fig.suptitle(title, fontsize=11); fig.tight_layout(); fig.savefig(path, dpi=200); plt.close(fig)


def save_json(obj, path):
    Path(path).write_text(json.dumps(obj, indent=2))
