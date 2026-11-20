"""Model builders for the PyTorch classifiers (shared by vgg19/ and resnet50/)."""
import torch.nn as nn
from torchvision import models


def build_model(arch: str, num_classes: int, dropout: float = 0.5, pretrained: bool = True):
    """Return (model, head_parameters, backbone_parameters)."""
    if arch == "vgg19":
        w = models.VGG19_BN_Weights.IMAGENET1K_V1 if pretrained else None
        m = models.vgg19_bn(weights=w)
        m.classifier[2] = nn.Dropout(dropout)
        m.classifier[5] = nn.Dropout(dropout)
        m.classifier[6] = nn.Linear(4096, num_classes)
        head = list(m.classifier.parameters())
        backbone = list(m.features.parameters())
    elif arch == "resnet50":
        w = models.ResNet50_Weights.IMAGENET1K_V2 if pretrained else None
        m = models.resnet50(weights=w)
        m.fc = nn.Sequential(nn.Dropout(dropout), nn.Linear(m.fc.in_features, num_classes))
        head = list(m.fc.parameters())
        head_ids = {id(p) for p in head}
        backbone = [p for p in m.parameters() if id(p) not in head_ids]
    else:
        raise ValueError(f"unknown arch {arch}")
    return m, head, backbone


def count_parameters(model):
    total = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    return total, trainable
