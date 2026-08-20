// ============================================
// AI AGENT TOOLS - Frontend
// ============================================

// Tool icons mapping
const TOOL_ICONS = {
  terminal: '🖥️',
  browse: '🌐',
  search: '🔍',
  file_read: '📖',
  file_write: '✏️',
  file_list: '📁'
};

// Tool names mapping
const TOOL_NAMES = {
  terminal: 'Terminal',
  browse: 'Web Browse',
  search: 'Web Search',
  file_read: 'Read File',
  file_write: 'Write File',
  file_list: 'List Directory'
};

// Execute tool
async function executeTool(toolName, params) {
  const endpoints = {
    terminal: '/api/tools/terminal',
    browse: '/api/tools/browse',
    search: '/api/tools/search',
    file_read: '/api/tools/file/read',
    file_write: '/api/tools/file/write',
    file_list: '/api/tools/file/list'
  };

  const endpoint = endpoints[toolName];
  if (!endpoint) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': deviceId
      },
      body: JSON.stringify(params)
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      tool: toolName,
      error: error.message,
      success: false
    };
  }
}

// Display tool use in chat
function displayToolUse(tool, params, result) {
  const toolDiv = document.createElement('div');
  toolDiv.className = 'tool-use message message-assistant';

  const icon = TOOL_ICONS[tool] || '🔧';
  const name = TOOL_NAMES[tool] || tool;

  let resultHTML = '';

  if (result.blocked) {
    // Blocked/dangerous
    resultHTML = `
      <div class="tool-result-blocked">
        <strong>⚠️ Blocked:</strong> ${result.error || 'Command blocked for safety'}
        ${result.suggestion ? `<div class="tool-suggestion">${result.suggestion}</div>` : ''}
      </div>
    `;
  } else if (!result.success) {
    // Error
    resultHTML = `
      <div class="tool-result-error">
        <strong>❌ Error:</strong> ${result.error || 'Unknown error'}
      </div>
    `;
  } else {
    // Success - format based on tool type
    resultHTML = formatToolResult(tool, result);
  }

  toolDiv.innerHTML = `
    <div class="message-content">
      <div class="tool-header">
        <span class="tool-icon">${icon}</span>
        <span class="tool-name">${name}</span>
        <span class="tool-status ${result.success ? 'success' : 'error'}">
          ${result.success ? '✓' : '✗'}
        </span>
      </div>
      <div class="tool-params">${formatParams(tool, params)}</div>
      ${resultHTML}
      <div class="tool-actions">
        ${result.success && tool === 'terminal' ? `<button class="btn-tool-action" onclick="rerunCommand('${escapeHtml(params.command)}')">🔄 Re-run</button>` : ''}
        ${result.success ? `<button class="btn-tool-action" onclick="copyToolResult(this)">📋 Copy</button>` : ''}
        <button class="btn-tool-action toggle-tool-details" onclick="toggleToolDetails(this)">📄 Details</button>
      </div>
    </div>
  `;

  return toolDiv;
}

// Format tool parameters
function formatParams(tool, params) {
  if (tool === 'terminal') {
    return `<code class="tool-command">$ ${escapeHtml(params.command)}</code>`;
  } else if (tool === 'browse' || tool === 'search') {
    return `<div class="tool-query">${escapeHtml(params.url || params.query)}</div>`;
  } else if (tool === 'file_read' || tool === 'file_list') {
    return `<div class="tool-path">📂 ${escapeHtml(params.path)}</div>`;
  } else if (tool === 'file_write') {
    return `<div class="tool-path">📂 ${escapeHtml(params.path)} (${params.content.length} bytes)</div>`;
  }
  return '';
}

