"""Training configuration for ResNet50 (ImageNet-pretrained, torchvision IMAGENET1K_V2 weights)."""
CFG = dict(
    arch="resnet50",
    img_size=224,
    batch_size=32,          # safe for 6 GB VRAM with mixed precision (try 48 if memory allows)
    epochs=30,
    freeze_epochs=2,        # train only the new classifier first, then fine-tune everything
    warmup_epochs=1,
    lr_backbone=2e-4,       # pretrained residual layers
    lr_head=2e-3,           # new fully connected layer
    weight_decay=0.02,
    label_smoothing=0.1,
    dropout=0.3,
    ema=True,               # exponential moving average of weights (often +0.5-1% accuracy)
    ema_decay=0.995,
    patience=8,             # early stopping on validation macro-F1
    num_workers=4,
    seed=42,
)
