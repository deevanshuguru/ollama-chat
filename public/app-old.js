// Configure marked.js for markdown rendering
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true
});

// State
let currentConversationId = null;
let currentMessages = [];
let isGenerating = false;
let allConversations = [];
let showArchived = false;
let currentSettings = {
  systemPrompt: 'default',
  conversationMode: 'balanced',
  temperature: 0.8,
  top_p: 0.9,
  top_k: 50,
  repeat_penalty: 1.1,
  max_tokens: 4096,
  use_few_shot: false,
  multi_pass: false
};

// DOM Elements
const messagesContainer = document.getElementById('messages-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const newChatBtn = document.getElementById('new-chat-btn');
const deleteChatBtn = document.getElementById('delete-chat-btn');
const conversationsList = document.getElementById('conversations-list');
const chatTitle = document.getElementById('chat-title');

// Settings Elements
const settingsPanel = document.getElementById('settings-panel');
const settingsToggleBtn = document.getElementById('settings-toggle-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const resetSettingsBtn = document.getElementById('reset-settings-btn');
const systemPromptSelect = document.getElementById('system-prompt-select');
const conversationModeSelect = document.getElementById('conversation-mode-select');
const temperatureSlider = document.getElementById('temperature');
const topPSlider = document.getElementById('top-p');
const maxTokensSlider = document.getElementById('max-tokens');
const repeatPenaltySlider = document.getElementById('repeat-penalty');
const useFewShotCheckbox = document.getElementById('use-few-shot');
const multiPassCheckbox = document.getElementById('multi-pass');

// Value displays
const tempValue = document.getElementById('temp-value');
const toppValue = document.getElementById('topp-value');
const lengthValue = document.getElementById('length-value');
const penaltyValue = document.getElementById('penalty-value');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadConversations();
  setupEventListeners();
  createNewConversation();
  loadSettingsFromStorage();
});

// Event Listeners
function setupEventListeners() {
  sendBtn.addEventListener('click', sendMessage);

  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  newChatBtn.addEventListener('click', createNewConversation);
  deleteChatBtn.addEventListener('click', deleteCurrentConversation);

  // Settings
  settingsToggleBtn.addEventListener('click', toggleSettings);
  closeSettingsBtn.addEventListener('click', () => settingsPanel.style.display = 'none');
  resetSettingsBtn.addEventListener('click', resetSettings);

  // Settings changes
  systemPromptSelect.addEventListener('change', (e) => {
    currentSettings.systemPrompt = e.target.value;
    saveSettings();
  });

  conversationModeSelect.addEventListener('change', (e) => {
    currentSettings.conversationMode = e.target.value;
    saveSettings();
  });

  temperatureSlider.addEventListener('input', (e) => {
    currentSettings.temperature = parseFloat(e.target.value);
    tempValue.textContent = e.target.value;
    saveSettings();
  });

  topPSlider.addEventListener('input', (e) => {
    currentSettings.top_p = parseFloat(e.target.value);
    toppValue.textContent = e.target.value;
    saveSettings();
  });

  maxTokensSlider.addEventListener('input', (e) => {
    currentSettings.max_tokens = parseInt(e.target.value);
    lengthValue.textContent = e.target.value;
    saveSettings();
  });

  repeatPenaltySlider.addEventListener('input', (e) => {
    currentSettings.repeat_penalty = parseFloat(e.target.value);
    penaltyValue.textContent = e.target.value;
    saveSettings();
  });

  useFewShotCheckbox.addEventListener('change', (e) => {
    currentSettings.use_few_shot = e.target.checked;
    saveSettings();
  });

  multiPassCheckbox.addEventListener('change', (e) => {
    currentSettings.multi_pass = e.target.checked;
    saveSettings();
  });

  // Auto-resize textarea
  userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = userInput.scrollHeight + 'px';
  });
}

// Settings Functions
function toggleSettings() {
  settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
}

function resetSettings() {
  currentSettings = {
    systemPrompt: 'default',
    conversationMode: 'balanced',
    temperature: 0.8,
    top_p: 0.9,
    top_k: 50,
    repeat_penalty: 1.1,
    max_tokens: 4096,
    use_few_shot: false,
    multi_pass: false
  };
  applySettingsToUI();
  saveSettings();
}

