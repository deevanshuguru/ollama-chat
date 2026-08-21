// ============================================
// PLUGIN SYSTEM - CORE MANAGER
// Infinite extensibility for Local AI Labs
// ============================================

const fs = require('fs');
const path = require('path');
const { VM } = require('vm2');
const crypto = require('crypto');

class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.pluginDir = path.join(__dirname, 'plugins');
    this.registry = new Map();
    this.permissions = new Map();
    this.hooks = {
      beforeChat: [],
      afterChat: [],
      onToolUse: [],
      onFileAccess: [],
      onCommand: []
    };

    // Ensure plugin directory exists
    if (!fs.existsSync(this.pluginDir)) {
      fs.mkdirSync(this.pluginDir, { recursive: true });
    }
  }

  // Initialize plugin system
  async initialize() {
    console.log('🔌 Initializing plugin system...');

    // Load installed plugins
    await this.loadInstalledPlugins();

    // Load plugin registry (available plugins)
    await this.loadRegistry();

    console.log(`✅ Plugin system ready (${this.plugins.size} plugins loaded)`);
  }

  // Load all installed plugins
  async loadInstalledPlugins() {
    const pluginDirs = fs.readdirSync(this.pluginDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const pluginName of pluginDirs) {
      try {
        await this.loadPlugin(pluginName);
      } catch (error) {
        console.error(`❌ Failed to load plugin ${pluginName}:`, error.message);
      }
    }
  }

  // Load a single plugin
  async loadPlugin(pluginName) {
    const pluginPath = path.join(this.pluginDir, pluginName);
    const manifestPath = path.join(pluginPath, 'manifest.json');

    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Missing manifest.json for plugin: ${pluginName}`);
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const mainFile = path.join(pluginPath, manifest.main || 'index.js');

    if (!fs.existsSync(mainFile)) {
      throw new Error(`Missing main file: ${manifest.main || 'index.js'}`);
    }

    // Create plugin object first (so registerTool can access it)
    const pluginObj = {
      name: pluginName,
      manifest,
      module: null,
      sandbox: null,
      enabled: true,
      tools: {},
      commands: {}
    };
    this.plugins.set(pluginName, pluginObj);

    // Create sandboxed environment
    const sandbox = this.createSandbox(pluginName, manifest.permissions || []);

    // Load plugin code
    const pluginCode = fs.readFileSync(mainFile, 'utf8');
    const vm = new VM({
      timeout: 10000,
      sandbox,
      eval: false,
      wasm: false
    });

    const pluginModule = vm.run(`
      const module = { exports: {} };
      ${pluginCode}
      module.exports;
    `);

    // Update plugin object
    pluginObj.module = pluginModule;
    pluginObj.sandbox = sandbox;

    // Initialize plugin
    if (typeof pluginModule.initialize === 'function') {
      await pluginModule.initialize(sandbox.pluginAPI);
    }

    // Register hooks
    if (pluginModule.hooks) {
      Object.entries(pluginModule.hooks).forEach(([hook, handler]) => {
        if (this.hooks[hook]) {
          this.hooks[hook].push({ plugin: pluginName, handler });
        }
      });
    }

    console.log(`✅ Loaded plugin: ${manifest.name} v${manifest.version}`);
  }

  // Create sandboxed API for plugin
  createSandbox(pluginName, permissions) {
    const pluginAPI = {
      // Core info
      plugin: {
        name: pluginName,
        version: this.plugins.get(pluginName)?.manifest.version || '0.0.0'
      },

      // Logging
      log: (...args) => {
        console.log(`[${pluginName}]`, ...args);
      },

      // Storage (plugin-specific)
      storage: {
        get: (key) => {
          const storageFile = path.join(this.pluginDir, pluginName, 'storage.json');
          if (!fs.existsSync(storageFile)) return null;
          const data = JSON.parse(fs.readFileSync(storageFile, 'utf8'));
          return data[key];
        },
        set: (key, value) => {
          const storageFile = path.join(this.pluginDir, pluginName, 'storage.json');
          let data = {};
          if (fs.existsSync(storageFile)) {
            data = JSON.parse(fs.readFileSync(storageFile, 'utf8'));
          }
          data[key] = value;
          fs.writeFileSync(storageFile, JSON.stringify(data, null, 2));
        },
        delete: (key) => {
          const storageFile = path.join(this.pluginDir, pluginName, 'storage.json');
          if (!fs.existsSync(storageFile)) return;
          const data = JSON.parse(fs.readFileSync(storageFile, 'utf8'));
          delete data[key];
          fs.writeFileSync(storageFile, JSON.stringify(data, null, 2));
        }
      },

      // HTTP requests (if permitted)
      fetch: this.checkPermission(pluginName, 'network') ?
        async (url, options) => {
          const fetch = (await import('node-fetch')).default;
          return fetch(url, { ...options, timeout: 10000 });
        } :
        () => { throw new Error('Network permission required'); },

      // File system (if permitted)
      fs: this.checkPermission(pluginName, 'filesystem') ? {
        readFile: (filePath) => {
          const safePath = this.validatePath(filePath);
          return fs.readFileSync(safePath, 'utf8');
        },
        writeFile: (filePath, content) => {
          const safePath = this.validatePath(filePath);
          return fs.writeFileSync(safePath, content);
        },
        exists: (filePath) => {
          const safePath = this.validatePath(filePath);
          return fs.existsSync(safePath);
        }
      } : null,

      // Execute commands (if permitted)
      exec: this.checkPermission(pluginName, 'execute') ?
        async (command) => {
          const { exec } = require('child_process');
          return new Promise((resolve, reject) => {
            exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
              if (error) reject(error);
              else resolve({ stdout, stderr });
            });
          });
        } :
        () => { throw new Error('Execute permission required'); },

      // UI interactions
      ui: {
        notify: (message) => {
          // Will be sent to frontend
          return { type: 'notification', message, plugin: pluginName };
        },
        showDialog: (title, message) => {
          return { type: 'dialog', title, message, plugin: pluginName };
        }
      },

      // Register custom tools
      registerTool: (name, handler) => {
        if (!this.plugins.has(pluginName)) return;
        const plugin = this.plugins.get(pluginName);
        if (!plugin.tools) plugin.tools = {};
        plugin.tools[name] = handler;
        console.log(`🔧 Plugin ${pluginName} registered tool: ${name}`);
      },

      // Register custom commands
      registerCommand: (command, handler) => {
        if (!this.plugins.has(pluginName)) return;
        const plugin = this.plugins.get(pluginName);
        if (!plugin.commands) plugin.commands = {};
        plugin.commands[command] = handler;
        console.log(`⌨️  Plugin ${pluginName} registered command: ${command}`);
      }
    };

    return {
      console: {
        log: pluginAPI.log,
        error: pluginAPI.log,
        warn: pluginAPI.log
      },
      pluginAPI,
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
      Promise,
      JSON,
      Math,
      Date
    };
  }

  // Check if plugin has permission
  checkPermission(pluginName, permission) {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) return false;
    return plugin.manifest.permissions?.includes(permission) || false;
  }

  // Validate file paths
  validatePath(filePath) {
    const resolved = path.resolve(filePath);
    const allowedDirs = [
      path.resolve(process.env.HOME, 'Documents'),
      path.resolve(process.env.HOME, 'Downloads'),
      path.resolve(process.env.HOME, 'Desktop'),
      path.resolve('/tmp')
    ];

    const isAllowed = allowedDirs.some(dir => resolved.startsWith(dir));
    if (!isAllowed) {
      throw new Error('Access denied: Path not in allowed directories');
    }

    return resolved;
  }

  // Install plugin from source
  async installPlugin(source, options = {}) {
    let pluginName, pluginCode, manifest;

    // Source can be: file path, URL, or inline code
    if (source.startsWith('http://') || source.startsWith('https://')) {
      // Download from URL
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(source, { timeout: 10000 });
      const data = await response.json();
      pluginName = data.name;
      pluginCode = data.code;
      manifest = data.manifest;
    } else if (fs.existsSync(source)) {
      // Load from file
      const pluginDir = path.resolve(source);
      manifest = JSON.parse(fs.readFileSync(path.join(pluginDir, 'manifest.json'), 'utf8'));
      pluginName = manifest.name;

      // Copy entire plugin directory
      const targetDir = path.join(this.pluginDir, pluginName);
      if (fs.existsSync(targetDir) && !options.force) {
        throw new Error(`Plugin ${pluginName} already installed. Use force=true to overwrite.`);
      }

      // Copy directory
      fs.cpSync(pluginDir, targetDir, { recursive: true });

      await this.loadPlugin(pluginName);
      return { success: true, plugin: pluginName, message: 'Plugin installed successfully' };
    } else {
      throw new Error('Invalid plugin source');
    }

    // Create plugin directory
    const pluginPath = path.join(this.pluginDir, pluginName);
    if (fs.existsSync(pluginPath) && !options.force) {
      throw new Error(`Plugin ${pluginName} already installed`);
    }

    fs.mkdirSync(pluginPath, { recursive: true });

    // Write manifest
    fs.writeFileSync(
      path.join(pluginPath, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    // Write code
    fs.writeFileSync(
      path.join(pluginPath, manifest.main || 'index.js'),
      pluginCode
    );

    // Load plugin
    await this.loadPlugin(pluginName);

    return {
      success: true,
      plugin: pluginName,
      message: 'Plugin installed and loaded successfully'
    };
  }

  // Uninstall plugin
  async uninstallPlugin(pluginName) {
    if (!this.plugins.has(pluginName)) {
      throw new Error(`Plugin ${pluginName} not found`);
    }

    // Call plugin cleanup if exists
    const plugin = this.plugins.get(pluginName);
    if (plugin.module.cleanup) {
      await plugin.module.cleanup();
    }

    // Remove from memory
    this.plugins.delete(pluginName);

    // Remove hooks
    Object.keys(this.hooks).forEach(hook => {
      this.hooks[hook] = this.hooks[hook].filter(h => h.plugin !== pluginName);
    });

    // Remove files
    const pluginPath = path.join(this.pluginDir, pluginName);
    if (fs.existsSync(pluginPath)) {
      fs.rmSync(pluginPath, { recursive: true, force: true });
    }

    return { success: true, message: `Plugin ${pluginName} uninstalled` };
  }

  // Enable/disable plugin
  togglePlugin(pluginName, enabled) {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) throw new Error(`Plugin ${pluginName} not found`);

    plugin.enabled = enabled;
    return { success: true, plugin: pluginName, enabled };
  }

  // List all plugins
  listPlugins() {
    return Array.from(this.plugins.values()).map(p => ({
      name: p.name,
      version: p.manifest.version,
      description: p.manifest.description,
      author: p.manifest.author,
      enabled: p.enabled,
      permissions: p.manifest.permissions || [],
      tools: Object.keys(p.tools || {}),
      commands: Object.keys(p.commands || {})
    }));
  }

  // Execute plugin tool
  async executeTool(pluginName, toolName, params) {
    const plugin = this.plugins.get(pluginName);
    if (!plugin || !plugin.enabled) {
      throw new Error(`Plugin ${pluginName} not available`);
    }

    if (!plugin.tools || !plugin.tools[toolName]) {
      throw new Error(`Tool ${toolName} not found in plugin ${pluginName}`);
    }

    try {
      const result = await plugin.tools[toolName](params);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Execute plugin command
  async executeCommand(command, args) {
    // Find plugin with this command
    for (const [pluginName, plugin] of this.plugins.entries()) {
      if (plugin.enabled && plugin.commands && plugin.commands[command]) {
        try {
          const result = await plugin.commands[command](args);
          return { success: true, plugin: pluginName, result };
        } catch (error) {
          return { success: false, plugin: pluginName, error: error.message };
        }
      }
    }

    throw new Error(`Command ${command} not found in any plugin`);
  }

  // Run hooks
  async runHook(hookName, data) {
    const hooks = this.hooks[hookName] || [];
    const results = [];

    for (const { plugin, handler } of hooks) {
      const pluginObj = this.plugins.get(plugin);
      if (!pluginObj || !pluginObj.enabled) continue;

      try {
        const result = await handler(data);
        results.push({ plugin, success: true, result });
      } catch (error) {
        results.push({ plugin, success: false, error: error.message });
      }
    }

    return results;
  }

  // Load registry (marketplace)
  async loadRegistry() {
    // In production, this would fetch from a remote API
    // For now, use local registry file
    const registryFile = path.join(__dirname, 'plugin-registry.json');

    if (fs.existsSync(registryFile)) {
      const registry = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
      registry.plugins.forEach(plugin => {
        this.registry.set(plugin.name, plugin);
      });
    }
  }

  // Search registry
  searchRegistry(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const plugin of this.registry.values()) {
      if (
        plugin.name.toLowerCase().includes(lowerQuery) ||
        plugin.description.toLowerCase().includes(lowerQuery) ||
        plugin.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      ) {
        results.push(plugin);
      }
    }

    return results;
  }

  // Get plugin info
  getPluginInfo(pluginName) {
    const installed = this.plugins.get(pluginName);
    const registry = this.registry.get(pluginName);

    return {
      installed: installed ? {
        name: installed.name,
        version: installed.manifest.version,
        enabled: installed.enabled,
        permissions: installed.manifest.permissions || []
      } : null,
      available: registry || null
    };
  }
}

module.exports = PluginManager;
