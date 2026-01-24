// Configuration
const CONFIG = {
  recipientEmail: 'bechir.abidi06@gmail.com',
  siteName: 'My Bus Finder 3X',
  maxLogs: 50
};

// Capture des logs console
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
    message: `Promise rejection : ${e.reason}`,
    stack: e.reason?.stack
  };
  showErrorOverlay(lastError);
});

function showErrorOverlay(error) {
  if (document.getElementById('error-overlay')) return;
  
  const overlay = document.createElement('div');
  overlay.id = 'error-overlay';
  overlay.innerHTML = `
    <style>
      #error-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        animation: fadeIn 0.3s ease;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      #error-overlay-content {
        background: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      }
      
      #error-overlay h2 {
        margin: 0 0 15px 0;
        color: #d32f2f;
        font-size: 24px;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      #error-overlay p {
        color: #555;
        line-height: 1.6;
        margin: 10px 0;
      }
      
      #error-overlay .error-details {
        background: #f5f5f5;
        padding: 15px;
        border-radius: 6px;
        margin: 15px 0;
        font-family: monospace;
        font-size: 13px;
        color: #333;
        max-height: 200px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-break: break-word;
      }
      
      #error-overlay .button-group {
        display: flex;
        gap: 10px;
        margin-top: 20px;
      }
      
      #error-overlay button {
        flex: 1;
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      #error-overlay .btn-report {
        background: #2196F3;
        color: white;
      }
      
      #error-overlay .btn-report:hover {
        background: #1976D2;
        transform: translateY(-1px);
      }
      
      #error-overlay .btn-close {
        background: #e0e0e0;
        color: #333;
      }
      
      #error-overlay .btn-close:hover {
        background: #bdbdbd;
      }
      
      #error-overlay .success-message {
        background: #4caf50;
        color: white;
        padding: 12px;
        border-radius: 6px;
        margin-top: 15px;
        text-align: center;
        animation: slideIn 0.3s ease;
      }
      
      @keyframes slideIn {
        from { transform: translateY(-10px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    </style>
    
    <div id="error-overlay-content">
      <h2>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        Une erreur est survenue
      </h2>
      
      <p>Désolé, une erreur inattendue s'est produite. Vous pouvez nous aider à résoudre ce problème en envoyant un rapport d'erreur.</p>
      
      <div class="error-details">
        <strong>Message:</strong> ${error.message || 'Erreur inconnue'}
        ${error.filename ? `\n<strong>Fichier:</strong> ${error.filename}` : ''}
        ${error.line ? `\n<strong>Ligne:</strong> ${error.line}:${error.col || 0}` : ''}
        ${error.stack ? `\n\n<strong>Stack:</strong>\n${error.stack}` : ''}
      </div>
      
      <div class="button-group">
        <button class="btn-report" onclick="sendBugReport()">
          📧 Envoyer un rapport
        </button>
        <button class="btn-close" onclick="closeErrorOverlay()">
          Fermer
        </button>
      </div>
      
      <div id="success-msg" style="display: none;"></div>
    </div>
  `;
  
  document.body.appendChild(overlay);
}

function closeErrorOverlay() {
  const overlay = document.getElementById('error-overlay');
  if (overlay) {
    overlay.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => overlay.remove(), 300);
  }
}

function sendBugReport() {
  const errorInfo = {
    error: lastError,
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    consoleLogs: consoleLogs
  };
  
  const subject = `[${CONFIG.siteName}] Rapport d'erreur - ${new Date().toLocaleDateString()}`;
  const body = `
RAPPORT D'ERREUR
================

URL: ${errorInfo.url}
Date: ${errorInfo.timestamp}
Navigateur: ${errorInfo.userAgent}

ERREUR:
-------
${JSON.stringify(lastError, null, 2)}

LOGS CONSOLE (${consoleLogs.length} entrées):
-------------
${consoleLogs.map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`).join('\n')}
  `;
  
  const mailtoLink = `mailto:${CONFIG.recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  window.location.href = mailtoLink;
  
  const successMsg = document.getElementById('success-msg');
  successMsg.style.display = 'block';
  successMsg.className = 'success-message';
  successMsg.textContent = '✓ Votre client mail va s\'ouvrir avec le rapport prêt à être envoyé.';
}

// Ajout au CSS pour fadeOut
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;
document.head.appendChild(style);

console.log('✓ Système de rapport d\'erreur initialisé');
