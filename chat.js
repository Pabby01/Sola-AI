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
const networkStatus = document.querySelector('.network-status span:last-child');

// Solana library variables - declared with let
window.solanaWeb3 = window.solanaWeb3 || null;
window.solanaWalletAdapterBase = window.solanaWalletAdapterBase || null;
window.solanaWalletAdapterWallets = window.solanaWalletAdapterWallets || null;

// API URL
const API_URL = 'https://ai-api-guya.onrender.com/api/chat/';

// State Management
let conversations = [];
let currentConversationId = 0;
let currentAssistant = 'sidekick'; // Default assistant
let isTyping = false;
let walletAddress = null;

// Initialize the app
function initApp() {
    // Load libraries first
    loadSolanaLibraries();
    
    // Check if there was a pending wallet connection
    if (sessionStorage.getItem('walletConnectionPending') === 'true') {
        // Attempt to re-establish connection with a delay
        setTimeout(() => connectWallet(), 1500);
    }

    startNewChat();

    // Set up event listeners
    setupEventListeners();
}

// Load Solana libraries
// Modified loadSolanaLibraries function
function loadSolanaLibraries() {
    try {
        if (window.solanaWeb3) {
            // Just use the global variable directly
            window.solanaWeb3 = window.solanaWeb3;
        }
        if (window.solanaWalletAdapterBase) {
            window.solanaWalletAdapterBase = window.solanaWalletAdapterBase;
        }
        if (window.solanaWalletAdapterWallets) {
            window.solanaWalletAdapterWallets = window.solanaWalletAdapterWallets;
        }
    } catch (error) {
        console.error('Error initializing Solana libraries:', error);
    }
}

// Set up all event listeners
function setupEventListeners() {
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    if (closeSidebar) {
        closeSidebar.addEventListener('click', toggleSidebar);
    }
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }
    if (newChatButton) {
        newChatButton.addEventListener('click', startNewChat);
    }
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', connectWallet);
    }

    // User input handling
    if (userInput) {
        userInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }

            // Auto-resize textarea
            requestAnimationFrame(() => {
                userInput.style.height = 'auto';
                userInput.style.height = Math.min(userInput.scrollHeight, 150) + 'px';
            });
        });
    }

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

// Detect if user is on a mobile device
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Toggle sidebar visibility
function toggleSidebar() {
    if (sidebar) {
        sidebar.classList.toggle('closed');
    }
}

// Switch between AI assistants
function switchAssistant(assistant) {
    if (!assistant) return;
    
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
            if (inputPlaceholder) {
                inputPlaceholder.placeholder = 'Ask Navigator about NFT collections...';
            }
            break;
        case 'builder':
            iconClass = 'fa-code';
            currentAssistantTitle.textContent = 'Dev AI "Builder"';
            if (inputPlaceholder) {
                inputPlaceholder.placeholder = 'Ask Builder for coding help...';
            }
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
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    if (userInput) {
        userInput.value = '';
        userInput.style.height = 'auto';
    }
    
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
    if (!userInput) return;
    
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
    if (!chatMessages) return;
    
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
    }
}

