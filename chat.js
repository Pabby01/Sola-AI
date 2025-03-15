// Main JavaScript for Solana AI Chat Interface

// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const closeSidebar = document.getElementById('close-sidebar');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const newChatButton = document.getElementById('new-chat-button');
const assistantBtns = document.querySelectorAll('.assistant-btn');
const currentAssistantTitle = document.querySelector('.current-assistant h1');
const currentAssistantIcon = document.querySelector('.current-assistant .assistant-icon');
const inputPlaceholder = document.getElementById('user-input');
const previousChats = document.getElementById('previous-chats');
const suggestionChips = document.querySelectorAll('.chip');
const connectWalletBtn = document.getElementById('connect-wallet');

// API URL
const API_URL = 'https://ai-api-guya.onrender.com/api/chat/';

// State Management
let conversations = [];
let currentConversationId = 0;
let currentAssistant = 'sidekick'; // Default assistant
let isTyping = false;

// Initialize the app
function initApp() {
    startNewChat();
    
    // Set up event listeners
    sidebarToggle.addEventListener('click', toggleSidebar);
    closeSidebar.addEventListener('click', toggleSidebar);
    sendButton.addEventListener('click', sendMessage);
    newChatButton.addEventListener('click', startNewChat);
    connectWalletBtn.addEventListener('click', connectWallet);
    
    userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
        
        // Auto-resize textarea
        setTimeout(() => {
            userInput.style.height = 'auto';
            userInput.style.height = Math.min(userInput.scrollHeight, 150) + 'px';
        }, 0);
    });
    
    // Assistant switching
    assistantBtns.forEach(btn => {
        btn.addEventListener('click', () => switchAssistant(btn.dataset.assistant));
    });
    
    // Suggestion chips
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => {
            userInput.value = chip.dataset.prompt;
            sendMessage();
        });
    });
}

// Toggle sidebar visibility
function toggleSidebar() {
    sidebar.classList.toggle('closed');
}

// Switch between AI assistants
function switchAssistant(assistant) {
    // Update active button
    assistantBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.assistant === assistant) {
            btn.classList.add('active');
        }
    });
    
    // Update current assistant variables
    currentAssistant = assistant;
    currentAssistantIcon.className = `assistant-icon ${assistant}`;
    
    // Update assistant icon
    currentAssistantIcon.innerHTML = '';
    let iconClass = '';
    
    switch(assistant) {
        case 'sidekick':
            iconClass = 'fa-rocket';
            currentAssistantTitle.textContent = 'DeFi AI "Sidekick"';
            if (inputPlaceholder) {
                inputPlaceholder.placeholder = 'Ask Sidekick about DeFi opportunities...';
            }
            break;
        case 'navigator':
            iconClass = 'fa-palette';
            currentAssistantTitle.textContent = 'NFT AI "Navigator"';
            inputPlaceholder.placeholder = 'Ask Navigator about NFT collections...';
            break;
        case 'builder':
            iconClass = 'fa-code';
            currentAssistantTitle.textContent = 'Dev AI "Builder"';
            inputPlaceholder.placeholder = 'Ask Builder for coding help...';
            break;
    }
    
    const icon = document.createElement('i');
    icon.className = `fas ${iconClass}`;
    currentAssistantIcon.appendChild(icon);
    
    // Show appropriate suggestion chips
    suggestionChips.forEach(chip => {
        if (chip.classList.contains(assistant)) {
            chip.style.display = 'block';
        } else {
            chip.style.display = 'none';
        }
    });
    
    // Add a system message about the switch
    addSystemMessage(`Switched to ${currentAssistantTitle.textContent}`);
}

// Start a new chat conversation
function startNewChat() {
    // Create new conversation in the conversation array
    currentConversationId = conversations.length;
    conversations.push({
        id: currentConversationId,
        assistant: currentAssistant,
        messages: []
    });
    
    // Clear chat UI
    chatMessages.innerHTML = '';
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Add welcome message based on current assistant
    let welcomeMessage = '';
    switch(currentAssistant) {
        case 'sidekick':
            welcomeMessage = "👋 I'm Sidekick, your DeFi assistant on Solana. I can help with real-time APY comparisons, token swaps, lending strategies, and market insights. What would you like to know about Solana DeFi today?";
            break;
        case 'navigator':
            welcomeMessage = "👋 I'm Navigator, your guide to Solana's NFT ecosystem. I can analyze rarity, alert you to trending collections, predict floor prices, and work with compressed NFTs. How can I help with your NFT journey today?";
            break;
        case 'builder':
            welcomeMessage = "👋 I'm Builder, your Solana development assistant. I can help with Anchor framework code, debug common errors, simulate contract behavior, and provide documentation. What are you building on Solana today?";
            break;
    }
    
    addBotMessage(welcomeMessage);
    updatePreviousChats();
}

