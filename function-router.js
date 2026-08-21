// ============================================
// INTELLIGENT FUNCTION CALLING ROUTER
// AI automatically detects and executes tools
// ============================================

const AVAILABLE_FUNCTIONS = {
  terminal: {
    name: 'terminal',
    description: 'Execute shell commands on the user\'s computer. Use for: checking processes, listing files, system info, running commands.',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The shell command to execute (e.g., "ls -la", "ps aux", "cat file.txt")'
        }
      },
      required: ['command']
    }
  },

  browse: {
    name: 'browse',
    description: 'Fetch and read content from any web page. Use for: reading articles, documentation, getting web content.',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The full URL to browse (e.g., "https://example.com")'
        }
      },
      required: ['url']
    }
  },

  search: {
    name: 'search',
    description: 'Search the internet using DuckDuckGo. Use for: finding information, researching topics, looking up facts.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query (e.g., "python async programming tutorial")'
        }
      },
      required: ['query']
    }
  },

  file_read: {
    name: 'file_read',
    description: 'Read contents of a file. Use for: viewing file contents, analyzing data, reading configs.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Full file path (e.g., "/Users/username/Documents/file.txt")'
        }
      },
      required: ['path']
    }
  },

  file_list: {
    name: 'file_list',
    description: 'List files in a directory. Use for: browsing folders, finding files, exploring directories.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Full directory path (e.g., "/Users/username/Documents")'
        }
      },
      required: ['path']
    }
  },

  execute: {
    name: 'execute',
    description: 'Execute code in JavaScript, Python, or Bash. Use for: calculations, data processing, testing code.',
    parameters: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The code to execute'
        },
        language: {
          type: 'string',
          enum: ['javascript', 'python', 'bash'],
          description: 'Programming language'
        }
      },
      required: ['code', 'language']
    }
  },

  memory_search: {
    name: 'memory_search',
    description: 'Search past conversations and stored memories. Use for: recalling information, finding previous discussions.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'What to search for in memories'
        },
        limit: {
          type: 'number',
          description: 'Number of results (default 5)'
        }
      },
      required: ['query']
    }
  }
};

class FunctionRouter {
  constructor(ollamaUrl = 'http://localhost:11434') {
    this.ollamaUrl = ollamaUrl;
    this.toolExecutors = {};
  }

  // Register tool executor functions
  registerExecutor(toolName, executorFn) {
    this.toolExecutors[toolName] = executorFn;
  }

  // Get function definitions for Ollama
  getFunctionDefinitions() {
    return Object.values(AVAILABLE_FUNCTIONS);
  }

  // Analyze user message and determine if tools are needed
  async analyzeAndRoute(userMessage, conversationHistory = []) {
    try {
      // Build system prompt with function descriptions
      const functionsDesc = Object.values(AVAILABLE_FUNCTIONS)
        .map(f => `- ${f.name}: ${f.description}`)
        .join('\n');

      const systemPrompt = `You are an AI assistant with access to these tools:

${functionsDesc}

When the user asks something that requires using a tool:
1. Identify which tool(s) to use
2. Extract the parameters needed
3. Respond with a JSON object in this EXACT format:
{
  "needs_tool": true,
  "tool": "tool_name",
  "params": {
    "param1": "value1"
  },
  "reasoning": "Why you're using this tool"
}

If no tool is needed, respond with:
{
  "needs_tool": false,
  "response": "Your natural language response"
}

Examples:
User: "What files are in my Downloads folder?"
Response: {"needs_tool": true, "tool": "file_list", "params": {"path": "~/Downloads"}, "reasoning": "User wants to see files in Downloads"}

User: "Search for nodejs tutorials"
Response: {"needs_tool": true, "tool": "search", "params": {"query": "nodejs tutorials"}, "reasoning": "User wants to search the internet"}

User: "Hello, how are you?"
Response: {"needs_tool": false, "response": "Hello! I'm doing well. How can I help you today?"}

IMPORTANT: Always respond with valid JSON only, no other text.`;

      // Call Ollama to analyze
      const response = await fetch(`${this.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'dolphin-llama3',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.slice(-4), // Last 4 messages for context
            { role: 'user', content: userMessage }
          ],
          stream: false,
          options: {
            temperature: 0.3, // Low temperature for structured output
            num_predict: 500
          }
        })
      });

      const data = await response.json();
      const content = data.message.content.trim();

      // Try to extract JSON from response
      let jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // If no JSON found, assume no tool needed
        return {
          needs_tool: false,
          response: content
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (parsed.needs_tool && this.toolExecutors[parsed.tool]) {
        // Execute the tool
        const toolResult = await this.toolExecutors[parsed.tool](parsed.params);

        return {
          needs_tool: true,
          tool: parsed.tool,
          params: parsed.params,
          reasoning: parsed.reasoning,
          result: toolResult
        };
      }

      return parsed;

    } catch (error) {
      console.error('Function routing error:', error);
      return {
        needs_tool: false,
        response: null,
        error: error.message
      };
    }
  }

  // Execute tool and get natural language response
  async executeWithResponse(userMessage, toolExecution) {
    try {
      const systemPrompt = `You just used the ${toolExecution.tool} tool and got this result:

${JSON.stringify(toolExecution.result, null, 2)}

Now respond naturally to the user's question: "${userMessage}"

Provide a helpful, natural language response based on the tool result.
Do not mention JSON or tool execution - just answer naturally.`;

      const response = await fetch(`${this.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'dolphin-llama3',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          stream: false,
          options: { temperature: 0.7 }
        })
      });

      const data = await response.json();
      return data.message.content;

    } catch (error) {
      console.error('Response generation error:', error);
      return `I used ${toolExecution.tool} but encountered an error generating a response: ${error.message}`;
    }
  }
}

module.exports = FunctionRouter;
