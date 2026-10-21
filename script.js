// =====================================================
// DIVI AI — COMPLETE MAIN JAVASCRIPT
// Navigation, chat, search, history, AI modes and voice.
// =====================================================

"use strict";

// =====================================================
// API CONFIGURATION
// =====================================================

const SEARCH_API_URL = "https://divi-ai.onrender.com/api/web-search";
const HISTORY_KEY = "diviAIHistory";

// =====================================================
// SCREEN ELEMENTS
// =====================================================

const homePage = document.getElementById("homePage");
const homeFeatures = document.getElementById("homeFeatures");
const homeAbout = document.getElementById("homeAbout");
const aiAppScreen = document.getElementById("aiAppScreen");

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

// Homepage buttons
const startDiviButton = document.getElementById("startDiviButton");
const headerLaunchButton = document.getElementById("headerLaunchButton");
const exploreFeaturesButton = document.getElementById("exploreFeaturesButton");
const homeButton = document.getElementById("diviHomeButton");

// Navigation buttons
const screenButtons = document.querySelectorAll("[data-screen]");
const sectionButtons = document.querySelectorAll("[data-section]");
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
    const screenMap = {
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

    // These names refer to sections inside the AI application.
    if (Object.prototype.hasOwnProperty.call(appSectionNames, screenName)) {
        targetName = "aiAppScreen";
    }

    const target = screenMap[targetName];

    if (!target) {
        console.error("Divi AI: Screen not found:", targetName);
        return;
    }

    hideAllScreens();

    target.hidden = false;
    target.classList.add("active-screen");
    target.style.setProperty("display", "flex", "important");

    if (targetName === "aiAppScreen") {
        showAppSection(appSectionNames[screenName] || "chat");
    }

    window.scrollTo({
        top: 0,
        behavior: "auto"
    });

    console.log("Divi AI screen opened:", targetName);
}

function openDiviAI(sectionName = "chat") {
    const validSections = ["chat", "features", "about"];

    showScreen(
        validSections.includes(sectionName)
            ? sectionName
            : "chat"
    );
}

function openHomePage() {
    showScreen("homePage");
}

// =====================================================
// CONNECT NAVIGATION BUTTONS
// =====================================================

// Buttons using data-screen open standalone screens.
screenButtons.forEach(button => {
    button.addEventListener("click", event => {
        event.preventDefault();

        const destination = button.dataset.screen;

        if (destination) {
            showScreen(destination);
        }
    });
});

// Homepage Launch buttons.
[startDiviButton, headerLaunchButton].forEach(button => {
    if (!button) return;

    button.addEventListener("click", event => {
        event.preventDefault();
        openDiviAI("chat");
    });
});

// Homepage Explore Features button.
if (exploreFeaturesButton) {
    exploreFeaturesButton.addEventListener("click", event => {
        event.preventDefault();
        showScreen("homeFeatures");
    });
}

