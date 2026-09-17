const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const voiceButton = document.querySelector(".voice-button");

const chatHistory = document.getElementById("chatHistory");
const clearHistoryButton = document.getElementById("clearHistoryButton");


// ==========================================
// DIVI AI API
// ==========================================

// PUT YOUR RENDER URL HERE
    const API_URL = "https://divi-ai.onrender.com/api/voice-command";


// ==========================================
// CURRENT CHAT
// ==========================================

let currentChat = [];


// ==========================================
// ADD MESSAGE
// ==========================================

function addMessage(message, type) {

    const messageElement =
        document.createElement("div");

    messageElement.classList.add("message");

    if (type === "user") {

        messageElement.classList.add(
            "user-message"
        );

    } else {

        messageElement.classList.add(
            "ai-message"
        );
    }

    messageElement.textContent = message;

    chatBox.appendChild(messageElement);

    chatBox.scrollTop =
        chatBox.scrollHeight;
}


// ==========================================
// SAVE CHAT
// ==========================================

function saveCurrentChat() {

    if (currentChat.length === 0) {
        return;
    }

    let histories =
        JSON.parse(
            localStorage.getItem("diviAIHistory")
        ) || [];


    const firstUserMessage =
        currentChat.find(
            message => message.type === "user"
        );


    const title =
        firstUserMessage
            ? firstUserMessage.text.substring(0, 35)
            : "New conversation";


    const chat = {

        id: Date.now(),

        title: title,

        messages: currentChat,

        date: new Date().toLocaleString()

    };


    histories.unshift(chat);


    // Keep the latest 20 chats
    histories =
        histories.slice(0, 20);


    localStorage.setItem(
        "diviAIHistory",
        JSON.stringify(histories)
    );


    loadChatHistory();
}


// ==========================================
// LOAD CHAT HISTORY
// ==========================================

function loadChatHistory() {

    if (!chatHistory) {
        return;
    }


    const histories =
        JSON.parse(
            localStorage.getItem("diviAIHistory")
        ) || [];


    chatHistory.innerHTML = "";


    if (histories.length === 0) {

        chatHistory.innerHTML =
            `<p class="no-history">
                No conversations yet
            </p>`;

        return;
    }


    histories.forEach(function(chat) {

        const item =
            document.createElement("button");

        item.className =
            "history-item";


        item.innerHTML = `
            <span class="history-icon">💬</span>
            <span class="history-text">
                ${escapeHTML(chat.title)}
            </span>
        `;


        item.addEventListener(
            "click",
            function() {

                openSavedChat(chat.id);

            }
        );


        chatHistory.appendChild(item);

    });
}


// ==========================================
// OPEN SAVED CHAT
// ==========================================

function openSavedChat(id) {

    const histories =
        JSON.parse(
            localStorage.getItem("diviAIHistory")
        ) || [];


    const chat =
        histories.find(
            item => item.id === id
        );


    if (!chat) {
        return;
    }


    showSection("chat");


    chatBox.innerHTML = "";


    currentChat =
        [...chat.messages];


    currentChat.forEach(function(message) {

        addMessage(
            message.text,
            message.type
        );

    });
}


// ==========================================
// CLEAR HISTORY
// ==========================================

if (clearHistoryButton) {

    clearHistoryButton.addEventListener(
        "click",
        function() {

            localStorage.removeItem(
                "diviAIHistory"
            );

            loadChatHistory();

        }
    );
}


// ==========================================
// NEW CHAT
// ==========================================

const newChatButton =
    document.getElementById("newChatButton");


if (newChatButton) {

    newChatButton.addEventListener(
        "click",
        function() {

            saveCurrentChat();

            currentChat = [];

            chatBox.innerHTML = `
                <div class="welcome">

                    <div class="welcome-icon">
                        D
                    </div>

                    <h2>
                        Hello, I'm Divi AI 👋
                    </h2>

                    <p>
                        Your intelligent assistant for
                        questions, ideas, learning,
                        and problem solving.
                    </p>

                </div>
            `;


            showSection("chat");

            userInput.focus();

        }
    );
}


// ==========================================
// SUGGESTIONS
// ==========================================

function useSuggestion(text) {

    userInput.value = text;

    userInput.focus();

}


