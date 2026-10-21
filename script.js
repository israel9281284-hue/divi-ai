```javascript
"use strict";

// ==================================================
// DIVI AI — HOMEPAGE + CHAT APPLICATION
// ==================================================

const SEARCH_API_URL =
    "https://divi-ai.onrender.com/api/web-search";

const HISTORY_KEY = "diviAIConversations_v2";
const MAX_CONVERSATIONS = 50;

// ==================================================
// HTML ELEMENTS
// ==================================================

const homePage = document.getElementById("homePage");
const aiAppScreen = document.getElementById("aiAppScreen");

const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const chatForm = document.getElementById("chatForm");
const sendButton = document.getElementById("sendButton");
const voiceButton = document.getElementById("voiceButton");

const newChatButton = document.getElementById("newChatButton");
const clearHistoryButton =
    document.getElementById("clearHistoryButton");
const chatHistory = document.getElementById("chatHistory");

const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const chatSection = document.getElementById("chat");

// ==================================================
// APPLICATION STATE
// ==================================================

let conversations = loadConversations();
let currentConversationId = null;
let isSending = false;
let currentMode = "chat";
let chatInitialized = false;

```javascript
// ==================================================
// PAGE NAVIGATION
// ==================================================

const sitePageIds = [
    "homeHero",
    "homeFeatures",
    "homeAbout",
    "homeContact"
];

function showSitePage(pageId, updateAddress = true) {
    if (!sitePageIds.includes(pageId)) {
        pageId = "homeHero";
    }

    sitePageIds.forEach(id => {
        const section = document.getElementById(id);

        if (section) {
            section.hidden = id !== pageId;
        }
    });

    document.querySelectorAll(".nav-tab").forEach(button => {
        const active = button.dataset.page === pageId;

        button.classList.toggle("active", active);

        if (active) {
            button.setAttribute("aria-current", "page");
        } else {
            button.removeAttribute("aria-current");
        }
    });

    if (updateAddress) {
        const hashNames = {
            homeHero: "home",
            homeFeatures: "features",
            homeAbout: "about",
            homeContact: "contact"
        };

        history.replaceState(null, "", "#" + hashNames[pageId]);
    }

    window.scrollTo(0, 0);
}

function openDiviAI() {
    if (homePage) homePage.hidden = true;
    if (aiAppScreen) aiAppScreen.hidden = false;

    document.body.classList.add("chat-app");

    window.scrollTo(0, 0);

    if (!chatInitialized) {
        initializeDiviChat();
    } else {
        renderHistory();
        renderConversation(getCurrentConversation());
        updateChatHeader();
    }
}

function returnToHome() {
    if (aiAppScreen) aiAppScreen.hidden = true;
    if (homePage) homePage.hidden = false;

    document.body.classList.remove("chat-app");

    closeMobileSidebar();

    const hashToPage = {
        "#home": "homeHero",
        "#features": "homeFeatures",
        "#about": "homeAbout",
        "#contact": "homeContact"
    };

    const requestedPage =
        hashToPage[window.location.hash.toLowerCase()] || "homeHero";

    showSitePage(requestedPage, false);

    window.scrollTo(0, 0);
}

document.querySelectorAll(".nav-tab").forEach(button => {
    button.addEventListener("click", () => {
        showSitePage(button.dataset.page);
    });
});

document.querySelectorAll("[data-open-page]").forEach(button => {
    button.addEventListener("click", () => {
        showSitePage(button.dataset.openPage);
    });
});

