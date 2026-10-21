"use strict";

(() => {
    const API_URL = "https://divi-ai.onrender.com/api/web-search";
    const STORAGE_KEY = "diviAIConversations_v2";
    const MAX_CHATS = 50;

    let conversations = [];
    let currentChatId = null;
    let sending = false;
    let recognition = null;

    const $ = (selector, root = document) =>
        root.querySelector(selector);

    const $$ = (selector, root = document) =>
        Array.from(root.querySelectorAll(selector));

    const createId = () =>
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 9);

    /* ==========================================
       NOTIFICATIONS
    ========================================== */

    function notify(message) {
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

        clearTimeout(notify.timer);

        notify.timer = setTimeout(() => {
            notice.hidden = true;
        }, 3500);
    }

    /* ==========================================
       HOMEPAGE NAVIGATION
    ========================================== */

    function showPage(pageId) {
        const pageIds = [
            "homeHero",
            "homeFeatures",
            "homeAbout",
            "homeContact"
        ];

        if (!pageIds.includes(pageId)) {
            pageId = "homeHero";
        }

        pageIds.forEach(id => {
            const page = document.getElementById(id);

            if (page) {
                page.hidden = id !== pageId;
            }
        });

        $$(".nav-tab").forEach(button => {
            const active = button.dataset.page === pageId;

            button.classList.toggle("active", active);

            if (active) {
                button.setAttribute("aria-current", "page");
            } else {
                button.removeAttribute("aria-current");
            }
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function openDiviAI() {
        const home = $("#homePage");
        const app = $("#aiAppScreen");

        if (!app) {
            notify("Chat screen not found. Please check your HTML.");
            return;
        }

        if (home) {
            home.hidden = true;
            home.style.display = "none";
        }

        app.hidden = false;
        app.style.display = "flex";

        document.body.classList.add("chat-app");

        if (!currentChatId || !getChat(currentChatId)) {
            createNewChat();
        } else {
            renderMessages();
            renderHistory();
        }

        closeSidebar();

        const input = $("#userInput");

        if (input) {
            setTimeout(() => input.focus(), 100);
        }
    }

    function returnToHome() {
        const home = $("#homePage");
        const app = $("#aiAppScreen");

        if (app) {
            app.hidden = true;
            app.style.display = "none";
        }

        if (home) {
            home.hidden = false;
            home.style.display = "";
        }

        document.body.classList.remove("chat-app");

        closeSidebar();
        showPage("homeHero");
    }

    window.openDiviAI = openDiviAI;
    window.returnToHome = returnToHome;

    /* ==========================================
       CONNECT HOMEPAGE BUTTONS
    ========================================== */

    function setupNavigation() {
        $$(".nav-tab").forEach(button => {
            button.addEventListener("click", () => {
                showPage(button.dataset.page);
            });
        });

        $$("[data-open-page]").forEach(button => {
            button.addEventListener("click", () => {
                showPage(button.dataset.openPage);
            });
        });

        $$(".open-ai-button, .hero-primary-button, .about-button, .contact-button")
            .forEach(button => {
                button.addEventListener("click", openDiviAI);
            });

        $$(".home-return-button, .chat-home-button")
            .forEach(button => {
                button.addEventListener("click", returnToHome);
            });

        const year = $("#copyrightYear");

        if (year) {
            year.textContent = new Date().getFullYear();
        }
    }

    /* ==========================================
       CONVERSATION STORAGE
    ========================================== */

    function loadChats() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const parsed = saved ? JSON.parse(saved) : [];

            conversations = Array.isArray(parsed)
                ? parsed.filter(chat =>
                    chat &&
                    typeof chat.id === "string" &&
                    Array.isArray(chat.messages)
                ).slice(0, MAX_CHATS)
                : [];
        } catch (error) {
            console.error("Unable to load chat history:", error);
            conversations = [];
        }
    }

    function saveChats() {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(conversations)
            );
        } catch (error) {
            console.error("Unable to save chat history:", error);
            notify("Could not save conversation history.");
        }
    }

    function getChat(id) {
        return conversations.find(chat => chat.id === id) || null;
    }

    function createNewChat() {
        const chat = {
            id: createId(),
            title: "New chat",
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        conversations.unshift(chat);
        conversations = conversations.slice(0, MAX_CHATS);

        currentChatId = chat.id;

        saveChats();
        renderHistory();
        renderMessages();
        closeSidebar();

        const input = $("#userInput");

        if (input) {
            input.value = "";
            input.style.height = "auto";
            input.focus();
        }
    }

    function deleteChat(id) {
        conversations = conversations.filter(chat => chat.id !== id);

        if (currentChatId === id) {
            currentChatId = conversations.length
                ? conversations[0].id
                : null;
        }

        if (!currentChatId) {
            saveChats();
            createNewChat();
            return;
        }

        saveChats();
        renderHistory();
        renderMessages();
    }

    function clearHistory() {
        if (!conversations.length) {
            notify("There are no conversations to clear.");
            return;
        }

        if (!window.confirm("Delete all saved conversations?")) {
            return;
        }

        conversations = [];
        currentChatId = null;

        saveChats();
        createNewChat();

        notify("Conversation history cleared.");
    }

    function selectChat(id) {
        if (!getChat(id)) return;

        currentChatId = id;

        renderHistory();
        renderMessages();
        closeSidebar();
    }

    /* ==========================================
       RENDER HISTORY
    ========================================== */

    function renderHistory() {
        const container = $("#chatHistory");

        if (!container) return;

        container.replaceChildren();

        if (!conversations.length) {
            const empty = document.createElement("p");
            empty.className = "no-history";
            empty.textContent = "Your conversations will appear here.";
            container.appendChild(empty);
            return;
        }

        conversations.forEach(chat => {
            const row = document.createElement("div");
            row.className = "history-row";

            if (chat.id === currentChatId) {
                row.classList.add("selected");
            }

            const selectButton = document.createElement("button");
            selectButton.type = "button";
            selectButton.className = "history-item";
            selectButton.title = chat.title;

            const icon = document.createElement("span");
            icon.className = "history-icon";
            icon.textContent = "💬";

            const title = document.createElement("span");
            title.className = "history-text";
            title.textContent = chat.title || "New chat";

            selectButton.append(icon, title);
            selectButton.addEventListener("click", () => selectChat(chat.id));

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "delete-chat-button";
            deleteButton.textContent = "×";
            deleteButton.title = "Delete conversation";
            deleteButton.setAttribute("aria-label", "Delete conversation");

            deleteButton.addEventListener("click", event => {
                event.stopPropagation();
                deleteChat(chat.id);
            });

            row.append(selectButton, deleteButton);
            container.appendChild(row);
        });
    }

    /* ==========================================
       RENDER MESSAGES
    ========================================== */

    function renderMessages() {
        const box = $("#chatBox");
        const welcome = $("#welcomeScreen");

        if (!box) return;

        const chat = getChat(currentChatId);
        const messages = chat ? chat.messages : [];

        if (welcome) {
            welcome.hidden = messages.length > 0;
        }

        $$(".message, .search-results", box).forEach(element => {
            element.remove();
        });

        messages.forEach(message => {
            addMessageToScreen(message, false);
        });

        box.scrollTop = box.scrollHeight;
    }

    function addMessageToScreen(message, scroll = true) {
        const box = $("#chatBox");

        if (!box) return;

        const welcome = $("#welcomeScreen");

        if (welcome) {
            welcome.hidden = true;
        }

        const row = document.createElement("div");

        row.className = "message " +
            (message.role === "user" ? "user-message" : "ai-message");

        const avatar = document.createElement("div");
        avatar.className = "message-avatar";
        avatar.textContent = message.role === "user" ? "YOU" : "D";

        const content = document.createElement("div");
        content.className = "message-content";
        content.textContent = message.content;

        row.append(avatar, content);
        box.appendChild(row);

        if (scroll) {
            box.scrollTop = box.scrollHeight;
        }

        return row;
    }

    function addMessage(role, content) {
        let chat = getChat(currentChatId);

        if (!chat) {
            createNewChat();
            chat = getChat(currentChatId);
        }

        const message = {
            id: createId(),
            role,
            content: String(content),
            timestamp: Date.now()
        };

        chat.messages.push(message);
        chat.updatedAt = Date.now();

        if (role === "user" && chat.title === "New chat") {
            chat.title = content.length > 40
                ? content.slice(0, 40) + "…"
                : content;
        }

        saveChats();
        addMessageToScreen(message);
        renderHistory();

        return message;
    }

    function showLoading() {
        const box = $("#chatBox");

        if (!box) return null;

        const row = document.createElement("div");
        row.className = "message ai-message loading-message";

        const avatar = document.createElement("div");
        avatar.className = "message-avatar";
        avatar.textContent = "D";

        const content = document.createElement("div");
        content.className = "message-content";
        content.textContent = "Divi AI is thinking…";

        row.append(avatar, content);
        box.appendChild(row);
        box.scrollTop = box.scrollHeight;

        return row;
    }

    /* ==========================================
       SEND MESSAGE TO YOUR BACKEND
    ========================================== */

        async function askBackend(question) {
        const chat = getChat(currentChatId);

        // Get the previous messages in this conversation.
        const history = (chat?.messages || [])
            .slice(-12)
            .map(message => ({
                role: message.role === "assistant" ? "assistant" : "user",
                content: message.content
            }));

        const response = await fetch(API_URL, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                query: question,
                question: question,
                search_query: question,
                history: history,
                messages: history
            })
        });

        const text = await response.text();
        let data;

        try {
            data = text ? JSON.parse(text) : {};
        } catch {
            data = { response: text };
        }

        if (!response.ok) {
            throw new Error(
                data.error ||
                data.message ||
                data.detail ||
                `Server error: ${response.status}`
            );
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
                answer: answer.trim(),
                sources: data.sources || data.results || []
            };
        }

        throw new Error(
            "The backend did not return an answer. Check its response format."
        );
    }
    async function sendMessage(text) {
        const question = String(text || "").trim();

        if (!question || sending) return;

        if (!getChat(currentChatId)) {
            createNewChat();
        }

        const input = $("#userInput");

        if (input) {
            input.value = "";
            input.style.height = "auto";
        }

        addMessage("user", question);

        sending = true;

        const sendButton = $("#sendButton");

        if (sendButton) {
            sendButton.disabled = true;
        }

        const loading = showLoading();

        try {
            const result = await askBackend(question);

            if (loading) loading.remove();

            addMessage("assistant", result.answer);
            renderSources(result.sources);
        } catch (error) {
            console.error("Divi AI error:", error);

            if (loading) loading.remove();

            addMessage(
                "assistant",
                "I couldn't get an answer from the server.\n\n" +
                error.message +
                "\n\nPlease check that the backend endpoint /api/web-search " +
                "is working and that its API key is configured."
            );
        } finally {
            sending = false;

            if (sendButton) {
                sendButton.disabled = false;
            }

            if (input) input.focus();
        }
    }

    function renderSources(sources) {
        const box = $("#chatBox");

        if (!box || !Array.isArray(sources) || !sources.length) return;

        const section = document.createElement("div");
        section.className = "search-results";

        const heading = document.createElement("h3");
        heading.textContent = "Sources";
        section.appendChild(heading);

        sources.slice(0, 6).forEach(source => {
            const url = source && source.url;

            if (typeof url !== "string") return;

            try {
                const parsed = new URL(url);

                if (!["http:", "https:"].includes(parsed.protocol)) return;

                const link = document.createElement("a");
                link.className = "search-result-link";
                link.href = parsed.href;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = source.title || parsed.hostname;

                section.appendChild(link);
            } catch {
                // Ignore invalid links.
            }
        });

        if (section.children.length > 1) {
            box.appendChild(section);
            box.scrollTop = box.scrollHeight;
        }
    }

    /* ==========================================
       CHAT FORM
    ========================================== */

    function setupChat() {
        const form = $("#chatForm");
        const input = $("#userInput");

        if (form) {
            form.addEventListener("submit", event => {
                event.preventDefault();
                sendMessage(input ? input.value : "");
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

                    if (form && form.requestSubmit) {
                        form.requestSubmit();
                    } else {
                        sendMessage(input.value);
                    }
                }
            });
        }

        $$("[data-suggestion]").forEach(button => {
            button.addEventListener("click", () => {
                sendMessage(button.dataset.suggestion);
            });
        });

        // Matches the three suggestion buttons in your supplied HTML.
        $$(".suggestions button").forEach(button => {
            button.addEventListener("click", () => {
                const suggestion = button.dataset.suggestion;

                if (suggestion) {
                    sendMessage(suggestion);
                }
            });
        });
    }

    /* ==========================================
       CHAT CONTROL BUTTONS
    ========================================== */

    function setupChatButtons() {
        const newChatButton = $("#newChatButton");

        if (newChatButton) {
            newChatButton.addEventListener("click", createNewChat);
        }

        const clearButton = $("#clearHistoryButton");

        if (clearButton) {
            clearButton.addEventListener("click", clearHistory);
        }

        const toggle = $("#sidebarToggle");
        const sidebar = $("#sidebar");

        if (toggle && sidebar) {
            toggle.addEventListener("click", () => {
                const opened = sidebar.classList.toggle("sidebar-open");

                toggle.setAttribute("aria-expanded", String(opened));
            });

            document.addEventListener("click", event => {
                if (
                    window.innerWidth <= 760 &&
                    sidebar.classList.contains("sidebar-open") &&
                    !sidebar.contains(event.target) &&
                    !toggle.contains(event.target)
                ) {
                    sidebar.classList.remove("sidebar-open");
                    toggle.setAttribute("aria-expanded", "false");
                }
            });
        }

        window.addEventListener("resize", () => {
            if (window.innerWidth > 760 && sidebar) {
                sidebar.classList.remove("sidebar-open");
            }
        });
    }

    function closeSidebar() {
        const sidebar = $("#sidebar");
        const toggle = $("#sidebarToggle");

        if (sidebar) {
            sidebar.classList.remove("sidebar-open");
        }

        if (toggle) {
            toggle.setAttribute("aria-expanded", "false");
        }
    }

    /* ==========================================
       VOICE INPUT
    ========================================== */

    function setupVoice() {
        const button = $("#voiceButton");

        if (!button) return;

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            button.addEventListener("click", () => {
                notify("Voice input is not supported in this browser.");
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
            } catch (error) {
                console.warn("Voice recognition could not start:", error);
                notify("Please try voice input again.");
            }
        });

        recognition.addEventListener("result", event => {
            const input = $("#userInput");

            if (input) {
                input.value = event.results[0][0].transcript;
                input.dispatchEvent(new Event("input", { bubbles: true }));
                input.focus();
            }
        });

        recognition.addEventListener("error", event => {
            if (event.error !== "no-speech") {
                notify("Voice input error: " + event.error);
            }
        });
    }

    /* ==========================================
       INITIALIZE
    ========================================== */

    function init() {
        loadChats();
        setupNavigation();
        setupChat();
        setupChatButtons();
        setupVoice();

        const home = $("#homePage");
        const app = $("#aiAppScreen");

        if (home) {
            home.hidden = false;
            home.style.display = "";
        }

        if (app) {
            app.hidden = true;
            app.style.display = "none";
        }

        document.body.classList.remove("chat-app");

        const year = $("#copyrightYear");

        if (year) {
            year.textContent = new Date().getFullYear();
        }

        if (conversations.length) {
            currentChatId = conversations[0].id;
        }

        renderHistory();
        renderMessages();
        showPage("homeHero");

        console.log("Divi AI loaded. Navigation and chat buttons initialized.");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
