```javascript
"use strict";

/* =========================================
   DIVI AI — COMPLETE FRONTEND JAVASCRIPT
========================================= */

(() => {
    const API_URL = "https://divi-ai.onrender.com/api/web-search";
    const STORAGE_KEY = "diviAIConversations_v2";
    const MAX_CONVERSATIONS = 50;

    const $ = (id) => document.getElementById(id);

    const homePage = $("homePage");
    const aiAppScreen = $("aiAppScreen");
    const chatBox = $("chatBox");
    const userInput = $("userInput");
    const chatForm = $("chatForm");
    const sendButton = $("sendButton");
    const chatHistory = $("chatHistory");
    const welcomeScreen = $("welcomeScreen");
    const pageTitle = $("pageTitle");
    const pageSubtitle = $("pageSubtitle");
    const newChatButton = $("newChatButton");
    const clearHistoryButton = $("clearHistoryButton");
    const voiceButton = $("voiceButton");
    const sidebar = $("sidebar");
    const sidebarToggle = $("sidebarToggle");

    const pageIds = [
        "homeHero",
        "homeFeatures",
        "homeAbout",
        "homeContact"
    ];

    const hashPages = {
        "#home": "homeHero",
        "#features": "homeFeatures",
        "#about": "homeAbout",
        "#contact": "homeContact"
    };

    let conversations = loadConversations();
    let currentConversationId = null;
    let isSending = false;
    let recognition = null;

    /* =========================================
       STORAGE
    ========================================= */

    function loadConversations() {
        try {
            const value = localStorage.getItem(STORAGE_KEY);
            const parsed = value ? JSON.parse(value) : [];

            if (!Array.isArray(parsed)) return [];

            return parsed.filter(item =>
                item &&
                typeof item.id === "string" &&
                Array.isArray(item.messages)
            );
        } catch (error) {
            console.error("Could not load chat history:", error);
            return [];
        }
    }

    function saveConversations() {
        try {
            conversations = conversations.slice(0, MAX_CONVERSATIONS);
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(conversations)
            );
        } catch (error) {
            console.error("Could not save chat history:", error);
            notify("Could not save chat history in this browser.");
        }
    }

    function createConversation() {
        return {
            id: Date.now().toString() +
                Math.random().toString(36).slice(2),
            title: "New chat",
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    function currentConversation() {
        return conversations.find(
            item => item.id === currentConversationId
        ) || null;
    }

    /* =========================================
       NOTIFICATIONS
    ========================================= */

    function notify(message) {
        let element = $("diviNotification");

        if (!element) {
            element = document.createElement("div");
            element.id = "diviNotification";

            Object.assign(element.style, {
                position: "fixed",
                bottom: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: "999999",
                background: "#17365d",
                color: "#fff",
                padding: "12px 18px",
                borderRadius: "12px",
                maxWidth: "90%",
                fontSize: "14px",
                boxShadow: "0 5px 20px #0003"
            });

            document.body.appendChild(element);
        }

        element.textContent = message;
        element.hidden = false;

        clearTimeout(element.timer);

        element.timer = setTimeout(() => {
            element.hidden = true;
        }, 3500);
    }

    /* =========================================
       PAGE NAVIGATION
    ========================================= */

    function showSitePage(pageId, updateHash = true) {
        if (!pageIds.includes(pageId)) {
            pageId = "homeHero";
        }

        pageIds.forEach(id => {
            const section = $(id);
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

        if (updateHash) {
            const hashes = {
                homeHero: "#home",
                homeFeatures: "#features",
                homeAbout: "#about",
                homeContact: "#contact"
            };

            history.replaceState(null, "", hashes[pageId]);
        }

        window.scrollTo(0, 0);
    }

    function openDiviAI() {
        if (!homePage || !aiAppScreen) {
            console.error("Missing #homePage or #aiAppScreen in HTML.");
            notify("The chat screen could not be found.");
            return;
        }

        homePage.hidden = true;
        aiAppScreen.hidden = false;

        document.body.classList.add("chat-app");

        if (!currentConversationId ||
            !currentConversation()) {
            if (conversations.length) {
                currentConversationId = conversations[0].id;
            }
        }

        const conversation = currentConversation();

        if (conversation && conversation.messages.length) {
            renderConversation(conversation);
        } else {
            showWelcome();
        }

        updateHeader();
        renderHistory();
        window.scrollTo(0, 0);
    }

    function returnToHome() {
        if (aiAppScreen) aiAppScreen.hidden = true;
        if (homePage) homePage.hidden = false;

        document.body.classList.remove("chat-app");
        closeMobileSidebar();

        const page =
            hashPages[window.location.hash.toLowerCase()] ||
            "homeHero";

        showSitePage(page, false);
        window.scrollTo(0, 0);
    }

    // Keep compatibility with the onclick attributes in your HTML.
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

    document.querySelectorAll(
        'button[onclick="openDiviAI()"]'
    ).forEach(button => {
        button.addEventListener("click", event => {
            event.preventDefault();
            openDiviAI();
        });
    });

    document.querySelectorAll(
        'button[onclick="returnToHome()"]'
    ).forEach(button => {
        button.addEventListener("click", event => {
            event.preventDefault();
            returnToHome();
        });
    });

    window.addEventListener("hashchange", () => {
        if (homePage && !homePage.hidden) {
            showSitePage(
                hashPages[window.location.hash.toLowerCase()] ||
                "homeHero",
                false
            );
        }
    });

    /* =========================================
       HEADER AND WELCOME SCREEN
    ========================================= */

    function updateHeader() {
        const conversation = currentConversation();

        if (pageTitle) {
            pageTitle.textContent =
                conversation?.title || "Divi AI";
        }

        if (pageSubtitle) {
            pageSubtitle.textContent = conversation
                ? "Continue your conversation"
                : "What would you like to know?";
        }
    }

    function showWelcome() {
        if (!chatBox) return;

        chatBox.replaceChildren();

        if (welcomeScreen) {
            chatBox.appendChild(welcomeScreen);
            welcomeScreen.hidden = false;
        }

        if (pageSubtitle) {
            pageSubtitle.textContent = "What would you like to know?";
        }
    }

    /* =========================================
       CHAT RENDERING
    ========================================= */

    function appendMessage(role, content, sources = []) {
        if (!chatBox) return;

        const message = document.createElement("div");
        message.className =
            "message " +
            (role === "user"
                ? "user-message"
                : "assistant-message");

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

                    if (!["https:", "http:"].includes(url.protocol)) {
                        return;
                    }

                    const link = document.createElement("a");
                    link.href = url.href;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    link.textContent =
                        source.title || url.hostname;

                    sourceArea.appendChild(link);
                } catch (error) {
                    console.warn("Skipped invalid source URL.");
                }
            });

            if (sourceArea.querySelector("a")) {
                message.appendChild(sourceArea);
            }
        }

        chatBox.appendChild(message);
    }

    function renderConversation(conversation) {
        if (!chatBox) return;

        chatBox.replaceChildren();

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

    function scrollToBottom() {
        if (chatBox) {
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }

    function showTyping() {
        removeTyping();

        if (!chatBox) return;

        const element = document.createElement("div");
        element.id = "diviTyping";
        element.className = "message assistant-message";
        element.textContent = "Divi AI is thinking...";

        chatBox.appendChild(element);
        scrollToBottom();
    }

    function removeTyping() {
        $("diviTyping")?.remove();
    }

    /* =========================================
       CHAT HISTORY
    ========================================= */

    function renderHistory() {
        if (!chatHistory) return;

        chatHistory.replaceChildren();

        if (!conversations.length) {
            const empty = document.createElement("p");
            empty.className = "no-history";
            empty.textContent =
                "Your conversations will appear here.";

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
            openButton.textContent =
                conversation.title || "New chat";

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
            deleteButton.setAttribute(
                "aria-label",
                "Delete conversation"
            );

            deleteButton.addEventListener("click", event => {
                event.stopPropagation();
                deleteConversation(conversation.id);
            });

            row.append(openButton, deleteButton);
            chatHistory.appendChild(row);
        });
    }

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

    function deleteConversation(id) {
        conversations = conversations.filter(
            item => item.id !== id
        );

        if (currentConversationId === id) {
            currentConversationId = null;
            showWelcome();
            updateHeader();
        }

        saveConversations();
        renderHistory();
        notify("Conversation deleted.");
    }

    function clearHistory() {
        if (!window.confirm("Delete all your conversations?")) {
            return;
        }

        conversations = [];
        currentConversationId = null;

        saveConversations();
        showWelcome();
        updateHeader();
        renderHistory();

        notify("Chat history cleared.");
    }

    if (newChatButton) {
        newChatButton.addEventListener("click", startNewChat);
    }

    if (clearHistoryButton) {
        clearHistoryButton.addEventListener("click", clearHistory);
    }

    /* =========================================
       BACKEND REQUEST
    ========================================= */

    async function requestAI(question) {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                query: question,
                question: question,
                search_query: question
            })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.error ||
                data.message ||
                "Server returned HTTP " + response.status
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
                answer: answer.trim(),
                sources
            };
        }

        if (sources.length) {
            return {
                answer:
                    "I found some web results that may help with your question.",
                sources
            };
        }

        throw new Error(
            "The server returned no answer. Check the backend response format."
        );
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
                return ["https:", "http:"].includes(url.protocol);
            } catch (error) {
                return false;
            }
        });
    }

    /* =========================================
       SEND MESSAGE
    ========================================= */

    async function sendMessage(text) {
        text = (text || "").trim();

        if (!text || isSending) return;

        if (!currentConversation()) {
            const conversation = createConversation();
            conversations.unshift(conversation);
            currentConversationId = conversation.id;
        }

        let conversation = currentConversation();

        conversation.messages.push({
            role: "user",
            content: text,
            timestamp: new Date().toISOString()
        });

        if (conversation.messages.length === 1) {
            conversation.title =
                text.length > 40
                    ? text.slice(0, 40) + "..."
                    : text;
        }

        conversation.updatedAt = new Date().toISOString();

        if (userInput) {
            userInput.value = "";
            userInput.style.height = "auto";
        }

        renderConversation(conversation);
        updateHeader();
        renderHistory();
        saveConversations();

        isSending = true;

        if (sendButton) sendButton.disabled = true;

        showTyping();

        try {
            const result = await requestAI(text);

            conversation = currentConversation();

            removeTyping();

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
            updateHeader();
            renderHistory();
        } catch (error) {
            console.error("Divi AI backend error:", error);

            removeTyping();

            conversation = currentConversation();

            if (conversation) {
                conversation.messages.push({
                    role: "assistant",
                    content:
                        "I couldn't get an answer from the server. " +
                        "Please try again. Details: " +
                        error.message,
                    timestamp: new Date().toISOString()
                });

                saveConversations();
                renderConversation(conversation);
                updateHeader();
            }

            notify("The AI service could not complete your request.");
        } finally {
            isSending = false;

            if (sendButton) sendButton.disabled = false;
            if (userInput) userInput.focus();
        }
    }

    if (chatForm) {
        chatForm.addEventListener("submit", event => {
            event.preventDefault();
            sendMessage(userInput ? userInput.value : "");
        });
    }

    if (userInput) {
        userInput.addEventListener("keydown", event => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();

                if (chatForm &&
                    typeof chatForm.requestSubmit === "function") {
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

    document.querySelectorAll("[data-suggestion]").forEach(button => {
        button.addEventListener("click", () => {
            const prompt = button.dataset.suggestion;
            if (prompt) sendMessage(prompt);
        });
    });

    /* =========================================
       VOICE INPUT
    ========================================= */

    function setupVoice() {
        if (!voiceButton) return;

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            voiceButton.addEventListener("click", () => {
                notify("Voice input is not supported in this browser.");
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
            notify("Listening...");
        };

        recognition.onresult = event => {
            if (!userInput) return;

            userInput.value = event.results[0][0].transcript;
            userInput.focus();
        };

        recognition.onerror = event => {
            console.error("Voice input error:", event.error);
            notify("Voice input could not be completed.");
        };

        recognition.onend = () => {
            voiceButton.classList.remove("recording");
            voiceButton.setAttribute("aria-pressed", "false");
        };

        voiceButton.addEventListener("click", () => {
            try {
                recognition.start();
            } catch (error) {
                console.warn("Voice input could not start:", error);
            }
        });
    }

    setupVoice();

    /* =========================================
       MOBILE SIDEBAR
    ========================================= */

    function closeMobileSidebar() {
        if (sidebar) sidebar.classList.remove("sidebar-open");
        document.body.classList.remove("sidebar-open");
    }

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener("click", () => {
            sidebar.classList.toggle("sidebar-open");

            document.body.classList.toggle(
                "sidebar-open",
                sidebar.classList.contains("sidebar-open")
            );
        });
    }

    /* =========================================
       INITIALIZE
    ========================================= */

    const copyrightYear = $("copyrightYear");

    if (copyrightYear) {
        copyrightYear.textContent = new Date().getFullYear();
    }

    function initialize() {
        if (homePage) homePage.hidden = false;
        if (aiAppScreen) aiAppScreen.hidden = true;

        document.body.classList.remove("chat-app");

        const page =
            hashPages[window.location.hash.toLowerCase()] ||
            "homeHero";

        showSitePage(page, false);
        renderHistory();

        console.log("Divi AI JavaScript initialized successfully.");
    }

    initialize();
})();
```
