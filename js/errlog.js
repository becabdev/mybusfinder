// Configuration
const CONFIG = {
  recipientEmail: 'bechir.abidi06@gmail.com',
  siteName: 'My Bus Finder 3X',
  maxLogs: 100,
  collectionDelay: 3000 
};

// Error codes mapping with detailed descriptions
const ERROR_CODES = {
  'TypeError': {
    code: 'TYPE_MISMATCH_EXCEPTION',
    description: 'An operation was performed on an incompatible data type',
    severity: 'HIGH'
  },
  'ReferenceError': {
    code: 'UNDEFINED_REFERENCE_ERROR',
    description: 'Reference to an undefined variable or object',
    severity: 'HIGH'
  },
  'SyntaxError': {
    code: 'SYNTAX_PARSE_FAILURE',
    description: 'JavaScript syntax error detected during parsing',
    severity: 'CRITICAL'
  },
  'RangeError': {
    code: 'OUT_OF_BOUNDS_ERROR',
    description: 'Value is not in the set or range of allowed values',
    severity: 'MEDIUM'
  },
  'URIError': {
    code: 'INVALID_URI_FORMAT',
    description: 'Malformed URI encoding or decoding',
    severity: 'MEDIUM'
  },
  'EvalError': {
    code: 'EVAL_EXECUTION_FAILED',
    description: 'Error occurred during eval() execution',
    severity: 'HIGH'
  },
  'Promise': {
    code: 'UNHANDLED_PROMISE_REJECTION',
    description: 'Promise was rejected without a rejection handler',
    severity: 'HIGH'
  },
  'Network': {
    code: 'NETWORK_CONNECTION_FAILED',
    description: 'Network request failed or timed out',
    severity: 'MEDIUM'
  },
  'Timeout': {
    code: 'REQUEST_TIMEOUT_EXCEEDED',
    description: 'Operation exceeded maximum allowed time',
    severity: 'MEDIUM'
  },
  'default': {
    code: 'CRITICAL_JAVASCRIPT_ERROR',
    description: 'Unclassified critical error occurred',
    severity: 'CRITICAL'
  }
};

// Get error code and details
function getErrorInfo(error) {
  if (!error || !error.message) return ERROR_CODES.default;
  
  const message = error.message.toLowerCase();
  
  for (const [key, info] of Object.entries(ERROR_CODES)) {
    if (key !== 'default' && message.includes(key.toLowerCase())) {
      return info;
    }
  }
  
  if (error.name && ERROR_CODES[error.name]) {
    return ERROR_CODES[error.name];
  }
  
  return ERROR_CODES.default;
}

// System information gathering
function getSystemInfo() {
  const nav = navigator;
  const screen = window.screen;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  
  return {
    platform: nav.platform,
    userAgent: nav.userAgent,
    language: nav.language,
    languages: nav.languages,
    cookiesEnabled: nav.cookieEnabled,
    doNotTrack: nav.doNotTrack,
    hardwareConcurrency: nav.hardwareConcurrency,
    deviceMemory: nav.deviceMemory || 'Unknown',
    maxTouchPoints: nav.maxTouchPoints,
    vendor: nav.vendor,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    online: nav.onLine,
    connectionType: connection ? connection.effectiveType : 'Unknown',
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    documentReadyState: document.readyState,
    referrer: document.referrer || 'None',
    protocol: window.location.protocol,
    localStorage: typeof(Storage) !== "undefined",
    sessionStorage: typeof(Storage) !== "undefined",
    indexedDB: !!window.indexedDB,
    serviceWorker: 'serviceWorker' in navigator,
    webGL: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      } catch(e) {
        return false;
      }
    })()
  };
}

