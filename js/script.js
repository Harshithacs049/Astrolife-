// ==========================================================================
// ASTROLIFE - CLIENT-SIDE SCRIPT
// NASA Space Apps Challenge
// Phase 1: Interactive Navigation, ScrollSpy, Animations & Mobile Menu
// ==========================================================================

document.addEventListener("DOMContentLoaded", function () {

    // 1. DYNAMIC YEAR IN FOOTER
    const yearElem = document.getElementById("year");
    if (yearElem) {
        yearElem.textContent = new Date().getFullYear();
    }


    // 2. STICKY NAVBAR SCROLL ELEVATION
    const navbar = document.getElementById("navbar");
    function handleNavbarScroll() {
        if (!navbar) return;
        if (window.scrollY > 40) {
            navbar.classList.add("navbar-scrolled");
        } else {
            navbar.classList.remove("navbar-scrolled");
        }
    }
    window.addEventListener("scroll", handleNavbarScroll, { passive: true });
    handleNavbarScroll(); // Initial check on load


    // 3. MOBILE NAVIGATION MENU
    const menuToggle = document.getElementById("menuToggle");
    const navMenu = document.getElementById("navMenu");

    if (menuToggle && navMenu) {
        menuToggle.addEventListener("click", function (event) {
            event.stopPropagation();
            const isOpen = navMenu.classList.toggle("show");
            menuToggle.setAttribute("aria-expanded", isOpen);
        });

        // Close mobile menu when clicking any nav link
        navMenu.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                navMenu.classList.remove("show");
                menuToggle.setAttribute("aria-expanded", "false");
            });
        });

        // Close menu if user taps outside
        document.addEventListener("click", function (event) {
            if (!navMenu.contains(event.target) && !menuToggle.contains(event.target)) {
                if (navMenu.classList.contains("show")) {
                    navMenu.classList.remove("show");
                    menuToggle.setAttribute("aria-expanded", "false");
                }
            }
        });

        // Close menu on Escape key
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && navMenu.classList.contains("show")) {
                navMenu.classList.remove("show");
                menuToggle.setAttribute("aria-expanded", "false");
            }
        });
    }


    // 4. SCROLLSPY (ACTIVE NAVIGATION INDICATOR)
    const navLinks = document.querySelectorAll("#navMenu a");
    const observedSections = ["home", "about", "hazards", "features", "research"]
        .map(id => document.getElementById(id))
        .filter(Boolean);

    function updateActiveNavLink() {
        const scrollPosition = window.scrollY + 120; // Offset for navbar

        let currentSectionId = "";
        observedSections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute("id");
            }
        });

        // If at the very bottom of page, highlight research
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
            currentSectionId = "research";
        }

        if (currentSectionId) {
            navLinks.forEach(link => {
                const targetId = link.getAttribute("href").replace("#", "");
                if (targetId === currentSectionId) {
                    link.classList.add("active");
                } else {
                    link.classList.remove("active");
                }
            });
        }
    }

    window.addEventListener("scroll", updateActiveNavLink, { passive: true });
    updateActiveNavLink(); // Initial check on load


    // 5. SCROLL REVEAL ANIMATIONS (INTERSECTION OBSERVER)
    const animatedElements = document.querySelectorAll(
        ".about-card, .hazard-card, .feature-card, .research-highlight, .hero-stat-card"
    );

    if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        // Stagger entrance slightly for grouped elements
                        setTimeout(() => {
                            entry.target.classList.add("is-visible");
                        }, (index % 3) * 100);
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.15,
                rootMargin: "0px 0px -40px 0px"
            }
        );

        animatedElements.forEach(el => {
            el.classList.add("reveal-fade-up");
            revealObserver.observe(el);
        });
    } else {
        // Fallback for browsers without IntersectionObserver
        animatedElements.forEach(el => el.classList.add("is-visible"));
    }

    // 6. SESSION AWARE NAVIGATION
    if (sessionStorage.getItem("astro_logged_in") === "true") {
        const signInLink = document.querySelector('nav a[href="login.html"]');
        if (signInLink) {
            const user = window.AstroAuth ? AstroAuth.getCurrentUser() : null;
            if (user && user.role === "mission-control") {
                signInLink.href = "mission-control.html";
                signInLink.textContent = "Mission Control";
            } else if (user && user.role === "administrator") {
                signInLink.href = "admin.html";
                signInLink.textContent = "Admin Console";
            } else {
                signInLink.href = "dashboard.html";
                signInLink.textContent = "Dashboard";
            }
        }
    }

});


// 7. GET STARTED NAVIGATION
function getStarted() {
    if (sessionStorage.getItem("astro_logged_in") === "true") {
        const user = window.AstroAuth ? AstroAuth.getCurrentUser() : null;
        if (user && user.role === "mission-control") {
            window.location.href = "mission-control.html";
        } else if (user && user.role === "administrator") {
            window.location.href = "admin.html";
        } else {
            window.location.href = "dashboard.html";
        }
    } else {
        window.location.href = "login.html";
    }
}

// Make accessible to inline onclick handlers
window.getStarted = getStarted;
