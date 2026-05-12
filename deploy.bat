@echo off
title Deploiement GitHub Pages
cd /d "%~dp0"

echo.
echo === Deploiement Revision IFSI ===
echo.

git --version >nul 2>&1
if errorlevel 1 (
    echo ERREUR : Git n'est pas installe.
    echo Telecharge-le sur : https://git-scm.com/download/win
    pause
    exit /b 1
)
echo OK - Git detecte.

if not exist ".git" (
    git init
    git branch -M main
    echo OK - Depot git initialise.
) else (
    echo OK - Depot git existant.
)

git config user.email >nul 2>&1
if errorlevel 1 (
    echo.
    set /p GIT_EMAIL=Ton email GitHub :
    set /p GIT_NAME=Ton prenom ou pseudo :
    git config --global user.email "%GIT_EMAIL%"
    git config --global user.name "%GIT_NAME%"
    echo OK - Identite configuree.
)

git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo.
    echo Entre l'URL de ton depot GitHub.
    echo Exemple : https://github.com/Poli-21/revision.git
    echo.
    set /p REMOTE_URL=URL du depot :
    git remote add origin "%REMOTE_URL%"
    echo OK - Remote ajoute.
) else (
    echo OK - Remote deja configure.
)

echo.
echo Envoi des fichiers vers GitHub...
git add -A
git commit -m "Mise a jour"
git push -u origin main --force

if errorlevel 1 (
    echo.
    echo ERREUR - Le push a echoue.
    echo Une fenetre de connexion GitHub devrait s'ouvrir dans ton navigateur.
    echo Connecte-toi puis relance ce fichier.
) else (
    echo.
    echo === DEPLOYE AVEC SUCCES ! ===
    echo.
    echo Derniere etape sur github.com/Poli-21/revision :
    echo Settings - Pages - Branch: main - Save
    echo.
    echo Ton app sera sur : https://Poli-21.github.io/revision
)

echo.
pause
