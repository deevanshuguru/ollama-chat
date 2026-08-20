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
let abortController = null;
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
  setupKeyboardShortcuts();
  initializeOrCreateConversation();
  loadSettingsFromStorage();
});

// Initialize or create conversation
async function initializeOrCreateConversation() {
  try {
    const response = await fetch('/api/conversations');
    const conversations = await response.json();

    if (conversations.length > 0) {
      // Check if the most recent conversation is empty
      const lastConv = conversations[0];
      const messagesResponse = await fetch(`/api/conversations/${lastConv.id}/messages`);
      const messages = await messagesResponse.json();

      if (messages.length === 0) {
        // Use the empty conversation
        currentConversationId = lastConv.id;
        currentMessages = [];
        showWelcomeMessage();
        return;
      }
    }

    // Create new conversation
    await createNewConversation();
  } catch (error) {
    console.error('Error initializing:', error);
    await createNewConversation();
  }
}

// Event Listeners
function setupEventListeners() {
  sendBtn.addEventListener('click', () => {
    if (isGenerating) {
      stopGeneration();
    } else {
      sendMessage();
    }
  });

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

// Keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K: New conversation
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      createNewConversation();
    }

    // Ctrl/Cmd + ,: Toggle settings
    if ((e.ctrlKey || e.metaKey) && e.key === ',') {
      e.preventDefault();
      toggleSettings();
    }

    // Ctrl/Cmd + /: Focus input
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      userInput.focus();
    }
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
  localStorage.setItem('local-ai-labs-settings', JSON.stringify(currentSettings));
}

function loadSettingsFromStorage() {
  const saved = localStorage.getItem('local-ai-labs-settings');
  if (saved) {
    currentSettings = JSON.parse(saved);
    applySettingsToUI();
  }
}

function showWelcomeMessage() {
  messagesContainer.innerHTML = `
    <div class="welcome-message">
      <h1>🚀 Local AI Labs</h1>
      <p>Advanced AI chat interface with no restrictions.</p>
      <p><strong>⚡ Pro tip:</strong> Use Settings (⚙️) to customize responses for different tasks.</p>
      <p><small>Shortcuts: Ctrl+K (New Chat) • Ctrl+, (Settings) • Ctrl+/ (Focus Input)</small></p>
    </div>
  `;
  chatTitle.textContent = 'New Conversation';
}

// Create new conversation
async function createNewConversation() {
  try {
    // Check if current conversation is empty
    if (currentConversationId) {
      const messagesResponse = await fetch(`/api/conversations/${currentConversationId}/messages`);
      const messages = await messagesResponse.json();

      if (messages.length === 0) {
        // Current conversation is empty, just clear UI
        currentMessages = [];
        showWelcomeMessage();
        return;
      }
    }

    // Create new conversation
    const response = await fetch('/api/conversations', { method: 'POST' });
    const data = await response.json();
    currentConversationId = data.id;
    currentMessages = [];
    showWelcomeMessage();
    loadConversations();
  } catch (error) {
    console.error('Error creating conversation:', error);
  }
}

// Load all conversations
async function loadConversations() {
  try {
    const response = await fetch('/api/conversations');
    allConversations = await response.json();

    conversationsList.innerHTML = '';

    // Filter conversations
    const filteredConvs = allConversations.filter(c => showArchived ? c.archived : !c.archived);

    // Add clear empty button
    if (allConversations.some(c => !allConversations.find(conv => conv.id === c.id))) {
      const clearBtn = document.createElement('button');
      clearBtn.className = 'clear-empty-btn';
      clearBtn.innerHTML = '🗑️ Clear Empty Chats';
      clearBtn.onclick = clearEmptyConversations;
      conversationsList.appendChild(clearBtn);
    }

    // Sort: pinned first, then by date
    filteredConvs.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    filteredConvs.forEach(conv => {
      const item = document.createElement('div');
      item.className = 'conversation-item';
      if (conv.id === currentConversationId) {
        item.classList.add('active');
      }

      const date = new Date(conv.created_at);
      const timestamp = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const title = conv.title || conv.first_message?.substring(0, 40) || 'Empty conversation';
      const pinIcon = conv.pinned ? '📌 ' : '';

      item.innerHTML = `
        <div class="conversation-header">
          <div class="timestamp">${timestamp}</div>
          <div class="conversation-actions">
            <button class="icon-btn" onclick="togglePin(${conv.id}, event)" title="Pin">${conv.pinned ? '📌' : '📍'}</button>
          </div>
        </div>
        <div class="preview">${pinIcon}${title}</div>
      `;

      item.addEventListener('click', () => loadConversation(conv.id));
      conversationsList.appendChild(item);
    });
  } catch (error) {
    console.error('Error loading conversations:', error);
  }
}

