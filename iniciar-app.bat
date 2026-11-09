@echo off
title Finanças Pro - Servidor Local
chcp 65001 >nul
cls

cd /d "%~dp0"

echo ========================================================
echo         FINANÇAS PRO - CONTROLE E INVESTIMENTOS
echo ========================================================
echo.
echo Iniciando servidor Node.js...
echo.

node server.cjs

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Tentando iniciar com Python...
  python -m http.server 8085
)

pause
