@echo off
REM Train + evaluate both tasks (body part, wound type). Results in runs\body and runs\wound
python train.py --task all
pause
