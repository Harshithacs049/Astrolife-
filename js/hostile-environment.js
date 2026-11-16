// ==========================================================================
// ASTROLIFE - CLOSED & HOSTILE ENVIRONMENTS ENGINE
// Phase 3: ECLSS Atmosphere, Immune Records & Nutrition/Hydration Tracking
// ==========================================================================

document.addEventListener("DOMContentLoaded", function () {
    const ENV_STORAGE_KEY = "astrolife_env_logs";
    const NUTR_STORAGE_KEY = "astrolife_nutrition_state";

    const defaultEnvLogs = [
        { sol: "Sol 01", o2: 20.9, co2: 2.8, temp: 22.1, humidity: 43, immune: "Normal - No Symptoms" },
        { sol: "Sol 02", o2: 20.8, co2: 3.1, temp: 22.3, humidity: 45, immune: "Normal - No Symptoms" },
        { sol: "Sol 03", o2: 21.0, co2: 2.7, temp: 22.0, humidity: 42, immune: "Normal - No Symptoms" },
        { sol: "Sol 04", o2: 20.7, co2: 3.4, temp: 22.6, humidity: 46, immune: "Mild Sinus / Allergen Sensitivity" },
        { sol: "Sol 05", o2: 20.9, co2: 2.9, temp: 22.4, humidity: 44, immune: "Normal - No Symptoms" }
    ];

    let envLogs = JSON.parse(localStorage.getItem(ENV_STORAGE_KEY)) || [...defaultEnvLogs];
    let nutrition = JSON.parse(localStorage.getItem(NUTR_STORAGE_KEY)) || { water: 2.1, calories: 2450 };
    let envChart = null;

    // UI Elements
    const envAlertBanner = document.getElementById("envAlertBanner");
    const alertTitle = document.getElementById("alertTitle");
    const alertMessage = document.getElementById("alertMessage");
    const envTableBody = document.getElementById("envTableBody");

    function saveAll() {
        localStorage.setItem(ENV_STORAGE_KEY, JSON.stringify(envLogs));
        localStorage.setItem(NUTR_STORAGE_KEY, JSON.stringify(nutrition));
    }

    function updateNutritionUI() {
        const waterGoal = 2.5;
        const calGoal = 2800;

        const waterPct = Math.min((nutrition.water / waterGoal) * 100, 100);
        const calPct = Math.min((nutrition.calories / calGoal) * 100, 100);

        document.getElementById("waterProgressText").textContent = `${nutrition.water.toFixed(1)} / ${waterGoal} L`;
        document.getElementById("waterBar").style.width = `${waterPct}%`;

        document.getElementById("calProgressText").textContent = `${nutrition.calories.toLocaleString()} / ${calGoal.toLocaleString()} kcal`;
        document.getElementById("calBar").style.width = `${calPct}%`;
    }

    function updateDashboard() {
        const labels = [];
        const o2Data = [];
        const co2Data = [];

        envTableBody.innerHTML = "";

        envLogs.forEach((entry) => {
            labels.push(entry.sol);
            o2Data.push(entry.o2);
            co2Data.push(entry.co2);

            const row = document.createElement("tr");
            row.innerHTML = `
                <td><strong>${entry.sol}</strong></td>
                <td style="color: ${entry.o2 < 19.5 ? '#f87171' : 'var(--cyan)'};">${entry.o2.toFixed(1)}%</td>
                <td style="color: ${entry.co2 > 5.0 ? '#f87171' : '#4ade80'};">${entry.co2.toFixed(1)} mmHg</td>
                <td>${entry.temp}°C / ${entry.humidity}%</td>
                <td>${entry.immune}</td>
            `;
            envTableBody.prepend(row);
        });

        const latest = envLogs[envLogs.length - 1];
        if (!latest) return;

        // Update Top Metric Cards
        document.getElementById("o2Val").textContent = `${latest.o2.toFixed(1)}%`;
        document.getElementById("o2Val").style.color = latest.o2 < 19.5 ? "#f87171" : "var(--cyan)";
        document.getElementById("o2Sub").textContent = latest.o2 < 19.5 ? "WARNING: Low O₂ Partial Pressure" : "ppO₂: 21.2 kPa (Nominal)";

        document.getElementById("co2Val").textContent = `${latest.co2.toFixed(1)} mmHg`;
        document.getElementById("co2Val").style.color = latest.co2 > 5.0 ? "#f87171" : "#4ade80";
        document.getElementById("co2Sub").textContent = latest.co2 > 5.0 ? "ALERT: Elevated CO₂ (> 5.0 mmHg)" : "CDRA Scrubber Nominal";

        document.getElementById("tempHumVal").textContent = `${latest.temp}°C / ${latest.humidity}%`;

        // Immune Status Badge
        const immuneBadge = document.getElementById("immuneStatusBadge");
        const immuneSub = document.getElementById("immuneSub");
        if (latest.immune.includes("Viral") || latest.immune.includes("Rash")) {
            immuneBadge.innerHTML = `<span class="status-pill status-alert">IMMUNE DIP</span>`;
            immuneSub.textContent = "Isolate contact & run microbial swab";
        } else if (latest.immune.includes("Mild")) {
            immuneBadge.innerHTML = `<span class="status-pill status-watch">MONITOR</span>`;
            immuneSub.textContent = "Check HEPA air filtration flow";
        } else {
            immuneBadge.innerHTML = `<span class="status-pill status-optimal">RESILIENT</span>`;
            immuneSub.textContent = "HEPA & surface swabs clear";
        }

        // Environmental Warning Alert Banner
        if (latest.co2 > 5.0 || latest.o2 < 19.5 || latest.temp > 27 || latest.humidity > 65) {
            envAlertBanner.classList.add("is-warning");
            alertTitle.textContent = "⚠ ENVIRONMENTAL WARNING ALERT:";
            alertMessage.textContent = `Abnormal cabin telemetry detected (O₂: ${latest.o2}%, CO₂: ${latest.co2} mmHg). Verify CDRA CO₂ scrubber, boost cabin airflow, and check O₂ generator.`;
        } else {
            envAlertBanner.classList.remove("is-warning");
            alertTitle.textContent = "✦ ECLSS ATMOSPHERE NOMINAL:";
            alertMessage.textContent = "Oxygen partial pressure, CO₂ scrubbers, and thermal controls operating within safe limits.";
        }

        updateNutritionUI();
        renderChart(labels, o2Data, co2Data);
    }

    function renderChart(labels, o2Data, co2Data) {
        if (typeof Chart === "undefined") {
            console.warn("Chart.js not loaded. Skipping atmosphere chart render.");
            return;
        }
        const canvas = document.getElementById("envChart");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (envChart) envChart.destroy();

        envChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Oxygen O₂ (%)",
                        data: o2Data,
                        borderColor: "#67e8f9",
                        backgroundColor: "rgba(103, 232, 249, 0.12)",
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.3,
                        yAxisID: "y"
                    },
                    {
                        label: "Carbon Dioxide CO₂ (mmHg)",
                        data: co2Data,
                        borderColor: "#f87171",
                        backgroundColor: "transparent",
                        borderWidth: 2,
                        tension: 0.3,
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
                        min: 17,
                        max: 23,
                        title: { display: true, text: "Oxygen (%)", color: "#67e8f9" },
                        ticks: { color: "#9ba9c5" },
                        grid: { color: "rgba(120, 180, 255, 0.08)" }
                    },
                    y1: {
                        type: "linear",
                        position: "right",
                        min: 0,
                        max: 10,
                        title: { display: true, text: "CO₂ (mmHg)", color: "#f87171" },
                        ticks: { color: "#9ba9c5" },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    }

    // Log Habitat & Immune Check
    document.getElementById("envLogForm").addEventListener("submit", function (e) {
        e.preventDefault();
        const nextSol = `Sol ${String(envLogs.length + 1).padStart(2, "0")}`;
        envLogs.push({
            sol: nextSol,
            o2: parseFloat(document.getElementById("inputO2").value),
            co2: parseFloat(document.getElementById("inputCo2").value),
            temp: parseFloat(document.getElementById("inputTemp").value),
            humidity: parseInt(document.getElementById("inputHumidity").value, 10),
            immune: document.getElementById("inputImmune").value
        });
        saveAll();
        updateDashboard();
    });

    // Log Nutrition & Hydration
    document.getElementById("nutritionForm").addEventListener("submit", function (e) {
        e.preventDefault();
        const water = parseFloat(document.getElementById("addWaterInput").value) || 0;
        const cals = parseInt(document.getElementById("addCalInput").value, 10) || 0;
        nutrition.water = Number((nutrition.water + water).toFixed(1));
        nutrition.calories += cals;
        saveAll();
        updateNutritionUI();
        alert(`Logged +${water} L water and +${cals} kcal nutrition to daily intake.`);
    });

    // Simulate CO2 Scrubber Spike for Demo
    document.getElementById("simulateCo2Btn").addEventListener("click", function () {
        const nextSol = `Sol ${String(envLogs.length + 1).padStart(2, "0")}`;
        envLogs.push({
            sol: nextSol,
            o2: 19.3,
            co2: 6.4,
            temp: 26.8,
            humidity: 62,
            immune: "Mild Sinus / Allergen Sensitivity"
        });
        saveAll();
        updateDashboard();
    });

    // Reset Demo Sensors
    document.getElementById("resetEnvBtn").addEventListener("click", function () {
        envLogs = [...defaultEnvLogs];
        nutrition = { water: 2.1, calories: 2450 };
        saveAll();
        updateDashboard();
    });

    updateDashboard();
});