# 🚀 Local AI Labs - UPGRADE PLAN
## Empowering AI with Real-World Capabilities

**Date**: 2026-08-21  
**Status**: 🏗️ IN PROGRESS  
**Vision**: Transform from chat app → Full-powered AI Agent System

---

## 🎯 PHASE 1: AI Agent with Tool Use (Priority: CRITICAL)

### Overview
Enable the AI to execute real actions in the real world:
- Run terminal commands (with user permission)
- Browse the internet (search, fetch pages)
- Access file system (read/write files)
- Execute code in sandboxed environment
- Call external APIs

### Implementation Plan

#### 1.1 Terminal Command Execution
```javascript
// Backend: server.js
app.post('/api/tools/terminal', async (req, res) => {
  const { command, conversation_id } = req.body;
  
  // Safety checks
  const dangerous = ['rm -rf', 'sudo', 'chmod 777', 'dd if='];
  if (dangerous.some(cmd => command.includes(cmd))) {
    return res.status(403).json({ 
      error: 'Dangerous command blocked',
      suggestion: 'Please review the command for safety'
    });
  }
  
  // Execute with timeout and output capture
  const { exec } = require('child_process');
  exec(command, { timeout: 30000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    res.json({
      command,
      stdout: stdout.slice(0, 10000), // Limit output
      stderr: stderr.slice(0, 10000),
      error: error ? error.message : null,
      exit_code: error ? error.code : 0
    });
  });
});
```

**Safety Features**:
- Whitelist/blacklist of commands
- User confirmation for dangerous operations
- Timeout limits (30 seconds)
- Output size limits (1MB)
- Sandboxed execution option (Docker)
- Command history logging

#### 1.2 Internet Browsing
```javascript
// Backend: server.js
app.post('/api/tools/browse', async (req, res) => {
  const { url } = req.body;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'LocalAILabs/1.0'
      },
      timeout: 10000
    });
    
    const html = await response.text();
    
    // Extract text content (remove scripts, styles)
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM(html);
    const text = dom.window.document.body.textContent;
    
    res.json({
      url,
      title: dom.window.document.title,
      content: text.slice(0, 50000), // Limit content
      status: response.status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tools/search', async (req, res) => {
  const { query } = req.body;
  
  // Use DuckDuckGo or SearxNG for privacy-focused search
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  
  // Fetch and parse results
  // Return top 10 results with titles, URLs, snippets
});
```

**Features**:
- Web page fetching with content extraction
- Search engine integration (DuckDuckGo)
- URL validation and safety checks
- Content summarization
- Image extraction
- PDF parsing

#### 1.3 File System Access
```javascript
// Backend: server.js
app.post('/api/tools/file/read', async (req, res) => {
  const { path, conversation_id } = req.body;
  
  // Safety: Only allow reads from safe directories
  const safePaths = ['/tmp', process.env.HOME + '/Documents'];
  if (!safePaths.some(safe => path.startsWith(safe))) {
    return res.status(403).json({ error: 'Path not allowed' });
  }
  
  try {
    const content = fs.readFileSync(path, 'utf8');
    res.json({
      path,
      content: content.slice(0, 100000), // 100KB limit
      size: content.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tools/file/write', async (req, res) => {
  const { path, content, conversation_id } = req.body;
  
  // Safety checks
  // User confirmation required
  // Size limits
  // Path validation
});

app.post('/api/tools/file/list', async (req, res) => {
  const { path } = req.body;
  
  // List directory contents
  // Return files with metadata (size, modified date)
});
```

**Safety Features**:
- Whitelist of safe directories
- File size limits
- User confirmation for writes
- Backup before overwrite
- Read-only mode option

#### 1.4 Frontend: Tool Use Interface
```javascript
// public/app.js

// Display tool usage in chat
function displayToolUse(tool, params, result) {
  const toolDiv = document.createElement('div');
  toolDiv.className = 'tool-use';
  toolDiv.innerHTML = `
    <div class="tool-header">
      <span class="tool-icon">${getToolIcon(tool)}</span>
      <span class="tool-name">${tool}</span>
    </div>
    <div class="tool-params">${formatParams(params)}</div>
    <div class="tool-result">${formatResult(result)}</div>
  `;
  return toolDiv;
}

// Tool icons
function getToolIcon(tool) {
  const icons = {
    terminal: '🖥️',
    browse: '🌐',
    search: '🔍',
    file_read: '📖',
    file_write: '✏️',
    file_list: '📁'
  };
  return icons[tool] || '🔧';
}
```

**UI Features**:
- Collapsible tool results
- Syntax highlighting for code
- Inline command approval
- Tool usage history
- Quick actions (re-run, copy)

---

## 🎯 PHASE 2: Memory & Knowledge Base (Priority: HIGH)

### Overview
Give the AI persistent memory and knowledge:
- Remember past conversations
- Build personal knowledge base
- Semantic search across all data
- Auto-organize information
- Context-aware responses

### Implementation Plan

#### 2.1 Vector Database Integration
```bash
# Install ChromaDB or Qdrant
npm install chromadb
```

