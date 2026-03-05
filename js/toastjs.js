// Simple Toast Notifications — minimal & clean
// Usage: toast.error/info/warning/success('Message...', { title, duration, buttons });
// By Becab Systems reworked minimal edition

class ToastNotification {
  constructor(options = {}) {
    this.options = {
      duration:  options.duration  ?? 4000,
      maxToasts: options.maxToasts ?? 5,
      position:  options.position  || 'bottom-right',
      ...options
    };
    this.toasts    = [];
    this.container = null;
    this._initStyles();
    this._initContainer();
  }

  _initStyles() {
    if (document.getElementById('toast-macos-css')) return;
    const style = document.createElement('style');
    style.id = 'toast-macos-css';
    style.textContent = `
      @keyframes toastSlideIn {
        0%   { opacity: 0; transform: translateY(16px) scale(0.92) rotateX(6deg); filter: blur(4px); }
        60%  { opacity: 1; transform: translateY(-3px) scale(1.01) rotateX(0deg); filter: blur(0px); }
        80%  { transform: translateY(1px) scale(0.995); }
        100% { opacity: 1; transform: translateY(0) scale(1) rotateX(0deg); filter: blur(0px); }
      }

      @keyframes toastSlideOut {
        0%   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
        100% { opacity: 0; transform: translateY(10px) scale(0.94); filter: blur(3px); }
      }

      .toast-wrap {
        position: fixed;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 20px;
        pointer-events: none;
        perspective: 600px;
      }
      .toast-wrap.top-right    { top: 0;    right: 0;  align-items: flex-end; }
      .toast-wrap.top-left     { top: 0;    left: 0;   align-items: flex-start; }
      .toast-wrap.bottom-right { bottom: 0; right: 0;  align-items: flex-end; }
      .toast-wrap.bottom-left  { bottom: 0; left: 0;   align-items: flex-start; }

      .toast-item {
        pointer-events: all;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 13px 16px;
        border-radius: 14px;
        min-width: 260px;
        max-width: 360px;
        font-family: -apple-system, 'Helvetica Neue', sans-serif;
        font-size: 13.5px;
        font-weight: 400;
        line-height: 1.45;
        letter-spacing: -0.01em;
        color: rgba(255,255,255,0.92);

        background: rgba(40, 40, 42, 0.76);
        backdrop-filter: saturate(200%) blur(32px);
        -webkit-backdrop-filter: saturate(200%) blur(32px);

        border: 1px solid rgba(255,255,255,0.10);
        box-shadow:
          0 2px 6px rgba(0,0,0,0.18),
          0 8px 32px rgba(0,0,0,0.32),
          0 0 0 0.5px rgba(0,0,0,0.4),
          inset 0 1px 0 rgba(255,255,255,0.08);

        cursor: default;
        opacity: 0;
        position: relative;
        overflow: hidden;
        will-change: transform, opacity, filter;
      }

      .toast-item.show {
        animation: toastSlideIn 0.42s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }

      .toast-item.hide {
        animation: toastSlideOut 0.24s cubic-bezier(0.4, 0, 1, 1) forwards;
      }

      .toast-icon {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-top: 1px;
      }

      .toast-item.success .toast-icon { background: #30d158; }
      .toast-item.error   .toast-icon { background: #ff453a; }
      .toast-item.warning .toast-icon { background: #ffd60a; }
      .toast-item.info    .toast-icon { background: rgba(255,255,255,0.15); }

      .toast-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
      }

      .toast-title {
        font-weight: 590;
        font-size: 13.5px;
        letter-spacing: -0.015em;
        color: rgba(255,255,255,0.95);
      }

      .toast-msg {
        font-size: 12.5px;
        color: rgba(255,255,255,0.55);
        line-height: 1.4;
      }

      .toast-item.no-title .toast-msg {
        font-size: 13.5px;
        color: rgba(255,255,255,0.88);
      }

      /* Buttons */
      .toast-buttons {
        display: flex;
        gap: 6px;
        margin-top: 9px;
        flex-wrap: wrap;
      }

      .toast-btn {
        display: inline-flex;
        align-items: center;
        padding: 5px 11px;
        border-radius: 7px;
        font-family: -apple-system, 'Helvetica Neue', sans-serif;
        font-size: 12px;
        font-weight: 510;
        letter-spacing: -0.01em;
        border: none;
        cursor: pointer;
        transition: background 0.15s, transform 0.1s, opacity 0.15s;
        line-height: 1;
      }

      .toast-btn:active { transform: scale(0.96); }

      .toast-btn.primary {
        background: rgba(255,255,255,0.18);
        color: rgba(255,255,255,0.95);
      }
      .toast-btn.primary:hover { background: rgba(255,255,255,0.26); }

      .toast-btn.ghost {
        background: transparent;
        color: rgba(255,255,255,0.45);
      }
      .toast-btn.ghost:hover { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.07); }

      .toast-item.success .toast-btn.primary { background: rgba(48,209,88,0.25); color: #7effa3; }
      .toast-item.success .toast-btn.primary:hover { background: rgba(48,209,88,0.35); }

      .toast-item.error .toast-btn.primary { background: rgba(255,69,58,0.25); color: #ff9f9b; }
      .toast-item.error .toast-btn.primary:hover { background: rgba(255,69,58,0.35); }

      .toast-item.warning .toast-btn.primary { background: rgba(255,214,10,0.2); color: #ffe566; }
      .toast-item.warning .toast-btn.primary:hover { background: rgba(255,214,10,0.3); }

      .toast-close {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: rgba(255,255,255,0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.15s, background 0.15s;
        margin-left: 2px;
        margin-top: 2px;
      }

      .toast-item:hover .toast-close { opacity: 1; }
      .toast-close:hover { background: rgba(255,255,255,0.2); }

      .toast-progress {
        position: absolute;
        bottom: 0; left: 0;
        height: 2px;
        width: 100%;
        transform-origin: left;
        transform: scaleX(1);
        border-radius: 0 0 14px 14px;
        background: rgba(255,255,255,0.12);
      }

      .toast-item.success .toast-progress { background: rgba(48,209,88,0.4); }
      .toast-item.error   .toast-progress { background: rgba(255,69,58,0.4); }
      .toast-item.warning .toast-progress { background: rgba(255,214,10,0.4); }
    `;
    document.head.appendChild(style);
  }

