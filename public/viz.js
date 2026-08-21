// ============================================
// VISUAL DATA ANALYTICS - FRONTEND
// Client-side visualization handling
// ============================================

// Parse data command from message
function parseVizCommand(message) {
  const patterns = [
    // /visualize data
    /^\/(?:visualize|viz|chart|graph)\s+(.+)/i,
    // "visualize this data: ..."
    /visualize\s+(?:this\s+)?data[:\s]+(.+)/i,
    // "create chart from ..."
    /create\s+(?:a\s+)?(?:chart|graph)\s+(?:from|with)[:\s]+(.+)/i,
    // "show chart: ..."
    /show\s+(?:a\s+)?chart[:\s]+(.+)/i
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return {
        found: true,
        data: match[1].trim()
      };
    }
  }

  return { found: false };
}

// Visualize data
async function visualizeData(data, options = {}) {
  try {
    const response = await fetch('/api/visualize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data,
        type: options.type,
        title: options.title,
        width: options.width,
        height: options.height
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('Visualization error:', error);
    throw error;
  }
}

// Get data statistics
async function getDataStats(data) {
  try {
    const response = await fetch('/api/visualize/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('Stats error:', error);
    throw error;
  }
}

// Display visualization in chat
function displayVisualization(result) {
  const vizCard = document.createElement('div');
  vizCard.className = 'tool-result visualization-result';
  vizCard.innerHTML = `
    <div class="tool-header">
      <span class="tool-icon">📊</span>
      <span class="tool-name">Data Visualization</span>
      <button class="viz-action" onclick="openVisualization('${result.url}')">
        🔍 Open Full View
      </button>
    </div>
    <div class="viz-preview">
      <iframe src="${result.url}" frameborder="0" class="viz-iframe"></iframe>
    </div>
    <div class="viz-meta">
      <span class="viz-meta-item">
        <strong>Type:</strong> ${result.chartType}
      </span>
      <span class="viz-meta-item">
        <strong>Data Points:</strong> ${result.dataPoints}
      </span>
      <span class="viz-meta-item">
        <button onclick="downloadVisualization('${result.url}')">
          💾 Download
        </button>
      </span>
    </div>
  `;

  const chatMessages = document.getElementById('chat-messages');
  const lastMessage = chatMessages.lastElementChild;

  if (lastMessage && lastMessage.classList.contains('bot-message')) {
    lastMessage.appendChild(vizCard);
  } else {
    const botMessage = document.createElement('div');
    botMessage.className = 'message bot-message';
    botMessage.appendChild(vizCard);
    chatMessages.appendChild(botMessage);
  }

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Display statistics
function displayStats(stats) {
  const statsCard = document.createElement('div');
  statsCard.className = 'tool-result stats-result';

  let statsHTML = `
    <div class="tool-header">
      <span class="tool-icon">📈</span>
      <span class="tool-name">Data Statistics</span>
    </div>
    <div class="stats-content">
      <div class="stats-overview">
        <div class="stat-item">
          <div class="stat-label">Total Rows</div>
          <div class="stat-value">${stats.rowCount}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Columns</div>
          <div class="stat-value">${stats.columns.length}</div>
        </div>
      </div>
      <div class="stats-details">
  `;

  // Add stats for each column
  Object.entries(stats.stats).forEach(([column, columnStats]) => {
    statsHTML += `
      <div class="column-stats">
        <h4>${column}</h4>
        <div class="stat-grid">
          <div><strong>Count:</strong> ${columnStats.count}</div>
          <div><strong>Average:</strong> ${columnStats.average.toFixed(2)}</div>
          <div><strong>Min:</strong> ${columnStats.min}</div>
          <div><strong>Max:</strong> ${columnStats.max}</div>
          <div><strong>Median:</strong> ${columnStats.median.toFixed(2)}</div>
          <div><strong>Sum:</strong> ${columnStats.sum.toFixed(2)}</div>
        </div>
      </div>
    `;
  });

  statsHTML += `
      </div>
    </div>
  `;

  statsCard.innerHTML = statsHTML;

  const chatMessages = document.getElementById('chat-messages');
  const lastMessage = chatMessages.lastElementChild;

  if (lastMessage && lastMessage.classList.contains('bot-message')) {
    lastMessage.appendChild(statsCard);
  } else {
    const botMessage = document.createElement('div');
    botMessage.className = 'message bot-message';
    botMessage.appendChild(statsCard);
    chatMessages.appendChild(botMessage);
  }

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Open visualization in new window
function openVisualization(url) {
  window.open(url, '_blank', 'width=1000,height=700');
}

// Download visualization
function downloadVisualization(url) {
  const link = document.createElement('a');
  link.href = url;
  link.download = `visualization_${Date.now()}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Handle visualization command
async function handleVizCommand(message) {
  const vizCommand = parseVizCommand(message);

  if (!vizCommand.found) {
    return false;
  }

  try {
    // Show loading
    appendMessage('bot', '📊 Creating visualization...');

    // Check if message includes chart type
    let chartType = null;
    const typeMatch = message.match(/\b(bar|line|pie|scatter|doughnut|radar)\s+chart/i);
    if (typeMatch) {
      chartType = typeMatch[1].toLowerCase();
    }

    // Extract title if specified
    const titleMatch = message.match(/title[:\s]+["""]([^"""]+)["""]/i);
    const title = titleMatch ? titleMatch[1] : 'Data Visualization';

    // Visualize
    const result = await visualizeData(vizCommand.data, {
      type: chartType,
      title
    });

    displayVisualization(result);

    // Get and display stats
    const stats = await getDataStats(vizCommand.data);
    displayStats(stats);

    return true;

  } catch (error) {
    appendMessage('bot', `❌ Visualization error: ${error.message}`);
    return true;
  }
}

// Example data for testing
const exampleData = {
  sales: `Month,Sales,Expenses
Jan,12000,8000
Feb,15000,9000
Mar,18000,11000
Apr,16000,10000
May,20000,12000
Jun,22000,13000`,

  scores: `Student,Math,Science,English
Alice,95,88,92
Bob,87,90,85
Charlie,92,85,88
Diana,88,92,90
Eve,90,87,93`,

  scatter: `Height,Weight
150,50
160,55
165,60
170,65
175,70
180,75
185,80`,

  pie: `Category,Value
Marketing,30
Development,45
Sales,15
Support,10`
};

// Expose to global scope
window.visualizeData = visualizeData;
window.getDataStats = getDataStats;
window.handleVizCommand = handleVizCommand;
window.openVisualization = openVisualization;
window.downloadVisualization = downloadVisualization;
window.exampleData = exampleData;

console.log('📊 Visual Analytics loaded');
console.log('📝 Try: /visualize ' + exampleData.sales.split('\\n').slice(0, 2).join('\\n') + '...');