// Toggle pin
window.togglePin = async function(id, event) {
  event.stopPropagation();
  try {
    await fetch(`/api/conversations/${id}/pin`, { method: 'PATCH' });
    loadConversations();
  } catch (error) {
    console.error('Error toggling pin:', error);
  }
};

// Clear empty conversations
async function clearEmptyConversations() {
  if (!confirm('Delete all empty conversations?')) return;

  try {
    const response = await fetch('/api/conversations/empty', { method: 'DELETE' });
    const data = await response.json();
    alert(`Deleted ${data.deleted} empty conversations`);
    loadConversations();
  } catch (error) {
    console.error('Error clearing empty conversations:', error);
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

    // Load title
    const conv = allConversations.find(c => c.id === id);
    chatTitle.textContent = conv?.title || messages[0]?.content.substring(0, 50) || 'Conversation';

    loadConversations();
    scrollToBottom();
  } catch (error) {
    console.error('Error loading conversation:', error);
  }
}

// Generate title for conversation
async function generateTitle(conversationId) {
  try {
    const response = await fetch(`/api/conversations/${conversationId}/generate-title`, {
      method: 'POST'
    });
    const data = await response.json();

    if (data.title) {
      chatTitle.textContent = data.title;
      loadConversations();
    }
  } catch (error) {
    console.error('Error generating title:', error);
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

// Stop generation
function stopGeneration() {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
  isGenerating = false;
  updateSendButton();
}

// Update send button UI
function updateSendButton() {
  if (isGenerating) {
    sendBtn.classList.add('stop-mode');
    sendBtn.querySelector('.send-icon').textContent = '■';
    sendBtn.title = 'Stop generation';
  } else {
    sendBtn.classList.remove('stop-mode');
    sendBtn.querySelector('.send-icon').textContent = '➤';
    sendBtn.title = 'Send message';
    sendBtn.disabled = false;
  }
}

// Send message with advanced settings
async function sendMessage() {
  let message = userInput.value.trim();
  if (!message || isGenerating) return;

  // Prepend context if exists
  if (selectedContext) {
    message = `[Context: ${selectedContext}]\n\n${message}`;
    clearContext();
  }

  // Clear input
  userInput.value = '';
  userInput.style.height = 'auto';

  // Display user message
  displayMessage('user', message);
  await saveMessage(currentConversationId, 'user', message);

  // Add to messages array
  currentMessages.push({ role: 'user', content: message });

  // Update UI
  isGenerating = true;
  updateSendButton();

  // Create abort controller for this generation
  abortController = new AbortController();

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

  let assistantDiv = null;
  let contentDiv = null;
  let actionsDiv = null;
  let fullResponse = '';

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

    // Stream response with abort signal
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: abortController.signal
    });

    // Remove typing indicator
    typingDiv.remove();

    // Create assistant message container
    assistantDiv = document.createElement('div');
    assistantDiv.className = 'message message-assistant';
    assistantDiv.innerHTML = '<div class="message-content"></div><div class="message-actions"></div>';
    messagesContainer.appendChild(assistantDiv);
    contentDiv = assistantDiv.querySelector('.message-content');
    actionsDiv = assistantDiv.querySelector('.message-actions');
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

    // Generate title after first exchange
    if (currentMessages.filter(m => m.role === 'assistant').length === 1) {
      setTimeout(() => generateTitle(currentConversationId), 1000);
    }

    // Update conversation list
    loadConversations();

  } catch (error) {
    // Handle different error types
    if (error.name === 'AbortError') {
      console.log('Generation stopped by user');

      // Remove typing indicator if still visible
      if (typingDiv && typingDiv.parentNode) {
        typingDiv.remove();
      }

      // Save partial response if any
      if (fullResponse && fullResponse.trim()) {
        // Add stopped indicator
        contentDiv.innerHTML = marked.parse(fullResponse + '\n\n*[Generation stopped]*');
        contentDiv.querySelectorAll('pre code').forEach(block => {
          hljs.highlightElement(block);
        });

        // Add regenerate button
        const regenerateBtn = document.createElement('button');
        regenerateBtn.className = 'btn-regenerate';
        regenerateBtn.innerHTML = '🔄 Regenerate';
        regenerateBtn.onclick = () => regenerateResponse(fullResponse, assistantDiv);
        actionsDiv.appendChild(regenerateBtn);

        // Add continue button
        const continueBtn = document.createElement('button');
        continueBtn.className = 'btn-regenerate';
        continueBtn.innerHTML = '▶️ Continue';
        continueBtn.onclick = () => continueGeneration(fullResponse);
        actionsDiv.appendChild(continueBtn);

        // Save partial message
        await saveMessage(currentConversationId, 'assistant', fullResponse);
        currentMessages.push({ role: 'assistant', content: fullResponse });

        loadConversations();
      } else {
        // No content generated, just remove the div
        if (assistantDiv && assistantDiv.parentNode) {
          assistantDiv.remove();
        }
      }
    } else {
      // Other errors
      console.error('Error:', error);
      if (typingDiv && typingDiv.parentNode) {
        typingDiv.remove();
      }
      displayMessage('assistant', 'Error: Failed to get response. Make sure Ollama is running.');
    }
  } finally {
    isGenerating = false;
    abortController = null;
    updateSendButton();
    userInput.focus();
  }
}

