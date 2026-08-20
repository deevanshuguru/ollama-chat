// ============================================
// VOICE INTERFACE - Speech Recognition & Synthesis
// ============================================

// Check for browser support
const hasVoiceSupport = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
const hasSpeechSynthesis = 'speechSynthesis' in window;

let recognition = null;
let isListening = false;
let isSpeaking = false;
let voiceEnabled = localStorage.getItem('voice-enabled') === 'true';
let autoSpeak = localStorage.getItem('auto-speak') === 'true';

// Initialize voice recognition
function initializeVoice() {
  if (!hasVoiceSupport) {
    console.log('Voice recognition not supported in this browser');
    return false;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    isListening = true;
    updateVoiceButton();
    showVoiceIndicator('Listening...');
  };

  recognition.onend = () => {
    isListening = false;
    updateVoiceButton();
    hideVoiceIndicator();
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(result => result[0].transcript)
      .join('');

    if (event.results[0].isFinal) {
      userInput.value = transcript;
      userInput.style.height = 'auto';
      userInput.style.height = userInput.scrollHeight + 'px';
      userInput.focus();

      // Auto-send if enabled
      if (localStorage.getItem('voice-auto-send') === 'true') {
        sendMessage();
      }
    } else {
      // Show interim results
      showVoiceIndicator(`Listening: ${transcript}`);
    }
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    isListening = false;
    updateVoiceButton();
    hideVoiceIndicator();

    if (event.error !== 'no-speech' && event.error !== 'aborted') {
      showToast(`Voice error: ${event.error}`, 3000);
    }
  };

  return true;
}

// Toggle voice recognition
function toggleVoiceRecognition() {
  if (!recognition) {
    if (!initializeVoice()) {
      showToast('Voice recognition not available', 3000);
      return;
    }
  }

  if (isListening) {
    recognition.stop();
  } else {
    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      showToast('Voice recognition failed to start', 3000);
    }
  }
}

// Speak text using speech synthesis
function speak(text, options = {}) {
  if (!hasSpeechSynthesis) {
    console.log('Speech synthesis not supported');
    return;
  }

  // Stop any ongoing speech
  if (isSpeaking) {
    speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);

  // Configure voice
  utterance.rate = options.rate || 1.0;
  utterance.pitch = options.pitch || 1.0;
  utterance.volume = options.volume || 1.0;
  utterance.lang = options.lang || 'en-US';

  // Try to use a natural-sounding voice
  const voices = speechSynthesis.getVoices();
  const preferredVoice = voices.find(v =>
    v.lang.startsWith('en') &&
    (v.name.includes('Natural') || v.name.includes('Premium') || v.name.includes('Enhanced'))
  ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.onstart = () => {
    isSpeaking = true;
    updateSpeakButton();
  };

  utterance.onend = () => {
    isSpeaking = false;
    updateSpeakButton();
  };

  utterance.onerror = (event) => {
    console.error('Speech synthesis error:', event.error);
    isSpeaking = false;
    updateSpeakButton();
  };

  speechSynthesis.speak(utterance);
}

// Stop speaking
function stopSpeaking() {
  if (hasSpeechSynthesis && isSpeaking) {
    speechSynthesis.cancel();
    isSpeaking = false;
    updateSpeakButton();
  }
}

// Show voice indicator
function showVoiceIndicator(text) {
  let indicator = document.getElementById('voice-indicator');

  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'voice-indicator';
    indicator.className = 'voice-indicator';
    document.body.appendChild(indicator);
  }

  indicator.textContent = text;
  indicator.classList.add('active');
}

// Hide voice indicator
function hideVoiceIndicator() {
  const indicator = document.getElementById('voice-indicator');
  if (indicator) {
    indicator.classList.remove('active');
  }
}

// Update voice button state
function updateVoiceButton() {
  const voiceBtn = document.getElementById('voice-btn');
  if (voiceBtn) {
    if (isListening) {
      voiceBtn.classList.add('listening');
      voiceBtn.innerHTML = '🔴';
      voiceBtn.title = 'Stop listening';
    } else {
      voiceBtn.classList.remove('listening');
      voiceBtn.innerHTML = '🎤';
      voiceBtn.title = 'Voice input (Click to speak)';
    }
  }
}