// App Home button.
if (homeButton) {
    homeButton.addEventListener("click", event => {
        event.preventDefault();
        openHomePage();
    });
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

        if (active) {
            section.style.removeProperty("display");
        } else {
            section.style.setProperty("display", "none", "important");
        }
    });

    sectionButtons.forEach(button => {
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

// Connect app navigation buttons only once.
sectionButtons.forEach(button => {
    button.addEventListener("click", event => {
        event.preventDefault();

        const sectionName = button.dataset.section;

        if (sectionName) {
            openDiviAI(sectionName);
        }
    });
});

// =====================================================
// APP PAGE TITLES
// =====================================================

function updatePageTitle(sectionName) {
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

    if (!page) return;

    if (pageTitle) {
        pageTitle.textContent = page.title;
    }

    if (pageSubtitle) {
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
        const active = button.dataset.mode === currentMode;

        button.classList.toggle("active", active);

        if (active) {
            button.setAttribute("aria-pressed", "true");
        } else {
            button.setAttribute("aria-pressed", "false");
        }
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

    userInput.placeholder = placeholders[currentMode];
}

function getLoadingMessage() {
    const messages = {
        chat: "Divi AI is searching for information...",
        agent: "Divi AI is planning your task...",
        explain: "Divi AI is preparing a simple explanation..."
    };

    return messages[currentMode] || messages.chat;
}

// =====================================================
// DISPLAY CHAT MESSAGES
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

// =====================================================
// DISPLAY WEB SEARCH RESULTS
// =====================================================

function addSearchResults(results) {
    if (!chatBox || !Array.isArray(results)) return;

    const validResults = results.filter(result => {
        if (!result || !result.url) return false;

        try {
            const url = new URL(result.url);
            return ["https:", "http:"].includes(url.protocol);
        } catch {
            return false;
        }
    });

    if (validResults.length === 0) return;

    const container = document.createElement("div");
    container.className = "message ai-message search-results";

    const heading = document.createElement("h3");
    heading.textContent = "Sources";

    container.appendChild(heading);

    validResults.forEach(result => {
        const url = new URL(result.url);

        const item = document.createElement("div");
        item.className = "search-result-item";

        const link = document.createElement("a");

        link.href = url.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = result.title || url.hostname;
        link.className = "search-result-link";

        item.appendChild(link);

        if (result.content) {
            const description = document.createElement("p");

            description.textContent = result.content;
            description.className = "search-result-description";

            item.appendChild(description);
        }

        container.appendChild(item);
    });

    chatBox.appendChild(container);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// =====================================================
// SEND MESSAGE TO BACKEND
// =====================================================

async function sendMessage() {
    if (!userInput || !chatBox || isSending) return;

    const question = userInput.value.trim();

    if (!question) {
        userInput.focus();
        return;
    }

    // Show the user's message.
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
        } else if (currentMode === "explain") {
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
                "The server returned an invalid response. Please try again."
            );
        }

        if (!response.ok) {
            throw new Error(
                data.error ||
                data.message ||
                `Server request failed with status ${response.status}.`
            );
        }

        if (loadingMessage) {
            loadingMessage.remove();
        }

        const answer =
            data.answer ||
            data.response ||
            data.summary ||
            data.result ||
            "The server responded, but no answer was included.";

        addMessage(answer, "ai");

        if (Array.isArray(data.results)) {
            addSearchResults(data.results);
        } else if (Array.isArray(data.sources)) {
            addSearchResults(data.sources);
        }

        saveMessageToHistory(question, answer, currentMode);

    } catch (error) {
        console.error("Divi AI request failed:", error);

        if (loadingMessage) {
            loadingMessage.remove();
        }

        let errorMessage =
            "Sorry, Divi AI could not complete your request. ";

        if (error instanceof TypeError) {
            errorMessage +=
                "There may be a network or server connection problem. " +
                "Please check your connection and try again.";
        } else {
            errorMessage += error.message || "Please try again.";
        }

        addMessage(errorMessage, "ai");

    } finally {
        isSending = false;

        if (sendButton) {
            sendButton.disabled = false;
        }

        if (userInput) {
            userInput.focus();
        }
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

function connectSuggestionButtons() {
    document.querySelectorAll(".suggestions button").forEach(button => {
        if (button.dataset.diviConnected === "true") return;

        button.dataset.diviConnected = "true";

        button.addEventListener("click", () => {
            useSuggestion(button.textContent.trim());
        });
    });
}

connectSuggestionButtons();

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
    heading.textContent = "Hello, I'm Divi AI!";

    const description = document.createElement("p");
    description.textContent =
        "Your assistant for questions, ideas, learning, and problem solving.";

    const suggestions = document.createElement("div");
    suggestions.className = "suggestions";

    const questions = [
        "Explain artificial intelligence simply",
        "Help me with my school work",
        "Give me a creative idea"
    ];

    questions.forEach(question => {
        const button = document.createElement("button");

        button.type = "button";
        button.textContent = question;

        button.addEventListener("click", () => {
            useSuggestion(question);
        });

        suggestions.appendChild(button);
    });

    welcome.append(
        icon,
        heading,
        description,
        suggestions
    );

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
        console.warn("Could not read chat history:", error);
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
        console.error("Could not save chat history:", error);
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

        const icons = {
            chat: "💬",
            agent: "🧠",
            explain: "💡"
        };

        icon.textContent = icons[item.mode] || "💬";

        const label = document.createElement("span");
        label.className = "history-text";
        label.textContent = item.question || "Previous conversation";

        button.append(icon, label);

        button.addEventListener("click", () => {
            // Re-read the history in case it has changed.
            const currentHistory = getHistory();
            const saved = currentHistory[index];

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
        if (!window.confirm("Clear all saved chat history?")) {
            return;
        }

        try {
            localStorage.removeItem(HISTORY_KEY);
            displayHistory();
        } catch (error) {
            console.error("Could not clear chat history:", error);
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
                voiceButton.textContent = "Listening...";
                voiceButton.disabled = true;
            } catch (error) {
                console.warn("Voice recognition could not start:", error);
            }
        });

        recognition.onresult = event => {
            const result = event.results?.[0]?.[0]?.transcript;

            if (result) {
                userInput.value = result;
                userInput.focus();
            }
        };

        recognition.onerror = event => {
            console.error("Voice input error:", event.error);
        };

        recognition.onend = () => {
            voiceButton.textContent = "🎤";
            voiceButton.disabled = false;
        };

    } else {
        voiceButton.addEventListener("click", () => {
            addMessage(
                "Voice input is not supported in this browser. " +
                "Please try an updated version of Chrome.",
                "ai"
            );
        });
    }
}

// =====================================================
// STARTUP CHECKS
// =====================================================

function checkRequiredElements() {
    const requiredScreens = {
        homePage,
        homeFeatures,
        homeAbout,
        aiAppScreen
    };

    Object.entries(requiredScreens).forEach(([name, element]) => {
        if (!element) {
            console.warn(
                `Divi AI: HTML element #${name} was not found.`
            );
        }
    });

    if (!chatBox) {
        console.warn("Divi AI: #chatBox was not found.");
    }

    if (!userInput) {
        console.warn("Divi AI: #userInput was not found.");
    }

    if (!sendButton) {
        console.warn("Divi AI: #sendButton was not found.");
    }
}

// =====================================================
// INITIALIZE
// =====================================================

checkRequiredElements();
displayHistory();
setMode("chat");
showAppSection("chat");
showWelcomeMessage();
showScreen("homePage");

console.log("Divi AI JavaScript loaded successfully.");
