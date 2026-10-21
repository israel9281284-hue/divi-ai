// =====================================================
// DIVI AI — COMPLETE JAVASCRIPT
// Compatible with the supplied index.html
// =====================================================

"use strict";

// =====================================================
// CONFIGURATION
// =====================================================

const SEARCH_API_URL = "https://divi-ai.onrender.com/api/web-search";
const HISTORY_KEY = "diviAIHistory";

// =====================================================
// ELEMENTS
// =====================================================

const homePage = document.getElementById("homePage");
const homeFeatures = document.getElementById("homeFeatures");
const homeAbout = document.getElementById("homeAbout");
const aiAppScreen = document.getElementById("aiAppScreen");

const chatSection = document.getElementById("chat");
const featuresSection = document.getElementById("features");
const aboutSection = document.getElementById("about");

const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const voiceButton = document.getElementById("voiceButton");

const newChatButton = document.getElementById("newChatButton");
const clearHistoryButton = document.getElementById("clearHistoryButton");
const chatHistory = document.getElementById("chatHistory");

const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

const modeButtons = document.querySelectorAll(".mode-button");

const appSections = [
    chatSection,
    featuresSection,
    aboutSection
].filter(Boolean);

let currentMode = "chat";
let isSending = false;

// =====================================================
// NAVIGATION
// =====================================================

function showScreen(screenName) {
    const screens = {
        homePage,
        homeFeatures,
        homeAbout,
        aiAppScreen
    };

    const appSectionNames = {
        chat: "chat",
        appChat: "chat",
        features: "features",
        about: "about"
    };

    let targetName = screenName;

    if (Object.prototype.hasOwnProperty.call(appSectionNames, screenName)) {
        targetName = "aiAppScreen";
    }

    const target = screens[targetName];

    if (!target) {
        console.error("Divi AI: Screen not found:", screenName);
        return;
    }

    // Hide all four main screens.
    Object.values(screens).forEach(screen => {
        if (!screen) return;

        screen.classList.remove("active-screen");
        screen.hidden = true;
        screen.style.display = "none";
    });

    // Display the selected screen.
    target.hidden = false;
    target.classList.add("active-screen");
    target.style.display = "flex";

    // Display the correct application section.
    if (targetName === "aiAppScreen") {
        showAppSection(appSectionNames[screenName] || "chat");
    }

    window.scrollTo(0, 0);

    console.log("Divi AI screen:", targetName);
}

function openDiviAI(sectionName = "chat") {
    showScreen(sectionName);
}

function openHomePage() {
    showScreen("homePage");
}

// Connect every standalone screen navigation button.
document.querySelectorAll("[data-screen]").forEach(button => {
    button.addEventListener("click", event => {
        event.preventDefault();
        showScreen(button.dataset.screen);
    });
});

// Homepage Launch buttons.
[
    document.getElementById("startDiviButton"),
    document.getElementById("headerLaunchButton")
].forEach(button => {
    if (!button) return;

    button.addEventListener("click", event => {
        event.preventDefault();
        openDiviAI("chat");
    });
});

// Homepage Explore Features button.
const exploreFeaturesButton =
    document.getElementById("exploreFeaturesButton");

if (exploreFeaturesButton) {
    exploreFeaturesButton.addEventListener("click", event => {
        event.preventDefault();
        showScreen("homeFeatures");
    });
}

// App Home button.
const homeButton = document.getElementById("diviHomeButton");

if (homeButton) {
    homeButton.addEventListener("click", event => {
        event.preventDefault();
        openHomePage();
    });
}

