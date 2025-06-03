
let isDragging = false, offsetX = 0, offsetY = 0, dragTarget = null;

// Helper to set both bot icon and window positions
function setChatbotPosition(left, top) {
  const bot = document.getElementById('chatbot-container');
  const win = document.getElementById('chatbot-window');
  const botWidth = bot.offsetWidth || 100;
  const botHeight = bot.offsetHeight || 100;
  const winWidth = win.offsetWidth || 320;
  const winHeight = win.offsetHeight || 420;
  const maxLeftBot = window.innerWidth - botWidth;
  const maxTopBot = window.innerHeight - botHeight;
  left = Math.max(0, Math.min(left, maxLeftBot));
  top = Math.max(0, Math.min(top, maxTopBot));
  bot.style.left = `${left}px`;
  bot.style.top = `${top}px`;
  let winLeft = left;
  let winTop = top - winHeight - 20;
  if (winLeft < 0) winLeft = 0;
  if (winLeft + winWidth > window.innerWidth) winLeft = window.innerWidth - winWidth;
  if (winTop < 0) winTop = 0;
  if (winTop + winHeight > window.innerHeight) winTop = window.innerHeight - winHeight;
  win.style.left = `${winLeft}px`;
  win.style.top = `${winTop}px`;
}

// Drag start for icon or window
function dragStart(e, target) {
  e.preventDefault();
  dragTarget = target || 'icon';
  let bot = document.getElementById('chatbot-container');
  let left = bot.offsetLeft;
  let top = bot.offsetTop;
  // If dragging window, use its position
  if (dragTarget === 'window') {
    const win = document.getElementById('chatbot-window');
    left = win.offsetLeft;
    top = win.offsetTop + win.offsetHeight + 20; // icon sits below window
  }
  isDragging = true;
  offsetX = e.clientX - left;
  offsetY = e.clientY - top;
  document.onmousemove = dragMove;
  document.onmouseup = dragEnd;
}

function dragMove(e) {
  if (!isDragging) return;
  let newLeft = e.clientX - offsetX;
  let newTop = e.clientY - offsetY;
  setChatbotPosition(newLeft, newTop);
}

function dragEnd() {
  isDragging = false;
  dragTarget = null;
  document.onmousemove = null;
  document.onmouseup = null;
}

// Attach drag to icon
document.getElementById('chatbot-container').onmousedown = function(e) {
  dragStart(e, 'icon');
};

// Attach drag to window header/avatar
window.addEventListener('DOMContentLoaded', function() {
  const header = document.getElementById('chatbot-header');
  if (header) {
    header.onmousedown = function(e) {
      dragStart(e, 'window');
    };
  }
});

// Toggle chatbot visibility
function toggleChat() {
  const chatWindow = document.getElementById('chatbot-window');
  if (chatWindow.classList.contains('show')) {
    chatWindow.classList.remove('show');
    setTimeout(() => chatWindow.style.display = 'none', 400);
  } else {
    chatWindow.style.display = 'flex';
    setTimeout(() => chatWindow.classList.add('show'), 10);
  }
}

// Send text message
async function sendMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message) return;

  addMessageToChat('You', message);
  input.value = '';

  try {
    const response = await fetch("http://localhost:3000/chat", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: "default-session", message }),
    });
    const data = await response.json();
    addMessageToChat('Bot', data.reply || 'No response from server.');
  } catch (error) {
    console.error(error);
    addMessageToChat('Bot', 'Error connecting to server.');
  }
}

// Add chat messages to log
function addMessageToChat(sender, message) {
  const chatLog = document.getElementById('chat-log');
  const msgDiv = document.createElement('div');
  msgDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
  msgDiv.style.marginBottom = '10px';
  chatLog.appendChild(msgDiv);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// Voice recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  document.getElementById('voice-btn').addEventListener('click', () => {
    recognition.start();
    document.getElementById('voice-btn').innerText = '🎙️ Listening...';
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById('chat-input').value = transcript;
    document.getElementById('voice-btn').innerText = '🎤';
    sendMessage(); // Auto-send after voice input
  };

  recognition.onerror = (event) => {
    console.error("Voice error:", event.error);
    document.getElementById('voice-btn').innerText = '🎤';
    alert("Voice input error: " + event.error);
  };

  recognition.onend = () => {
    document.getElementById('voice-btn').innerText = '🎤';
  };
} else {
  console.warn("SpeechRecognition not supported");
  document.getElementById('voice-btn').disabled = true;
  document.getElementById('voice-btn').title = 'Voice input not supported in this browser';
}
