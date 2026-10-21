```javascript
"use strict";

// ==================================================
// DIVI AI — COMPLETE MAIN JAVASCRIPT
// ==================================================

const SEARCH_API_URL = "https://divi-ai.onrender.com/api/web-search";
const HISTORY_KEY = "diviAIConversations_v2";
const MAX_CONVERSATIONS = 50;

// ==================================================
// HTML ELEMENTS
// ==================================================

const homePage = document.getElementById("homePage");
const aiAppScreen = document.getElementById("aiAppScreen");

const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const sendButton = document.getElementById("sendButton");

const historyList = document.getElementById("historyList");
const newChatButton = document.getElementById("newChatButton");
const clearHistoryButton = document.getElementById("clearHistoryButton");

const chatTitle = document.getElementById("chatTitle");
const welcomeScreen = document.getElementById("welcomeScreen");
const chatScreen = document.getElementById("chatScreen");

const voiceButton = document.getElementById("voiceButton");
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");

// ==================================================
// APPLICATION STATE
// ==================================================

let conversations = loadConversations();
let currentConversationId = null;
let isSending = false;
let chatInitialized = false;
let recognition = null;

// ==================================================
// STORAGE
// ==================================================

function loadConversations() {
    try {
        const saved = localStorage.getItem(HISTORY_KEY);
        const parsed = saved ? JSON.parse(saved) : [];

        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Could not load chat history:", error);
        return [];
    }
}

function saveConversations() {
    try {
        conversations = conversations.slice(0, MAX_CONVERSATIONS);

        localStorage.setItem(
            HISTORY_KEY,
            JSON.stringify(conversations)
        );
    } catch (error) {
        console.error("Could not save chat history:", error);
        showNotification("Could not save chat history in this browser.");
    }
}

function createConversation() {
    return {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
        title: "New chat",
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

// ==================================================
// HOMEPAGE NAVIGATION
// ==================================================

const sitePageIds = [
    "homeHero",
    "homeFeatures",
    "homeAbout",
    "homeContact"
];

const hashToPage = {
    "#home": "homeHero",
    "#features": "homeFeatures",
    "#about": "homeAbout",
    "#contact": "homeContact"
};

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
        const pageToHash = {
            homeHero: "home",
            homeFeatures: "features",
            homeAbout: "about",
            homeContact: "contact"
        };

        history.replaceState(null, "", "#" + pageToHash[pageId]);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function openDiviAI() {
    if (!homePage || !aiAppScreen) {
        console.error("Homepage or chat screen is missing from index.html.");
        return;
    }

    homePage.hidden = true;
    aiAppScreen.hidden = false;

    document.body.classList.add("chat-app");

    if (!chatInitialized) {
        initializeDiviChat();
    } else {
        renderHistory();
        renderConversation(getCurrentConversation());
        updateChatHeader();
    }

    window.scrollTo(0, 0);
}

function returnToHome() {
    if (aiAppScreen) {
        aiAppScreen.hidden = true;
    }

    if (homePage) {
        homePage.hidden = false;
    }

    document.body.classList.remove("chat-app");

    closeMobileSidebar();

    const requestedPage =
        hashToPage[window.location.hash.toLowerCase()] || "homeHero";

    showSitePage(requestedPage, false);

    window.scrollTo(0, 0);
}

window.openDiviAI = openDiviAI;
window.returnToHome = returnToHome;
window.showSitePage = showSitePage;

// Navigation buttons
document.querySelectorAll(".nav-tab").forEach(button => {
    button.addEventListener("click", () => {
        showSitePage(button.dataset.page);
    });
});

// Footer links and buttons that open a homepage section
document.querySelectorAll("[data-open-page]").forEach(button => {
    button.addEventListener("click", () => {
        showSitePage(button.dataset.openPage);
    });
});

// Any button with data-open-ai opens the chat application
document.querySelectorAll("[data-open-ai]").forEach(button => {
    button.addEventListener("click", openDiviAI);
});

// Support homepage links that use #home, #features, #about, or #contact
window.addEventListener("hashchange", () => {
    if (homePage && !homePage.hidden) {
        const page = hashToPage[window.location.hash.toLowerCase()];
        showSitePage(page || "homeHero", false);
    }
});

// ==================================================
// CHAT SCREEN
// ==================================================

function showWelcomeScreen() {
    if (welcomeScreen) welcomeScreen.hidden = false;
    if (chatScreen) chatScreen.hidden = true;
}

function showChatScreen() {
    if (welcomeScreen) welcomeScreen.hidden = true;
    if (chatScreen) chatScreen.hidden = false;
}

function initializeDiviChat() {
    chatInitialized = true;

    renderHistory();

    if (conversations.length > 0) {
        currentConversationId = conversations[0].id;
        renderConversation(getCurrentConversation());
        updateChatHeader();
    } else {
        currentConversationId = null;
        showWelcomeScreen();

        if (chatBox) {
            chatBox.innerHTML = "";
        }

        updateChatHeader();
    }
}

function updateChatHeader() {
    const conversation = getCurrentConversation();

    if (chatTitle) {
        chatTitle.textContent = conversation
            ? conversation.title
            : "Divi AI";
    }
}

// ==================================================
// CREATE A NEW CHAT
// ==================================================

function startNewChat() {
    currentConversationId = null;

    if (chatBox) {
        chatBox.innerHTML = "";
    }

    showWelcomeScreen();
    updateChatHeader();
    renderHistory();

    if (chatInput) {
        chatInput.value = "";
        chatInput.focus();
    }

    closeMobileSidebar();
}

if (newChatButton) {
    newChatButton.addEventListener("click", startNewChat);
}

// Also support buttons that use this class
document.querySelectorAll(".new-chat-button").forEach(button => {
    if (button !== newChatButton) {
        button.addEventListener("click", startNewChat);
    }
});

// ==================================================
// CLEAR CHAT HISTORY
// ==================================================

function clearHistory() {
    const confirmed = window.confirm(
        "Are you sure you want to delete all your chat history?"
    );

    if (!confirmed) return;

    conversations = [];
    currentConversationId = null;

    saveConversations();
    renderHistory();

    if (chatBox) {
        chatBox.innerHTML = "";
    }

    showWelcomeScreen();
    updateChatHeader();

    showNotification("Chat history cleared.");
}

if (clearHistoryButton) {
    clearHistoryButton.addEventListener("click", clearHistory);
}

// ==================================================
// RENDER CHAT HISTORY
// ==================================================

function renderHistory() {
    if (!historyList) return;

    historyList.innerHTML = "";

    if (conversations.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-history";
        emptyMessage.textContent = "Your conversations will appear here.";
        historyList.appendChild(emptyMessage);
        return;
    }

    conversations.forEach(conversation => {
        const row = document.createElement("div");
        row.className = "history-item";

        if (conversation.id === currentConversationId) {
            row.classList.add("active");
        }

        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.className = "history-open";
        openButton.textContent = conversation.title || "New chat";
        openButton.title = conversation.title || "New chat";

        openButton.addEventListener("click", () => {
            currentConversationId = conversation.id;
            renderConversation(conversation);
            updateChatHeader();
            renderHistory();
            closeMobileSidebar();
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "history-delete";
        deleteButton.textContent = "×";
        deleteButton.setAttribute("aria-label", "Delete conversation");

        deleteButton.addEventListener("click", event => {
            event.stopPropagation();
            deleteConversation(conversation.id);
        });

        row.appendChild(openButton);
        row.appendChild(deleteButton);
        historyList.appendChild(row);
    });
}

function deleteConversation(id) {
    conversations = conversations.filter(
        conversation => conversation.id !== id
    );

    if (currentConversationId === id) {
        currentConversationId = null;

        if (chatBox) {
            chatBox.innerHTML = "";
        }

        showWelcomeScreen();
        updateChatHeader();
    }

    saveConversations();
    renderHistory();

    showNotification("Conversation deleted.");
}

// ==================================================
// RENDER MESSAGES
// ==================================================

function renderConversation(conversation) {
    if (!chatBox) return;

    chatBox.innerHTML = "";

    if (!conversation || !Array.isArray(conversation.messages)) {
        showWelcomeScreen();
        return;
    }

    if (conversation.messages.length === 0) {
        showWelcomeScreen();
        return;
    }

    showChatScreen();

    conversation.messages.forEach(message => {
        appendMessage(
            message.role,
            message.content,
            message.sources || []
        );
    });

    scrollChatToBottom();
}

function appendMessage(role, content, sources = []) {
    if (!chatBox) return;

    const messageElement = document.createElement("div");
    messageElement.className = "message " +
        (role === "user" ? "user-message" : "assistant-message");

    const bubble = document.createElement("div");
    bubble.className = "message-content";

    // Render plain text safely instead of interpreting HTML.
    bubble.textContent = content || "";

    messageElement.appendChild(bubble);

    if (Array.isArray(sources) && sources.length > 0) {
        const sourcesContainer = document.createElement("div");
        sourcesContainer.className = "message-sources";

        const heading = document.createElement("p");
        heading.textContent = "Sources";
        sourcesContainer.appendChild(heading);

        sources.forEach(source => {
            if (!source || !source.url) return;

            try {
                const parsedUrl = new URL(source.url);

                if (!["https:", "http:"].includes(parsedUrl.protocol)) {
                    return;
                }

                const link = document.createElement("a");
                link.href = parsedUrl.href;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = source.title || parsedUrl.hostname;

                sourcesContainer.appendChild(link);
            } catch {
                // Ignore invalid source URLs.
            }
        });

        if (sourcesContainer.querySelector("a")) {
            messageElement.appendChild(sourcesContainer);
        }
    }

    chatBox.appendChild(messageElement);
}

function scrollChatToBottom() {
    if (chatBox) {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// ==================================================
// TYPING INDICATOR
// ==================================================

function showTypingIndicator() {
    removeTypingIndicator();

    if (!chatBox) return;

    const indicator = document.createElement("div");
    indicator.id = "diviTypingIndicator";
    indicator.className = "message assistant-message typing-indicator";
    indicator.textContent = "Divi AI is thinking...";

    chatBox.appendChild(indicator);
    scrollChatToBottom();
}

function removeTypingIndicator() {
    const indicator = document.getElementById("diviTypingIndicator");

    if (indicator) {
        indicator.remove();
    }
}

// ==================================================
// SEND MESSAGES
// ==================================================

async function sendMessage(optionalText = "") {
    if (isSending) return;

    const text = (optionalText || (chatInput ? chatInput.value : "")).trim();

    if (!text) {
        showNotification("Please type a message first.");
        return;
    }

    if (!aiAppScreen || aiAppScreen.hidden) {
        openDiviAI();
    }

    if (!currentConversationId) {
        const conversation = createConversation();

        conversations.unshift(conversation);
        currentConversationId = conversation.id;
    }

    let conversation = getCurrentConversation();

    if (!conversation) {
        conversation = createConversation();
        conversations.unshift(conversation);
        currentConversationId = conversation.id;
    }

    conversation.messages.push({
        role: "user",
        content: text,
        timestamp: new Date().toISOString()
    });

    if (conversation.messages.length === 1) {
        conversation.title = text.length > 42
            ? text.slice(0, 42) + "..."
            : text;
    }

    conversation.updatedAt = new Date().toISOString();

    if (chatInput) {
        chatInput.value = "";
        chatInput.style.height = "auto";
    }

    showChatScreen();
    appendMessage("user", text);
    renderHistory();
    updateChatHeader();

    saveConversations();

    isSending = true;
    setSendButtonState(true);
    showTypingIndicator();

    try {
        const result = await requestAIResponse(text);

        removeTypingIndicator();

        conversation = getCurrentConversation();

        if (!conversation) return;

        conversation.messages.push({
            role: "assistant",
            content: result.answer,
            sources: result.sources || [],
            timestamp: new Date().toISOString()
        });

        conversation.updatedAt = new Date().toISOString();

        appendMessage(
            "assistant",
            result.answer,
            result.sources || []
        );

        saveConversations();
        renderHistory();
        updateChatHeader();
        scrollChatToBottom();
    } catch (error) {
        console.error("Divi AI request failed:", error);

        removeTypingIndicator();

        const message =
            "Sorry, I couldn't get a response right now. Please check your internet connection and try again.";

        conversation = getCurrentConversation();

        if (conversation) {
            conversation.messages.push({
                role: "assistant",
                content: message,
                timestamp: new Date().toISOString()
            });

            saveConversations();
        }

        appendMessage("assistant", message);
        showNotification("Could not connect to Divi AI.");
    } finally {
        isSending = false;
        setSendButtonState(false);
        if (chatInput) chatInput.focus();
    }
}

function setSendButtonState(disabled) {
    if (!sendButton) return;

    sendButton.disabled = disabled;
    sendButton.setAttribute("aria-busy", String(disabled));
}

// ==================================================
// REQUEST AI / WEB SEARCH
// ==================================================

async function requestAIResponse(question) {
    const response = await fetch(SEARCH_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
            query: question,
            question: question,
            search_query: question
        })
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
            "The server returned status " + response.status
        );
    }

    const answer =
        data.answer ||
        data.response ||
        data.result ||
        data.summary ||
        data.content ||
        data.message;

    const sources = normalizeSources(
        data.sources || data.results || data.data || []
    );

    if (answer && typeof answer === "string") {
        return {
            answer: answer,
            sources: sources
        };
    }

    if (sources.length > 0) {
        return {
            answer: "Here are some useful results I found for your question.",
            sources: sources
        };
    }

    return {
        answer: "The server responded, but it did not provide an answer. Please try rephrasing your question.",
        sources: []
    };
}

function normalizeSources(rawSources) {
    if (!Array.isArray(rawSources)) return [];

    return rawSources.map(source => {
        if (typeof source === "string") {
            return {
                title: source,
                url: source
            };
        }

        return {
            title:
                source.title ||
                source.name ||
                source.url ||
                "Source",
            url:
                source.url ||
                source.link ||
                source.href ||
                ""
        };
    }).filter(source => {
        try {
            const parsedUrl = new URL(source.url);
            return ["https:", "http:"].includes(parsedUrl.protocol);
        } catch {
            return false;
        }
    });
}

// ==================================================
// SEND BUTTON AND ENTER KEY
// ==================================================

if (sendButton) {
    sendButton.addEventListener("click", () => {
        sendMessage();
    });
}

if (chatInput) {
    chatInput.addEventListener("keydown", event => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    chatInput.addEventListener("input", () => {
        chatInput.style.height = "auto";
        chatInput.style.height =
            Math.min(chatInput.scrollHeight, 180) + "px";
    });
}

// Support alternative button IDs used by different HTML layouts.
[
    "sendBtn",
    "sendMessageButton",
    "chatSendButton"
].forEach(id => {
    const button = document.getElementById(id);

    if (button && button !== sendButton) {
        button.addEventListener("click", () => sendMessage());
    }
});

// ==================================================
// SUGGESTED PROMPTS
// ==================================================

document.querySelectorAll(
    "[data-prompt], .suggestion-card, .prompt-suggestion"
).forEach(button => {
    button.addEventListener("click", () => {
        const prompt =
            button.dataset.prompt ||
            button.textContent.trim();

        if (!prompt) return;

        if (chatInput) {
            chatInput.value = prompt;
        }

        sendMessage(prompt);
    });
});

// ==================================================
// VOICE INPUT
// ==================================================

function setupVoiceInput() {
    if (!voiceButton) return;

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        voiceButton.addEventListener("click", () => {
            showNotification(
                "Voice input is not supported by this browser. Try Chrome."
            );
        });

        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
        voiceButton.classList.add("recording");
        voiceButton.setAttribute("aria-pressed", "true");
        showNotification("Listening...");
    };

    recognition.onresult = event => {
        const transcript = event.results[0][0].transcript;

        if (chatInput) {
            chatInput.value = transcript;
            chatInput.focus();
        }
    };

    recognition.onerror = event => {
        console.error("Voice recognition error:", event.error);
        showNotification("Voice input could not be completed.");
    };

    recognition.onend = () => {
        voiceButton.classList.remove("recording");
        voiceButton.setAttribute("aria-pressed", "false");
    };

    voiceButton.addEventListener("click", () => {
        try {
            recognition.start();
        } catch (error) {
            console.warn("Voice recognition could not start:", error);
        }
    });
}

setupVoiceInput();

// ==================================================
// MOBILE SIDEBAR
// ==================================================

function closeMobileSidebar() {
    if (sidebar) {
        sidebar.classList.remove("sidebar-open");
    }

    document.body.classList.remove("sidebar-open");
}

function toggleMobileSidebar() {
    if (!sidebar) return;

    sidebar.classList.toggle("sidebar-open");
    document.body.classList.toggle(
        "sidebar-open",
        sidebar.classList.contains("sidebar-open")
    );
}

if (sidebarToggle) {
    sidebarToggle.addEventListener("click", toggleMobileSidebar);
}

document.querySelectorAll(
    ".mobile-menu-button, [data-toggle-sidebar]"
).forEach(button => {
    button.addEventListener("click", toggleMobileSidebar);
});

// ==================================================
// NOTIFICATIONS
// ==================================================

function showNotification(message) {
    let notification = document.getElementById("diviNotification");

    if (!notification) {
        notification = document.createElement("div");
        notification.id = "diviNotification";
        notification.className = "divi-notification";

        Object.assign(notification.style, {
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: "99999",
            maxWidth: "90%",
            padding: "12px 18px",
            borderRadius: "12px",
            background: "#17365d",
            color: "#ffffff",
            boxShadow: "0 6px 24px rgba(0,0,0,0.2)",
            fontSize: "14px",
            textAlign: "center"
        });

        document.body.appendChild(notification);
    }

    notification.textContent = message;
    notification.hidden = false;

    clearTimeout(notification._hideTimer);

    notification._hideTimer = setTimeout(() => {
        notification.hidden = true;
    }, 3500);
}

// ==================================================
// STARTUP
// ==================================================

function initializeDiviAI() {
    // The website starts on the homepage.
    if (homePage) {
        homePage.hidden = false;
    }

    if (aiAppScreen) {
        aiAppScreen.hidden = true;
    }

    document.body.classList.remove("chat-app");

    // Open the correct homepage tab when a supported hash is present.
    const requestedPage =
        hashToPage[window.location.hash.toLowerCase()] || "homeHero";

    showSitePage(requestedPage, false);

    // Ensure the history display is ready when the app opens.
    renderHistory();

    console.log("Divi AI JavaScript loaded successfully.");
}

initializeDiviAI();
```
