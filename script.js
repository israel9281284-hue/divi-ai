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