```javascript
// Backend: memory.js
const { ChromaClient } = require('chromadb');

class MemorySystem {
  constructor() {
    this.client = new ChromaClient();
    this.collection = null;
  }
  
  async initialize() {
    this.collection = await this.client.getOrCreateCollection({
      name: 'conversation_memory',
      metadata: { description: 'All conversation history and facts' }
    });
  }
  
  async store(text, metadata) {
    // Generate embedding (using Ollama)
    const embedding = await this.generateEmbedding(text);
    
    await this.collection.add({
      ids: [metadata.id],
      embeddings: [embedding],
      documents: [text],
      metadatas: [metadata]
    });
  }
  
  async search(query, limit = 5) {
    const queryEmbedding = await this.generateEmbedding(query);
    
    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit
    });
    
    return results;
  }
  
  async generateEmbedding(text) {
    // Use Ollama embeddings endpoint
    const response = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: text
      })
    });
    
    const data = await response.json();
    return data.embedding;
  }
}
```

#### 2.2 Automatic Fact Extraction
```javascript
// Extract facts from conversations
async function extractFacts(conversation) {
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      model: 'dolphin-llama3',
      messages: [
        {
          role: 'system',
          content: 'Extract important facts, preferences, and information from this conversation. Return as JSON array.'
        },
        {
          role: 'user',
          content: conversation
        }
      ],
      stream: false
    })
  });
  
  const data = await response.json();
  const facts = JSON.parse(data.message.content);
  
  // Store each fact in vector DB
  for (const fact of facts) {
    await memorySystem.store(fact.text, {
      type: 'fact',
      category: fact.category,
      timestamp: Date.now()
    });
  }
}
```

#### 2.3 Context-Aware Retrieval
```javascript
// Before sending to AI, retrieve relevant context
async function getRelevantContext(userMessage, limit = 3) {
  const relevantMemories = await memorySystem.search(userMessage, limit);
  
  const contextString = relevantMemories.map(mem => 
    `[Memory from ${mem.metadata.timestamp}]: ${mem.document}`
  ).join('\n\n');
  
  return contextString;
}

// Modify chat endpoint to include context
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  const lastMessage = messages[messages.length - 1].content;
  
  // Get relevant context from memory
  const context = await getRelevantContext(lastMessage);
  
  // Prepend context to messages
  if (context) {
    messages.unshift({
      role: 'system',
      content: `Relevant context from past conversations:\n${context}`
    });
  }
  
  // Continue with normal chat logic...
});
```

**Features**:
- Automatic fact extraction after each conversation
- Semantic search across all history
- Time-based relevance decay
- Category organization
- Export/import memory
- Memory visualization

---

## 🎯 PHASE 3: Advanced Capabilities (Priority: MEDIUM)

### 3.1 Voice Input/Output
```javascript
// Use Web Speech API
const recognition = new webkitSpeechRecognition();
recognition.continuous = false;
recognition.lang = 'en-US';

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  userInput.value = transcript;
  sendMessage();
};

// Voice output with TTS
function speakResponse(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  speechSynthesis.speak(utterance);
}
```

### 3.2 Code Execution Sandbox
```javascript
// Use isolated-vm or Docker containers
const { Isolate } = require('isolated-vm');

async function executeCode(code, language) {
  if (language === 'javascript') {
    const isolate = new Isolate({ memoryLimit: 128 });
    const context = await isolate.createContext();
    
    const result = await context.eval(code, { timeout: 5000 });
    return result;
  }
  
  // For Python, use Docker
  // docker run --rm -i python:3.9 python -c "code"
}
```

### 3.3 Plugin System
```javascript
// plugins/weather.js
module.exports = {
  name: 'weather',
  description: 'Get weather information',
  
  async execute(params) {
    const { location } = params;
    const response = await fetch(`https://wttr.in/${location}?format=j1`);
    return await response.json();
  }
};

// Load plugins dynamically
const plugins = {};
fs.readdirSync('./plugins').forEach(file => {
  const plugin = require(`./plugins/${file}`);
  plugins[plugin.name] = plugin;
});
```

### 3.4 Multi-Model Support
```javascript
// Switch between different models
const MODELS = {
  'dolphin-llama3': { size: '8B', uncensored: true },
  'llama3': { size: '8B', general: true },
  'codellama': { size: '7B', coding: true },
  'mistral': { size: '7B', fast: true }
};

app.post('/api/chat', async (req, res) => {
  const { model = 'dolphin-llama3' } = req.body;
  
  // Use specified model
  // Allow switching mid-conversation
});
```

### 3.5 RAG (Retrieval Augmented Generation)
```javascript
// Upload documents to knowledge base
app.post('/api/knowledge/upload', async (req, res) => {
  const { file } = req.files;
  
  // Parse PDF, DOCX, TXT
  const content = await parseDocument(file);
  
  // Split into chunks
  const chunks = splitIntoChunks(content, 500);
  
  // Store in vector DB
  for (const chunk of chunks) {
    await memorySystem.store(chunk, {
      type: 'document',
      filename: file.name,
      timestamp: Date.now()
    });
  }
});

