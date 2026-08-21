// ============================================
// AUTONOMOUS AGENT MODE
// AI chains tools automatically to solve complex tasks
// ============================================

const FunctionRouter = require('./function-router');

class AutonomousAgent {
  constructor(ollamaUrl = 'http://localhost:11434') {
    this.ollamaUrl = ollamaUrl;
    this.router = new FunctionRouter(ollamaUrl);
    this.maxSteps = 10; // Prevent infinite loops
    this.executionHistory = [];
  }

  // Register tool executors
  registerExecutors(executors) {
    Object.entries(executors).forEach(([name, executor]) => {
      this.router.registerExecutor(name, executor);
    });
  }

  // Plan and execute a complex task autonomously
  async executeTask(userGoal, onStep) {
    this.executionHistory = [];
    let currentContext = '';
    let step = 0;

    try {
      // Step 1: Create a plan
      onStep?.({
        step: 0,
        type: 'planning',
        status: 'running',
        message: 'Creating execution plan...'
      });

      const plan = await this.createPlan(userGoal);

      onStep?.({
        step: 0,
        type: 'planning',
        status: 'complete',
        message: 'Plan created',
        plan: plan.steps
      });

      // Step 2: Execute each step
      for (const planStep of plan.steps) {
        step++;

        if (step > this.maxSteps) {
          throw new Error('Maximum steps exceeded');
        }

        onStep?.({
          step,
          type: 'executing',
          status: 'running',
          message: `Executing: ${planStep.description}`,
          action: planStep
        });

        // Execute the step
        const result = await this.executeStep(planStep, currentContext);

        this.executionHistory.push({
          step,
          action: planStep,
          result
        });

        onStep?.({
          step,
          type: 'executing',
          status: result.success ? 'complete' : 'failed',
          message: result.success ? `✓ ${planStep.description}` : `✗ Failed: ${result.error}`,
          result
        });

        if (!result.success) {
          throw new Error(`Step ${step} failed: ${result.error}`);
        }

        // Update context for next step
        currentContext = this.buildContext();

        // Check if goal is achieved
        if (planStep.isGoal) {
          break;
        }
      }

      // Step 3: Synthesize final response
      onStep?.({
        step: step + 1,
        type: 'synthesizing',
        status: 'running',
        message: 'Synthesizing final response...'
      });

      const finalResponse = await this.synthesizeResponse(userGoal, this.executionHistory);

      onStep?.({
        step: step + 1,
        type: 'synthesizing',
        status: 'complete',
        message: 'Task complete!',
        response: finalResponse
      });

      return {
        success: true,
        steps: this.executionHistory,
        response: finalResponse
      };

    } catch (error) {
      onStep?.({
        step,
        type: 'error',
        status: 'failed',
        message: `Error: ${error.message}`
      });

      return {
        success: false,
        error: error.message,
        steps: this.executionHistory
      };
    }
  }

