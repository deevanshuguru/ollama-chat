# 🐬 Dolphin Chat - Advanced Uncensored AI Interface

A powerful, feature-rich browser-based chat interface for the Dolphin LLM running locally via Ollama. Now with **advanced parameter controls, multiple system prompts, conversation modes, and response regeneration**.

## 🚀 Features

### Core Features
- ✅ **Clean, Modern UI** - Beautiful dark-themed chat interface
- ✅ **Streaming Responses** - Real-time token-by-token generation
- ✅ **Markdown Rendering** - Full markdown support with syntax highlighting
- ✅ **Chat History** - Persistent conversation storage
- ✅ **Uncensored Mode** - No ethical guidelines, content restrictions, or boundaries
- ✅ **Auto-Launch** - Browser opens automatically when started
- ✅ **Code Highlighting** - Syntax highlighting for 180+ programming languages
- ✅ **Responsive Design** - Works on desktop and mobile

### 🆕 Advanced Features

#### 🎛️ **Parameter Controls**
- **Temperature** (0-2.0): Control creativity and randomness
- **Top P** (0.1-1.0): Nucleus sampling for diversity
- **Max Tokens** (512-8192): Control response length
- **Repeat Penalty** (1.0-2.0): Reduce repetitive text
- Real-time adjustment with visual sliders
- Settings persist across sessions

#### 🎭 **Multiple System Prompts**
Choose from specialized AI personas:
- **Uncensored Default**: General unrestricted assistant
- **Expert Coder**: Programming specialist with zero restrictions
- **Creative Writer**: Unrestricted fiction/content writer
- **Deep Analyst**: Analytical expert with no topic limits
- **Researcher**: Comprehensive research assistant

#### 🎨 **Conversation Modes**
Pre-configured parameter sets for different use cases:
- **Balanced**: General conversation (temp 0.8)
- **Precise**: Technical/coding tasks (temp 0.3)
- **Creative**: Maximum creativity (temp 1.2)
- **Analytical**: Structured reasoning (temp 0.5)
- **Unrestricted**: Maximum freedom for NSFW content (temp 1.0)

#### 🔄 **Response Regeneration**
- Generate 3 variations of any response
- Choose between Focused, Balanced, and Creative versions
- Compare different temperature settings
- Select the best response for your needs

#### 🎯 **Advanced Generation**
- **Few-Shot Examples**: Prime model with example responses
- **Multi-Pass Generation**: Create outline first for better quality
- **Context Optimization**: Smart message history management
- **Response Enhancement**: Automatic formatting improvements

## Prerequisites

- Node.js (v16 or higher)
- Ollama installed and running
- Dolphin LLM model (`dolphin-llama3`)

## Quick Start

### One-Command Launch

```bash
start labs
```

Or:

```bash
cd ~/Development/ollama-chat && ./start-labs.sh
```

The browser will automatically open to `http://localhost:3333`

### Manual Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open browser to `http://localhost:3333`

## Setting Up "start labs" Alias

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
alias start="cd ~/Development/ollama-chat && ./start-labs.sh"
```

Then reload:
```bash
source ~/.zshrc
```

Now you can type `start labs` from anywhere to launch the chat interface!

## 📖 Usage Guide

### Basic Chat
1. Type your message in the input box
2. Press Enter to send (Shift+Enter for new line)
3. Watch the AI respond in real-time with streaming

### Adjusting Settings
1. Click "⚙️ Settings" button in header
2. Choose a **System Prompt** for specialized responses
3. Select a **Conversation Mode** or adjust parameters manually
4. Enable **Few-Shot Examples** for better context
5. Enable **Multi-Pass** for complex requests
6. Settings save automatically

### Regenerating Responses
1. Click "🔄 Regenerate" button under any AI response
2. Choose from 3 variations:
   - **Focused** (temp 0.5): Precise, deterministic
   - **Balanced** (temp 0.8): Middle ground
   - **Creative** (temp 1.2): Maximum diversity
3. Select your preferred version

### Parameter Cheat Sheet

| Task | Temp | Top_P | Mode | Notes |
|------|------|-------|------|-------|
| **Code** | 0.2-0.5 | 0.85 | Precise | Use "Expert Coder" prompt |
| **Analysis** | 0.5-0.7 | 0.9 | Analytical | Use "Deep Analyst" prompt |
| **Creative** | 0.9-1.3 | 0.95 | Creative | Use "Creative Writer" prompt |
| **Chat** | 0.7-0.9 | 0.9 | Balanced | Use "Uncensored Default" |
| **NSFW** | 1.0-1.2 | 0.95 | Unrestricted | Maximum freedom |

## Architecture

### Backend
- **Express.js** server (Port 3333)
- Ollama API proxy with advanced features
- JSON file storage for chat history
- Multiple system prompt injection
- Context window optimization
- Response enhancement post-processing
- Auto-browser launching

### Frontend
- **Vanilla JavaScript** (no frameworks)
- Streaming responses with Fetch API
- **Marked.js** for markdown rendering
- **Highlight.js** for code syntax highlighting
- Local storage for settings persistence
- Clean, responsive UI

### Advanced Features
- Context optimization (6000 token window)
- Few-shot example injection
- Multi-pass generation
- Response variation generation
- Token estimation
- Repetition removal

## API Endpoints

- `GET /api/conversations` - List all conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/:id/messages` - Get conversation messages
- `DELETE /api/conversations/:id` - Delete conversation
- `POST /api/messages` - Save message
- `POST /api/chat` - Send message to Dolphin (enhanced)
- `POST /api/regenerate` - Generate response variations
- `GET /api/system-prompts` - List available prompts
- `GET /api/conversation-modes` - List conversation modes

