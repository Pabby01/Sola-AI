document.getElementById("sendBtn").addEventListener("click", sendMessage);
document.getElementById("userInput").addEventListener("keypress", function(event) {
    if (event.key === "Enter") sendMessage();
});

async function sendMessage() {
    const inputField = document.getElementById("userInput");
    const message = inputField.value.trim();
    if (!message) return;

    addMessage(message, "user");
    inputField.value = "";

    document.getElementById("typingIndicator").style.display = "block";

    try {
        const apiUrl = "https://ai-api-guya.onrender.com/api/chat";
        
        // 🔹 Using a CORS Proxy (Temporary Fix)
        const corsProxy = "https://cors-anywhere.herokuapp.com/"; // Alternative: "https://thingproxy.freeboard.io/fetch/"
        const response = await fetch(corsProxy + apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) throw new Error("Server Error");

        const data = await response.json();
        setTimeout(() => {
            document.getElementById("typingIndicator").style.display = "none";
            addMessage(data.reply, "bot");
        }, 1000);
    } catch (error) {
        document.getElementById("typingIndicator").style.display = "none";
        addMessage("Error: Unable to fetch response. CORS issue detected!", "bot");
    }
}

function addMessage(text, sender) {
    const chatBox = document.getElementById("chatBox");
    const messageBubble = document.createElement("div");
    messageBubble.className = `message ${sender}`;

    const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    messageBubble.innerHTML = `<span class="text">${text}</span><span class="timestamp">${timeNow}</span>`;

    chatBox.appendChild(messageBubble);
    chatBox.scrollTop = chatBox.scrollHeight;
}