// ==========================================
// SEND MESSAGE
// ==========================================

async function askDiviAI() {

    const command =
        userInput.value.trim();


    if (command === "") {
        return;
    }


    const welcome =
        document.querySelector(".welcome");


    if (welcome) {
        welcome.remove();
    }


    addMessage(
        command,
        "user"
    );


    currentChat.push({

        type: "user",

        text: command

    });


    userInput.value = "";


    sendButton.disabled = true;

    sendButton.textContent = "...";


    try {

        const response =
            await fetch(
                API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            command: command
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Server error"
            );

        }


        const aiResponse =
            data.response ||
            "Divi AI did not return a response.";


        addMessage(
            aiResponse,
            "ai"
        );


        currentChat.push({

            type: "ai",

            text: aiResponse

        });


    } catch (error) {

        console.error(
            "Divi AI Error:",
            error
        );


        const errorMessage =
            "Divi AI is temporarily unavailable. Please try again.";


        addMessage(
            errorMessage,
            "ai"
        );


        currentChat.push({

            type: "ai",

            text: errorMessage

        });

    } finally {

        sendButton.disabled = false;

        sendButton.textContent = "➤";

    }
}


// ==========================================
// SEND BUTTON
// ==========================================

sendButton.addEventListener(
    "click",
    askDiviAI
);


// ==========================================
// ENTER KEY
// ==========================================

userInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            askDiviAI();

        }

    }
);


// ==========================================
// VOICE INPUT
// ==========================================

if (voiceButton) {

    voiceButton.addEventListener(
        "click",
        function() {

            const SpeechRecognition =
                window.SpeechRecognition ||
                window.webkitSpeechRecognition;


            if (!SpeechRecognition) {

                addMessage(
                    "Voice input is not supported by this browser.",
                    "ai"
                );

                return;
            }


            const recognition =
                new SpeechRecognition();


            recognition.lang =
                "en-US";

            recognition.interimResults =
                false;


            voiceButton.textContent =
                "🔴";


            recognition.start();


            recognition.onresult =
                function(event) {

                    const text =
                        event.results[0][0]
                            .transcript;

                    userInput.value =
                        text;

                    userInput.focus();

                };


            recognition.onerror =
                function() {

                    addMessage(
                        "I couldn't hear that. Please try again.",
                        "ai"
                    );

                };


            recognition.onend =
                function() {

                    voiceButton.textContent =
                        "🎤";

                };

        }
    );
}


// ==========================================
// NAVIGATION
// ==========================================

const navLinks =
    document.querySelectorAll(
        ".nav-link"
    );


const pageSections =
    document.querySelectorAll(
        ".page-section"
    );


const pageTitle =
    document.getElementById(
        "pageTitle"
    );


const pageSubtitle =
    document.getElementById(
        "pageSubtitle"
    );


function showSection(sectionName) {

    pageSections.forEach(
        function(section) {

            section.classList.remove(
                "active-section"
            );

        }
    );


    const selectedSection =
        document.getElementById(
            sectionName
        );


    if (selectedSection) {

        selectedSection.classList.add(
            "active-section"
        );

    }


    navLinks.forEach(
        function(link) {

            link.classList.remove(
                "active"
            );

        }
    );


    const activeLink =
        document.querySelector(
            `[data-section="${sectionName}"]`
        );


    if (activeLink) {

        activeLink.classList.add(
            "active"
        );

    }


    if (sectionName === "chat") {

        pageTitle.textContent =
            "Divi AI";

        pageSubtitle.textContent =
            "Your intelligent digital assistant";

    }

    else if (sectionName === "features") {

        pageTitle.textContent =
            "Features";

        pageSubtitle.textContent =
            "Explore what Divi AI can do";

    }

    else if (sectionName === "about") {

        pageTitle.textContent =
            "About Me";

        pageSubtitle.textContent =
            "Meet the creator of Divi AI";

    }
}


navLinks.forEach(
    function(link) {

        link.addEventListener(
            "click",
            function(event) {

                event.preventDefault();

                showSection(
                    link.getAttribute(
                        "data-section"
                    )
                );

            }
        );

    }
);


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


// ==========================================
// LOAD HISTORY ON START
// ==========================================

loadChatHistory();