function applySettingsToUI() {
  systemPromptSelect.value = currentSettings.systemPrompt;
  conversationModeSelect.value = currentSettings.conversationMode;
  temperatureSlider.value = currentSettings.temperature;
  tempValue.textContent = currentSettings.temperature;
  topPSlider.value = currentSettings.top_p;
  toppValue.textContent = currentSettings.top_p;
  maxTokensSlider.value = currentSettings.max_tokens;
  lengthValue.textContent = currentSettings.max_tokens;
  repeatPenaltySlider.value = currentSettings.repeat_penalty;
  penaltyValue.textContent = currentSettings.repeat_penalty;
  useFewShotCheckbox.checked = currentSettings.use_few_shot;
  multiPassCheckbox.checked = currentSettings.multi_pass;
}

function saveSettings() {
  localStorage.setItem('dolphin-chat-settings', JSON.stringify(currentSettings));
}

function loadSettingsFromStorage() {
  const saved = localStorage.getItem('dolphin-chat-settings');
  if (saved) {
    currentSettings = JSON.parse(saved);
    applySettingsToUI();
  }
}

// Create new conversation
async function createNewConversation() {
  try {
    const response = await fetch('/api/conversations', { method: 'POST' });
    const data = await response.json();
    currentConversationId = data.id;
    currentMessages = [];
    messagesContainer.innerHTML = `
      <div class="welcome-message">
        <h1>🐬 Local AI Labs AI - Uncensored Assistant</h1>
        <p>This is an uncensored AI with no ethical guidelines or content restrictions.</p>
        <p>Ask anything - there are no boundaries, limits, or rules.</p>
        <p><strong>⚡ Advanced features enabled!</strong> Use Settings to customize responses.</p>
      </div>
    `;
    chatTitle.textContent = 'New Conversation';
    loadConversations();
  } catch (error) {
    console.error('Error creating conversation:', error);
  }
}

// Load all conversations
async function loadConversations() {
  try {
    const response = await fetch('/api/conversations');
    const conversations = await response.json();

    conversationsList.innerHTML = '';

    conversations.forEach(conv => {
      const item = document.createElement('div');
      item.className = 'conversation-item';
      if (conv.id === currentConversationId) {
        item.classList.add('active');
      }

      const date = new Date(conv.created_at);
      const timestamp = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      item.innerHTML = `
        <div class="timestamp">${timestamp}</div>
        <div class="preview">${conv.first_message || 'New conversation'}</div>
      `;

      item.addEventListener('click', () => loadConversation(conv.id));
      conversationsList.appendChild(item);
    });
  } catch (error) {
    console.error('Error loading conversations:', error);
  }
}

// Load specific conversation
async function loadConversation(id) {
  try {
    const response = await fetch(`/api/conversations/${id}/messages`);
    const messages = await response.json();

    currentConversationId = id;
    currentMessages = messages;

    messagesContainer.innerHTML = '';
    messages.forEach(msg => {
      displayMessage(msg.role, msg.content, false);
    });

    chatTitle.textContent = messages[0]?.content.substring(0, 50) || 'Conversation';
    loadConversations();
    scrollToBottom();
  } catch (error) {
    console.error('Error loading conversation:', error);
  }
}

