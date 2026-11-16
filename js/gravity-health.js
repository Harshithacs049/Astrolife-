// ==========================================================================
// ASTROLIFE - GRAVITY & MICROGRAVITY HEALTH ENGINE
// Phase 3: Bone Density, Muscle Strength, Cardio, Balance & SANS Tracking
// ==========================================================================

document.addEventListener("DOMContentLoaded", function () {
    const STORAGE_KEY = "astrolife_gravity_logs";

    // Default realistic ISS / Deep-Space countermeasure baseline
    const defaultLogs = [
        { sol: "Sol 01", exercise: 95, strength: 98, bmd: 99.8, hr: 62, bp: "115/75", eye: "Normal Vision / Clear Grid", balance: "Passed - Steady" },
        { sol: "Sol 02", exercise: 90, strength: 97, bmd: 99.6, hr: 64, bp: "118/76", eye: "Normal Vision / Clear Grid", balance: "Passed - Steady" },
        { sol: "Sol 03", exercise: 105, strength: 98, bmd: 99.5, hr: 61, bp: "114/72", eye: "Normal Vision / Clear Grid", balance: "Passed - Steady" },
        { sol: "Sol 04", exercise: 85, strength: 96, bmd: 99.3, hr: 65, bp: "118/78", eye: "Normal Vision / Clear Grid", balance: "Passed - Steady" },
        { sol: "Sol 05", exercise: 90, strength: 96, bmd: 99.2, hr: 64, bp: "116/74", eye: "Normal Vision / Clear Grid", balance: "Passed - Steady" }
    ];

    let gravityLogs = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [...defaultLogs];
    let gravityChart = null;

    // UI Elements
    const bmdRetentionVal = document.getElementById("bmdRetentionVal");
    const bmdSubText = document.getElementById("bmdSubText");
    const muscleIndexVal = document.getElementById("muscleIndexVal");
    const cardioVal = document.getElementById("cardioVal");
    const bpSubText = document.getElementById("bpSubText");
    const sansStatusBadge = document.getElementById("sansStatusBadge");
    const sansSubText = document.getElementById("sansSubText");
    const gravityTableBody = document.getElementById("gravityTableBody");

    function saveLogs() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gravityLogs));
    }

    function updateDashboard() {
        const labels = [];
        const strengthData = [];
        const bmdData = [];
        const exerciseData = [];

        gravityTableBody.innerHTML = "";

        gravityLogs.forEach((entry) => {
            labels.push(entry.sol);
            strengthData.push(entry.strength);
            bmdData.push(entry.bmd);
            exerciseData.push(entry.exercise);

            const eyeColor = entry.eye.includes("Distortion") ? "#f87171" : (entry.eye.includes("Mild") ? "#facc15" : "#4ade80");

            const row = document.createElement("tr");
            row.innerHTML = `
                <td><strong>${entry.sol}</strong></td>
                <td>${entry.exercise} mins</td>
                <td style="color: var(--cyan); font-weight: 600;">${entry.strength}/100</td>
                <td>${entry.hr} bpm (${entry.bp})</td>
                <td style="color: ${eyeColor};">${entry.eye.split("/")[0]}</td>
                <td>${entry.balance}</td>
            `;
            gravityTableBody.prepend(row);
        });

        const latest = gravityLogs[gravityLogs.length - 1];
        if (!latest) return;
        const bmdLoss = (100 - latest.bmd).toFixed(1);

        // Update Top Metric Cards
        bmdRetentionVal.textContent = `${latest.bmd.toFixed(1)}%`;
        bmdSubText.textContent = `-${bmdLoss}% vs pre-flight baseline`;
        muscleIndexVal.textContent = `${latest.strength} / 100`;
        cardioVal.textContent = `${latest.hr} bpm`;
        bpSubText.textContent = `BP: ${latest.bp} mmHg`;

        updateAdaptationIndicators(latest);
        renderChart(labels, strengthData, bmdData, exerciseData);
    }

    function updateAdaptationIndicators(latest) {
        const bonePill = document.getElementById("bonePill");
        const boneDesc = document.getElementById("boneDesc");
        const ocularPill = document.getElementById("ocularPill");
        const ocularDesc = document.getElementById("ocularDesc");
        const balancePill = document.getElementById("balancePill");
        const balanceDesc = document.getElementById("balanceDesc");

        // 1. Bone & Muscle Evaluation
        if (latest.bmd < 96 || latest.strength < 85 || latest.exercise < 45) {
            bonePill.className = "status-pill status-alert";
            bonePill.textContent = "ATROPHY RISK";
            boneDesc.textContent = "Insufficient mechanical loading detected. Increase ARED squat/deadlift resistance and Vitamin D + Calcium intake.";
        } else if (latest.bmd < 98.5 || latest.strength < 92) {
            bonePill.className = "status-pill status-watch";
            bonePill.textContent = "MONITOR";
            boneDesc.textContent = "Slight musculoskeletal decline. Maintain 90+ mins daily combined aerobic and resistive exercise.";
        } else {
            bonePill.className = "status-pill status-optimal";
            bonePill.textContent = "PROTECTED";
            boneDesc.textContent = "Weightless unloading countered effectively. Daily resistive squats & deadlifts maintaining bone remodeling.";
        }

        // 2. SANS (Ocular) Evaluation
        if (latest.eye.includes("Distortion")) {
            sansStatusBadge.innerHTML = `<span class="status-pill status-alert">SANS ALERT</span>`;
            sansSubText.textContent = "Optic nerve sheath dilation suspected";
            ocularPill.className = "status-pill status-alert";
            ocularPill.textContent = "ELEVATED";
            ocularDesc.textContent = "Visual distortion logged. Perform onboard OCT retinal scan, check CO2 levels, and apply Lower Body Negative Pressure (LBNP).";
        } else if (latest.eye.includes("Mild")) {
            sansStatusBadge.innerHTML = `<span class="status-pill status-watch">WATCH / SHIFT</span>`;
            sansSubText.textContent = "Mild hyperopic refractive shift";
            ocularPill.className = "status-pill status-watch";
            ocularPill.textContent = "SHIFT DETECTED";
            ocularDesc.textContent = "Mild fluid-induced globe flattening detected. Switch to adjustable corrective lenses and repeat Amsler grid check in 12h.";
        } else {
            sansStatusBadge.innerHTML = `<span class="status-pill status-optimal">NOMINAL / CLEAR</span>`;
            sansSubText.textContent = "No optic disc edema detected";
            ocularPill.className = "status-pill status-optimal";
            ocularPill.textContent = "STABLE";
            ocularDesc.textContent = "Cephalad fluid shift monitored via Amsler grid & visual acuity checks. Intracranial pressure markers normal.";
        }

        // 3. Balance & Coordination Evaluation
        if (latest.balance.includes("Vertigo")) {
            balancePill.className = "status-pill status-alert";
            balancePill.textContent = "IMPAIRED";
            balanceDesc.textContent = "Vestibular disorientation flagged. Execute gaze-stabilization drills and avoid rapid head movements.";
        } else if (latest.balance.includes("Lag")) {
            balancePill.className = "status-pill status-watch";
            balancePill.textContent = "ADAPTING";
            balanceDesc.textContent = "Minor sensorimotor lag observed. Continue proprioceptive foot-pressure stimulation exercises.";
        } else {
            balancePill.className = "status-pill status-optimal";
            balancePill.textContent = "CALIBRATED";
            balanceDesc.textContent = "Vestibular-ocular reflex and proprioceptive readiness maintained for planetary surface landing transitions.";
        }
    }

    function renderChart(labels, strengthData, bmdData, exerciseData) {
        if (typeof Chart === "undefined") {
            console.warn("Chart.js not loaded. Skipping gravity chart render.");
            return;
        }
        const canvas = document.getElementById("gravityChart");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (gravityChart) gravityChart.destroy();

        gravityChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Bone Density Retention (%)",
                        data: bmdData,
                        borderColor: "#67e8f9",
                        backgroundColor: "rgba(103, 232, 249, 0.12)",
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.3,
                        yAxisID: "y"
                    },
                    {
                        label: "Muscle Strength Index",
                        data: strengthData,
                        borderColor: "#4ade80",
                        backgroundColor: "transparent",
                        borderWidth: 2,
                        tension: 0.3,
                        yAxisID: "y"
                    },
                    {
                        label: "Daily Exercise (mins)",
                        data: exerciseData,
                        borderColor: "#38bdf8",
                        borderDash: [5, 5],
                        borderWidth: 2,
                        tension: 0.2,
                        yAxisID: "y1"
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: { mode: "index", intersect: false },
                plugins: {
                    legend: { labels: { color: "#9ba9c5", font: { family: "Inter" } } }
                },
                scales: {
                    x: {
                        ticks: { color: "#9ba9c5" },
                        grid: { color: "rgba(120, 180, 255, 0.08)" }
                    },
                    y: {
                        type: "linear",
                        position: "left",
                        min: 75,
                        max: 102,
                        title: { display: true, text: "Retention / Index (%)", color: "#67e8f9" },
                        ticks: { color: "#9ba9c5" },
                        grid: { color: "rgba(120, 180, 255, 0.08)" }
                    },
                    y1: {
                        type: "linear",
                        position: "right",
                        min: 0,
                        max: 150,
                        title: { display: true, text: "Exercise (mins)", color: "#38bdf8" },
                        ticks: { color: "#9ba9c5" },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    }

    // Handle Form Submission
    document.getElementById("gravityLogForm").addEventListener("submit", function (e) {
        e.preventDefault();
        const exercise = Number(document.getElementById("exerciseMins").value);
        const strength = Number(document.getElementById("strengthScore").value);
        const hr = Number(document.getElementById("restingHr").value);
        const bp = document.getElementById("bloodPressure").value.trim();
        const eye = document.getElementById("eyeAssessment").value;
        const balance = document.getElementById("balanceDrill").value;

        // Calculate realistic BMD change based on exercise duration
        const prevBmd = gravityLogs[gravityLogs.length - 1].bmd;
        const bmdDelta = exercise >= 75 ? -0.05 : -0.45;
        const newBmd = Math.max(80, Number((prevBmd + bmdDelta).toFixed(2)));

        const nextSol = `Sol ${String(gravityLogs.length + 1).padStart(2, "0")}`;
        gravityLogs.push({
            sol: nextSol,
            exercise: exercise,
            strength: strength,
            bmd: newBmd,
            hr: hr,
            bp: bp,
            eye: eye,
            balance: balance
        });

        saveLogs();
        updateDashboard();
        alert("Microgravity countermeasure and vitals session logged successfully!");
    });

    // Simulate Missed Workouts & Microgravity Deconditioning for Demo
    document.getElementById("simulateDecondBtn").addEventListener("click", function () {
        const prev = gravityLogs[gravityLogs.length - 1];
        const nextSol = `Sol ${String(gravityLogs.length + 1).padStart(2, "0")}`;
        gravityLogs.push({
            sol: nextSol,
            exercise: 15,
            strength: Math.max(70, prev.strength - 6),
            bmd: Number((prev.bmd - 0.9).toFixed(2)),
            hr: 78,
            bp: "128/84",
            eye: "Wavy Grid / Visual Distortion",
            balance: "Disorientation / Vertigo"
        });
        saveLogs();
        updateDashboard();
    });

    // Reset Demo Logs
    document.getElementById("resetGravityBtn").addEventListener("click", function () {
        gravityLogs = [...defaultLogs];
        saveLogs();
        updateDashboard();
    });

    updateDashboard();
});