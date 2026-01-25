// Configuration
const CONFIG = {
  recipientEmail: 'bechir.abidi06@gmail.com',
  siteName: 'My Bus Finder 3X',
  maxLogs: 50,
  collectionDelay: 3000,
  serverPath: '/var/www/mybusfinder',
  hostname: 'mybusfinder',
  username: 'local'
};

const fileSystem = {
  '/': {
    type: 'dir',
    contents: {
      'var': {
        type: 'dir',
        contents: {
          'www': {
            type: 'dir',
            contents: {
              'mybusfinder': {
                type: 'dir',
                contents: {
                  'index.html': { type: 'file', size: '4.2K', modified: '2024-01-15 14:23', content: '<!DOCTYPE html>\n<html>...</html>' },
                  'logic.js': { type: 'file', size: '89.5K', modified: '2024-01-20 09:15', content: '// Application JavaScript...' },
                  'style.css': { type: 'file', size: '12.3K', modified: '2024-01-18 16:45', content: '/* Styles */' },
                  'proxy-cors': { type: 'file', size: '2.1K', modified: '2024-01-10 11:30', content: '<?php\n// Configuration...' },
                  'src': {
                    type: 'dir',
                    contents: {
                      'images': { type: 'dir', contents: {} },
                      'fonts': { type: 'dir', contents: {} }
                    }
                  },
                  'logs': {
                    type: 'dir',
                    contents: {
                      'error.log': { type: 'file', size: '156K', modified: '2024-01-25 12:00', content: '[ERROR] Application errors...' },
                      'access.log': { type: 'file', size: '2.3M', modified: '2024-01-25 12:00', content: '[ACCESS] User requests...' }
                    }
                  }
                }
              },
              'html': { type: 'dir', contents: {} }
            }
          },
          'log': {
            type: 'dir',
            contents: {
              'apache2': {
                type: 'dir',
                contents: {
                  'error.log': { type: 'file', size: '245K', modified: '2024-01-25 12:00', content: 'Apache error logs...' },
                  'access.log': { type: 'file', size: '5.6M', modified: '2024-01-25 12:00', content: 'Apache access logs...' }
                }
              },
              'syslog': { type: 'file', size: '12.4M', modified: '2024-01-25 12:00', content: 'System logs...' }
            }
          }
        }
      },
      'home': {
        type: 'dir',
        contents: {
          'local': {
            type: 'dir',
            contents: {
              '.bashrc': { type: 'file', size: '3.5K', modified: '2024-01-01 10:00', content: '# .bashrc configuration' },
              'Documents': { type: 'dir', contents: {} },
              'Downloads': { type: 'dir', contents: {} }
            }
          }
        }
      },
      'etc': {
        type: 'dir',
        contents: {
          'apache2': {
            type: 'dir',
            contents: {
              'apache2.conf': { type: 'file', size: '7.2K', modified: '2024-01-05 14:00', content: '# Apache configuration' },
              'sites-available': { type: 'dir', contents: {} },
              'sites-enabled': { type: 'dir', contents: {} }
            }
          },
          'hosts': { type: 'file', size: '220', modified: '2024-01-01 10:00', content: '127.0.0.1 localhost\n127.0.1.1 mybusfinder' },
          'hostname': { type: 'file', size: '12', modified: '2024-01-01 10:00', content: 'mybusfinder' }
        }
      },
      'usr': {
        type: 'dir',
        contents: {
          'bin': { type: 'dir', contents: {} },
          'lib': { type: 'dir', contents: {} },
          'share': { type: 'dir', contents: {} }
        }
      },
      'tmp': { type: 'dir', contents: {} },
      'opt': { type: 'dir', contents: {} }
    }
  }
};

let currentDir = CONFIG.serverPath;

const installedPackages = [
  'apache2',
  'php8.1',
  'php8.1-cli',
  'php8.1-common',
  'mysql-server',
  'mysql-client',
  'curl',
  'wget',
  'git',
  'vim',
  'nano',
  'htop',
  'net-tools',
  'openssh-server',
  'ufw',
  'certbot'
];

const processes = [
  { pid: 1, user: 'root', cpu: '0.0', mem: '0.1', command: '/sbin/init' },
  { pid: 234, user: 'root', cpu: '0.0', mem: '0.5', command: '/usr/sbin/apache2 -k start' },
  { pid: 456, user: 'www-data', cpu: '0.1', mem: '1.2', command: '/usr/sbin/apache2 -k start' },
  { pid: 457, user: 'www-data', cpu: '0.0', mem: '1.1', command: '/usr/sbin/apache2 -k start' },
  { pid: 789, user: 'mysql', cpu: '0.2', mem: '8.5', command: '/usr/sbin/mysqld' },
  { pid: 1024, user: 'root', cpu: '0.0', mem: '0.3', command: '/usr/sbin/sshd -D' },
  { pid: 1456, user: 'root', cpu: '0.0', mem: '0.2', command: '/usr/sbin/cron -f' }
];

// System info
const systemInfo = {
  os: 'Ubuntu 24.04 LTS',
  kernel: '5.15.0-91-generic',
  architecture: 'x86_64',
  uptime: '15 days, 7:23',
  loadAverage: '0.15, 0.12, 0.08',
  totalMemory: '24GB',
  usedMemory: '3.2GB',
  freeMemory: '20.8GB'
};

// Error codes mapping
const ERROR_CODES = {
  'TypeError': 'TYPE_MISMATCH_EXCEPTION',
  'ReferenceError': 'UNDEFINED_REFERENCE_ERROR',
  'SyntaxError': 'SYNTAX_PARSE_FAILURE',
  'RangeError': 'OUT_OF_BOUNDS_ERROR',
  'URIError': 'INVALID_URI_FORMAT',
  'EvalError': 'EVAL_EXECUTION_FAILED',
  'Promise': 'UNHANDLED_PROMISE_REJECTION',
  'Network': 'NETWORK_CONNECTION_FAILED',
  'Timeout': 'REQUEST_TIMEOUT_EXCEEDED',
  'default': 'CRITICAL_JAVASCRIPT_ERROR'
};

// Get error code based on error type
function getErrorCode(error) {
  if (!error || !error.message) return ERROR_CODES.default;
  
  const message = error.message.toLowerCase();
  
  for (const [key, code] of Object.entries(ERROR_CODES)) {
    if (key !== 'default' && message.includes(key.toLowerCase())) {
      return code;
    }
  }
  
  if (error.name && ERROR_CODES[error.name]) {
    return ERROR_CODES[error.name];
  }
  
  return ERROR_CODES.default;
}

