"""
compare_models.py - collect the TEST results of vgg19/, resnet50/ and yolo/ into one table + chart.

Run from SH-Final/ after training:   python compare_models.py
Writes model_comparison.csv, model_comparison.md and model_comparison.png, and names the best model per task.
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MODELS = {"vgg19": "VGG19", "resnet50": "ResNet50", "yolo": "YOLO"}
TASKS = {"body": "Body part", "wound": "Wound type"}

rows = []
for folder, name in MODELS.items():
    for task, tname in TASKS.items():
        f = ROOT / folder / "runs" / task / "metrics_test.json"
        if not f.exists():
            continue
        m = json.loads(f.read_text())
        rows.append({
            "task": tname, "model": name + (f" ({m['base_model']})" if m.get("base_model") else ""),
            "test_images": m["n_images"],
            "accuracy_%": round(m["accuracy"] * 100, 2),
            "precision_macro_%": round(m["precision_macro"] * 100, 2),
            "recall_macro_%": round(m["recall_macro"] * 100, 2),
            "f1_macro_%": round(m["f1_macro"] * 100, 2),
            "f1_weighted_%": round(m["f1_weighted"] * 100, 2),
            "top2_%": round(m["top2_accuracy"] * 100, 2),
            "log_loss": round(m["log_loss"], 4),
            "params_M": round(m["total_params"] / 1e6, 2),
            "size_MB": m.get("model_size_mb"),
            "latency_ms": m.get("latency_ms_per_image"),
            "train_min": m.get("train_minutes"),
        })

if not rows:
    raise SystemExit("No results found. Train the models first (python train.py --task all in each folder).")

with open(ROOT / "model_comparison.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)

hdr = list(rows[0].keys())
md = ["| " + " | ".join(hdr) + " |", "|" + "---|" * len(hdr)]
md += ["| " + " | ".join(str(r[h]) for h in hdr) + " |" for r in rows]
best_lines = []
for tname in TASKS.values():
    tr = [r for r in rows if r["task"] == tname]
    if tr:
        b = max(tr, key=lambda r: (r["f1_macro_%"], r["accuracy_%"]))
        best_lines.append(f"Best for {tname}: {b['model']} (accuracy {b['accuracy_%']}%, macro-F1 {b['f1_macro_%']}%)")
(ROOT / "model_comparison.md").write_text("\n".join(md + [""] + best_lines) + "\n")
print("\n".join(md)); print(); print("\n".join(best_lines))

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import numpy as np
    fig, axes = plt.subplots(1, 2, figsize=(10, 3.8), sharey=True)
    colors = {"VGG19": "#2a78d6", "ResNet50": "#1baf7a", "YOLO": "#eb6834"}
    for ax, tname in zip(axes, TASKS.values()):
        tr = [r for r in rows if r["task"] == tname]
        metrics = ["accuracy_%", "precision_macro_%", "recall_macro_%", "f1_macro_%"]
        x = np.arange(len(metrics)); wdt = 0.8 / max(len(tr), 1)
        for i, r in enumerate(tr):
            key = r["model"].split(" ")[0]
            bars = ax.bar(x + (i - (len(tr) - 1) / 2) * wdt, [r[m] for m in metrics], wdt * 0.95,
                          label=r["model"], color=colors.get(key, "#888888"))
            for b in bars:
                ax.text(b.get_x() + b.get_width() / 2, b.get_height() + 0.5, f"{b.get_height():.1f}",
                        ha="center", fontsize=6.5)
        ax.set_xticks(x); ax.set_xticklabels(["Accuracy", "Precision", "Recall", "F1"])
        ax.set_title(f"{tname} (test set)"); ax.set_ylim(0, 105); ax.grid(axis="y", alpha=0.3)
        ax.axhline(85, color="#999999", lw=0.8, ls="--")
    axes[0].set_ylabel("%"); axes[0].legend(fontsize=8, loc="lower left")
    fig.tight_layout(); fig.savefig(ROOT / "model_comparison.png", dpi=200)
    print("\nsaved model_comparison.csv / .md / .png")
except ImportError:
    pass
