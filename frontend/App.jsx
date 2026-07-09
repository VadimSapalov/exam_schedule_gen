import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ImportExcel from './src/components/ImportExcel';
import ScheduleGrid from './src/components/ScheduleGrid';

export default function App() {
  // Стан для сесій
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(1);
  const [optimizationMode, setOptimizationMode] = useState('teacher_density');

  // Дані розкладу та статус генерації
  const [schedule, setSchedule] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // 1. Завантаження доступних сесій з бази даних
  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await axios.get('http://localhost:8000/api/v1/sessions/');
      setSessions(res.data);
      if (res.data.length > 0) {
        setSelectedSessionId(res.data[0].id);
        setOptimizationMode(res.data[0].optimization_mode || 'backtracking');
      }
    } catch (err) {
      console.error("Помилка завантаження сесій, відкат до моків", err);
      //Резервний варіант
      const mockSessions = [
        { id: 1, name: "Літня екзаменаційна сесія 2026", optimization_mode: "teacher_density" },
        { id: 2, name: "Зимова екзаменаційна сесія 2026", optimization_mode: "room_density" }
      ];
      setSessions(mockSessions);
      setSelectedSessionId(mockSessions[0].id);
      setOptimizationMode(mockSessions[0].optimization_mode);
    } finally {
      setLoadingSessions(false);
    }
  };

  // 2. Завантаження чернеток розкладу для обраної сесії
  const loadSchedule = async (sessionId) => {
    if (!sessionId) return;
    try {
      const res = await axios.get(`http://localhost:8000/api/v1/schedule/drafts/${sessionId}`);
      setSchedule(res.data);
    } catch (err) {
      console.error("Помилка завантаження чернеток розкладу", err);
      setSchedule([]); // очищуємо сітку у разі помилки або відсутності даних
    }
  };

  // 3. Зміна режиму оптимізації сесії
  const handleModeChange = async (e) => {
    const newMode = e.target.value;
    setOptimizationMode(newMode);
    try {
      // Оновлюємо режим для поточної сесії в БД
      await axios.patch(`http://localhost:8000/api/v1/sessions/${selectedSessionId}`, {
        optimization_mode: newMode
      });
    } catch (err) {
      console.log("Режим змінено локально (ендпоінт PATCH сесії необов'язковий)");
    }
  };

  // 4. Запуск генератора з урахуванням обраної сесії та режиму
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await axios.post(`http://localhost:8000/api/v1/schedule/generate/${selectedSessionId}`, {
        mode: optimizationMode // передаємо обраний режим у тілі запиту, якщо алгоритм його приймає
      });
      alert(res.data.message || "Розклад успішно згенеровано за обраним алгоритмом!");
      loadSchedule(selectedSessionId);
    } catch (err) {
      alert("Помилка алгоритму: " + (err.response?.data?.detail || err.message));
    } finally {
      setGenerating(false);
    }
  };

  // Перше завантаження конфігурацій
  useEffect(() => {
    loadSessions();
  }, []);

  // Перезавантажувати розклад щоразу, як змінюється обрана сесія
  useEffect(() => {
    loadSchedule(selectedSessionId);
  }, [selectedSessionId]);

  return (
    <div className="min-h-screen bg-slate-50 pb-12 antialiased">
      {/* Шапка */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-slate-800 tracking-tight text-lg">Exam Scheduler Core v1.2</span>
          </div>

          {/* Інтерактивний вибір сесії в шапці */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Поточна сесія:</label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(Number(e.target.value))}
              className="bg-slate-100 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2 cursor-pointer transition-all"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Головний контент */}
      <main className="max-w-7xl mx-auto px-6 mt-8 flex flex-col gap-6">
        
        {/* Конфігураційна панель дій */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Блок 1: Динамічний Імпорт */}
          <ImportExcel sessionId={selectedSessionId} onImportSuccess={() => loadSchedule(selectedSessionId)} />
          
          {/* Блок 2: Вибір режиму оптимізації */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Критерій оптимізації</span>
              <p className="text-[11px] text-slate-400">Впливає на штрафні функції розподілу матриці</p>
            </div>
            <div className="mt-2">
              <select
                value={optimizationMode}
                onChange={handleModeChange}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg p-2.5 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="teacher_density">Щільність графіку викладачів (teacher_density)</option>
                <option value="room_density">Ущільнення аудиторій (room_density)</option>
              </select>
            </div>
          </div>

          {/* Блок 3: Керування генератором */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ядро розрахунку</span>
              <p className="text-xs text-slate-500 mt-1">
                Режим: <span className="font-mono text-indigo-600 font-bold">{optimizationMode}</span>
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`mt-5 px-4 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all ${generating && 'opacity-60 cursor-not-allowed'}`}
            >
              {generating ? 'Обчислення матриці...' : '⚡ Запустити'}
            </button>
          </div>

        </div>

        {/* Таблиця розкладу */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800">Екзаменаційна сітка чернетки</h2>
            <div className="flex items-center gap-4">
              {/* Кнопка експорту */}
              <button
                onClick={() => window.location.href = `http://localhost:8000/api/v1/schedule/export/${selectedSessionId}`}
                className="px-4 py-2 text-xs font-bold text-black bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow transition-all flex items-center gap-1"
              >
                📥 Експорт в Excel
              </button>
              <span className="text-xs text-slate-400 font-medium">ID сессії: {selectedSessionId}</span>
            </div>
          </div>
          <ScheduleGrid scheduleDrafts={schedule} onRefresh={() => loadSchedule(selectedSessionId)} />
        </div>

      </main>
    </div>
  );
}