// Capture console logs
const consoleLogs = [];
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error
};

['log', 'warn', 'error'].forEach(method => {
  console[method] = function(...args) {
    consoleLogs.push({
      type: method,
      message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '),
      timestamp: new Date().toISOString()
    });
    
    if (consoleLogs.length > CONFIG.maxLogs) {
      consoleLogs.shift();
    }
    
    originalConsole[method].apply(console, args);
  };
});

// Capture global errors
let errorQueue = [];
let isCollecting = false;
let collectionTimeout = null;

window.addEventListener('error', (e) => {
  const error = {
    message: e.message,
    filename: e.filename,
    line: e.lineno,
    col: e.colno,
    stack: e.error?.stack,
    name: e.error?.name,
    timestamp: new Date().toISOString()
  };
  
  errorQueue.push(error);
  
  if (!isCollecting) {
    startErrorCollection();
  }
});

window.addEventListener('unhandledrejection', (e) => {
  const error = {
    message: `Promise rejection: ${e.reason}`,
    stack: e.reason?.stack,
    name: 'Promise',
    timestamp: new Date().toISOString()
  };
  
  errorQueue.push(error);
  
  if (!isCollecting) {
    startErrorCollection();
  }
});

// Command history
let commandHistory = [];
let historyIndex = -1;

// Start collecting errors for 3 seconds
function startErrorCollection() {
  isCollecting = true;
  showErrorOverlay();
  
  collectionTimeout = setTimeout(() => {
    isCollecting = false;
    displayCollectedErrors();
  }, CONFIG.collectionDelay);
}

// Show initial overlay with loading
function showErrorOverlay() {
  if (document.getElementById('error-overlay')) return;
  
  const overlay = document.createElement('div');
  overlay.id = 'error-overlay';
  overlay.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Roboto+Mono:wght@400;700&display=swap');
      
      #error-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #000000;
        z-index: 999999;
        color: #ffffffff;
        font-family: 'Courier Prime', 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.4;
        overflow: hidden;
      }
      
      #error-overlay-content {
        width: 100%;
        height: 100%;
        padding: 20px;
        box-sizing: border-box;
        overflow-y: auto;
        overflow-x: hidden;
      }
      
      #error-overlay pre {
        margin: 0;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      
      .kernel-header {
        color: #ffffffff;
        font-weight: bold;
        margin-bottom: 10px;
      }
      
      .panic-msg {
        color: #ff0000;
        font-weight: bold;
        font-size: 16px;
        margin: 15px 0;
        animation: blink 1s infinite;
      }
      
      @keyframes blink {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0.3; }
      }
      
      .info-line {
        color: #ffffffff;
        margin: 2px 0;
      }
      
      .error-detail {
        color: #ffff00;
        margin: 5px 0 5px 20px;
        border-left: 2px solid #ffff00;
        padding-left: 10px;
      }
      
      .stack-trace {
        color: #00aaaa;
        margin-left: 30px;
        font-size: 11px;
      }
      
      .separator {
        color: #ffffffff;
        margin: 10px 0;
      }
      
      .console-logs {
        color: #aaaaaa;
        margin: 5px 0 5px 20px;
        font-size: 11px;
      }
      
      .terminal-section {
        margin-top: 20px;
        border-top: 2px solid #ffffffff;
        padding-top: 10px;
      }
      
      .terminal-prompt {
        color: #ffffffff;
        display: flex;
        align-items: center;
        margin-top: 5px;
      }
      
      .terminal-prompt span {
        margin-right: 5px;
        white-space: nowrap;
      }
      
      #terminal-input {
        background: transparent;
        border: none;
        color: #ffffffff;
        font-family: 'Courier Prime', 'Courier New', monospace;
        font-size: 13px;
        outline: none;
        flex: 1;
        caret-color: #ffffffff;
      }
      
      #terminal-output {
        margin-bottom: 10px;
        overflow-y: auto;
      }
      
      .terminal-line {
        margin: 2px 0;
      }
      
      .terminal-command {
        color: #ffffffff;
      }
      
      .terminal-result {
        color: #ffffff;
        margin-left: 0;
        white-space: pre-wrap;
      }
      
      .terminal-error {
        color: #ff0000;
        margin-left: 0;
      }
      
      .terminal-warning {
        color: #ffaa00;
        margin-left: 0;
      }
      
      .loading-dots::after {
        content: '';
        animation: dots 1.5s infinite;
      }
      
      @keyframes dots {
        0%, 20% { content: '.'; }
        40% { content: '..'; }
        60%, 100% { content: '...'; }
      }
      
      .hidden {
        display: none;
      }
      
      #error-overlay::-webkit-scrollbar {
        width: 8px;
      }
      
      #error-overlay::-webkit-scrollbar-track {
        background: #001100;
      }
      
      #error-overlay::-webkit-scrollbar-thumb {
        background: #ffffffff;
      }
      
      .cursor-blink {
        animation: cursor-blink 1s infinite;
      }
      
      @keyframes cursor-blink {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0; }
      }
      
      .ls-item {
        display: inline-block;
        margin-right: 15px;
      }
      
      .ls-dir {
        color: #5555ff;
        font-weight: bold;
      }
      
      .ls-file {
        color: #ffffff;
      }
    </style>
    
    <div id="error-overlay-content">
      <pre id="kernel-output"></pre>
    </div>
  `;
  
  document.body.appendChild(overlay);
  startKernelBoot();
}

function startKernelBoot() {
  const output = document.getElementById('kernel-output');
  let bootMessages = [
    '[    0.000000] Linux version ' + systemInfo.kernel + ' (buildd@lcy02-amd64-080) (gcc version 11.4.0 (Ubuntu 11.4.0-1ubuntu1~24.04LTS))',
    '[    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz-' + systemInfo.kernel + ' root=UUID=a1b2c3d4 ro quiet splash',
    '[    0.000000] KERNEL supported cpus:',
    '[    0.000000]   Intel GenuineIntel',
    '[    0.000000]   AMD AuthenticAMD',
    '[    0.100000] x86/fpu: Supporting XSAVE feature 0x001: \'x87 floating point registers\'',
    '[    0.150000] x86/fpu: Supporting XSAVE feature 0x002: \'SSE registers\'',
    '[    0.200000] DMI: ' + navigator.vendor + '/' + navigator.platform + ', BIOS ' + navigator.appVersion.substring(0, 20),
    '[    0.250000] Memory: ' + systemInfo.totalMemory + ' RAM available',
    '[    0.300000] CPU: ' + navigator.hardwareConcurrency + ' cores detected',
    '[    0.350000] Checking console logs... [<span style="color:#00ff00;">OK</span>]',
    '[    0.400000] Mounting root filesystem...',
    '[    0.450000] EXT4-fs (sda1): mounted filesystem with ordered data mode. Opts: (null)',
    '[    0.500000] Starting init: /sbin/init',
    '[    0.550000] systemd[1]: Detected architecture unknown',
    '[    0.600000] systemd[1]: Set hostname to <' + CONFIG.hostname + '>',
    '[    0.650000] systemd[1]: Started Apache HTTP Server',
    '[    0.700000] apache2[234]: AH00558: apache2: Could not reliably determine the server\'s fully qualified domain name',
    '[    0.750000] ' + CONFIG.siteName + ': Application initializing...',
    '[    0.800000] JavaScript Engine: V8/' + (navigator.userAgent.match(/Chrome\/([\\d.]+)/) || ['', 'Unknown'])[1],
    '[    0.850000] Scanning for runtime errors<span class="loading-dots"></span>'
  ];
  
  let index = 0;
  const interval = setInterval(() => {
    if (index < bootMessages.length) {
      output.innerHTML += bootMessages[index] + '\n';
      output.parentElement.scrollTop = output.parentElement.scrollHeight;
      index++;
    } else {
      clearInterval(interval);
    }
  }, 100);
}

// Display collected errors
function displayCollectedErrors() {
  const output = document.getElementById('kernel-output');
  
  const errorCodesText = [...new Set(errorQueue.map(err => getErrorCode(err)))].join(' | ');
  
  let kernelPanic = `