// Performance metrics
function getPerformanceMetrics() {
  if (!window.performance) return null;
  
  const perf = window.performance;
  const navigation = perf.getEntriesByType('navigation')[0];
  const memory = perf.memory;
  
  return {
    loadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 'N/A',
    domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 'N/A',
    timeToInteractive: navigation ? navigation.domInteractive - navigation.fetchStart : 'N/A',
    memoryUsed: memory ? (memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB' : 'N/A',
    memoryLimit: memory ? (memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB' : 'N/A',
    resourceCount: perf.getEntriesByType('resource').length
  };
}

// Capture console logs with enhanced details
const consoleLogs = [];
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug
};

['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
  console[method] = function(...args) {
    const stack = new Error().stack;
    consoleLogs.push({
      type: method,
      message: args.map(arg => {
        try {
          return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg);
        } catch(e) {
          return String(arg);
        }
      }).join(' '),
      timestamp: new Date().toISOString(),
      stack: stack
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
    type: 'runtime_error',
    message: e.message,
    filename: e.filename,
    line: e.lineno,
    col: e.colno,
    stack: e.error?.stack,
    name: e.error?.name,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    errorInfo: getErrorInfo(e.error)
  };
  
  errorQueue.push(error);
  
  if (!isCollecting) {
    startErrorCollection();
  }
});

window.addEventListener('unhandledrejection', (e) => {
  const error = {
    type: 'promise_rejection',
    message: `Promise rejection: ${e.reason}`,
    stack: e.reason?.stack,
    name: 'Promise',
    timestamp: new Date().toISOString(),
    url: window.location.href,
    errorInfo: getErrorInfo({message: 'Promise', name: 'Promise'})
  };
  
  errorQueue.push(error);
  
  if (!isCollecting) {
    startErrorCollection();
  }
});

// Start collecting errors
function startErrorCollection() {
  isCollecting = true;
  showErrorOverlay();
  
  collectionTimeout = setTimeout(() => {
    isCollecting = false;
    displayCollectedErrors();
  }, CONFIG.collectionDelay);
}

// Show macOS-style error overlay
function showErrorOverlay() {
  if (document.getElementById('error-overlay')) return;
  
  const overlay = document.createElement('div');
  overlay.id = 'error-overlay';
  overlay.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      #error-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        animation: fadeIn 0.3s ease;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      #error-modal {
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(40px);
        -webkit-backdrop-filter: blur(40px);
        border-radius: 20px;
        box-shadow: 0 50px 100px rgba(0, 0, 0, 0.3);
        max-width: 800px;
        width: 100%;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      @keyframes slideUp {
        from { 
          transform: translateY(50px);
          opacity: 0;
        }
        to { 
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      .modal-header {
        padding: 30px 40px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        background: linear-gradient(to bottom, #ffffff, #fafafa);
      }
      
      .modal-icon {
        width: 64px;
        height: 64px;
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
        box-shadow: 0 10px 30px rgba(240, 147, 251, 0.3);
      }
      
      .modal-icon svg {
        width: 36px;
        height: 36px;
        fill: white;
      }
      
      .modal-title {
        font-size: 28px;
        font-weight: 700;
        color: #1a1a1a;
        margin-bottom: 8px;
        letter-spacing: -0.5px;
      }
      
      .modal-subtitle {
        font-size: 15px;
        color: #666;
        font-weight: 400;
        line-height: 1.6;
      }
      
      .modal-body {
        padding: 30px 40px;
        overflow-y: auto;
        flex: 1;
      }
      
      .progress-section {
        margin-bottom: 30px;
      }
      
      .progress-label {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        font-size: 13px;
        color: #666;
        font-weight: 500;
      }
      
      .progress-bar-container {
        height: 6px;
        background: #e8e8e8;
        border-radius: 10px;
        overflow: hidden;
      }
      
      .progress-bar {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        border-radius: 10px;
        transition: width 0.1s linear;
      }
      
      .info-card {
        background: #f8f9fa;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        border: 1px solid #e8e8e8;
      }
      
      .info-card-title {
        font-size: 13px;
        font-weight: 600;
        color: #1a1a1a;
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      
      .info-item {
        display: flex;
        flex-direction: column;
      }
      
      .info-label {
        font-size: 11px;
        color: #999;
        font-weight: 500;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .info-value {
        font-size: 13px;
        color: #1a1a1a;
        font-weight: 500;
        word-break: break-word;
      }
      
      .error-list {
        background: #fff;
        border-radius: 12px;
        border: 1px solid #e8e8e8;
        overflow: hidden;
      }
      
      .error-item {
        padding: 20px;
        border-bottom: 1px solid #f0f0f0;
      }
      
      .error-item:last-child {
        border-bottom: none;
      }
      
      .error-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      
      .error-code {
        font-size: 13px;
        font-weight: 700;
        color: #f5576c;
        background: rgba(245, 87, 108, 0.1);
        padding: 4px 10px;
        border-radius: 6px;
      }
      
      .error-severity {
        font-size: 11px;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 4px;
        text-transform: uppercase;
      }
      
      .severity-critical {
        background: #ff4444;
        color: white;
      }
      
      .severity-high {
        background: #ff8800;
        color: white;
      }
      
      .severity-medium {
        background: #ffbb00;
        color: #1a1a1a;
      }
      
      .error-message {
        font-size: 14px;
        color: #1a1a1a;
        margin-bottom: 12px;
        line-height: 1.6;
        font-weight: 500;
      }
      
      .error-meta {
        display: flex;
        gap: 20px;
        font-size: 12px;
        color: #999;
        margin-bottom: 12px;
      }
      
      .error-stack {
        background: #2d2d2d;
        color: #e8e8e8;
        padding: 12px;
        border-radius: 8px;
        font-family: 'Menlo', 'Monaco', monospace;
        font-size: 11px;
        line-height: 1.6;
        overflow-x: auto;
        margin-top: 12px;
        max-height: 150px;
        overflow-y: auto;
      }
      
      .modal-footer {
        padding: 20px 40px;
        border-top: 1px solid rgba(0, 0, 0, 0.08);
        background: #fafafa;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      
      .btn {
        padding: 12px 24px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: all 0.2s ease;
        font-family: 'Inter', sans-serif;
      }
      
      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }
      
      .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
      }
      
      .btn-secondary {
        background: white;
        color: #1a1a1a;
        border: 1px solid #e8e8e8;
      }
      
      .btn-secondary:hover:not(:disabled) {
        background: #f8f9fa;
      }
      
      .success-banner {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px;
        border-radius: 10px;
        margin-top: 20px;
        text-align: center;
        font-size: 14px;
        font-weight: 500;
        display: none;
        animation: slideIn 0.3s ease;
      }
      
      @keyframes slideIn {
        from { transform: translateY(-10px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      .hidden {
        display: none !important;
      }
      
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      ::-webkit-scrollbar-track {
        background: #f0f0f0;
      }
      
      ::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: 10px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: #999;
      }
    </style>
    
    <div id="error-modal">
      <div class="modal-header">
        <div class="modal-icon">
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
        <h1 class="modal-title">The app crashed</h1>
        <h2 class="modal-title">L'application a planté</h2>
        <p class="modal-subtitle">We're collecting diagnostic information to help resolve this issue. This will only take a moment.</p>
        <p class="modal-subtitle">Nous collectons des informations de diagnostic pour nous aider à corriger ce bug. Pour envoyer le rapport, appuyez sur "Send Report to BecabDev".</p>
      </div>
      
      <div class="modal-body">
        <div id="progress-section" class="progress-section">
          <div class="progress-label">
            <span>Collecting diagnostic data...</span>
            <span id="progress-text">0%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar" id="progress-bar"></div>
          </div>
        </div>
        
        <div id="error-content" class="hidden">
          <div class="info-card">
            <div class="info-card-title">Problem Details</div>
            <div id="error-summary"></div>
          </div>
          
          <div class="info-card">
            <div class="info-card-title">System Information</div>
            <div class="info-grid" id="system-info"></div>
          </div>
          
          <div class="info-card">
            <div class="info-card-title">Performance Metrics</div>
            <div class="info-grid" id="performance-info"></div>
          </div>
          
          <div class="info-card">
            <div class="info-card-title">Error Details</div>
            <div class="error-list" id="error-list"></div>
          </div>
          
          <div class="success-banner" id="success-banner">
            ✓ Opening your email client with the detailed diagnostic report...
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeErrorOverlay()" id="close-btn" disabled>Ignore</button>
        <button class="btn btn-primary" onclick="sendBugReport()" id="send-btn" disabled>Send Report to BecabDev</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  startProgressBar();
}

// Animate progress bar
function startProgressBar() {
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  let progress = 0;
  const interval = 30;
  const increment = (100 / (CONFIG.collectionDelay / interval));
  
  const timer = setInterval(() => {
    progress += increment;
    if (progress >= 100) {
      progress = 100;
      clearInterval(timer);
    }
    progressBar.style.width = progress + '%';
    progressText.textContent = Math.floor(progress) + '%';
  }, interval);
}

// Display collected errors with detailed information
function displayCollectedErrors() {
  const errorContent = document.getElementById('error-content');
  const errorSummary = document.getElementById('error-summary');
  const systemInfo = document.getElementById('system-info');
  const performanceInfo = document.getElementById('performance-info');
  const errorList = document.getElementById('error-list');
  const sendBtn = document.getElementById('send-btn');
  const closeBtn = document.getElementById('close-btn');
  const progressSection = document.getElementById('progress-section');
  
  progressSection.classList.add('hidden');
  errorContent.classList.remove('hidden');
  
  // Error Summary
  const codes = errorQueue.map(err => err.errorInfo.code);
  const uniqueCodes = [...new Set(codes)];
  const timestamp = new Date().toLocaleString();
  
  errorSummary.innerHTML = `
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Error Codes</div>
        <div class="info-value">${uniqueCodes.join(', ')}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Total Errors</div>
        <div class="info-value">${errorQueue.length}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Timestamp</div>
        <div class="info-value">${timestamp}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Console Logs</div>
        <div class="info-value">${consoleLogs.length} entries</div>
      </div>
    </div>
  `;
  
  // System Information
  const sysInfo = getSystemInfo();
  systemInfo.innerHTML = `
    <div class="info-item">
      <div class="info-label">Platform</div>
      <div class="info-value">${sysInfo.platform}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Browser</div>
      <div class="info-value">${sysInfo.vendor}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Language</div>
      <div class="info-value">${sysInfo.language}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Screen Resolution</div>
      <div class="info-value">${sysInfo.screenResolution}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Viewport Size</div>
      <div class="info-value">${sysInfo.viewportSize}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Color Depth</div>
      <div class="info-value">${sysInfo.colorDepth}-bit</div>
    </div>
    <div class="info-item">
      <div class="info-label">Pixel Ratio</div>
      <div class="info-value">${sysInfo.pixelRatio}x</div>
    </div>
    <div class="info-item">
      <div class="info-label">Timezone</div>
      <div class="info-value">${sysInfo.timezone}</div>
    </div>
    <div class="info-item">
      <div class="info-label">CPU Cores</div>
      <div class="info-value">${sysInfo.hardwareConcurrency}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Device Memory</div>
      <div class="info-value">${sysInfo.deviceMemory} GB</div>
    </div>
    <div class="info-item">
      <div class="info-label">Connection</div>
      <div class="info-value">${sysInfo.connectionType}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Online Status</div>
      <div class="info-value">${sysInfo.online ? 'Online' : 'Offline'}</div>
    </div>
  `;
  
  // Performance Metrics
  const perfMetrics = getPerformanceMetrics();
  if (perfMetrics) {
    performanceInfo.innerHTML = `
      <div class="info-item">
        <div class="info-label">Page Load Time</div>
        <div class="info-value">${perfMetrics.loadTime} ms</div>
      </div>
      <div class="info-item">
        <div class="info-label">DOM Ready</div>
        <div class="info-value">${perfMetrics.domContentLoaded} ms</div>
      </div>
      <div class="info-item">
        <div class="info-label">Interactive Time</div>
        <div class="info-value">${perfMetrics.timeToInteractive} ms</div>
      </div>
      <div class="info-item">
        <div class="info-label">Memory Used</div>
        <div class="info-value">${perfMetrics.memoryUsed}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Memory Limit</div>
        <div class="info-value">${perfMetrics.memoryLimit}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Resources Loaded</div>
        <div class="info-value">${perfMetrics.resourceCount}</div>
      </div>
    `;
  }
  
  // Error List
  let errorListHTML = '';
  errorQueue.forEach((error, index) => {
    errorListHTML += `
      <div class="error-item">
        <div class="error-header">
          <div class="error-code">${error.errorInfo.code}</div>
          <div class="error-severity severity-${error.errorInfo.severity.toLowerCase()}">${error.errorInfo.severity}</div>
        </div>
        <div class="error-message">${error.message}</div>
        <div class="error-meta">
          <span>Error #${index + 1}</span>
          <span>Type: ${error.type}</span>
          ${error.filename ? `<span>File: ${error.filename}</span>` : ''}
          ${error.line ? `<span>Line ${error.line}:${error.col}</span>` : ''}
        </div>
        <div class="info-label">Description</div>
        <div class="info-value" style="margin-bottom: 12px;">${error.errorInfo.description}</div>
        ${error.stack ? `<div class="error-stack">${error.stack}</div>` : ''}
      </div>
    `;
  });
  
  errorList.innerHTML = errorListHTML;
  
  sendBtn.disabled = false;
  closeBtn.disabled = false;
}

// Close overlay
function closeErrorOverlay() {
  const overlay = document.getElementById('error-overlay');
  if (overlay) {
    overlay.remove();
    location.reload();
  }
}

// Send comprehensive bug report
function sendBugReport() {
  const sysInfo = getSystemInfo();
  const perfMetrics = getPerformanceMetrics();
  const timestamp = new Date();
  
  const subject = `[${CONFIG.siteName}] Panic Report - ${timestamp.toLocaleDateString()}`;
  
  const errorCodesText = [...new Set(errorQueue.map(err => err.errorInfo.code))].join(', ');
  
  let body = `
═══════════════════════════════════════════════════════════════
                      PANIC ERROR REPORT
                      ${CONFIG.siteName}
═══════════════════════════════════════════════════════════════

Please describe what you were doing when this error occurred / merci de décrire ce que vous étiez en train de faire lorsque ça a planté :
_______________________________________________________________


═══════════════════════════════════════════════════════════════
EXECUTIVE SUMMARY
═══════════════════════════════════════════════════════════════

Error Codes : ${errorCodesText}
Total Errors: ${errorQueue.length}
Timestamp: ${timestamp.toISOString()}
URL: ${window.location.href}

═══════════════════════════════════════════════════════════════
SYSTEM INFORMATION
═══════════════════════════════════════════════════════════════

Platform: ${sysInfo.platform}
User Agent: ${sysInfo.userAgent}
Browser Vendor: ${sysInfo.vendor}
Language: ${sysInfo.language} (${sysInfo.languages.join(', ')})
Screen Resolution: ${sysInfo.screenResolution}
Viewport Size: ${sysInfo.viewportSize}
Color Depth: ${sysInfo.colorDepth}-bit
Pixel Ratio: ${sysInfo.pixelRatio}x
Timezone: ${sysInfo.timezone} (UTC${sysInfo.timezoneOffset > 0 ? '-' : '+'}${Math.abs(sysInfo.timezoneOffset / 60)})
CPU Cores: ${sysInfo.hardwareConcurrency}
Device Memory: ${sysInfo.deviceMemory} GB
Max Touch Points: ${sysInfo.maxTouchPoints}
Cookies Enabled: ${sysInfo.cookiesEnabled}
Do Not Track: ${sysInfo.doNotTrack}
Online Status: ${sysInfo.online ? 'Online' : 'Offline'}
Connection Type: ${sysInfo.connectionType}
Protocol: ${sysInfo.protocol}
Referrer: ${sysInfo.referrer}
Document Ready State: ${sysInfo.documentReadyState}

Storage Support:
- LocalStorage: ${sysInfo.localStorage ? 'Supported' : 'Not Supported'}
- SessionStorage: ${sysInfo.sessionStorage ? 'Supported' : 'Not Supported'}
- IndexedDB: ${sysInfo.indexedDB ? 'Supported' : 'Not Supported'}

Features:
- Service Worker: ${sysInfo.serviceWorker ? 'Supported' : 'Not Supported'}
- WebGL: ${sysInfo.webGL ? 'Supported' : 'Not Supported'}

═══════════════════════════════════════════════════════════════
PERFORMANCE METRICS
═══════════════════════════════════════════════════════════════

${perfMetrics ? `
Page Load Time: ${perfMetrics.loadTime} ms
DOM Content Loaded: ${perfMetrics.domContentLoaded} ms
Time to Interactive: ${perfMetrics.timeToInteractive} ms
Memory Used: ${perfMetrics.memoryUsed}
Memory Limit: ${perfMetrics.memoryLimit}
Resources Loaded: ${perfMetrics.resourceCount}
` : 'Performance metrics not available'}

═══════════════════════════════════════════════════════════════
DETAILED ERROR INFORMATION (${errorQueue.length} ERRORS)
═══════════════════════════════════════════════════════════════

`;

  errorQueue.forEach((error, index) => {
    body += `
┌──────────────────────────────────────────────────────────────┐
│ ERROR #${index + 1} - ${error.errorInfo.code}
│ Severity: ${error.errorInfo.severity}
└──────────────────────────────────────────────────────────────┘

Type: ${error.type}
Error Name: ${error.name || 'N/A'}
Message: ${error.message}
Description: ${error.errorInfo.description}
Timestamp: ${error.timestamp}
URL: ${error.url}

${error.filename ? `File: ${error.filename}` : ''}
${error.line ? `Location: Line ${error.line}, Column ${error.col}` : ''}

Stack Trace:
${error.stack || 'No stack trace available'}

Raw Error Data:
${JSON.stringify(error, null, 2)}

`;
  });

  body += `
═══════════════════════════════════════════════════════════════
CONSOLE LOGS (${consoleLogs.length} ENTRIES)
═══════════════════════════════════════════════════════════════

`;

  consoleLogs.forEach((log, index) => {
    body += `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}
`;
  });

  body += `
═══════════════════════════════════════════════════════════════
ADDITIONAL DEBUGGING INFORMATION
═══════════════════════════════════════════════════════════════

Window Properties:
- Inner Width: ${window.innerWidth}px
- Inner Height: ${window.innerHeight}px
- Outer Width: ${window.outerWidth}px
- Outer Height: ${window.outerHeight}px
- Scroll Position: X=${window.scrollX}px, Y=${window.scrollY}px
- Device Pixel Ratio: ${window.devicePixelRatio}

Document Properties:
- Ready State: ${document.readyState}
- Visibility State: ${document.visibilityState}
- Cookie: ${document.cookie ? 'Present' : 'None'}
- Domain: ${document.domain}
- Character Set: ${document.characterSet}

Location Properties:
- Full URL: ${window.location.href}
- Protocol: ${window.location.protocol}
- Hostname: ${window.location.hostname}
- Port: ${window.location.port || 'Default'}
- Pathname: ${window.location.pathname}
- Search: ${window.location.search || 'None'}
- Hash: ${window.location.hash || 'None'}

Navigator Properties (Extended):
- App Name: ${navigator.appName}
- App Version: ${navigator.appVersion}
- Platform: ${navigator.platform}
- Product: ${navigator.product}
- Vendor: ${navigator.vendor}
- Vendor Sub: ${navigator.vendorSub || 'N/A'}

═══════════════════════════════════════════════════════════════
REPORT METADATA
═══════════════════════════════════════════════════════════════

Report Generated: ${timestamp.toISOString()}
Report Format: Comprehensive Diagnostic v2.0
Application: ${CONFIG.siteName}
Collector Version: 2.0.0

═══════════════════════════════════════════════════════════════

This diagnostic report was automatically generated to help 
identify and resolve the issue. All information collected is 
used solely for debugging purposes.

For privacy: This report may contain URLs and system information.
Please review before sending if you have privacy concerns.

═══════════════════════════════════════════════════════════════

Ce rapport de diagnostic a été généré automatiquement pour aider
à identifier et résoudre le bug. Toutes les informations collectées
sont utilisées exclusivement pour le débogage.

Pour votre confidentialité : ce rapport pourrait contenir des liens
et des informations systèmes. Merci de relire avant d'envoyer
si vous vous préoccupez de certaines informations concernant votre
terminal.

═══════════════════════════════════════════════════════════════

██████╗ ███████╗ ██████╗ █████╗ ██████╗ ██████╗ ███████╗██╗   ██╗
██╔══██╗██╔════╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██║   ██║
██████╔╝█████╗  ██║     ███████║██████╔╝██║  ██║█████╗  ██║   ██║
██╔══██╗██╔══╝  ██║     ██╔══██║██╔══██╗██║  ██║██╔══╝  ╚██╗ ██╔╝
██████╔╝███████╗╚██████╗██║  ██║██████╔╝██████╔╝███████╗ ╚████╔╝ 
╚═════╝ ╚══════╝ ╚═════╝╚═╝  ╚═╝╚═════╝ ╚═════╝ ╚══════╝  ╚═══╝  
                                                                 
BecabDev - Mohamed Bechir ABIDI
22 boulevard du Riou, 06400 Cannes
bechir.abidi06@gmail.com

Immatriculé au RCS, SIREN 999 304 751
  `;
  
  const mailtoLink = `mailto:${CONFIG.recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  window.location.href = mailtoLink;
  
  const successBanner = document.getElementById('success-banner');
  successBanner.style.display = 'block';
  
  setTimeout(() => {
    successBanner.style.display = 'none';
  }, 5000);
}

// Expose functions globally
window.closeErrorOverlay = closeErrorOverlay;
window.sendBugReport = sendBugReport;