// Update speak button state
function updateSpeakButton() {
  const speakBtn = document.getElementById('speak-btn');
  if (speakBtn) {
    if (isSpeaking) {
      speakBtn.classList.add('speaking');
      speakBtn.innerHTML = '🔇';
      speakBtn.title = 'Stop speaking';
    } else {
      speakBtn.classList.remove('speaking');
      speakBtn.innerHTML = '🔊';
      speakBtn.title = 'Toggle auto-speak';
    }
  }
}

// Toggle auto-speak
function toggleAutoSpeak() {
  if (isSpeaking) {
    stopSpeaking();
    return;
  }

  autoSpeak = !autoSpeak;
  localStorage.setItem('auto-speak', autoSpeak);

  const speakBtn = document.getElementById('speak-btn');
  if (speakBtn) {
    if (autoSpeak) {
      speakBtn.classList.add('active');
      showToast('🔊 Auto-speak enabled', 2000);
    } else {
      speakBtn.classList.remove('active');
      showToast('🔇 Auto-speak disabled', 2000);
    }
  }
}

// Speak last assistant message
function speakLastMessage() {
  const messages = document.querySelectorAll('.message-assistant .message-content');
  if (messages.length === 0) return;

  const lastMessage = messages[messages.length - 1];
  let text = lastMessage.textContent.trim();

  // Clean up text for speaking
  text = text
    .replace(/```[\s\S]*?```/g, 'code block') // Replace code blocks
    .replace(/`([^`]+)`/g, '$1') // Remove inline code markers
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert links to text
    .replace(/#{1,6}\s/g, '') // Remove markdown headers
    .replace(/\*\*([^\*]+)\*\*/g, '$1') // Remove bold markers
    .replace(/\*([^\*]+)\*/g, '$1') // Remove italic markers
    .slice(0, 1000); // Limit length

  if (text) {
    speak(text);
  }
}

// Auto-speak when assistant responds (if enabled)
function autoSpeakResponse() {
  if (autoSpeak && hasSpeechSynthesis) {
    // Wait a bit for the message to fully render
    setTimeout(() => {
      speakLastMessage();
    }, 500);
  }
}

// Create voice controls UI
function createVoiceControls() {
  const inputContainer = document.querySelector('.input-container');
  if (!inputContainer) return;

  // Check if buttons already exist
  if (document.getElementById('voice-btn')) return;

  const sendBtn = document.getElementById('send-btn');

  // Voice input button
  const voiceBtn = document.createElement('button');
  voiceBtn.id = 'voice-btn';
  voiceBtn.className = 'voice-btn';
  voiceBtn.innerHTML = '🎤';
  voiceBtn.title = 'Voice input (Click to speak)';
  voiceBtn.onclick = toggleVoiceRecognition;

  // Speak button
  const speakBtn = document.createElement('button');
  speakBtn.id = 'speak-btn';
  speakBtn.className = 'voice-btn speak-btn';
  speakBtn.innerHTML = '🔊';
  speakBtn.title = 'Toggle auto-speak';
  speakBtn.onclick = toggleAutoSpeak;

  if (autoSpeak) {
    speakBtn.classList.add('active');
  }

  // Insert before send button
  inputContainer.insertBefore(voiceBtn, sendBtn);
  inputContainer.insertBefore(speakBtn, sendBtn);

  // Hide if not supported
  if (!hasVoiceSupport) {
    voiceBtn.style.display = 'none';
  }
  if (!hasSpeechSynthesis) {
    speakBtn.style.display = 'none';
  }
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    createVoiceControls();

    // Load voices (needed for speech synthesis)
    if (hasSpeechSynthesis) {
      speechSynthesis.getVoices();
    }
  });
} else {
  createVoiceControls();

  if (hasSpeechSynthesis) {
    speechSynthesis.getVoices();
  }
}

// Listen for voice availability
if (hasSpeechSynthesis) {
  speechSynthesis.onvoiceschanged = () => {
    speechSynthesis.getVoices();
  };
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Shift + V: Toggle voice input
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
    e.preventDefault();
    toggleVoiceRecognition();
  }

  // Ctrl/Cmd + Shift + S: Speak last message
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
    e.preventDefault();
    speakLastMessage();
  }
});

console.log('🎤 Voice interface loaded', {
  recognition: hasVoiceSupport,
  synthesis: hasSpeechSynthesis
});

// Export functions for use in other scripts
window.voiceInterface = {
  speak,
  stopSpeaking,
  autoSpeakResponse,
  toggleVoiceRecognition,
  speakLastMessage
};
