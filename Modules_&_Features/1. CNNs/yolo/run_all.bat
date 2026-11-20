@echo off
REM Train + evaluate both tasks with YOLOv8s-cls. Results in runs\body and runs\wound
python train.py --task all
pause
