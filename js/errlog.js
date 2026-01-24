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
  
  // Check constructor name
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
      @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap');
      
      #error-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #cc0000;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        padding: 20px;
        box-sizing: border-box;
      }
      
      #error-overlay-content {
        max-width: 900px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        text-align: left;
      }
      
      #error-overlay h1 {
        font-size: 120px;
        margin: 0 0 30px 0;
        font-weight: 700;
        letter-spacing: -5px;
      }
      
      #error-overlay h2 {
        font-size: 28px;
        margin: 0 0 40px 0;
        font-weight: 400;
        line-height: 1.4;
      }
      
      #error-overlay .progress-container {
        margin: 30px 0;
      }
      
      #error-overlay .progress-text {
        font-size: 16px;
        margin-bottom: 10px;
      }
      
      #error-overlay .progress-percentage {
        font-size: 24px;
        font-weight: 700;
        margin: 20px 0;
      }
      
      #error-overlay .progress-bar-bg {
        width: 100%;
        height: 4px;
        background: rgba(255, 255, 255, 0.3);
        position: relative;
        overflow: hidden;
      }
      
      #error-overlay .progress-bar-fill {
        height: 100%;
        width: 0%;
        background: white;
        transition: width 0.1s linear;
      }
      
      #error-overlay .info-section {
        margin: 30px 0;
        padding: 20px 0;
        border-top: 1px solid rgba(255, 255, 255, 0.3);
        border-bottom: 1px solid rgba(255, 255, 255, 0.3);
      }
      
      #error-overlay .info-line {
        margin: 8px 0;
        font-size: 15px;
        line-height: 1.6;
      }
      
      #error-overlay .error-details {
        background: rgba(0, 0, 0, 0.3);
        padding: 20px;
        border-left: 4px solid white;
        margin: 20px 0;
        font-size: 13px;
        line-height: 1.6;
        white-space: pre-wrap;
        word-break: break-word;
        max-height: 250px;
        overflow-y: auto;
      }
      
      #error-overlay .error-code {
        font-weight: 700;
        font-size: 16px;
        margin-bottom: 15px;
      }
      
      #error-overlay .error-item {
        margin-bottom: 15px;
        padding-bottom: 15px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      #error-overlay .error-item:last-child {
        border-bottom: none;
      }
      
      #error-overlay .button-container {
        margin-top: 40px;
        display: flex;
        gap: 20px;
      }
      
      #error-overlay button {
        padding: 15px 30px;
        border: 2px solid white;
        background: transparent;
        color: white;
        font-family: 'Roboto Mono', monospace;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      #error-overlay button:hover {
        background: white;
        color: #cc0000;
      }
      
      #error-overlay button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      #error-overlay .qr-note {
        margin-top: 40px;
        font-size: 13px;
        opacity: 0.8;
        line-height: 1.6;
      }
      
      #error-overlay .success-message {
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid white;
        padding: 15px;
        margin-top: 20px;
        text-align: center;
        font-size: 14px;
        animation: slideIn 0.3s ease;
      }
      
      #error-overlay .hidden {
        display: none;
      }
      
      @keyframes slideIn {
        from { transform: translateY(-10px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      #error-overlay::-webkit-scrollbar {
        width: 10px;
      }
      
      #error-overlay::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
      }
      
      #error-overlay::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.5);
      }
    </style>
    
    <div id="error-overlay-content">
      <h1>:(</h1>
      
      <h2>Your application ran into a problem and needs to send an error report. We're just collecting some error info, and then you can send it to us.</h2>
      
      <div class="progress-container">
        <div class="progress-percentage" id="progress-percent">0% complete</div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" id="progress-fill"></div>
        </div>
      </div>
      
      <div id="error-content" class="hidden">
        <div class="info-section">
          <div class="error-code" id="error-codes">STOP CODE: COLLECTING...</div>
          <div class="info-line">If you contact support, please give them this info:</div>
        </div>
        
        <div class="error-details" id="error-details"></div>
        
        <div class="info-section">
          <div class="info-line">URL: ${window.location.href}</div>
          <div class="info-line">User Agent: ${navigator.userAgent}</div>
          <div class="info-line">Timestamp: <span id="error-timestamp"></span></div>
          <div class="info-line">Console Logs Captured: <span id="log-count"></span> entries</div>
          <div class="info-line">Errors Detected: <span id="error-count"></span></div>
        </div>
        
        <div class="button-container">
          <button onclick="sendBugReport()" id="send-btn" disabled>SEND ERROR REPORT</button>
          <button onclick="closeErrorOverlay()" id="restart-btn" disabled>RESTART</button>
        </div>
        
        <div class="qr-note">
          For more information about this issue and possible fixes, click "SEND ERROR REPORT".<br>
          This will open your email client with a detailed error report ready to send.
        </div>
        
        <div id="success-msg" style="display: none;"></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  startProgressBar();
}

