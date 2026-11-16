// ==========================================================================
// ASTROLIFE - CORE SECURITY, CRYPTOGRAPHY, AUTHENTICATION & RBAC
// NASA Space Apps Challenge
// Roles: Astronaut | Mission Control / Medical Personnel | Administrator
// ==========================================================================

const AstroAuth = (function () {
    const STORAGE_USERS = "astrolife_users_v2";
    const STORAGE_SESSION = "astrolife_session_v2";
    const STORAGE_CONFIG = "astrolife_system_config";
    const STORAGE_AUDIT = "astrolife_audit_logs";
    const SALT = "astrolife_crypto_salt_2026";
    const SESSION_DURATION_HOURS = 12;

    // Default Configurable Scientifically Sourced Reference Limits (NASA Standards)
    const defaultConfig = {
        mission: {
            name: "Artemis VII - Mars Transit Mission",
            launchDate: "2026-10-04",
            durationDays: 180,
            currentSol: 42,
            spacecraft: "Orion Crew Module / Deep Space Habitat",
            orbit: "Trans-Mars Injection Trajectory"
        },
        thresholds: {
            heartRate: { name: "Heart Rate", unit: "BPM", safeMin: 50, safeMax: 90, warnMin: 45, warnMax: 105, critMin: 40, critMax: 120 },
            spo2: { name: "Blood Oxygen Saturation (SpO2)", unit: "%", safeMin: 95, safeMax: 100, warnMin: 92, warnMax: 94, critMin: 0, critMax: 91 },
            bloodPressureSys: { name: "Systolic Blood Pressure", unit: "mmHg", safeMin: 90, safeMax: 120, warnMin: 85, warnMax: 135, critMin: 75, critMax: 150 },
            bloodPressureDia: { name: "Diastolic Blood Pressure", unit: "mmHg", safeMin: 60, safeMax: 80, warnMin: 55, warnMax: 88, critMin: 45, critMax: 95 },
            bodyTemp: { name: "Body Temperature", unit: "°C", safeMin: 36.1, safeMax: 37.2, warnMin: 35.8, warnMax: 37.8, critMin: 35.0, critMax: 38.5 },
            respiratoryRate: { name: "Respiratory Rate", unit: "breaths/min", safeMin: 12, safeMax: 20, warnMin: 10, warnMax: 24, critMin: 8, critMax: 28 },
            bloodGlucose: { name: "Blood Glucose (Fasting)", unit: "mg/dL", safeMin: 70, safeMax: 100, warnMin: 65, warnMax: 130, critMin: 55, critMax: 160 },
            sleepDuration: { name: "Sleep Duration", unit: "hrs", safeMin: 7.0, safeMax: 9.0, warnMin: 6.0, warnMax: 6.9, critMin: 0, critMax: 5.9 },
            physicalActivity: { name: "Physical Activity", unit: "mins/day", safeMin: 90, safeMax: 180, warnMin: 60, warnMax: 89, critMin: 0, critMax: 59 },
            stressLevel: { name: "Stress Level", unit: "1-10", safeMin: 1, safeMax: 4, warnMin: 5, warnMax: 7, critMin: 8, critMax: 10 },
            hydrationLevel: { name: "Hydration Intake", unit: "L/day", safeMin: 2.5, safeMax: 4.0, warnMin: 1.8, warnMax: 2.4, critMin: 0, critMax: 1.7 }
        }
    };

    // 1. Cryptographic Password Hashing (SHA-256 with Salt via Web Crypto API)
    async function hashPassword(password) {
        if (!window.crypto || !window.crypto.subtle) {
            // Fallback lightweight hash for non-crypto environments
            let hash = 0;
            const str = SALT + password + SALT;
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash |= 0;
            }
            return "sim_hash_" + Math.abs(hash).toString(16);
        }
        const encoder = new TextEncoder();
        const data = encoder.encode(SALT + password + SALT);
        const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    }

    // 2. Initialize Default Seed Accounts & Config
    async function initSeedData() {
        if (!localStorage.getItem(STORAGE_CONFIG)) {
            localStorage.setItem(STORAGE_CONFIG, JSON.stringify(defaultConfig));
        }

        const existingUsers = JSON.parse(localStorage.getItem(STORAGE_USERS) || "[]");
        if (existingUsers.length === 0) {
            const astronautHash = await hashPassword("Astronaut2026!");
            const medControlHash = await hashPassword("MissionDoc2026!");
            const adminHash = await hashPassword("AdminMaster2026!");

            const seedUsers = [
                {
                    id: "usr_astro_01",
                    email: "astronaut@astrolife.space",
                    passwordHash: astronautHash,
                    name: "Dr. Alexander Cole",
                    callsign: "Orion-1",
                    role: "astronaut",
                    department: "Crew Health & Life Sciences",
                    active: true,
                    createdAt: "2026-10-01T08:00:00Z"
                },
                {
                    id: "usr_astro_02",
                    email: "sarah.vance@astrolife.space",
                    passwordHash: astronautHash,
                    name: "Commander Sarah Vance",
                    callsign: "Artemis-2",
                    role: "astronaut",
                    department: "Flight Operations & Command",
                    active: true,
                    createdAt: "2026-10-01T08:00:00Z"
                },
                {
                    id: "usr_med_01",
                    email: "medcontrol@astrolife.space",
                    passwordHash: medControlHash,
                    name: "Dr. Evelyn Reed",
                    callsign: "Flight Surgeon",
                    role: "mission-control",
                    department: "Houston MCC - Biomedical Engineering & Flight Medicine",
                    active: true,
                    createdAt: "2026-10-01T08:00:00Z"
                },
                {
                    id: "usr_admin_01",
                    email: "admin@astrolife.space",
                    passwordHash: adminHash,
                    name: "Director Marcus Vance",
                    callsign: "Flight Director",
                    role: "administrator",
                    department: "Mission Operations Directorate",
                    active: true,
                    createdAt: "2026-10-01T08:00:00Z"
                }
            ];
            localStorage.setItem(STORAGE_USERS, JSON.stringify(seedUsers));
            logAudit("SYSTEM_SEED", "Default mission accounts seeded with SHA-256 hashed passwords.", "SYSTEM");
        }
    }

    // 3. Audit Logging
    function logAudit(event, details, actor) {
        const logs = JSON.parse(localStorage.getItem(STORAGE_AUDIT) || "[]");
        logs.unshift({
            timestamp: new Date().toISOString(),
            event,
            details,
            actor: actor || getCurrentUser()?.email || "ANONYMOUS"
        });
        if (logs.length > 200) logs.pop();
        localStorage.setItem(STORAGE_AUDIT, JSON.stringify(logs));
    }

    // 4. Password Validation
    function validatePasswordStrength(password) {
        const issues = [];
        if (password.length < 8) issues.push("Minimum 8 characters required");
        if (!/[A-Z]/.test(password)) issues.push("At least one uppercase letter (A-Z)");
        if (!/[a-z]/.test(password)) issues.push("At least one lowercase letter (a-z)");
        if (!/[0-9]/.test(password)) issues.push("At least one numeric digit (0-9)");
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) issues.push("At least one special character");
        return {
            isValid: issues.length === 0,
            score: Math.max(0, 5 - issues.length),
            issues
        };
    }

    // 5. Authentication: Login
    async function login(email, password, rememberMe = false) {
        await initSeedData();
        const users = JSON.parse(localStorage.getItem(STORAGE_USERS) || "[]");
        const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

        if (!user) {
            logAudit("LOGIN_FAILED", `Login failed for non-existent email: ${email}`, email);
            return { success: false, message: "Invalid mission credentials or unknown account." };
        }

        if (!user.active) {
            logAudit("LOGIN_BLOCKED", `Disabled account attempted login: ${email}`, email);
            return { success: false, message: "Account has been deactivated by Mission Administrator." };
        }

        const inputHash = await hashPassword(password);
        if (user.passwordHash !== inputHash) {
            logAudit("LOGIN_FAILED", `Invalid password entered for user: ${email}`, email);
            return { success: false, message: "Invalid access code or password." };
        }

        // Generate Session Token
        const sessionToken = "atk_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
        const expiresAt = Date.now() + (SESSION_DURATION_HOURS * 3600 * 1000);

        const sessionData = {
            token: sessionToken,
            userId: user.id,
            email: user.email,
            name: user.name,
            callsign: user.callsign,
            role: user.role,
            department: user.department,
            loginTime: new Date().toISOString(),
            expiresAt: expiresAt
        };

        sessionStorage.setItem(STORAGE_SESSION, JSON.stringify(sessionData));
        if (rememberMe) {
            localStorage.setItem(STORAGE_SESSION + "_remember", JSON.stringify(sessionData));
        }

        // Backward compatibility for existing dashboard user elements
        sessionStorage.setItem("astro_user", user.name);
        sessionStorage.setItem("astro_logged_in", "true");

        logAudit("LOGIN_SUCCESS", `User ${user.email} logged in with role: ${user.role}`, user.email);

        return {
            success: true,
            user: sessionData,
            redirectUrl: getRoleDashboardUrl(user.role)
        };
    }

    // 6. Registration with Role Assignment
    async function register({ email, password, name, role = "astronaut", callsign = "", department = "" }) {
        await initSeedData();
        const users = JSON.parse(localStorage.getItem(STORAGE_USERS) || "[]");
        const existing = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

        if (existing) {
            return { success: false, message: "An account with this mission email already exists." };
        }

        const pwdCheck = validatePasswordStrength(password);
        if (!pwdCheck.isValid) {
            return { success: false, message: pwdCheck.issues.join(". ") };
        }

        const passwordHash = await hashPassword(password);
        const newUser = {
            id: "usr_" + Date.now().toString(36),
            email: email.trim().toLowerCase(),
            passwordHash: passwordHash,
            name: name.trim(),
            callsign: callsign.trim() || (role === "astronaut" ? "Cadet" : "Staff"),
            role: role,
            department: department.trim() || (role === "astronaut" ? "Crew Health Operations" : (role === "mission-control" ? "Biomedical Flight Support" : "Administration")),
            active: true,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
        logAudit("USER_REGISTERED", `New user created: ${newUser.email} (${newUser.role})`, newUser.email);

        return { success: true, user: newUser };
    }

    // 7. Session Validation & Current User
    function getCurrentUser() {
        let rawSession = sessionStorage.getItem(STORAGE_SESSION);
        if (!rawSession) {
            rawSession = localStorage.getItem(STORAGE_SESSION + "_remember");
            if (rawSession) {
                sessionStorage.setItem(STORAGE_SESSION, rawSession);
            }
        }

        if (!rawSession) return null;

        try {
            const session = JSON.parse(rawSession);
            if (session.expiresAt && Date.now() > session.expiresAt) {
                logout();
                return null;
            }
            return session;
        } catch (e) {
            return null;
        }
    }

    // 8. Logout
    function logout() {
        const user = getCurrentUser();
        if (user) {
            logAudit("LOGOUT", `User logged out: ${user.email}`, user.email);
        }
        sessionStorage.removeItem(STORAGE_SESSION);
        sessionStorage.removeItem("astro_user");
        sessionStorage.removeItem("astro_logged_in");
        localStorage.removeItem(STORAGE_SESSION + "_remember");
        window.location.href = "login.html";
    }

    // 9. Role-Based Access Control (RBAC) Enforcer
    function requireRole(allowedRoles) {
        const user = getCurrentUser();
        if (!user) {
            window.location.href = `login.html?unauthorized=true&redirect=${encodeURIComponent(window.location.pathname)}`;
            return false;
        }

        if (!allowedRoles.includes(user.role)) {
            // Present friendly access restriction or redirect
            renderAccessDeniedBanner(user, allowedRoles);
            return false;
        }

        return true;
    }

    function getRoleDashboardUrl(role) {
        switch (role) {
            case "mission-control":
                return "mission-control.html";
            case "administrator":
                return "admin.html";
            case "astronaut":
            default:
                return "dashboard.html";
        }
    }

    function getRoleBadge(role) {
        switch (role) {
            case "administrator":
                return `<span class="auth-badge" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4);">✦ ADMINISTRATOR</span>`;
            case "mission-control":
                return `<span class="auth-badge" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4);">✦ MISSION CONTROL / MEDICAL</span>`;
            case "astronaut":
            default:
                return `<span class="auth-badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4);">✦ ASTRONAUT CREW</span>`;
        }
    }

    function renderAccessDeniedBanner(user, allowedRoles) {
        document.body.innerHTML = `
            <div style="min-height: 100vh; background: #050816; color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; padding: 20px;">
                <div style="background: #0d1428; border: 1px solid rgba(248, 113, 113, 0.4); border-radius: 16px; padding: 40px; max-width: 540px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.7);">
                    <div style="font-size: 48px; margin-bottom: 16px;">🔒</div>
                    <h2 style="color: #f87171; margin-bottom: 12px; font-size: 24px;">Access Authorization Required</h2>
                    <p style="color: #9ba9c5; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                        Your current authenticated role (<strong>${user.role.toUpperCase()}</strong>) does not have clearance to view this resource. 
                        Required roles: <strong>${allowedRoles.join(" or ").toUpperCase()}</strong>.
                    </p>
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <a href="${getRoleDashboardUrl(user.role)}" style="background: #38bdf8; color: #050816; font-weight: 700; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Go to Your Dashboard</a>
                        <button onclick="AstroAuth.logout()" style="background: rgba(248, 113, 113, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.4); padding: 12px 20px; border-radius: 8px; cursor: pointer;">Log Out</button>
                    </div>
                </div>
            </div>
        `;
    }

    // 10. System Configuration Getter & Setter
    function getConfig() {
        const raw = localStorage.getItem(STORAGE_CONFIG);
        return raw ? JSON.parse(raw) : defaultConfig;
    }

    function saveConfig(newConfig) {
        localStorage.setItem(STORAGE_CONFIG, JSON.stringify(newConfig));
        logAudit("CONFIG_UPDATE", "System monitoring thresholds or mission parameters modified.", getCurrentUser()?.email);
    }

    // 11. User Management for Administrators
    function getAllUsers() {
        return JSON.parse(localStorage.getItem(STORAGE_USERS) || "[]");
    }

    function updateUserRole(userId, newRole) {
        const users = getAllUsers();
        const idx = users.findIndex(u => u.id === userId);
        if (idx !== -1) {
            users[idx].role = newRole;
            localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
            logAudit("ROLE_CHANGED", `User ${users[idx].email} role updated to: ${newRole}`);
            return true;
        }
        return false;
    }

    function toggleUserActive(userId) {
        const users = getAllUsers();
        const idx = users.findIndex(u => u.id === userId);
        if (idx !== -1) {
            users[idx].active = !users[idx].active;
            localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
            logAudit("USER_STATUS_TOGGLED", `User ${users[idx].email} active status set to: ${users[idx].active}`);
            return users[idx].active;
        }
        return false;
    }

    function getAuditLogs() {
        return JSON.parse(localStorage.getItem(STORAGE_AUDIT) || "[]");
    }

    // Initialize seeds on load
    initSeedData();

    return {
        login,
        register,
        logout,
        getCurrentUser,
        requireRole,
        validatePasswordStrength,
        getRoleDashboardUrl,
        getRoleBadge,
        getConfig,
        saveConfig,
        getAllUsers,
        updateUserRole,
        toggleUserActive,
        getAuditLogs,
        logAudit,
        hashPassword
    };
})();