[    ${(CONFIG.collectionDelay / 1000).toFixed(3)}] ================================================================================
[    ${(CONFIG.collectionDelay / 1000).toFixed(3)}] PANIC - FATAL EXCEPTION IN INTERRUPT HANDLER
[    ${(CONFIG.collectionDelay / 1000).toFixed(3)}] ================================================================================

<span class="panic-msg">*** CRITICAL STOP: ${errorCodesText} ***</span>

System has halted due to fatal JavaScript exception.
A problem has been detected and the application has been stopped to prevent damage.

Kernel Information:
-------------------
OS:             ${systemInfo.os}
Kernel:         ${systemInfo.kernel}
Architecture:   ${systemInfo.architecture}
Hostname:       ${CONFIG.hostname}
Server Path:    ${CONFIG.serverPath}
Web Server:     Apache/2.4.52 (Ubuntu)
Uptime:         ${systemInfo.uptime}

Runtime Environment:
--------------------
URL:            ${window.location.href}
User Agent:     ${navigator.userAgent}
Platform:       ${navigator.platform}
Language:       ${navigator.language}
Online:         ${navigator.onLine}
Timestamp:      ${new Date().toISOString()}

Memory Status:
--------------
Total:          ${systemInfo.totalMemory}
Used:           ${systemInfo.usedMemory}
Free:           ${systemInfo.freeMemory}
Load Average:   ${systemInfo.loadAverage}

Error Summary:
--------------
Total Errors:        ${errorQueue.length}
Console Logs:        ${consoleLogs.length} entries
Stop Codes:          ${errorCodesText}

Call Trace (Detailed Error Information):
-----------------------------------------
`;

  errorQueue.forEach((error, index) => {
    kernelPanic += `
<span class="error-detail">[${index + 1}] EXCEPTION: ${getErrorCode(error)}
Message:    ${error.message || 'Unknown error occurred'}`;
    
    if (error.filename) {
      kernelPanic += `
Source:     ${error.filename}`;
    }
    
    if (error.line) {
      kernelPanic += `
Location:   Line ${error.line}, Column ${error.col || 0}`;
    }
    
    kernelPanic += `
Timestamp:  ${error.timestamp}`;
    
    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(0, 6);
      kernelPanic += `
<span class="stack-trace">Stack Backtrace:
${stackLines.map(line => '    ' + line.trim()).join('\n')}</span>`;
    }
    
    kernelPanic += `</span>
`;
  });

  kernelPanic += `
<span class="separator">================================================================================</span>

Recent Console Activity (Last ${Math.min(consoleLogs.length, 10)} entries):
-----------------------`;

  consoleLogs.slice(-10).forEach(log => {
    kernelPanic += `
<span class="console-logs">[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}</span>`;
  });

  kernelPanic += `

<span class="separator">================================================================================</span>

Emergency Shell Access - ${CONFIG.username}@${CONFIG.hostname}
--------------------------
You are now in emergency recovery mode. Use Linux commands to diagnose the issue.

Available Commands:
  Linux/Ubuntu:     ls, cd, pwd, cat, grep, find, ps, top, free, df, du, uname
                    systemctl, service, apt, dpkg, netstat, ifconfig, ping, wget
                    tail, head, chmod, chown, mkdir, rm, cp, mv, touch, nano, vim
  Diagnostics:      errors, logs, info, trace <n>
  System:           clear, reboot, shutdown, report
  Help:             help, man <command>

Type 'help' for detailed command list or 'man <command>' for manual pages.

