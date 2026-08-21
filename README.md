# 🚀 Local AI Labs - AI Agent System v2.0

**Your AI doesn't just chat - it ACTS! Execute commands, browse the web, access files, and more.**

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/deevanshuguru/ollama-chat)
[![Status](https://img.shields.io/badge/status-production--ready-green.svg)](https://github.com/deevanshuguru/ollama-chat)
[![Ollama](https://img.shields.io/badge/ollama-dolphin--llama3-orange.svg)](https://ollama.com)

Transform your local LLM into a powerful AI Agent with **real-world capabilities**.

---

## ⚡ What's New in v2.0

🆕 **AI Agent Tools** - Execute commands, browse web, access files  
🆕 **Voice Interface** - Speak to your AI and hear responses  
🆕 **Code Execution** - Run JavaScript, Python, and Bash safely  
🆕 **Persistent Memory** - AI remembers everything (ChromaDB)  
🆕 **Multi-Device** - Access from phone, tablet, desktop  
🆕 **100% Mobile Responsive** - Perfect on all screen sizes  

---

## 🎯 Quick Start

### One Command:
```bash
start labs
```

Or manually:
```bash
npm install
node server.js
```

**Browser opens automatically at**: http://localhost:3333

---

## 🤖 AI Agent Powers

### 🖥️ **Terminal Execution**
```bash
/terminal ls -la
/terminal ps aux | grep node
/terminal cat ~/.zshrc
```
✅ Execute any safe shell command  
⏱️ 30-second timeout protection  
🛡️ Dangerous commands blocked  

### 🌐 **Web Browsing & Search**
```bash
/browse https://ollama.com
/search "best nodejs practices"
```
✅ Fetch any web page  
✅ Search via DuckDuckGo  
✅ Extract clean content  

### 📁 **File System Access**
```bash
/list ~/Documents
/read ~/Documents/notes.txt
```
✅ Read files  
✅ Write files (with confirmation)  
✅ List directories  
🔐 Whitelisted paths only  

### 💻 **Code Execution**
```javascript
User: "Execute: console.log('Hello World')"
AI: [Runs code safely] → "Hello World"
```
✅ JavaScript (VM2 sandbox)  
✅ Python (system Python)  
✅ Bash scripts  
⏱️ 5-second timeout  

### 🎤 **Voice Interface**
- Click 🎤 to speak your message
- Toggle 🔊 for AI to speak back
- Keyboard: `Ctrl+Shift+V` (speak), `Ctrl+Shift+S` (hear)

### 🧠 **Persistent Memory** 
- Remembers all conversations
- Semantic search across history
- Automatic fact extraction
- Context-aware responses

*(Requires ChromaDB: `docker run -p 8000:8000 chromadb/chroma`)*

---

## 📸 Demo

```
┌──────────────────────────────────────────────┐
│ 🐬 Local AI Labs    ⚙️ Settings  🗑️ Delete  │
├──────────────────────────────────────────────┤
│ You: What's in my Downloads folder?          │
│                                               │
│ 🤖 AI:                                        │
│ ┌─ 🖥️ Terminal ──────────────────────────┐  │
│ │ $ ls ~/Downloads                        │  │
│ │ document.pdf (2.3 MB)                   │  │
│ │ image.png (451 KB)                      │  │
│ │ data.csv (1.2 MB)                       │  │
│ └─────────────────────────────────────────┘  │
│ You have 3 files totaling 4 MB.             │
│                                               │
│ ┌───────────────────────────────────────┐    │
│ │ Type message... 🎤 🔊 ➤              │    │
│ └───────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

---

## 🎮 Usage Examples

### Research Assistant
```
You: "Search for ollama tutorials"
AI: [Searches web, shows 10 results]

You: "Browse the first link"
AI: [Fetches content, summarizes]
```

### System Admin
```
You: "Check what's using port 3333"
AI: [Executes lsof, shows process]
```

### Developer Helper
```
You: "Write a function to reverse a string"
AI: [Shows code]

You: "Execute it with 'hello'"
AI: [Runs code] → "olleh"
```

### Voice Mode
```
You: 🎤 "What files are in my Documents?"
AI: 🔊 "You have 15 files in your Documents folder..."
```

---

## 🔐 Security

### ✅ Safe by Design
- Dangerous commands blocked (`rm -rf`, `sudo`, etc.)
- File access limited to safe directories
- Code runs in isolated VM sandbox
- All operations have timeouts

### 🛡️ Protection Layers
- Command blacklist (15+ dangerous patterns)
- Path whitelist (only ~/Documents, ~/Downloads, ~/Desktop, /tmp)
- VM2 isolation for code execution
- Output size limits
- Timeout enforcement

---

## 📱 Multi-Device Support

**Access from anywhere on your WiFi:**

1. Server shows network URL in console
2. Open URL on phone/tablet
3. Each device gets isolated chat history
4. Real-time sync across devices

**Example:**
- Laptop: http://localhost:3333
- Phone: http://192.168.0.100:3333
- Tablet: http://192.168.0.100:3333

---

## ⌨️ All Commands

### Tool Commands
| Command | Purpose | Example |
|---------|---------|---------|
| `/terminal` | Execute shell command | `/terminal ls -la` |
| `/browse` | Fetch web page | `/browse https://example.com` |
| `/search` | Search internet | `/search ollama guide` |
| `/read` | Read file | `/read ~/notes.txt` |
| `/list` | List directory | `/list ~/Documents` |

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | New conversation |
| `Ctrl+,` | Toggle settings |
| `Ctrl+/` | Focus input |
| `Ctrl+Shift+V` | Voice input |
| `Ctrl+Shift+S` | Speak response |
| `Enter` | Send message |
| `Shift+Enter` | New line |

---

## 🔧 Installation

### Prerequisites
- Node.js 16+
- Ollama with `dolphin-llama3` model
- (Optional) Docker for ChromaDB memory

### Setup
```bash
# 1. Clone repository
git clone https://github.com/deevanshuguru/ollama-chat.git
cd ollama-chat

# 2. Install dependencies
npm install

# 3. Install Ollama model
ollama pull dolphin-llama3

# 4. (Optional) Start memory system
docker run -p 8000:8000 chromadb/chroma

# 5. Launch
node server.js
```

### Create Alias
Add to `~/.zshrc` or `~/.bashrc`:
```bash
alias start="cd ~/path/to/ollama-chat && ./start-labs.sh"
```

Then: `start labs` from anywhere!

---

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js, Express |
| **AI Model** | Ollama (dolphin-llama3 8B) |
| **Memory** | ChromaDB (vector DB) |
| **Code Sandbox** | VM2 |
| **Web Scraping** | JSDOM, Cheerio |
| **Frontend** | Vanilla JavaScript |
| **Markdown** | Marked.js |
| **Voice** | Web Speech API |
| **Styling** | CSS3 (responsive) |

---

## 📊 Features Matrix

| Feature | Status | Notes |
|---------|--------|-------|
| Chat Interface | ✅ | Streaming responses |
| Terminal Execution | ✅ | Safe command execution |
| Web Browsing | ✅ | Full page fetching |
| Web Search | ✅ | DuckDuckGo integration |
| File Read | ✅ | Whitelisted paths |
| File Write | ✅ | With confirmation |
| Code Execution | ✅ | JS/Python/Bash |
| Voice Input | ✅ | Web Speech API |
| Voice Output | ✅ | Speech Synthesis |
| Memory System | ✅ | ChromaDB (optional) |
| Multi-Device | ✅ | Network access |
| Mobile Responsive | ✅ | All screen sizes |
| Accessibility | ✅ | WCAG 2.1 AA |

---

## 📚 Documentation

- **[Complete Status](COMPLETE_STATUS.md)** - Full feature list & stats
- **[Tools Guide](TOOLS_QUICKSTART.md)** - How to use all tools
- **[UI Audit](RESPONSIVE_UI_AUDIT.md)** - Mobile design details
- **[Upgrade Plan](UPGRADE_PLAN.md)** - Future roadmap
- **[Network Guide](NETWORK_FEATURES.md)** - Multi-device setup

---

## 🐛 Troubleshooting

**Tools not working?**
→ Check Ollama running: `ollama list`

**Voice not working?**
→ Grant microphone permissions in browser

**Can't access from phone?**
→ Check firewall allows port 3333

**Memory not working?**
→ Start ChromaDB or ignore (optional)

---

## 🗺️ Roadmap

### ✅ v2.0 (Current)
- [x] Terminal, web, file access
- [x] Code execution
- [x] Voice interface
- [x] Memory system
- [x] Multi-device
- [x] Mobile responsive

### 🔄 v2.1 (Next)
- [ ] Visual data charts
- [ ] Function calling router
- [ ] PDF processing
- [ ] Image analysis

### 📋 v3.0 (Future)
- [ ] Plugin marketplace
- [ ] Multi-model support
- [ ] Workflow automation
- [ ] Cloud sync
- [ ] Team collaboration

---

## 🤝 Contributing

Contributions welcome!

1. Fork the repo
2. Create feature branch
3. Commit changes
4. Push and create PR

---

## 📄 License

MIT License - see LICENSE file

---

## 🙏 Credits

- **Ollama** - Local LLM infrastructure
- **Dolphin** - Uncensored model
- **ChromaDB** - Vector memory
- **VM2** - Safe code execution

---

## ⭐ Star History

If you find this useful, star the repo!

[![Star History](https://img.shields.io/github/stars/deevanshuguru/ollama-chat?style=social)](https://github.com/deevanshuguru/ollama-chat)

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/deevanshuguru/ollama-chat/issues)
- **Discussions**: [GitHub Discussions](https://github.com/deevanshuguru/ollama-chat/discussions)

---

**Built with ❤️ by AI + Human**

**Version 2.0.0** | **Status: 🟢 Production Ready** | **Updated: Aug 21, 2026**
