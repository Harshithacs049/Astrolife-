// ==========================================================================
// ASTROLIFE - ASTRONAUT PROFILE ONBOARDING & PERSISTENCE
// ==========================================================================

document.addEventListener("DOMContentLoaded", function () {
    const profileForm = document.getElementById("profileForm");
    const photoInput = document.getElementById("profilePhoto");
    const photoPreview = document.getElementById("photoPreview");
    const formMessage = document.getElementById("formMessage");
    const profileSummary = document.getElementById("profileSummary");
    const summaryContent = document.getElementById("summaryContent");
    const editProfileBtn = document.getElementById("editProfile");
    const continueBtn = document.getElementById("continueBtn");

    let astronautProfile = null;
    let savedPhotoData = null;

    // Helper to get trimmed input value
    function getValue(id) {
        const el = document.getElementById(id);
        return el ? el.value.trim() : "";
    }

    // Helper to set input value
    function setValue(id, val) {
        const el = document.getElementById(id);
        if (el && val !== undefined && val !== null) {
            el.value = val;
        }
    }

    // 1. Profile photo preview using FileReader (persists preview reliably)
    if (photoInput) {
        photoInput.addEventListener("change", function () {
            const file = this.files[0];
            if (!file) return;

            if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                alert("Please select a JPG, PNG or WebP image.");
                this.value = "";
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                alert("Image size must be less than 5 MB.");
                this.value = "";
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                savedPhotoData = e.target.result;
                displayPhoto(savedPhotoData);
            };
            reader.readAsDataURL(file);
        });
    }

    function displayPhoto(src) {
        if (!photoPreview || !src) return;
        photoPreview.innerHTML = "";
        const image = document.createElement("img");
        image.src = src;
        image.alt = "Astronaut profile preview";
        photoPreview.appendChild(image);
    }

    // 2. Display profile summary safely
    function showProfileSummary() {
        if (!astronautProfile || !summaryContent || !profileSummary) return;

        const fields = [
            ["Full Name", astronautProfile.name],
            ["Age", astronautProfile.age],
            ["Gender", astronautProfile.gender],
            ["Blood Group", astronautProfile.bloodGroup],
            ["Height", astronautProfile.height ? astronautProfile.height + " cm" : ""],
            ["Weight", astronautProfile.weight ? astronautProfile.weight + " kg" : ""],
            ["Medical History", astronautProfile.medicalHistory],
            ["Allergies", astronautProfile.allergies],
            ["Emergency Contact", astronautProfile.emergencyName],
            ["Emergency Phone", astronautProfile.emergencyPhone],
            ["Relationship", astronautProfile.relationship],
            ["Mission Name", astronautProfile.missionName],
            ["Launch Date", astronautProfile.launchDate],
            ["Mission Duration", astronautProfile.missionDuration ? astronautProfile.missionDuration + " days" : ""]
        ];

        summaryContent.replaceChildren();

        fields.forEach(function ([label, value]) {
            if (!value) return;

            const item = document.createElement("div");
            item.className = "summary-item";

            const strong = document.createElement("strong");
            strong.textContent = label + ": ";

            item.appendChild(strong);
            item.appendChild(document.createTextNode(value));

            summaryContent.appendChild(item);
        });

        profileSummary.hidden = false;
    }

    // 3. Save profile form
    if (profileForm) {
        profileForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const age = Number(getValue("age"));
            const phone = getValue("emergencyPhone");

            if (age < 18 || age > 100) {
                if (formMessage) formMessage.textContent = "Please enter a valid age (18 - 100).";
                return;
            }

            if (!/^\+?[0-9\s()-]{7,20}$/.test(phone)) {
                if (formMessage) formMessage.textContent = "Please enter a valid emergency phone number.";
                return;
            }

            astronautProfile = {
                name: getValue("fullName"),
                age: getValue("age"),
                gender: getValue("gender"),
                bloodGroup: getValue("bloodGroup"),
                height: getValue("height"),
                weight: getValue("weight"),
                medicalHistory: getValue("medicalHistory"),
                allergies: getValue("allergies"),
                emergencyName: getValue("emergencyName"),
                emergencyPhone: phone,
                relationship: getValue("relationship"),
                missionName: getValue("missionName"),
                launchDate: getValue("launchDate"),
                missionDuration: getValue("missionDuration"),
                photo: savedPhotoData
            };

            // Save to localStorage & update active user session
            localStorage.setItem("astronaut_profile", JSON.stringify(astronautProfile));
            if (astronautProfile.name) {
                sessionStorage.setItem("astro_user", astronautProfile.name);
            }

            showProfileSummary();
            if (formMessage) {
                formMessage.textContent = "Astronaut profile saved successfully!";
            }
            profileSummary.scrollIntoView({ behavior: "smooth" });
        });
    }

    // 4. Edit profile button
    if (editProfileBtn) {
        editProfileBtn.addEventListener("click", function () {
            if (profileSummary) profileSummary.hidden = true;
            if (profileForm) profileForm.scrollIntoView({ behavior: "smooth" });
        });
    }

    // 5. Continue to Dashboard button
    if (continueBtn) {
        continueBtn.addEventListener("click", function () {
            if (astronautProfile) {
                localStorage.setItem("astronaut_profile", JSON.stringify(astronautProfile));
                if (astronautProfile.name) {
                    sessionStorage.setItem("astro_user", astronautProfile.name);
                }
            }
            window.location.href = "dashboard.html";
        });
    }

    // 6. INITIAL LOAD: Pre-fill from existing profile or user session
    const savedProfileJson = localStorage.getItem("astronaut_profile");
    if (savedProfileJson) {
        try {
            astronautProfile = JSON.parse(savedProfileJson);
            if (astronautProfile) {
                setValue("fullName", astronautProfile.name);
                setValue("age", astronautProfile.age);
                setValue("gender", astronautProfile.gender);
                setValue("bloodGroup", astronautProfile.bloodGroup);
                setValue("height", astronautProfile.height);
                setValue("weight", astronautProfile.weight);
                setValue("medicalHistory", astronautProfile.medicalHistory);
                setValue("allergies", astronautProfile.allergies);
                setValue("emergencyName", astronautProfile.emergencyName);
                setValue("emergencyPhone", astronautProfile.emergencyPhone);
                setValue("relationship", astronautProfile.relationship);
                setValue("missionName", astronautProfile.missionName);
                setValue("launchDate", astronautProfile.launchDate);
                setValue("missionDuration", astronautProfile.missionDuration);

                if (astronautProfile.photo) {
                    savedPhotoData = astronautProfile.photo;
                    displayPhoto(savedPhotoData);
                }

                showProfileSummary();
            }
        } catch (err) {
            console.error("Error parsing saved astronaut profile:", err);
        }
    } else {
        // Pre-fill name from session if available
        const sessionUser = sessionStorage.getItem("astro_user");
        if (sessionUser && sessionUser !== "Commander") {
            setValue("fullName", sessionUser);
        }
    }
});
function generateAdaptiveRoutine(biometricData) {
    const tableBody = document.getElementById("routineTableBody");
    const alertsBox = document.getElementById("routineAlerts");
    const statusBadge = document.getElementById("routineStatusBadge");
    if (!tableBody || !alertsBox) return;

    // 1. Read user inputs from the profile form
    const age = parseInt(document.getElementById("age")?.value, 10) || 32;
    const weight = parseFloat(document.getElementById("weight")?.value) || 70;
    const height = parseFloat(document.getElementById("height")?.value) || 175;
    const allergies = (document.getElementById("allergies")?.value || "").trim();

    // Calculate daily hydration & caloric baseline
    const dailyWaterMl = Math.round(weight * 35);
    const hasAllergies = allergies.length > 0 && allergies.toLowerCase() !== "none";

    // 2. Analyze 7-day biometric trends
    const hrValues = biometricData.heartRate.values;
    const spo2Values = biometricData.spo2.values;
    const sleepValues = biometricData.sleep.values;

    const latestHR = hrValues[hrValues.length - 1];
    const minSpo2 = Math.min(...spo2Values);
    const avgSleep = sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length;

    const alerts = [];
    let isModified = false;

    if (avgSleep < 7.2) {
        isModified = true;
        alerts.push("Sleep Deficit Detected: 25-min NASA Power Nap inserted at 13:00 UTC.");
    }
    if (latestHR > 70 || Math.max(...hrValues) > 70) {
        isModified = true;
        alerts.push("Elevated HR Trend (>70 BPM): Morning workout shifted to Zone 2 steady cardio + extra electrolytes.");
    }
    if (minSpo2 <= 96) {
        isModified = true;
        alerts.push("SpO₂ Dip (≤96%): Cabin CO₂ scrubber check & 10-min pre-sleep box breathing scheduled.");
    }
    if (age > 45) {
        isModified = true;
        alerts.push(`Age Scaling (${age} yrs): Extended +15 min post-workout recovery & joint mobility added.`);
    }
    if (hasAllergies) {
        alerts.push(`Allergy Filter Active: Ration packs screened against "${allergies}".`);
    }

    // Update badge & alert banners
    statusBadge.textContent = isModified ? "Adaptive Protocol Active" : "Baseline Protocol Active";
    alertsBox.innerHTML = alerts.map(msg => `
        <div style="padding: 8px 12px; background: rgba(53, 223, 255, 0.08); border-left: 3px solid #35dfff; border-radius: 4px; font-size: 12.5px; color: #cbd5e1;">
            ${msg}
        </div>
    `).join("");

    // 3. Build adaptive schedule blocks
    const workoutProtocol = (Math.max(...hrValues) > 70)
        ? `45m Zone-2 Cycle + 45m Moderate Resistance${age > 45 ? " + 15m Mobility" : ""}`
        : `45m HIIT Ergometer + 60m ARED Strength${age > 45 ? " + 15m Mobility" : ""}`;

    const middayProtocol = (avgSleep < 7.2)
        ? `Balanced lunch (${hasAllergies ? "Allergy-Safe Rations" : "Standard Rations"}) + <strong>25-min Recovery Nap</strong>`
        : `Balanced lunch (${hasAllergies ? "Allergy-Safe Rations" : "Standard Rations"}) + 20-min decompression`;

    const eveningWindDown = (minSpo2 <= 96)
        ? "Low-blue lighting, vitals log & <strong>10-min guided box breathing</strong>"
        : "Low-blue lighting, vitals log & zero screens";

    const schedule = [
        { time: "06:00 – 06:30", block: "Wake & Vitals Scan", protocol: `Resting HR & SpO₂ check + 500 ml hydration (Daily goal: ${dailyWaterMl} ml)`, target: "HR 60–68 BPM" },
        { time: "06:30 – 07:30", block: "Nutrition & Briefing", protocol: `${hasAllergies ? "Allergy-screened" : "High-protein"} breakfast + Mission Control sync`, target: "SpO₂ ≥ 97%" },
        { time: "07:30 – 10:00", block: "Primary Mission Ops", protocol: "Core payload experiments & spacecraft diagnostics", target: "Peak Focus" },
        { time: "10:00 – 12:00", block: "Countermeasure Training", protocol: workoutProtocol, target: "HR 130–150 BPM" },
        { time: "12:00 – 13:30", block: "Midday Meal & Recovery", protocol: middayProtocol, target: "Cortisol Reset" },
        { time: "13:30 – 17:30", block: "Afternoon Ops & Checks", protocol: "Secondary research, ECLSS air checks & medical log", target: "Steady Vitals" },
        { time: "17:30 – 19:00", block: "Dinner & Crew Debrief", protocol: "Evening meal + Flight Surgeon telemetry review", target: "Caloric Balance" },
        { time: "19:00 – 21:30", block: "Pre-Sleep Protocol", protocol: eveningWindDown, target: "HR < 68 BPM" },
        { time: "21:30 – 06:00", block: "Scheduled Sleep Block", protocol: "Acoustic-shielded crew quarters rest cycle", target: "≥ 7.5 Hrs Sleep" }
    ];

    tableBody.innerHTML = schedule.map(row => `
        <tr style="border-bottom: 1px solid rgba(148, 163, 184, 0.12);">
            <td style="padding: 10px 8px; white-space: nowrap; color: #35dfff; font-weight: 600;">${row.time}</td>
            <td style="padding: 10px 8px; font-weight: 600;">${row.block}</td>
            <td style="padding: 10px 8px; color: #cbd5e1;">${row.protocol}</td>
            <td style="padding: 10px 8px; white-space: nowrap; color: #94a3b8;">${row.target}</td>
        </tr>
    `).join("");
}
