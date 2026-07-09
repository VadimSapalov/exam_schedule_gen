from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Date, Boolean, JSON
from sqlalchemy.orm import relationship
from database import Base

class SessionEntity(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    optimization_mode = Column(Enum("teacher_density", "room_density"), nullable=False)

    exams = relationship("Exam", back_populates="session", cascade="all, delete-orphan")
    slots = relationship("ScheduleSlot", back_populates="session", cascade="all, delete-orphan")


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), nullable=False, unique=True)
    level = Column(Enum("bachelor", "master"), nullable=False)
    student_count = Column(Integer, nullable=False)
    day_pattern = Column(Enum("mon_wed_fri", "tue_thu"), nullable=False)

    exams = relationship("Exam", back_populates="group", cascade="all, delete-orphan")


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    position = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)

    exams = relationship("Exam", back_populates="teacher", cascade="all, delete-orphan")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    requires_computer = Column(Boolean, default=False)
    level = Column(Enum("bachelor", "master"), nullable=False)

    exams = relationship("Exam", back_populates="subject", cascade="all, delete-orphan")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)
    capacity = Column(Integer, nullable=False)
    is_computer_lab = Column(Boolean, default=False)
    building = Column(String(100), nullable=False)

    drafts = relationship("ScheduleDraft", back_populates="room", cascade="all, delete-orphan")


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)

    session = relationship("SessionEntity", back_populates="exams")
    group = relationship("Group", back_populates="exams")
    subject = relationship("Subject", back_populates="exams")
    teacher = relationship("Teacher", back_populates="exams")
    drafts = relationship("ScheduleDraft", back_populates="exam", cascade="all, delete-orphan")


class ScheduleSlot(Base):
    __tablename__ = "schedule_slots"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    exam_date = Column(Date, nullable=False)
    slot = Column(Enum("A", "B"), nullable=False)
    week_number = Column(Integer, nullable=False)

    session = relationship("SessionEntity", back_populates="slots")
    drafts = relationship("ScheduleDraft", back_populates="slot", cascade="all, delete-orphan")


class ConstraintCache(Base):
    __tablename__ = "constraint_cache"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    day_pattern_map = Column(JSON, nullable=False)
    opt_mode = Column(String(50), nullable=False)


class ScheduleDraft(Base):
    __tablename__ = "schedule_drafts"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    slot_id = Column(Integer, ForeignKey("schedule_slots.id", ondelete="CASCADE"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum("draft", "conflict", "approved"), default="draft")
    is_manual_edit = Column(Boolean, default=False)
    conflict_flag = Column(Boolean, default=False)

    exam = relationship("Exam", back_populates="drafts")
    slot = relationship("ScheduleSlot", back_populates="drafts")
    room = relationship("Room", back_populates="drafts")