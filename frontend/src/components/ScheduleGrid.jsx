import React from 'react';
import axios from 'axios';

export default function ScheduleGrid({ scheduleDrafts, onRefresh }) {
  
  // --- ЛОГІКА DRAG & DROP ---
  
  // 1. Коли користувач починає тягнути картку
  const handleDragStart = (e, draftId) => {
    e.dataTransfer.setData("text/plain", draftId); // Записуємо ID чернетки в буфер
  };

  // 2. Дозволяємо браузеру скинути елемент у комірку (скасовуємо дефолтну поведінку)
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // 3. Коли користувач відпускає картку в новій комірці
  const handleDrop = async (e, dateStr, slotLetter, targetDraft = null) => {
    e.preventDefault();
    e.stopPropagation();
    
    const sourceDraftId = e.dataTransfer.getData("text/plain");
    if (!sourceDraftId) return;
    
    // Якщо кинули картку саму на себе - нічого
    if (targetDraft && String(targetDraft.id) === String(sourceDraftId)) return;

    try {
      const payload = {
        slot_date: dateStr,
        slot_letter: slotLetter,
        room_id: targetDraft ? targetDraft.room_id : null
      };

      await axios.patch(`http://localhost:8000/api/v1/schedule/drafts/${sourceDraftId}`, payload);
      
      if (onRefresh) onRefresh();
    } catch (err) {
      alert("Помилка переміщення: " + (err.response?.data?.detail || err.message));
    }
  };

  // --- ГРУПУВАННЯ ДАНИХ ДЛЯ СІТКИ ---
  const grouped = scheduleDrafts.reduce((acc, curr) => {
    const dateStr = curr.slot_date;
    const slotLetter = curr.slot_letter ? curr.slot_letter.toUpperCase() : 'A';
    
    if (!acc[dateStr]) {
      acc[dateStr] = { A: [], B: [], week: curr.week_number || 1 };
    }
    
    if (!acc[dateStr][slotLetter]) {
      acc[dateStr][slotLetter] = [];
    }
    
    acc[dateStr][slotLetter].push(curr);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  if (scheduleDrafts.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-slate-400 font-medium">
        Розклад порожній або ще не згенерований. Натисніть "Згенерувати розклад".
      </div>
    );
  }

  // --- ПІДФУНКЦІЯ РЕНДЕРИНГУ КАРТКИ (З ПІДТРИМКОЮ DRAG) ---
  const renderCard = (cardDraft) => {
    return (
      <div
        key={cardDraft.id}
        className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
      >
        {/* Назва дисципліни */}
        <div className="font-semibold text-sm text-slate-700">
          {cardDraft.exam?.subject?.name}
        </div>
        
        {/* Викладач */}
        <div className="text-xs text-slate-500 mt-0.5">
          {cardDraft.exam?.teacher?.full_name}
        </div>
        
        {/* Блок з тегами: Група та Аудиторія */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {/* Назва групи */}
          <span className="text-[11px] font-medium inline-block px-2 py-0.5 bg-blue-50 rounded text-blue-600 border border-blue-100">
            Група: {cardDraft.exam?.group?.code || cardDraft.group?.code || "Н/Д"}
          </span>

          {/* Аудиторія */}
          <span className="text-[11px] font-medium inline-block px-2 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200">
            Ауд. {cardDraft.room?.name}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      {[1, 2, 3].map((weekNum) => {
        const weekDates = sortedDates.filter(d => grouped[d].week === weekNum);
        if (weekDates.length === 0) return null;

        return (
          <div key={weekNum} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-900 px-6 py-3">
              <h3 className="text-white font-bold tracking-wide flex items-center gap-2">
                Тиждень {weekNum}
                {weekNum === 3 && <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded uppercase font-black">+ Магістри</span>}
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4 w-1/5">Дата</th>
                    <th className="p-4 w-2/5 border-l border-slate-200">Слот А (08:30)</th>
                    <th className="p-4 w-2/5 border-l border-slate-200">Слот B (11:50)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {weekDates.map((dateStr) => {
                    const dayData = grouped[dateStr];
                    const formattedDate = new Date(dateStr).toLocaleDateString('uk-UA', {
                      weekday: 'short', day: 'numeric', month: 'numeric'
                    });

                    const slotsA = dayData.A || dayData.a || [];
                    const slotsB = dayData.B || dayData.b || [];

                    // Отримуємо унікальні ідентифікатори слотів та кімнат для кожної комірки
                    const sampleA = slotsA[0];
                    const sampleB = slotsB[0];

                    return (
                      <tr key={dateStr} className="hover:bg-slate-50/30">
                        <td className="p-4 font-semibold text-slate-700 capitalize">{formattedDate}</td>
                        
                        {/* КОМІРКА СЛОТУ А */}
                        <td 
                          className="p-4 border-l border-slate-200 align-top transition-colors min-h-[90px]"
                        >
                          <div className="flex flex-col gap-2 min-h-[50px]">
                            {slotsA.length === 0 ? (
                              <span className="text-slate-300 italic text-xs py-2">Вільний слот</span>
                            ) : (
                              slotsA.map(renderCard)
                            )}
                          </div>
                        </td>

                        {/* КОМІРКА СЛОТУ B */}
                        <td 
                          className="p-4 border-l border-slate-200 align-top transition-colors min-h-[90px]"
                        >
                          <div className="flex flex-col gap-2 min-h-[50px]">
                            {slotsB.length === 0 ? (
                              <span className="text-slate-300 italic text-xs py-2">Вільний слот</span>
                            ) : (
                              slotsB.map(renderCard)
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}