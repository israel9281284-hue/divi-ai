// ==========================================
// DIVI AI - MAIN JAVASCRIPT
// ==========================================

const API_URL = "https://divi-ai.onrender.com/api/voice-command";

// Elements
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const voiceButton = document.querySelector(".voice-button");

const newChatButton = document.getElementById("newChatButton");
const clearHistoryButton = document.getElementById("clearHistoryButton");
const chatHistory = document.getElementById("chatHistory");

const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll(".page-section");


// ==========================================
// AI MODE
// ==========================================

let currentMode = "chat";

const modeButtons = document.querySelectorAll(".mode-button");

modeButtons.forEach(button => {
    button.addEventListener("click", () => {

        modeButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        currentMode = button.dataset.mode;

        updateModePlaceholder();
    });
});


function updateModePlaceholder() {

    if (!userInput) return;

    if (currentMode === "chat") {
        userInput.placeholder = "Message Divi AI...";
    }

    if (currentMode === "agent") {
        userInput.placeholder = "Give Divi AI a task to plan...";
    }

    if (currentMode === "explain") {
        userInput.placeholder = "What would you like Divi AI to explain?";
    }
}


// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage() {

    const command = userInput.value.trim();

    if (!command) return;

    addMessage(command, "user");

    userInput.value = "";

    const loadingMessage = addMessage(
        getModeLoadingMessage(),
        "ai"
    );

    try {

        let finalCommand = command;

        // --------------------------------------
        // AGENT MODE
        // --------------------------------------

        if (currentMode === "agent") {

            finalCommand = `
You are Divi AI Agent Mode.

Break the user's task into clear steps.

User task:
${command}

Provide:
1. Goal
2. Step-by-step plan
3. Important considerations
4. Expected result

Do not pretend to perform actions you cannot actually perform.
`;
        }

        // --------------------------------------
        // EXPLAIN MODE
        // --------------------------------------

        if (currentMode === "explain") {

            finalCommand = `
You are Divi AI Explain Mode.

Explain the following clearly and simply.

User question:
${command}

Use:
- Simple language
- Step-by-step reasoning
- Examples when useful
- A short final summary

Do not claim to know information you do not know.
`;
        }

        // --------------------------------------
        // NORMAL CHAT
        // --------------------------------------

        if (currentMode === "chat") {

            finalCommand = command;
        }


        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                command: finalCommand
            })

        });


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error || "Divi AI could not respond."
            );

        }


        loadingMessage.remove();


        const aiResponse =
            data.response ||
            data.message ||
            "I received your message, but I couldn't generate a response.";


        addMessage(aiResponse, "ai");


        saveMessageToHistory(
            command,
            aiResponse,
            currentMode
        );


    } catch (error) {

        console.error("Divi AI Error:", error);

        loadingMessage.remove();

        addMessage(
            "Sorry, I could not connect to Divi AI right now.",
            "ai"
        );

    }
}


// ==========================================
// LOADING MESSAGE
// ==========================================

function getModeLoadingMessage() {

    if (currentMode === "agent") {
        return "🧠 Divi AI is planning the task...";
    }

    if (currentMode === "explain") {
        return "💡 Divi AI is preparing an explanation...";
    }

    return "Divi AI is thinking...";
}


// ==========================================
// ADD MESSAGE
// ==========================================

function addMessage(text, sender) {

    const message = document.createElement("div");

    message.className =
        sender === "user"
            ? "message user-message"
            : "message ai-message";


    message.innerHTML = `
        <div class="message-content">
            ${escapeHTML(text).replace(/\n/g, "<br>")}
        </div>
    `;


    chatBox.appendChild(message);

    chatBox.scrollTop = chatBox.scrollHeight;

    return message;
}


// ==========================================
// ENTER KEY
// ==========================================

if (userInput) {

    userInput.addEventListener("keydown", function(event) {

        if (event.key === "Enter") {

            event.preventDefault();

            sendMessage();

        }

    });

}