  _initContainer() {
    const id = `toast-macos-${this.options.position}`;
    this.container = document.getElementById(id);
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = id;
      this.container.className = `toast-wrap ${this.options.position}`;
      document.body.appendChild(this.container);
    }
  }

  _icon(type) {
    const icons = {
      success: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
      error:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
      warning: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1c1c1e" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="17" r="1" fill="#1c1c1e" stroke="none"/></svg>`,
      info:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.65)" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="12" x2="12" y2="17"/><circle cx="12" cy="8" r="1" fill="rgba(255,255,255,0.65)" stroke="none"/></svg>`,
    };
    return icons[type] || icons.info;
  }

  // buttons: [{ label: 'Annuler', style: 'ghost', onClick: (close) => {} }, { label: 'OK', style: 'primary', onClick: (close) => {} }]
  show(message, type = 'info', customOptions = {}) {
    if (this.toasts.length >= this.options.maxToasts) {
      this._remove(this.toasts[0], true);
    }

    const duration = customOptions.duration ?? this.options.duration;
    const title    = customOptions.title || null;
    const buttons  = customOptions.buttons || [];

    const el = document.createElement('div');
    el.className = `toast-item ${type}${!title ? ' no-title' : ''}`;

    const buttonsHTML = buttons.length > 0
      ? `<div class="toast-buttons">
          ${buttons.map((btn, i) =>
            `<button class="toast-btn ${btn.style || 'primary'}" data-btn-index="${i}">${btn.label}</button>`
          ).join('')}
        </div>`
      : '';

    el.innerHTML = `
      <div class="toast-icon">${this._icon(type)}</div>
      <div class="toast-body">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-msg">${message}</div>
        ${buttonsHTML}
      </div>
      <div class="toast-close">
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </div>
      <div class="toast-progress"></div>
    `;

    this.container.appendChild(el);
    void el.offsetWidth;
    el.classList.add('show');

    const bar = el.querySelector('.toast-progress');
    bar.style.transition = `transform ${duration}ms linear`;
    setTimeout(() => { bar.style.transform = 'scaleX(0)'; }, 30);

    const info = { el, removing: false, timeout: null, backup: null };

    const close = () => this._remove(info, false);

    const schedule = (delay) => {
      clearTimeout(info.timeout);
      clearTimeout(info.backup);
      info.timeout = setTimeout(() => this._remove(info, false), delay);
      info.backup  = setTimeout(() => { if (!info.removing) this._remove(info, true); }, delay + 600);
    };

    // Pause auto-dismiss if there are buttons
    if (buttons.length === 0) {
      schedule(duration);
    }

    this.toasts.push(info);

    // Wire up buttons
    buttons.forEach((btn, i) => {
      const btnEl = el.querySelector(`[data-btn-index="${i}"]`);
      if (btnEl) {
        btnEl.addEventListener('click', (e) => {
          e.stopPropagation();
          if (typeof btn.onClick === 'function') btn.onClick(close);
          else close();
        });
      }
    });

    el.querySelector('.toast-close').addEventListener('click', () => close());

    el.addEventListener('mouseenter', () => {
      clearTimeout(info.timeout);
      clearTimeout(info.backup);
      bar.style.transitionProperty = 'none';
    });

    el.addEventListener('mouseleave', () => {
      if (buttons.length > 0) return; // don't restart timer if there are buttons
      const scaleX    = parseFloat(getComputedStyle(bar).transform.split(',')[0].replace('matrix(', '')) || 0;
      const remaining = Math.max(400, duration * scaleX);
      bar.style.transitionProperty = 'transform';
      bar.style.transitionDuration = `${remaining}ms`;
      bar.style.transform = 'scaleX(0)';
      schedule(remaining);
    });

    return info;
  }

  _remove(info, force = false) {
    if (info.removing) return;
    info.removing = true;
    clearTimeout(info.timeout);
    clearTimeout(info.backup);
    info.el.classList.remove('show');
    info.el.classList.add('hide');
    setTimeout(() => {
      info.el.remove();
      this.toasts = this.toasts.filter(t => t !== info);
    }, force ? 0 : 240);
  }

  success(msg, opts) { return this.show(msg, 'success', opts || {}); }
  error(msg, opts)   { return this.show(msg, 'error',   opts || {}); }
  warning(msg, opts) { return this.show(msg, 'warning', opts || {}); }
  info(msg, opts)    { return this.show(msg, 'info',    opts || {}); }

  clear() {
    this.toasts.forEach(t => { clearTimeout(t.timeout); clearTimeout(t.backup); t.el.remove(); });
    this.toasts = [];
  }
}

const toastTopRight    = new ToastNotification({ position: 'top-right' });
const toastTopLeft     = new ToastNotification({ position: 'top-left' });
const toastBottomRight = new ToastNotification({ position: 'bottom-right' });
const toastBottomLeft  = new ToastNotification({ position: 'bottom-left' });