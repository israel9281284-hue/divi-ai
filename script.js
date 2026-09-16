const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");

const API_URL = "https://divi-ai-2.onrender.com/api/voice-command";


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

    // Automatically scroll to the newest message
    chatBox.scrollTop = chatBox.scrollHeight;
}


// Send the user's question to Divi AI
async function askDiviAI() {

    const command = userInput.value.trim();

    // Don't send an empty message
    if (command === "") {
        return;
    }

    // Show user's message
    addMessage(command, "user");

    // Clear input box
    userInput.value = "";

    // Disable button while AI is thinking
    sendButton.disabled = true;
    sendButton.textContent = "Thinking...";

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

        // Show AI response
        addMessage(data.response, "ai");

    } catch (error) {

        console.error("Divi AI Error:", error);

        addMessage(
            "Sorry, I could not connect to Divi AI right now.",
            "ai"
        );

    } finally {

        // Enable button again
        sendButton.disabled = false;
        sendButton.textContent = "Send";
    }
}


sendButton.addEventListener("click", askDiviAI);

userInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        askDiviAI();
    }
});