<span class="separator">================================================================================</span>
`;

  output.innerHTML += kernelPanic;
  
  // Add terminal interface
  const terminalSection = document.createElement('div');
  terminalSection.className = 'terminal-section';
  terminalSection.innerHTML = `
    <div id="terminal-output"></div>
    <div class="terminal-prompt">
      <span>${CONFIG.username}@${CONFIG.hostname}:${currentDir}$</span>
      <input type="text" id="terminal-input" autofocus autocomplete="off" spellcheck="false" />
    </div>
  `;
  
  output.parentElement.appendChild(terminalSection);
  output.parentElement.scrollTop = output.parentElement.scrollHeight;
  
  setupTerminal();
}

// Setup terminal functionality
function setupTerminal() {
  const input = document.getElementById('terminal-input');
  const terminalOutput = document.getElementById('terminal-output');
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const command = input.value.trim();
      if (command) {
        executeCommand(command, terminalOutput);
        commandHistory.unshift(command);
        historyIndex = -1;
      }
      input.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        input.value = commandHistory[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        input.value = commandHistory[historyIndex];
      } else if (historyIndex === 0) {
        historyIndex = -1;
        input.value = '';
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
    }
  });
  
  input.focus();
}

// Get filesystem node
function getFSNode(path) {
  if (path === '') path = '/';
  const parts = path.split('/').filter(p => p);
  let current = fileSystem['/'];
  
  for (const part of parts) {
    if (!current.contents || !current.contents[part]) {
      return null;
    }
    current = current.contents[part];
  }
  
  return current;
}

// Resolve path
function resolvePath(path) {
  if (path.startsWith('/')) {
    return path;
  }
  
  if (path === '..') {
    const parts = currentDir.split('/').filter(p => p);
    parts.pop();
    return '/' + parts.join('/');
  }
  
  if (path === '.') {
    return currentDir;
  }
  
  if (currentDir === '/') {
    return '/' + path;
  }
  
  return currentDir + '/' + path;
}

// Update prompt
function updatePrompt() {
  const promptSpan = document.querySelector('.terminal-prompt span');
  if (promptSpan) {
    promptSpan.textContent = `${CONFIG.username}@${CONFIG.hostname}:${currentDir}$`;
  }
}

if (nanoState.isOpen) {
  const warning = document.createElement('div');
  warning.className = 'terminal-line';
  warning.innerHTML = `<span class="terminal-warning">nano is open — use Ctrl+X to exit editor.</span>`;
  outputElement.appendChild(warning);
  scrollTerminal();
  return;
}


// Execute terminal command
function executeCommand(command, outputElement) {
  const commandLine = document.createElement('div');
  commandLine.className = 'terminal-line';
  commandLine.innerHTML = `<span class="terminal-command">${CONFIG.username}@${CONFIG.hostname}:${currentDir}$ ${escapeHtml(command)}</span>`;
  outputElement.appendChild(commandLine);
  
  const parts = command.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);
  
  const result = document.createElement('div');
  result.className = 'terminal-line';
  
  try {
    switch(cmd) {
      case 'help':
        result.innerHTML = `<span class="terminal-result">Available Commands:

LINUX/UBUNTU COMMANDS:
  ls [path]           - List directory contents
  cd <path>           - Change directory
  pwd                 - Print working directory
  cat <file>          - Display file contents
  grep <pattern>      - Search for pattern (in error logs)
  find <path>         - Find files
  ps                  - Show running processes
  top                 - Display system resource usage
  free                - Show memory usage
  df                  - Show disk usage
  du [path]           - Show directory size
  uname -a            - Show system information
  systemctl status    - Show service status
  service <name>      - Service management
  apt list            - List installed packages
  dpkg -l             - List installed packages
  netstat             - Show network connections
  tail <file>         - Show last lines of file
  head <file>         - Show first lines of file
  chmod <mode> <file> - Change file permissions
  mkdir <dir>         - Create directory
  touch <file>        - Create empty file
  rm <file>           - Remove file
  whoami              - Show current user
  hostname            - Show hostname
  date                - Show current date/time
  uptime              - Show system uptime

DIAGNOSTIC COMMANDS:
  errors              - Show all JavaScript errors
  logs                - Show all console logs
  info                - Show system information
  trace <n>           - Show stack trace for error #n

SYSTEM COMMANDS:
  clear               - Clear terminal
  reboot              - Restart application
  shutdown            - Close error panel
  report              - Send error report via email

Use 'man <command>' for detailed help on specific commands.</span>`;
        break;
        
      case 'man':
        const manCmd = args[0];
        if (!manCmd) {
          result.innerHTML = `<span class="terminal-error">What manual page do you want?</span>`;
        } else {
          result.innerHTML = `<span class="terminal-result">Manual page for ${manCmd}:

NAME
    ${manCmd} - Linux command

DESCRIPTION
    For full manual pages, please refer to the official Linux documentation.
    
    Type 'help' to see all available commands in this emergency shell.</span>`;
        }
        break;
        
      case 'ls':
        const lsPath = args[0] ? resolvePath(args[0]) : currentDir;
        const lsNode = getFSNode(lsPath);
        
        if (!lsNode) {
          result.innerHTML = `<span class="terminal-error">ls: cannot access '${args[0]}': No such file or directory</span>`;
        } else if (lsNode.type === 'file') {
          result.innerHTML = `<span class="terminal-result">${args[0]}</span>`;
        } else {
          const items = Object.keys(lsNode.contents);
          let output = '';
          items.forEach(item => {
            const itemNode = lsNode.contents[item];
            if (itemNode.type === 'dir') {
              output += `<span class="ls-item ls-dir">${item}/</span>`;
            } else {
              output += `<span class="ls-item ls-file">${item}</span>`;
            }
          });
          result.innerHTML = `<span class="terminal-result">${output || '(empty directory)'}</span>`;
        }
        break;
        
      case 'cd':
        if (!args[0]) {
          currentDir = '/home/' + CONFIG.username;
        } else {
          const newPath = resolvePath(args[0]);
          const node = getFSNode(newPath);
          
          if (!node) {
            result.innerHTML = `<span class="terminal-error">cd: ${args[0]}: No such file or directory</span>`;
          } else if (node.type !== 'dir') {
            result.innerHTML = `<span class="terminal-error">cd: ${args[0]}: Not a directory</span>`;
          } else {
            currentDir = newPath;
            updatePrompt();
          }
        }
        break;
        
      case 'pwd':
        result.innerHTML = `<span class="terminal-result">${currentDir}</span>`;
        break;
        
      case 'cat':
        if (!args[0]) {
          result.innerHTML = `<span class="terminal-error">cat: missing file operand</span>`;
        } else {
          const catPath = resolvePath(args[0]);
          const catNode = getFSNode(catPath);
          
          if (!catNode) {
            result.innerHTML = `<span class="terminal-error">cat: ${args[0]}: No such file or directory</span>`;
          } else if (catNode.type === 'dir') {
            result.innerHTML = `<span class="terminal-error">cat: ${args[0]}: Is a directory</span>`;
          } else {
            result.innerHTML = `<span class="terminal-result">${escapeHtml(catNode.content || '[Binary file content]')}</span>`;
          }
        }
        break;
        
      case 'grep':
        if (args.length < 1) {
          result.innerHTML = `<span class="terminal-error">grep: missing pattern</span>`;
        } else {
          const pattern = args[0].toLowerCase();
          const matches = errorQueue.filter(err => 
            err.message.toLowerCase().includes(pattern) ||
            (err.stack && err.stack.toLowerCase().includes(pattern))
          );
          
          if (matches.length > 0) {
            let grepOutput = `Found ${matches.length} match(es) in error logs:\n\n`;
            matches.forEach((err, i) => {
              grepOutput += `[${i + 1}] ${err.message}\n`;
            });
            result.innerHTML = `<span class="terminal-result">${escapeHtml(grepOutput)}</span>`;
          } else {
            result.innerHTML = `<span class="terminal-result">No matches found</span>`;
          }
        }
        break;
        
      case 'find':
        const findPath = args[0] || currentDir;
        result.innerHTML = `<span class="terminal-result">Find in ${findPath}:
