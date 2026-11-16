// ==========================================================================
// ASTROLIFE - NUTRITION & HYDRATION MANAGEMENT ENGINE
// Phase 3: Calorie Tracking, Macros, Critical Micronutrients & Deficiency Analysis
// ==========================================================================

document.addEventListener("DOMContentLoaded", function () {
    const STORAGE_KEY_MEALS = "astrolife_nutrition_meals";
    const STORAGE_KEY_WATER = "astrolife_hydration_total";

    // Default baseline meals for Sol 42
    const defaultMeals = [
        { time: "07:30", category: "Breakfast", name: "Rehydrated Eggs & Whole-Wheat Tortilla", calories: 380, protein: 22, water: 150 },
        { time: "12:15", category: "Lunch", name: "Thermo-Stabilized Chicken & Brown Rice", calories: 540, protein: 38, water: 200 },
        { time: "15:45", category: "EVA Snack", name: "High-Protein Electrolyte Shake", calories: 260, protein: 30, water: 350 },
        { time: "19:00", category: "Dinner", name: "Freeze-Dried Beef Stroganoff & Quinoa", calories: 620, protein: 22, water: 250 },
        { time: "21:30", category: "EVA Snack", name: "Vitamin-D Fortified Almond Packet & Hydration Pouch", calories: 250, protein: 0, water: 500 }
    ];

    let meals = JSON.parse(localStorage.getItem(STORAGE_KEY_MEALS)) || [...defaultMeals];
    
    // Calculate initial totals from meals or default water
    function calculateTotals() {
        let totalCal = meals.reduce((sum, m) => sum + Number(m.calories), 0);
        let totalPro = meals.reduce((sum, m) => sum + Number(m.protein), 0);
        let totalWaterMl = meals.reduce((sum, m) => sum + Number(m.water), 0);
        return {
            calories: totalCal,
            protein: totalPro,
            water: Number((totalWaterMl / 1000).toFixed(2)) // Convert mL to Liters
        };
    }

    let currentTotals = calculateTotals();

    // UI Elements
    const calDisplay = document.getElementById("calDisplay");
    const calTargetDisplay = document.getElementById("calTargetDisplay");
    const waterDisplay = document.getElementById("waterDisplay");
    const waterTargetDisplay = document.getElementById("waterTargetDisplay");
    const proteinDisplay = document.getElementById("proteinDisplay");
    const balanceIndexDisplay = document.getElementById("balanceIndexDisplay");
    
    const carbGrams = document.getElementById("carbGrams");
    const carbBar = document.getElementById("carbBar");
    const proteinPercent = document.getElementById("proteinPercent");
    const proteinBar = document.getElementById("proteinBar");
    const fatGrams = document.getElementById("fatGrams");
    const fatBar = document.getElementById("fatBar");

    const deficiencyContainer = document.getElementById("deficiencyRisksContainer");
    const nutrRecommendationText = document.getElementById("nutrRecommendationText");
    const mealHistoryTableBody = document.getElementById("mealHistoryTableBody");
    const hydrationReminderText = document.getElementById("hydrationReminderText");

    function saveAndRefresh() {
        localStorage.setItem(STORAGE_KEY_MEALS, JSON.stringify(meals));
        updateDashboard();
    }

    function updateDashboard() {
        currentTotals = calculateTotals();
        const targetCal = 2800;
        const targetWater = 2.50; // Liters
        const targetProtein = 110; // grams

        // 1. Top Metric Cards
        calDisplay.textContent = `${currentTotals.calories.toLocaleString()} kcal`;
        let calPct = ((currentTotals.calories / targetCal) * 100).toFixed(1);
        calTargetDisplay.textContent = `Target: ${targetCal.toLocaleString()} kcal (${calPct}%)`;

        waterDisplay.textContent = `${currentTotals.water.toFixed(2)} L`;
        let waterPct = ((currentTotals.water / targetWater) * 100).toFixed(1);
        waterTargetDisplay.textContent = `Target: ${targetWater.toFixed(2)} L (${waterPct}%)`;

        proteinDisplay.textContent = `${currentTotals.protein} g`;

        // Balance Index logic
        if (currentTotals.calories < 2000 || currentTotals.water < 1.8) {
            balanceIndexDisplay.textContent = "DEFICIT WARNING";
            balanceIndexDisplay.style.color = "#f87171";
        } else {
            balanceIndexDisplay.textContent = "BALANCED";
            balanceIndexDisplay.style.color = "#4ade80";
        }

        // 2. Macronutrient Proportions (Estimating Carbs and Fats based on calories)
        // ~50% Carbs (4 kcal/g), ~20% Protein (4 kcal/g), ~30% Fats (9 kcal/g)
        let estCarbs = Math.round((currentTotals.calories * 0.52) / 4);
        let estFat = Math.round((currentTotals.calories * 0.28) / 9);

        carbGrams.textContent = `${estCarbs} g (52%)`;
        carbBar.style.width = "52%";

        proteinPercent.textContent = `${currentTotals.protein} g (19%)`;
        let proBarVal = Math.min(Math.round((currentTotals.protein / targetProtein) * 100), 100);
        proteinBar.style.width = `${proBarVal}%`;

        fatGrams.textContent = `${estFat} g (29%)`;
        fatBar.style.width = "29%";

        // 3. Hydration Reminder Banner Update
        if (currentTotals.water >= targetWater) {
            hydrationReminderText.textContent = `Daily fluid target of ${targetWater} L successfully met. Maintain standard sipping schedule.`;
        } else {
            let deficitMl = Math.round((targetWater - currentTotals.water) * 1000);
            hydrationReminderText.textContent = `Fluid intake is ${deficitMl} mL behind schedule. Drink electrolyte fluid prior to next mission activity.`;
        }

        // 4. Render Deficiency Risk Indicators
        renderDeficiencies(currentTotals);

        // 5. Render Meal History Table
        renderMealHistory();
    }

    function renderDeficiencies(totals) {
        let risks = [];

        if (totals.water < 2.0) {
            risks.push({
                title: "Dehydration & Orthostatic Hypotension Risk",
                level: "MODERATE",
                badgeClass: "status-watch",
                desc: "Microgravity fluid redistribution blunts thirst mechanisms. Low water intake increases post-flight orthostatic intolerance risk."
            });
        } else {
            risks.push({
                title: "Hydration Status: Optimal",
                level: "LOW",
                badgeClass: "status-optimal",
                desc: "Fluid consumption meets NASA crew countermeasure protocols for blood volume maintenance."
            });
        }

        if (totals.protein < 95) {
            risks.push({
                title: "Myofibrillar Protein Catabolism (Sarcopenia)",
                level: "ELEVATED",
                badgeClass: "status-alert",
                desc: "Protein intake below 1.5 g/kg threshold. Accelerates nitrogen excretion and muscle mass loss during weightless unloading."
            });
        } else {
            risks.push({
                title: "Muscle Protein Synthesis Protection",
                level: "LOW",
                badgeClass: "status-optimal",
                desc: "Amino acid availability is sufficient to support ARED resistive exercise muscle recovery."
            });
        }

        deficiencyContainer.innerHTML = risks.map(r => `
            <div class="deficiency-card">
                <div class="deficiency-header">
                    <strong style="font-size: 13.5px; color: #fff;">${r.title}</strong>
                    <span class="status-pill ${r.badgeClass}">${r.level} RISK</span>
                </div>
                <p style="font-size: 12px; color: var(--muted); margin: 0; line-height: 1.5;">${r.desc}</p>
            </div>
        `).join("");

        // Update recommendation text dynamically
        if (totals.calories < 2400) {
            nutrRecommendationText.textContent = "Caloric intake is currently below energy expenditure estimates. Increase carbohydrate density rations to prevent glycogen depletion and chronic fatigue.";
        } else {
            nutrRecommendationText.textContent = "Metabolic intake is well-aligned with mission parameters. Maintain scheduled micronutrient supplementation (Vitamin D3 + Calcium) to protect skeletal integrity.";
        }
    }

    function renderMealHistory() {
        mealHistoryTableBody.innerHTML = "";
        meals.slice().reverse().forEach(m => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><strong>${m.time}</strong></td>
                <td><span style="color: var(--cyan);">${m.category}</span></td>
                <td>${m.name}</td>
                <td>${m.calories} kcal</td>
                <td>${m.protein} g</td>
                <td>${m.water} mL</td>
            `;
            mealHistoryTableBody.appendChild(row);
        });
    }

    // Event Listener: Quick Add 350 mL Water Button
    document.getElementById("quickLog350WaterBtn").addEventListener("click", function () {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        meals.push({
            time: timeStr,
            category: "EVA Snack",
            name: "Targeted Electrolyte Hydration Pouch",
            calories: 40,
            protein: 0,
            water: 350
        });
        saveAndRefresh();
        alert("Successfully logged 350 mL electrolyte fluid intake!");
    });

    // Event Listener: Quick Space Ration Presets
    document.querySelectorAll(".quick-meal-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            const preset = this.getAttribute("data-preset");
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            let presetObj = {};
            if (preset === "scramble") {
                presetObj = { time: timeStr, category: "Breakfast", name: "Rehydrated Eggs & Whole-Wheat Tortilla", calories: 380, protein: 22, water: 150 };
            } else if (preset === "chicken") {
                presetObj = { time: timeStr, category: "Lunch", name: "Thermo-Stabilized Chicken & Brown Rice", calories: 540, protein: 38, water: 200 };
            } else if (preset === "shake") {
                presetObj = { time: timeStr, category: "EVA Snack", name: "High-Protein Electrolyte Shake", calories: 260, protein: 30, water: 350 };
            }

            meals.push(presetObj);
            saveAndRefresh();
            alert(`Logged preset: ${presetObj.name}`);
        });
    });

    // Event Listener: Custom Meal Form Submission
    document.getElementById("customMealForm").addEventListener("submit", function (e) {
        e.preventDefault();
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const name = document.getElementById("mealNameInput").value.trim();
        const calories = Number(document.getElementById("mealCalInput").value);
        const protein = Number(document.getElementById("mealProteinInput").value);
        const water = Number(document.getElementById("mealWaterInput").value);
        const category = document.getElementById("mealTypeInput").value;

        if (!name || isNaN(calories) || isNaN(protein) || isNaN(water)) return;

        meals.push({
            time: timeStr,
            category: category,
            name: name,
            calories: calories,
            protein: protein,
            water: water
        });

        saveAndRefresh();
        this.reset();
        alert("Food and hydration entry successfully recorded into mission metabolic logs.");
    });

    updateDashboard();
});