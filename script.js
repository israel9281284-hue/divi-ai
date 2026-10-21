```javascript
"use strict";

// ========================================
// DIVI AI — HOMEPAGE NAVIGATION
// ========================================

(function () {
    function setupDiviNavigation() {
        const homePage = document.getElementById("homePage");
        const aiAppScreen = document.getElementById("aiAppScreen");

        if (!homePage || !aiAppScreen) {
            console.error("Divi AI: Cannot find the homepage or chat screen.");
            return;
        }

        const pageIds = [
            "homeHero",
            "homeFeatures",
            "homeAbout",
            "homeContact"
        ];

        // Show one homepage section at a time.
        function showHomePage(pageId) {
            if (!pageIds.includes(pageId)) {
                pageId = "homeHero";
            }

            pageIds.forEach(function (id) {
                const section = document.getElementById(id);

                if (section) {
                    section.hidden = id !== pageId;
                }
            });

            document.querySelectorAll(".nav-tab").forEach(function (button) {
                button.classList.toggle(
                    "active",
                    button.dataset.page === pageId
                );
            });

            window.scrollTo(0, 0);
        }

        // Open the AI chat.
        window.openDiviAI = function () {
            homePage.hidden = true;
            aiAppScreen.hidden = false;

            homePage.style.display = "none";
            aiAppScreen.style.display = "flex";

            document.body.classList.add("chat-app");

            console.log("Divi AI chat opened.");
        };

        // Return to the homepage.
        window.returnToHome = function () {
            aiAppScreen.hidden = true;
            homePage.hidden = false;

            aiAppScreen.style.display = "none";
            homePage.style.display = "block";

            document.body.classList.remove("chat-app");

            showHomePage("homeHero");

            console.log("Returned to the Divi AI homepage.");
        };

        // Header tabs.
        document.querySelectorAll(".nav-tab").forEach(function (button) {
            button.addEventListener("click", function () {
                showHomePage(button.dataset.page);
            });
        });

        // Footer buttons and Explore Features.
        document.querySelectorAll("[data-open-page]").forEach(function (button) {
            button.addEventListener("click", function () {
                showHomePage(button.dataset.openPage);
            });
        });

        // Set the copyright year.
        const year = document.getElementById("copyrightYear");

        if (year) {
            year.textContent = new Date().getFullYear();
        }

        // Start on the homepage.
        showHomePage("homeHero");

        homePage.hidden = false;
        aiAppScreen.hidden = true;

        homePage.style.display = "block";
        aiAppScreen.style.display = "none";

        console.log("Divi AI navigation is ready.");
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            setupDiviNavigation,
            { once: true }
        );
    } else {
        setupDiviNavigation();
    }
})();
```
