from pydantic import BaseModel, EmailStr
from typing import Optional

# Auth
class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Profile
class ProfileCreate(BaseModel):
    user_email: EmailStr
    full_name: str
    age: int
    gender: str
    blood_group: str
    height: Optional[float] = None
    weight: Optional[float] = None
    medical_history: Optional[str] = ""
    allergies: Optional[str] = ""
    emergency_name: str
    emergency_phone: str
    relationship: str
    mission_name: str
    launch_date: str
    mission_duration: int

# 01. Radiation
class RadiationCreate(BaseModel):
    user_email: str
    day: str
    source: str
    dose_msv: float

# 02. Isolation & Mental Wellness
class WellnessCreate(BaseModel):
    user_email: str
    sol: str
    mood: int
    stress: int
    sleep_hours: float
    fatigue: str
    teamwork: str

# 03. Distance & Autonomous Triage
class TriageCreate(BaseModel):
    record_code: str
    user_email: str
    symptom: str
    severity: int
    notes: Optional[str] = ""
    recommendation: str
    is_synced: bool = True

# 04. Gravity & Microgravity
class GravityCreate(BaseModel):
    user_email: str
    sol: str
    exercise_mins: int
    strength_score: int
    bmd_retention: float
    resting_hr: int
    blood_pressure: str
    eye_assessment: str
    balance_drill: str

# 05. Hostile Environments
class EnvironmentCreate(BaseModel):
    user_email: str
    sol: str
    o2_percent: float
    co2_mmhg: float
    temp_celsius: float
    humidity_percent: int
    immune_status: str
    water_liters: Optional[float] = 0.0
    calories_kcal: Optional[int] = 0