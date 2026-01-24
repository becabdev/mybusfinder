// Configuration
const CONFIG = {
  recipientEmail: 'bechir.abidi06@gmail.com',
  siteName: 'My Bus Finder 3X',
  maxLogs: 50
};

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
let lastError = null;
window.addEventListener('error', (e) => {
  lastError = {
    message: e.message,
    filename: e.filename,
    line: e.lineno,
    col: e.colno,
    stack: e.error?.stack
  };
  showErrorOverlay(lastError);
});

window.addEventListener('unhandledrejection', (e) => {
  lastError = {
    message: `Promise rejection: ${e.reason}`,
    stack: e.reason?.stack
  };
  showErrorOverlay(lastError);
});

// Show error overlay
function showErrorOverlay(error) {
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
        font-family: 'Roboto Mono', 'Courier New', monospace;
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
      
      #error-overlay .progress-bar {
        width: 100%;
        height: 4px;
        background: rgba(255, 255, 255, 0.3);
        position: relative;
        overflow: hidden;
      }
      
      #error-overlay .progress-bar::after {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 100%;
        background: white;
        animation: progress 3s ease-in-out infinite;
      }
      
      @keyframes progress {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
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
        <div class="progress-text">Collecting error information...</div>
        <div class="progress-bar"></div>
      </div>
      
      <div class="info-section">
        <div class="error-code">STOP CODE: CRITICAL_JAVASCRIPT_ERROR</div>
        <div class="info-line">If you contact support, please give them this info:</div>
      </div>
      
      <div class="error-details">${error.message || 'Unknown error occurred'}
${error.filename ? `\nFile: ${error.filename}` : ''}
${error.line ? `Location: Line ${error.line}:${error.col || 0}` : ''}
${error.stack ? `\n\nStack Trace:\n${error.stack}` : ''}
      </div>
      
      <div class="info-section">
        <div class="info-line">URL: ${window.location.href}</div>
        <div class="info-line">User Agent: ${navigator.userAgent}</div>
        <div class="info-line">Timestamp: ${new Date().toISOString()}</div>
        <div class="info-line">Console Logs Captured: ${consoleLogs.length} entries</div>
      </div>
      
      <div class="button-container">
        <button onclick="sendBugReport()">SEND ERROR REPORT</button>
        <button onclick="closeErrorOverlay()">RESTART</button>
      </div>
      
      <div class="qr-note">
        For more information about this issue and possible fixes, click "SEND ERROR REPORT".<br>
        This will open your email client with a detailed error report ready to send.
      </div>
      
      <div id="success-msg" style="display: none;"></div>
    </div>
  `;
  
  document.body.appendChild(overlay);
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
  const errorInfo = {
    error: lastError,
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    consoleLogs: consoleLogs
  };
  
  const subject = `[${CONFIG.siteName}] Critical Error Report - ${new Date().toLocaleDateString()}`;
  const body = `
CRITICAL ERROR REPORT
=====================

STOP CODE: CRITICAL_JAVASCRIPT_ERROR

URL: ${errorInfo.url}
Date: ${errorInfo.timestamp}
User Agent: ${errorInfo.userAgent}

ERROR DETAILS:
--------------
${JSON.stringify(lastError, null, 2)}

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

console.log('✓ Error reporting system initialized');

// Test error: throw new Error('Test error');