// Format tool result
function formatToolResult(tool, result) {
  if (tool === 'terminal') {
    return `
      <div class="tool-result">
        ${result.stdout ? `<pre class="tool-output">${escapeHtml(result.stdout)}</pre>` : ''}
        ${result.stderr ? `<pre class="tool-output stderr">${escapeHtml(result.stderr)}</pre>` : ''}
        <div class="tool-meta">Exit code: ${result.exit_code}</div>
      </div>
    `;
  } else if (tool === 'browse') {
    return `
      <div class="tool-result">
        <div class="browse-title"><strong>${escapeHtml(result.title)}</strong></div>
        <div class="browse-content" style="display: none;">
          <pre>${escapeHtml(result.content.slice(0, 1000))}${result.content.length > 1000 ? '...' : ''}</pre>
        </div>
        <div class="tool-meta">${result.content_length.toLocaleString()} characters</div>
      </div>
    `;
  } else if (tool === 'search') {
    const resultsHTML = result.results.map((r, i) => `
      <div class="search-result">
        <div class="search-title">${i + 1}. <a href="${escapeHtml(r.url)}" target="_blank">${escapeHtml(r.title)}</a></div>
        <div class="search-snippet">${escapeHtml(r.snippet)}</div>
      </div>
    `).join('');

    return `
      <div class="tool-result">
        ${resultsHTML}
        <div class="tool-meta">${result.count} results</div>
      </div>
    `;
  } else if (tool === 'file_read') {
    return `
      <div class="tool-result">
        <pre class="tool-output file-content" style="display: none;">${escapeHtml(result.content.slice(0, 5000))}${result.content.length > 5000 ? '\n... (truncated)' : ''}</pre>
        <div class="tool-meta">
          Size: ${(result.size / 1024).toFixed(2)} KB
          ${result.modified ? ` | Modified: ${new Date(result.modified).toLocaleString()}` : ''}
        </div>
      </div>
    `;
  } else if (tool === 'file_list') {
    const filesHTML = result.files.map(f => `
      <div class="file-item">
        <span class="file-icon">${f.type === 'directory' ? '📁' : '📄'}</span>
        <span class="file-name">${escapeHtml(f.name)}</span>
        ${f.size ? `<span class="file-size">${formatFileSize(f.size)}</span>` : ''}
      </div>
    `).join('');

    return `
      <div class="tool-result">
        <div class="file-list">${filesHTML}</div>
        <div class="tool-meta">${result.count} items</div>
      </div>
    `;
  } else if (tool === 'file_write') {
    return `
      <div class="tool-result">
        <div class="tool-success">✅ File written successfully</div>
        <div class="tool-meta">
          Size: ${(result.size / 1024).toFixed(2)} KB
          ${result.modified ? ` | Modified: ${new Date(result.modified).toLocaleString()}` : ''}
        </div>
      </div>
    `;
  }

  return `<div class="tool-result"><pre>${JSON.stringify(result, null, 2)}</pre></div>`;
}

// Helper functions
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function toggleToolDetails(button) {
  const toolUse = button.closest('.tool-use');
  const content = toolUse.querySelector('.tool-output, .browse-content, .file-content');
  if (content) {
    if (content.style.display === 'none') {
      content.style.display = 'block';
      button.textContent = '📄 Hide Details';
    } else {
      content.style.display = 'none';
      button.textContent = '📄 Details';
    }
  }
}

function copyToolResult(button) {
  const toolUse = button.closest('.tool-use');
  const output = toolUse.querySelector('.tool-output, .tool-result');
  if (output) {
    const text = output.textContent;
    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 Copied to clipboard!');
    });
  }
}

function rerunCommand(command) {
  userInput.value = `/terminal ${command}`;
  userInput.focus();
}

// Tool commands parser
function parseToolCommand(message) {
  // Check if message is a tool command
  const toolCommands = {
    '/terminal': 'terminal',
    '/browse': 'browse',
    '/search': 'search',
    '/read': 'file_read',
    '/list': 'file_list'
  };

  for (const [cmd, tool] of Object.entries(toolCommands)) {
    if (message.startsWith(cmd + ' ')) {
      const args = message.slice(cmd.length + 1).trim();
      return { tool, args };
    }
  }

  return null;
}

// Handle tool commands
async function handleToolCommand(message) {
  const parsed = parseToolCommand(message);
  if (!parsed) return false;

  const { tool, args } = parsed;

  let params = {};

  if (tool === 'terminal') {
    params = { command: args };
  } else if (tool === 'browse') {
    params = { url: args };
  } else if (tool === 'search') {
    params = { query: args };
  } else if (tool === 'file_read') {
    params = { path: args };
  } else if (tool === 'file_list') {
    params = { path: args };
  }

  // Show user message
  displayMessage('user', message);
  await saveMessage(currentConversationId, 'user', message);

  // Show loading
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'message message-assistant';
  loadingDiv.innerHTML = `
    <div class="message-content">
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  messagesContainer.appendChild(loadingDiv);
  scrollToBottom();

  // Execute tool
  const result = await executeTool(tool, params);

  // Remove loading
  loadingDiv.remove();

  // Show result
  const toolDiv = displayToolUse(tool, params, result);
  messagesContainer.appendChild(toolDiv);
  scrollToBottom();

  // Save to conversation
  const toolResultMsg = `[Tool: ${tool}]\n${JSON.stringify(result, null, 2)}`;
  await saveMessage(currentConversationId, 'assistant', toolResultMsg);

  return true;
}

// Add to sendMessage function
const originalSendMessageForTools = sendMessage;
sendMessage = async function() {
  const message = userInput.value.trim();
  if (!message || isGenerating) return;

  // Check if it's a tool command
  if (message.startsWith('/')) {
    const handled = await handleToolCommand(message);
    if (handled) {
      userInput.value = '';
      userInput.style.height = 'auto';
      return;
    }
  }

  // Otherwise, normal chat
  return originalSendMessageForTools.call(this);
};

console.log('🔧 Tool system loaded');