  // Create an execution plan for the goal
  async createPlan(userGoal) {
    const systemPrompt = `You are an autonomous agent planning system. Given a user goal, create a step-by-step execution plan.

Available tools:
- terminal: Execute shell commands
- browse: Fetch web pages
- search: Search the internet
- file_read: Read files
- file_list: List directories
- execute: Run code (JS/Python/Bash)

Respond with a JSON plan in this format:
{
  "goal": "User's goal in one sentence",
  "reasoning": "Why this approach will work",
  "steps": [
    {
      "number": 1,
      "tool": "tool_name",
      "params": {"param": "value"},
      "description": "What this step does",
      "isGoal": false
    }
  ]
}

Keep plans SHORT (3-5 steps max). The last step should have "isGoal": true.

Example:
User: "Find the largest file in my Downloads and tell me what it is"
{
  "goal": "Identify largest file in Downloads directory",
  "reasoning": "List files to see sizes, identify largest, read/analyze it",
  "steps": [
    {"number": 1, "tool": "file_list", "params": {"path": "~/Downloads"}, "description": "List all files in Downloads with sizes", "isGoal": false},
    {"number": 2, "tool": "terminal", "params": {"command": "ls -lhS ~/Downloads | head -5"}, "description": "Get top 5 largest files sorted by size", "isGoal": false},
    {"number": 3, "tool": "file_read", "params": {"path": "~/Downloads/largest_file.ext"}, "description": "Read the largest file to identify content", "isGoal": true}
  ]
}

IMPORTANT: Return ONLY valid JSON, no other text.`;

    const response = await fetch(`${this.ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'dolphin-llama3',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Goal: ${userGoal}` }
        ],
        stream: false,
        options: { temperature: 0.3, num_predict: 1000 }
      })
    });

    const data = await response.json();
    const content = data.message.content.trim();

    // Extract JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to generate plan');
    }

    const plan = JSON.parse(jsonMatch[0]);

    return plan;
  }

  // Execute a single step
  async executeStep(step, context) {
    try {
      const executor = this.router.toolExecutors[step.tool];

      if (!executor) {
        throw new Error(`Tool ${step.tool} not available`);
      }

      // Execute the tool
      const result = await executor(step.params);

      return {
        success: result.success || !result.error,
        tool: step.tool,
        params: step.params,
        result
      };

    } catch (error) {
      return {
        success: false,
        tool: step.tool,
        params: step.params,
        error: error.message
      };
    }
  }

  // Build context from execution history
  buildContext() {
    return this.executionHistory
      .map(h => `Step ${h.step}: Used ${h.action.tool} - ${h.result.success ? 'Success' : 'Failed'}`)
      .join('\n');
  }

  // Synthesize final response from execution history
  async synthesizeResponse(userGoal, history) {
    const historyText = history.map(h => {
      const result = h.result.result;
      let summary = `Step ${h.step}: ${h.action.description}\n`;

      if (result.stdout) summary += `Output: ${result.stdout.slice(0, 500)}\n`;
      if (result.content) summary += `Content: ${result.content.slice(0, 500)}\n`;
      if (result.output) summary += `Output: ${result.output.slice(0, 500)}\n`;
      if (result.files) summary += `Files: ${result.files.length} items\n`;
      if (result.results) summary += `Results: ${result.results.length} items\n`;

      return summary;
    }).join('\n');

    const systemPrompt = `You just completed an autonomous task. Execution history:

${historyText}

Original goal: "${userGoal}"

Provide a natural, helpful response that:
1. Confirms the task was completed
2. Summarizes key findings
3. Answers the user's original question
4. Is concise and actionable

Do not mention "autonomous mode" or "steps" - just answer naturally.`;

    const response = await fetch(`${this.ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'dolphin-llama3',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userGoal }
        ],
        stream: false,
        options: { temperature: 0.7 }
      })
    });

    const data = await response.json();
    return data.message.content;
  }

  // Simple version: AI decides if task needs autonomous mode
  async shouldUseAutonomousMode(message) {
    const systemPrompt = `Analyze if this message requires multiple tools to complete.

Respond with ONLY "true" or "false":
- true: Task needs multiple steps/tools (e.g., "find and analyze", "search then summarize", "check X and do Y")
- false: Task is simple or conversational (e.g., "hello", "list files", "what is X")

Examples:
"Find the biggest file in Downloads and tell me what it is" → true
"Search for nodejs tutorials and summarize the best one" → true
"List my Documents" → false
"Hello" → false
"What is Python?" → false`;

    try {
      const response = await fetch(`${this.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'dolphin-llama3',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          stream: false,
          options: { temperature: 0.1, num_predict: 10 }
        })
      });

      const data = await response.json();
      const answer = data.message.content.trim().toLowerCase();

      return answer.includes('true');
    } catch (error) {
      console.error('Failed to analyze autonomous mode need:', error);
      return false;
    }
  }
}

module.exports = AutonomousAgent;