${findPath}
${findPath}/index.html
${findPath}/app.js
${findPath}/style.css
${findPath}/config.php</span>`;
        break;
        
      case 'ps':
        let psOutput = 'PID    USER       CPU  MEM  COMMAND\n';
        processes.forEach(proc => {
          psOutput += `${proc.pid.toString().padEnd(6)} ${proc.user.padEnd(10)} ${proc.cpu.padEnd(4)} ${proc.mem.padEnd(4)} ${proc.command}\n`;
        });
        result.innerHTML = `<span class="terminal-result">${psOutput}</span>`;
        break;
        
      case 'top':
        result.innerHTML = `<span class="terminal-result">top - ${new Date().toLocaleTimeString()} up ${systemInfo.uptime}
Tasks: ${processes.length} total
CPU(s): 5.2%us, 2.1%sy, 0.0%ni, 92.5%id
Mem: ${systemInfo.totalMemory} total, ${systemInfo.usedMemory} used, ${systemInfo.freeMemory} free

PID    USER     CPU  MEM  COMMAND
${processes.map(p => `${p.pid.toString().padEnd(6)} ${p.user.padEnd(8)} ${p.cpu.padEnd(4)} ${p.mem.padEnd(4)} ${p.command}`).join('\n')}</span>`;
        break;
        
      case 'free':
        result.innerHTML = `<span class="terminal-result">              total        used        free
Mem:          8192MB       3276MB       4916MB
Swap:         2048MB        128MB       1920MB</span>`;
        break;
        
      case 'df':
        result.innerHTML = `<span class="terminal-result">Filesystem     Size  Used Avail Use% Mounted on
/dev/sda1       50G   28G   20G  59% /
tmpfs          4.0G  1.2M  4.0G   1% /dev/shm
/dev/sdb1      100G   45G   50G  48% /var/www</span>`;
        break;
        
      case 'du':
        const duPath = args[0] || currentDir;
        result.innerHTML = `<span class="terminal-result">256K    ${duPath}/assets/images
