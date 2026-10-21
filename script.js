```javascript
"use strict";

(function () {
    function initDiviAI() {
        const home = document.getElementById("homePage");
        const app = document.getElementById("aiAppScreen");

        if (!home || !app) {
            console.error("Divi AI: Check homePage and aiAppScreen IDs.");
            return;
        }

        const pages = ["homeHero", "homeFeatures", "homeAbout", "homeContact"];

        // Show the selected homepage tab.
        function showPage(id) {
            if (!pages.includes(id)) id = "homeHero";

            pages.forEach(function (pageId) {
                const section = document.getElementById(pageId);
                if (section) section.hidden = pageId !== id;
            });

            document.querySelectorAll(".nav-tab").forEach(function (button) {
                button.classList.toggle("active", button.dataset.page === id);
            });

            window.scrollTo(0, 0);
        }

        // Open the chat screen.
        window.openDiviAI = function () {
            home.hidden = true;
            home.style.display = "none";

            app.hidden = false;
            app.style.display = "flex";

            document.body.classList.add("chat-app");
        };

        // Return to the homepage.
        window.returnToHome = function () {
            app.hidden = true;
            app.style.display = "none";

            home.hidden = false;
            home.style.display = "block";

            document.body.classList.remove("chat-app");
            showPage("homeHero");
        };

        // Connect navigation tabs.
        document.querySelectorAll(".nav-tab").forEach(function (button) {
            button.addEventListener("click", function () {
                showPage(button.dataset.page);
            });
        });

        // Connect Explore Features and footer buttons.
        document.querySelectorAll("[data-open-page]").forEach(function (button) {
            button.addEventListener("click", function () {
                showPage(button.dataset.openPage);
            });
        });

        // Connect every button that opens the AI chat.
        document.querySelectorAll(
            'button[onclick="openDiviAI()"]'
        ).forEach(function (button) {
            button.addEventListener("click", window.openDiviAI);
            button.removeAttribute("onclick");
        });

        // Connect every button that returns home.
        document.querySelectorAll(
            'button[onclick="returnToHome()"]'
        ).forEach(function (button) {
            button.addEventListener("click", window.returnToHome);
            button.removeAttribute("onclick");
        });

        // Set copyright year.
        const year = document.getElementById("copyrightYear");
        if (year) year.textContent = new Date().getFullYear();

        // Initial screen.
        home.hidden = false;
        home.style.display = "block";

        app.hidden = true;
        app.style.display = "none";

        showPage("homeHero");

        console.log("Divi AI navigation initialized successfully.");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initDiviAI, {
            once: true
        });
    } else {
        initDiviAI();
    }
})();
```
