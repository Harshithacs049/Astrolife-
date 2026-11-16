# AstroLife (Outlr) — Astronaut Health & Mission Routine Monitoring System

![NASA Space Apps Challenge](https://img.shields.io/badge/NASA%20Space%20Apps-Challenge%202026-0B3D91?style=for-the-badge&logo=nasa)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![HTML5/CSS3/JS](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20JS-0ea5e9?style=for-the-badge)

**AstroLife (Outlr)** is an integrated astronaut health telemetry, daily mission routine compliance, and deep-space hazard reference platform developed by **Team Cretors** for the **NASA Space Apps Challenge**.

Designed with a mission-control dark-mode interface, AstroLife helps crew members and flight surgeons monitor physiological health metrics, review previous-day recovery summaries, execute 24-hour UTC mission schedules, and mitigate NASA Human Research Program (HRP) spaceflight hazards.

---

## Key Features

- **Role-Based Mission Access:** Seamless authentication and workspace routing via `sessionStorage` supporting **Astronaut**, **Mission Control**, and **Admin** roles.
- **Astronaut Onboarding & Biometric Profiles:** Captures baseline crew biometrics, mission duration parameters, and individualized health thresholds.
- **Vitals & Telemetry Dashboard:** Interactive multi-day health variation trend graphs tracking heart rate, oxygen saturation, radiation exposure (mSv), sleep recovery, and hydration compliance.
- **Daily Mission Routine (UTC) & Yesterday's Health Summary:**
  - **Previous-Day Health Briefing:** Displays yesterday's compliance score, average heart rate, cumulative radiation dose, sleep hours, and AI Flight Surgeon insights before starting the day's schedule.
  - **Interactive 24-Hour UTC Checklist:** Time-staggered daily tasks (from 06:00 UTC wakeup vitals to 21:00 UTC sleep harness setup) with real-time progress bar synchronization (`localStorage`) across `dashboard.html` and `routine.html`.
- **Space Hazards & Modules Reference Handbook:** Structured knowledge base grounded in NASA's Human Research Program (HRP) five core spaceflight hazards:
  1. Space Radiation
  2. Isolation and Confinement
  3. Distance from Earth
  4. Gravity Fields (Microgravity)
  5. Hostile/Closed Environments
- **Alerts & AI Flight Surgeon Insights:** Automated anomaly detection and actionable countermeasure recommendations based on daily crew telemetry.

---

## Tech Stack

- **Frontend:** Semantic HTML5, CSS3 (Glassmorphism & Mission-Control Dark UI), Vanilla JavaScript (ES6+), `localStorage` & `sessionStorage` state management
- **Backend:** Python, FastAPI, Uvicorn (RESTful API endpoints for telemetry, user roles, and routine logs)
- **Data & Domain Reference:** NASA Human Research Program (HRP) biomedical guidelines

---

## Project Structure

```text
astrolife-outlr/
├── backend/
│   ├── main.py                 # FastAPI application entry point & API routes
│   ├── models.py               # Pydantic schemas for vitals, profiles, and routines
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── index.html              # Landing & role-based login portal
│   ├── onboarding.html         # Astronaut baseline profile setup
│   ├── dashboard.html          # Main telemetry, vitals & mission overview
│   ├── routine.html            # Standalone Daily Mission Routine (UTC) & Yesterday's Summary
│   ├── hazards.html            # NASA HRP Space Hazards & Modules handbook
│   ├── css/
│   │   └── styles.css          # Space-grade dark theme & responsive layout styles
│   └── js/
│       └── app.js              # Telemetry charts, auth state & routine sync logic
└── README.md                   # Project documentation
```

---

## Getting Started

### Prerequisites

- **Python 3.10+**
- Modern web browser (Chrome, Edge, Firefox, or Brave)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/astrolife-outlr.git
cd astrolife-outlr
```

### 2. Set Up & Run the FastAPI Backend

```bash
cd backend
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate
# Activate virtual environment (macOS/Linux)
# source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Once running, interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### 3. Launch the Frontend

Open `frontend/index.html` directly in your browser or serve the `frontend/` folder using VS Code **Live Server** (recommended for smooth multi-page navigation between `dashboard.html` and `routine.html`):

```bash
cd frontend
python -m http.server 5500
```

Visit `http://127.0.0.1:5500` in your browser.

---

## Usage Workflow

1. **Authenticate:** Select a mission role (**Astronaut**, **Mission Control**, or **Admin**) on the login screen.
2. **Complete Onboarding:** Enter crew profile details and baseline vitals.
3. **Monitor Vitals:** Review real-time telemetry trends and AI Flight Surgeon alerts on `dashboard.html`.
4. **Execute Daily Routine:** Click the **Daily Mission Routine (UTC)** card on the dashboard to navigate to `routine.html`, inspect **Yesterday's Health Summary**, and check off today's UTC tasks. Compliance scores sync automatically back to the main dashboard.
5. **Consult Hazard Modules:** Navigate to **Space Hazards & Modules** for countermeasure protocols during anomalies.

---

## Team

- **Team Cretors** — Built for the NASA Space Apps Challenge

---

## License

This project is open-source and available under the [MIT License](LICENSE).