// Send a message
function sendMessage() {
    const message = userInput.value.trim();
    if (!message || isTyping) return;
    
    addUserMessage(message);
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Focus input after sending
    userInput.focus();
    
    // Get AI response
    getAIResponse(message);
}

// Add user message to chat
function addUserMessage(message) {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', 'user');
    
    // Create avatar
    const avatar = document.createElement('div');
    avatar.classList.add('avatar', 'user');
    const avatarIcon = document.createElement('i');
    avatarIcon.className = 'fas fa-user';
    avatar.appendChild(avatarIcon);
    
    // Create message content
    const content = document.createElement('div');
    content.classList.add('message-content', 'user');
    content.textContent = message;
    
    // Assemble message
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    // Add to chat and scroll to bottom
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
    
    // Save to conversation history
    if (conversations[currentConversationId]) {
        conversations[currentConversationId].messages.push({
            role: 'user',
            content: message
        });
    };
}

// Add bot message to chat
function addBotMessage(message) {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', 'ai');
    
    // Create avatar
    const avatar = document.createElement('div');
    avatar.classList.add('avatar', currentAssistant);
    
    let iconClass = '';
    switch(currentAssistant) {
        case 'sidekick': iconClass = 'fa-rocket'; break;
        case 'navigator': iconClass = 'fa-palette'; break;
        case 'builder': iconClass = 'fa-code'; break;
    }
    
    const avatarIcon = document.createElement('i');
    avatarIcon.className = `fas ${iconClass}`;
    avatar.appendChild(avatarIcon);
    
    // Create message content
    const content = document.createElement('div');
    content.classList.add('message-content', 'ai', currentAssistant);
    
    // Check if we need to add typing animation
    if (isTyping) {
        content.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        messageDiv.dataset.typing = 'true';
    } else {
        // Format message with markdown-like syntax
        content.innerHTML = formatMessage(message);
    }
    
    // Assemble message
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    // Add to chat and scroll to bottom
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
    
    // Save to conversation history if not a typing indicator
    if (!isTyping && conversations[currentConversationId]) {
        conversations[currentConversationId].messages.push({
            role: 'assistant',
            content: message
        });
    }
}

// Add a system message (assistant switch, etc.)
function addSystemMessage(message) {
    const systemDiv = document.createElement('div');
    systemDiv.classList.add('system-message');
    systemDiv.textContent = message;
    chatMessages.appendChild(systemDiv);
    scrollToBottom();
}

// Update typing animation with actual message
function updateTypingMessageWithContent(message) {
    const typingMessage = document.querySelector('[data-typing="true"]');
    if (typingMessage) {
        const content = typingMessage.querySelector('.message-content');
        content.innerHTML = formatMessage(message);
        typingMessage.removeAttribute('data-typing');
        
        // Save to conversation history
        if (conversations[currentConversationId]) {
            conversations[currentConversationId].messages.push({
                role: 'assistant',
                content: message
            });
        }
    }
}

// Format message with code highlighting and links
function formatMessage(message) {
    // Convert code blocks
    message = message.replace(/```(\w+)?\n([\s\S]*?)\n```/g, (match, lang, code) => {
        return `<pre><code${lang ? ` class="language-${lang}"` : ''}>${code}</code></pre>`;
    });
    
    // Convert inline code
    message = message.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Convert links
    message = message.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Convert line breaks
    message = message.replace(/\n/g, '<br>');
    
    return message;
}

