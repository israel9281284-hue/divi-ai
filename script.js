const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const voiceButton = document.querySelector(".voice-button");

// IMPORTANT:
// Put your NEW Render URL here.
// Example:
// https://your-new-render-service.onrender.com/api/voice-command
const API_URL = "YOUR_NEW_RENDER_URL/api/voice-command";


// Add a message to the chat
function addMessage(message, type) {
    const messageElement = document.createElement("div");

    messageElement.classList.add("message");

    if (type === "user") {
        messageElement.classList.add("user-message");
    } else {
        messageElement.classList.add("ai-message");
    }

    messageElement.textContent = message;

    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}


// Use one of the suggestion buttons
function useSuggestion(text) {
    userInput.value = text;
    userInput.focus();
}


// Send message to Divi AI
async function askDiviAI() {

    const command = userInput.value.trim();

    if (command === "") {
        return;
    }

    // Remove welcome screen when first message is sent
    const welcome = document.querySelector(".welcome");

    if (welcome) {
        welcome.remove();
    }

    // Show user's message
    addMessage(command, "user");

    // Clear input
    userInput.value = "";

    // Disable button
    sendButton.disabled = true;
    sendButton.textContent = "...";

    try {

        const response = await fetch(API_URL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                command: command
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Server error");
        }

        addMessage(
            data.response || "Divi AI did not return a response.",
            "ai"
        );

    } catch (error) {

        console.error("Divi AI Error:", error);

        addMessage(
            "Divi AI is temporarily unavailable. Please try again.",
            "ai"
        );

    } finally {

        sendButton.disabled = false;
        sendButton.textContent = "➤";
    }
}


// Send button
sendButton.addEventListener("click", askDiviAI);


// Press Enter to send
userInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        askDiviAI();
    }

});


// Voice button
if (voiceButton) {

    voiceButton.addEventListener("click", function() {

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

        const recognition = new SpeechRecognition();

        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        voiceButton.textContent = "🔴";

        recognition.start();

        recognition.onresult = function(event) {

            const text =
                event.results[0][0].transcript;

            userInput.value = text;
            userInput.focus();
        };

        recognition.onerror = function() {

            addMessage(
                "I couldn't hear that. Please try again.",
                "ai"
            );
        };

        recognition.onend = function() {

            voiceButton.textContent = "🎤";
        };

    });

}


// =========================
// SECTION NAVIGATION
// =========================

const navLinks = document.querySelectorAll(".nav-link");
const pageSections = document.querySelectorAll(".page-section");

const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");


navLinks.forEach(function(link) {

    link.addEventListener("click", function(event) {

        event.preventDefault();

        const sectionName =
            link.getAttribute("data-section");


        // Hide all sections
        pageSections.forEach(function(section) {

            section.classList.remove("active-section");

        });


        // Show selected section
        const selectedSection =
            document.getElementById(sectionName);

        if (selectedSection) {

            selectedSection.classList.add(
                "active-section"
            );

        }


        // Update active navigation
        navLinks.forEach(function(item) {

            item.classList.remove("active");

        });

        link.classList.add("active");


        // Change page title
        if (sectionName === "chat") {

            pageTitle.textContent = "Divi AI";

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

    });

});


// =========================
// NEW CHAT
// =========================

const newChatButton =
    document.getElementById("newChatButton");


if (newChatButton) {

    newChatButton.addEventListener(
        "click",
        function() {

            location.reload();

        }
    );

}
