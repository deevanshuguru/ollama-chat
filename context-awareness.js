// ============================================
// SMART CONTEXT AWARENESS ENGINE
// AI understands screen context and provides proactive help
// ============================================

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Try to load tesseract.js if available
let tesseract;
try {
  tesseract = require('tesseract.js');
} catch (e) {
  console.log('⚠️  tesseract.js not installed (OCR unavailable)');
}

class ContextAwarenessEngine {
  constructor() {
    this.enabled = false;
    this.lastCapture = null;
    this.captureHistory = [];
    this.maxHistory = 10;
    this.tesseractWorker = null;
    this.contextCache = new Map();
    this.ocrAvailable = !!tesseract;
    this.patterns = {
      error: /error|exception|failed|cannot|undefined|null reference/i,
      code: /function|const|let|var|class|import|export/i,
      terminal: /\$|\>|bash|zsh|command/i,
      browser: /http|www\.|\.com|\.org|chrome|firefox/i,
      editor: /\.js|\.py|\.ts|\.jsx|\.tsx|\.css|\.html/i
    };
  }

  // Initialize the engine
  async initialize() {
    console.log('🧠 Initializing Smart Context Awareness...');

    if (this.ocrAvailable && tesseract) {
      try {
        // Initialize Tesseract for OCR
        this.tesseractWorker = await tesseract.createWorker('eng');
        console.log('✅ OCR engine ready');
      } catch (error) {
        console.log('⚠️  OCR unavailable:', error.message);
        this.ocrAvailable = false;
      }
    } else {
      console.log('⚠️  OCR unavailable (install: npm install tesseract.js)');
    }

    console.log('✅ Context Awareness ready (screen capture enabled)');
  }

