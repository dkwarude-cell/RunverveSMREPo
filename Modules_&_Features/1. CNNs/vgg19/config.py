"""Training configuration for VGG19 (batch-norm variant, ImageNet-pretrained)."""
CFG = dict(
    arch="vgg19",
    img_size=224,
    batch_size=20,          # VGG19 has 143 M parameters; 20 fits 6 GB VRAM with mixed precision
    epochs=30,
    freeze_epochs=2,        # train only the new classifier first, then fine-tune everything
    warmup_epochs=1,
    lr_backbone=5e-5,       # conv layers (pretrained)
    lr_head=5e-4,           # classifier layers
    weight_decay=0.02,
    label_smoothing=0.1,
    dropout=0.5,
    ema=False,              # an extra 143 M-parameter EMA copy would not fit in 6 GB
    ema_decay=0.995,
    patience=8,             # early stopping on validation macro-F1
    num_workers=4,
    seed=42,
)
