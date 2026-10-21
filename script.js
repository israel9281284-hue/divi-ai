```javascript
"use strict";

// ==================================================
// DIVI AI — JAVASCRIPT MATCHED TO YOUR HTML
// ==================================================

const SEARCH_API_URL = "https://divi-ai.onrender.com/api/web-search";
const HISTORY_KEY = "diviAIConversations_v2";
const MAX_CONVERSATIONS = 50;

// ==================================================
// ELEMENTS
// ==================================================

const homePage = document.getElementById("homePage");
const aiAppScreen = document.getElementById("aiAppScreen");

const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const chatForm = document.getElementById("chatForm");
const sendButton = document.getElementById("sendButton");

const chatHistory = document.getElementById("chatHistory");
const newChatButton = document.getElementById("newChatButton");
const clearHistoryButton = document.getElementById("clearHistoryButton");

const welcomeScreen = document.getElementById("welcomeScreen");
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

const voiceButton = document.getElementById("voiceButton");
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");

// ==================================================
// STATE
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
        const data = saved ? JSON.parse(saved) : [];

        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Unable to load conversations:", error);
        return [];
    }
}

function saveConversations() {
    try {
        conversations = conversations.slice(0, MAX_CONVERSATIONS);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(conversations));
    } catch (error) {
        console.error("Unable to save conversations:", error);
        showNotification("Unable to save chat history.");
    }
}

function createConversation() {
    return {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        title: "New chat",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

function getCurrentConversation() {
    return conversations.find(
        item => item.id === currentConversationId
    ) || null;
}

// ==================================================
// HOMEPAGE NAVIGATION
// ==================================================

const sitePages = [
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
    if (!sitePages.includes(pageId)) {
        pageId = "homeHero";
    }

    sitePages.forEach(id => {
        const section = document.getElementById(id);
        if (section) section.hidden = id !== pageId;
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
            homeHero: "#home",
            homeFeatures: "#features",
            homeAbout: "#about",
            homeContact: "#contact"
        };

        history.replaceState(null, "", pageToHash[pageId]);
    }

    window.scrollTo(0, 0);
}

function openDiviAI() {
    if (!homePage || !aiAppScreen) {
        console.error("Cannot find homepage or chat application.");
        return;
    }

    homePage.hidden = true;
    aiAppScreen.hidden = false;
    document.body.classList.add("chat-app");

    if (!chatInitialized) {
        chatInitialized = true;

        if (conversations.length > 0) {
            currentConversationId = conversations[0].id;
            renderConversation(getCurrentConversation());
        } else {
            showWelcome();
        }

        renderHistory();
        updateHeader();
    } else {
        renderHistory();
        renderConversation(getCurrentConversation());
        updateHeader();
    }

    window.scrollTo(0, 0);
}

function returnToHome() {
    if (aiAppScreen) aiAppScreen.hidden = true;
    if (homePage) homePage.hidden = false;

    document.body.classList.remove("chat-app");
    closeMobileSidebar();

    const page =
        hashToPage[window.location.hash.toLowerCase()] || "homeHero";

    showSitePage(page, false);
    window.scrollTo(0, 0);
}

window.openDiviAI = openDiviAI;
window.returnToHome = returnToHome;
window.showSitePage = showSitePage;

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

window.addEventListener("hashchange", () => {
    if (homePage && !homePage.hidden) {
        const page =
            hashToPage[window.location.hash.toLowerCase()] || "homeHero";

        showSitePage(page, false);
    }
});

// ==================================================
// WELCOME SCREEN
// ==================================================

function showWelcome() {
    if (!chatBox) return;

    chatBox.innerHTML = "";

    if (welcomeScreen) {
        chatBox.appendChild(welcomeScreen);
        welcomeScreen.hidden = false;
    }

    if (pageSubtitle) {
        pageSubtitle.textContent = "What would you like to know?";
    }
}

function updateHeader() {
    const conversation = getCurrentConversation();

    if (pageTitle) {
        pageTitle.textContent = conversation
            ? conversation.title
            : "Divi AI";
    }

    if (pageSubtitle) {
        pageSubtitle.textContent = conversation
            ? "Continue your conversation"
            : "What would you like to know?";
    }
}

// ==================================================
// NEW CHAT
// ==================================================

function startNewChat() {
    currentConversationId = null;
    showWelcome();
    updateHeader();
    renderHistory();
    closeMobileSidebar();

    if (userInput) {
        userInput.value = "";
        userInput.focus();
    }
}

if (newChatButton) {
    newChatButton.addEventListener("click", startNewChat);
}

// ==================================================
// CLEAR ALL HISTORY
// ==================================================

function clearHistory() {
    if (!window.confirm("Delete all your conversations?")) return;

    conversations = [];
    currentConversationId = null;

    saveConversations();
    renderHistory();
    showWelcome();
    updateHeader();

    showNotification("Chat history cleared.");
}

if (clearHistoryButton) {
    clearHistoryButton.addEventListener("click", clearHistory);
}

// ==================================================
// RENDER CHAT HISTORY
// ==================================================

function renderHistory() {
    if (!chatHistory) return;

    chatHistory.innerHTML = "";

    if (conversations.length === 0) {
        const empty = document.createElement("p");
        empty.className = "no-history";
        empty.textContent = "Your conversations will appear here.";
        chatHistory.appendChild(empty);
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

        openButton.addEventListener("click", () => {
            currentConversationId = conversation.id;
            renderConversation(conversation);
            updateHeader();
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

        row.append(openButton, deleteButton);
        chatHistory.appendChild(row);
    });
}

function deleteConversation(id) {
    conversations = conversations.filter(item => item.id !== id);

    if (currentConversationId === id) {
        currentConversationId = null;
        showWelcome();
        updateHeader();
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

    if (!conversation || !conversation.messages.length) {
        showWelcome();
        return;
    }

    conversation.messages.forEach(message => {
        appendMessage(
            message.role,
            message.content,
            message.sources || []
        );
    });

    scrollToBottom();
}

function appendMessage(role, content, sources = []) {
    if (!chatBox) return;

    const message = document.createElement("div");
    message.className = "message " +
        (role === "user" ? "user-message" : "assistant-message");

    const bubble = document.createElement("div");
    bubble.className = "message-content";
    bubble.textContent = content || "";

    message.appendChild(bubble);

    if (Array.isArray(sources) && sources.length) {
        const sourceArea = document.createElement("div");
        sourceArea.className = "message-sources";

        const heading = document.createElement("strong");
        heading.textContent = "Sources";
        sourceArea.appendChild(heading);

        sources.forEach(source => {
            if (!source || !source.url) return;

            try {
                const url = new URL(source.url);

                if (!["http:", "https:"].includes(url.protocol)) return;

                const link = document.createElement("a");
                link.href = url.href;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = source.title || url.hostname;

                sourceArea.appendChild(link);
            } catch {
                // Skip invalid URLs.
            }
        });

        if (sourceArea.querySelector("a")) {
            message.appendChild(sourceArea);
        }
    }

    chatBox.appendChild(message);
}

function scrollToBottom() {
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
}

// ==================================================
// TYPING INDICATOR
// ==================================================

function showTyping() {
    removeTyping();

    const typing = document.createElement("div");
    typing.id = "diviTyping";
    typing.className = "message assistant-message";
    typing.textContent = "Divi AI is thinking...";

    chatBox.appendChild(typing);
    scrollToBottom();
}

function removeTyping() {
    const typing = document.getElementById("diviTyping");
    if (typing) typing.remove();
}

// ==================================================
// SEND MESSAGE
// ==================================================

async function sendMessage(text) {
    text = (text || "").trim();

    if (!text || isSending) return;

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
        conversation.title =
            text.length > 40 ? text.slice(0, 40) + "..." : text;
    }

    conversation.updatedAt = new Date().toISOString();

    if (userInput) {
        userInput.value = "";
        userInput.style.height = "auto";
    }

    if (welcomeScreen) welcomeScreen.hidden = true;

    // Display the new message immediately.
    renderConversation(conversation);
    renderHistory();
    updateHeader();
    saveConversations();

    isSending = true;

    if (sendButton) sendButton.disabled = true;

    showTyping();

    try {
        const result = await requestAI(text);

        removeTyping();

        conversation = getCurrentConversation();

        if (!conversation) return;

        conversation.messages.push({
            role: "assistant",
            content: result.answer,
            sources: result.sources,
            timestamp: new Date().toISOString()
        });

        conversation.updatedAt = new Date().toISOString();

        saveConversations();
        renderConversation(conversation);
        renderHistory();
        updateHeader();
    } catch (error) {
        console.error("Divi AI request error:", error);

        removeTyping();

        const errorMessage =
            "I couldn't connect to the AI service. Please try again in a moment.";

        conversation = getCurrentConversation();

        if (conversation) {
            conversation.messages.push({
                role: "assistant",
                content: errorMessage,
                timestamp: new Date().toISOString()
            });

            saveConversations();
            renderConversation(conversation);
        }

        showNotification("Connection failed. Check the backend service.");
    } finally {
        isSending = false;

        if (sendButton) sendButton.disabled = false;

        if (userInput) userInput.focus();
    }
}

// ==================================================
// TAVILY BACKEND REQUEST
// ==================================================

async function requestAI(question) {
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
            data.error || data.message || "Request failed: " + response.status
        );
    }

    const answer =
        data.answer ||
        data.response ||
        data.summary ||
        data.result ||
        data.content ||
        data.message;

    const rawSources =
        data.sources ||
        data.results ||
        data.data ||
        [];

    const sources = normalizeSources(rawSources);

    if (typeof answer === "string" && answer.trim()) {
        return {
            answer: answer,
            sources: sources
        };
    }

    if (sources.length) {
        return {
            answer: "I found some web results that may help with your question.",
            sources: sources
        };
    }

    throw new Error("The server did not return an answer or search results.");
}

function normalizeSources(items) {
    if (!Array.isArray(items)) return [];

    return items.map(item => {
        if (typeof item === "string") {
            return { title: item, url: item };
        }

        return {
            title: item.title || item.name || item.url || "Source",
            url: item.url || item.link || item.href || ""
        };
    }).filter(item => {
        try {
            const url = new URL(item.url);
            return ["http:", "https:"].includes(url.protocol);
        } catch {
            return false;
        }
    });
}

// ==================================================
// FORM SUBMISSION
// ==================================================

if (chatForm) {
    chatForm.addEventListener("submit", event => {
        event.preventDefault();

        if (userInput) {
            sendMessage(userInput.value);
        }
    });
}

if (userInput) {
    userInput.addEventListener("keydown", event => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();

            if (chatForm && typeof chatForm.requestSubmit === "function") {
                chatForm.requestSubmit();
            } else {
                sendMessage(userInput.value);
            }
        }
    });

    userInput.addEventListener("input", () => {
        userInput.style.height = "auto";
        userInput.style.height =
            Math.min(userInput.scrollHeight, 160) + "px";
    });
}

// ==================================================
// SUGGESTED PROMPTS
// ==================================================

document.querySelectorAll("[data-suggestion]").forEach(button => {
    button.addEventListener("click", () => {
        const prompt = button.dataset.suggestion;

        if (prompt) {
            sendMessage(prompt);
        }
    });
});

// ==================================================
// VOICE INPUT
// ==================================================

function setupVoiceInput() {
    if (!voiceButton) return;

    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        voiceButton.addEventListener("click", () => {
            showNotification(
                "Voice input is unavailable in this browser. Try Chrome."
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
        const text = event.results[0][0].transcript;

        if (userInput) {
            userInput.value = text;
            userInput.focus();
        }
    };

    recognition.onerror = error => {
        console.error("Voice recognition error:", error);
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
    if (sidebar) sidebar.classList.remove("sidebar-open");

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

// ==================================================
// NOTIFICATIONS
// ==================================================

function showNotification(message) {
    let notice = document.getElementById("diviNotification");

    if (!notice) {
        notice = document.createElement("div");
        notice.id = "diviNotification";

        Object.assign(notice.style, {
            position: "fixed",
            bottom: "22px",
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

        document.body.appendChild(notice);
    }

    notice.textContent = message;
    notice.hidden = false;

    clearTimeout(notice._timer);

    notice._timer = setTimeout(() => {
        notice.hidden = true;
    }, 3500);
}

// ==================================================
// COPYRIGHT YEAR AND STARTUP
// ==================================================

const copyrightYear = document.getElementById("copyrightYear");

if (copyrightYear) {
    copyrightYear.textContent = new Date().getFullYear();
}

function initializeDiviAI() {
    if (homePage) homePage.hidden = false;
    if (aiAppScreen) aiAppScreen.hidden = true;

    document.body.classList.remove("chat-app");

    const page =
        hashToPage[window.location.hash.toLowerCase()] || "homeHero";

    showSitePage(page, false);

    renderHistory();

    console.log("Divi AI loaded successfully.");
}

initializeDiviAI();
```
