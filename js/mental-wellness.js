// ==========================================================================
// ASTROLIFE - MENTAL WELLNESS & ISOLATION MONITORING ENGINE
// Phase 3: Psychological Support & Behavioral Check-ins
// ==========================================================================

document.addEventListener("DOMContentLoaded", function () {
    const STORAGE_KEY = "astrolife_wellness_logs";

    // Default realistic mission logs
    const defaultLogs = [
        { sol: "Sol 01", mood: 8, stress: 2, sleep: 7.5, fatigue: "Mild Fatigue", teamwork: "Cohesive & Smooth" },
        { sol: "Sol 02", mood: 7, stress: 3, sleep: 7.0, fatigue: "Mild Fatigue", teamwork: "Cohesive & Smooth" },
        { sol: "Sol 03", mood: 9, stress: 2, sleep: 8.0, fatigue: "Alert & Energetic", teamwork: "Cohesive & Smooth" },
        { sol: "Sol 04", mood: 6, stress: 4, sleep: 6.0, fatigue: "Moderate Exhaustion", teamwork: "Minor Friction" },
        { sol: "Sol 05", mood: 8, stress: 2, sleep: 7.5, fatigue: "Alert & Energetic", teamwork: "Cohesive & Smooth" }
    ];

    let wellnessLogs = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [...defaultLogs];
    let wellnessChart = null;

    // Elements
    const avgMoodVal = document.getElementById("avgMoodVal");
    const avgStressVal = document.getElementById("avgStressVal");
    const avgSleepVal = document.getElementById("avgSleepVal");
    const synergyStatusBadge = document.getElementById("synergyStatusBadge");
    const wellnessTableBody = document.getElementById("wellnessTableBody");
    const recommendationsList = document.getElementById("recommendationsList");

    // Slider live value updates
    const inputMood = document.getElementById("inputMood");
    const moodOutput = document.getElementById("moodOutput");
    inputMood.addEventListener("input", () => moodOutput.textContent = inputMood.value);

    const inputStress = document.getElementById("inputStress");
    const stressOutput = document.getElementById("stressOutput");
    inputStress.addEventListener("input", () => stressOutput.textContent = inputStress.value);

    function saveLogs() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wellnessLogs));
    }

    function updateDashboard() {
        let totalMood = 0;
        let totalStress = 0;
        let totalSleep = 0;

        const labels = [];
        const moodData = [];
        const stressData = [];
        const sleepData = [];

        wellnessTableBody.innerHTML = "";

        wellnessLogs.forEach((entry) => {
            totalMood += Number(entry.mood);
            totalStress += Number(entry.stress);
            totalSleep += Number(entry.sleep);

            labels.push(entry.sol);
            moodData.push(entry.mood);
            stressData.push(entry.stress);
            sleepData.push(entry.sleep);

            const row = document.createElement("tr");
            row.innerHTML = `
                <td><strong>${entry.sol}</strong></td>
                <td><span style="color: var(--cyan);">${entry.mood}/10</span></td>
                <td><span style="color: ${entry.stress > 5 ? '#f87171' : '#4ade80'};">${entry.stress}/10</span></td>
                <td>${entry.sleep} hrs</td>
                <td>${entry.fatigue}</td>
                <td>${entry.teamwork}</td>
            `;
            wellnessTableBody.prepend(row);
        });

        const count = wellnessLogs.length;
        if (count === 0) return;
        const avgMood = (totalMood / count).toFixed(1);
        const avgStress = (totalStress / count).toFixed(1);
        const avgSleep = (totalSleep / count).toFixed(1);

        avgMoodVal.textContent = `${avgMood} / 10`;
        avgStressVal.textContent = `${avgStress} / 10`;
        avgStressVal.style.color = avgStress > 5 ? "#f87171" : "#4ade80";
        avgSleepVal.textContent = `${avgSleep} hrs`;

        const latest = wellnessLogs[wellnessLogs.length - 1];
        if (latest) {
            updateRecommendationsAndSynergy(Number(avgMood), Number(avgStress), Number(avgSleep), latest);
        }
        renderChart(labels, moodData, stressData, sleepData);
    }

    function updateRecommendationsAndSynergy(avgMood, avgStress, avgSleep, latestEntry) {
        let recommendations = [];

        if (avgStress >= 5 || avgMood <= 5 || latestEntry.teamwork !== "Cohesive & Smooth") {
            synergyStatusBadge.innerHTML = `<span class="status-pill status-alert">STRAIN DETECTED</span>`;
            recommendations = [
                "<strong>Psychological Support:</strong> Schedule a private audio/video downlink session with ground support or mission psychologists.",
                "<strong>Team Synchronization:</strong> Hold an informal crew debrief or shared recreation block to resolve interpersonal friction.",
                "<strong>Circadian & Sleep Intervention:</strong> Enforce strict blue-light reduction 2 hours before scheduled sleep cycles."
            ];
        } else if (avgStress >= 3.5 || avgSleep < 6.5) {
            synergyStatusBadge.innerHTML = `<span class="status-pill status-watch">WATCH / MONITOR</span>`;
            recommendations = [
                "<strong>Fatigue Mitigation:</strong> Prioritize 30 minutes of quiet meditation, journaling, or music therapy during off-duty hours.",
                "<strong>Rest Routine:</strong> Check station ambient lighting and acoustic insulation in sleep quarters.",
                "<strong>Proactive Engagement:</strong> Maintain regular communication links with family back on Earth."
            ];
        } else {
            synergyStatusBadge.innerHTML = `<span class="status-pill status-optimal">OPTIMAL / COHESIVE</span>`;
            recommendations = [
                "<strong>Nominal Status:</strong> Psychological resilience metrics remain strong across all crew members.",
                "<strong>Maintenance:</strong> Continue daily exercise routines, scheduled leisure time, and team collaboration frameworks.",
                "<strong>Self-Assessment:</strong> Complete daily check-ins consistently to establish reliable behavioral baselines."
            ];
        }

        recommendationsList.innerHTML = recommendations.map(rec => `<li>${rec}</li>`).join("");
    }

    function renderChart(labels, moodData, stressData, sleepData) {
        if (typeof Chart === "undefined") {
            console.warn("Chart.js not loaded. Skipping wellness chart render.");
            return;
        }
        const canvas = document.getElementById("wellnessChart");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (wellnessChart) wellnessChart.destroy();

        wellnessChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Mood (1-10)",
                        data: moodData,
                        borderColor: "#67e8f9",
                        backgroundColor: "rgba(103, 232, 249, 0.1)",
                        borderWidth: 2,
                        tension: 0.3
                    },
                    {
                        label: "Stress (1-10)",
                        data: stressData,
                        borderColor: "#f87171",
                        backgroundColor: "rgba(248, 113, 113, 0.1)",
                        borderWidth: 2,
                        tension: 0.3
                    },
                    {
                        label: "Sleep (Hrs)",
                        data: sleepData,
                        borderColor: "#38bdf8",
                        backgroundColor: "transparent",
                        borderWidth: 2,
                        borderDash: [4, 4],
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: "#9ba9c5", font: { family: "Inter" } } }
                },
                scales: {
                    x: {
                        ticks: { color: "#9ba9c5" },
                        grid: { color: "rgba(120, 180, 255, 0.08)" }
                    },
                    y: {
                        ticks: { color: "#9ba9c5" },
                        grid: { color: "rgba(120, 180, 255, 0.08)" },
                        max: 12
                    }
                }
            }
        });
    }

    // Handle Form Submit
    document.getElementById("dailyWellnessForm").addEventListener("submit", function (e) {
        e.preventDefault();
        const nextSol = `Sol ${String(wellnessLogs.length + 1).padStart(2, "0")}`;
        
        wellnessLogs.push({
            sol: nextSol,
            mood: Number(inputMood.value),
            stress: Number(inputStress.value),
            sleep: Number(document.getElementById("inputSleep").value),
            fatigue: document.getElementById("inputFatigue").value,
            teamwork: document.getElementById("inputTeamwork").value
        });

        saveLogs();
        updateDashboard();
        alert("Daily wellness check-in recorded successfully!");
    });

    // Simulate High Stress / Isolation Event for Demo Presentation
    document.getElementById("simulateStressBtn").addEventListener("click", function () {
        const nextSol = `Sol ${String(wellnessLogs.length + 1).padStart(2, "0")}`;
        wellnessLogs.push({
            sol: nextSol,
            mood: 4,
            stress: 8,
            sleep: 5.0,
            fatigue: "Severe Cognitive Fog",
            teamwork: "Communication Lag"
        });
        saveLogs();
        updateDashboard();
    });

    // Reset Demo Logs
    document.getElementById("resetWellnessBtn").addEventListener("click", function () {
        wellnessLogs = [...defaultLogs];
        saveLogs();
        updateDashboard();
    });

    updateDashboard();
});