128K    ${duPath}/assets/fonts
512K    ${duPath}/assets
2.4M    ${duPath}/logs
89.5K   ${duPath}/app.js
4.2K    ${duPath}/index.html
3.1M    ${duPath}</span>`;
        break;
        
      case 'uname':
        if (args[0] === '-a') {
          result.innerHTML = `<span class="terminal-result">Linux ${CONFIG.hostname} ${systemInfo.kernel} #1 SMP ${new Date().toDateString()} ${systemInfo.architecture} ${systemInfo.architecture} ${systemInfo.architecture} GNU/Linux</span>`;
        } else {
          result.innerHTML = `<span class="terminal-result">Linux</span>`;
        }
        break;
        
      case 'systemctl':
        if (args[0] === 'status') {
          const serviceName = args[1] || 'apache2';
          result.innerHTML = `<span class="terminal-result">● ${serviceName}.service - Apache HTTP Server
   Loaded: loaded (/lib/systemd/system/${serviceName}.service; enabled)
   Active: <span style="color:#00ff00;">active (running)</span> since ${new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toLocaleString()}
   Main PID: 234 (apache2)
   Tasks: 55 (limit: 4915)
   Memory: 45.2M
   CGroup: /system.slice/${serviceName}.service
           ├─234 /usr/sbin/apache2 -k start
           ├─456 /usr/sbin/apache2 -k start
           └─457 /usr/sbin/apache2 -k start</span>`;
        } else {
          result.innerHTML = `<span class="terminal-result">Use: systemctl status [service]</span>`;
        }
        break;
        
      case 'service':
        const svcName = args[0];
        const svcAction = args[1];
        if (!svcName) {
          result.innerHTML = `<span class="terminal-error">Usage: service <name> <action></span>`;
        } else {
          result.innerHTML = `<span class="terminal-warning">Service command received: ${svcName} ${svcAction || 'status'}
Note: This is non-sudo environment. Actual service changes are not possible.</span>`;
        }
        break;
        
      case 'apt':
        if (args[0] === 'list' || args[0] === 'list --installed') {
          let aptOutput = 'Listing installed packages...\n';
          installedPackages.forEach(pkg => {
            aptOutput += `${pkg}/jammy,now 1.0.0 amd64 [installed]\n`;
          });
          result.innerHTML = `<span class="terminal-result">${aptOutput}</span>`;
        } else if (args[0] === 'update' || args[0] === 'upgrade' || args[0] === 'install') {
          result.innerHTML = `<span class="terminal-warning">E: Could not open lock file - open (13: Permission denied)
E: Unable to acquire the dpkg frontend lock, is another process using it?
Note: System modifications are not available in emergency mode.</span>`;
        } else {
          result.innerHTML = `<span class="terminal-result">apt commands: list, update, upgrade, install
Use: apt list --installed</span>`;
        }
        break;
        
      case 'dpkg':
        if (args[0] === '-l') {
          let dpkgOutput = 'Desired=Unknown/Install/Remove/Purge/Hold\n';
          dpkgOutput += '| Status=Not/Inst/Conf-files/Unpacked/halF-conf/Half-inst/trig-aWait/Trig-pend\n';
          dpkgOutput += '|/ Err?=(none)/Reinst-required (Status,Err: uppercase=bad)\n';
          dpkgOutput += '||/ Name           Version      Architecture Description\n';
          installedPackages.slice(0, 10).forEach(pkg => {
            dpkgOutput += `ii  ${pkg.padEnd(14)} 1.0.0        amd64        Package\n`;
          });
          result.innerHTML = `<span class="terminal-result">${dpkgOutput}</span>`;
        } else {
          result.innerHTML = `<span class="terminal-result">Use: dpkg -l</span>`;
        }
        break;
        
      case 'netstat':
        result.innerHTML = `<span class="terminal-result">Active Internet connections (servers and established)
Proto Recv-Q Send-Q Local Address           Foreign Address         State
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN
tcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:3306          0.0.0.0:*               LISTEN</span>`;
        break;
        
      case 'ifconfig':
        result.innerHTML = `<span class="terminal-result">eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255
        inet6 fe80::a00:27ff:fe4e:66a1  prefixlen 64  scopeid 0x20<link>
        ether 08:00:27:4e:66:a1  txqueuelen 1000  (Ethernet)

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0</span>`;
        break;
        
      case 'ping':
        result.innerHTML = `<span class="terminal-warning">ping: Network environment
Cannot send ICMP packets from browser context</span>`;
        break;
        
      case 'wget':
      case 'curl':
        result.innerHTML = `<span class="terminal-warning">${cmd}: Network operations not available in emergency mode</span>`;
        break;
        
      case 'tail':
        if (!args[0]) {
          result.innerHTML = `<span class="terminal-error">tail: missing file operand</span>`;
        } else {
          const errorLogs = errorQueue.slice(-5);
          let tailOutput = `Last 5 errors from error log:\n\n`;
          errorLogs.forEach((err, i) => {
            tailOutput += `[${i + 1}] ${err.timestamp} - ${err.message}\n`;
          });
          result.innerHTML = `<span class="terminal-result">${escapeHtml(tailOutput)}</span>`;
        }
        break;
        
      case 'head':
        if (!args[0]) {
          result.innerHTML = `<span class="terminal-error">head: missing file operand</span>`;
        } else {
          const firstErrors = errorQueue.slice(0, 5);
          let headOutput = `First 5 errors from error log:\n\n`;
          firstErrors.forEach((err, i) => {
            headOutput += `[${i + 1}] ${err.timestamp} - ${err.message}\n`;
          });
          result.innerHTML = `<span class="terminal-result">${escapeHtml(headOutput)}</span>`;
        }
        break;
        
      case 'chmod':
      case 'chown':
        result.innerHTML = `<span class="terminal-warning">${cmd}: Permission denied
Filesystem modifications not available in emergency mode</span>`;
        break;
        
      case 'mkdir':
      case 'touch':
      case 'rm':
      case 'cp':
      case 'mv':
        result.innerHTML = `<span class="terminal-warning">${cmd}: Read-only filesystem
Emergency mode does not allow file modifications</span>`;
        break;
        
      case 'nano':
        if (!args[0]) {
          result.innerHTML = `<span class="terminal-error">nano: missing file operand</span>`;
        } else {
          const nanoPath = resolvePath(args[0]);
          const nanoNode = getFSNode(nanoPath);

          if (!nanoNode) {
            openNanoEditor({
              path: nanoPath,
              initialContent: '',
              exists: false
            });
            result.innerHTML = `<span class="terminal-result">Opening nano on new file: ${escapeHtml(nanoPath)}</span>`;
          } else if (nanoNode.type === 'dir') {
            result.innerHTML = `<span class="terminal-error">nano: ${escapeHtml(args[0])}: Is a directory</span>`;
          } else {
            openNanoEditor({
              path: nanoPath,
              initialContent: nanoNode.content || '',
              exists: true
            });
            result.innerHTML = `<span class="terminal-result">Opening nano: ${escapeHtml(nanoPath)}</span>`;
          }
        }
        break;

      case 'vim':
      case 'vi':
        result.innerHTML = `<span class="terminal-warning">${cmd}: not implemented in this shell.
Tip: use 'nano <file>' (simulated) instead.</span>`;
        break;

        
      case 'whoami':
        result.innerHTML = `<span class="terminal-result">${CONFIG.username}</span>`;
        break;
        
      case 'hostname':
        result.innerHTML = `<span class="terminal-result">${CONFIG.hostname}</span>`;
        break;
        
      case 'date':
        result.innerHTML = `<span class="terminal-result">${new Date().toString()}</span>`;
        break;
        
      case 'uptime':
        result.innerHTML = `<span class="terminal-result"> ${new Date().toLocaleTimeString()}  up ${systemInfo.uptime},  1 user,  load average: ${systemInfo.loadAverage}</span>`;
        break;
        
      case 'errors':
        let errorsText = `JavaScript Runtime Errors: ${errorQueue.length}\n\n`;
        errorQueue.forEach((error, index) => {
          errorsText += `[ERROR #${index + 1}] ${getErrorCode(error)}\n`;
          errorsText += `  Message:   ${error.message}\n`;
          if (error.filename) errorsText += `  File:      ${error.filename}\n`;
          if (error.line) errorsText += `  Location:  Line ${error.line}:${error.col || 0}\n`;
          errorsText += `  Time:      ${error.timestamp}\n\n`;
        });
        result.innerHTML = `<span class="terminal-result">${escapeHtml(errorsText)}</span>`;
        break;
        
      case 'logs':
        let logsText = `Console Logs: ${consoleLogs.length} entries\n\n`;
        consoleLogs.forEach((log, index) => {
          logsText += `[${log.timestamp}] [${log.type.toUpperCase()}]\n${log.message}\n\n`;
        });
        result.innerHTML = `<span class="terminal-result">${escapeHtml(logsText)}</span>`;
        break;
        
      case 'info':
        const infoText = `System Information:
===================
OS:               ${systemInfo.os}
Kernel:           ${systemInfo.kernel}
Architecture:     ${systemInfo.architecture}
Hostname:         ${CONFIG.hostname}
Uptime:           ${systemInfo.uptime}
Load Average:     ${systemInfo.loadAverage}

Server Configuration:
=====================
Web Server:       Apache/2.4.52 (Ubuntu)
Document Root:    ${CONFIG.serverPath}
PHP Version:      8.1.2
MySQL:            Running (Port 3306)

Application Info:
=================
Name:             ${CONFIG.siteName}
URL:              ${window.location.href}
User Agent:       ${navigator.userAgent}
Platform:         ${navigator.platform}
Language:         ${navigator.language}
Online:           ${navigator.onLine}
Timestamp:        ${new Date().toISOString()}

Memory:
=======
Total:            ${systemInfo.totalMemory}
Used:             ${systemInfo.usedMemory}
Free:             ${systemInfo.freeMemory}

Browser:
========
Cores:            ${navigator.hardwareConcurrency}
Device Memory:    ${navigator.deviceMemory || 'Unknown'} GB
Screen:           ${window.screen.width}x${window.screen.height}
Viewport:         ${window.innerWidth}x${window.innerHeight}`;
        result.innerHTML = `<span class="terminal-result">${escapeHtml(infoText)}</span>`;
        break;
        
      case 'trace':
        const errorNum = parseInt(args[0]);
        if (isNaN(errorNum) || errorNum < 1 || errorNum > errorQueue.length) {
          result.innerHTML = `<span class="terminal-error">Invalid error number. Valid range: 1-${errorQueue.length}
Usage: trace <error_number></span>`;
        } else {
          const error = errorQueue[errorNum - 1];
          let traceText = `Stack Trace for Error #${errorNum}:\n`;
          traceText += `${'='.repeat(50)}\n`;
          traceText += `Code:      ${getErrorCode(error)}\n`;
          traceText += `Message:   ${error.message}\n\n`;
          if (error.stack) {
            traceText += `Call Stack:\n${error.stack}`;
          } else {
            traceText += 'No stack trace available for this error';
          }
          result.innerHTML = `<span class="terminal-result">${escapeHtml(traceText)}</span>`;
        }
        break;
        
      case 'clear':
        outputElement.innerHTML = '';
        scrollTerminal();
        return;
        
      case 'report':
        sendBugReport();
        result.innerHTML = `<span class="terminal-result">[  OK  ] Opening email client with error report...
[  OK  ] Report generated successfully
[ INFO ] Please send the email to complete the report submission</span>`;
        break;
        
      case 'reboot':
        result.innerHTML = `<span class="terminal-result">[  OK  ] Initiating system reboot...
[ INFO ] Stopping services...
[ INFO ] Unmounting filesystems...
[ WAIT ] Restarting application...</span>`;
        outputElement.appendChild(result);
        setTimeout(() => {
          location.reload();
        }, 2000);
        scrollTerminal();
        return;
        
      case 'shutdown':
        result.innerHTML = `<span class="terminal-result">[  OK  ] System shutdown initiated
[ INFO ] Closing emergency shell...</span>`;
        outputElement.appendChild(result);
        setTimeout(() => {
          const overlay = document.getElementById('error-overlay');
          if (overlay) overlay.remove();
        }, 1500);
        scrollTerminal();
        return;
        
      case 'exit':
      case 'quit':
        result.innerHTML = `<span class="terminal-warning">Use 'reboot' to restart or 'shutdown' to close</span>`;
        break;
        
      case 'sudo':
        result.innerHTML = `<span class="terminal-warning">[sudo] password for ${CONFIG.username}: 
Sorry, this is an emergency diagnostic shell. Elevated privileges not available.</span>`;
        break;
        
      default:
        if (command.includes('(') || command.includes('=') || command.includes('[')) {
          try {
            const evalResult = eval(command);
            result.innerHTML = `<span class="terminal-result">${escapeHtml(String(evalResult))}</span>`;
          } catch (err) {
            result.innerHTML = `<span class="terminal-error">${cmd}: command not found

Did you mean one of these?
  errors  - Show JavaScript errors
  logs    - Show console logs
  help    - Show all available commands

JavaScript execution error: ${escapeHtml(err.message)}</span>`;
          }
        } else {
          result.innerHTML = `<span class="terminal-error">${cmd}: command not found
Type 'help' for list of available commands</span>`;
        }
    }
  } catch (err) {
    result.innerHTML = `<span class="terminal-error">Error executing command: ${escapeHtml(err.message)}</span>`;
  }
  
  outputElement.appendChild(result);
  scrollTerminal();
}

