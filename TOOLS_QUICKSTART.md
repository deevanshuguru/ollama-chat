# 🔧 AI Agent Tools - Quick Start Guide

**Local AI Labs now has REAL POWERS!** 🚀

Your AI can now execute commands, browse the web, and access files!

---

## 🎯 Quick Commands

### 🖥️ Terminal Commands
```
/terminal ls -la
/terminal pwd
/terminal echo "Hello World"
/terminal ps aux | grep node
/terminal cat ~/.zshrc
```

### 🌐 Browse Web Pages
```
/browse https://ollama.com
/browse https://github.com/ollama/ollama
/browse https://news.ycombinator.com
```

### 🔍 Search the Internet
```
/search ollama local llm
/search claude ai assistant
/search python machine learning tutorial
/search nodejs best practices
```

### 📖 Read Files
```
/read ~/Documents/notes.txt
/read ~/Desktop/todo.md
/read ~/.zshrc
```

### 📁 List Directories
```
/list ~/Documents
/list ~/Downloads
/list ~/Desktop
/list ~/Documents/projects
```

---

## 🎨 How It Works

### 1. **Send a Tool Command**

Type a command starting with `/` followed by the tool name:

```
/terminal ls -la
```

### 2. **AI Executes with Safety**

The AI will:
- ✅ Validate the command/path
- ✅ Check safety rules
- ✅ Execute with timeouts
- ✅ Return formatted results

### 3. **View Beautiful Results**

Results appear with:
- 🎨 Color-coded status (✓ success, ✗ error)
- 📋 Copy button
- 🔄 Re-run button (for commands)
- 📄 Collapsible details

---

## 🛡️ Safety Features

### ❌ Blocked Commands (For Your Protection)
- `rm -rf` (destructive delete)
- `sudo` (privilege escalation)
- `chmod 777` (permission issues)
- `dd if=` (disk wipe)
- `mkfs` (format disk)
- `shutdown` / `reboot`

**Why?** These could harm your system. The AI won't execute them!

### ✅ Safe Directories Only
**File access limited to:**
- `~/Documents`
- `~/Downloads`
- `~/Desktop`
- `/tmp`

**Blocked:**
- `/` (root)
- `/etc` (system config)
- `/var` (system data)
- `~/.ssh` (SSH keys)

---

## 💡 Example Workflows

### 1. **Check System Info**
```
You: /terminal uname -a
AI: Shows Darwin kernel version, machine info

You: /terminal ps aux | grep node
AI: Shows running Node processes

You: /terminal df -h
AI: Shows disk usage
```

### 2. **Research a Topic**
```
You: /search ollama features
AI: Shows 10 search results with links

You: /browse https://ollama.com/blog
AI: Fetches and shows blog content

You: Summarize what you found
AI: Analyzes the web content and summarizes
```

### 3. **File Management**
```
You: /list ~/Documents
AI: Shows all files and folders

You: /read ~/Documents/meeting-notes.txt
AI: Displays file content

You: What did we discuss in the meeting?
AI: Analyzes the file content and answers
```

### 4. **Development Workflow**
```
You: /list ~/Documents/my-project
AI: Shows project files

You: /read ~/Documents/my-project/package.json
AI: Shows package.json content

You: /terminal cd ~/Documents/my-project && npm test
AI: Runs tests and shows results

You: What tests failed?
AI: Analyzes test output and explains
```

---

## 🎮 Advanced Usage

### Combine Tools with AI Analysis

**Research + Analysis:**
```
You: /search "best practices for nodejs APIs"
AI: [Shows search results]

You: /browse [first result URL]
AI: [Shows page content]

You: Summarize the key best practices
AI: Analyzes content and provides summary
```

**File + Code Review:**
```
You: /read ~/Documents/my-script.js
AI: [Shows code]

You: Review this code for bugs
AI: Analyzes code and suggests improvements
```

**System + Debugging:**
```
You: /terminal ps aux | grep python
AI: [Shows Python processes]

You: /terminal cat /proc/[PID]/status
AI: [Shows process details]

You: Why is this process using so much memory?
AI: Analyzes process info and explains
```

---

## 🚫 What NOT to Do

### ❌ Don't Try to:
1. **Delete system files**
   ```
   /terminal rm -rf /  ❌ BLOCKED
   ```