// RAG-enhanced chat
async function ragChat(query) {
  // 1. Retrieve relevant chunks
  const relevant = await memorySystem.search(query, 5);
  
  // 2. Build context from chunks
  const context = relevant.map(r => r.document).join('\n\n');
  
  // 3. Send to AI with context
  const response = await chat([
    { role: 'system', content: `Use this context:\n${context}` },
    { role: 'user', content: query }
  ]);
  
  return response;
}
```

---

## 📦 Dependencies to Add

```bash
# Terminal & Process Management
npm install child_process

# Web Scraping & Parsing
npm install jsdom
npm install cheerio
npm install node-fetch

# Vector Database
npm install chromadb
# OR
npm install qdrant-js

# Document Parsing
npm install pdf-parse
npm install mammoth  # for DOCX

# Code Execution
npm install isolated-vm

# File Operations (already have fs)

# Search
npm install duckduckgo-search
# OR implement custom scraper
```

---

## 🎯 Implementation Priority

### Week 1: Foundation
1. ✅ Terminal command execution (safe mode)
2. ✅ Web browsing capability
3. ✅ File system access (read-only first)

### Week 2: Memory System
1. ✅ Vector database setup
2. ✅ Automatic fact extraction
3. ✅ Context retrieval integration

### Week 3: Advanced Features
1. ✅ Voice input/output
2. ✅ Code execution sandbox
3. ✅ Plugin system

### Week 4: Polish & Security
1. ✅ Security hardening
2. ✅ User confirmation dialogs
3. ✅ Tool usage logging
4. ✅ Documentation

---

## 🔒 Security Considerations

### Command Execution
- ❌ Block: `rm -rf`, `sudo`, `chmod 777`, `dd`, `mkfs`
- ✅ Allow: `ls`, `cat`, `grep`, `find`, `ps`, `top`
- 🔐 Require confirmation: `git push`, file modifications, network commands

### Web Browsing
- ✅ URL validation
- ✅ Timeout limits (10s)
- ✅ Content size limits (50KB)
- ❌ Block: File downloads by default
- 🔐 HTTPS preferred

### File System
- ✅ Whitelist directories: ~/Documents, ~/Downloads, /tmp
- ❌ Blacklist: /, /etc, /var, /usr, ~/.ssh
- 🔐 Require confirmation for writes
- ✅ Backup before overwrite

### General
- Rate limiting on all tools
- Audit logging
- User session tracking
- Timeout on all operations
- Resource limits (CPU, memory, disk)

---

## 🎨 UI Mockups

### Tool Use Interface
```
┌─────────────────────────────────────┐
│ 🤖 AI: I'll check that directory   │
│                                     │
│ ┌─ 🖥️ Terminal ─────────────────┐ │
│ │ $ ls -la /tmp                  │ │
│ │                                │ │
│ │ drwxr-xr-x  12 user  wheel ... │ │
│ │ -rw-r--r--   1 user  wheel ... │ │
│ │ [Expand] [Copy] [Re-run]       │ │
│ └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Memory Sidebar
```
┌─ 📚 Knowledge Base ─────┐
│ 🔍 Search memories      │
│                         │
│ 📌 Recent Facts:        │
│ • User prefers Python   │
│ • Working on web app    │
│ • Lives in timezone PST │
│                         │
│ 📁 Categories:          │
│ • Personal (15)         │
│ • Technical (42)        │
│ • Projects (8)          │
└─────────────────────────┘
```

### Plugin Marketplace
```
┌─ 🔌 Plugins ────────────────────┐
│ ✅ Weather (installed)          │
│ ✅ Calculator (installed)       │
│ 📦 Translator (available)       │
│ 📦 Image Generator (available)  │
│                                 │
│ [Browse All] [Install Custom]  │
└─────────────────────────────────┘
```

---

## 📊 Success Metrics

### Phase 1: Tool Use
- ✅ Execute commands safely
- ✅ Browse web pages successfully
- ✅ Read/write files with permission
- 🎯 Target: 95% success rate

### Phase 2: Memory
- ✅ Store 1000+ memories
- ✅ Retrieve relevant context < 100ms
- ✅ Fact extraction accuracy > 90%
- 🎯 Target: Useful context in 80% of chats

### Phase 3: Advanced
- ✅ Voice recognition accuracy > 90%
- ✅ Code execution success rate > 95%
- ✅ Plugin system extensibility
- 🎯 Target: 10+ plugins available

---

## 🚀 Vision: The Ultimate AI Assistant

**By the end of these upgrades, Local AI Labs will be able to:**

1. **Act in the real world**
   - Execute commands on your computer
   - Browse and search the internet
   - Read and write files
   - Run code in any language

2. **Remember everything**
   - Every conversation is indexed
   - Semantic search across all data
   - Automatic fact extraction
   - Context-aware responses

3. **Extend infinitely**
   - Plugin system for new capabilities
   - Multi-model support
   - Custom tool integration
   - Voice interface

**From a simple chat app → A powerful AI agent that can actually DO things!**

---

**Next Step**: Start with Phase 1 implementation - Terminal & Web Access
