@echo off
chcp 65001 > nul
echo ==========================================
echo   Встановлення залежностей Exam Scheduler
echo ==========================================

echo [1/2] Налаштування Бекенду (Python)...
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
cd ..

echo [2/2] Налаштування Фронтенду (React)...
cd frontend
npm install
cd ..

echo.
echo ==========================================
echo         Встановлення завершено
echo ==========================================
pause