  // Enable/disable context awareness
  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) {
      console.log('🧠 Context awareness ENABLED');
    } else {
      console.log('💤 Context awareness DISABLED');
    }
  }

  // Capture screen
  async captureScreen(options = {}) {
    const { region, window: windowCapture } = options;

    return new Promise((resolve, reject) => {
      const timestamp = Date.now();
      const filename = `capture_${timestamp}.png`;
      const filepath = path.join('/tmp', filename);

      let command;

      if (process.platform === 'darwin') {
        // macOS screenshot
        if (region) {
          command = `screencapture -R${region} ${filepath}`;
        } else if (windowCapture) {
          command = `screencapture -w ${filepath}`;
        } else {
          command = `screencapture ${filepath}`;
        }
      } else if (process.platform === 'linux') {
        // Linux screenshot (requires scrot or gnome-screenshot)
        command = `scrot ${filepath}`;
      } else if (process.platform === 'win32') {
        // Windows screenshot (requires nircmd or similar)
        command = `nircmd.exe savescreenshot ${filepath}`;
      } else {
        return reject(new Error('Unsupported platform'));
      }

      exec(command, { timeout: 5000 }, async (error, stdout, stderr) => {
        if (error) {
          return reject(new Error(`Screenshot failed: ${error.message}`));
        }

        if (!fs.existsSync(filepath)) {
          return reject(new Error('Screenshot file not created'));
        }

        const stats = fs.statSync(filepath);

        const capture = {
          timestamp,
          filename,
          filepath,
          size: stats.size,
          region,
          window: windowCapture
        };

        this.lastCapture = capture;
        this.captureHistory.push(capture);

        // Keep only last N captures
        if (this.captureHistory.length > this.maxHistory) {
          const removed = this.captureHistory.shift();
          if (fs.existsSync(removed.filepath)) {
            fs.unlinkSync(removed.filepath);
          }
        }

        resolve(capture);
      });
    });
  }

  // Extract text from image using OCR
  async extractText(imagePath) {
    if (!this.ocrAvailable || !this.tesseractWorker) {
      // Return empty result if OCR not available
      return {
        text: '',
        confidence: 0,
        success: false,
        error: 'OCR not available'
      };
    }

    try {
      const { data: { text, confidence } } = await this.tesseractWorker.recognize(imagePath);

      return {
        text: text.trim(),
        confidence,
        success: true
      };
    } catch (error) {
      return {
        text: '',
        confidence: 0,
        success: false,
        error: error.message
      };
    }
  }

  // Analyze context from captured screen
  async analyzeContext(capture) {
    if (!capture) {
      capture = this.lastCapture;
    }

    if (!capture) {
      throw new Error('No capture available to analyze');
    }

    const analysis = {
      timestamp: Date.now(),
      capture: capture.filename,
      context: {
        type: 'unknown',
        confidence: 0,
        details: {}
      },
      text: null,
      suggestions: []
    };

    try {
      // Extract text via OCR
      const ocrResult = await this.extractText(capture.filepath);
      analysis.text = ocrResult.text;

      // Detect context type
      const contextType = this.detectContextType(ocrResult.text);
      analysis.context = contextType;

      // Generate suggestions
      const suggestions = this.generateSuggestions(contextType, ocrResult.text);
      analysis.suggestions = suggestions;

      // Cache analysis
      this.contextCache.set(capture.filename, analysis);

      return analysis;
    } catch (error) {
      analysis.error = error.message;
      return analysis;
    }
  }

  // Detect what the user is doing based on screen content
  detectContextType(text) {
    const scores = {
      coding: 0,
      terminal: 0,
      browser: 0,
      error: 0,
      reading: 0,
      other: 0
    };

    // Check for error messages
    if (this.patterns.error.test(text)) {
      scores.error = 10;
    }

    // Check for code
    if (this.patterns.code.test(text)) {
      scores.coding += 5;
    }

    // Check for terminal
    if (this.patterns.terminal.test(text)) {
      scores.terminal += 5;
    }

    // Check for browser/web
    if (this.patterns.browser.test(text)) {
      scores.browser += 5;
    }

    // Check for file extensions
    if (this.patterns.editor.test(text)) {
      scores.coding += 3;
    }

    // Check text length (reading)
    if (text.length > 500 && text.split('\n').length > 10) {
      scores.reading += 3;
    }

    // Find highest score
    let maxScore = 0;
    let contextType = 'other';

    Object.entries(scores).forEach(([type, score]) => {
      if (score > maxScore) {
        maxScore = score;
        contextType = type;
      }
    });

    return {
      type: contextType,
      confidence: Math.min(maxScore * 10, 100),
      details: scores
    };
  }

  // Generate suggestions based on context
  generateSuggestions(contextType, text) {
    const suggestions = [];

    switch (contextType.type) {
      case 'error':
        suggestions.push({
          type: 'help',
          priority: 'high',
          message: 'I detected an error. Would you like me to help debug it?',
          action: 'debug_error',
          data: { error: this.extractError(text) }
        });
        break;

      case 'coding':
        suggestions.push({
          type: 'help',
          priority: 'medium',
          message: 'I see you\'re coding. Need help with syntax, debugging, or documentation?',
          action: 'code_assist'
        });
        break;

      case 'terminal':
        suggestions.push({
          type: 'help',
          priority: 'medium',
          message: 'Working in terminal. Need help with commands or scripts?',
          action: 'terminal_assist'
        });
        break;

      case 'browser':
        suggestions.push({
          type: 'help',
          priority: 'low',
          message: 'Browsing the web. Would you like me to search or summarize?',
          action: 'web_assist'
        });
        break;

      case 'reading':
        suggestions.push({
          type: 'help',
          priority: 'low',
          message: 'Reading content. Want a summary or have questions?',
          action: 'reading_assist'
        });
        break;
    }

    // Check for specific patterns
    if (text.includes('TODO') || text.includes('FIXME')) {
      suggestions.push({
        type: 'task',
        priority: 'medium',
        message: 'I found TODO/FIXME comments. Would you like me to track them?',
        action: 'track_todos'
      });
    }

    if (text.includes('npm install') || text.includes('pip install')) {
      suggestions.push({
        type: 'info',
        priority: 'low',
        message: 'Installing dependencies. I can explain what they do.',
        action: 'explain_dependencies'
      });
    }

    return suggestions;
  }

  // Extract error message from text
  extractError(text) {
    const lines = text.split('\n');
    const errorLines = [];

    for (const line of lines) {
      if (this.patterns.error.test(line)) {
        errorLines.push(line.trim());
      }
    }

    return errorLines.join('\n');
  }

  // Compare two captures to detect changes
  compareCaptures(capture1, capture2) {
    if (!capture1 || !capture2) {
      return { changed: false, changes: [] };
    }

    const analysis1 = this.contextCache.get(capture1.filename);
    const analysis2 = this.contextCache.get(capture2.filename);

    if (!analysis1 || !analysis2) {
      return { changed: false, changes: [] };
    }

    const changes = [];

    // Check context change
    if (analysis1.context.type !== analysis2.context.type) {
      changes.push({
        type: 'context_switch',
        from: analysis1.context.type,
        to: analysis2.context.type,
        message: `Switched from ${analysis1.context.type} to ${analysis2.context.type}`
      });
    }

    // Check for new errors
    if (analysis2.context.type === 'error' && analysis1.context.type !== 'error') {
      changes.push({
        type: 'error_appeared',
        message: 'New error detected',
        error: this.extractError(analysis2.text)
      });
    }

    return {
      changed: changes.length > 0,
      changes
    };
  }

  // Auto-context mode (periodic capture and analysis)
  async startAutoContext(interval = 30000) {
    if (this.autoContextInterval) {
      clearInterval(this.autoContextInterval);
    }

    this.enabled = true;

    this.autoContextInterval = setInterval(async () => {
      if (!this.enabled) return;

      try {
        const capture = await this.captureScreen();
        const analysis = await this.analyzeContext(capture);

        // Compare with previous
        if (this.captureHistory.length > 1) {
          const previous = this.captureHistory[this.captureHistory.length - 2];
          const changes = this.compareCaptures(previous, capture);

          if (changes.changed) {
            console.log('🧠 Context changed:', changes.changes);
            // Emit event or callback here
          }
        }

        console.log('🧠 Auto-context:', analysis.context.type, `(${analysis.context.confidence}%)`);
      } catch (error) {
        console.error('Context error:', error.message);
      }
    }, interval);

    console.log(`🧠 Auto-context started (every ${interval/1000}s)`);
  }

  // Stop auto-context mode
  stopAutoContext() {
    if (this.autoContextInterval) {
      clearInterval(this.autoContextInterval);
      this.autoContextInterval = null;
      console.log('💤 Auto-context stopped');
    }
  }

  // Get recent context history
  getHistory(limit = 5) {
    return this.captureHistory.slice(-limit).map(capture => {
      const analysis = this.contextCache.get(capture.filename);
      return {
        timestamp: capture.timestamp,
        context: analysis?.context.type || 'unknown',
        suggestions: analysis?.suggestions.length || 0
      };
    });
  }

  // Cleanup
  async cleanup() {
    // Stop auto-context
    this.stopAutoContext();

    // Terminate Tesseract worker
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
    }

    // Delete capture files
    this.captureHistory.forEach(capture => {
      if (fs.existsSync(capture.filepath)) {
        fs.unlinkSync(capture.filepath);
      }
    });

    console.log('✅ Context awareness cleaned up');
  }
}

module.exports = ContextAwarenessEngine;