// ==========================================
// SEND BUTTON
// ==========================================

if (sendButton) {

    sendButton.addEventListener(
        "click",
        sendMessage
    );

}


// ==========================================
// SUGGESTIONS
// ==========================================

function useSuggestion(text) {

    if (!userInput) return;

    userInput.value = text;

    userInput.focus();

}


// ==========================================
// CHAT HISTORY
// ==========================================

const HISTORY_KEY = "diviAIHistory";


function getHistory() {

    try {

        return JSON.parse(
            localStorage.getItem(HISTORY_KEY)
        ) || [];

    } catch {

        return [];

    }

}


function saveMessageToHistory(
    question,
    answer,
    mode
) {

    const history = getHistory();

    history.unshift({

        question: question,

        answer: answer,

        mode: mode,

        date: new Date().toLocaleString()

    });


    // Keep latest 20 conversations
    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history.slice(0, 20))
    );


    displayHistory();

}


function displayHistory() {

    if (!chatHistory) return;

    const history = getHistory();

    chatHistory.innerHTML = "";


    if (history.length === 0) {

        chatHistory.innerHTML =
            `<p class="no-history">No conversations yet</p>`;

        return;

    }


    history.forEach((item, index) => {

        const button =
            document.createElement("button");

        button.className = "history-item";


        button.innerHTML = `
            <span class="history-icon">
                ${item.mode === "agent"
                    ? "🧠"
                    : item.mode === "explain"
                    ? "💡"
                    : "💬"}
            </span>

            <span class="history-text">
                ${escapeHTML(item.question)}
            </span>
        `;


        button.addEventListener("click", () => {

            openHistory(index);

        });


        chatHistory.appendChild(button);

    });

}


// ==========================================
// OPEN HISTORY
// ==========================================

function openHistory(index) {

    const history = getHistory();

    const item = history[index];

    if (!item) return;


    chatBox.innerHTML = "";


    addMessage(
        item.question,
        "user"
    );


    addMessage(
        item.answer,
        "ai"
    );


    // Restore mode
    currentMode = item.mode || "chat";


    modeButtons.forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.mode === currentMode
        );

    });


    updateModePlaceholder();

}


// ==========================================
// CLEAR HISTORY
// ==========================================

if (clearHistoryButton) {

    clearHistoryButton.addEventListener(
        "click",
        () => {

            localStorage.removeItem(HISTORY_KEY);

            displayHistory();

        }
    );

}


// ==========================================
// NEW CHAT
// ==========================================

if (newChatButton) {

    newChatButton.addEventListener(
        "click",
        () => {

            chatBox.innerHTML = `
                <div class="welcome">
                    <div class="welcome-icon">D</div>

                    <h2>Hello, I'm Divi AI 👋</h2>

                    <p>
                        Your intelligent assistant for questions,
                        ideas, learning, and problem solving.
                    </p>

                    <div class="suggestions">

                        <button onclick="useSuggestion('Explain artificial intelligence simply')">
                            Explain AI simply
                        </button>

                        <button onclick="useSuggestion('Help me with my school work')">
                            Help with school
                        </button>

                        <button onclick="useSuggestion('Give me a creative idea')">
                            Give me an idea
                        </button>

                    </div>
                </div>
            `;

            currentMode = "chat";

            modeButtons.forEach(button => {

                button.classList.toggle(
                    "active",
                    button.dataset.mode === "chat"
                );

            });

            updateModePlaceholder();

            userInput.value = "";

            userInput.focus();

        }
    );

}


// ==========================================
// VOICE INPUT
// ==========================================

if (
    voiceButton &&
    (
        "webkitSpeechRecognition" in window ||
        "SpeechRecognition" in window
    )
) {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    const recognition =
        new SpeechRecognition();


    recognition.lang = "en-US";

    recognition.continuous = false;

    recognition.interimResults = false;


    voiceButton.addEventListener(
        "click",
        () => {

            recognition.start();

            voiceButton.textContent = "🔴";

        }
    );


    recognition.onresult = event => {

        const transcript =
            event.results[0][0].transcript;

        userInput.value = transcript;

        voiceButton.textContent = "🎤";

    };


    recognition.onerror = () => {

        voiceButton.textContent = "🎤";

    };


    recognition.onend = () => {

        voiceButton.textContent = "🎤";

    };

}


