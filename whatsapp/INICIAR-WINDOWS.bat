@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (echo Instale o Node.js em https://nodejs.org e abra este arquivo de novo. & pause & exit /b)
if not exist node_modules (echo Instalando, aguarde... & call npm install)
:menu
echo.
echo ===== DISPARO WHATSAPP - HIVE =====
echo 1 - Ver previa das mensagens (nao envia nada)
echo 2 - Enviar teste para o MEU numero
echo 3 - Disparar para todos os contatos
echo 4 - Sair
set /p op=Escolha: 
if "%op%"=="1" call npm run previa & goto menu
if "%op%"=="2" call npm run teste & goto menu
if "%op%"=="3" call npm start & goto menu
exit /b
