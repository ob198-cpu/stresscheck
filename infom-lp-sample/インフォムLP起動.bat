@echo off
chcp 65001 >nul
cd /d "%~dp0"
title InfoM LP ローカル確認
echo InfoM LPをローカルで起動します。
echo.
echo 開くURL:
echo http://127.0.0.1:8890
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js が見つかりません。
  echo このLPを起動するには Node.js が必要です。
  echo.
  pause
  exit /b 1
)
echo 起動後、自動でブラウザを開きます。
echo 終了するときは、この画面を閉じてください。
echo.
powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 1; Start-Process 'http://127.0.0.1:8890'"
node serve.js
echo.
echo サーバーが停止しました。
pause
