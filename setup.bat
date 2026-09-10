@echo off
chcp 65001 > nul
echo ==========================================
echo   Встановлення залежностей Exam Scheduler
echo ==========================================

echo [1/2] Налаштування Бекенду (Python)...
cd backend
python -m venv venv
call venv\Scripts\activate
call pip install -r requirements.txt
cd ..

echo [2/2] Налаштування Фронтенду (React)...
cd frontend
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /f /q package-lock.json
call npm install --legacy-peer-deps
cd ..

echo.
echo ==========================================
echo         Встановлення завершено
echo ==========================================
pause