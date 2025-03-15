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
    }
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

// Get AI response
function getAIResponse(userMessage) {
    // Show typing indicator
    isTyping = true;
    addBotMessage('');  // Will show typing animation due to isTyping flag
    
    // Sample responses for the demo
    const responses = {
        sidekick: [
            "Based on current data from Solana DeFi protocols, the highest APY for staking SOL is 7.8% on Marinade Finance. Would you like to see more options or start staking?",
            "I've analyzed current market rates. For swapping 10 SOL to USDC, Jupiter Aggregator offers the best rate at 1 SOL = 102.45 USDC with minimal slippage. This swap would net you approximately 1,024.5 USDC. Would you like me to prepare this transaction?",
            "For lending on Solana right now, Solend offers 3.8% APY for SOL deposits, while Kamino Finance shows 4.2%. However, Kamino has slightly higher utilization. Which platform would you like to explore further?",
            "According to on-chain data, UXD is currently the highest-yielding stablecoin with 5.6% APY through the Kamino CLMM strategy on Orca. Would you like to swap your SOL for UXD?"
        ],
        navigator: [
            "The top trending NFT collections in the past hour on Solana are:\n1. Mad Lads (24% volume increase)\n2. Tensorians (new mint, 3.8K SOL volume)\n3. Solana Monkes (floor up 5.2%)\nWould you like detailed analytics on any of these collections?",
            "I've analyzed your NFT's rarity score from Tensor data. Your Mad Lads #4289 has a rarity rank of 612/10,000 with rare 'Laser Eyes' and 'Gold Chain' traits. This puts it in the top 6.12% of the collection, with a current floor price of approximately 16.8 SOL.",
            "Based on historical trends and recent trading activity, I predict the Tensorians floor price could increase 30-40% in the next 48 hours due to the upcoming utility announcement. Would you like me to set up floor price alerts?",
            "The most successful mints in the past 24 hours are Solana Monkes Gen 3, with a mint price of 3 SOL now trading at 12 SOL floor, and Claynosaurz Eggs at 1.5 SOL now at a 4.2 SOL floor. Would you like to discover upcoming mints?"
        ],
        builder: [
            "I've analyzed your Anchor code and found the CPI error. You're trying to call an instruction on a PDA account that wasn't properly derived. Here's the fix:\n```rust\n// Instead of this\nlet pda_account = next_account_info(accounts_iter)?;\n\n// Do this - make sure to use the correct seeds\nlet (pda_account, bump) = Pubkey::find_program_address(\n    &[b\"escrow\", authority.key.as_ref()],\n    program_id\n);\n```\nThis ensures the correct PDA is derived for the CPI call.",
            "Here's a starter Anchor token swap contract for you:\n```rust\nuse anchor_lang::prelude::*;\nuse anchor_spl::token::{self, Token, TokenAccount, Transfer};\n\n#[program]\nmod token_swap {\n    use super::*;\n\n    pub fn initialize_swap(\n        ctx: Context<InitializeSwap>,\n        amount_a: u64,\n        amount_b: u64,\n    ) -> Result<()> {\n        let swap = &mut ctx.accounts.swap;\n        swap.initializer = ctx.accounts.initializer.key();\n        swap.token_a_account = ctx.accounts.token_a_account.key();\n        swap.token_b_account = ctx.accounts.token_b_account.key();\n        swap.amount_a = amount_a;\n        swap.amount_b = amount_b;\n        swap.is_active = true;\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct InitializeSwap<'info> {\n    #[account(init, payer = initializer, space = 8 + 32 + 32 + 32 + 8 + 8 + 1)]\n    pub swap: Account<'info, TokenSwap>,\n    #[account(mut)]\n    pub initializer: Signer<'info>,\n    pub token_a_account: Account<'info, TokenAccount>,\n    pub token_b_account: Account<'info, TokenAccount>,\n    pub system_program: Program<'info, System>,\n}\n\n#[account]\npub struct TokenSwap {\n    pub initializer: Pubkey,\n    pub token_a_account: Pubkey,\n    pub token_b_account: Pubkey,\n    pub amount_a: u64,\n    pub amount_b: u64,\n    pub is_active: bool,\n}\n```"
        ]
    };

    // Simulate a delay for AI response
    setTimeout(() => {
        try {
            const response = responses[currentAssistant][Math.floor(Math.random() * responses[currentAssistant].length)];
            updateTypingMessageWithContent(response);
        } catch (error) {
            console.error('Error fetching AI response:', error);
            updateTypingMessageWithContent('Sorry, something went wrong.');
        } finally {
            isTyping = false; // Reset typing state
        }
    }, 2000);
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