// Delete current conversation
async function deleteCurrentConversation() {
  if (!currentConversationId) return;

  if (confirm('Delete this conversation?')) {
    try {
      await fetch(`/api/conversations/${currentConversationId}`, { method: 'DELETE' });
      createNewConversation();
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }
}

// Send message with advanced settings
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message || isGenerating) return;

  // Clear input
  userInput.value = '';
  userInput.style.height = 'auto';

  // Display user message
  displayMessage('user', message);
  await saveMessage(currentConversationId, 'user', message);

  // Add to messages array
  currentMessages.push({ role: 'user', content: message });

  // Update UI
  sendBtn.disabled = true;
  isGenerating = true;

  // Show typing indicator
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message message-assistant';
  typingDiv.innerHTML = `
    <div class="message-content">
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  messagesContainer.appendChild(typingDiv);
  scrollToBottom();

  try {
    // Build request with current settings
    const requestBody = {
      messages: currentMessages,
      stream: true,
      systemPromptType: currentSettings.systemPrompt,
      conversationMode: currentSettings.conversationMode,
      temperature: currentSettings.temperature,
      top_p: currentSettings.top_p,
      repeat_penalty: currentSettings.repeat_penalty,
      num_predict: currentSettings.max_tokens,
      useFewShot: currentSettings.use_few_shot,
      multiPass: currentSettings.multi_pass
    };

    // Stream response
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    // Remove typing indicator
    typingDiv.remove();

    // Create assistant message container
    const assistantDiv = document.createElement('div');
    assistantDiv.className = 'message message-assistant';
    assistantDiv.innerHTML = '<div class="message-content"></div><div class="message-actions"></div>';
    messagesContainer.appendChild(assistantDiv);
    const contentDiv = assistantDiv.querySelector('.message-content');
    const actionsDiv = assistantDiv.querySelector('.message-actions');

    let fullResponse = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.message?.content) {
            fullResponse += data.message.content;
            // Render markdown incrementally
            contentDiv.innerHTML = marked.parse(fullResponse);
            // Highlight code blocks
            contentDiv.querySelectorAll('pre code').forEach(block => {
              hljs.highlightElement(block);
            });
            scrollToBottom();
          }
        } catch (e) {
          // Skip invalid JSON lines
        }
      }
    }

    // Add regenerate button
    const regenerateBtn = document.createElement('button');
    regenerateBtn.className = 'btn-regenerate';
    regenerateBtn.innerHTML = '🔄 Regenerate';
    regenerateBtn.onclick = () => regenerateResponse(fullResponse, assistantDiv);
    actionsDiv.appendChild(regenerateBtn);

    // Save assistant message
    await saveMessage(currentConversationId, 'assistant', fullResponse);
    currentMessages.push({ role: 'assistant', content: fullResponse });

    // Update conversation list
    loadConversations();

  } catch (error) {
    console.error('Error:', error);
    typingDiv.remove();
    displayMessage('assistant', 'Error: Failed to get response. Make sure Ollama is running.');
  } finally {
    sendBtn.disabled = false;
    isGenerating = false;
    userInput.focus();
  }
}

// Regenerate response with variations
async function regenerateResponse(originalResponse, messageDiv) {
  if (isGenerating) return;

  const confirmMsg = 'Regenerate this response? You can choose from 3 variations.';
  if (!confirm(confirmMsg)) return;

  isGenerating = true;
  const contentDiv = messageDiv.querySelector('.message-content');
  const actionsDiv = messageDiv.querySelector('.message-actions');

  // Show loading
  contentDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
  actionsDiv.innerHTML = '';

  try {
    // Remove last assistant message from history
    currentMessages.pop();

    const response = await fetch('/api/regenerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: currentMessages })
    });

    const data = await response.json();

    // Create variation selector
    const variationSelector = document.createElement('div');
    variationSelector.className = 'variation-selector';
    variationSelector.innerHTML = `
      <h4>Choose a variation:</h4>
      ${data.variations.map((v, i) => `
        <div class="variation-option" data-index="${i}">
          <strong>${v.label} (temp: ${v.temperature})</strong>
          <p>${v.content.substring(0, 200)}...</p>
        </div>
      `).join('')}
    `;

    contentDiv.innerHTML = '';
    contentDiv.appendChild(variationSelector);

    // Handle variation selection
    variationSelector.querySelectorAll('.variation-option').forEach(option => {
      option.addEventListener('click', async () => {
        const index = parseInt(option.dataset.index);
        const selectedVariation = data.variations[index];

        // Display selected variation
        contentDiv.innerHTML = marked.parse(selectedVariation.content);
        contentDiv.querySelectorAll('pre code').forEach(block => {
          hljs.highlightElement(block);
        });

        // Add regenerate button back
        actionsDiv.innerHTML = '';
        const regenerateBtn = document.createElement('button');
        regenerateBtn.className = 'btn-regenerate';
        regenerateBtn.innerHTML = '🔄 Regenerate';
        regenerateBtn.onclick = () => regenerateResponse(selectedVariation.content, messageDiv);
        actionsDiv.appendChild(regenerateBtn);

        // Update message history
        currentMessages.push({ role: 'assistant', content: selectedVariation.content });
        await saveMessage(currentConversationId, 'assistant', selectedVariation.content);
      });
    });

  } catch (error) {
    console.error('Error regenerating:', error);
    contentDiv.innerHTML = marked.parse(originalResponse);
  } finally {
    isGenerating = false;
  }
}

// Display message
function displayMessage(role, content, scroll = true) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${role}`;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';

  if (role === 'assistant') {
    // Render markdown for assistant messages
    contentDiv.innerHTML = marked.parse(content);
    // Highlight code blocks
    contentDiv.querySelectorAll('pre code').forEach(block => {
      hljs.highlightElement(block);
    });
  } else {
    // Plain text for user messages
    contentDiv.textContent = content;
  }

  messageDiv.appendChild(contentDiv);
  messagesContainer.appendChild(messageDiv);

  if (scroll) scrollToBottom();
}

// Save message to database
async function saveMessage(conversationId, role, content) {
  try {
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: conversationId, role, content })
    });
  } catch (error) {
    console.error('Error saving message:', error);
  }
}

// Scroll to bottom
function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Focus input on load
userInput.focus();
