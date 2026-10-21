```javascript
// =====================================================
// DIVI AI — FIXED NAVIGATION AND MAIN JAVASCRIPT
// Matches the new index.html with separate screens.
// =====================================================

"use strict";

// =====================================================
// API
// =====================================================

const SEARCH_API_URL =
    "https://divi-ai.onrender.com/api/web-search";

const HISTORY_KEY = "diviAIHistory";

// =====================================================
// SCREEN ELEMENTS
// =====================================================

const homePage = document.getElementById("homePage");
const homeFeatures = document.getElementById("homeFeatures");
const homeAbout = document.getElementById("homeAbout");
const aiAppScreen = document.getElementById("aiAppScreen");

const app = document.querySelector(".app");

// App sections
const chatSection = document.getElementById("chat");
const featuresSection = document.getElementById("features");
const aboutSection = document.getElementById("about");

const appSections = [
    chatSection,
    featuresSection,
    aboutSection
].filter(Boolean);

// Chat elements
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const voiceButton = document.getElementById("voiceButton");

const newChatButton = document.getElementById("newChatButton");
const clearHistoryButton = document.getElementById("clearHistoryButton");
const chatHistory = document.getElementById("chatHistory");

// Navigation elements
const screenButtons = document.querySelectorAll("[data-screen]");
const appNavigationButtons = document.querySelectorAll(
    ".app-navigation [data-section]"
);

// Homepage buttons
const startDiviButton = document.getElementById("startDiviButton");
const headerLaunchButton = document.getElementById("headerLaunchButton");
const exploreFeaturesButton = document.getElementById("exploreFeaturesButton");
const homeButton = document.getElementById("diviHomeButton");

// AI mode buttons
const modeButtons = document.querySelectorAll(".mode-button");

// App title
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

// =====================================================
// APP STATE
// =====================================================

let currentMode = "chat";
let isSending = false;

// =====================================================
// SCREEN NAVIGATION
// =====================================================

```javascript
function hideAllScreens() {
    const screens = [
        homePage,
        homeFeatures,
        homeAbout,
        aiAppScreen
    ];

    screens.forEach(screen => {
        if (!screen) return;

        screen.classList.remove("active-screen");
        screen.hidden = true;
        screen.style.setProperty("display", "none", "important");
    });
}