// =====================================================
// APPLICATION SECTION NAVIGATION
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

        if (active) {
            section.style.display = "flex";
        } else {
            section.style.display = "none";
        }
    });

    document.querySelectorAll("[data-section]").forEach(button => {
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

// Connect app navigation buttons.
document.querySelectorAll("[data-section]").forEach(button => {
    button.addEventListener("click", event => {
        event.preventDefault();
        openDiviAI(button.dataset.section);
    });
});

// =====================================================
// PAGE TITLES
// =====================================================

function updatePageTitle(sectionName) {
    const pages = {
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

    const page = pages[sectionName];

    if (!page) return;

    if (pageTitle) pageTitle.textContent = page.title;
    if (pageSubtitle) pageSubtitle.textContent = page.subtitle;
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

    if (userInput) {
        const placeholders = {
            chat: "Message Divi AI...",
            agent: "Give Divi AI a task to plan...",
            explain: "What would you like Divi AI to explain?"
        };

        userInput.placeholder = placeholders[currentMode];
    }
}

modeButtons.forEach(button => {
    button.addEventListener("click", () => {
        setMode(button.dataset.mode);
    });
});

// =====================================================
// CHAT MESSAGES
// =====================================================

function addMessage(text, sender) {
    if (!chatBox) return null;

    const message = document.createElement("div");

    message.className = sender === "user"
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

// =====================================================
// WEB SEARCH RESULTS
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

        let url;

        try {
            url = new URL(result.url);
        } catch {
            return;
        }

        if (!["https:", "http:"].includes(url.protocol)) return;

        const link = document.createElement("a");

        link.href = url.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "search-result-link";
        link.textContent = result.title || url.hostname;

        container.appendChild(link);

        if (result.content) {
            const description = document.createElement("p");

            description.className = "search-result-description";
            description.textContent = result.content;

            container.appendChild(description);
        }
    });

    if (container.querySelector("a")) {
        chatBox.appendChild(container);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// =====================================================
// SEND MESSAGE
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

    const loading = addMessage(
        currentMode === "agent"
            ? "Divi AI is planning your task..."
            : currentMode === "explain"
                ? "Divi AI is preparing an explanation..."
                : "Divi AI is searching for information...",
        "ai"
    );

    isSending = true;

    if (sendButton) sendButton.disabled = true;

    try {
        let query = question;

        if (currentMode === "agent") {
            query =
                "Help plan this task. Give practical steps and an expected result. Task: " +
                question;
        } else if (currentMode === "explain") {
            query =
                "Explain this in simple language and include examples where useful: " +
                question;
        }

        const response = await fetch(SEARCH_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query })
        });

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error("The server did not return valid JSON.");
        }

        if (!response.ok) {
            throw new Error(
                data.error ||
                data.message ||
                `Server error: ${response.status}`
            );
        }

        if (loading) loading.remove();

        const answer =
            data.answer ||
            data.response ||
            data.summary ||
            data.result ||
            "The server responded without an answer.";

        addMessage(answer, "ai");

        addSearchResults(data.results || data.sources || []);

        saveMessageToHistory(question, answer, currentMode);

    } catch (error) {
        console.error("Divi AI request failed:", error);

        if (loading) loading.remove();

        addMessage(
            "Divi AI could not complete your request. " +
            (error.message || "Please try again."),
            "ai"
        );

    } finally {
        isSending = false;

        if (sendButton) sendButton.disabled = false;
        if (userInput) userInput.focus();
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

// =====================================================
// NEW CHAT
// =====================================================

if (newChatButton) {
    newChatButton.addEventListener("click", () => {
        setMode("chat");
        showWelcomeMessage();
        openDiviAI("chat");

        if (userInput) {
            userInput.value = "";
            userInput.focus();
        }
    });
}

// =====================================================
// CHAT HISTORY
// =====================================================

function getHistory() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(HISTORY_KEY) || "[]"
        );

        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.warn("Unable to read chat history:", error);
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
        console.error("Unable to save chat history:", error);
    }
}

function displayHistory() {
    if (!chatHistory) return;

    chatHistory.replaceChildren();

    const history = getHistory();

    if (!history.length) {
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
        if (!confirm("Clear all saved chat history?")) return;

        localStorage.removeItem(HISTORY_KEY);
        displayHistory();
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
                voiceButton.textContent = "Listening...";
                voiceButton.disabled = true;
            } catch (error) {
                console.warn("Could not start voice recognition:", error);
            }
        });

        recognition.onresult = event => {
            userInput.value =
                event.results[0][0].transcript;

            userInput.focus();
        };

        recognition.onerror = event => {
            console.error("Voice recognition error:", event.error);
        };

        recognition.onend = () => {
            voiceButton.textContent = "🎤";
            voiceButton.disabled = false;
        };

    } else {
        voiceButton.addEventListener("click", () => {
            addMessage(
                "Voice input is not supported in this browser.",
                "ai"
            );
        });
    }
}

// =====================================================
// STARTUP
// =====================================================

function initializeDiviAI() {
    console.log("Initializing Divi AI...");

    const requiredScreens = [
        homePage,
        homeFeatures,
        homeAbout,
        aiAppScreen
    ];

    if (requiredScreens.some(screen => !screen)) {
        console.error(
            "One or more main screens are missing. Check the screen IDs in index.html."
        );
    }

    displayHistory();
    setMode("chat");
    showWelcomeMessage();
    showScreen("homePage");

    console.log("Divi AI initialization complete.");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeDiviAI);
} else {
    initializeDiviAI();
}
