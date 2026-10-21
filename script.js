```javascript
"use strict";

window.openDiviAI = function () {
    const homePage = document.getElementById("homePage");
    const aiAppScreen = document.getElementById("aiAppScreen");

    if (homePage && aiAppScreen) {
        homePage.hidden = true;
        aiAppScreen.hidden = false;
        document.body.classList.add("chat-app");
        console.log("Divi AI opened successfully!");
    } else {
        console.error("Could not find the homepage or chat screen.");
    }
};

window.returnToHome = function () {
    const homePage = document.getElementById("homePage");
    const aiAppScreen = document.getElementById("aiAppScreen");

    if (aiAppScreen) aiAppScreen.hidden = true;
    if (homePage) homePage.hidden = false;

    document.body.classList.remove("chat-app");
};

console.log("Divi AI test script loaded!");
```
