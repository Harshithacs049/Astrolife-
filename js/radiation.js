// ==========================================================================
// ASTROLIFE - SPACE RADIATION MONITORING & RISK ENGINE
// Phase 3: Radiation Exposure, Biological Risk & Countermeasures
// ==========================================================================

document.addEventListener("DOMContentLoaded", function () {
    const NASA_CAREER_LIMIT_MSV = 600; // NASA standard career limit (mSv)
    const STORAGE_KEY = "astrolife_radiation_logs";

    // Default realistic mission baseline logs (ISS / Lunar Transit)
    const defaultLogs = [
        { day: "Sol 01", source: "GCR Baseline", dose: 0.62 },
        { day: "Sol 02", source: "GCR Baseline", dose: 0.65 },
        { day: "Sol 03", source: "EVA Spacewalk", dose: 1.45 },
        { day: "Sol 04", source: "GCR Baseline", dose: 0.61 },
        { day: "Sol 05", source: "Minor Solar Flux", dose: 2.10 },
        { day: "Sol 06", source: "GCR Baseline", dose: 0.64 }
    ];

    let radiationLogs = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [...defaultLogs];
    let exposureChart = null;

    // Elements
    const cumulativeDoseEl = document.getElementById("cumulativeDose");
    const currentDoseRateEl = document.getElementById("currentDoseRate");
    const limitBarFillEl = document.getElementById("limitBarFill");
    const limitPercentEl = document.getElementById("limitPercent");
    const solarStatusEl = document.getElementById("solarStatus");
    const overallRiskBadgeEl = document.getElementById("overallRiskBadge");
    const riskSummaryTextEl = document.getElementById("riskSummaryText");
    const historyTableBody = document.getElementById("historyTableBody");
    const recommendationsList = document.getElementById("recommendationsList");

    function saveLogs() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(radiationLogs));
    }

    function updateDashboard() {
        let runningTotal = 0;
        const labels = [];
        const dailyData = [];
        const cumulativeData = [];

        historyTableBody.innerHTML = "";

        radiationLogs.forEach((entry) => {
            runningTotal += entry.dose;
            labels.push(entry.day);
            dailyData.push(entry.dose);
            cumulativeData.push(Number(runningTotal.toFixed(2)));

            // Determine row badge
            let statusBadge = `<span class="risk-badge risk-low">Nominal</span>`;
            if (entry.dose > 10) {
                statusBadge = `<span class="risk-badge risk-high">Alert</span>`;
            } else if (entry.dose > 1.5) {
                statusBadge = `<span class="risk-badge risk-moderate">Elevated</span>`;
            }

            const row = document.createElement("tr");
            row.innerHTML = `
                <td><strong>${entry.day}</strong></td>
                <td>${entry.source}</td>
                <td>${entry.dose.toFixed(2)} mSv</td>
                <td style="color: var(--cyan); font-weight: 600;">${runningTotal.toFixed(2)} mSv</td>
                <td>${statusBadge}</td>
            `;
            historyTableBody.prepend(row); // Most recent at top
        });

        const latestEntry = radiationLogs[radiationLogs.length - 1];
        if (!latestEntry) return;
        const percentLimit = Math.min((runningTotal / NASA_CAREER_LIMIT_MSV) * 100, 100);

        // Update Top Cards
        currentDoseRateEl.textContent = `${latestEntry.dose.toFixed(2)} mSv/d`;
        cumulativeDoseEl.textContent = `${runningTotal.toFixed(2)} mSv`;
        limitBarFillEl.style.width = `${percentLimit.toFixed(1)}%`;
        limitPercentEl.textContent = `${percentLimit.toFixed(1)}%`;

        updateBiologicalRisks(runningTotal, latestEntry.dose);
        renderChart(labels, dailyData, cumulativeData);
    }

    function updateBiologicalRisks(totalMsv, latestDailyMsv) {
        const dnaBadge = document.getElementById("dnaRiskBadge");
        const dnaDesc = document.getElementById("dnaRiskDesc");
        const cancerBadge = document.getElementById("cancerRiskBadge");
        const immuneBadge = document.getElementById("immuneRiskBadge");
        const immuneDesc = document.getElementById("immuneRiskDesc");

        // Estimate excess cancer risk (~0.005% per mSv as simplified educational model)
        const estimatedReid = (totalMsv * 0.005).toFixed(2);
        cancerBadge.textContent = `+${estimatedReid}% REID`;

        let recommendations = [];

        if (totalMsv >= 250 || latestDailyMsv >= 15) {
            // HIGH RISK / SOLAR STORM
            overallRiskBadgeEl.innerHTML = `<span class="risk-badge risk-high">HIGH ALERT</span>`;
            riskSummaryTextEl.textContent = "Elevated acute or cumulative radiation detected";
            solarStatusEl.textContent = latestDailyMsv >= 15 ? "STORM (S3)" : "ELEVATED";
            solarStatusEl.style.color = "#f87171";
            limitBarFillEl.style.background = "#f87171";

            dnaBadge.className = "risk-badge risk-high";
            dnaBadge.textContent = "ELEVATED";
            dnaDesc.textContent = "High linear energy transfer (LET) particle flux increases clustered DNA double-strand breaks.";

            cancerBadge.className = "risk-badge risk-high";
            immuneBadge.className = "risk-badge risk-high";
            immuneBadge.textContent = "STRESSED";
            immuneDesc.textContent = "Increased oxidative stress; monitor white blood cell counts and inflammation markers.";

            recommendations = [
                "<strong>Immediate Action:</strong> Relocate to high-density polyethylene / water-wall storm shelter.",
                "<strong>EVA Protocol:</strong> Suspend all Extravehicular Activities (EVAs) until solar flux subsides.",
                "<strong>Biological Countermeasure:</strong> Administer antioxidant-rich nutrition (Vitamins C, E, selenium) and log hematology check."
            ];
        } else if (totalMsv >= 50 || latestDailyMsv >= 2) {
            // MODERATE RISK
            overallRiskBadgeEl.innerHTML = `<span class="risk-badge risk-moderate">MODERATE</span>`;
            riskSummaryTextEl.textContent = "Increased cumulative exposure; monitor shielding";
            solarStatusEl.textContent = "ACTIVE (G1)";
            solarStatusEl.style.color = "#facc15";
            limitBarFillEl.style.background = "#facc15";

            dnaBadge.className = "risk-badge risk-moderate";
            dnaBadge.textContent = "MODERATE";
            dnaDesc.textContent = "Moderate ionizing exposure; ensure uninterrupted sleep cycles to support cellular DNA repair.";

            cancerBadge.className = "risk-badge risk-moderate";
            immuneBadge.className = "risk-badge risk-moderate";
            immuneBadge.textContent = "WATCH";
            immuneDesc.textContent = "Mild oxidative load detected; maintain hydration and immune-supportive micronutrients.";

            recommendations = [
                "<strong>Habitat Shielding:</strong> Maximize sleep quarters time inside hydrogen-rich shielded modules.",
                "<strong>Dietary Support:</strong> Increase intake of radioprotective polyphenols and omega-3 fatty acids.",
                "<strong>Telemetry Sync:</strong> Cross-check CANS neutron spectrometer readings every 6 hours."
            ];
        } else {
            // NOMINAL / LOW RISK
            overallRiskBadgeEl.innerHTML = `<span class="risk-badge risk-low">NOMINAL / LOW</span>`;
            riskSummaryTextEl.textContent = "Within standard mission threshold";
            solarStatusEl.textContent = "QUIET (G0)";
            solarStatusEl.style.color = "var(--cyan)";
            limitBarFillEl.style.background = "linear-gradient(90deg, var(--blue), var(--cyan))";

            dnaBadge.className = "risk-badge risk-low";
            dnaBadge.textContent = "LOW";
            dnaDesc.textContent = "High-energy HZE ions can cause complex DNA lesions. Cellular repair mechanisms currently operating within baseline.";

            cancerBadge.className = "risk-badge risk-low";
            immuneBadge.className = "risk-badge risk-low";
            immuneBadge.textContent = "STABLE";
            immuneDesc.textContent = "Lymphocyte count and oxidative stress markers remain stable under current shielding.";

            recommendations = [
                "<strong>Routine Monitoring:</strong> Keep personal passive & active dosimeters worn during sleep and exercise.",
                "<strong>Cellular Defense:</strong> Maintain daily antioxidant hydration protocol and 8-hour circadian rest.",
                "<strong>EVA Readiness:</strong> Space weather nominal for scheduled extravehicular operations."
            ];
        }

        recommendationsList.innerHTML = recommendations.map(rec => `<li>${rec}</li>`).join("");
    }

    function renderChart(labels, dailyData, cumulativeData) {
        if (typeof Chart === "undefined") {
            console.warn("Chart.js not loaded. Skipping radiation chart render.");
            return;
        }
        const canvas = document.getElementById("radiationChart");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (exposureChart) exposureChart.destroy();

        exposureChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Cumulative Dose (mSv)",
                        data: cumulativeData,
                        borderColor: "#67e8f9",
                        backgroundColor: "rgba(103, 232, 249, 0.12)",
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.35,
                        yAxisID: "y"
                    },
                    {
                        label: "Daily Exposure (mSv)",
                        data: dailyData,
                        borderColor: "#38bdf8",
                        backgroundColor: "#38bdf8",
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
                        title: { display: true, text: "Cumulative (mSv)", color: "#67e8f9" },
                        ticks: { color: "#9ba9c5" },
                        grid: { color: "rgba(120, 180, 255, 0.08)" }
                    },
                    y1: {
                        type: "linear",
                        position: "right",
                        title: { display: true, text: "Daily (mSv)", color: "#38bdf8" },
                        ticks: { color: "#9ba9c5" },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    }

    // Handle Manual Dosimeter Entry
    document.getElementById("logRadiationForm").addEventListener("submit", function (e) {
        e.preventDefault();
        const doseVal = parseFloat(document.getElementById("doseInput").value);
        const sourceVal = document.getElementById("sourceInput").value;
        if (isNaN(doseVal) || doseVal <= 0) return;

        const nextSol = `Sol ${String(radiationLogs.length + 1).padStart(2, "0")}`;
        radiationLogs.push({ day: nextSol, source: sourceVal, dose: doseVal });
        saveLogs();
        updateDashboard();
        this.reset();
    });

    // Simulate Solar Particle Event (SPE) for Demo Presentation
    document.getElementById("simulateFlareBtn").addEventListener("click", function () {
        const nextSol = `Sol ${String(radiationLogs.length + 1).padStart(2, "0")}`;
        radiationLogs.push({ day: nextSol, source: "Solar Particle Event (X-Class)", dose: 24.5 });
        saveLogs();
        updateDashboard();
    });

    // Reset Demo Data
    document.getElementById("resetHistoryBtn").addEventListener("click", function () {
        radiationLogs = [...defaultLogs];
        saveLogs();
        updateDashboard();
    });

    updateDashboard();
});
// Example: Connecting loginForm in js/auth.js to FastAPI
const response = await fetch("http://127.0.0.1:8000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        email: emailInput.value.trim(),
        password: passwordInput.value
    })
});

const data = await response.json();
if (response.ok) {
    sessionStorage.setItem("astro_user", data.user);
    sessionStorage.setItem("astro_email", data.email);
    window.location.href = "dashboard.html";
} else {
    showError("loginPassword", "loginPasswordError", data.detail);
}