```javascript
"use strict";

// ================================================
// DIVI AI — CHAT AND CONVERSATION MANAGEMENT
// ================================================

const SEARCH_API_URL = "https://divi-ai.onrender.com/api/web-search";
const HISTORY_KEY = "diviAIConversations_v2";

const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const chatForm = document.getElementById("chatForm");
const sendButton = document.getElementById("sendButton");
const voiceButton = document.getElementById("voiceButton");

const newChatButton = document.getElementById("newChatButton");
const clearHistoryButton = document.getElementById("clearHistoryButton");
const chatHistory = document.getElementById("chatHistory");

const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const chatSection = document.getElementById("chat");

let conversations = loadConversations();
let currentConversationId = null;
let isSending = false;
let currentMode = "chat";

// ================================================
// STORAGE
// ================================================

function loadConversations() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(HISTORY_KEY) || "[]"
        );

        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.error("Could not load conversations:", error);
        return [];
    }
}

function saveConversations() {
    try {
        localStorage.setItem(
            HISTORY_KEY,
            JSON.stringify(conversations)
        );

        return true;
    } catch (error) {
        console.error("Could not save conversations:", error);

        showNotice(
            "Your browser could not save the conversation. Check available storage."
        );

        return false;
    }
}

function createConversation() {
    return {
        id: crypto.randomUUID
            ? crypto.randomUUID()
            : Date.now().toString() + Math.random().toString(36).slice(2),
        title: "New conversation",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

function getCurrentConversation() {
    return conversations.find(
        conversation => conversation.id === currentConversationId
    ) || null;
}

// ================================================
// CHAT SCREEN
// ================================================

function showChatScreen() {
    if (chatSection) {
        chatSection.hidden = false;
        chatSection.classList.add("active-section");
        chatSection.style.display = "flex";
    }

    if (pageTitle) {
        pageTitle.textContent = getCurrentConversation()?.title || "Divi AI";
    }

    if (pageSubtitle) {
        pageSubtitle.textContent = "Your AI conversation";
    }
}

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
            userInput.value = question;
            userInput.focus();
            chatForm.requestSubmit();
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

// ================================================
// MESSAGE DISPLAY
// ================================================

function addMessage(text, sender, options = {}) {
    if (!chatBox) return null;

    const message = document.createElement("article");
    message.className = `message ${sender}-message`;

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = sender === "user" ? "You" : "D";

    const content = document.createElement("div");
    content.className = "message-content";
    content.textContent = String(text ?? "");

    message.append(avatar, content);
    chatBox.appendChild(message);

    if (!options.noScroll) {
        scrollToBottom();
    }

    return message;
}

function renderConversation(conversation) {
    if (!chatBox) return;

    chatBox.replaceChildren();

    if (!conversation || !conversation.messages.length) {
        showWelcome();
        return;
    }

    conversation.messages.forEach(message => {
        addMessage(message.text, message.role, {
            noScroll: true
        });
    });

    scrollToBottom();
}

// ================================================
// CONVERSATION TITLES
// ================================================

function makeTitle(question) {
    const clean = question.trim().replace(/\s+/g, " ");

    if (clean.length <= 35) return clean;

    return clean.slice(0, 32) + "...";
}

// ================================================
// HISTORY SIDEBAR
// ================================================

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

    const sorted = [...conversations].sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    sorted.forEach(conversation => {
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
            "Delete " + (conversation.title || "conversation")
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

    if (userInput) userInput.focus();

    if (window.innerWidth <= 760 && sidebar) {
        sidebar.classList.remove("sidebar-open");
    }
}

function deleteConversation(id) {
    const conversation = conversations.find(item => item.id === id);

    if (!conversation) return;

    conversations = conversations.filter(item => item.id !== id);

    if (currentConversationId === id) {
        currentConversationId = null;
        startNewChat();
    }

    saveConversations();
    renderHistory();
}

function clearAllConversations() {
    if (!conversations.length) return;

    const confirmed = window.confirm(
        "Delete all saved conversations? This cannot be undone."
    );

    if (!confirmed) return;

    conversations = [];
    currentConversationId = null;

    saveConversations();
    startNewChat();
    renderHistory();
}

// ================================================
// NEW CHAT
// ================================================

function startNewChat() {
    currentConversationId = null;

    if (userInput) {
        userInput.value = "";
    }

    currentMode = "chat";

    showWelcome();
    showChatScreen();
    renderHistory();

    if (userInput) userInput.focus();

    if (window.innerWidth <= 760 && sidebar) {
        sidebar.classList.remove("sidebar-open");
    }
}

if (newChatButton) {
    newChatButton.addEventListener("click", startNewChat);
}

if (clearHistoryButton) {
    clearHistoryButton.addEventListener("click", clearAllConversations);
}

// ================================================
// SAVE MESSAGES
// ================================================

function saveConversationMessage(role, text) {
    if (!currentConversationId) {
        const conversation = createConversation();

        conversations.unshift(conversation);
        currentConversationId = conversation.id;
    }

    const conversation = getCurrentConversation();

    if (!conversation) return;

    conversation.messages.push({
        role,
        text: String(text),
        createdAt: new Date().toISOString()
    });

    if (
        role === "user" &&
        (
            conversation.title === "New conversation" ||
            conversation.messages.length === 1
        )
    ) {
        conversation.title = makeTitle(text);
    }

    conversation.updatedAt = new Date().toISOString();

    saveConversations();
    renderHistory();

    if (pageTitle) {
        pageTitle.textContent = conversation.title;
    }
}

// ================================================
// SEARCH SOURCES
// ================================================

function addSearchResults(results) {
    if (!chatBox || !Array.isArray(results) || !results.length) {
        return;
    }

    const validResults = results.filter(result => {
        if (!result || !result.url) return false;

        try {
            const url = new URL(result.url);
            return ["http:", "https:"].includes(url.protocol);
        } catch {
            return false;
        }
    });

    if (!validResults.length) return;

    const container = document.createElement("div");
    container.className = "message ai-message search-results";

    const heading = document.createElement("h3");
    heading.textContent = "Sources";
    container.appendChild(heading);

    validResults.forEach(result => {
        const link = document.createElement("a");

        link.href = new URL(result.url).href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "search-result-link";
        link.textContent = result.title || new URL(result.url).hostname;

        container.appendChild(link);
    });

    chatBox.appendChild(container);
    scrollToBottom();
}

// ================================================
// LOADING INDICATOR
// ================================================

function showLoading() {
    const loading = document.createElement("div");
    loading.className = "message ai-message loading-message";
    loading.id = "diviLoading";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "D";

    const text = document.createElement("div");
    text.className = "message-content";
    text.textContent = "Divi AI is thinking...";

    loading.append(avatar, text);
    chatBox.appendChild(loading);

    scrollToBottom();

    return loading;
}

// ================================================
// SEND MESSAGE TO YOUR EXISTING BACKEND
// ================================================

async function sendMessage() {
    if (!userInput || isSending) return;

    const question = userInput.value.trim();

    if (!question) return;

    isSending = true;

    if (sendButton) sendButton.disabled = true;

    if (chatBox.querySelector(".welcome")) {
        chatBox.replaceChildren();
    }

    userInput.value = "";

    // Save and display the user's message.
    addMessage(question, "user");
    saveConversationMessage("user", question);

    const loading = showLoading();

    try {
        let query = question;

        if (currentMode === "agent") {
            query =
                "Help plan this task in practical steps: " + question;
        } else if (currentMode === "explain") {
            query =
                "Explain this in simple language and give examples: " +
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
            throw new Error("The server returned an invalid response.");
        }

        if (!response.ok) {
            throw new Error(
                data.error ||
                data.message ||
                "Request failed with status " + response.status
            );
        }

        const answer =
            data.answer ||
            data.response ||
            data.summary ||
            data.result ||
            "The server returned no answer.";

        if (loading) loading.remove();

        addMessage(answer, "ai");
        saveConversationMessage("ai", answer);

        addSearchResults(data.results || data.sources || []);

    } catch (error) {
        console.error("Divi AI error:", error);

        if (loading) loading.remove();

        const errorText =
            "I couldn't get an answer from the server. " +
            (error.message || "Please try again.");

        addMessage(errorText, "ai");
        saveConversationMessage("ai", errorText);

    } finally {
        isSending = false;

        if (sendButton) sendButton.disabled = false;
        if (userInput) userInput.focus();
    }
}

// ================================================
// FORM AND KEYBOARD
// ================================================

if (chatForm) {
    chatForm.addEventListener("submit", event => {
        event.preventDefault();
        sendMessage();
    });
}

if (userInput) {
    userInput.addEventListener("input", () => {
        userInput.style.height = "auto";
        userInput.style.height =
            Math.min(userInput.scrollHeight, 180) + "px";
    });

    userInput.addEventListener("keydown", event => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();

            if (chatForm) {
                chatForm.requestSubmit();
            }
        }
    });
}

// ================================================
// MOBILE SIDEBAR
// ================================================

if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", () => {
        sidebar.classList.toggle("sidebar-open");
    });
}

// ================================================
// VOICE INPUT
// ================================================

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
            }
        });

        recognition.onresult = event => {
            userInput.value = event.results[0][0].transcript;
            userInput.dispatchEvent(new Event("input"));
            userInput.focus();
        };

        recognition.onerror = event => {
            console.warn("Voice input error:", event.error);
        };

        recognition.onend = () => {
            voiceButton.textContent = "🎤";
            voiceButton.disabled = false;
        };
    } else {
        voiceButton.addEventListener("click", () => {
            showNotice(
                "Voice input is not supported in this browser."
            );
        });
    }
}

// ================================================
// AI MODE SUPPORT
// ================================================

function setMode(mode) {
    const allowed = ["chat", "agent", "explain"];

    currentMode = allowed.includes(mode) ? mode : "chat";
}

// ================================================
// STATUS MESSAGE
// ================================================

function showNotice(message) {
    const notice = document.createElement("div");

    notice.className = "divi-notice";
    notice.textContent = message;

    document.body.appendChild(notice);

    window.setTimeout(() => notice.remove(), 3500);
}

// ================================================
// INITIALIZATION
// ================================================

function initializeDiviAI() {
    console.log("Divi AI chat initializing...");

    renderHistory();

    // Start with a fresh chat without deleting saved conversations.
    startNewChat();

    console.log("Divi AI is ready.");
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeDiviAI
    );
} else {
    initializeDiviAI();
}
```
