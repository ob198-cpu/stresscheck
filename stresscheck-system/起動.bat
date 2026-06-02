@echo off
cd /d "%~dp0"
title ストレスチェック受検システム
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-system.ps1"
pause