// Add bot message to chat
function addBotMessage(message) {
    if (!chatMessages) return;
    
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
    if (!chatMessages) return;
    
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
    if (!message) return '';
    
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
    if (!userMessage) return;
    
    // Show typing indicator
    isTyping = true;
    addBotMessage('');  // Will show typing animation due to isTyping flag
    
    try {
        // Prepare the correct request payload structure
        const payload = {
            user_input: userMessage,
            wallet_address: walletAddress, // Include wallet address if available
            assistant_type: currentAssistant // Include assistant type
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
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Update previous chats in the sidebar
function updatePreviousChats() {
    if (!previousChats) return;
    
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
        
        previousChats.appendChild(chatItem);
    });
}

// Load a previous conversation
function loadConversation(index) {
    if (!conversations[index] || !chatMessages) return;
    
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

// Connect wallet function - improved implementation with mobile support
async function connectWallet() {
    // Check if already connected
    if (walletAddress) {
        addSystemMessage("Wallet already connected: " + shortenAddress(walletAddress));
        return walletAddress;
    }
    
    try {
        // First load libraries if they aren't loaded yet
        loadSolanaLibraries();
        
        // Check if libraries are loaded
        if (!window.solanaWeb3 || !window.solanaWalletAdapterWallets) {
            console.error("Solana libraries not loaded properly");
            addSystemMessage("Could not connect wallet: Solana libraries not loaded properly");
            return null;
        }
        
        // Store connection attempt in sessionStorage for mobile redirects
        if (isMobileDevice()) {
            sessionStorage.setItem('walletConnectionPending', 'true');
            addSystemMessage("Opening mobile wallet app. Please approve the connection request.");
        }
        
        // Get required Solana objects
        //const { Connection, PublicKey } = window.solanaWeb3;
        
        // Try to get wallet adapters
        let PhantomWalletAdapter, SolflareWalletAdapter;
        
        if (window.solanaWalletAdapterWallets) {
            PhantomWalletAdapter = window.solanaWalletAdapterWallets.PhantomWalletAdapter;
            SolflareWalletAdapter = window.solanaWalletAdapterWallets.SolflareWalletAdapter;
        }
        
        // Try to connect to Phantom first, then Solflare
        let wallet = null;
        let walletError = null;
        
        // Try Phantom
        try {
            if (PhantomWalletAdapter) {
                wallet = new PhantomWalletAdapter();
                await wallet.connect();
            }
        } catch (err) {
            console.log("Phantom connection failed, trying Solflare", err);
            walletError = err;
        }
        
        // If Phantom failed, try Solflare
        if (!wallet || !wallet.connected) {
            try {
                if (SolflareWalletAdapter) {
                    wallet = new SolflareWalletAdapter();
                    await wallet.connect();
                }
            } catch (err) {
                console.error("Solflare connection failed", err);
                walletError = err;
                
                if (!wallet) {
                    throw new Error('No compatible wallet found. Please install Phantom or Solflare.');
                }
            }
        }
        
        // Check if we successfully connected
        if (wallet && wallet.publicKey) {
            walletAddress = wallet.publicKey.toString();
            
            // Update UI to show connected state
            if (connectWalletBtn) {
                connectWalletBtn.innerHTML = `<i class="fas fa-wallet"></i><span>${shortenAddress(walletAddress)}</span>`;
                connectWalletBtn.classList.add('connected');
            }
            
            // Update network status
            if (networkStatus) {
                networkStatus.innerHTML = `Connected to Solana Mainnet`;
            }
            
            addSystemMessage(`Wallet connected: ${shortenAddress(walletAddress)}`);
            
            // Clear the pending connection flag
            sessionStorage.removeItem('walletConnectionPending');
            
            // Setup disconnect handler
            wallet.on('disconnect', () => {
                walletAddress = null;
                if (connectWalletBtn) {
                    connectWalletBtn.innerHTML = '<i class="fas fa-wallet"></i><span>Connect Wallet</span>';
                    connectWalletBtn.classList.remove('connected');
                }
                if (networkStatus) {
                    networkStatus.innerHTML = 'Solana Mainnet';
                }
                addSystemMessage('Wallet disconnected');
            });
            
            return walletAddress;
        } else {
            throw walletError || new Error('Failed to get wallet public key');
        }
    } catch (error) {
        console.error('Wallet connection error:', error);
        
        let errorMessage = error.message || "Unknown error";
        
        // Make error messages more user-friendly
        if (errorMessage.includes("User rejected")) {
            errorMessage = "Connection request was rejected.";
        }
        
        // Special messaging for mobile users
        if (isMobileDevice()) {
            addSystemMessage(`Wallet connection failed. Make sure you have Phantom or Solflare installed on your device.`);
        } else {
            addSystemMessage(`Wallet connection failed: ${errorMessage}`);
        }
        
        // Clear the pending connection flag
        sessionStorage.removeItem('walletConnectionPending');
        return null;
    }
}

// Helper function to shorten wallet address
function shortenAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);

// Additional event listener for handling libraries that load after page load
window.addEventListener('load', () => {
    // Check if the Solana libraries are loaded
    loadSolanaLibraries();
    
    // Re-initialize connection if it was pending
    if (sessionStorage.getItem('walletConnectionPending') === 'true') {
        setTimeout(() => connectWallet(), 1500);
    }
});