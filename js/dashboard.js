// ==========================================================================
// ASTROLIFE - ASTRONAUT DASHBOARD & REAL-TIME HEALTH MONITORING ENGINE
// NASA Space Apps Challenge
// ==========================================================================

document.addEventListener("DOMContentLoaded", function () {
    // 1. RBAC Clearance Verification
    if (window.AstroAuth) {
        const hasAccess = AstroAuth.requireRole(["astronaut", "administrator", "mission-control"]);
        if (!hasAccess) return;
    }

    const currentUser = window.AstroAuth ? AstroAuth.getCurrentUser() : null;
    const config = window.AstroAuth ? AstroAuth.getConfig() : null;
    const thresholds = config ? config.thresholds : null;

    const STORAGE_KEY_RECORDS = "astrolife_vitals_records";
    const STORAGE_KEY_ALERTS = "astrolife_active_alerts";

    let isSimulationActive = false;
    let simInterval = null;
    let currentChartIndicator = "heartRate";
    let vitalsChart = null;

    // Default Seed Baseline Measurements (realistic spaceflight physiology)
    const defaultVitals = {
        heartRate: { value: 68, unit: "BPM", status: "SAFE", source: "Sensor (Live)", timestamp: "Just now" },
        spo2: { value: 98, unit: "%", status: "SAFE", source: "Sensor (Live)", timestamp: "Just now" },
        bloodPressureSys: { value: 116, unit: "mmHg", status: "SAFE", source: "Sensor (Live)", timestamp: "Just now" },
        bloodPressureDia: { value: 76, unit: "mmHg", status: "SAFE", source: "Sensor (Live)", timestamp: "Just now" },
        bodyTemp: { value: 36.7, unit: "°C", status: "SAFE", source: "Sensor (Live)", timestamp: "Just now" },
        respiratoryRate: { value: 14, unit: "breaths/min", status: "SAFE", source: "Sensor (Live)", timestamp: "Just now" },
        bloodGlucose: { value: 88, unit: "mg/dL", status: "SAFE", source: "Manual Entry", timestamp: "07:30 UTC" },
        sleepDuration: { value: 7.6, unit: "hrs", status: "SAFE", source: "Sensor (Live)", timestamp: "Sol 42 Sleep" },
        physicalActivity: { value: 95, unit: "mins", status: "SAFE", source: "ARED Sensor", timestamp: "Sol 42 Workout" },
        stressLevel: { value: 3, unit: "scale 1-10", status: "SAFE", source: "Manual Entry", timestamp: "08:15 UTC" },
        hydrationLevel: { value: 2.6, unit: "Liters", status: "SAFE", source: "ECLSS Meter", timestamp: "Cumulative" }
    };

    let currentVitals = JSON.parse(localStorage.getItem("astrolife_current_vitals")) || { ...defaultVitals };
    let vitalsHistory = JSON.parse(localStorage.getItem(STORAGE_KEY_RECORDS)) || [
        { sol: "Sol 38", time: "08:00 UTC", heartRate: 64, spo2: 98, bloodPressureSys: 114, bloodPressureDia: 74, bodyTemp: 36.6, respiratoryRate: 14, bloodGlucose: 86, sleepDuration: 7.8, physicalActivity: 90, stressLevel: 2, hydrationLevel: 2.7, source: "Sensor (Live)" },
        { sol: "Sol 39", time: "08:00 UTC", heartRate: 66, spo2: 99, bloodPressureSys: 118, bloodPressureDia: 76, bodyTemp: 36.8, respiratoryRate: 15, bloodGlucose: 89, sleepDuration: 7.2, physicalActivity: 105, stressLevel: 3, hydrationLevel: 2.5, source: "Sensor (Live)" },
        { sol: "Sol 40", time: "08:00 UTC", heartRate: 72, spo2: 97, bloodPressureSys: 122, bloodPressureDia: 78, bodyTemp: 36.7, respiratoryRate: 16, bloodGlucose: 92, sleepDuration: 6.8, physicalActivity: 90, stressLevel: 4, hydrationLevel: 2.4, source: "Sensor (Live)" },
        { sol: "Sol 41", time: "08:00 UTC", heartRate: 65, spo2: 98, bloodPressureSys: 115, bloodPressureDia: 75, bodyTemp: 36.6, respiratoryRate: 14, bloodGlucose: 88, sleepDuration: 7.5, physicalActivity: 110, stressLevel: 2, hydrationLevel: 2.8, source: "Sensor (Live)" },
        { sol: "Sol 42", time: "08:00 UTC", heartRate: 68, spo2: 98, bloodPressureSys: 116, bloodPressureDia: 76, bodyTemp: 36.7, respiratoryRate: 14, bloodGlucose: 88, sleepDuration: 7.6, physicalActivity: 95, stressLevel: 3, hydrationLevel: 2.6, source: "Sensor (Live)" }
    ];

    let activeAlerts = JSON.parse(localStorage.getItem(STORAGE_KEY_ALERTS)) || [
        {
            id: "alt_101",
            level: "SAFE",
            title: "Autonomous Vitals Verification: All Parameters Nominal",
            detected: "Continuous bio-telemetry stream within certified aerospace physiological limits.",
            measurement: "10/10 Indicators within Safe Reference Boundaries",
            whyItMatters: "Cardiovascular, pulmonary, and metabolic equilibrium confirmed under microgravity conditions.",
            action: "Maintain prescribed 90-minute daily resistive exercise and 2.5L hydration countermeasure protocol.",
            notifyMissionControl: "NO",
            timestamp: "08:00 UTC"
        }
    ];

    // Scientific Microgravity Measurement Instructions
    const measurementInstructions = {
        heartRate: {
            title: "Heart Rate (BPM)",
            protocol: "Wear biometric chest strap or optical wrist PPG sensor. Ensure sensor is seated securely against skin with zero sweat accumulation. Under microgravity cephalad fluid shifts, resting rate may decrease by 5-10 BPM compared to 1G baseline.",
            equipment: "Continuous Bio-Harness / Photoplethysmography Sensor"
        },
        spo2: {
            title: "Blood Oxygen Saturation (SpO2)",
            protocol: "Warm fingers with friction before applying optical pulse oximeter probe. Peripheral perfusion can decrease during sleep or cold cabin periods. A reading below 95% indicates potential cabin ppO2 decline or respiratory distress.",
            equipment: "Nonin Non-Invasive Pulse Oximeter"
        },
        bloodPressure: {
            title: "Blood Pressure (mmHg)",
            protocol: "Sit relaxed in recumbent foot-restraint. Position pneumatic brachial cuff exactly at heart (mid-sternal) level. In microgravity, hydrostatic pressure gradients disappear, resulting in slightly lower systemic vascular resistance.",
            equipment: "Ambulatory Zero-G Sphygmomanometer"
        },
        bodyTemp: {
            title: "Core Body Temperature (°C)",
            protocol: "Use infrared tympanic membrane thermometer. Ensure ear canal is clear. Due to reduced convective cooling in weightlessness, astronauts experience 'Space Fever' (baseline elevation of ~0.5–1.0°C during physical tasks).",
            equipment: "Tympanic / Forehead Infrared Sensor"
        },
        respiratoryRate: {
            title: "Respiratory Rate (breaths/min)",
            protocol: "Measure breaths per minute while seated quietly. Thoracic expansion sensors monitor acoustic and pneumatic volume. Observe for compensatory hyperventilation caused by localized carbon dioxide pocket accumulation.",
            equipment: "Impedance Pneumography Sensor"
        },
        bloodGlucose: {
            title: "Blood Glucose (mg/dL)",
            protocol: "Clean finger with alcohol swab. In microgravity, perform finger-prick inside airflow enclosure to prevent blood droplet free-floating. Apply capillary sample to test strip immediately. Fasting reference: 70–100 mg/dL.",
            equipment: "Closed-Habitat Biosensor Glucometer"
        },
        sleepDuration: {
            title: "Sleep Duration (hrs)",
            protocol: "Logged automatically via sleep quarters sensor mat and wrist actigraphy. Sleep debt accumulation impairs reaction time and cognitive situational awareness during docking and EVA maneuvers.",
            equipment: "Actigraphy Monitor & Sleep Enclosure Sensor"
        },
        physicalActivity: {
            title: "Physical Activity (mins/day)",
            protocol: "Record total combined minutes spent on the Advanced Resistive Exercise Device (ARED) and T2 Cycle/Treadmill. NASA protocol mandates at least 90–120 minutes daily to counteract musculoskeletal bone resorption.",
            equipment: "ARED Telemetry System & CEVIS Ergometer"
        },
        stressLevel: {
            title: "Psychological Stress Index (1–10)",
            protocol: "Complete self-assessment rating daily perceived stress, cognitive workload, and isolation fatigue. Correlated with Heart Rate Variability (HRV) low-frequency / high-frequency autonomic ratio.",
            equipment: "Behavioral Health Terminal & HRV Sensor"
        },
        hydrationLevel: {
            title: "Hydration Intake (Liters/day)",
            protocol: "Log daily beverage pouches and food hydration reconstituted via the potable water dispenser (PWD). Adequate hydration prevents renal stones and maintains plasma volume in weightlessness.",
            equipment: "Potable Water Dispenser Flowmeter"
        }
    };

    // 2. Evaluate Individual Indicator Health Status
    function evaluateMetric(indicator, val) {
        const activeTh = (window.AstroAuth && AstroAuth.getConfig()) ? AstroAuth.getConfig().thresholds : thresholds;
        if (!activeTh || !activeTh[indicator]) {
            return { status: "SAFE", cssClass: "status-safe" };
        }
        const t = activeTh[indicator];
        const num = Number(val);

        if ((t.critMin !== undefined && num <= t.critMin) || (t.critMax !== undefined && num >= t.critMax)) {
            return { status: "CRITICAL", cssClass: "status-critical" };
        }
        if ((t.safeMin !== undefined && num < t.safeMin) || (t.safeMax !== undefined && num > t.safeMax)) {
            return { status: "WARNING", cssClass: "status-warning" };
        }
        return { status: "SAFE", cssClass: "status-safe" };
    }

    // 3. Save State
    function saveState() {
        localStorage.setItem("astrolife_current_vitals", JSON.stringify(currentVitals));
        localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(vitalsHistory));
        localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(activeAlerts));
    }

    // 4. Update Header and Mission Metadata
    function updateMissionHeader() {
        const missionNameEl = document.getElementById("missionNameDisplay");
        const missionSolEl = document.getElementById("missionSolDisplay");
        const missionDurationEl = document.getElementById("missionDurationDisplay");
        const checkinCountEl = document.getElementById("checkinCountDisplay");
        const checkinProgressBar = document.getElementById("checkinProgressBar");

        if (config && config.mission) {
            if (missionNameEl) missionNameEl.textContent = config.mission.name;
            if (missionSolEl) missionSolEl.textContent = `SOL ${config.mission.currentSol}`;
            if (missionDurationEl) missionDurationEl.textContent = `Day ${config.mission.currentSol} of ${config.mission.durationDays} Days`;
        }

        // Daily Check-in Completion
        const keys = Object.keys(currentVitals);
        const loggedCount = keys.filter(k => currentVitals[k].value !== null && currentVitals[k].value !== undefined).length;
        const total = 10;
        const pct = Math.min(Math.round((loggedCount / total) * 100), 100);

        if (checkinCountEl) checkinCountEl.textContent = `${loggedCount}/${total} Completed (${pct}%)`;
        if (checkinProgressBar) checkinProgressBar.style.width = `${pct}%`;
    }

    // 5. Update Overall Health Status Badge
    function updateOverallHealthStatus() {
        const badgeEl = document.getElementById("overallStatusBadge");
        const statusSummaryText = document.getElementById("statusSummaryText");
        if (!badgeEl) return;

        let hasCritical = false;
        let hasWarning = false;

        Object.keys(currentVitals).forEach(k => {
            const st = currentVitals[k].status;
            if (st === "CRITICAL") hasCritical = true;
            if (st === "WARNING") hasWarning = true;
        });

        if (hasCritical) {
            badgeEl.className = "health-status-badge-lg status-critical";
            badgeEl.innerHTML = `<span class="eyebrow-pulse" style="background: #f87171;"></span> CRITICAL ALERT`;
            if (statusSummaryText) {
                statusSummaryText.textContent = "Potentially serious condition detected requiring immediate action under approved emergency protocols.";
            }
        } else if (hasWarning) {
            badgeEl.className = "health-status-badge-lg status-warning";
            badgeEl.innerHTML = `<span class="eyebrow-pulse" style="background: #facc15;"></span> WARNING`;
            if (statusSummaryText) {
                statusSummaryText.textContent = "An unusual measurement or developing physiological concern requires attention.";
            }
        } else {
            badgeEl.className = "health-status-badge-lg status-safe";
            badgeEl.innerHTML = `<span class="eyebrow-pulse" style="background: #4ade80;"></span> SAFE / NOMINAL`;
            if (statusSummaryText) {
                statusSummaryText.textContent = "All ten aerospace physiological indicators operating within certified safe monitoring limits.";
            }
        }
    }

    // 6. Render 10 Interactive Metric Cards
    function renderMetricCards() {
        const container = document.getElementById("indicatorsGrid");
        if (!container) return;

        const metricsConfig = [
            { key: "heartRate", name: "Heart Rate", val: currentVitals.heartRate.value, unit: "BPM", icon: "♥", src: currentVitals.heartRate.source },
            { key: "spo2", name: "Blood Oxygen (SpO2)", val: currentVitals.spo2.value, unit: "%", icon: "🫁", src: currentVitals.spo2.source },
            { key: "bloodPressure", name: "Blood Pressure", val: `${currentVitals.bloodPressureSys.value}/${currentVitals.bloodPressureDia.value}`, unit: "mmHg", icon: "🩺", src: currentVitals.bloodPressureSys.source },
            { key: "bodyTemp", name: "Body Temp", val: currentVitals.bodyTemp.value, unit: "°C", icon: "🌡", src: currentVitals.bodyTemp.source },
            { key: "respiratoryRate", name: "Respiratory Rate", val: currentVitals.respiratoryRate.value, unit: "bpm", icon: "💨", src: currentVitals.respiratoryRate.source },
            { key: "bloodGlucose", name: "Blood Glucose", val: currentVitals.bloodGlucose.value, unit: "mg/dL", icon: "🩸", src: currentVitals.bloodGlucose.source },
            { key: "sleepDuration", name: "Sleep Duration", val: currentVitals.sleepDuration.value, unit: "hrs", icon: "☾", src: currentVitals.sleepDuration.source },
            { key: "physicalActivity", name: "Physical Activity", val: currentVitals.physicalActivity.value, unit: "mins", icon: "🏋", src: currentVitals.physicalActivity.source },
            { key: "stressLevel", name: "Stress Level", val: currentVitals.stressLevel.value, unit: "/10", icon: "🧠", src: currentVitals.stressLevel.source },
            { key: "hydrationLevel", name: "Hydration Intake", val: currentVitals.hydrationLevel.value, unit: "L", icon: "💧", src: currentVitals.hydrationLevel.source }
        ];

        container.innerHTML = "";

        metricsConfig.forEach(m => {
            let statusObj = { status: "SAFE", cssClass: "status-safe" };
            if (m.key === "bloodPressure") {
                const s1 = evaluateMetric("bloodPressureSys", currentVitals.bloodPressureSys.value);
                const s2 = evaluateMetric("bloodPressureDia", currentVitals.bloodPressureDia.value);
                if (s1.status === "CRITICAL" || s2.status === "CRITICAL") statusObj = { status: "CRITICAL", cssClass: "status-critical" };
                else if (s1.status === "WARNING" || s2.status === "WARNING") statusObj = { status: "WARNING", cssClass: "status-warning" };
            } else {
                statusObj = evaluateMetric(m.key, m.val);
            }

            const card = document.createElement("div");
            card.className = `metric-card-interactive ${currentChartIndicator === m.key ? "is-selected" : ""}`;
            card.setAttribute("data-metric-key", m.key);

            let sourceTagClass = "metric-source-sensor";
            if (m.src.includes("Simulated")) sourceTagClass = "metric-source-sim";
            if (m.src.includes("Manual")) sourceTagClass = "metric-source-manual";

            card.innerHTML = `
                <div class="metric-card-header">
                    <small>${m.icon} ${m.name}</small>
                    <span class="status-pill ${statusObj.cssClass}">${statusObj.status}</span>
                </div>
                <div style="display: flex; align-items: baseline; margin: 4px 0;">
                    <span class="metric-current-num">${m.val}</span>
                    <span class="metric-unit">${m.unit}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                    <span class="metric-source-tag ${sourceTagClass}">${m.src}</span>
                    <button type="button" class="btn-guide-sm" data-guide-key="${m.key}" style="font-size: 11px; color: var(--cyan); background: none; border: none; cursor: pointer; text-decoration: underline;">
                        Protocol ℹ
                    </button>
                </div>
            `;

            // Click card to view indicator in graph
            card.addEventListener("click", function (e) {
                if (e.target.closest(".btn-guide-sm")) return;
                currentChartIndicator = m.key;
                document.querySelectorAll(".metric-card-interactive").forEach(c => c.classList.remove("is-selected"));
                card.classList.add("is-selected");
                updateChart();
            });

            container.appendChild(card);
        });

        // Attach event listeners to Guide buttons
        document.querySelectorAll("[data-guide-key]").forEach(btn => {
            btn.addEventListener("click", function (e) {
                e.stopPropagation();
                openMeasurementInstructions(this.getAttribute("data-guide-key"));
            });
        });
    }

    // 7. Render Active Alerts (Strict 5-Point Specification)
    function renderAlerts() {
        const container = document.getElementById("alertsListContainer");
        const alertCountBadge = document.getElementById("activeAlertCountBadge");
        if (!container) return;

        if (alertCountBadge) alertCountBadge.textContent = `${activeAlerts.length} ACTIVE`;

        container.innerHTML = "";

        if (activeAlerts.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 24px; color: var(--muted); font-size: 13px;">
                    ✦ No active medical alerts. Bio-telemetry nominal across all parameters.
                </div>
            `;
            return;
        }

        activeAlerts.forEach((alt, idx) => {
            const card = document.createElement("div");
            let cardClass = "alert-card-detailed";
            let badgeClass = "status-safe";

            if (alt.level === "CRITICAL") {
                cardClass += " is-critical";
                badgeClass = "status-critical";
            } else if (alt.level === "WARNING") {
                cardClass += " is-warning";
                badgeClass = "status-warning";
            }

            const notifyClass = alt.notifyMissionControl === "YES" ? "notify-yes" : "notify-no";

            card.className = cardClass;
            card.innerHTML = `
                <div class="alert-title-row">
                    <div>
                        <span class="status-pill ${badgeClass}" style="margin-right: 8px;">${alt.level}</span>
                        <strong>${alt.title}</strong>
                    </div>
                    <span style="font-size: 11px; color: var(--muted);">${alt.timestamp || "Active"}</span>
                </div>
                <div class="alert-details-grid">
                    <div class="alert-detail-field">
                        <span class="field-label">1. What Was Detected</span>
                        ${alt.detected}
                    </div>
                    <div class="alert-detail-field">
                        <span class="field-label">2. Triggering Measurement</span>
                        <strong style="color: var(--cyan);">${alt.measurement}</strong>
                    </div>
                    <div class="alert-detail-field">
                        <span class="field-label">3. Why It Matters (Clinical Context)</span>
                        ${alt.whyItMatters}
                    </div>
                    <div class="alert-detail-field">
                        <span class="field-label">4. Action to Be Considered</span>
                        ${alt.action}
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border);">
                    <div style="font-size: 12px;">
                        <span style="color: var(--muted); margin-right: 8px;">Mission Control Downlink:</span>
                        <span class="alert-notify-pill ${notifyClass}">
                            ${alt.notifyMissionControl === "YES" ? "📡 Houston MCC Notified" : "✓ Local Log Only"}
                        </span>
                    </div>
                    <button type="button" class="btn-fill-demo btn-dismiss-alert" data-alert-idx="${idx}" style="font-size: 11px; padding: 4px 10px;">
                        Acknowledge Protocol
                    </button>
                </div>
            `;
            container.appendChild(card);
        });

        // Dismiss alert handler
        document.querySelectorAll(".btn-dismiss-alert").forEach(btn => {
            btn.addEventListener("click", function () {
                const idx = parseInt(this.getAttribute("data-alert-idx"), 10);
                activeAlerts.splice(idx, 1);
                saveState();
                renderAlerts();
                updateOverallHealthStatus();
            });
        });
    }

    // 8. Render AI-Generated Health Insights
    function renderInsights() {
        const container = document.getElementById("insightsContainer");
        if (!container) return;

        const hr = currentVitals.heartRate.value;
        const spo2 = currentVitals.spo2.value;
        const sleep = currentVitals.sleepDuration.value;
        const hydration = currentVitals.hydrationLevel.value;
        const stress = currentVitals.stressLevel.value;
        const activity = currentVitals.physicalActivity.value;

        const insights = [];

        // Insight 1: Cardiovascular & Microgravity Fluid Shift
        if (hr > 85 && hydration < 2.5) {
            insights.push({
                type: "WARNING",
                title: "Orthostatic Fluid Loss & Mild Tachycardia",
                body: `Elevated heart rate (${hr} BPM) coupled with low hydration (${hydration}L) indicates early intravascular volume contraction. In microgravity, plasma volume decreases within 24 hours without strict electrolyte fluids.`,
                rec: "Ingest 500 mL isotonic electrolyte fluid pouch before scheduled ARED exercise."
            });
        } else {
            insights.push({
                type: "NOMINAL",
                title: "Cardiovascular Remodeling: Nominal Baseline",
                body: `Resting heart rate (${hr} BPM) and SpO2 (${spo2}%) confirm stable baroreceptor reflex adaptation. Stroke volume and capillary refill within expected transit margins.`,
                rec: "Maintain standard 90-minute resistive loading cycle."
            });
        }

        // Insight 2: Sleep & Circadian Adaptation
        if (sleep < 7.0 || stress >= 5) {
            insights.push({
                type: "WARNING",
                title: "Circadian Desynchrony & Cognitive Workload",
                body: `Current sleep duration (${sleep} hrs) reflects sleep debt. Cognitive performance models predict a 12% reduction in sustained vigilance during upcoming docking tasks.`,
                rec: "Enforce 460nm blue-light filtration in crew quarters 90 minutes before sleep cycle."
            });
        } else {
            insights.push({
                type: "NOMINAL",
                title: "Circadian Rhythm & Neuro-Behavioral Stability",
                body: `Sleep continuity (${sleep} hrs) matches NASA Behavioral Health and Performance guidelines. Slow-wave restorative rest adequate for cellular DNA repair.`,
                rec: "Continue current sleep cabin acoustic isolation protocol."
            });
        }

        // Insight 3: Musculoskeletal Countermeasures
        if (activity >= 90) {
            insights.push({
                type: "NOMINAL",
                title: "Musculoskeletal Bone Loss Countermeasures Met",
                body: `Daily physical activity (${activity} mins) satisfies bone mineral density (BMD) mechanical loading thresholds. Calcaneus and lumbar retention on track.`,
                rec: "Log post-workout whey protein and Vitamin D3 supplement."
            });
        } else {
            insights.push({
                type: "WARNING",
                title: "Sub-Optimal ARED Loading Schedule",
                body: `Completed activity (${activity} mins) is below the 90-minute aerospace flight requirement. Risk of accelerated bone resorption (~1.0% per month).`,
                rec: "Schedule makeup 45-minute cycle ergometer or squat loading block."
            });
        }

        container.innerHTML = insights.map(ins => `
            <div style="background: rgba(8, 13, 30, 0.7); border: 1px solid var(--border); border-left: 3px solid ${ins.type === 'WARNING' ? '#facc15' : 'var(--cyan)'}; border-radius: 10px; padding: 14px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <strong style="color: #fff; font-size: 13.5px;">${ins.title}</strong>
                    <span class="status-pill ${ins.type === 'WARNING' ? 'status-watch' : 'status-optimal'}" style="font-size: 10px;">${ins.type}</span>
                </div>
                <p style="font-size: 12px; color: var(--muted); line-height: 1.5; margin-bottom: 6px;">${ins.body}</p>
                <div style="font-size: 11.5px; color: var(--cyan);">✦ Recommendation: ${ins.rec}</div>
            </div>
        `).join("");
    }

    // 9. Interactive Chart.js Multi-Indicator Graph
    function updateChart() {
        if (typeof Chart === "undefined") return;
        const canvas = document.getElementById("vitalsChart");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        const labels = vitalsHistory.map(v => v.sol);
        let metricKey = currentChartIndicator;
        if (metricKey === "bloodPressure") metricKey = "bloodPressureSys";

        const dataPoints = vitalsHistory.map(v => v[metricKey] || currentVitals[metricKey]?.value || 0);
        const metricName = measurementInstructions[currentChartIndicator]?.title || metricKey;

        if (vitalsChart) vitalsChart.destroy();

        vitalsChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: metricName,
                        data: dataPoints,
                        borderColor: "#38bdf8",
                        backgroundColor: "rgba(56, 189, 248, 0.12)",
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.35,
                        pointBackgroundColor: "#67e8f9",
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: { mode: "index", intersect: false },
                plugins: {
                    legend: { labels: { color: "#9ba9c5", font: { family: "Inter", size: 12 } } }
                },
                scales: {
                    x: {
                        ticks: { color: "#9ba9c5" },
                        grid: { color: "rgba(120, 180, 255, 0.08)" }
                    },
                    y: {
                        ticks: { color: "#9ba9c5" },
                        grid: { color: "rgba(120, 180, 255, 0.08)" }
                    }
                }
            }
        });
    }

    // 10. Measurement History Table
    function renderHistoryTable() {
        const tbody = document.getElementById("historyTableBody");
        if (!tbody) return;

        tbody.innerHTML = "";
        const reversed = [...vitalsHistory].reverse();

        reversed.forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${row.sol}</strong></td>
                <td>${row.time}</td>
                <td style="color: var(--cyan);">${row.heartRate} BPM</td>
                <td>${row.spo2}%</td>
                <td>${row.bloodPressureSys}/${row.bloodPressureDia}</td>
                <td>${row.bodyTemp}°C</td>
                <td>${row.hydrationLevel} L</td>
                <td><span class="metric-source-tag">${row.source || "Sensor (Live)"}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // 11. Modal: Open Measurement Instructions
    function openMeasurementInstructions(key) {
        const modal = document.getElementById("instructionModal");
        const titleEl = document.getElementById("instructionTitle");
        const protocolEl = document.getElementById("instructionProtocol");
        const equipEl = document.getElementById("instructionEquipment");
        if (!modal) return;

        const info = measurementInstructions[key] || {
            title: key,
            protocol: "Standard zero-g biomedical measurement protocol. Ensure astronaut stabilization restraint and clean contact.",
            equipment: "Medical Telemetry Subsystem"
        };

        if (titleEl) titleEl.textContent = `${info.title} - Microgravity Protocol`;
        if (protocolEl) protocolEl.textContent = info.protocol;
        if (equipEl) equipEl.textContent = info.equipment;

        modal.classList.add("is-active");
    }

    // Close Modal Listeners
    document.querySelectorAll(".btn-close-modal").forEach(btn => {
        btn.addEventListener("click", function () {
            document.querySelectorAll(".modal-backdrop").forEach(m => m.classList.remove("is-active"));
        });
    });

    // 12. Manual Measurement Entry Form Submit
    const manualEntryForm = document.getElementById("manualEntryForm");
    const manualEntryModal = document.getElementById("manualEntryModal");
    const openManualBtn = document.getElementById("openManualEntryBtn");

    if (openManualBtn && manualEntryModal) {
        openManualBtn.addEventListener("click", function () {
            manualEntryModal.classList.add("is-active");
        });
    }

    if (manualEntryForm) {
        manualEntryForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const metricKey = document.getElementById("manualMetricSelect").value;
            const metricVal = parseFloat(document.getElementById("manualMetricValue").value);
            const notes = document.getElementById("manualMetricNotes").value;

            if (isNaN(metricVal)) {
                alert("Please enter a valid numeric value.");
                return;
            }

            // Update current vitals
            if (metricKey === "bloodPressure") {
                currentVitals.bloodPressureSys.value = Math.round(metricVal);
                currentVitals.bloodPressureSys.source = "Manual Entry";
                currentVitals.bloodPressureSys.timestamp = "Manual (Just now)";
            } else if (currentVitals[metricKey]) {
                currentVitals[metricKey].value = metricVal;
                currentVitals[metricKey].source = "Manual Entry";
                currentVitals[metricKey].timestamp = "Manual (Just now)";
            }

            // Evaluate for abnormal detection
            const evalResult = evaluateMetric(metricKey === "bloodPressure" ? "bloodPressureSys" : metricKey, metricVal);
            if (currentVitals[metricKey]) currentVitals[metricKey].status = evalResult.status;

            if (evalResult.status !== "SAFE") {
                triggerAutomatedAlert(metricKey, metricVal, evalResult.status, "Manual Entry");
            }

            // Append to history
            const nextSol = `Sol ${config ? config.mission.currentSol : 42}`;
            const newHistoryRow = {
                sol: nextSol,
                time: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }) + " UTC",
                heartRate: currentVitals.heartRate.value,
                spo2: currentVitals.spo2.value,
                bloodPressureSys: currentVitals.bloodPressureSys.value,
                bloodPressureDia: currentVitals.bloodPressureDia.value,
                bodyTemp: currentVitals.bodyTemp.value,
                respiratoryRate: currentVitals.respiratoryRate.value,
                bloodGlucose: currentVitals.bloodGlucose.value,
                sleepDuration: currentVitals.sleepDuration.value,
                physicalActivity: currentVitals.physicalActivity.value,
                stressLevel: currentVitals.stressLevel.value,
                hydrationLevel: currentVitals.hydrationLevel.value,
                source: "Manual Entry"
            };
            vitalsHistory.push(newHistoryRow);

            saveState();
            renderMetricCards();
            updateOverallHealthStatus();
            renderAlerts();
            renderInsights();
            updateChart();
            renderHistoryTable();

            manualEntryModal.classList.remove("is-active");
            alert(`Manual measurement for ${metricKey} recorded successfully.`);
            manualEntryForm.reset();
        });
    }

    // 13. Trigger Automated Alert with 5-Point Specification
    function triggerAutomatedAlert(metricKey, val, level, sourceTag) {
        const descriptions = {
            heartRate: {
                detected: val > 90 ? "Tachycardia - Elevated Heart Rate" : "Bradycardia - Low Heart Rate",
                why: "Altered cardiac output affects organ perfusion and orthostatic tolerance under fluid shifts.",
                action: "Sit in stabilization harness; ingest 500 mL water; prepare 12-lead ECG.",
                notify: "YES"
            },
            spo2: {
                detected: "Hypoxemia - Arterial Oxygen Desaturation",
                why: "Inadequate cellular oxygenation causes cognitive slowing, headache, and hypoxia.",
                action: "Check cabin ECLSS ppO2; don portable emergency oxygen mask; verify air filter flow.",
                notify: "YES"
            },
            bloodPressureSys: {
                detected: val > 120 ? "Hypertensive Reaction" : "Hypotensive Shift",
                why: "Altered cerebral perfusion pressure increases risk of visual SANS syndrome or syncope.",
                action: "Adjust recumbent posture; check Lower Body Negative Pressure (LBNP) status.",
                notify: "YES"
            },
            bodyTemp: {
                detected: val > 37.2 ? "Hyperthermia / Space Fever" : "Hypothermia",
                why: "Microgravity impairs convective skin heat dissipation; can indicate latent viral flare.",
                action: "Increase cabin ventilation airflow; hydrate; administer antipyretic if directed.",
                notify: "YES"
            },
            hydrationLevel: {
                detected: "Dehydration Threshold Alert",
                why: "Low plasma volume exacerbates space adaptation syndrome and accelerates kidney stone risk.",
                action: "Consume two electrolyte beverage pouches immediately; log urine output volume.",
                notify: "NO"
            }
        };

        const desc = descriptions[metricKey] || {
            detected: `Abnormal ${metricKey} Reading`,
            why: "Metric deviated from certified NASA Flight Medicine physiological bounds.",
            action: "Rest quietly and repeat measurement in 15 minutes using manual protocol.",
            notify: "YES"
        };

        const newAlert = {
            id: "alt_" + Date.now(),
            level: level,
            title: `${level}: ${desc.detected} (${sourceTag})`,
            detected: desc.detected,
            measurement: `${metricKey}: ${val} (Ref Boundary Violated)`,
            whyItMatters: desc.why,
            action: desc.action,
            notifyMissionControl: desc.notify,
            timestamp: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }) + " UTC"
        };

        activeAlerts.unshift(newAlert);
        if (activeAlerts.length > 20) activeAlerts.pop();
    }

    // 14. Simulation Engine for Demonstrations
    const simToggleBtn = document.getElementById("toggleSimulationBtn");
    const simBanner = document.getElementById("simBanner");

    function startSimulation() {
        isSimulationActive = true;
        if (simBanner) simBanner.classList.add("is-active");
        if (simToggleBtn) {
            simToggleBtn.textContent = "Pause Telemetry Stream ⏸";
            simToggleBtn.style.background = "#f59e0b";
            simToggleBtn.style.color = "#000";
        }

        simInterval = setInterval(() => {
            // Generate realistic fluctuations
            const hrDelta = Math.floor(Math.random() * 5) - 2;
            const spo2Delta = Math.random() > 0.8 ? -1 : (Math.random() > 0.5 ? 1 : 0);
            const tempDelta = (Math.random() * 0.2 - 0.1);

            currentVitals.heartRate.value = Math.max(50, Math.min(115, currentVitals.heartRate.value + hrDelta));
            currentVitals.heartRate.source = "SIMULATED DATA – NOT REAL ASTRONAUT MEASUREMENTS.";
            currentVitals.heartRate.timestamp = "Simulated Live";

            currentVitals.spo2.value = Math.max(90, Math.min(100, currentVitals.spo2.value + spo2Delta));
            currentVitals.spo2.source = "SIMULATED DATA – NOT REAL ASTRONAUT MEASUREMENTS.";
            currentVitals.spo2.timestamp = "Simulated Live";

            currentVitals.bodyTemp.value = Number((currentVitals.bodyTemp.value + tempDelta).toFixed(1));
            currentVitals.bodyTemp.source = "SIMULATED DATA – NOT REAL ASTRONAUT MEASUREMENTS.";

            // Re-evaluate
            currentVitals.heartRate.status = evaluateMetric("heartRate", currentVitals.heartRate.value).status;
            currentVitals.spo2.status = evaluateMetric("spo2", currentVitals.spo2.value).status;
            currentVitals.bodyTemp.status = evaluateMetric("bodyTemp", currentVitals.bodyTemp.value).status;

            // Trigger alert if simulated reading is abnormal
            if (currentVitals.heartRate.status !== "SAFE") {
                triggerAutomatedAlert("heartRate", currentVitals.heartRate.value, currentVitals.heartRate.status, "SIMULATED DATA");
            }
            if (currentVitals.spo2.status !== "SAFE") {
                triggerAutomatedAlert("spo2", currentVitals.spo2.value, currentVitals.spo2.status, "SIMULATED DATA");
            }

            renderMetricCards();
            updateOverallHealthStatus();
            renderAlerts();
            renderInsights();
        }, 3000);
    }

    function stopSimulation() {
        isSimulationActive = false;
        clearInterval(simInterval);
        if (simBanner) simBanner.classList.remove("is-active");
        if (simToggleBtn) {
            simToggleBtn.textContent = "Start Live Telemetry Stream ▶";
            simToggleBtn.style.background = "";
            simToggleBtn.style.color = "";
        }

        // Reset source tag to sensor baseline
        Object.keys(currentVitals).forEach(k => {
            if (currentVitals[k].source.includes("SIMULATED")) {
                currentVitals[k].source = "Sensor (Live)";
            }
        });
        renderMetricCards();
    }

    if (simToggleBtn) {
        simToggleBtn.addEventListener("click", function () {
            if (isSimulationActive) {
                stopSimulation();
            } else {
                startSimulation();
            }
        });
    }

    // Simulation Trigger: Anomaly injection for testing
    const injectAnomalyBtn = document.getElementById("injectAnomalyBtn");
    if (injectAnomalyBtn) {
        injectAnomalyBtn.addEventListener("click", function () {
            currentVitals.heartRate.value = 118;
            currentVitals.heartRate.status = "CRITICAL";
            currentVitals.heartRate.source = "SIMULATED DATA – NOT REAL ASTRONAUT MEASUREMENTS.";
            triggerAutomatedAlert("heartRate", 118, "CRITICAL", "SIMULATED DATA – NOT REAL ASTRONAUT MEASUREMENTS.");

            currentVitals.spo2.value = 91;
            currentVitals.spo2.status = "CRITICAL";
            currentVitals.spo2.source = "SIMULATED DATA – NOT REAL ASTRONAUT MEASUREMENTS.";
            triggerAutomatedAlert("spo2", 91, "CRITICAL", "SIMULATED DATA – NOT REAL ASTRONAUT MEASUREMENTS.");

            saveState();
            renderMetricCards();
            updateOverallHealthStatus();
            renderAlerts();
            renderInsights();
            updateChart();
            alert("Simulated acute anomaly injected (Tachycardia + Desaturation). Alert center populated.");
        });
    }

    // Initial Dashboard Render
    updateMissionHeader();
    renderMetricCards();
    updateOverallHealthStatus();
    renderAlerts();
    renderInsights();
    updateChart();
    renderHistoryTable();
});
document.addEventListener("DOMContentLoaded", () => {
    const routineListEl = document.getElementById("dashboardRoutineList");
    const progressText = document.getElementById("routineProgressText");
    const progressBar = document.getElementById("routineProgressBar");
    if (!routineListEl) return;

    // Base mission routine tasks
    const defaultRoutine = [
        { id: "t1", time: "06:00 – 06:30", block: "Wake & Vitals Scan", protocol: "Resting HR, SpO₂ check + 500 ml hydration", done: false },
        { id: "t2", time: "06:30 – 07:30", block: "Nutrition & Briefing", protocol: "High-protein breakfast + Mission Control sync", done: false },
        { id: "t3", time: "07:30 – 10:00", block: "Primary Mission Ops", protocol: "Core payload experiments & diagnostics", done: false },
        { id: "t4", time: "10:00 – 12:00", block: "Countermeasure Training", protocol: "45m Cycle Ergometer + 60m ARED Resistance", done: false },
        { id: "t5", time: "12:00 – 13:30", block: "Midday Meal & Recovery", protocol: "Balanced lunch + 20-min sensory decompression", done: false },
        { id: "t6", time: "13:30 – 17:30", block: "Afternoon Ops & Checks", protocol: "Secondary research & ECLSS air scrubber check", done: false },
        { id: "t7", time: "17:30 – 19:00", block: "Dinner & Crew Debrief", protocol: "Evening meal + Flight Surgeon telemetry review", done: false },
        { id: "t8", time: "19:00 – 21:30", block: "Pre-Sleep Protocol", protocol: "Low-blue lighting, vitals log & zero screens", done: false },
        { id: "t9", time: "21:30 – 06:00", block: "Scheduled Sleep Block", protocol: "Acoustic-shielded crew quarters rest cycle", done: false }
    ];

    // Load saved state from localStorage (resets daily or persists as needed)
    let routineState = JSON.parse(localStorage.getItem("astrolife_routine")) || defaultRoutine;

    function renderRoutine() {
        routineListEl.innerHTML = routineState.map(item => `
            <div class="routine-item" data-id="${item.id}" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: ${item.done ? 'rgba(16, 185, 129, 0.08)' : 'rgba(30, 41, 59, 0.6)'}; border: 1px solid ${item.done ? 'rgba(16, 185, 129, 0.3)' : 'rgba(148, 163, 184, 0.15)'}; border-radius: 8px; transition: all 0.2s ease;">
                <div style="display: flex; align-items: center; gap: 14px;">
                    <input type="checkbox" id="check-${item.id}" ${item.done ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #35dfff; cursor: pointer;">
                    <div>
                        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                            <span style="font-size: 12px; font-weight: 600; color: #35dfff; background: rgba(53, 223, 255, 0.1); padding: 2px 8px; border-radius: 4px;">${item.time}</span>
                            <span style="font-size: 14px; font-weight: 600; color: ${item.done ? '#10b981' : '#ffffff'}; text-decoration: ${item.done ? 'line-through' : 'none'};">${item.block}</span>
                        </div>
                        <p style="margin: 4px 0 0 0; font-size: 12.5px; color: #94a3b8;">${item.protocol}</p>
                    </div>
                </div>
            </div>
        `).join("");

        // Calculate progress
        const completedCount = routineState.filter(i => i.done).length;
        const percent = Math.round((completedCount / routineState.length) * 100);
        progressText.textContent = `${completedCount} / ${routineState.length} Completed`;
        progressBar.style.width = `${percent}%`;

        // Attach event listeners to checkboxes
        routineListEl.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
            checkbox.addEventListener("change", (e) => {
                const id = e.target.id.replace("check-", "");
                const task = routineState.find(t => t.id === id);
                if (task) {
                    task.done = e.target.checked;
                    localStorage.setItem("astrolife_routine", JSON.stringify(routineState));
                    renderRoutine();
                }
            });
        });
    }

    renderRoutine();
});