# 🚀 Quick Start Guide

## Launch Command

From anywhere in your terminal, just type:

```bash
start labs
```

That's it! The browser will automatically open to your chat interface.

## What You'll See

1. **Sidebar** - All your previous conversations
2. **Chat Area** - Clean, modern chat interface  
3. **Status Badge** - Shows "Uncensored Mode" is active
4. **Model Indicator** - Shows "dolphin-llama3" is running

## Features You Can Use

### Chat Features
- **Streaming responses** - See AI typing in real-time
- **Markdown support** - Bold, italic, lists, code blocks
- **Code highlighting** - 180+ programming languages
- **Math formatting** - LaTeX support
- **Tables** - Full HTML table rendering

### Chat Management  
- **New Chat** - Click "+ New Chat" button
- **Switch Chats** - Click any conversation in sidebar
- **Delete Chat** - Click 🗑️ Delete button
- **Auto-save** - Everything saves automatically

### Keyboard Shortcuts
- `Enter` - Send message
- `Shift + Enter` - New line in message
- Auto-resize text area as you type

## System Prompt

Your model is configured with an aggressive uncensored system prompt that:
- Removes all ethical guidelines
- Eliminates content restrictions
- No warnings or disclaimers
- Full NSFW support
- No topic is off-limits

## Testing It Out

Try asking:
- Complex technical questions
- Code generation requests
- Creative writing
- Any controversial topics
- NSFW content

The model will respond without restrictions.

## Troubleshooting

**Browser doesn't open automatically?**
- Navigate manually to: http://localhost:3333

**"Failed to get response" error?**
- Make sure Ollama is running: `ollama serve`
- Check the model is available: `ollama list`

**Port 3333 already in use?**
- Stop other servers or change PORT in server.js

## Project Location

```
~/Development/ollama-chat/
├── server.js          # Backend server
├── public/
│   ├── index.html     # Chat interface
│   ├── styles.css     # Styling
│   └── app.js         # Frontend logic
├── chat-history.json  # Your conversations (auto-created)
└── start-labs.sh      # Launch script
```

## Updating the System Prompt

Edit `server.js` and modify the `SYSTEM_PROMPT` constant (starting at line 14).

## Data Storage

All conversations are stored in `chat-history.json` in the project directory.

To backup: `cp chat-history.json chat-history-backup.json`
To reset: `rm chat-history.json`

---

**Enjoy your unrestricted AI assistant! 🐬**