// Export globally
window.AstroAuth = AstroAuth;

// DOM Hookups for Login / Register / Profile pages
document.addEventListener("DOMContentLoaded", function () {
    // Password visibility toggle
    document.querySelectorAll(".password-toggle-btn").forEach(button => {
        button.addEventListener("click", function () {
            const targetInputId = this.getAttribute("data-target");
            const inputField = document.getElementById(targetInputId);
            if (!inputField) return;

            if (inputField.type === "password") {
                inputField.type = "text";
                this.setAttribute("aria-label", "Hide password");
                this.innerHTML = "👁‍🗨";
            } else {
                inputField.type = "password";
                this.setAttribute("aria-label", "Show password");
                this.innerHTML = "👁";
            }
        });
    });

    // Helper functions for validation
    function showError(inputId, errorId, message) {
        const input = document.getElementById(inputId);
        const error = document.getElementById(errorId);
        if (input) input.classList.add("is-invalid");
        if (error) {
            error.textContent = message;
            error.classList.add("is-visible");
        }
    }

    function clearError(inputId, errorId) {
        const input = document.getElementById(inputId);
        const error = document.getElementById(errorId);
        if (input) input.classList.remove("is-invalid");
        if (error) {
            error.textContent = "";
            error.classList.remove("is-visible");
        }
    }

    ["loginEmail", "loginPassword", "regName", "regEmail", "regPassword", "regConfirmPassword"].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener("input", function () {
                clearError(id, id + "Error");
            });
        }
    });

    // Live Password Strength Indicator on Registration
    const regPassword = document.getElementById("regPassword");
    const pwdStrengthBar = document.getElementById("pwdStrengthBar");
    const pwdStrengthText = document.getElementById("pwdStrengthText");
    if (regPassword && pwdStrengthBar) {
        regPassword.addEventListener("input", function () {
            const res = AstroAuth.validatePasswordStrength(this.value);
            const scorePct = (res.score / 5) * 100;
            pwdStrengthBar.style.width = scorePct + "%";
            if (res.score <= 2) {
                pwdStrengthBar.style.background = "#f87171";
                if (pwdStrengthText) pwdStrengthText.textContent = "Weak Access Code";
            } else if (res.score <= 4) {
                pwdStrengthBar.style.background = "#facc15";
                if (pwdStrengthText) pwdStrengthText.textContent = "Moderate - Add Special Characters/Numbers";
            } else {
                pwdStrengthBar.style.background = "#4ade80";
                if (pwdStrengthText) pwdStrengthText.textContent = "Strong Aerospace Access Code";
            }
        });
    }

    // Login Form Handler
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const emailInput = document.getElementById("loginEmail");
            const passwordInput = document.getElementById("loginPassword");
            const rememberMe = document.getElementById("rememberMe");
            const submitBtn = document.getElementById("loginSubmitBtn");
            const alertBox = document.getElementById("authAlert");

            clearError("loginEmail", "loginEmailError");
            clearError("loginPassword", "loginPasswordError");

            if (!emailInput.value.trim()) {
                showError("loginEmail", "loginEmailError", "Email address is required.");
                return;
            }
            if (!passwordInput.value) {
                showError("loginPassword", "loginPasswordError", "Password is required.");
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span>Verifying Mission Authorization...</span>`;

            try {
                const result = await AstroAuth.login(
                    emailInput.value.trim(),
                    passwordInput.value,
                    rememberMe ? rememberMe.checked : false
                );

                if (result.success) {
                    if (alertBox) {
                        alertBox.className = "auth-alert auth-alert-success is-visible";
                        alertBox.textContent = `Authorization granted. Welcome aboard, ${result.user.name}!`;
                    }
                    setTimeout(() => {
                        window.location.href = result.redirectUrl;
                    }, 600);
                } else {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `Authorize & Log In <span>→</span>`;
                    if (alertBox) {
                        alertBox.className = "auth-alert auth-alert-error is-visible";
                        alertBox.textContent = result.message;
                    } else {
                        showError("loginPassword", "loginPasswordError", result.message);
                    }
                }
            } catch (err) {
                console.error("Login exception:", err);
                submitBtn.disabled = false;
                submitBtn.innerHTML = `Authorize & Log In <span>→</span>`;
            }
        });

        // Demo autofill buttons
        document.querySelectorAll("[data-demo-role]").forEach(btn => {
            btn.addEventListener("click", function () {
                const role = this.getAttribute("data-demo-role");
                const emailInput = document.getElementById("loginEmail");
                const passwordInput = document.getElementById("loginPassword");
                if (role === "astronaut") {
                    if (emailInput) emailInput.value = "astronaut@astrolife.space";
                    if (passwordInput) passwordInput.value = "Astronaut2026!";
                } else if (role === "mission-control") {
                    if (emailInput) emailInput.value = "medcontrol@astrolife.space";
                    if (passwordInput) passwordInput.value = "MissionDoc2026!";
                } else if (role === "administrator") {
                    if (emailInput) emailInput.value = "admin@astrolife.space";
                    if (passwordInput) passwordInput.value = "AdminMaster2026!";
                }
                clearError("loginEmail", "loginEmailError");
                clearError("loginPassword", "loginPasswordError");
            });
        });
    }

    // Register Form Handler
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const nameInput = document.getElementById("regName");
            const emailInput = document.getElementById("regEmail");
            const roleInput = document.getElementById("regRole");
            const callsignInput = document.getElementById("regCallsign");
            const departmentInput = document.getElementById("regDepartment");
            const passwordInput = document.getElementById("regPassword");
            const confirmInput = document.getElementById("regConfirmPassword");
            const termsCheckbox = document.getElementById("regTerms");
            const submitBtn = document.getElementById("registerSubmitBtn");
            const alertBox = document.getElementById("authAlert");

            let hasError = false;

            if (!nameInput.value.trim()) {
                showError("regName", "regNameError", "Full name is required.");
                hasError = true;
            }
            if (!emailInput.value.trim()) {
                showError("regEmail", "regEmailError", "Email address is required.");
                hasError = true;
            }
            if (!passwordInput.value) {
                showError("regPassword", "regPasswordError", "Password is required.");
                hasError = true;
            } else {
                const strength = AstroAuth.validatePasswordStrength(passwordInput.value);
                if (!strength.isValid) {
                    showError("regPassword", "regPasswordError", strength.issues[0]);
                    hasError = true;
                }
            }
            if (confirmInput.value !== passwordInput.value) {
                showError("regConfirmPassword", "regConfirmPasswordError", "Passwords do not match.");
                hasError = true;
            }
            if (!termsCheckbox.checked) {
                showError("regTerms", "regTermsError", "You must accept the AstroLife data & flight protocols.");
                hasError = true;
            }

            if (hasError) return;

            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span>Creating Encrypted Profile...</span>`;

            try {
                const res = await AstroAuth.register({
                    name: nameInput.value.trim(),
                    email: emailInput.value.trim(),
                    password: passwordInput.value,
                    role: roleInput ? roleInput.value : "astronaut",
                    callsign: callsignInput ? callsignInput.value.trim() : "",
                    department: departmentInput ? departmentInput.value.trim() : ""
                });

                if (res.success) {
                    window.location.href = "login.html?registered=true";
                } else {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `Create Mission Account <span>→</span>`;
                    if (alertBox) {
                        alertBox.className = "auth-alert auth-alert-error is-visible";
                        alertBox.textContent = res.message;
                    } else {
                        showError("regEmail", "regEmailError", res.message);
                    }
                }
            } catch (err) {
                console.error("Register exception:", err);
                submitBtn.disabled = false;
                submitBtn.innerHTML = `Create Mission Account <span>→</span>`;
            }
        });
    }

    // Top Nav User Info Display & Logout Button hookup
    const user = AstroAuth.getCurrentUser();
    const navUserName = document.getElementById("dashboardUserName");
    const navUserAvatar = document.getElementById("userAvatar");
    const welcomeName = document.getElementById("welcomeName");
    const userRoleBadge = document.getElementById("userRoleBadge");

    if (user) {
        if (navUserName) navUserName.textContent = user.name;
        if (welcomeName) welcomeName.textContent = user.name;
        if (navUserAvatar) navUserAvatar.textContent = user.name.charAt(0).toUpperCase();
        if (userRoleBadge) {
            userRoleBadge.innerHTML = AstroAuth.getRoleBadge(user.role);
        }
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            AstroAuth.logout();
        });
    }
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