window.openDiviAI = openDiviAI;
window.returnToHome = returnToHome;
window.showSitePage = showSitePage;
```
// ==================================================
// CONVERSATION STORAGE
// ==================================================

function loadConversations() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(HISTORY_KEY) || "[]"
        );

        if (!Array.isArray(saved)) return [];

        return saved
            .filter(item => item && item.id)
            .map(item => ({
                id: String(item.id),
                title: item.title || "New conversation",
                messages: Array.isArray(item.messages)
                    ? item.messages
                    : [],
                createdAt: item.createdAt || new Date().toISOString(),
                updatedAt: item.updatedAt || new Date().toISOString()
            }));
    } catch (error) {
        console.error("Could not load conversation history:", error);
        return [];
    }
}

function saveConversations() {
    try {
        conversations.sort(
            (a, b) =>
                new Date(b.updatedAt) - new Date(a.updatedAt)
        );

        conversations = conversations.slice(0, MAX_CONVERSATIONS);

        localStorage.setItem(
            HISTORY_KEY,
            JSON.stringify(conversations)
        );

        return true;
    } catch (error) {
        console.error("Could not save conversations:", error);

        showNotice(
            "Conversation history could not be saved in this browser."
        );

        return false;
    }
}

function createConversation() {
    const id =
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
            ? window.crypto.randomUUID()
            : Date.now().toString(36) +
              Math.random().toString(36).slice(2);

    const now = new Date().toISOString();

    return {
        id,
        title: "New conversation",
        messages: [],
        createdAt: now,
        updatedAt: now
    };
}

function getCurrentConversation() {
    return conversations.find(
        item => item.id === currentConversationId
    ) || null;
}

function ensureCurrentConversation() {
    let conversation = getCurrentConversation();

    if (!conversation) {
        conversation = createConversation();

        conversations.unshift(conversation);
        currentConversationId = conversation.id;
    }

    return conversation;
}

// ==================================================
// CHAT HEADER
// ==================================================

function updateChatHeader() {
    const conversation = getCurrentConversation();

    if (pageTitle) {
        pageTitle.textContent =
            conversation?.title || "Divi AI";
    }

    if (pageSubtitle) {
        pageSubtitle.textContent =
            conversation
                ? "Your AI conversation"
                : "What would you like to know?";
    }
}

function showChatScreen() {
    if (chatSection) {
        chatSection.hidden = false;
        chatSection.classList.add("active-section");
        chatSection.style.display = "flex";
    }

    updateChatHeader();
}

// ==================================================
// WELCOME SCREEN
// ==================================================

function showWelcome() {
    if (!chatBox) return;

    chatBox.replaceChildren();

    const welcome = document.createElement("div");
    welcome.className = "welcome";
    welcome.id = "welcomeScreen";

    const icon = document.createElement("div");
    icon.className = "welcome-icon";
    icon.textContent = "D";

    const heading = document.createElement("h2");
    heading.textContent = "What can I help you with?";

    const description = document.createElement("p");
    description.textContent =
        "Ask a question, explore an idea, or learn something new.";

    const suggestions = document.createElement("div");
    suggestions.className = "suggestions";

    const questions = [
        ["🧠", "Explain artificial intelligence simply"],
        ["📚", "Help me understand my school work"],
        ["💡", "Give me a creative project idea"]
    ];

    questions.forEach(([iconText, question]) => {
        const button = document.createElement("button");
        button.type = "button";

        const emoji = document.createElement("span");
        emoji.textContent = iconText;

        const text = document.createElement("span");
        text.textContent = question;

        button.append(emoji, text);

        button.addEventListener("click", () => {
            if (!userInput) return;

            userInput.value = question;
            userInput.focus();

            if (chatForm?.requestSubmit) {
                chatForm.requestSubmit();
            } else {
                sendMessage();
            }
        });

        suggestions.appendChild(button);
    });

    welcome.append(icon, heading, description, suggestions);
    chatBox.appendChild(welcome);
}

function scrollToBottom() {
    if (chatBox) {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// ==================================================
// DISPLAY MESSAGES
// ==================================================

function addMessage(text, sender, options = {}) {
    if (!chatBox) return null;

    const message = document.createElement("article");

    message.className =
        sender === "user"
            ? "message user-message"
            : "message ai-message";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = sender === "user" ? "You" : "D";

    const content = document.createElement("div");
    content.className = "message-content";
    content.textContent = String(text ?? "");

    message.append(avatar, content);
    chatBox.appendChild(message);

    if (!options.noScroll) scrollToBottom();

    return message;
}

// ==================================================
// RENDER A CONVERSATION
// ==================================================

function renderConversation(conversation) {
    if (!chatBox) return;

    chatBox.replaceChildren();

    if (!conversation || !conversation.messages.length) {
        showWelcome();
        return;
    }

    conversation.messages.forEach(message => {
        const role = message.role === "user" ? "user" : "ai";

        addMessage(message.text || "", role, { noScroll: true });

        if (role === "ai" && Array.isArray(message.sources)) {
            addSearchResults(message.sources, { noScroll: true });
        }
    });

    scrollToBottom();
}

// ==================================================
// CONVERSATION TITLES
// ==================================================

function makeTitle(question) {
    const clean = String(question).trim().replace(/\s+/g, " ");

    return clean.length > 35
        ? clean.slice(0, 32) + "..."
        : clean || "New conversation";
}

// ==================================================
// CONVERSATION HISTORY
// ==================================================

function renderHistory() {
    if (!chatHistory) return;

    chatHistory.replaceChildren();

    if (!conversations.length) {
        const empty = document.createElement("p");
        empty.className = "no-history";
        empty.textContent = "Your conversations will appear here.";

        chatHistory.appendChild(empty);
        return;
    }

    [...conversations]
        .sort((a, b) =>
            new Date(b.updatedAt) - new Date(a.updatedAt)
        )
        .forEach(conversation => {
            const row = document.createElement("div");
            row.className = "history-row";

            if (conversation.id === currentConversationId) {
                row.classList.add("selected");
            }

            const openButton = document.createElement("button");
            openButton.type = "button";
            openButton.className = "history-item";
            openButton.title = conversation.title;

            const icon = document.createElement("span");
            icon.className = "history-icon";
            icon.textContent = "💬";

            const title = document.createElement("span");
            title.className = "history-text";
            title.textContent = conversation.title || "New conversation";

            openButton.append(icon, title);

            openButton.addEventListener("click", () => {
                openConversation(conversation.id);
            });

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "delete-chat-button";
            deleteButton.textContent = "×";
            deleteButton.title = "Delete this conversation";
            deleteButton.setAttribute(
                "aria-label",
                "Delete " + conversation.title
            );

            deleteButton.addEventListener("click", event => {
                event.stopPropagation();
                deleteConversation(conversation.id);
            });

            row.append(openButton, deleteButton);
            chatHistory.appendChild(row);
        });
}

function openConversation(id) {
    const conversation = conversations.find(item => item.id === id);

    if (!conversation) return;

    currentConversationId = id;

    renderConversation(conversation);
    renderHistory();
    showChatScreen();
    closeMobileSidebar();

    userInput?.focus();
}

function deleteConversation(id) {
    conversations = conversations.filter(item => item.id !== id);

    if (currentConversationId === id) {
        currentConversationId = null;
    }

    saveConversations();

    if (currentConversationId === null) {
        startNewChat();
    } else {
        renderHistory();
    }
}

function clearAllConversations() {
    if (!conversations.length) {
        showNotice("There are no saved conversations to clear.");
        return;
    }

    if (!window.confirm(
        "Delete all saved conversations? This cannot be undone."
    )) {
        return;
    }

    conversations = [];
    currentConversationId = null;

    saveConversations();
    startNewChat();
}

function startNewChat() {
    currentConversationId = null;
    currentMode = "chat";

    if (userInput) {
        userInput.value = "";
        userInput.style.height = "auto";
    }

    showWelcome();
    showChatScreen();
    renderHistory();
    closeMobileSidebar();

    userInput?.focus();
}

newChatButton?.addEventListener("click", startNewChat);
clearHistoryButton?.addEventListener("click", clearAllConversations);

// ==================================================
// SAVE MESSAGES
// ==================================================

function saveConversationMessage(role, text, sources = []) {
    const conversation = ensureCurrentConversation();

    const normalizedRole = role === "user" ? "user" : "ai";

    conversation.messages.push({
        role: normalizedRole,
        text: String(text ?? ""),
        sources: Array.isArray(sources) ? sources : [],
        createdAt: new Date().toISOString()
    });

    if (
        normalizedRole === "user" &&
        ["New conversation", "New chat"].includes(conversation.title)
    ) {
        conversation.title = makeTitle(text);
    }

    conversation.updatedAt = new Date().toISOString();

    saveConversations();
    renderHistory();
    updateChatHeader();
}

// ==================================================
// SEARCH RESULTS
// ==================================================

function getValidSearchResults(results) {
    if (!Array.isArray(results)) return [];

    return results.filter(result => {
        if (!result || typeof result.url !== "string") return false;

        try {
            const url = new URL(result.url);

            return url.protocol === "https:" || url.protocol === "http:";
        } catch {
            return false;
        }
    });
}

function addSearchResults(results, options = {}) {
    if (!chatBox) return;

    const validResults = getValidSearchResults(results);

    if (!validResults.length) return;

    const container = document.createElement("div");
    container.className = "message ai-message search-results";

    const heading = document.createElement("h3");
    heading.textContent = "Sources";
    container.appendChild(heading);

    validResults.slice(0, 5).forEach(result => {
        const link = document.createElement("a");
        const url = new URL(result.url);

        link.href = url.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "search-result-link";
        link.textContent = result.title || url.hostname;

        container.appendChild(link);
    });

    chatBox.appendChild(container);

    if (!options.noScroll) scrollToBottom();
}

// ==================================================
// LOADING INDICATOR
// ==================================================

function showLoading() {
    if (!chatBox) return null;

    const loading = document.createElement("article");
    loading.className = "message ai-message loading-message";
    loading.id = "diviLoading";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "D";

    const text = document.createElement("div");
    text.className = "message-content";
    text.textContent = "Divi AI is searching for an answer...";

    loading.append(avatar, text);
    chatBox.appendChild(loading);

    scrollToBottom();

    return loading;
}

// ==================================================
// EXTRACT ANSWER
// ==================================================

function extractAnswer(data) {
    if (!data || typeof data !== "object") return "";

    const directAnswer =
        data.answer ??
        data.response ??
        data.summary ??
        data.result ??
        data.message;

    if (typeof directAnswer === "string" && directAnswer.trim()) {
        return directAnswer.trim();
    }

    if (directAnswer !== undefined && directAnswer !== null) {
        try {
            return JSON.stringify(directAnswer, null, 2);
        } catch {
            // Use search results below.
        }
    }

    const results = getValidSearchResults(
        data.results || data.sources || []
    );

    return results.slice(0, 3).map((item, index) => {
        const title = item.title || "Search result";
        const content = item.content || item.snippet || item.description || "";

        return content
            ? `${index + 1}. ${title}\n${content}`
            : `${index + 1}. ${title}`;
    }).join("\n\n");
}

// ==================================================
// SEND QUESTION TO BACKEND
// ==================================================

async function sendMessage() {
    if (!userInput || isSending) return;

    const question = userInput.value.trim();

    if (!question) return;

    if (!chatBox) {
        showNotice("The chat window could not be found. Check index.html.");
        return;
    }

    isSending = true;

    if (sendButton) sendButton.disabled = true;

    if (chatBox.querySelector(".welcome")) {
        chatBox.replaceChildren();
    }

    userInput.value = "";
    userInput.style.height = "auto";

    addMessage(question, "user");
    saveConversationMessage("user", question);

    const loading = showLoading();

    try {
        let query = question;

        if (currentMode === "agent") {
            query = "Help plan this task in practical steps: " + question;
        } else if (currentMode === "explain") {
            query = "Explain this in simple language and give examples: " + question;
        }

        const response = await fetch(SEARCH_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ query })
        });

        const rawResponse = await response.text();

        let data = {};

        try {
            data = rawResponse ? JSON.parse(rawResponse) : {};
        } catch {
            throw new Error(
                "The server did not return valid JSON. Check your Render backend."
            );
        }

        if (!response.ok) {
            const serverError =
                data.error || data.message || data.detail || "";

            if (response.status === 404) {
                throw new Error("The /api/web-search endpoint was not found.");
            }

            if (response.status === 401 || response.status === 403) {
                throw new Error(
                    "The server denied the request. Check backend settings."
                );
            }

            throw new Error(
                serverError ||
                `The server returned HTTP ${response.status}.`
            );
        }

        const answer = extractAnswer(data);

        if (!answer) {
            throw new Error(
                "The backend returned no answer or search results. Check Tavily settings."
            );
        }

        const sources = getValidSearchResults(
            data.results || data.sources || []
        );

        loading?.remove();

        addMessage(answer, "ai");
        saveConversationMessage("ai", answer, sources);
        addSearchResults(sources);

    } catch (error) {
        console.error("Divi AI request failed:", error);

        loading?.remove();

        let errorText = "Sorry, I couldn't get an answer. ";

        if (error instanceof TypeError) {
            errorText +=
                "I couldn't connect to the backend. Check your internet, Render deployment, and CORS settings.";
        } else {
            errorText += error.message || "Please try again.";
        }

        addMessage(errorText, "ai");
        saveConversationMessage("ai", errorText);

    } finally {
        isSending = false;

        if (sendButton) sendButton.disabled = false;

        userInput?.focus();
    }
}

// ==================================================
// CHAT INPUT
// ==================================================

chatForm?.addEventListener("submit", event => {
    event.preventDefault();
    sendMessage();
});

if (userInput) {
    userInput.addEventListener("input", () => {
        userInput.style.height = "auto";
        userInput.style.height =
            Math.min(userInput.scrollHeight, 180) + "px";
    });

    userInput.addEventListener("keydown", event => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();

            if (chatForm?.requestSubmit) {
                chatForm.requestSubmit();
            } else {
                sendMessage();
            }
        }
    });
}

// ==================================================
// MOBILE SIDEBAR
// ==================================================

function closeMobileSidebar() {
    if (window.innerWidth <= 760 && sidebar) {
        sidebar.classList.remove("sidebar-open");
    }
}

sidebarToggle?.addEventListener("click", () => {
    sidebar?.classList.toggle("sidebar-open");
});

// ==================================================
// VOICE INPUT
// ==================================================

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
                voiceButton.textContent = "…";
                voiceButton.disabled = true;
            } catch (error) {
                console.warn("Voice input could not start:", error);
                showNotice("Voice input could not start. Try again.");
            }
        });

        recognition.onresult = event => {
            const result = event.results?.[0]?.[0];

            if (result) {
                userInput.value = result.transcript;
                userInput.dispatchEvent(new Event("input"));
                userInput.focus();
            }
        };

        recognition.onerror = event => {
            console.warn("Voice input error:", event.error);
            showNotice("Voice recognition failed. Please try again.");
        };

        recognition.onend = () => {
            voiceButton.textContent = "🎤";
            voiceButton.disabled = false;
        };
    } else {
        voiceButton.addEventListener("click", () => {
            showNotice("Voice input is not supported in this browser.");
        });
    }
}

// ==================================================
// CHAT MODES
// ==================================================

function setMode(mode) {
    const allowedModes = ["chat", "agent", "explain"];

    currentMode = allowedModes.includes(mode) ? mode : "chat";
}

// ==================================================
// NOTIFICATIONS
// ==================================================

function showNotice(message) {
    const notice = document.createElement("div");

    notice.className = "divi-notice";
    notice.setAttribute("role", "status");
    notice.textContent = message;

    document.body.appendChild(notice);

    window.setTimeout(() => notice.remove(), 4500);
}

// ==================================================
// INITIALIZE CHAT ONLY WHEN OPENED
// ==================================================

function initializeDiviChat() {
    if (chatInitialized) return;

    chatInitialized = true;

    renderHistory();

    // Start a new conversation without deleting old ones.
    currentConversationId = null;
    showWelcome();
    showChatScreen();

    console.log("Divi AI chat is ready:", SEARCH_API_URL);
}

window.initializeDiviChat = initializeDiviChat;

// ==================================================
// INITIAL PAGE SETUP
// ==================================================

function initializeDiviAI() {
    renderHistory();

    // Start on the homepage, not inside the chat.
    if (homePage && aiAppScreen) {
        homePage.hidden = false;
        aiAppScreen.hidden = true;
        document.body.classList.remove("chat-app");
    } else {
        // Fallback in case the homepage markup is not present.
        if (aiAppScreen) aiAppScreen.hidden = false;
        initializeDiviChat();
    }

    const year = document.getElementById("copyrightYear");

    if (year) {
        year.textContent = new Date().getFullYear();
    }

    console.log("Divi AI homepage is ready.");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeDiviAI);
} else {
    initializeDiviAI();
}
```
