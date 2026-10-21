"use strict";

// ==================================================
// DIVI AI — COMPLETE CHAT AND CONVERSATION SYSTEM
// ==================================================

// Backend API
const SEARCH_API_URL =
    "https://divi-ai.onrender.com/api/web-search";

// Conversation storage
const HISTORY_KEY = "diviAIConversations_v2";
const MAX_CONVERSATIONS = 50;

// ==================================================
// HTML ELEMENTS
// ==================================================

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

// ==================================================
// CONVERSATION STORAGE
// ==================================================

function loadConversations() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(HISTORY_KEY) || "[]"
        );

        if (!Array.isArray(saved)) {
            return [];
        }

        // Validate saved conversations.
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
        console.error(
            "Divi AI could not load conversation history:",
            error
        );

        return [];
    }
}

function saveConversations() {
    try {
        // Keep the newest conversations.
        conversations.sort(
            (a, b) =>
                new Date(b.updatedAt) - new Date(a.updatedAt)
        );

        conversations = conversations.slice(
            0,
            MAX_CONVERSATIONS
        );

        localStorage.setItem(
            HISTORY_KEY,
            JSON.stringify(conversations)
        );

        return true;
    } catch (error) {
        console.error(
            "Divi AI could not save conversations:",
            error
        );

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
        conversation =>
            conversation.id === currentConversationId
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
// CHAT SCREEN
// ==================================================

function showChatScreen() {
    if (chatSection) {
        chatSection.hidden = false;
        chatSection.classList.add("active-section");
        chatSection.style.display = "flex";
    }

    const conversation = getCurrentConversation();

    if (pageTitle) {
        pageTitle.textContent =
            conversation?.title || "Divi AI";
    }

    if (pageSubtitle) {
        pageSubtitle.textContent =
            "Your AI conversation";
    }
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
        [
            "🧠",
            "Explain artificial intelligence simply"
        ],
        [
            "📚",
            "Help me understand my school work"
        ],
        [
            "💡",
            "Give me a creative project idea"
        ]
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
            if (!userInput || !chatForm) return;

            userInput.value = question;
            userInput.focus();

            if (typeof chatForm.requestSubmit === "function") {
                chatForm.requestSubmit();
            } else {
                sendMessage();
            }
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

    // Use textContent to display text safely.
    content.textContent = String(text ?? "");

    message.append(avatar, content);
    chatBox.appendChild(message);

    if (!options.noScroll) {
        scrollToBottom();
    }

    return message;
}

// ==================================================
// DISPLAY A SAVED CONVERSATION
// ==================================================

function renderConversation(conversation) {
    if (!chatBox) return;

    chatBox.replaceChildren();

    if (
        !conversation ||
        !Array.isArray(conversation.messages) ||
        conversation.messages.length === 0
    ) {
        showWelcome();
        return;
    }

    conversation.messages.forEach(message => {
        const role =
            message.role === "user"
                ? "user"
                : "ai";

        addMessage(
            message.text || "",
            role,
            { noScroll: true }
        );

        // Restore saved source links, if available.
        if (
            role === "ai" &&
            Array.isArray(message.sources)
        ) {
            addSearchResults(
                message.sources,
                { noScroll: true }
            );
        }
    });

    scrollToBottom();
}

// ==================================================
// CONVERSATION TITLES
// ==================================================

function makeTitle(question) {
    const clean = String(question)
        .trim()
        .replace(/\s+/g, " ");

    if (clean.length <= 35) {
        return clean || "New conversation";
    }

    return clean.slice(0, 32) + "...";
}

// ==================================================
// CONVERSATION HISTORY SIDEBAR
// ==================================================

function renderHistory() {
    if (!chatHistory) return;

    chatHistory.replaceChildren();

    if (conversations.length === 0) {
        const empty = document.createElement("p");

        empty.className = "no-history";
        empty.textContent =
            "Your conversations will appear here.";

        chatHistory.appendChild(empty);
        return;
    }

    const sorted = [...conversations].sort(
        (a, b) =>
            new Date(b.updatedAt) - new Date(a.updatedAt)
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
        title.textContent =
            conversation.title || "New conversation";

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

// ==================================================
// OPEN AN EXISTING CONVERSATION
// ==================================================

function openConversation(id) {
    const conversation = conversations.find(
        item => item.id === id
    );

    if (!conversation) return;

    currentConversationId = id;

    renderConversation(conversation);
    renderHistory();
    showChatScreen();

    if (userInput) {
        userInput.focus();
    }

    closeMobileSidebar();
}

// ==================================================
// DELETE ONE CONVERSATION
// ==================================================

function deleteConversation(id) {
    const conversation = conversations.find(
        item => item.id === id
    );

    if (!conversation) return;

    conversations = conversations.filter(
        item => item.id !== id
    );

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

// ==================================================
// CLEAR ALL CONVERSATIONS
// ==================================================

function clearAllConversations() {
    if (conversations.length === 0) {
        showNotice("There are no saved conversations to clear.");
        return;
    }

    const confirmed = window.confirm(
        "Delete all saved conversations? This cannot be undone."
    );

    if (!confirmed) return;

    conversations = [];
    currentConversationId = null;

    saveConversations();
    startNewChat();
}

// ==================================================
// START A NEW CHAT
// ==================================================

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

    if (userInput) {
        userInput.focus();
    }
}

if (newChatButton) {
    newChatButton.addEventListener(
        "click",
        startNewChat
    );
}

if (clearHistoryButton) {
    clearHistoryButton.addEventListener(
        "click",
        clearAllConversations
    );
}

// ==================================================
// SAVE A MESSAGE TO THE CURRENT CONVERSATION
// ==================================================

function saveConversationMessage(role, text, sources = []) {
    const conversation = ensureCurrentConversation();

    const normalizedRole =
        role === "user" ? "user" : "ai";

    conversation.messages.push({
        role: normalizedRole,
        text: String(text ?? ""),
        sources: Array.isArray(sources) ? sources : [],
        createdAt: new Date().toISOString()
    });

    if (
        normalizedRole === "user" &&
        (
            conversation.title === "New conversation" ||
            conversation.title === "New chat"
        )
    ) {
        conversation.title = makeTitle(text);
    }

    conversation.updatedAt = new Date().toISOString();

    saveConversations();
    renderHistory();
    showChatScreen();
}

// ==================================================
// VALIDATE SEARCH RESULT URLS
// ==================================================

function getValidSearchResults(results) {
    if (!Array.isArray(results)) {
        return [];
    }

    return results.filter(result => {
        if (!result || typeof result.url !== "string") {
            return false;
        }

        try {
            const url = new URL(result.url);

            return (
                url.protocol === "https:" ||
                url.protocol === "http:"
            );
        } catch {
            return false;
        }
    });
}

// ==================================================
// DISPLAY SEARCH SOURCES
// ==================================================

function addSearchResults(results, options = {}) {
    if (!chatBox) return;

    const validResults = getValidSearchResults(results);

    if (validResults.length === 0) return;

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

        link.textContent =
            result.title || url.hostname;

        container.appendChild(link);
    });

    chatBox.appendChild(container);

    if (!options.noScroll) {
        scrollToBottom();
    }
}

// ==================================================
// LOADING INDICATOR
// ==================================================

function showLoading() {
    if (!chatBox) return null;

    const loading = document.createElement("article");

    loading.className =
        "message ai-message loading-message";

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

// ==================================================
// EXTRACT AN ANSWER FROM THE BACKEND RESPONSE
// ==================================================

function extractAnswer(data) {
    if (!data || typeof data !== "object") {
        return "";
    }

    // Prefer direct answers from the backend.
    const directAnswer =
        data.answer ??
        data.response ??
        data.summary ??
        data.result ??
        data.message;

    if (typeof directAnswer === "string") {
        if (directAnswer.trim()) {
            return directAnswer.trim();
        }
    } else if (
        directAnswer !== undefined &&
        directAnswer !== null
    ) {
        try {
            return JSON.stringify(directAnswer, null, 2);
        } catch {
            // Continue to search-result fallback.
        }
    }

    // If no direct answer exists, summarize the returned
    // search-result snippets into a readable response.
    const results = getValidSearchResults(
        data.results || data.sources || []
    );

    if (results.length > 0) {
        return results
            .slice(0, 3)
            .map((item, index) => {
                const title = item.title || "Search result";

                const content =
                    item.content ||
                    item.snippet ||
                    item.description ||
                    "";

                return content
                    ? `${index + 1}. ${title}\n${content}`
                    : `${index + 1}. ${title}`;
            })
            .join("\n\n");
    }

    return "";
}

// ==================================================
// SEND A QUESTION TO THE BACKEND
// ==================================================

async function sendMessage() {
    if (!userInput || isSending) return;

    const question = userInput.value.trim();

    if (!question) return;

    if (!chatBox) {
        showNotice(
            "The chat window could not be found. Check index.html."
        );

        return;
    }

    isSending = true;

    if (sendButton) {
        sendButton.disabled = true;
    }

    if (chatBox.querySelector(".welcome")) {
        chatBox.replaceChildren();
    }

    userInput.value = "";
    userInput.style.height = "auto";

    // Display and save the question.
    addMessage(question, "user");

    saveConversationMessage("user", question);

    // Display a loading indicator.
    const loading = showLoading();

    try {
        let query = question;

        if (currentMode === "agent") {
            query =
                "Help plan this task in practical steps: " +
                question;
        }

        if (currentMode === "explain") {
            query =
                "Explain this in simple language and give examples: " +
                question;
        }

        // Call the Flask backend.
        const response = await fetch(SEARCH_API_URL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },

            body: JSON.stringify({
                query: query
            })
        });

        // Read the response safely.
        const rawResponse = await response.text();

        let data = {};

        try {
            data = rawResponse
                ? JSON.parse(rawResponse)
                : {};
        } catch {
            throw new Error(
                "The server did not return valid JSON. " +
                "Check your Render backend logs."
            );
        }

        // Handle HTTP errors.
        if (!response.ok) {
            const serverError =
                data.error ||
                data.message ||
                data.detail ||
                "";

            if (response.status === 404) {
                throw new Error(
                    "The web-search endpoint was not found. " +
                    "Check the /api/web-search route in app.py."
                );
            }

            if (response.status === 401 ||
                response.status === 403) {
                throw new Error(
                    "The server denied the request. " +
                    "Check the backend authentication settings."
                );
            }

            if (response.status >= 500) {
                throw new Error(
                    "The backend server encountered an error. " +
                    (serverError || "Check the Render logs.")
                );
            }

            throw new Error(
                serverError ||
                `The server returned HTTP ${response.status}.`
            );
        }

        // Extract the best available answer.
        const answer = extractAnswer(data);

        if (!answer) {
            throw new Error(
                "The backend responded, but it returned no answer " +
                "or search results. Check the Tavily API key and " +
                "the response format in app.py."
            );
        }

        // Keep source results with the assistant message.
        const sources = getValidSearchResults(
            data.results || data.sources || []
        );

        if (loading) {
            loading.remove();
        }

        // Display and save the answer.
        addMessage(answer, "ai");

        saveConversationMessage(
            "ai",
            answer,
            sources
        );

        // Display source links.
        addSearchResults(sources);

    } catch (error) {
        console.error("Divi AI request failed:", error);

        if (loading) {
            loading.remove();
        }

        let errorText =
            "Sorry, I couldn't get an answer. ";

        if (
            error instanceof TypeError &&
            /fetch/i.test(error.message)
        ) {
            errorText +=
                "I couldn't connect to the backend. " +
                "Check your internet connection, Render deployment, " +
                "and CORS settings.";
        } else {
            errorText += error.message ||
                "Please try again.";
        }

        addMessage(errorText, "ai");

        saveConversationMessage(
            "ai",
            errorText
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

// ==================================================
// CHAT FORM
// ==================================================

if (chatForm) {
    chatForm.addEventListener("submit", event => {
        event.preventDefault();
        sendMessage();
    });
}

// ==================================================
// TEXT INPUT
// ==================================================

if (userInput) {
    userInput.addEventListener("input", () => {
        userInput.style.height = "auto";

        userInput.style.height =
            Math.min(userInput.scrollHeight, 180) + "px";
    });

    userInput.addEventListener("keydown", event => {
        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();

            if (
                chatForm &&
                typeof chatForm.requestSubmit === "function"
            ) {
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
    if (
        window.innerWidth <= 760 &&
        sidebar
    ) {
        sidebar.classList.remove("sidebar-open");
    }
}

if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", () => {
        sidebar.classList.toggle("sidebar-open");
    });
}

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
                console.warn(
                    "Voice input could not start:",
                    error
                );

                showNotice(
                    "Voice input could not start. Try again."
                );
            }
        });

        recognition.onresult = event => {
            const result = event.results?.[0]?.[0];

            if (result) {
                userInput.value = result.transcript;

                userInput.dispatchEvent(
                    new Event("input")
                );

                userInput.focus();
            }
        };

        recognition.onerror = event => {
            console.warn(
                "Voice input error:",
                event.error
            );

            showNotice(
                "Voice recognition failed. Please try again."
            );
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

// ==================================================
// CHAT MODES
// ==================================================

function setMode(mode) {
    const allowedModes = [
        "chat",
        "agent",
        "explain"
    ];

    currentMode = allowedModes.includes(mode)
        ? mode
        : "chat";

    console.log(
        "Divi AI mode:",
        currentMode
    );
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

    window.setTimeout(() => {
        notice.remove();
    }, 4500);
}

// ==================================================
// INITIALIZATION
// ==================================================

function initializeDiviAI() {
    console.log("Divi AI initializing...");

    renderHistory();

    // Start a fresh chat without deleting saved conversations.
    startNewChat();

    console.log(
        "Divi AI is ready. Backend:",
        SEARCH_API_URL
    );
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeDiviAI
    );
} else {
    initializeDiviAI();
}
