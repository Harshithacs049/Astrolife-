// ==========================================================================
// ASTROLIFE - AUTONOMOUS MEDICAL & OFFLINE SUPPORT ENGINE
// Phase 3: Distance from Earth, Autonomous Triage & Sync Management
// ==========================================================================

document.addEventListener("DOMContentLoaded", function () {
    const QUEUE_STORAGE_KEY = "astrolife_sync_queue";
    const RECORDS_STORAGE_KEY = "astrolife_local_records";

    let isOffline = false;
    let syncQueue = JSON.parse(localStorage.getItem(QUEUE_STORAGE_KEY)) || [
        { id: "REC-101", type: "Autonomous Triage", severity: "Moderate (4)", status: "Queued (Offline)", time: "Sol 05 - 08:30" },
        { id: "REC-102", type: "Dosimeter Log", severity: "Low (1)", status: "Queued (Offline)", time: "Sol 05 - 14:15" }
    ];

    let localRecords = JSON.parse(localStorage.getItem(RECORDS_STORAGE_KEY)) || [
        { id: "LREC-01", category: "Vitals Baseline", summary: "HR 68 bpm, BP 118/76, Temp 36.8°C", storage: "Encrypted Flash" },
        { id: "LREC-02", category: "Radiation Profile", summary: "Cumulative 42.5 mSv (Nominal)", storage: "Encrypted Flash" },
        { id: "LREC-03", category: "Behavioral Check", summary: "Mood 8/10, Sleep 7.5 hrs", storage: "Encrypted Flash" }
    ];

    const commStatusBadge = document.getElementById("commStatusBadge");
    const commSubText = document.getElementById("commSubText");
    const queueCountVal = document.getElementById("queueCountVal");
    const syncTableBody = document.getElementById("syncTableBody");
    const recordsTableBody = document.getElementById("recordsTableBody");
    const toggleOfflineBtn = document.getElementById("toggleOfflineBtn");

    function saveState() {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(syncQueue));
        localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(localRecords));
    }

    function updateUI() {
        const pendingCount = syncQueue.filter(item => item.status && item.status.includes("Queued")).length;
        queueCountVal.textContent = pendingCount;

        // Update Communication Badge
        if (isOffline) {
            commStatusBadge.innerHTML = `<span class="status-pill status-offline">DEEP SPACE BLACKOUT</span>`;
            commSubText.textContent = "Autonomous Mode Active - No Ground Link";
            toggleOfflineBtn.textContent = "Reconnect Ground Link";
            toggleOfflineBtn.style.background = "var(--error-red)";
            toggleOfflineBtn.style.color = "#fff";
        } else {
            commStatusBadge.innerHTML = `<span class="status-pill status-online">ONLINE (Delay: 18m)</span>`;
            commSubText.textContent = "Deep-Space Relay Synchronized";
            toggleOfflineBtn.textContent = "Toggle Deep Space Mode";
            toggleOfflineBtn.style.background = "rgba(56, 189, 248, 0.15)";
            toggleOfflineBtn.style.color = "var(--cyan)";
        }

        // Render Sync Queue Table
        syncTableBody.innerHTML = "";
        if (syncQueue.length === 0) {
            syncTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--muted);">Sync queue is empty. All telemetry transmitted.</td></tr>`;
        } else {
            syncQueue.forEach((item) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${item.time}</td>
                    <td><strong>${item.type}</strong></td>
                    <td>${item.severity}</td>
                    <td><span style="color: ${item.status.includes('Synced') ? '#4ade80' : '#facc15'};">${item.status}</span></td>
                `;
                syncTableBody.appendChild(row);
            });
        }

        // Render Local Records Table
        recordsTableBody.innerHTML = "";
        localRecords.forEach((rec) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><strong>${rec.id}</strong></td>
                <td>${rec.category}</td>
                <td>${rec.summary}</td>
                <td style="color: var(--cyan);">${rec.storage}</td>
            `;
            recordsTableBody.appendChild(row);
        });
    }

    // Toggle Offline / Deep Space Mode
    toggleOfflineBtn.addEventListener("click", function () {
        isOffline = !isOffline;
        updateUI();
    });

    // Autonomous Triage Form Submit
    document.getElementById("triageForm").addEventListener("submit", function (e) {
        e.preventDefault();
        const symptom = document.getElementById("triageSymptom").value;
        const severity = Number(document.getElementById("triageSeverity").value);
        const notes = document.getElementById("triageNotes").value;

        let recommendation = "";
        if (severity >= 8) {
            recommendation = `CRITICAL ALERT [${symptom}]: Immediate isolation protocol required. Initiate onboard emergency medical kit, activate backup oxygen/hydration, and queue high-priority distress packet for ground telemetry pass.`;
        } else if (severity >= 4) {
            recommendation = `MODERATE PROTOCOL [${symptom}]: Apply locally stored treatment guidelines. Rest in zero-G stabilization harness, ingest electrolyte supplement, and monitor vitals for 4 hours.`;
        } else {
            recommendation = `NOMINAL PROTOCOL [${symptom}]: Minor symptom logged to local health repository. Maintain regular mission sleep and exercise schedule.`;
        }

        const resultBox = document.getElementById("triageResultBox");
        const resultText = document.getElementById("triageResultText");
        resultText.textContent = recommendation;
        resultBox.style.display = "block";

        // Add to sync queue and local records
        const newId = `TRG-${Math.floor(100 + Math.random() * 900)}`;
        syncQueue.push({
            id: newId,
            type: "Autonomous Triage",
            severity: `${symptom} (${severity}/10)`,
            status: isOffline ? "Queued (Offline)" : "Synced with Ground",
            time: "Just now"
        });

        localRecords.push({
            id: newId,
            category: "Autonomous Triage",
            summary: `${symptom} (Sev: ${severity})`,
            storage: "Encrypted Flash"
        });

        saveState();
        updateUI();
        this.reset();
    });

    // Sync Now Button
    document.getElementById("syncNowBtn").addEventListener("click", function () {
        if (isOffline) {
            alert("Cannot sync: Deep Space Blackout active. Reconnect ground link first.");
            return;
        }
        if (syncQueue.length === 0) {
            alert("Sync queue is already up to date.");
            return;
        }

        syncQueue.forEach(item => item.status = "Synced with Ground (18m delay)");
        saveState();
        updateUI();
        alert("Telemetry sync complete! All queued packets successfully transmitted to Earth mission control.");
    });

    // Clear Cache Button
    document.getElementById("clearRecordsBtn").addEventListener("click", function () {
        syncQueue = [];
        localRecords = [
            { id: "LREC-01", category: "Vitals Baseline", summary: "HR 68 bpm, BP 118/76", storage: "Encrypted Flash" }
        ];
        saveState();
        updateUI();
        alert("Local telemetry cache cleared.");
    });

    updateUI();
});