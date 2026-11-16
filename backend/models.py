from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from datetime import datetime, timezone
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AstronautProfile(Base):
    __tablename__ = "astronaut_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    age = Column(Integer)
    gender = Column(String)
    blood_group = Column(String)
    height = Column(Float)
    weight = Column(Float)
    medical_history = Column(String)
    allergies = Column(String)
    emergency_name = Column(String)
    emergency_phone = Column(String)
    relationship = Column(String)
    mission_name = Column(String)
    launch_date = Column(String)
    mission_duration = Column(Integer)

class RadiationLog(Base):
    __tablename__ = "radiation_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    day = Column(String, nullable=False)
    source = Column(String, nullable=False)
    dose_msv = Column(Float, nullable=False)
    logged_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class WellnessLog(Base):
    __tablename__ = "wellness_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    sol = Column(String, nullable=False)
    mood = Column(Integer, nullable=False)
    stress = Column(Integer, nullable=False)
    sleep_hours = Column(Float, nullable=False)
    fatigue = Column(String, nullable=False)
    teamwork = Column(String, nullable=False)
    logged_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class TriageSyncRecord(Base):
    __tablename__ = "triage_sync_records"

    id = Column(Integer, primary_key=True, index=True)
    record_code = Column(String, unique=True, index=True)
    user_email = Column(String, index=True)
    symptom = Column(String, nullable=False)
    severity = Column(Integer, nullable=False)
    notes = Column(String)
    recommendation = Column(String)
    is_synced = Column(Boolean, default=True)
    logged_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class GravityHealthLog(Base):
    __tablename__ = "gravity_health_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    sol = Column(String, nullable=False)
    exercise_mins = Column(Integer, nullable=False)
    strength_score = Column(Integer, nullable=False)
    bmd_retention = Column(Float, nullable=False)
    resting_hr = Column(Integer, nullable=False)
    blood_pressure = Column(String, nullable=False)
    eye_assessment = Column(String, nullable=False)
    balance_drill = Column(String, nullable=False)
    logged_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class EnvironmentLog(Base):
    __tablename__ = "environment_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    sol = Column(String, nullable=False)
    o2_percent = Column(Float, nullable=False)
    co2_mmhg = Column(Float, nullable=False)
    temp_celsius = Column(Float, nullable=False)
    humidity_percent = Column(Integer, nullable=False)
    immune_status = Column(String, nullable=False)
    water_liters = Column(Float, default=0.0)
    calories_kcal = Column(Integer, default=0)
    logged_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))