// Animate progress bar
function startProgressBar() {
  const fillElement = document.getElementById('progress-fill');
  const percentElement = document.getElementById('progress-percent');
  let progress = 0;
  const interval = 30; // Update every 30ms
  const increment = (100 / (CONFIG.collectionDelay / interval));
  
  const timer = setInterval(() => {
    progress += increment;
    if (progress >= 100) {
      progress = 100;
      clearInterval(timer);
    }
    fillElement.style.width = progress + '%';
    percentElement.textContent = Math.floor(progress) + '% complete';
  }, interval);
}

// Display collected errors
function displayCollectedErrors() {
  const errorContent = document.getElementById('error-content');
  const errorDetails = document.getElementById('error-details');
  const errorCodes = document.getElementById('error-codes');
  const errorTimestamp = document.getElementById('error-timestamp');
  const logCount = document.getElementById('log-count');
  const errorCount = document.getElementById('error-count');
  const sendBtn = document.getElementById('send-btn');
  const restartBtn = document.getElementById('restart-btn');
  
  // Show content
  errorContent.classList.remove('hidden');
  
  // Update counts
  errorTimestamp.textContent = new Date().toISOString();
  logCount.textContent = consoleLogs.length;
  errorCount.textContent = errorQueue.length;
  
  // Generate error codes
  const codes = errorQueue.map(err => getErrorCode(err));
  const uniqueCodes = [...new Set(codes)];
  errorCodes.textContent = 'STOP CODE' + (uniqueCodes.length > 1 ? 'S' : '') + ': ' + uniqueCodes.join(' | ');
  
  // Display all errors
  let detailsHTML = '';
  errorQueue.forEach((error, index) => {
    detailsHTML += `<div class="error-item">`;
    detailsHTML += `<strong>ERROR #${index + 1} - ${getErrorCode(error)}</strong>\n`;
    detailsHTML += `${error.message || 'Unknown error occurred'}`;
    if (error.filename) detailsHTML += `\nFile: ${error.filename}`;
    if (error.line) detailsHTML += `\nLocation: Line ${error.line}:${error.col || 0}`;
    if (error.stack) detailsHTML += `\n\nStack Trace:\n${error.stack}`;
    detailsHTML += `\nTime: ${error.timestamp}`;
    detailsHTML += `</div>`;
  });
  
  errorDetails.innerHTML = detailsHTML;
  
  // Enable buttons
  sendBtn.disabled = false;
  restartBtn.disabled = false;
}

// Close overlay
function closeErrorOverlay() {
  const overlay = document.getElementById('error-overlay');
  if (overlay) {
    overlay.remove();
    location.reload();
  }
}

// Send bug report
function sendBugReport() {
  const subject = `[${CONFIG.siteName}] Critical Error Report - ${new Date().toLocaleDateString()}`;
  
  const errorCodesText = [...new Set(errorQueue.map(err => getErrorCode(err)))].join(' | ');
  
  let body = `
Describe the steps to reproduce the issue here/décrivez les étapes pour reproduire le problème ici :

CRITICAL ERROR REPORT
=====================

STOP CODES: ${errorCodesText}

URL: ${window.location.href}
Date: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}

ERRORS DETECTED (${errorQueue.length}):
--------------
`;

  errorQueue.forEach((error, index) => {
    body += `
ERROR #${index + 1} - ${getErrorCode(error)}
${'-'.repeat(50)}
${JSON.stringify(error, null, 2)}

`;
  });

  body += `
CONSOLE LOGS (${consoleLogs.length} entries):
--------------
${consoleLogs.map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`).join('\n')}

---
This error report was automatically generated.
  `;
  
  const mailtoLink = `mailto:${CONFIG.recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  window.location.href = mailtoLink;
  
  const successMsg = document.getElementById('success-msg');
  successMsg.style.display = 'block';
  successMsg.className = 'success-message';
  successMsg.textContent = '✓ Opening your email client with the error report...';
}
