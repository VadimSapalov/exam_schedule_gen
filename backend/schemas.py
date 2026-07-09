from pydantic import BaseModel, computed_field
from datetime import date
from typing import Optional

# --- ПРОМІЖНІ СХЕМИ ДЛЯ АВТОМАПІНГУ ЗВ'ЯЗКІВ ---

class ORMBase(BaseModel):
    class Config:
        from_attributes = True

class SlotNested(ORMBase):
    week_number: int
    exam_date: date
    slot: str

class GroupNested(ORMBase):
    code: str

class SubjectNested(ORMBase):
    name: str

class TeacherNested(ORMBase):
    full_name: str

class ExamNested(ORMBase):
    group: GroupNested
    subject: SubjectNested
    teacher: TeacherNested

class RoomNested(ORMBase):
    name: str
    is_computer_lab: bool


# --- ФІНАЛЬНА СХЕМА ЧЕРНЕТКИ РОЗКЛАДУ ---

class ScheduleDraftResponse(ORMBase):
    id: int
    session_id: int
    status: str
    conflict_flag: bool
    is_manual_edit: bool
    
    #Оголошуємо зв'язки як об'єкти
    slot: Optional[SlotNested] = None
    exam: Optional[ExamNested] = None
    room: Optional[RoomNested] = None

    #Обчислювальні плоскі поля для React-фронтенду
    @computed_field
    @property
    def week_number(self) -> int:
        return self.slot.week_number if self.slot else 0

    @computed_field
    @property
    def slot_date(self) -> str:
        return self.slot.exam_date.strftime("%Y-%m-%d") if self.slot else ""

    @computed_field
    @property
    def slot_letter(self) -> str:
        return self.slot.slot if self.slot else ""

    @computed_field
    @property
    def group_name(self) -> str:
        return self.exam.group.code if self.exam else ""

    @computed_field
    @property
    def subject_name(self) -> str:
        return self.exam.subject.name if self.exam else ""

    @computed_field
    @property
    def teacher_name(self) -> str:
        return self.exam.teacher.full_name if self.exam else ""

    @computed_field
    @property
    def room_number(self) -> str:
        return self.room.name if self.room else ""

    @computed_field
    @property
    def room_is_lab(self) -> bool:
        return self.room.is_computer_lab if self.room else False