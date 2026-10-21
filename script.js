```javascript
(function () {
    "use strict";

    window.openDiviAI = function () {
        var home = document.getElementById("homePage");
        var app = document.getElementById("aiAppScreen");

        if (!home || !app) {
            alert("Divi AI could not find its homepage or chat screen.");
            return;
        }

        home.hidden = true;
        app.hidden = false;
        document.body.classList.add("chat-app");
    };

    window.returnToHome = function () {
        var home = document.getElementById("homePage");
        var app = document.getElementById("aiAppScreen");

        if (app) app.hidden = true;
        if (home) home.hidden = false;

        document.body.classList.remove("chat-app");
    };

    document.addEventListener("DOMContentLoaded", function () {
        document.querySelectorAll(".nav-tab").forEach(function (button) {
            button.addEventListener("click", function () {
                var target = button.getAttribute("data-page");

                document.querySelectorAll(
                    "#homePage main .site-view"
                ).forEach(function (section) {
                    section.hidden = section.id !== target;
                });

                document.querySelectorAll(".nav-tab").forEach(function (tab) {
                    tab.classList.toggle("active", tab === button);
                });
            });
        });

        document.querySelectorAll("[data-open-page]").forEach(function (button) {
            button.addEventListener("click", function () {
                var target = button.getAttribute("data-open-page");

                document.querySelectorAll(
                    "#homePage main .site-view"
                ).forEach(function (section) {
                    section.hidden = section.id !== target;
                });
            });
        });

        console.log("Divi AI emergency script loaded.");
    });
})();
```
