```javascript
// =====================================================
// DIVI AI — COMPLETE MAIN JAVASCRIPT
// =====================================================

// API ENDPOINTS
const SEARCH_API_URL =
    "https://divi-ai.onrender.com/api/web-search";

const VOICE_API_URL =
    "https://divi-ai.onrender.com/api/voice-command";

// =====================================================
// ELEMENTS
// =====================================================

const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const voiceButton = document.querySelector(".voice-button");

const newChatButton = document.getElementById("newChatButton");
const clearHistoryButton =
    document.getElementById("clearHistoryButton");

const chatHistory = document.getElementById("chatHistory");

const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll(".page-section");
const modeButtons = document.querySelectorAll(".mode-button");

const homePage = document.getElementById("homePage");
const diviApp = document.querySelector(".app");

const startDiviButton =
    document.getElementById("startDiviButton");

const exploreFeaturesButton =
    document.getElementById("exploreFeaturesButton");

const homeButton =
    document.getElementById("diviHomeButton");

const headerLaunchButton =
    document.getElementById("headerLaunchButton");

const siteNavigationLinks =
    document.querySelectorAll(".site-navigation a");

const HISTORY_KEY = "diviAIHistory";

let currentMode = "chat";
let isSending = false;

// =====================================================
// SAFE LOCAL STORAGE
// =====================================================

function getHistory() {
    try {
        const history = JSON.parse(
            localStorage.getItem(HISTORY_KEY) || "[]"
        );

        return Array.isArray(history) ? history : [];
    } catch (error) {
        console.warn("Unable to read saved history.", error);
        return [];
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
            (button.dataset.mode || "chat") === currentMode
        );
    });

    updateModePlaceholder();
}

modeButtons.forEach(button => {
    button.addEventListener("click", () => {
        setMode(button.dataset.mode || "chat");
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
        agent: "🧠 Divi AI is researching your task...",
        explain: "💡 Divi AI is preparing a simple explanation..."
    };

    return messages[currentMode] || messages.chat;
}

// =====================================================
// CHAT MESSAGES
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
// SEARCH SOURCES
// =====================================================

function addSearchResults(results) {
    if (!chatBox || !Array.isArray(results)) return;

    const container = document.createElement("div");

    container.className =
        "message ai-message search-results";

    const heading = document.createElement("h3");

    heading.textContent = "🔗 Sources";
    heading.style.marginBottom = "12px";

    container.appendChild(heading);

    results.forEach(result => {
        if (!result || !result.url) return;

        try {
            const url = new URL(result.url);

            if (
                url.protocol !== "https:" &&
                url.protocol !== "http:"
            ) {
                return;
            }

            const link = document.createElement("a");

            link.href = url.href;
            link.textContent =
                result.title || url.hostname;

            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.className = "search-result-link";

            link.style.display = "block";
            link.style.color = "#a5b4fc";
            link.style.marginBottom = "8px";
            link.style.overflowWrap = "anywhere";

            container.appendChild(link);

            if (result.content) {
                const description =
                    document.createElement("p");

                description.className =
                    "search-result-description";

                description.textContent = result.content;
                description.style.color = "#929bb0";
                description.style.fontSize = "13px";
                description.style.lineHeight = "1.6";
                description.style.marginBottom = "12px";

                container.appendChild(description);
            }
        } catch (error) {
            console.warn("Skipped an invalid search result.");
        }
    });

    if (container.querySelector("a")) {
        chatBox.appendChild(container);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// =====================================================
// SAVE CONVERSATION
// =====================================================

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

// =====================================================
// SEND MESSAGE
// =====================================================

async function sendMessage() {
    if (!userInput || !chatBox || isSending) return;

    const command = userInput.value.trim();

    if (!command) return;

    addMessage(command, "user");

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
        let query = command;

        if (currentMode === "agent") {
            query =
                "Help plan this task. Provide a goal, practical " +
                "steps, important considerations, and an expected " +
                "result. Task: " + command;
        }

        if (currentMode === "explain") {
            query =
                "Explain this in simple language. Include examples " +
                "where useful and finish with a short summary. " +
                "Question: " + command;
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
        } catch (error) {
            throw new Error(
                "The server returned an invalid response. Please try again."
            );
        }

        if (!response.ok) {
            throw new Error(
                data.error ||
                data.message ||
                "The web search request failed."
            );
        }

        if (loadingMessage) {
            loadingMessage.remove();
        }

        const answer =
            data.answer ||
            data.response ||
            data.summary ||
            "The search completed, but no answer was returned.";

        addMessage(answer, "ai");

        if (
            Array.isArray(data.results) &&
            data.results.length > 0
        ) {
            addSearchResults(data.results);
        }

        saveMessageToHistory(
            command,
            answer,
            currentMode
        );

    } catch (error) {
        console.error("Divi AI search error:", error);

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

        if (userInput) {
            userInput.focus();
        }
    }
}

// =====================================================
// SEND BUTTON AND ENTER KEY
// =====================================================

if (sendButton) {
    sendButton.addEventListener("click", sendMessage);
}

if (userInput) {
    userInput.addEventListener("keydown", event => {
        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();
            sendMessage();
        }
    });
}

// =====================================================
// SUGGESTED QUESTIONS
// =====================================================

function useSuggestion(text) {
    if (!userInput) return;

    userInput.value = text;
    userInput.focus();
}

// Support suggestion buttons already present in the HTML.
document.querySelectorAll(".suggestions button").forEach(button => {
    button.addEventListener("click", () => {
        useSuggestion(button.textContent.trim());
    });
});

// =====================================================
// CHAT WELCOME SCREEN
// =====================================================

function showWelcomeMessage() {
    if (!chatBox) return;

    chatBox.innerHTML = "";

    const welcome = document.createElement("div");
    welcome.className = "welcome";

    const icon = document.createElement("div");
    icon.className = "welcome-icon";
    icon.textContent = "D";

    const title = document.createElement("h2");
    title.textContent = "Hello, I'm Divi AI 👋";

    const description = document.createElement("p");

    description.textContent =
        "Your assistant for questions, ideas, learning, and problem solving.";

    const suggestions = document.createElement("div");
    suggestions.className = "suggestions";

    const items = [
        "Explain artificial intelligence simply",
        "Help me with my school work",
        "Give me a creative idea"
    ];

    items.forEach(text => {
        const button = document.createElement("button");

        button.type = "button";
        button.textContent = text;

        button.addEventListener("click", () => {
            useSuggestion(text);
        });

        suggestions.appendChild(button);
    });

    welcome.appendChild(icon);
    welcome.appendChild(title);
    welcome.appendChild(description);
    welcome.appendChild(suggestions);

    chatBox.appendChild(welcome);
}

// =====================================================
// NEW CHAT
// =====================================================

if (newChatButton) {
    newChatButton.addEventListener("click", () => {
        setMode("chat");
        showWelcomeMessage();

        if (userInput) {
            userInput.value = "";
            userInput.focus();
        }
    });
}

// =====================================================
// CHAT HISTORY DISPLAY
// =====================================================

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

        icon.textContent = icons[item.mode] || icons.chat;

        const label = document.createElement("span");

        label.className = "history-text";
        label.textContent =
            item.question || "Previous conversation";

        button.appendChild(icon);
        button.appendChild(label);

        button.addEventListener("click", () => {
            openHistory(index);
        });

        chatHistory.appendChild(button);
    });
}

// =====================================================
// OPEN SAVED CONVERSATION
// =====================================================

function openHistory(index) {
    const history = getHistory();
    const item = history[index];

    if (!item || !chatBox) return;

    openDiviAI("chat");

    chatBox.replaceChildren();

    addMessage(item.question || "", "user");
    addMessage(item.answer || "", "ai");

    setMode(item.mode || "chat");
}

// =====================================================
// CLEAR CHAT HISTORY
// =====================================================

if (clearHistoryButton) {
    clearHistoryButton.addEventListener("click", () => {
        const confirmed = window.confirm(
            "Are you sure you want to clear all saved chat history?"
        );

        if (!confirmed) return;

        try {
            localStorage.removeItem(HISTORY_KEY);
            displayHistory();
        } catch (error) {
            console.error("Could not clear history.", error);
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
                console.warn(
                    "Voice recognition may already be active."
                );
            }
        });

        recognition.onresult = event => {
            const transcript =
                event.results[0][0].transcript;

            userInput.value = transcript;
            userInput.focus();
        };

        recognition.onerror = event => {
            console.error(
                "Voice recognition error:",
                event.error
            );

            voiceButton.textContent = "🎤";
        };

        recognition.onend = () => {
            voiceButton.textContent = "🎤";
        };

    } else {
        voiceButton.addEventListener("click", () => {
            addMessage(
                "Voice input is not supported in this browser. " +
                "Try a recent version of Chrome.",
                "ai"
            );
        });
    }
}

// =====================================================
// APP SECTION NAVIGATION
// =====================================================

function showSection(sectionName) {
    const validSections = ["chat", "features", "about"];

    if (!validSections.includes(sectionName)) {
        sectionName = "chat";
    }

    sections.forEach(section => {
        section.classList.toggle(
            "active-section",
            section.id === sectionName
        );
    });

    navLinks.forEach(link => {
        const isActive =
            link.dataset.section === sectionName;

        link.classList.toggle("active", isActive);

        if (isActive) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });

    updatePageTitle(sectionName);
}

// Sidebar navigation
navLinks.forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();

        const sectionName = link.dataset.section;

        if (sectionName) {
            openDiviAI(sectionName);
        }
    });
});

// =====================================================
// PAGE TITLES
// =====================================================

function updatePageTitle(section) {
    const title = document.getElementById("pageTitle");
    const subtitle = document.getElementById("pageSubtitle");

    if (!title || !subtitle) return;

    const pageDetails = {
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

    const details = pageDetails[section];

    if (details) {
        title.textContent = details.title;
        subtitle.textContent = details.subtitle;
    }
}

// =====================================================
// OPEN THE DIVI AI APP
// =====================================================

function openDiviAI(sectionName = "chat") {
    if (homePage) {
        homePage.style.display = "none";
    }

    if (diviApp) {
        diviApp.style.display = "flex";
    }

    showSection(sectionName);

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// =====================================================
// RETURN TO THE HOMEPAGE
// =====================================================

function openHomePage() {
    if (diviApp) {
        diviApp.style.display = "none";
    }

    if (homePage) {
        homePage.style.display = "flex";
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// =====================================================
// HOMEPAGE BUTTONS
// =====================================================

// Main Launch button: open chat.
if (startDiviButton) {
    startDiviButton.addEventListener("click", () => {
        openDiviAI("chat");
    });
}

// Explore Features: open the app's Features tab.
if (exploreFeaturesButton) {
    exploreFeaturesButton.addEventListener("click", () => {
        openDiviAI("features");
    });
}

// Header Launch button: open chat.
if (headerLaunchButton) {
    headerLaunchButton.addEventListener("click", () => {
        openDiviAI("chat");
    });
}

// Sidebar Home button: return to homepage.
if (homeButton) {
    homeButton.addEventListener("click", openHomePage);
}

// =====================================================
// HOMEPAGE NAVIGATION LINKS
// =====================================================

siteNavigationLinks.forEach(link => {
    link.addEventListener("click", event => {
        const target = link.getAttribute("href");

        if (target === "#homePage") {
            event.preventDefault();
            openHomePage();

        } else if (target === "#homeFeatures") {
            event.preventDefault();
            openDiviAI("features");

        } else if (target === "#homeAbout") {
            event.preventDefault();
            openDiviAI("about");
        }
    });
});

// =====================================================
// INITIALIZE
// =====================================================

displayHistory();
updateModePlaceholder();

// Start with the chat page selected internally.
// The app remains hidden until the user launches it.
showSection("chat");

console.log("Divi AI JavaScript loaded successfully.");
console.log("Search endpoint:", SEARCH_API_URL);
```