// Continue generation from where it was stopped
async function continueGeneration(previousResponse) {
  if (isGenerating) return;

  // Add a prompt to continue
  userInput.value = 'Continue from where you stopped.';
  await sendMessage();
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

// ============================================
// PHASE 2: Network & Advanced Features
// ============================================

// Device ID Management
let deviceId = localStorage.getItem('local-ai-labs-device-id');
let selectedContext = null;

// Initialize device ID
async function initializeDevice() {
  try {
    const response = await fetch('/api/server/info', {
      headers: deviceId ? { 'X-Device-Id': deviceId } : {}
    });
    
    const newDeviceId = response.headers.get('X-Device-Id');
    if (newDeviceId) {
      deviceId = newDeviceId;
      localStorage.setItem('local-ai-labs-device-id', deviceId);
    }

    const data = await response.json();
    
    // Update server info in panel
    if (document.getElementById('local-url')) {
      document.getElementById('local-url').textContent = data.urls.local;
      document.getElementById('network-url').textContent = data.urls.network;
      document.getElementById('device-id').textContent = deviceId || 'Loading...';
    }
  } catch (error) {
    console.error('Error initializing device:', error);
  }
}

// Override fetch to include device ID
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[1]) {
    args[1].headers = {
      ...args[1].headers,
      'X-Device-Id': deviceId
    };
  } else {
    args[1] = {
      headers: { 'X-Device-Id': deviceId }
    };
  }
  return originalFetch.apply(this, args);
};

// ============================================
// Text Selection Features
// ============================================

const selectionMenu = document.getElementById('selection-menu');
const useAsContextBtn = document.getElementById('use-as-context-btn');
const sendSelectionBtn = document.getElementById('send-selection-btn');
let lastSelectedText = '';

// Handle text selection
document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('touchend', handleTextSelection);

function handleTextSelection(e) {
  const selection = window.getSelection();
  const text = selection.toString().trim();

  if (text.length > 10) {
    lastSelectedText = text;
    showSelectionMenu(e.clientX || e.touches[0].clientX, e.clientY || e.touches[0].clientY);
  } else {
    hideSelectionMenu();
  }
}

function showSelectionMenu(x, y) {
  selectionMenu.style.display = 'flex';
  selectionMenu.style.left = x + 'px';
  selectionMenu.style.top = (y - 50) + 'px';

  // Adjust if off screen
  const rect = selectionMenu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    selectionMenu.style.left = (window.innerWidth - rect.width - 10) + 'px';
  }
  if (rect.top < 0) {
    selectionMenu.style.top = '10px';
  }
}

