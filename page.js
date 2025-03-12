// Wallet connection functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if Phantom wallet is installed
    const isPhantomInstalled = window.phantom?.solana?.isPhantom;
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    const walletStatusIndicator = document.querySelector('.wallet-status-indicator');
    
    let walletAddress = null;
    
    if (!isPhantomInstalled) {
      console.log("Phantom wallet is not installed!");
      connectWalletBtn.addEventListener('click', () => {
        alert("Please install Phantom wallet to connect: https://phantom.app/");
        window.open("https://phantom.app/", "_blank");
      });
    } else {
      console.log("Phantom wallet is installed!");
      
      // Function to connect wallet
      async function connectWallet() {
        try {
          const resp = await window.phantom.solana.connect();
          walletAddress = resp.publicKey.toString();
          
          // Update UI
          connectWalletBtn.innerHTML = `
            <span>${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}</span>
            <div class="wallet-status-indicator connected"></div>
          `;
          
          // Add event for when connection is closed
          window.phantom.solana.on('disconnect', () => {
            walletAddress = null;
            connectWalletBtn.innerHTML = `
              <span>Connect Wallet</span>
              <div class="wallet-status-indicator disconnected"></div>
            `;
          });
          
          // Show success notification
          showNotification('Wallet connected successfully!', 'success');
          
          // You could fetch user's SOL balance here
          // getWalletBalance(walletAddress);
          
          return walletAddress;
        } catch (err) {
          console.error("Error connecting wallet:", err);
          showNotification('Failed to connect wallet', 'error');
          return null;
        }
      }
      
      // Event listener for connect button
      connectWalletBtn.addEventListener('click', connectWallet);
    }
    
    // Notification system
    function showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.innerHTML = `
        <p>${message}</p>
        <button class="notification-close">×</button>
      `;
      
      document.body.appendChild(notification);
      
      // Add animation
      setTimeout(() => {
        notification.classList.add('show');
      }, 10);
      
      // Remove notification after 5 seconds
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 5000);
      
      // Close button functionality
      notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
          notification.remove();
        }, 300);
      });
    }
    
    // Add notification styles
    const notificationStyles = document.createElement('style');
    notificationStyles.textContent = `
      .notification {
        position: fixed;
        bottom: -100px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        transition: bottom 0.3s ease;
        z-index: 1000;
        min-width: 300px;
        max-width: 400px;
      }
      
      .notification.show {
        bottom: 20px;
      }
      
      .notification.success {
        background-color: #4caf50;
        color: white;
      }
      
      .notification.error {
        background-color: #f44336;
        color: white;
      }
      
      .notification.info {
        background-color: var(--accent-color);
        color: white;
      }
      
      .notification p {
        margin: 0;
        flex-grow: 1;
      }
      
      .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0 5px;
      }
    `;
    
    document.head.appendChild(notificationStyles);
    
    // Add mobile menu toggle
    const mobileMenuButton = document.createElement('button');
    mobileMenuButton.className = 'icon-button mobile-menu-button';
    mobileMenuButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
        <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"></path>
      </svg>
    `;
    
    const actionButtons = document.querySelector('.action-buttons');
    actionButtons.prepend(mobileMenuButton);
    
    // Create mobile menu
    const mobileMenu = document.createElement('div');
    mobileMenu.className = 'mobile-menu';
    
    // Clone navigation links
    const navLinks = document.querySelector('.main-nav').cloneNode(true);
    mobileMenu.appendChild(navLinks);
    
    document.body.appendChild(mobileMenu);
    
    // Toggle mobile menu
    mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('show');
          });
      });