// Configuration
const CONFIG = {
  recipientEmail: 'bechir.abidi06@gmail.com',
  siteName: 'My Bus Finder 3X',
  maxLogs: 50,
  collectionDelay: 3000 
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
        color: #00ff00;
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
        color: #00ff00;
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
        color: #00ff00;
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
        color: #00ff00;
        margin: 10px 0;
      }
      
      .console-logs {
        color: #aaaaaa;
        margin: 5px 0 5px 20px;
        font-size: 11px;
      }
      
      .terminal-section {
        margin-top: 20px;
        border-top: 2px solid #00ff00;
        padding-top: 10px;
      }
      
      .terminal-prompt {
        color: #00ff00;
        display: flex;
        align-items: center;
        margin-top: 10px;
      }
      
      .terminal-prompt span {
        margin-right: 5px;
      }
      
      #terminal-input {
        background: transparent;
        border: none;
        color: #00ff00;
        font-family: 'Courier Prime', 'Courier New', monospace;
        font-size: 13px;
        outline: none;
        flex: 1;
        caret-color: #00ff00;
      }
      
      #terminal-output {
        margin-bottom: 10px;
        max-height: 200px;
        overflow-y: auto;
      }
      
      .terminal-line {
        margin: 2px 0;
      }
      
      .terminal-command {
        color: #00ff00;
      }
      
      .terminal-result {
        color: #ffffff;
        margin-left: 10px;
      }
      
      .terminal-error {
        color: #ff0000;
        margin-left: 10px;
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
        background: #00ff00;
      }
      
      .cursor-blink {
        animation: cursor-blink 1s infinite;
      }
      
      @keyframes cursor-blink {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0; }
      }
    </style>
    
    <div id="error-overlay-content">
      <pre id="kernel-output"></pre>
    </div>
  `;
  
  document.body.appendChild(overlay);
  startKernelBoot();
}

// Simulate kernel boot messages
function startKernelBoot() {
  const output = document.getElementById('kernel-output');
  let bootMessages = [
    '[    0.000000] Linux version 5.15.0-webkit (javascript@browser) (gcc version 11.2.0)',
    '[    0.000000] Command line: BOOT_IMAGE=/vmlinuz root=/dev/sda1',
    '[    0.100000] Initializing cgroup subsys cpuset',
    '[    0.150000] Initializing cgroup subsys cpu',
    '[    0.200000] DMI: Browser/WebKit, BIOS 2024.01',
    '[    0.250000] Memory: ' + (navigator.deviceMemory || '?') + 'GB RAM',
    '[    0.300000] CPU: ' + navigator.hardwareConcurrency + ' cores detected',
    '[    0.350000] Checking console logs... [OK]',
    '[    0.400000] Mounting root filesystem...',
    '[    0.450000] EXT4-fs: mounted filesystem with ordered data mode',
    '[    0.500000] Starting init process...',
    '[    0.550000] systemd[1]: Started Application Runtime',
    '[    0.600000] ' + CONFIG.siteName + ': Initializing...',
    '[    0.650000] JavaScript Engine: V8/' + (navigator.userAgent.match(/Chrome\/(\d+\.\d+)/) || ['', 'Unknown'])[1],
    '[    0.700000] Scanning for errors<span class="loading-dots"></span>'
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
[    ${(CONFIG.collectionDelay / 1000).toFixed(3)}] ========================================
[    ${(CONFIG.collectionDelay / 1000).toFixed(3)}] KERNEL PANIC - FATAL EXCEPTION DETECTED
[    ${(CONFIG.collectionDelay / 1000).toFixed(3)}] ========================================

<span class="panic-msg">*** STOP: ${errorCodesText}</span>

System Information:
-------------------
URL:        ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp:  ${new Date().toISOString()}
Platform:   ${navigator.platform}
Language:   ${navigator.language}
Online:     ${navigator.onLine}

Error Summary:
--------------
Total Errors:        ${errorQueue.length}
Console Logs:        ${consoleLogs.length} entries
Error Codes:         ${errorCodesText}

Detailed Error Trace:
---------------------
`;

  errorQueue.forEach((error, index) => {
    kernelPanic += `
<span class="error-detail">ERROR #${index + 1}: ${getErrorCode(error)}
Message:  ${error.message || 'Unknown error occurred'}`;
    
    if (error.filename) {
      kernelPanic += `
File:     ${error.filename}`;
    }
    
    if (error.line) {
      kernelPanic += `
Location: Line ${error.line}:${error.col || 0}`;
    }
    
    kernelPanic += `
Time:     ${error.timestamp}`;
    
    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(0, 5);
      kernelPanic += `
<span class="stack-trace">Stack Trace:
${stackLines.map(line => '  ' + line.trim()).join('\n')}</span>`;
    }
    
    kernelPanic += `</span>
`;
  });

  kernelPanic += `
<span class="separator">================================================================================</span>

Console Logs (Last ${Math.min(consoleLogs.length, 10)} entries):
-----------------`;

  consoleLogs.slice(-10).forEach(log => {
    kernelPanic += `
<span class="console-logs">[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}</span>`;
  });

  kernelPanic += `

<span class="separator">================================================================================</span>

Available Commands:
-------------------
  help          - Display available commands
  errors        - Show all error details
  logs          - Show all console logs
  info          - Show system information
  trace <n>     - Show stack trace for error #n
  clear         - Clear terminal output
  report        - Send error report via email
  reboot        - Restart application

<span class="separator">================================================================================</span>
`;

  output.innerHTML += kernelPanic;
  
  // Add terminal interface
  const terminalSection = document.createElement('div');
  terminalSection.className = 'terminal-section';
  terminalSection.innerHTML = `
    <div id="terminal-output"></div>
    <div class="terminal-prompt">
      <span>root@panic:~#</span>
      <input type="text" id="terminal-input" autofocus />
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
    }
  });
  
  input.focus();
}

// Execute terminal command
function executeCommand(command, outputElement) {
  const commandLine = document.createElement('div');
  commandLine.className = 'terminal-line';
  commandLine.innerHTML = `<span class="terminal-command">root@panic:~# ${escapeHtml(command)}</span>`;
  outputElement.appendChild(commandLine);
  
  const parts = command.split(' ');
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);
  
  const result = document.createElement('div');
  result.className = 'terminal-line';
  
  try {
    switch(cmd) {
      case 'help':
        result.innerHTML = `<span class="terminal-result">Available Commands:
  help          - Display this help message
  errors        - Show all error details
  logs          - Show all console logs
  info          - Show system information
  trace <n>     - Show stack trace for error #n
  clear         - Clear terminal output
  report        - Send error report via email
  reboot        - Restart application
  
You can also execute JavaScript expressions directly.</span>`;
        break;
        
      case 'errors':
        let errorsText = `Total Errors: ${errorQueue.length}\n\n`;
        errorQueue.forEach((error, index) => {
          errorsText += `ERROR #${index + 1}: ${getErrorCode(error)}\n`;
          errorsText += `  Message: ${error.message}\n`;
          if (error.filename) errorsText += `  File: ${error.filename}\n`;
          if (error.line) errorsText += `  Location: Line ${error.line}:${error.col || 0}\n`;
          errorsText += `  Time: ${error.timestamp}\n\n`;
        });
        result.innerHTML = `<span class="terminal-result">${escapeHtml(errorsText)}</span>`;
        break;
        
      case 'logs':
        let logsText = `Total Console Logs: ${consoleLogs.length}\n\n`;
        consoleLogs.forEach((log, index) => {
          logsText += `[${log.timestamp}] [${log.type.toUpperCase()}]\n${log.message}\n\n`;
        });
        result.innerHTML = `<span class="terminal-result">${escapeHtml(logsText)}</span>`;
        break;
        
      case 'info':
        const infoText = `System Information:
URL:              ${window.location.href}
User Agent:       ${navigator.userAgent}
Platform:         ${navigator.platform}
Language:         ${navigator.language}
Online Status:    ${navigator.onLine}
Screen:           ${window.screen.width}x${window.screen.height}
Viewport:         ${window.innerWidth}x${window.innerHeight}
Memory:           ${navigator.deviceMemory || 'Unknown'} GB
CPU Cores:        ${navigator.hardwareConcurrency}
Timestamp:        ${new Date().toISOString()}`;
        result.innerHTML = `<span class="terminal-result">${escapeHtml(infoText)}</span>`;
        break;
        
      case 'trace':
        const errorNum = parseInt(args[0]);
        if (isNaN(errorNum) || errorNum < 1 || errorNum > errorQueue.length) {
          result.innerHTML = `<span class="terminal-error">Invalid error number. Use: trace <1-${errorQueue.length}></span>`;
        } else {
          const error = errorQueue[errorNum - 1];
          let traceText = `Stack Trace for Error #${errorNum}:\n\n`;
          if (error.stack) {
            traceText += error.stack;
          } else {
            traceText += 'No stack trace available';
          }
          result.innerHTML = `<span class="terminal-result">${escapeHtml(traceText)}</span>`;
        }
        break;
        
      case 'clear':
        outputElement.innerHTML = '';
        return;
        
      case 'report':
        sendBugReport();
        result.innerHTML = `<span class="terminal-result">Opening email client with error report...</span>`;
        break;
        
      case 'reboot':
        result.innerHTML = `<span class="terminal-result">Rebooting system...</span>`;
        outputElement.appendChild(result);
        setTimeout(() => {
          location.reload();
        }, 1000);
        scrollTerminal();
        return;
        
      default:
        // Try to execute as JavaScript
        try {
          const evalResult = eval(command);
          result.innerHTML = `<span class="terminal-result">${escapeHtml(String(evalResult))}</span>`;
        } catch (err) {
          result.innerHTML = `<span class="terminal-error">Command not found: ${escapeHtml(cmd)}\nType 'help' for available commands.\n\nError: ${escapeHtml(err.message)}</span>`;
        }
    }
  } catch (err) {
    result.innerHTML = `<span class="terminal-error">Error executing command: ${escapeHtml(err.message)}</span>`;
  }
  
  outputElement.appendChild(result);
  scrollTerminal();
}

