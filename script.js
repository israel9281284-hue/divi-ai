```javascript
"use strict";

// DIVI AI BUTTON FIX

document.addEventListener("DOMContentLoaded", function () {
    console.log("Divi AI JavaScript loaded successfully!");

    const homePage = document.getElementById("homePage");
    const aiAppScreen = document.getElementById("aiAppScreen");

    // Open the AI chat screen
    window.openDiviAI = function () {
        if (!homePage || !aiAppScreen) {
            console.error("Cannot find homePage or aiAppScreen.");
            alert("Please check the IDs in your index.html file.");
            return;
        }

        homePage.hidden = true;
        aiAppScreen.hidden = false;

        homePage.style.display = "none";
        aiAppScreen.style.display = "flex";

        document.body.classList.add("chat-app");

        console.log("Divi AI chat opened!");
    };

    // Return to the homepage
    window.returnToHome = function () {
        if (!homePage || !aiAppScreen) {
            console.error("Cannot find homepage or chat screen.");
            return;
        }

        aiAppScreen.hidden = true;
        homePage.hidden = false;

        aiAppScreen.style.display = "none";
        homePage.style.display = "flex";

        document.body.classList.remove("chat-app");

        console.log("Returned to homepage!");
    };

    // Connect buttons automatically
    document.querySelectorAll("[data-open-divi]").forEach(function (button) {
        button.addEventListener("click", window.openDiviAI);
    });

    document.querySelectorAll("[data-return-home]").forEach(function (button) {
        button.addEventListener("click", window.returnToHome);
    });
});
```
```javascript
// ========================================
// DIVI AI — HOMEPAGE AND BUTTON NAVIGATION
// ========================================

(function () {
    "use strict";

    function setupDiviNavigation() {
        const homePage = document.getElementById("homePage");
        const aiAppScreen = document.getElementById("aiAppScreen");

        if (!homePage || !aiAppScreen) {
            console.error("Divi AI: Homepage or chat screen is missing.");
            return;
        }

        const pageIds = [
            "homeHero",
            "homeFeatures",
            "homeAbout",
            "homeContact"
        ];

        function openDiviAI() {
            homePage.hidden = true;
            aiAppScreen.hidden = false;

            homePage.style.display = "none";
            aiAppScreen.style.display = "flex";

            document.body.classList.add("chat-app");

            console.log("Divi AI chat opened.");
        }

        function returnToHome() {
            aiAppScreen.hidden = true;
            homePage.hidden = false;

            aiAppScreen.style.display = "none";
            homePage.style.display = "block";

            document.body.classList.remove("chat-app");

            showHomePage("homeHero");

            console.log("Divi AI homepage opened.");
        }

        function showHomePage(pageId) {
            if (!pageIds.includes(pageId)) {
                pageId = "homeHero";
            }

            pageIds.forEach(function (id) {
                const page = document.getElementById(id);

                if (page) {
                    page.hidden = id !== pageId;
                }
            });

            document.querySelectorAll(".nav-tab").forEach(function (button) {
                button.classList.toggle(
                    "active",
                    button.dataset.page === pageId
                );
            });
        }

        // Make navigation functions available to HTML buttons.
        window.openDiviAI = openDiviAI;
        window.returnToHome = returnToHome;

        // Header navigation: Home, Features, About, Contact.
        document.querySelectorAll(".nav-tab").forEach(function (button) {
            button.addEventListener("click", function () {
                showHomePage(button.dataset.page);
            });
        });

        // Explore Features and footer navigation.
        document.querySelectorAll("[data-open-page]").forEach(function (button) {
            button.addEventListener("click", function () {
                showHomePage(button.dataset.openPage);
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        });

        // Open the features section from the hero button.
        document.querySelectorAll("[data-open-page='homeFeatures']").forEach(
            function (button) {
                button.addEventListener("click", function () {
                    showHomePage("homeFeatures");
                });
            }
        );

        // Set the current year.
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
