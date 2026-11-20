"""Datasets and transforms for the PyTorch classifiers."""
import torch
from PIL import Image
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms

import common

MEAN, STD = (0.485, 0.456, 0.406), (0.229, 0.224, 0.225)


def train_transform(size: int):
    # Colour changes are kept mild: colour is a real cue for wound type (bruise vs burn, etc.).
    return transforms.Compose([
        transforms.RandomResizedCrop(size, scale=(0.65, 1.0), ratio=(0.8, 1.25)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.25, contrast=0.25, saturation=0.2, hue=0.02),
        transforms.ToTensor(),
        transforms.Normalize(MEAN, STD),
        transforms.RandomErasing(p=0.25, scale=(0.02, 0.15)),
    ])


def eval_transform(size: int):
    return transforms.Compose([
        transforms.Resize((size, size)),
        transforms.ToTensor(),
        transforms.Normalize(MEAN, STD),
    ])


class ImageListDataset(Dataset):
    def __init__(self, task, items, class_to_idx, transform):
        self.paths = [common.cache_path(task, rel) for rel, _ in items]
        self.labels = [class_to_idx[c] for _, c in items]
        self.rel = [rel for rel, _ in items]
        self.transform = transform

    def __len__(self):
        return len(self.paths)

    def __getitem__(self, i):
        with Image.open(self.paths[i]) as img:
            img = img.convert("RGB")
        return self.transform(img), self.labels[i]


def make_loader(task, items, class_to_idx, transform, batch_size, shuffle, num_workers):
    ds = ImageListDataset(task, items, class_to_idx, transform)
    return DataLoader(
        ds, batch_size=batch_size, shuffle=shuffle, drop_last=shuffle and len(ds) > batch_size,
        num_workers=num_workers, pin_memory=torch.cuda.is_available(),
        persistent_workers=num_workers > 0, prefetch_factor=4 if num_workers > 0 else None,
    )