function scrollTerminal() {
  const overlay = document.getElementById('error-overlay-content');
  if (overlay) {
    setTimeout(() => {
      overlay.scrollTop = overlay.scrollHeight;
    }, 10);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function sendBugReport() {
  const subject = `[${CONFIG.siteName}] KERNEL PANIC - Critical Error Report - ${new Date().toLocaleDateString()}`;
  const errorCodesText = [...new Set(errorQueue.map(err => getErrorCode(err)))].join(' | ');
  let body = `KERNEL PANIC ERROR REPORT
=========================
Server: ${CONFIG.username}@${CONFIG.hostname}:${CONFIG.serverPath}

Please describe the steps to reproduce the issue:
Veuillez décrire les étapes pour reproduire le problème:


========================================
STOP CODES: ${errorCodesText}
========================================

SYSTEM INFORMATION:
-------------------
OS:             ${systemInfo.os}
Kernel:         ${systemInfo.kernel}
Architecture:   ${systemInfo.architecture}
Hostname:       ${CONFIG.hostname}
Server Path:    ${CONFIG.serverPath}
Web Server:     Apache/2.4.52 (Ubuntu)
Uptime:         ${systemInfo.uptime}
Load Average:   ${systemInfo.loadAverage}

RUNTIME ENVIRONMENT:
--------------------
URL:            ${window.location.href}
Date:           ${new Date().toISOString()}
User Agent:     ${navigator.userAgent}
Platform:       ${navigator.platform}
Language:       ${navigator.language}
Online Status:  ${navigator.onLine}

MEMORY STATUS:
--------------
Total:          ${systemInfo.totalMemory}
Used:           ${systemInfo.usedMemory}
Free:           ${systemInfo.freeMemory}

ERROR DETAILS (${errorQueue.length} critical errors):
==================
`;
  errorQueue.forEach((error, index) => {
    body += `\nERROR #${index + 1} - ${getErrorCode(error)}\n${'-'.repeat(70)}\n${JSON.stringify(error, null, 2)}\n`;
  });
  body += `\nCONSOLE LOGS (${consoleLogs.length} entries):
==================
${consoleLogs.map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`).join('\n')}

========================================
This report was generated by the kernel panic emergency diagnostic system.
Emergency shell session: ${CONFIG.username}@${CONFIG.hostname}
Command history: ${commandHistory.join(', ')}
========================================`;
  const mailtoLink = `mailto:${CONFIG.recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoLink;
}

let nanoState = {
  isOpen: false,
  path: null,
  original: '',
  dirty: false
};

// Toggle this if you want to forbid saving even in-memory
const NANO_READONLY = false;

function openNanoEditor({ path, initialContent, exists }) {
  if (nanoState.isOpen) return;

  nanoState = {
    isOpen: true,
    path,
    original: initialContent || '',
    dirty: false
  };

  const overlay = document.getElementById('error-overlay-content');
  if (!overlay) return;

  // Container
  const nanoWrap = document.createElement('div');
  nanoWrap.id = 'nano-editor';
  nanoWrap.innerHTML = `
    <style>
      #nano-editor {
        margin-top: 14px;
        border: 2px solid #ffffffff;
        padding: 10px;
      }
      #nano-title {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-weight: bold;
      }
      #nano-title .path {
        color: #ffffffff;
      }
      #nano-title .mode {
        color: ${NANO_READONLY ? '#ff0000' : '#00ff00'};
      }
      #nano-textarea {
        width: 100%;
        height: 260px;
        box-sizing: border-box;
        background: #000;
        color: #fff;
        border: 1px solid #ffffffff;
        outline: none;
        font-family: 'Courier Prime', 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.4;
        padding: 8px;
        resize: vertical;
      }
      #nano-status {
        margin-top: 6px;
        color: #aaaaaa;
        font-size: 12px;
        min-height: 16px;
      }
      #nano-helpbar {
        margin-top: 8px;
        border-top: 1px solid #ffffffff;
        padding-top: 8px;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        font-size: 12px;
        color: #ffffffff;
      }
      .nano-key {
        color: #ffff00;
        font-weight: bold;
      }
      .nano-hint {
        color: #aaaaaaaa;
      }
    </style>

    <div id="nano-title">
      <div class="path">GNU nano 7.2  —  ${escapeHtml(path)} ${exists ? '' : '(new file)'}</div>
      <div class="mode">${NANO_READONLY ? 'READ-ONLY' : 'EDIT'}</div>
    </div>

    <textarea id="nano-textarea" spellcheck="false"></textarea>

    <div id="nano-status" class="nano-hint">
      Ctrl+O = Write Out, Ctrl+X = Exit ${NANO_READONLY ? '(saving disabled)' : '(saves to virtual FS)'}
    </div>

    <div id="nano-helpbar">
      <span><span class="nano-key">^O</span> Write Out</span>
      <span><span class="nano-key">^X</span> Exit</span>
      <span><span class="nano-key">^W</span> Where Is</span>
      <span><span class="nano-key">^K</span> Cut</span>
      <span><span class="nano-key">^U</span> Paste</span>
      <span class="nano-hint">(* Simulated nano inside your emergency overlay)</span>
    </div>
  `;

  overlay.appendChild(nanoWrap);

  const ta = nanoWrap.querySelector('#nano-textarea');
  const status = nanoWrap.querySelector('#nano-status');

  ta.value = initialContent || '';
  ta.focus();

  ta.addEventListener('input', () => {
    nanoState.dirty = (ta.value !== nanoState.original);
    status.textContent = nanoState.dirty
      ? 'Modified — Ctrl+O to save, Ctrl+X to exit'
      : 'Unmodified — Ctrl+X to exit';
  });

  function setStatus(msg, isError = false) {
    status.style.color = isError ? '#ff0000' : '#aaaaaa';
    status.textContent = msg;
  }

  function nanoSave() {
    if (NANO_READONLY) {
      setStatus('Error: Read-only mode (saving disabled).', true);
      return;
    }

    const ok = writeFileToVirtualFS(nanoState.path, ta.value);

    if (!ok) {
      setStatus('Error: Cannot write (invalid path).', true);
      return;
    }

    nanoState.original = ta.value;
    nanoState.dirty = false;
    setStatus(`Wrote ${ta.value.length} bytes to ${nanoState.path}`);
  }

  function nanoExit() {
    if (nanoState.dirty) {
      const leave = confirm('File modified. Exit without saving?');
      if (!leave) return;
    }
    closeNanoEditor();
  }

  function nanoWhereIs() {
    const q = prompt('Search (Where Is):');
    if (!q) return;
    const idx = ta.value.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) {
      setStatus(`Search: "${q}" not found`, true);
      return;
    }
    ta.focus();
    ta.setSelectionRange(idx, idx + q.length);
    setStatus(`Search: found "${q}" at offset ${idx}`);
  }

  ta.addEventListener('keydown', (e) => {
    if (e.ctrlKey && !e.shiftKey && !e.altKey) {
      const k = e.key.toLowerCase();

      if (k === 'o') { 
        e.preventDefault();
        nanoSave();
      } else if (k === 'x') { 
        e.preventDefault();
        nanoExit();
      } else if (k === 'w') { 
        e.preventDefault();
        nanoWhereIs();
      } else if (k === 'k') { 
        e.preventDefault();
        cutCurrentLine(ta);
        nanoState.dirty = (ta.value !== nanoState.original);
        setStatus('Cut line (simulated). Ctrl+U to paste.');
      } else if (k === 'u') { 
        e.preventDefault();
        pasteCutBuffer(ta);
        nanoState.dirty = (ta.value !== nanoState.original);
        setStatus('Pasted (simulated).');
      }
    }
  });

  setTimeout(() => {
    overlay.scrollTop = overlay.scrollHeight;
  }, 10);
}

