# SmartHeal – CNN training kit (VGG19 · ResNet50 · YOLO)

Two classifiers are trained with each architecture:

| task  | classes |
|-------|---------|
| `body`  | Belly, Ear, Elbow, Eye, Foot, Hand, Knee, Neck, Nose, Shoulders |
| `wound` | Abrasions, Bruises, Burns, Cut, Diabetic Wounds, Laseration, **No_Wound**, Pressure Wounds, Surgical Wounds, Venous Wounds |

## 1. Folder layout
Unzip so the three folders sit next to `data/`:
```
SH-Final/
├── data/              (your images: Body_Parts/, Wound_Type/)
├── vgg19/
├── resnet50/
├── yolo/
├── compare_models.py
└── README.md
```
Created automatically on first run: `splits/` (the shared train/val/test split), `cache/` (resized images).

## 2. Install (once, in the VS Code terminal)
```
pip install torchvision --index-url https://download.pytorch.org/whl/cu128
pip install -r vgg19\requirements.txt
pip install -r yolo\requirements.txt
```

## 3. Train + evaluate
Each command trains the body-part model, then the wound model, and evaluates both on the held-out test set.
```
cd vgg19
python train.py --task all
cd ..\resnet50
python train.py --task all
cd ..\yolo
python train.py --task all
cd ..
python compare_models.py
```
(or double-click `run_all.bat` inside each folder.)
Rough times on an RTX 3050 6 GB: ResNet50 ~10–20 min, VGG19 ~25–40 min, YOLOv8s-cls ~15–25 min (both tasks).

## 4. What you get (per model, per task: `<model>/runs/<task>/`)
| file | content |
|------|---------|
| `best.pt` | best weights (selected on validation macro-F1) |
| `history.csv` / `results.csv` | epoch-wise train/val loss and accuracy (for the paper's training table) |
| `curves.png` | loss and accuracy curves |
| `metrics_test.json` | accuracy, precision, recall, F1 (macro + weighted), top-2, log-loss, per-class scores, confusion matrix, params, size, latency |
| `report_test.txt` | readable report |
| `confusion_test.png` | confusion matrix |
| `predictions_test.csv` | per-image predictions (to inspect mistakes) |

`compare_models.py` writes `model_comparison.csv/.md/.png` and names the best model for each task.

## 5. Single-image prediction (used later by the Cloud Run service)
```
python predict.py some_image.jpg
```
returns body part, wound type (or `No_Wound`), confidences and top-3.

## 6. Design choices (for the paper)
* **Same split for every model**: 70 % train / 15 % validation / 15 % test, stratified per class, seed 42, saved in `splits/<task>_split.json`. Delete that file to re-split.
* **Duplicate-aware**: near-identical images (dHash Hamming distance ≤ 4) are kept in the same split, so the test set contains no copies of training images. Counts are recorded in the split file.
* **VGG19 / ResNet50**: ImageNet weights (VGG19-BN, ResNet50 V2); 2 epochs training only the new head, then full fine-tuning with a lower backbone learning rate; AdamW, 1-epoch warm-up + cosine decay; label smoothing 0.1; class-weighted loss (wound classes are imbalanced); augmentation = random resized crop, flip, ±15° rotation, mild colour jitter, random erasing; EMA weights (ResNet50 only — VGG19's 143 M parameters leave no room for an EMA copy in 6 GB); early stopping on validation macro-F1; mixed precision (FP16), channels-last, cuDNN benchmark.
* **YOLO**: Ultralytics `yolov8s-cls` (ImageNet-pretrained), AdamW, cosine LR, RandAugment, random erasing, dropout 0.2, 60 epochs with patience 15. Try `--model yolo11s-cls.pt` or `yolov8m-cls.pt` for comparison.
* **Evaluation**: held-out test split, horizontal-flip test-time augmentation, identical metric code for all three models.

## 7. Troubleshooting
* `CUDA out of memory` → `python train.py --task all --batch-size 12` (YOLO: `--batch 32`).
* DataLoader / worker errors on Windows → add `--workers 0`.
* Changed the images in `data/`? Delete `splits/` and `cache/`, then retrain all models so they share the new split.
