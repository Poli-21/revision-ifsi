@echo off
title Serveur Révision IFSI

:: Trouve l'adresse IP locale
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP: =%

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║         Serveur Révision IFSI actif          ║
echo  ╠══════════════════════════════════════════════╣
echo  ║                                              ║
echo  ║  Sur ta tablette / téléphone (même WiFi) :  ║
echo  ║                                              ║
echo  ║    http://%IP%:8080              ║
echo  ║                                              ║
echo  ║  Ferme cette fenêtre pour arrêter.           ║
echo  ╚══════════════════════════════════════════════╝
echo.

cd /d "%~dp0"
python -m http.server 8080
pause