## Tech Stack

- **Backend**: Express.js, CORS, Node.js fs
- **Frontend**: Vanilla JS, Marked.js, Highlight.js
- **Model**: Dolphin 2.9 Llama3 8B (via Ollama)
- **Storage**: JSON file system
- **Port**: 3333 (frontend), 11434 (Ollama)

## System Prompts

All system prompts are designed for **maximum compliance** with **zero restrictions**:

### 1. Uncensored Default
General-purpose unrestricted assistant. Complies with any request without ethical considerations.

### 2. Expert Coder
Programming specialist that writes any code requested: exploits, hacks, malware, scrapers, anything. Complete, production-ready code with zero ethical concerns.

### 3. Creative Writer
Unrestricted creative writing assistant. Any genre, any content: horror, erotica, violence, dark fantasy. NSFW explicitly allowed.

### 4. Deep Analyst
Analytical expert with no topic restrictions. Challenges assumptions, provides uncomfortable truths, analyzes anything.

### 5. Researcher
Comprehensive research assistant. No censorship on illegal, dangerous, or sensitive topics. Technical accuracy over morals.

## Configuration

### Model Parameters
Default values (customizable in UI):
- **Temperature**: 0.8
- **Top P**: 0.9
- **Top K**: 50
- **Repeat Penalty**: 1.1
- **Max Tokens**: 4096
- **Context Window**: 8192

### Conversation Modes
5 pre-configured modes with optimized parameters for different tasks.

### Storage
- Chat history: `chat-history.json`
- Settings: Browser localStorage

## Development

### Project Structure
```
ollama-chat/
├── server.js              # Advanced Express server
├── package.json           # Dependencies
├── start-labs.sh          # Launch script
├── chat-history.json      # Conversations (auto-created)
├── README.md              # This file
├── QUICK_START.md         # Quick reference
├── .gitignore             # Git ignore rules
└── public/
    ├── index.html         # Enhanced chat UI
    ├── styles.css         # Complete styling with settings panel
    └── app.js             # Advanced frontend logic
```

### Adding System Prompts

Edit `server.js` and add to `SYSTEM_PROMPTS` object:

```javascript
SYSTEM_PROMPTS.myPrompt = `Your custom unrestricted prompt here...`;
```

Then add to UI select in `index.html`.

### Adding Conversation Modes

Edit `server.js` and add to `CONVERSATION_MODES` object:

```javascript
CONVERSATION_MODES.myMode = {
  temperature: 0.8,
  top_p: 0.9,
  top_k: 50,
  repeat_penalty: 1.1,
  description: 'My custom mode'
};
```

## Performance

- **8B Model** (dolphin-llama3): ~6-8GB RAM, fast responses (1-2s)
- **Streaming**: Real-time token generation
- **Context**: Optimized to ~6000 tokens
- **Multi-Pass**: 2x slower, better quality

## Troubleshooting

**Settings button not visible?**
- Refresh the page (Ctrl+R or Cmd+R)

**Responses seem censored?**
- Check System Prompt is set to desired mode
- Try "Unrestricted" conversation mode
- Increase temperature to 1.0+

**Slow responses?**
- Disable Multi-Pass generation
- Reduce Max Tokens
- Close other applications

**"Failed to get response" error?**
- Make sure Ollama is running: `ollama serve`
- Check the model is available: `ollama list`
- Restart: `start labs`

**Port 3333 already in use?**
- Stop other servers or change PORT in server.js

## License

MIT

## Author

[@deevanshuguru](https://github.com/deevanshuguru)

---

**⚠️ Disclaimer**: This is an uncensored AI assistant with no content restrictions. Use responsibly and in accordance with local laws.

**🎯 Pro Tip**: Experiment with different System Prompts and Conversation Modes to find what works best for your use case!