// ==========================================
// NAVIGATION
// ==========================================

navLinks.forEach(link => {

    link.addEventListener("click", event => {

        event.preventDefault();

        const sectionName =
            link.dataset.section;


        navLinks.forEach(item => {

            item.classList.remove("active");

        });


        link.classList.add("active");


        sections.forEach(section => {

            section.classList.remove(
                "active-section"
            );

        });


        const target =
            document.getElementById(sectionName);


        if (target) {

            target.classList.add(
                "active-section"
            );

        }


        updatePageTitle(sectionName);

    });

});


// ==========================================
// PAGE TITLES
// ==========================================

function updatePageTitle(section) {

    const title =
        document.getElementById("pageTitle");

    const subtitle =
        document.getElementById("pageSubtitle");


    if (!title || !subtitle) return;


    if (section === "chat") {

        title.textContent = "Divi AI";

        subtitle.textContent =
            "Your intelligent digital assistant";

    }


    if (section === "features") {

        title.textContent = "Features";

        subtitle.textContent =
            "Explore what Divi AI can do";

    }


    if (section === "about") {

        title.textContent = "About Me";

        subtitle.textContent =
            "The creator behind Divi AI";

    }

}


// ==========================================
// SECURITY
// ==========================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}


// ==========================================
// LOAD HISTORY
// ==========================================

displayHistory();

updateModePlaceholder();


// ==========================================
// HOMEPAGE BUTTONS
// ==========================================

const homePage = document.getElementById("homePage");
const startDiviButton = document.getElementById("startDiviButton");
const exploreFeaturesButton = document.getElementById("exploreFeaturesButton");


// START DIVI AI
if (startDiviButton) {

    startDiviButton.addEventListener("click", () => {

        // Hide homepage
        if (homePage) {
            homePage.style.display = "none";
        }

        // Show main Divi AI application
        const app = document.querySelector(".app");

        if (app) {
            app.style.display = "flex";
        }

        // Open Chat
        navLinks.forEach(link => {
            link.classList.toggle(
                "active",
                link.dataset.section === "chat"
            );
        });

        sections.forEach(section => {
            section.classList.toggle(
                "active-section",
                section.id === "chat"
            );
        });

        updatePageTitle("chat");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

}


// EXPLORE FEATURES
if (exploreFeaturesButton) {

    exploreFeaturesButton.addEventListener("click", () => {

        // Hide homepage
        if (homePage) {
            homePage.style.display = "none";
        }

        // Show main application
        const app = document.querySelector(".app");

        if (app) {
            app.style.display = "flex";
        }

        // Open Features
        navLinks.forEach(link => {
            link.classList.toggle(
                "active",
                link.dataset.section === "features"
            );
        });

        sections.forEach(section => {
            section.classList.toggle(
                "active-section",
                section.id === "features"
            );
        });

        updatePageTitle("features");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

}
// ==========================================
// HOME BUTTON
// ==========================================

const homeButton = document.getElementById("homeButton");

if (homeButton) {

    homeButton.addEventListener("click", () => {

        openHomePage();

    });

}
// ==========================================
// DIVI AI HOME NAVIGATION
// ==========================================

(function () {

    const homeBtn = document.getElementById("diviHomeButton");
    const homeScreen = document.getElementById("homePage");
    const appScreen = document.querySelector(".app");

    if (!homeBtn) return;

    homeBtn.addEventListener("click", function () {

        // Hide the Divi AI application
        if (appScreen) {
            appScreen.style.display = "none";
        }

        // Show the separate homepage
        if (homeScreen) {
            homeScreen.style.display = "flex";
        }

        // Put the page at the top
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

})();