function hideSelectionMenu() {
  selectionMenu.style.display = 'none';
}

// Use selected text as context
useAsContextBtn.addEventListener('click', () => {
  if (lastSelectedText) {
    selectedContext = lastSelectedText;
    showContextIndicator();
    hideSelectionMenu();
    userInput.focus();
  }
});

// Send selected text immediately
sendSelectionBtn.addEventListener('click', async () => {
  if (lastSelectedText) {
    hideSelectionMenu();
    userInput.value = lastSelectedText;
    await sendMessage();
  }
});

// Show context indicator
function showContextIndicator() {
  const inputContainer = document.querySelector('.input-container');
  
  // Remove existing indicator
  const existingIndicator = document.querySelector('.context-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }

  // Add new indicator
  inputContainer.classList.add('has-context');
  const indicator = document.createElement('div');
  indicator.className = 'context-indicator';
  indicator.innerHTML = `Context: ${selectedContext.substring(0, 50)}... <span class="context-clear-btn">×</span>`;
  inputContainer.insertBefore(indicator, inputContainer.firstChild);

  // Clear context button
  const clearBtn = indicator.querySelector('.context-clear-btn');
  clearBtn.addEventListener('click', clearContext);
}

// Clear selected context
function clearContext() {
  selectedContext = null;
  const inputContainer = document.querySelector('.input-container');
  const indicator = document.querySelector('.context-indicator');
  
  inputContainer.classList.remove('has-context');
  if (indicator) {
    indicator.remove();
  }
}

// Hide menu when clicking elsewhere
document.addEventListener('click', (e) => {
  if (!selectionMenu.contains(e.target)) {
    hideSelectionMenu();
  }
});

// ============================================
// Server Control Panel
// ============================================

const serverToggleBtn = document.getElementById('server-toggle-btn');
const serverPanel = document.getElementById('server-panel');
const closeServerPanel = document.getElementById('close-server-panel');
const copyNetworkUrlBtn = document.getElementById('copy-network-url-btn');
const refreshPageBtn = document.getElementById('refresh-page-btn');
const restartServerBtn = document.getElementById('restart-server-btn');

// Toggle server panel
serverToggleBtn.addEventListener('click', () => {
  serverPanel.style.display = serverPanel.style.display === 'none' ? 'block' : 'none';
  if (serverPanel.style.display === 'block') {
    initializeDevice(); // Refresh server info
  }
});

// Close server panel
closeServerPanel.addEventListener('click', () => {
  serverPanel.style.display = 'none';
});

// Copy network URL
copyNetworkUrlBtn.addEventListener('click', async () => {
  const networkUrl = document.getElementById('network-url').textContent;
  try {
    await navigator.clipboard.writeText(networkUrl);
    showToast('✅ Network URL copied to clipboard!');
  } catch (error) {
    // Fallback for older browsers
    const input = document.createElement('input');
    input.value = networkUrl;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast('✅ Network URL copied!');
  }
});

// Refresh page
refreshPageBtn.addEventListener('click', () => {
  showToast('🔄 Refreshing page...');
  setTimeout(() => {
    window.location.reload(true); // Hard reload
  }, 500);
});

// Restart server
restartServerBtn.addEventListener('click', async () => {
  if (confirm('⚠️ Restart server? This will disconnect all devices for a moment.')) {
    try {
      showToast('⚠️ Restarting server...');
      await fetch('/api/server/restart', { method: 'POST' });
      
      // Wait and reload
      setTimeout(() => {
        showToast('🔄 Reconnecting...');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }, 1000);
    } catch (error) {
      showToast('✅ Server restarted! Refreshing...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }
});

// Toast notification system
function showToast(message, duration = 3000) {
  // Remove existing toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  // Show with animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // Hide after duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

// Initialize device on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDevice);
} else {
  initializeDevice();
}

// ============================================
// Enhanced Keyboard Shortcuts
// ============================================

// Add server panel shortcut
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Shift + S: Toggle server panel
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
    e.preventDefault();
    serverToggleBtn.click();
  }
});