// Get AI response from API with the correct payload structure
async function getAIResponse(userMessage) {
    // Show typing indicator
    isTyping = true;
    addBotMessage('');  // Will show typing animation due to isTyping flag
    
    try {
        // Prepare the correct request payload structure
        const payload = {
            user_input: userMessage
        };
        
        console.log('Sending API request with payload:', payload);
        
        // Make API call
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        // Check if the request was successful
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }
        
        // Parse the response
        const data = await response.json();
        
        // Check if the response contains the expected data
        const aiResponse = data.response || data.message || data.reply || data;
        
        // If aiResponse is an object and not a string, convert it
        const finalResponse = typeof aiResponse === 'string' 
            ? aiResponse 
            : JSON.stringify(aiResponse, null, 2);
        
        // Update the chat with the AI response
        updateTypingMessageWithContent(finalResponse);
    } catch (error) {
        console.error('Error fetching AI response:', error);
        updateTypingMessageWithContent('Sorry, I encountered an error while processing your request. Please try again later.');
    } finally {
        isTyping = false; // Reset typing state
    }
}
// Function to scroll to the bottom of the chat
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Update previous chats in the sidebar
function updatePreviousChats() {
    // Clear previous chats
    previousChats.innerHTML = '';
    
    // Add each conversation to the sidebar
    conversations.forEach((conversation, index) => {
        // Skip empty conversations
        if (conversation.messages.length === 0) return;
        
        const chatItem = document.createElement('div');
        chatItem.classList.add('chat-item');
        
        // Add class for active conversation
        if (index === currentConversationId) {
            chatItem.classList.add('active');
        }
        
        // Get the first message content for the chat title
        const firstUserMessage = conversation.messages.find(msg => msg.role === 'user');
        const chatTitle = firstUserMessage
            ? (firstUserMessage.content.substring(0, 25).replace(/["'\\]/g, '') + 
               (firstUserMessage.content.length > 25 ? '...' : ''))
            : 'New conversation';
        
        // Create chat item content
        const itemContent = document.createElement('div');
        itemContent.classList.add('chat-item-content');
        
        // Add assistant icon
        const assistantIcon = document.createElement('div');
        assistantIcon.classList.add('chat-item-icon', conversation.assistant);
        
        let iconClass = '';
        switch(conversation.assistant) {
            case 'sidekick': iconClass = 'fa-rocket'; break;
            case 'navigator': iconClass = 'fa-palette'; break;
            case 'builder': iconClass = 'fa-code'; break;
        }
        
        const icon = document.createElement('i');
        icon.className = `fas ${iconClass}`;
        assistantIcon.appendChild(icon);
        
        // Add chat title
        const titleSpan = document.createElement('span');
        titleSpan.textContent = chatTitle;
        
        // Add delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-chat-btn');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        
        // Assemble chat item
        itemContent.appendChild(assistantIcon);
        itemContent.appendChild(titleSpan);
        chatItem.appendChild(itemContent);
        chatItem.appendChild(deleteBtn);
        
        // Add click event to load this conversation
        itemContent.addEventListener('click', () => {
            loadConversation(index);
        });
        
        // Add click event to delete this conversation
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteConversation(index);
        });
        
        chatItem.appendChild(deleteBtn);
        previousChats.appendChild(chatItem);
    });
}

// Load a previous conversation
function loadConversation(index) {
    if (!conversations[index]) return;
    
    currentConversationId = index;
    currentAssistant = conversations[index].assistant;
    
    // Switch to the correct assistant
    switchAssistant(currentAssistant);
    
    // Clear chat UI
    chatMessages.innerHTML = '';
    
    // Load all messages
    conversations[index].messages.forEach(msg => {
        if (msg.role === 'user') {
            addUserMessage(msg.content);
        } else if (msg.role === 'assistant') {
            isTyping = false; // Make sure typing is off
            addBotMessage(msg.content);
        }
    });
    
    // Update UI to show this conversation is active
    updatePreviousChats();
}

// Delete a conversation
function deleteConversation(index) {
    if (!conversations[index]) return;
    
    // Remove conversation
    conversations.splice(index, 1);
    
    // If we deleted the current conversation, start a new one
    if (index === currentConversationId) {
        startNewChat();
    } 
    // If we deleted a conversation before the current one, adjust the current index
    else if (index < currentConversationId) {
        currentConversationId--;
    }
    
    // Update UI
    updatePreviousChats();
}

// Connect wallet function (placeholder)
function connectWallet() {
    // This would integrate with Solana wallet adapter
    const walletBtn = document.getElementById('connect-wallet');
    walletBtn.innerHTML = '<i class="fas fa-wallet"></i><span>Connected</span>';
    walletBtn.classList.add('connected');
    
    addSystemMessage('Wallet connected successfully');
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);