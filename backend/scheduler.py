from datetime import date, timedelta
from typing import List, Dict, Any, Optional, cast
from sqlalchemy.orm import Session
import models

class BacktrackingScheduler:
    def __init__(self, db: Session, session_id: int):
        self.db = db
        self.session_id = session_id
        
        # 1. Завантажуємо конфігурацію сесії
        session_obj: Optional[models.SessionEntity] = db.query(models.SessionEntity).filter(
            models.SessionEntity.id == session_id
        ).first()
        
        if not session_obj:
            raise ValueError("Екзаменаційну сесію не знайдено")
            
        self.session_info: models.SessionEntity = session_obj
        
        # Завантажуємо вхідні дані
        self.exams = db.query(models.Exam).filter(models.Exam.session_id == session_id).all()
        self.rooms = db.query(models.Room).all()
        
        # Перетворюємо типи SQLAlchemy (Column) на чисті типи Python (date, str) для розрахунків
        self.start_date = cast(date, self.session_info.start_date)
        self.end_date = cast(date, self.session_info.end_date)
        self.optimization_mode: str = str(self.session_info.optimization_mode)
        
        # Генеруємо сітку робочих слотів
        self.slots = self._generate_working_slots()
        
    def _generate_working_slots(self) -> list:
        #Генерує список доступних слотів А та В, проскакуючи вихідні
        slots = []
        
        # Використовуємо чистий об'єкт date Python, копіюючи значення
        current_date: date = self.start_date
        end_date_val: date = self.end_date
        
        db_slots = self.db.query(models.ScheduleSlot).filter(models.ScheduleSlot.session_id == self.session_id).all()
        
        if not db_slots:
            week_num = 1
            days_count = 0
            # Тепер тут чисті дати, операції <= та += timedelta(days=1) повністю валідні для Pylance!
            while current_date <= end_date_val:
                if current_date.weekday() < 5:  # Пн-Пт
                    slots.append({"date": current_date, "slot": "A", "week": week_num})
                    slots.append({"date": current_date, "slot": "B", "week": week_num})
                    days_count += 1
                    if days_count % 5 == 0:
                        week_num += 1
                current_date += timedelta(days=1)
        else:
            for s in db_slots:
                slots.append({"id": s.id, "date": s.exam_date, "slot": s.slot, "week": s.week_number})
                
        return slots

    def check_hard_constraints(self, exam: models.Exam, slot: dict, room: models.Room, current_schedule: list) -> bool:
        #Перевірка жорстких обмежень (True якщо все ок, False якщо є колізія)
        group_level = str(exam.group.level)  # Приведення до str для лінтера
        
        for assigned in current_schedule:
            a_exam = assigned["exam"]
            a_slot = assigned["slot"]
            a_room = assigned["room"]
            
            # ЖОРСТКЕ ОБМЕЖЕННЯ (ЗАХИСТ ВІД DUPLICATE ENTRY):
            # Одна й та сама аудиторія не може бути зайнята двома іспитами в один день і в один слот
            if a_room.id == room.id and a_slot["date"] == slot["date"] and a_slot["slot"] == slot["slot"]:
                return False
            
            # 1. Накладання викладачів
            if a_exam.teacher_id == exam.teacher_id and a_slot["date"] == slot["date"] and a_slot["slot"] == slot["slot"]:
                return False
                
            # 2. Накладання груп (1 іспит на день для однієї групи)
            if a_exam.group_id == exam.group_id and a_slot["date"] == slot["date"]:
                return False
                
            # 3. Перерва в 1 день для бакалаврів
            if group_level == "bachelor" and a_exam.group_id == exam.group_id:
                days_between = abs((a_slot["date"] - slot["date"]).days)
                if days_between <= 1:
                    return False
                    
        if group_level == "master" and slot["week"] != 3:
            return False
        if group_level == "bachelor" and slot["week"] == 3:
            return False

        return True

    def calculate_soft_score(self, exam: models.Exam, slot: dict, room: models.Room, current_schedule: list) -> float:
        #Обчислює оцінку доцільності призначення (чим вище score, тим краще)
        score = 0.0
        mode = self.optimization_mode
        
        if bool(exam.subject.requires_computer) and bool(room.is_computer_lab):
            score += 10.0
            
        # Тепер тут звичайне порівняння рядків, Pylance абсолютно спокійний
        if mode == "teacher_density":
            for assigned in current_schedule:
                if assigned["exam"].teacher_id == exam.teacher_id and assigned["slot"]["date"] == slot["date"]:
                    score += 50.0
                    
        elif mode == "room_density":
            for assigned in current_schedule:
                if assigned["room"].id == room.id and assigned["slot"]["date"] == slot["date"]:
                    score += 50.0
                    
        return score

    def generate(self):
        #Запуск алгоритму побудови розкладу
        current_schedule = []
        sorted_exams = sorted(self.exams, key=lambda x: str(x.group.level))
        
        if self._backtrack(0, sorted_exams, current_schedule):
            return current_schedule
        return None

    def _backtrack(self, exam_idx: int, exams_list: list, current_schedule: list) -> bool:
        if exam_idx >= len(exams_list):
            return True
            
        current_exam = exams_list[exam_idx]
        candidate_moves = []
        
        for slot in self.slots:
            for room in self.rooms:
                if self.check_hard_constraints(current_exam, slot, room, current_schedule):
                    score = self.calculate_soft_score(current_exam, slot, room, current_schedule)
                    candidate_moves.append((score, slot, room))
                    
        candidate_moves.sort(key=lambda x: x[0], reverse=True)
        
        for score, slot, room in candidate_moves:
            current_schedule.append({
                "exam": current_exam,
                "slot": slot,
                "room": room
            })
            
            if self._backtrack(exam_idx + 1, exams_list, current_schedule):
                return True
                
            current_schedule.pop()
            
        return False