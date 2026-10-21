"use strict";

/* ==========================================
   DIVI AI — COMPLETE JAVASCRIPT
   Homepage + Navigation + Chat + History
========================================== */

(() => {
    const API_URL = "/api/web-search";
    const HISTORY_KEY = "diviAIConversations_v2";
    const MAX_CONVERSATIONS = 50;

    let conversations = [];
    let currentConversationId = null;
    let isSending = false;
    let recognition = null;

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        Array.from(parent.querySelectorAll(selector));

    const makeId = () =>
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 9);

    /* ==========================================
       SAFE STORAGE
    ========================================== */

    function saveHistory() {
        try {
            localStorage.setItem(
                HISTORY_KEY,
                JSON.stringify(conversations)
            );
        } catch (error) {
            console.error("Could not save conversation history:", error);
            showNotice("Conversation history could not be saved.");
        }
    }

    function loadHistory() {
        try {
            const saved = localStorage.getItem(HISTORY_KEY);
            const parsed = saved ? JSON.parse(saved) : [];

            conversations = Array.isArray(parsed)
                ? parsed.filter(item =>
                    item &&
                    typeof item.id === "string" &&
                    Array.isArray(item.messages)
                ).slice(0, MAX_CONVERSATIONS)
                : [];
        } catch (error) {
            console.error("Could not load conversation history:", error);
            conversations = [];
        }
    }

    /* ==========================================
       NOTIFICATIONS
    ========================================== */

    function showNotice(message) {
        let notice = $("#diviNotice");

        if (!notice) {
            notice = document.createElement("div");
            notice.id = "diviNotice";
            notice.className = "divi-notice";
            notice.setAttribute("role", "status");
            document.body.appendChild(notice);
        }

        notice.textContent = message;
        notice.hidden = false;

        clearTimeout(showNotice.timer);

        showNotice.timer = setTimeout(() => {
            notice.hidden = true;
        }, 3500);
    }

    /* ==========================================
       HOMEPAGE AND CHAT SCREEN
    ========================================== */

    function showHomePage(pageId = "homeHero") {
        const home = $("#homePage");
        const app = $("#aiAppScreen");

        if (!home) {
            showNotice("The homepage element #homePage was not found.");
            return;
        }

        if (app) {
            app.hidden = true;
            app.style.display = "none";
        }

        home.hidden = false;
        home.style.display = "";

        document.body.classList.remove("chat-app");

        showSitePage(pageId);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    function showSitePage(pageId) {
        const validPages = [
            "homeHero",
            "homeFeatures",
            "homeAbout",
            "homeContact"
        ];

        if (!validPages.includes(pageId)) {
            pageId = "homeHero";
        }

        validPages.forEach(id => {
            const page = document.getElementById(id);

            if (page) {
                page.hidden = id !== pageId;
            }
        });

        $$(".nav-tab").forEach(button => {
            const isActive = button.dataset.page === pageId;

            button.classList.toggle("active", isActive);

            if (isActive) {
                button.setAttribute("aria-current", "page");
            } else {
                button.removeAttribute("aria-current");
            }
        });
    }

    function openDiviAI() {
        const home = $("#homePage");
        const app = $("#aiAppScreen");

        if (!app) {
            showNotice("The chat screen #aiAppScreen was not found.");
            console.error("Missing HTML element: #aiAppScreen");
            return;
        }

        if (home) {
            home.hidden = true;
            home.style.display = "none";
        }

        app.hidden = false;
        app.style.display = "flex";

        document.body.classList.add("chat-app");

        closeSidebar();

        if (!currentConversationId) {
            createNewChat();
        } else {
            renderCurrentConversation();
        }

        const input = $("#userInput");

        if (input) {
            setTimeout(() => input.focus(), 100);
        }
    }

    function returnToHome() {
        closeSidebar();
        showHomePage("homeHero");
    }

    window.openDiviAI = openDiviAI;
    window.returnToHome = returnToHome;

    /* ==========================================
       HOMEPAGE BUTTONS
    ========================================== */

    function setupHomepageButtons() {
        $$(".nav-tab").forEach(button => {
            button.addEventListener("click", () => {
                const pageId = button.dataset.page;

                if (pageId) {
                    showSitePage(pageId);

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });
                }
            });
        });

        $$("[data-open-page]").forEach(button => {
            button.addEventListener("click", () => {
                const pageId = button.dataset.openPage;

                if (pageId) {
                    showSitePage(pageId);

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });
                }
            });
        });

        $$(
            ".open-ai-button, .hero-primary-button, " +
            "[data-open-divi], [data-open-chat]"
        ).forEach(button => {
            button.addEventListener("click", event => {
                event.preventDefault();
                openDiviAI();
            });
        });

        $$(
            ".home-return-button, .chat-home-button, " +
            "[data-return-home]"
        ).forEach(button => {
            button.addEventListener("click", event => {
                event.preventDefault();
                returnToHome();
            });
        });

        $$(".footer-brand").forEach(button => {
            button.addEventListener("click", () => {
                showSitePage("homeHero");
            });
        });

        const year = $("#currentYear");

        if (year) {
            year.textContent = new Date().getFullYear();
        }

        $$(".copyright").forEach(element => {
            if (element.dataset.autoYear === "true") {
                element.textContent =
                    `© ${new Date().getFullYear()} Divi AI.`;
            }
        });
    }

    /* ==========================================
       CONVERSATION MANAGEMENT
    ========================================== */

    function createNewChat() {
        const conversation = {
            id: makeId(),
            title: "New chat",
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        conversations.unshift(conversation);
        conversations = conversations.slice(0, MAX_CONVERSATIONS);

        currentConversationId = conversation.id;

        saveHistory();
        renderCurrentConversation();
        renderHistory();

        const input = $("#userInput");

        if (input) {
            input.value = "";
            input.style.height = "auto";
            input.focus();
        }

        closeSidebar();
    }

    function getCurrentConversation() {
        return conversations.find(
            item => item.id === currentConversationId
        ) || null;
    }

    function deleteConversation(id) {
        conversations = conversations.filter(
            item => item.id !== id
        );

        if (currentConversationId === id) {
            currentConversationId = null;

            if (conversations.length) {
                currentConversationId = conversations[0].id;
            } else {
                createNewChat();
                return;
            }
        }

        saveHistory();
        renderHistory();
        renderCurrentConversation();
    }

    function clearHistory() {
        if (!conversations.length) {
            showNotice("There is no conversation history to clear.");
            return;
        }

        const confirmed = window.confirm(
            "Clear all saved conversations? This cannot be undone."
        );

        if (!confirmed) return;

        conversations = [];
        currentConversationId = null;

        saveHistory();
        createNewChat();

        showNotice("Conversation history cleared.");
    }

    function loadConversation(id) {
        const conversation = conversations.find(
            item => item.id === id
        );

        if (!conversation) return;

        currentConversationId = id;

        renderHistory();
        renderCurrentConversation();
        closeSidebar();
    }

    function addMessage(role, content, extra = {}) {
        let conversation = getCurrentConversation();

        if (!conversation) {
            createNewChat();
            conversation = getCurrentConversation();
        }

        const message = {
            id: makeId(),
            role,
            content: String(content),
            timestamp: Date.now(),
            ...extra
        };

        conversation.messages.push(message);
        conversation.updatedAt = Date.now();

        if (
            role === "user" &&
            conversation.title === "New chat"
        ) {
            conversation.title = content.length > 38
                ? content.slice(0, 38) + "…"
                : content;
        }

        saveHistory();
        renderCurrentConversation();
        renderHistory();

        return message;
    }

    /* ==========================================
       RENDER CONVERSATION HISTORY
    ========================================== */

    function renderHistory() {
        const history = $("#chatHistory");

        if (!history) return;

        history.replaceChildren();

        if (!conversations.length) {
            const empty = document.createElement("p");

            empty.className = "no-history";
            empty.textContent = "Your conversations will appear here.";

            history.appendChild(empty);
            return;
        }

        conversations.forEach(conversation => {
            const row = document.createElement("div");

            row.className = "history-row";

            if (conversation.id === currentConversationId) {
                row.classList.add("selected");
            }

            const selectButton = document.createElement("button");

            selectButton.type = "button";
            selectButton.className = "history-item";
            selectButton.title = conversation.title;

            const icon = document.createElement("span");

            icon.className = "history-icon";
            icon.textContent = "💬";

            const title = document.createElement("span");

            title.className = "history-text";
            title.textContent = conversation.title || "New chat";

            selectButton.append(icon, title);

            selectButton.addEventListener("click", () => {
                loadConversation(conversation.id);
            });

            const deleteButton = document.createElement("button");

            deleteButton.type = "button";
            deleteButton.className = "delete-chat-button";
            deleteButton.textContent = "×";
            deleteButton.title = "Delete conversation";
            deleteButton.setAttribute(
                "aria-label",
                "Delete " + (conversation.title || "conversation")
            );

            deleteButton.addEventListener("click", event => {
                event.stopPropagation();
                deleteConversation(conversation.id);
            });

            row.append(selectButton, deleteButton);
            history.appendChild(row);
        });
    }

    /* ==========================================
       RENDER CHAT MESSAGES
    ========================================== */

    function renderCurrentConversation() {
        const chatBox = $("#chatBox");
        const welcome = $("#welcomeScreen");

        if (!chatBox) {
            console.warn("Chat box #chatBox was not found.");
            return;
        }

        const conversation = getCurrentConversation();
        const messages = conversation ? conversation.messages : [];

        if (welcome) {
            welcome.hidden = messages.length > 0;
        }

        $$(".message", chatBox).forEach(message => {
            message.remove();
        });

        $$(".search-results", chatBox).forEach(result => {
            result.remove();
        });

        messages.forEach(message => {
            renderMessage(message, false);
        });

        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function renderMessage(message, scroll = true) {
        const chatBox = $("#chatBox");

        if (!chatBox) return;

        const welcome = $("#welcomeScreen");

        if (welcome) {
            welcome.hidden = true;
        }

        const wrapper = document.createElement("div");

        wrapper.className = "message " +
            (message.role === "user" ? "user-message" : "ai-message");

        wrapper.dataset.messageId = message.id || "";

        const avatar = document.createElement("div");

        avatar.className = "message-avatar";
        avatar.textContent = message.role === "user" ? "YOU" : "D";

        const content = document.createElement("div");

        content.className = "message-content";
        content.textContent = message.content || "";

        wrapper.append(avatar, content);
        chatBox.appendChild(wrapper);

        if (scroll) {
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        return wrapper;
    }

    function showLoading() {
        const chatBox = $("#chatBox");

        if (!chatBox) return null;

        const wrapper = document.createElement("div");

        wrapper.className = "message ai-message loading-message";

        const avatar = document.createElement("div");

        avatar.className = "message-avatar";
        avatar.textContent = "D";

        const content = document.createElement("div");

        content.className = "message-content";
        content.textContent = "Divi AI is thinking…";

        wrapper.append(avatar, content);
        chatBox.appendChild(wrapper);

        chatBox.scrollTop = chatBox.scrollHeight;

        return wrapper;
    }

    /* ==========================================
       WEB SEARCH / AI BACKEND
    ========================================== */

    async function requestAnswer(question) {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                query: question,
                question: question,
                search_query: question
            })
        });

        const rawText = await response.text();

        let data = {};

        try {
            data = rawText ? JSON.parse(rawText) : {};
        } catch {
            data = { response: rawText };
        }

        if (!response.ok) {
            const errorMessage =
                data.error ||
                data.message ||
                data.detail ||
                `The server returned HTTP ${response.status}.`;

            throw new Error(errorMessage);
        }

        if (data.error) {
            throw new Error(data.error);
        }

        const answer =
            data.answer ??
            data.response ??
            data.result ??
            data.content ??
            data.message ??
            data.summary;

        if (typeof answer === "string" && answer.trim()) {
            return {
                text: answer.trim(),
                sources: Array.isArray(data.results)
                    ? data.results
                    : Array.isArray(data.sources)
                        ? data.sources
                        : []
            };
        }

        if (Array.isArray(data.results) && data.results.length) {
            return {
                text: data.results.map(item => {
                    const title = item.title || "Search result";
                    const url = item.url || "";
                    const snippet =
                        item.content || item.snippet || "";

                    return `${title}\n${snippet}\n${url}`;
                }).join("\n\n"),
                sources: data.results
            };
        }

        throw new Error(
            "The server responded, but no answer was found in its response."
        );
    }

    /* ==========================================
       SEND CHAT MESSAGE
    ========================================== */

    async function sendMessage(text) {
        const question = String(text || "").trim();

        if (!question || isSending) return;

        const input = $("#userInput");

        if (input) {
            input.value = "";
            input.style.height = "auto";
        }

        if (!getCurrentConversation()) {
            createNewChat();
        }

        addMessage("user", question);

        isSending = true;

        const sendButton = $("#sendButton");
        const loading = showLoading();

        if (sendButton) {
            sendButton.disabled = true;
        }

        try {
            const result = await requestAnswer(question);

            if (loading) {
                loading.remove();
            }

            addMessage("assistant", result.text);

            if (result.sources && result.sources.length) {
                renderSources(result.sources);
            }
        } catch (error) {
            console.error("Divi AI request failed:", error);

            if (loading) {
                loading.remove();
            }

            addMessage(
                "assistant",
                "Sorry, I couldn't get an answer from the server. " +
                error.message +
                "\n\nPlease check that the Divi AI backend is running " +
                "and that its /api/web-search endpoint is configured."
            );
        } finally {
            isSending = false;

            if (sendButton) {
                sendButton.disabled = false;
            }

            if (input) {
                input.focus();
            }
        }
    }

    function renderSources(sources) {
        const chatBox = $("#chatBox");

        if (!chatBox) return;

        const container = document.createElement("div");

        container.className = "search-results";

        const heading = document.createElement("h3");

        heading.textContent = "Sources";
        container.appendChild(heading);

        sources.slice(0, 8).forEach(source => {
            if (!source || typeof source !== "object") return;

            const url = source.url;

            if (typeof url !== "string") return;

            try {
                const parsedUrl = new URL(url);

                if (!["http:", "https:"].includes(parsedUrl.protocol)) {
                    return;
                }

                const link = document.createElement("a");

                link.className = "search-result-link";
                link.href = parsedUrl.href;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = source.title || parsedUrl.hostname;

                container.appendChild(link);
            } catch {
                // Ignore invalid URLs.
            }
        });

        if (container.children.length > 1) {
            chatBox.appendChild(container);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }

    /* ==========================================
       CHAT FORM AND INPUT
    ========================================== */

    function setupChatForm() {
        const form = $("#chatForm");
        const input = $("#userInput");
        const sendButton = $("#sendButton");

        if (form) {
            form.addEventListener("submit", event => {
                event.preventDefault();

                if (input) {
                    sendMessage(input.value);
                }
            });
        }

        if (sendButton && !form) {
            sendButton.addEventListener("click", () => {
                if (input) {
                    sendMessage(input.value);
                }
            });
        }

        if (input) {
            input.addEventListener("input", () => {
                input.style.height = "auto";

                input.style.height =
                    Math.min(input.scrollHeight, 180) + "px";
            });

            input.addEventListener("keydown", event => {
                if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.isComposing
                ) {
                    event.preventDefault();

                    if (form && typeof form.requestSubmit === "function") {
                        form.requestSubmit();
                    } else {
                        sendMessage(input.value);
                    }
                }
            });
        }

        $$(".suggestions button").forEach(button => {
            button.addEventListener("click", () => {
                const text = button.dataset.prompt ||
                    button.textContent.trim();

                if (text) {
                    openDiviAI();
                    sendMessage(text);
                }
            });
        });
    }

    /* ==========================================
       NEW CHAT AND CLEAR HISTORY
    ========================================== */

    function setupConversationButtons() {
        $$(".new-chat, #newChatButton, [data-new-chat]").forEach(button => {
            button.addEventListener("click", event => {
                event.preventDefault();
                createNewChat();
            });
        });

        $$("#clearHistoryButton, #clearHistory, [data-clear-history]")
            .forEach(button => {
                button.addEventListener("click", event => {
                    event.preventDefault();
                    clearHistory();
                });
            });

        const clearButton = $(
            ".history-title button:not(.new-chat)"
        );

        if (clearButton) {
            clearButton.addEventListener("click", event => {
                event.preventDefault();
                clearHistory();
            });
        }
    }

    /* ==========================================
       MOBILE SIDEBAR
    ========================================== */

    function closeSidebar() {
        const sidebar = $(".sidebar");

        if (sidebar) {
            sidebar.classList.remove("sidebar-open");
        }

        const toggle = $(".sidebar-toggle");

        if (toggle) {
            toggle.setAttribute("aria-expanded", "false");
        }
    }

    function setupSidebar() {
        const toggle = $(".sidebar-toggle");
        const sidebar = $(".sidebar");

        if (!toggle || !sidebar) return;

        toggle.setAttribute("aria-expanded", "false");

        toggle.addEventListener("click", () => {
            const isOpen = sidebar.classList.toggle("sidebar-open");

            toggle.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        });

        document.addEventListener("click", event => {
            if (
                window.innerWidth <= 760 &&
                sidebar.classList.contains("sidebar-open") &&
                !sidebar.contains(event.target) &&
                !toggle.contains(event.target)
            ) {
                closeSidebar();
            }
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 760) {
                closeSidebar();
            }
        });
    }

    /* ==========================================
       VOICE INPUT
    ========================================== */

    function setupVoiceInput() {
        const button = $("#voiceButton");

        if (!button) return;

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            button.addEventListener("click", () => {
                showNotice(
                    "Voice input is not supported by this browser. " +
                    "Try a supported browser with microphone permission."
                );
            });

            return;
        }

        recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.continuous = false;

        button.addEventListener("click", () => {
            try {
                recognition.start();
                button.setAttribute("aria-pressed", "true");
                showNotice("Listening… Speak now.");
            } catch (error) {
                console.error("Voice input could not start:", error);
                showNotice("Voice input is already running or unavailable.");
            }
        });

        recognition.addEventListener("result", event => {
            const transcript = event.results[0][0].transcript;
            const input = $("#userInput");

            if (input) {
                input.value = transcript;
                input.dispatchEvent(new Event("input", { bubbles: true }));
                input.focus();
            }
        });

        recognition.addEventListener("end", () => {
            button.setAttribute("aria-pressed", "false");
        });

        recognition.addEventListener("error", event => {
            button.setAttribute("aria-pressed", "false");

            if (event.error !== "no-speech") {
                showNotice("Voice input error: " + event.error);
            }
        });
    }

    /* ==========================================
       START APPLICATION
    ========================================== */

    function init() {
        loadHistory();

        setupHomepageButtons();
        setupChatForm();
        setupConversationButtons();
        setupSidebar();
        setupVoiceInput();

        const home = $("#homePage");
        const app = $("#aiAppScreen");

        if (home && app) {
            home.hidden = false;
            home.style.display = "";

            app.hidden = true;
            app.style.display = "none";

            document.body.classList.remove("chat-app");
        }

        if (conversations.length) {
            currentConversationId = conversations[0].id;
        }

        renderHistory();
        renderCurrentConversation();
        showSitePage("homeHero");

        console.log("Divi AI initialized successfully.");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