function closeNanoEditor() {
  const nano = document.getElementById('nano-editor');
  if (nano) nano.remove();
  nanoState = { isOpen: false, path: null, original: '', dirty: false };

  const input = document.getElementById('terminal-input');
  if (input) input.focus();
}

let nanoCutBuffer = '';

function cutCurrentLine(textarea) {
  const value = textarea.value;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  if (start !== end) {
    nanoCutBuffer = value.slice(start, end);
    textarea.value = value.slice(0, start) + value.slice(end);
    textarea.setSelectionRange(start, start);
    return;
  }

  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = value.indexOf('\n', start);
  const actualEnd = (lineEnd === -1) ? value.length : lineEnd + 1;

  nanoCutBuffer = value.slice(lineStart, actualEnd);
  textarea.value = value.slice(0, lineStart) + value.slice(actualEnd);
  textarea.setSelectionRange(lineStart, lineStart);
}

function pasteCutBuffer(textarea) {
  if (!nanoCutBuffer) return;
  const value = textarea.value;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  textarea.value = value.slice(0, start) + nanoCutBuffer + value.slice(end);
  const newPos = start + nanoCutBuffer.length;
  textarea.setSelectionRange(newPos, newPos);
}

function writeFileToVirtualFS(absPath, content) {
  if (!absPath || !absPath.startsWith('/')) return false;

  const parts = absPath.split('/').filter(Boolean);
  const fileName = parts.pop();
  let current = fileSystem['/'];

  for (const part of parts) {
    if (!current.contents) current.contents = {};
    if (!current.contents[part]) {
      current.contents[part] = { type: 'dir', contents: {} };
    }
    if (current.contents[part].type !== 'dir') return false;
    current = current.contents[part];
  }

  if (!current.contents) current.contents = {};

  current.contents[fileName] = {
    type: 'file',
    size: `${Math.max(1, Math.ceil(content.length / 1024)).toFixed(1)}K`,
    modified: new Date().toISOString().slice(0, 16).replace('T', ' '),
    content
  };

  return true;
}