2. **Escalate privileges**
   ```
   /terminal sudo rm file.txt  ❌ BLOCKED
   ```

3. **Access sensitive directories**
   ```
   /read ~/.ssh/id_rsa  ❌ BLOCKED
   ```

4. **Run infinite loops**
   ```
   /terminal while true; do echo hi; done  ⏱️ TIMEOUT
   ```

### ✅ Do This Instead:
1. **Delete safely**
   ```
   /terminal rm ~/Downloads/old-file.txt  ✅
   ```

2. **Check permissions**
   ```
   /terminal ls -la ~/Documents  ✅
   ```

3. **Read safe files**
   ```
   /read ~/Documents/notes.txt  ✅
   ```

4. **Use timeouts wisely**
   - Commands timeout at 30 seconds
   - Keep operations quick

---

## 🎯 Tips & Tricks

### 1. **Chain Operations**
```
You: /list ~/Downloads
AI: [Shows files]

You: /read ~/Downloads/data.csv
AI: [Shows CSV content]

You: Parse this data and show me the top 5 entries
AI: Analyzes CSV and creates table
```

### 2. **Use Context**
```
You: /browse https://github.com/ollama/ollama
AI: [Shows GitHub page]

You: What are the main features?
AI: Uses page content to answer

You: How do I install it?
AI: Extracts installation instructions
```

### 3. **Iterate on Commands**
```
You: /terminal ls ~/Documents
AI: [Shows files]

You: /terminal ls -la ~/Documents  [Click Re-run with -la]
AI: [Shows files with details]
```

### 4. **Copy Results**
```
You: /terminal cat ~/.zshrc
AI: [Shows shell config]

You: [Click 📋 Copy]
Clipboard: Full config copied!
```

---

## 📊 Tool Features Comparison

| Tool | Input | Output | Timeout | Size Limit |
|------|-------|--------|---------|------------|
| **Terminal** | Shell command | stdout/stderr | 30s | 10KB display |
| **Browse** | URL | Page text | 10s | 50KB |
| **Search** | Query | 10 results | 10s | - |
| **Read File** | File path | File content | Instant | 100KB display |
| **List Dir** | Directory path | File list | Instant | - |

---

## 🐛 Troubleshooting

### Problem: Command times out
**Solution**: Command takes > 30 seconds
- Break into smaller operations
- Use simpler commands
- Check for infinite loops

### Problem: Path not allowed
**Solution**: File/directory outside safe paths
- Move files to ~/Documents, ~/Downloads, or ~/Desktop
- Or copy them to /tmp temporarily

### Problem: Search returns no results
**Solution**: DuckDuckGo parsing issues
- Try different search terms
- Use /browse with direct URLs instead
- This is being improved

### Problem: Tool output truncated
**Solution**: Output > size limits
- Use more specific commands
- Filter output (e.g., `grep`, `head`, `tail`)
- Process in chunks

---

## 🎊 What's Coming Next

### Phase 2: Memory & Knowledge (Soon!)
- Remember every conversation
- Search your chat history
- Build personal knowledge base
- Context-aware responses

### Phase 3: Advanced Features (Coming!)
- 🎤 Voice input/output
- 💻 Code execution sandbox
- 🔌 Plugin system
- 🎨 Image generation
- 🤖 Multi-model support

---

## 🚀 Get Started Now!

### 1. Start the server:
```bash
start labs
```

### 2. Open in browser:
```
http://localhost:3333
```

### 3. Try your first tool command:
```
/terminal echo "Hello from AI Agent!"
```

### 4. Explore and experiment!
```
/search local ai assistants
/browse https://ollama.com
/list ~/Documents
```

---

## 📝 Notes

- **Safe by Design**: All operations have safety checks
- **Timeout Protected**: Commands can't run forever
- **Path Restricted**: Only safe directories accessible
- **Output Limited**: Large outputs are truncated
- **User Controlled**: You're in charge, AI follows your commands

---

## 🤝 Contributing

Found a bug? Have an idea?
- GitHub: https://github.com/deevanshuguru/ollama-chat
- Open an issue or PR!

---

**Your AI can now DO THINGS in the real world! 🎉**

**Experiment responsibly and have fun!** 🚀
