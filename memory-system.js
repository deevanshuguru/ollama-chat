// ============================================
// MEMORY & KNOWLEDGE SYSTEM
// ============================================

const { ChromaClient } = require('chromadb');
const { v4: uuidv4 } = require('uuid');

class MemorySystem {
  constructor() {
    this.client = null;
    this.collection = null;
    this.initialized = false;
    this.ollamaUrl = 'http://localhost:11434';
  }

  async initialize() {
    try {
      // Connect to ChromaDB
      this.client = new ChromaClient();

      // Get or create collection
      this.collection = await this.client.getOrCreateCollection({
        name: 'conversation_memory',
        metadata: {
          description: 'Persistent memory for Local AI Labs',
          hnsw_space: 'cosine'
        }
      });

      this.initialized = true;
      console.log('✅ Memory system initialized');
      return true;
    } catch (error) {
      console.error('❌ Memory system initialization failed:', error.message);
      this.initialized = false;
      return false;
    }
  }

  // Generate embeddings using Ollama
  async generateEmbedding(text) {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'nomic-embed-text', // Lightweight embedding model
          prompt: text
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama embeddings failed: ${response.status}`);
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      console.error('Embedding generation failed:', error.message);
      // Return null to indicate failure, caller should handle
      return null;
    }
  }

  // Store a memory
  async store(text, metadata = {}) {
    if (!this.initialized) {
      console.log('Memory system not initialized');
      return false;
    }

    try {
      const embedding = await this.generateEmbedding(text);

      if (!embedding) {
        console.log('Skipping memory storage - embedding failed');
        return false;
      }

      const id = uuidv4();

      await this.collection.add({
        ids: [id],
        embeddings: [embedding],
        documents: [text],
        metadatas: [{
          ...metadata,
          timestamp: Date.now(),
          id: id
        }]
      });

      return true;
    } catch (error) {
      console.error('Memory storage failed:', error.message);
      return false;
    }
  }

  // Search memories by semantic similarity
  async search(query, limit = 5) {
    if (!this.initialized) {
      return [];
    }

    try {
      const queryEmbedding = await this.generateEmbedding(query);

      if (!queryEmbedding) {
        return [];
      }

      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit
      });

      // Format results
      if (!results || !results.documents || results.documents.length === 0) {
        return [];
      }

      const memories = [];
      const documents = results.documents[0];
      const metadatas = results.metadatas ? results.metadatas[0] : [];
      const distances = results.distances ? results.distances[0] : [];

      for (let i = 0; i < documents.length; i++) {
        memories.push({
          text: documents[i],
          metadata: metadatas[i] || {},
          similarity: distances[i] !== undefined ? (1 - distances[i]) : 0,
          relevance_score: distances[i] !== undefined ? (1 - distances[i]) * 100 : 0
        });
      }

      return memories;
    } catch (error) {
      console.error('Memory search failed:', error.message);
      return [];
    }
  }

  // Get relevant context for a conversation
  async getRelevantContext(query, limit = 3) {
    const memories = await this.search(query, limit);

    if (memories.length === 0) {
      return null;
    }

    // Filter by relevance threshold (50% similarity)
    const relevant = memories.filter(m => m.relevance_score > 50);

    if (relevant.length === 0) {
      return null;
    }

    // Format context string
    const contextParts = relevant.map((mem, i) => {
      const timeAgo = this.formatTimeAgo(mem.metadata.timestamp);
      return `[Memory ${i + 1} from ${timeAgo}]:\n${mem.text}`;
    });

    return contextParts.join('\n\n');
  }

  // Extract facts from conversation
  async extractFacts(conversation) {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'dolphin-llama3',
          messages: [
            {
              role: 'system',
              content: `Extract key facts, preferences, and important information from this conversation.
Return ONLY a JSON array of facts, each with "fact" and "category" fields.
Categories: personal, technical, preference, project, general.
Example: [{"fact": "User prefers Python", "category": "preference"}]`
            },
            {
              role: 'user',
              content: conversation
            }
          ],
          stream: false,
          options: { temperature: 0.3 }
        })
      });

      const data = await response.json();
      const content = data.message.content;

      // Try to parse JSON
      try {
        const facts = JSON.parse(content);
        if (Array.isArray(facts)) {
          return facts;
        }
      } catch (e) {
        // If not valid JSON, try to extract from text
        console.log('Facts not in JSON format, extracting from text');
      }

      return [];
    } catch (error) {
      console.error('Fact extraction failed:', error.message);
      return [];
    }
  }

  // Store conversation summary
  async storeConversationSummary(messages, conversationId) {
    if (!this.initialized || messages.length < 2) {
      return;
    }

    // Create conversation text
    const conversationText = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    // Store the conversation
    await this.store(conversationText, {
      type: 'conversation',
      conversation_id: conversationId,
      message_count: messages.length
    });

    // Extract and store facts
    const facts = await this.extractFacts(conversationText);

    for (const factObj of facts) {
      await this.store(factObj.fact, {
        type: 'fact',
        category: factObj.category || 'general',
        conversation_id: conversationId
      });
    }
  }

  // Get memory statistics
  async getStats() {
    if (!this.initialized) {
      return { total: 0, by_type: {} };
    }

    try {
      const count = await this.collection.count();

      return {
        total: count,
        status: 'active',
        collection: 'conversation_memory'
      };
    } catch (error) {
      return { total: 0, status: 'error' };
    }
  }

  // Format time ago
  formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  // Clear all memories (dangerous!)
  async clearAll() {
    if (!this.initialized) {
      return false;
    }

    try {
      await this.client.deleteCollection({ name: 'conversation_memory' });
      await this.initialize(); // Recreate collection
      return true;
    } catch (error) {
      console.error('Clear memories failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance
const memorySystem = new MemorySystem();

module.exports = memorySystem;
