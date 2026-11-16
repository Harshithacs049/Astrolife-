from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext

import models
import schemas
from database import engine, get_db

# Create database tables automatically
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AstroLife Mission Telemetry API",
    description="Backend API for Astronaut Health Monitoring & Spaceflight Hazard Decision-Support",
    version="1.0.0"
)

# Enable CORS so local HTML/JS files can communicate with the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ==========================================================================
# 1. AUTHENTICATION ENDPOINTS
# ==========================================================================
@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserRegister, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Mission email already registered.")
    
    hashed_pw = pwd_context.hash(user.password)
    new_user = models.User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hashed_pw
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Astronaut profile registered", "user": new_user.full_name, "email": new_user.email}

@app.post("/api/auth/login")
def login_user(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    # Allow built-in demo account automatically
    if credentials.email == "astronaut@astrolife.space" and credentials.password == "Mission2026":
        return {"message": "Demo login authorized", "user": "Commander", "email": credentials.email}

    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not pwd_context.verify(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid mission email or access code.")
    
    return {"message": "Login authorized", "user": user.full_name, "email": user.email}

# ==========================================================================
# 2. ASTRONAUT PROFILE ENDPOINTS
# ==========================================================================
@app.post("/api/profile")
def save_profile(profile: schemas.ProfileCreate, db: Session = Depends(get_db)):
    existing = db.query(models.AstronautProfile).filter(
        models.AstronautProfile.user_email == profile.user_email
    ).first()

    if existing:
        for key, value in profile.model_dump().items():
            setattr(existing, key, value)
    else:
        existing = models.AstronautProfile(**profile.model_dump())
        db.add(existing)

    db.commit()
    db.refresh(existing)
    return {"message": "Astronaut profile saved", "profile": existing}

@app.get("/api/profile/{email}")
def get_profile(email: str, db: Session = Depends(get_db)):
    profile = db.query(models.AstronautProfile).filter(models.AstronautProfile.user_email == email).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

# ==========================================================================
# 3. HAZARD 01: SPACE RADIATION ENDPOINTS
# ==========================================================================
@app.get("/api/radiation/{email}")
def get_radiation_logs(email: str, db: Session = Depends(get_db)):
    return db.query(models.RadiationLog).filter(models.RadiationLog.user_email == email).all()

@app.post("/api/radiation")
def log_radiation(entry: schemas.RadiationCreate, db: Session = Depends(get_db)):
    record = models.RadiationLog(**entry.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

# ==========================================================================
# 4. HAZARD 02: ISOLATION & MENTAL WELLNESS ENDPOINTS
# ==========================================================================
@app.get("/api/wellness/{email}")
def get_wellness_logs(email: str, db: Session = Depends(get_db)):
    return db.query(models.WellnessLog).filter(models.WellnessLog.user_email == email).all()

@app.post("/api/wellness")
def log_wellness(entry: schemas.WellnessCreate, db: Session = Depends(get_db)):
    record = models.WellnessLog(**entry.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

# ==========================================================================
# 5. HAZARD 03: DISTANCE & OFFLINE SYNC ENDPOINTS
# ==========================================================================
@app.get("/api/triage/{email}")
def get_triage_records(email: str, db: Session = Depends(get_db)):
    return db.query(models.TriageSyncRecord).filter(models.TriageSyncRecord.user_email == email).all()

@app.post("/api/triage/sync")
def sync_offline_triage(records: list[schemas.TriageCreate], db: Session = Depends(get_db)):
    saved = []
    for item in records:
        existing = db.query(models.TriageSyncRecord).filter(
            models.TriageSyncRecord.record_code == item.record_code
        ).first()
        if existing:
            existing.is_synced = True
        else:
            new_rec = models.TriageSyncRecord(**item.model_dump())
            new_rec.is_synced = True
            db.add(new_rec)
            saved.append(new_rec)
    db.commit()
    return {"message": f"Synchronized {len(records)} telemetry packets with Ground Control."}

# ==========================================================================
# 6. HAZARD 04: GRAVITY & MICROGRAVITY ENDPOINTS
# ==========================================================================
@app.get("/api/gravity/{email}")
def get_gravity_logs(email: str, db: Session = Depends(get_db)):
    return db.query(models.GravityHealthLog).filter(models.GravityHealthLog.user_email == email).all()

@app.post("/api/gravity")
def log_gravity_health(entry: schemas.GravityCreate, db: Session = Depends(get_db)):
    record = models.GravityHealthLog(**entry.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

# ==========================================================================
# 7. HAZARD 05: CLOSED & HOSTILE ENVIRONMENTS ENDPOINTS
# ==========================================================================
@app.get("/api/environment/{email}")
def get_environment_logs(email: str, db: Session = Depends(get_db)):
    return db.query(models.EnvironmentLog).filter(models.EnvironmentLog.user_email == email).all()

@app.post("/api/environment")
def log_environment(entry: schemas.EnvironmentCreate, db: Session = Depends(get_db)):
    record = models.EnvironmentLog(**entry.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record