// Scroll terminal to bottom
function scrollTerminal() {
  const overlay = document.getElementById('error-overlay-content');
  if (overlay) {
    overlay.scrollTop = overlay.scrollHeight;
  }
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Send bug report
function sendBugReport() {
  const subject = `[${CONFIG.siteName}] KERNEL PANIC - Critical Error Report - ${new Date().toLocaleDateString()}`;
  
  const errorCodesText = [...new Set(errorQueue.map(err => getErrorCode(err)))].join(' | ');
  
  let body = `
KERNEL PANIC ERROR REPORT
=========================

Describe the steps to reproduce the issue here / Décrivez les étapes pour reproduire le problème ici:


========================================
STOP CODES: ${errorCodesText}
========================================

SYSTEM INFORMATION:
-------------------
URL:        ${window.location.href}
Date:       ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
Platform:   ${navigator.platform}
Language:   ${navigator.language}
Online:     ${navigator.onLine}

ERROR DETAILS (${errorQueue.length} errors):
--------------
`;

  errorQueue.forEach((error, index) => {
    body += `
ERROR #${index + 1} - ${getErrorCode(error)}
${'-'.repeat(60)}
${JSON.stringify(error, null, 2)}

`;
  });

  body += `
CONSOLE LOGS (${consoleLogs.length} entries):
--------------
${consoleLogs.map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`).join('\n')}

========================================
This error report was automatically generated by the kernel panic handler.
`;
  
  const mailtoLink = `mailto:${CONFIG.recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  window.location.href = mailtoLink;
}
