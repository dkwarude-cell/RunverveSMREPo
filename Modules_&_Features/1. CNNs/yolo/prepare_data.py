"""
prepare_data.py - build the Ultralytics folder layout from the SHARED split file, so YOLO is trained
and tested on exactly the same images as VGG19 and ResNet50.

    yolo/yolo_data/<task>/train/<class>/*.jpg
    yolo/yolo_data/<task>/val/<class>/*.jpg
    yolo/yolo_data/<task>/test/<class>/*.jpg

Called automatically by train.py; can also be run alone:  python prepare_data.py
"""
import os
import shutil
from pathlib import Path

import common

HERE = Path(__file__).resolve().parent
YOLO_DATA = HERE / "yolo_data"


def prepare(task: str, force: bool = False) -> Path:
    split = common.make_split(task)
    common.build_cache(task, split)
    root = YOLO_DATA / task
    marker = root / ".split_created"
    if root.exists() and marker.exists() and marker.read_text() == split["created"] and not force:
        return root
    if root.exists():
        shutil.rmtree(root)
    for s in ("train", "val", "test"):
        for rel, cls in split["splits"][s]:
            src = common.cache_path(task, rel)
            dst = root / s / cls / Path(rel).with_suffix(".jpg").name
            dst.parent.mkdir(parents=True, exist_ok=True)
            try:
                os.link(src, dst)            # hard link: no extra disk space
            except OSError:
                shutil.copy2(src, dst)
    marker.write_text(split["created"])
    print(f"[yolo] prepared {root}  {split['counts']}")
    return root


if __name__ == "__main__":
    for t in ("body", "wound"):
        prepare(t, force=True)
