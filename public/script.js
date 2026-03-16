// ========== DOM Elements ==========
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearChat');
const typingIndicator = document.getElementById('typingIndicator');
const charCount = document.getElementById('charCount');
const suggestionChips = document.querySelectorAll('.suggestion-chip');
const suggestions = document.getElementById('suggestions');

// ========== Configuration ==========
// Trên Vercel backend được triển khai dưới dạng serverless function `/api/chat`
// Local (npm run server) bạn vẫn có thể dùng reverse proxy hoặc cấu hình tương tự.
const API_URL = '/api/chat';
let isTyping = false;

// ========== Initialize ==========
document.addEventListener('DOMContentLoaded', () => {
    loadChatHistory();
    setupEventListeners();
    autoResizeTextarea();
});

// ========== Event Listeners ==========
function setupEventListeners() {
    // Send message on button click
    sendBtn.addEventListener('click', sendMessage);

    // Send message on Enter (Shift+Enter for new line)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Character counter
    messageInput.addEventListener('input', () => {
        const length = messageInput.value.length;
        charCount.textContent = length;
        
        if (length > 450) {
            charCount.style.color = 'var(--danger-color)';
        } else {
            charCount.style.color = 'var(--text-light)';
        }
    });

    // Clear chat
    clearBtn.addEventListener('click', clearChat);

    // Suggestion chips
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => {
            messageInput.value = chip.textContent;
            messageInput.focus();
            sendMessage();
        });
    });

    // Hide suggestions after first message
    const observer = new MutationObserver(() => {
        const userMessages = chatMessages.querySelectorAll('.user-message');
        if (userMessages.length > 0) {
            suggestions.style.display = 'none';
        }
    });
    observer.observe(chatMessages, { childList: true });
}

// ========== Auto Resize Textarea ==========
function autoResizeTextarea() {
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
}

// ========== Send Message ==========
async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message || isTyping) return;
    
    // Add user message to chat
    addMessage(message, 'user');
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    charCount.textContent = '0';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Call API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Add bot response
        addMessage(data.reply, 'bot', data.source);
        
    } catch (error) {
        console.error('Error:', error);
        hideTypingIndicator();
        addMessage(
            'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau. 😔\n\n' +
            'Lỗi: ' + error.message,
            'bot',
            'error'
        );
    }
    
    // Save chat history
    saveChatHistory();
}

// ========== Add Message to Chat ==========
function addMessage(text, sender, source = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const isError = source === 'error';
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-${sender === 'user' ? 'user' : 'robot'}"></i>
        </div>
        <div class="message-content ${isError ? 'error-message' : ''}">
            ${formatMessage(text)}
            <div class="message-time">${getCurrentTime()}</div>
            ${source && !isError ? `<div class="message-source">Nguồn: ${source}</div>` : ''}
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// ========== Format Message ==========
function formatMessage(text) {
    // Convert line breaks to <br>
    text = text.replace(/\n/g, '<br>');
    
    // Convert markdown-style bold **text**
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert markdown-style italic *text*
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert URLs to links
    text = text.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    return `<p>${text}</p>`;
}

// ========== Typing Indicator ==========
function showTypingIndicator() {
    isTyping = true;
    typingIndicator.style.display = 'block';
    sendBtn.disabled = true;
    scrollToBottom();
}

function hideTypingIndicator() {
    isTyping = false;
    typingIndicator.style.display = 'none';
    sendBtn.disabled = false;
}

// ========== Scroll to Bottom ==========
function scrollToBottom() {
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

// ========== Get Current Time ==========
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// ========== Clear Chat ==========
function clearChat() {
    showConfirmModal(
        'Xác nhận xóa',
        'Bạn có chắc muốn xóa toàn bộ lịch sử chat?',
        'warning',
        () => {
            // Keep only the welcome message
            const welcomeMessage = chatMessages.querySelector('.bot-message');
            chatMessages.innerHTML = '';
            chatMessages.appendChild(welcomeMessage);
            
            // Clear localStorage
            localStorage.removeItem('chatHistory');
            
            // Show suggestions again
            suggestions.style.display = 'block';
        }
    );
}

// ========== Custom Confirm Modal ==========
function showConfirmModal(title, message, icon = 'warning', onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content modal-small">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="close-btn" onclick="this.closest('.modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="custom-modal-icon ${icon}">
                    <i class="fas fa-${icon === 'warning' ? 'exclamation-triangle' : icon === 'danger' ? 'exclamation-circle' : 'info-circle'}"></i>
                </div>
                <p>${message}</p>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                    Hủy
                </button>
                <button type="button" class="btn btn-danger" id="confirmActionBtn">
                    Xác nhận
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const confirmBtn = modal.querySelector('#confirmActionBtn');
    confirmBtn.addEventListener('click', () => {
        modal.remove();
        if (onConfirm) onConfirm();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// ========== Save Chat History ==========
function saveChatHistory() {
    const messages = [];
    const messageElements = chatMessages.querySelectorAll('.message');
    
    messageElements.forEach(msg => {
        const isUser = msg.classList.contains('user-message');
        const content = msg.querySelector('.message-content p').innerHTML;
        const time = msg.querySelector('.message-time')?.textContent || '';
        const source = msg.querySelector('.message-source')?.textContent || '';
        
        messages.push({
            sender: isUser ? 'user' : 'bot',
            content,
            time,
            source
        });
    });
    
    localStorage.setItem('chatHistory', JSON.stringify(messages));
}

// ========== Load Chat History ==========
function loadChatHistory() {
    const history = localStorage.getItem('chatHistory');
    
    if (history) {
        const messages = JSON.parse(history);
        
        // Clear chat except welcome message
        const welcomeMessage = chatMessages.querySelector('.bot-message');
        chatMessages.innerHTML = '';
        chatMessages.appendChild(welcomeMessage);
        
        // Restore messages (skip the first welcome message)
        messages.slice(1).forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.sender}-message`;
            
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-${msg.sender === 'user' ? 'user' : 'robot'}"></i>
                </div>
                <div class="message-content">
                    <p>${msg.content}</p>
                    <div class="message-time">${msg.time}</div>
                    ${msg.source ? `<div class="message-source">${msg.source}</div>` : ''}
                </div>
            `;
            
            chatMessages.appendChild(messageDiv);
        });
        
        scrollToBottom();
    }
}

// ========== Service Worker Registration (Optional for PWA) ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment below to enable PWA features
        // navigator.serviceWorker.register('/sw.js')
        //     .then(reg => console.log('Service Worker registered'))
        //     .catch(err => console.log('Service Worker registration failed'));
    });
}

// ========== Handle Online/Offline Status ==========
window.addEventListener('online', () => {
    console.log('Đã kết nối internet');
});

window.addEventListener('offline', () => {
    console.log('Mất kết nối internet');
    addMessage(
        '⚠️ Bạn đang offline. Vui lòng kiểm tra kết nối internet.',
        'bot',
        'system'
    );
});

