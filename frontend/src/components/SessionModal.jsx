import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function SessionModal({ isOpen, onClose, sessionToEdit, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    start_date: '2026-06-01',
    end_date: '2026-06-21',
    optimization_mode: 'teacher_density'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sessionToEdit) {
      setFormData({
        name: sessionToEdit.name || '',
        start_date: sessionToEdit.start_date || '2026-06-01',
        end_date: sessionToEdit.end_date || '2026-06-21',
        optimization_mode: sessionToEdit.optimization_mode || 'teacher_density'
      });
    } else {
      setFormData({
        name: '',
        start_date: '2026-06-01',
        end_date: '2026-06-21',
        optimization_mode: 'teacher_density'
      });
    }
    setError('');
  }, [sessionToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (sessionToEdit) {
        await axios.put(`http://localhost:8000/api/v1/sessions/${sessionToEdit.id}`, formData);
      } else {
        await axios.post('http://localhost:8000/api/v1/sessions/', formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Помилка при збереженні сесії');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-4">
          {sessionToEdit ? 'Редагувати сесію' : 'Створити нову сесію'}
        </h2>

        {error && (
          <div className="p-3 mb-4 bg-rose-50 text-rose-600 rounded-lg text-xs font-semibold border border-rose-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Назва сесії</label>
            <input
              type="text"
              required
              placeholder="наприклад: Літня сесія 2026"
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Початок</label>
              <input
                type="date"
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Завершення</label>
              <input
                type="date"
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Критерій оптимізації</label>
            <select
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              value={formData.optimization_mode}
              onChange={(e) => setFormData({ ...formData, optimization_mode: e.target.value })}
            >
              <option value="teacher_density">Щільність графіку викладачів</option>
              <option value="room_density">Ущільнення аудиторій</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 mt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Збереження...' : 'Зберегти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}