function showScreen(screenName) {
    const screens = {
        homePage,
        homeFeatures,
        homeAbout,
        aiAppScreen
    };

    let targetName = screenName;

    if (["chat", "features", "about", "appChat"].includes(screenName)) {
        targetName = "aiAppScreen";
    }

    const target = screens[targetName];

    if (!target) {
        console.error(
            "Divi AI could not find the screen:",
            targetName
        );
        return;
    }

    hideAllScreens();

    target.hidden = false;
    target.classList.add("active-screen");
    target.style.setProperty("display", "flex", "important");

    if (targetName === "aiAppScreen") {
        const section = ["chat", "features", "about"].includes(screenName)
            ? screenName
            : "chat";

        showAppSection(section);
    }

    window.scrollTo({ top: 0, behavior: "auto" });

    console.log("Currently open:", targetName);
}
```
// Open the AI application on a specific tab.
function openDiviAI(sectionName = "chat") {
    showScreen(
        ["chat", "features", "about"].includes(sectionName)
            ? sectionName
            : "chat"
    );
}

// Return to the homepage.
function openHomePage() {
    showScreen("homePage");
}

// =====================================================
// ALL data-screen BUTTONS
// =====================================================

screenButtons.forEach(button => {
    button.addEventListener("click", event => {
        event.preventDefault();

        const screenName = button.dataset.screen;

        if (!screenName) return;

        showScreen(screenName);
    });
});

// =====================================================
// HOMEPAGE BUTTONS
// =====================================================

if (startDiviButton) {
    startDiviButton.addEventListener("click", () => {
        openDiviAI("chat");
    });
}

if (headerLaunchButton) {
    headerLaunchButton.addEventListener("click", () => {
        openDiviAI("chat");
    });
}

if (exploreFeaturesButton) {
    exploreFeaturesButton.addEventListener("click", () => {
        showScreen("homeFeatures");
    });
}

// The app sidebar Home button returns to the homepage.
if (homeButton) {
    homeButton.addEventListener("click", openHomePage);
}

// =====================================================
// APP SECTION NAVIGATION
// =====================================================

function showAppSection(sectionName) {
    const validSections = ["chat", "features", "about"];

    if (!validSections.includes(sectionName)) {
        sectionName = "chat";
    }

    appSections.forEach(section => {
        const active = section.id === sectionName;

        section.classList.toggle("active-section", active);
        section.hidden = !active;
        section.style.display = active ? "flex" : "none";
    });

    appNavigationButtons.forEach(button => {
        const active = button.dataset.section === sectionName;

        button.classList.toggle("active", active);

        if (active) {
            button.setAttribute("aria-current", "page");
        } else {
            button.removeAttribute("aria-current");
        }
    });

    updatePageTitle(sectionName);
}

// Sidebar Chat, Features, and About Me buttons.
appNavigationButtons.forEach(button => {
    button.addEventListener("click", () => {
        openDiviAI(button.dataset.section);
    });
});

// =====================================================
// APP PAGE TITLES
// =====================================================

function updatePageTitle(sectionName) {
    if (!pageTitle || !pageSubtitle) return;

    const details = {
        chat: {
            title: "Divi AI",
            subtitle: "Your intelligent digital assistant"
        },

        features: {
            title: "Features",
            subtitle: "Explore what Divi AI can do"
        },

        about: {
            title: "About Me",
            subtitle: "The creator behind Divi AI"
        }
    };

    const page = details[sectionName];

    if (page) {
        pageTitle.textContent = page.title;
        pageSubtitle.textContent = page.subtitle;
    }
}

// =====================================================
// AI MODES
// =====================================================

function setMode(mode) {
    const validModes = ["chat", "agent", "explain"];

    currentMode = validModes.includes(mode) ? mode : "chat";

    modeButtons.forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.mode === currentMode
        );
    });

    updateModePlaceholder();
}

modeButtons.forEach(button => {
    button.addEventListener("click", () => {
        setMode(button.dataset.mode);
    });
});

function updateModePlaceholder() {
    if (!userInput) return;

    const placeholders = {
        chat: "Message Divi AI...",
        agent: "Give Divi AI a task to plan...",
        explain: "What would you like Divi AI to explain?"
    };

    userInput.placeholder =
        placeholders[currentMode] || placeholders.chat;
}

function getLoadingMessage() {
    const messages = {
        chat: "🔎 Divi AI is searching for information...",
        agent: "🧠 Divi AI is planning your task...",
        explain: "💡 Divi AI is preparing a simple explanation..."
    };

    return messages[currentMode] || messages.chat;
}

// =====================================================
// DISPLAY CHAT MESSAGES
// =====================================================

function addMessage(text, sender) {
    if (!chatBox) return null;

    const message = document.createElement("div");

    message.className =
        sender === "user"
            ? "message user-message"
            : "message ai-message";

    const content = document.createElement("div");

    content.className = "message-content";
    content.textContent = String(text ?? "");

    message.appendChild(content);
    chatBox.appendChild(message);

    chatBox.scrollTop = chatBox.scrollHeight;

    return message;
}

// =====================================================
// DISPLAY WEB SOURCES
// =====================================================

function addSearchResults(results) {
    if (!chatBox || !Array.isArray(results)) return;

    const container = document.createElement("div");
    container.className = "message ai-message search-results";

    const heading = document.createElement("h3");
    heading.textContent = "🔗 Sources";

    container.appendChild(heading);

    results.forEach(result => {
        if (!result || !result.url) return;

        try {
            const url = new URL(result.url);

            if (!["https:", "http:"].includes(url.protocol)) {
                return;
            }

            const link = document.createElement("a");

            link.href = url.href;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = result.title || url.hostname;
            link.className = "search-result-link";

            container.appendChild(link);

            if (result.content) {
                const description = document.createElement("p");

                description.textContent = result.content;
                description.className = "search-result-description";

                container.appendChild(description);
            }
        } catch (error) {
            console.warn("Skipped an invalid source URL.");
        }
    });

    if (container.querySelector("a")) {
        chatBox.appendChild(container);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// =====================================================
// SEND MESSAGE TO THE BACKEND
// =====================================================

async function sendMessage() {
    if (!userInput || !chatBox || isSending) return;

    const question = userInput.value.trim();

    if (!question) {
        userInput.focus();
        return;
    }

    addMessage(question, "user");
    userInput.value = "";

    const loadingMessage = addMessage(
        getLoadingMessage(),
        "ai"
    );

    isSending = true;

    if (sendButton) {
        sendButton.disabled = true;
    }

    try {
        let query = question;

        if (currentMode === "agent") {
            query =
                "Help plan this task. Give practical steps, " +
                "important considerations, and an expected result. " +
                "Task: " + question;
        }

        if (currentMode === "explain") {
            query =
                "Explain this in simple language. Include examples " +
                "where useful. Question: " + question;
        }

        const response = await fetch(SEARCH_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                query: query
            })
        });

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error(
                "The server returned an invalid response."
            );
        }

        if (!response.ok) {
            throw new Error(
                data.error ||
                data.message ||
                `Request failed (${response.status}).`
            );
        }

        if (loadingMessage) {
            loadingMessage.remove();
        }

        const answer =
            data.answer ||
            data.response ||
            data.summary ||
            "The request completed, but the server did not return an answer.";

        addMessage(answer, "ai");

        if (Array.isArray(data.results)) {
            addSearchResults(data.results);
        }

        saveMessageToHistory(question, answer, currentMode);

    } catch (error) {
        console.error("Divi AI request failed:", error);

        if (loadingMessage) {
            loadingMessage.remove();
        }

        addMessage(
            "Sorry, Divi AI could not complete your request. " +
            (error.message || "Please try again."),
            "ai"
        );

    } finally {
        isSending = false;

        if (sendButton) {
            sendButton.disabled = false;
        }

        userInput.focus();
    }
}

if (sendButton) {
    sendButton.addEventListener("click", sendMessage);
}

if (userInput) {
    userInput.addEventListener("keydown", event => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });
}

// =====================================================
// SUGGESTED QUESTIONS
// =====================================================

function useSuggestion(question) {
    if (!userInput) return;

    userInput.value = question;
    userInput.focus();
}

window.useSuggestion = useSuggestion;

document.querySelectorAll(".suggestions button").forEach(button => {
    button.addEventListener("click", () => {
        useSuggestion(button.textContent.trim());
    });
});

// =====================================================
// NEW CHAT
// =====================================================

function showWelcomeMessage() {
    if (!chatBox) return;

    chatBox.replaceChildren();

    const welcome = document.createElement("div");
    welcome.className = "welcome";

    const icon = document.createElement("div");
    icon.className = "welcome-icon";
    icon.textContent = "D";

    const heading = document.createElement("h2");
    heading.textContent = "Hello, I'm Divi AI 👋";

    const description = document.createElement("p");
    description.textContent =
        "Your assistant for questions, ideas, learning, and problem solving.";

    const suggestions = document.createElement("div");
    suggestions.className = "suggestions";

    [
        "Explain artificial intelligence simply",
        "Help me with my school work",
        "Give me a creative idea"
    ].forEach(question => {
        const button = document.createElement("button");

        button.type = "button";
        button.textContent = question;

        button.addEventListener("click", () => {
            useSuggestion(question);
        });

        suggestions.appendChild(button);
    });

    welcome.append(icon, heading, description, suggestions);
    chatBox.appendChild(welcome);
}

if (newChatButton) {
    newChatButton.addEventListener("click", () => {
        setMode("chat");
        showWelcomeMessage();

        if (userInput) {
            userInput.value = "";
            userInput.focus();
        }

        openDiviAI("chat");
    });
}

// =====================================================
// CHAT HISTORY
// =====================================================

function getHistory() {
    try {
        const history = JSON.parse(
            localStorage.getItem(HISTORY_KEY) || "[]"
        );

        return Array.isArray(history) ? history : [];
    } catch (error) {
        console.warn("Could not read chat history.", error);
        return [];
    }
}

function saveMessageToHistory(question, answer, mode) {
    const history = getHistory();

    history.unshift({
        question,
        answer,
        mode,
        date: new Date().toLocaleString()
    });

    try {
        localStorage.setItem(
            HISTORY_KEY,
            JSON.stringify(history.slice(0, 20))
        );

        displayHistory();
    } catch (error) {
        console.error("Could not save chat history.", error);
    }
}

function displayHistory() {
    if (!chatHistory) return;

    chatHistory.replaceChildren();

    const history = getHistory();

    if (history.length === 0) {
        const empty = document.createElement("p");

        empty.className = "no-history";
        empty.textContent = "No conversations yet";

        chatHistory.appendChild(empty);
        return;
    }

    history.forEach((item, index) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "history-item";

        const icon = document.createElement("span");
        icon.className = "history-icon";

        icon.textContent = {
            chat: "💬",
            agent: "🧠",
            explain: "💡"
        }[item.mode] || "💬";

        const label = document.createElement("span");
        label.className = "history-text";
        label.textContent = item.question || "Previous conversation";

        button.append(icon, label);

        button.addEventListener("click", () => {
            const saved = getHistory()[index];

            if (!saved) return;

            openDiviAI("chat");

            if (chatBox) {
                chatBox.replaceChildren();
                addMessage(saved.question, "user");
                addMessage(saved.answer, "ai");
            }

            setMode(saved.mode || "chat");
        });

        chatHistory.appendChild(button);
    });
}

if (clearHistoryButton) {
    clearHistoryButton.addEventListener("click", () => {
        if (!window.confirm("Clear all saved chat history?")) return;

        try {
            localStorage.removeItem(HISTORY_KEY);
            displayHistory();
        } catch (error) {
            console.error("Could not clear chat history.", error);
        }
    });
}

// =====================================================
// VOICE INPUT
// =====================================================

if (voiceButton && userInput) {
    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();

        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = false;

        voiceButton.addEventListener("click", () => {
            try {
                recognition.start();
                voiceButton.textContent = "🔴";
            } catch (error) {
                console.warn("Voice recognition could not start.", error);
            }
        });

        recognition.onresult = event => {
            userInput.value = event.results[0][0].transcript;
            userInput.focus();
        };

        recognition.onerror = event => {
            console.error("Voice input error:", event.error);
            voiceButton.textContent = "🎤";
        };

        recognition.onend = () => {
            voiceButton.textContent = "🎤";
        };

    } else {
        voiceButton.addEventListener("click", () => {
            addMessage(
                "Voice input is not supported in this browser. " +
                "Please try a recent version of Chrome.",
                "ai"
            );
        });
    }
}

// =====================================================
// INITIALIZE
// =====================================================

displayHistory();
setMode("chat");

// Ensure the app sections start in a consistent state.
showAppSection("chat");

// Start on the homepage.
showScreen("homePage");

console.log("Divi AI loaded successfully.");
```
