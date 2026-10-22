"use strict";

(() => {
    /* ==========================================
       CONFIGURATION
    ========================================== */

    const API_URL = "https://divi-ai.onrender.com/api/web-search";
    const AUTH_API = "https://divi-ai.onrender.com/api";
    const STORAGE_KEY = "diviAIConversations_v2";
    const MAX_CHATS = 50;

    let conversations = [];
    let currentChatId = null;
    let sending = false;
    let recognition = null;

    let authLoggedIn = false;
    let authUsername = "";
    let authStatusChecked = false;
    let authStatusPromise = null;

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

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    /* ==========================================
       AUTHENTICATION
    ========================================== */

    function authMessage(formId, message, isError = false) {
        const messageId = formId === "loginForm"
            ? "loginMessage"
            : "registerMessage";

        const element = document.getElementById(messageId);

        if (element) {
            element.textContent = message;
            element.style.color = isError ? "#dc2626" : "#15803d";
        } else if (message) {
            notify(message);
        }
    }

    function setAuthMode(mode) {
        const loginForm = $("#loginForm");
        const registerForm = $("#registerForm");
        const title = $("#authTitle");
        const description = $("#authDescription");
        const switchText = $("#authSwitchText");
        const switchButton = $("#authSwitchButton");

        const registering = mode === "register";

        if (loginForm) loginForm.hidden = registering;
        if (registerForm) registerForm.hidden = !registering;

        if (title) {
            title.textContent = registering
                ? "Create your account"
                : "Welcome back";
        }

        if (description) {
            description.textContent = registering
                ? "Create an account to start using Divi AI."
                : "Log in to your Divi AI account.";
        }

        if (switchText) {
            switchText.textContent = registering
                ? "Already have an account?"
                : "New to Divi AI?";
        }

        if (switchButton) {
            switchButton.textContent = registering
                ? "Log in"
                : "Create an account";

            switchButton.dataset.authOpen = registering
                ? "login"
                : "register";
        }

        authMessage("loginForm", "");
        authMessage("registerForm", "");
    }

    function openAuthScreen(mode = "login") {
        const home = $("#homePage");
        const app = $("#aiAppScreen");
        const authScreen = $("#authScreen");

        if (!authScreen) {
            notify("Login screen not found. Check your index.html.");
            return;
        }

        if (home) {
            home.hidden = true;
            home.style.display = "none";
        }

        if (app) {
            app.hidden = true;
            app.style.display = "none";
        }

        authScreen.hidden = false;
        authScreen.style.display = "flex";

        document.body.classList.remove("chat-app");

        setAuthMode(mode);
    }

    function closeAuthScreen() {
        const authScreen = $("#authScreen");
        const home = $("#homePage");

        if (authScreen) {
            authScreen.hidden = true;
            authScreen.style.display = "none";
        }

        if (home) {
            home.hidden = false;
            home.style.display = "";
        }

        document.body.classList.remove("chat-app");
        showPage("homeHero");
    }

    ```javascript
async function authRequest(endpoint, payload = {}) {
    const response = await fetch(`${AUTH_API}${endpoint}`, {
        method: endpoint === "/auth/status" ? "GET" : "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        ...(endpoint === "/auth/status"
            ? {}
            : { body: JSON.stringify(payload) })
    });

    const text = await response.text();

    let data = {};

    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = { message: text };
    }

    if (!response.ok) {
        throw new Error(
            data.error ||
            data.message ||
            data.detail ||
            `Request failed (${response.status}).`
        );
    }

    if (data.error) {
        throw new Error(data.error);
    }

    return data;
}
```
    async function checkAuthStatus() {
        if (authStatusChecked) {
            return authLoggedIn;
        }

        if (authStatusPromise) {
            return authStatusPromise;
        }

        authStatusPromise = (async () => {
            try {
                const response = await fetch(
                    `${AUTH_API}/auth/status`,
                    {
                        method: "GET",
                        credentials: "include",
                        headers: {
                            "Accept": "application/json"
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `Authentication check failed (${response.status}).`
                    );
                }

                const data = await response.json();

                authLoggedIn = Boolean(
                    data.logged_in ??
                    data.authenticated ??
                    data.is_logged_in ??
                    data.loggedIn
                );

                authUsername = data.username || "";
                authStatusChecked = true;

                updateAuthUI();

                return authLoggedIn;
            } catch (error) {
                console.error("Could not check login status:", error);

                authLoggedIn = false;
                authUsername = "";
                authStatusChecked = false;

                return false;
            } finally {
                authStatusPromise = null;
            }
        })();

        return authStatusPromise;
    }

    function updateAuthUI() {
        const usernameElements = $$("[data-auth-username]");

        usernameElements.forEach(element => {
            element.textContent = authUsername || "User";
        });

        $$("[data-auth-logged-in]").forEach(element => {
            element.hidden = !authLoggedIn;
        });

        $$("[data-auth-logged-out]").forEach(element => {
            element.hidden = authLoggedIn;
        });

        const logoutButton = $("#logoutButton");

        if (logoutButton) {
            logoutButton.hidden = !authLoggedIn;
        }
    }

    function setupAuth() {
        $$("[data-auth-open]").forEach(button => {
            button.addEventListener("click", event => {
                event.preventDefault();

                const mode = button.dataset.authOpen || "login";
                openAuthScreen(mode);
            });
        });

        $$("[data-auth-close]").forEach(button => {
            button.addEventListener("click", event => {
                event.preventDefault();
                closeAuthScreen();
            });
        });

        const switchButton = $("#authSwitchButton");

        if (switchButton) {
            switchButton.addEventListener("click", () => {
                const mode = switchButton.dataset.authOpen || "register";
                setAuthMode(mode);
            });
        }

        const loginForm = $("#loginForm");

        if (loginForm) {
            loginForm.addEventListener("submit", async event => {
                event.preventDefault();

                const identifier = $("#loginIdentifier")?.value.trim();
                const password = $("#loginPassword")?.value;

                if (!identifier || !password) {
                    authMessage(
                        "loginForm",
                        "Enter your username and password.",
                        true
                    );
                    return;
                }

                const submitButton = $(
                    'button[type="submit"]',
                    loginForm
                );

                if (submitButton) {
                    submitButton.disabled = true;
                }

                authMessage("loginForm", "Logging in...");

                try {
                    const data = await authRequest("/login", {
                        username: identifier,
                        identifier: identifier,
                        password: password
                    });

                    authLoggedIn = true;
                    authUsername = data.username || identifier;
                    authStatusChecked = true;
                    authStatusPromise = null;

                    updateAuthUI();
                    loginForm.reset();

                    notify("Login successful!");

                    await openDiviAI();
                } catch (error) {
                    authMessage(
                        "loginForm",
                        error.message || "Login failed.",
                        true
                    );
                } finally {
                    if (submitButton) {
                        submitButton.disabled = false;
                    }
                }
            });
        }

        const registerForm = $("#registerForm");

        if (registerForm) {
            registerForm.addEventListener("submit", async event => {
                event.preventDefault();

                const username = $("#registerUsername")?.value.trim();
                const password = $("#registerPassword")?.value;

                if (!username || !password) {
                    authMessage(
                        "registerForm",
                        "Enter a username and password.",
                        true
                    );
                    return;
                }

                if (username.length < 3) {
                    authMessage(
                        "registerForm",
                        "Your username must be at least 3 characters.",
                        true
                    );
                    return;
                }

                if (password.length < 8) {
                    authMessage(
                        "registerForm",
                        "Your password must be at least 8 characters.",
                        true
                    );
                    return;
                }

                const submitButton = $(
                    'button[type="submit"]',
                    registerForm
                );

                if (submitButton) {
                    submitButton.disabled = true;
                }

                authMessage("registerForm", "Creating your account...");

                try {
                    const data = await authRequest("/register", {
                        username,
                        password
                    });

                    registerForm.reset();

                    authLoggedIn = false;
                    authUsername = "";
                    authStatusChecked = false;
                    authStatusPromise = null;

                    setAuthMode("login");

                    authMessage(
                        "loginForm",
                        data.message || "Account created! Please log in."
                    );

                    const loginIdentifier = $("#loginIdentifier");

                    if (loginIdentifier) {
                        loginIdentifier.value = username;
                    }

                    notify("Account created. Please log in.");
                } catch (error) {
                    authMessage(
                        "registerForm",
                        error.message || "Registration failed.",
                        true
                    );
                } finally {
                    if (submitButton) {
                        submitButton.disabled = false;
                    }
                }
            });
        }

        const logoutButton = $("#logoutButton");

        if (logoutButton) {
            logoutButton.addEventListener("click", async () => {
                try {
                    await authRequest("/logout");

                    authLoggedIn = false;
                    authUsername = "";
                    authStatusChecked = true;
                    authStatusPromise = null;

                    updateAuthUI();
                    notify("You have logged out.");
                    openAuthScreen("login");
                } catch (error) {
                    notify("Logout failed: " + error.message);
                }
            });
        }

        checkAuthStatus();
    }

    /* ==========================================
       OPEN CHAT APPLICATION
    ========================================== */

    async function openDiviAI() {
        const home = $("#homePage");
        const app = $("#aiAppScreen");
        const authScreen = $("#authScreen");

        if (!app) {
            notify("Chat screen not found. Check your index.html.");
            return;
        }

       if (authScreen && !authLoggedIn) {
    openAuthScreen("login");
    return;
}
        if (home) {
            home.hidden = true;
            home.style.display = "none";
        }

        if (authScreen) {
            authScreen.hidden = true;
            authScreen.style.display = "none";
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
        const authScreen = $("#authScreen");

        if (app) {
            app.hidden = true;
            app.style.display = "none";
        }

        if (authScreen) {
            authScreen.hidden = true;
            authScreen.style.display = "none";
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
            selectButton.title = chat.title || "New chat";

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
        row.setAttribute("role", "status");
        row.setAttribute("aria-label", "Divi AI is thinking");

        const avatar = document.createElement("div");
        avatar.className = "message-avatar";
        avatar.textContent = "D";

        const content = document.createElement("div");
        content.className = "message-content loading-content";

        const label = document.createElement("span");
        label.className = "loading-label";
        label.textContent = "Divi AI is thinking";

        const dots = document.createElement("span");
        dots.className = "loading-dots";
        dots.setAttribute("aria-hidden", "true");

        for (let i = 0; i < 3; i++) {
            const dot = document.createElement("span");
            dot.className = "loading-dot";
            dots.appendChild(dot);
        }

        content.append(label, dots);
        row.append(avatar, content);
        box.appendChild(row);

        box.scrollTop = box.scrollHeight;

        return row;
    }

    /* ==========================================
       SEND MESSAGE TO BACKEND
    ========================================== */

    async function askBackend(question) {
        const chat = getChat(currentChatId);

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
                question,
                search_query: question,
                history,
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
                "is working and its API key is configured."
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
        setupAuth();

        const home = $("#homePage");
        const app = $("#aiAppScreen");
        const authScreen = $("#authScreen");

        if (home) {
            home.hidden = false;
            home.style.display = "";
        }

        if (app) {
            app.hidden = true;
            app.style.display = "none";
        }

        if (authScreen) {
            authScreen.hidden = true;
            authScreen.style.display = "none";
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

        console.log(
            "Divi AI loaded: chat, navigation, voice, and authentication initialized."
        );
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
