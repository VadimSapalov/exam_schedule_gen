import React, { useState } from 'react';
import axios from 'axios';

export default function ImportExcel({ sessionId, onImportSuccess }) { 
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  //const sessionId = 1; // MVP сесія за замовчуванням

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert("Будь ласка, виберіть файл!");
    
    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await axios.post(`http://localhost:8000/api/v1/import/bulk/${sessionId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const { imported_data, errors } = res.data;
      
      //Повідомлення для користувача про успіх імпорту
      let successMessage = `Дані успішно імпортовано!\n`;
      if (imported_data.groups_imported) successMessage += `• Груп: ${imported_data.groups_imported}\n`;
      if (imported_data.teachers_imported) successMessage += `• Викладачів: ${imported_data.teachers_imported}\n`;
      if (imported_data.subjects_imported) successMessage += `• Дисципліна: ${imported_data.subjects_imported}\n`;
      if (imported_data.rooms_imported) successMessage += `• Аудиторій: ${imported_data.rooms_imported}\n`;
      if (imported_data.exams_loaded) successMessage += `• Іспитів у плані: ${imported_data.exams_loaded}\n`;

      if (errors && errors.length > 0) {
        alert(`${successMessage}\nУвага! Знайдено помилок у рядках (${errors.length}):\n${errors.slice(0, 3).join('\n')}...`);
      } else {
        alert(successMessage);
      }
      
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      alert("Помилка імпорту: " + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className="flex flex-col gap-1 flex-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">імпорт (.XLSX)</span>
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleFileChange}
          className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer w-full"
        />
      </div>
      <button
        onClick={handleUpload}
        disabled={uploading || !file}
        className={`mt-5 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg text-sm shadow-sm hover:bg-indigo-700 transition-colors ${uploading && 'opacity-50 cursor-not-allowed'}`}
      >
        {uploading ? 'Обробка...' : 'Завантажити файл'}
      </button>
    </div>
  );
}