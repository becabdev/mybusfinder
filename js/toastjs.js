// Simple Toast Notifications — minimal & clean
// Usage: toast.error/info/warning/success('Message...');
// By Becab Systems — reworked minimal edition (without ai this time haha, because it was making unnecessary complications with the code structure and readability)

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
      .toast-wrap {
        position: fixed;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 20px;
        pointer-events: none;
      }
      .toast-wrap.top-right    { top: 0;    right: 0;  align-items: flex-end; }
      .toast-wrap.top-left     { top: 0;    left: 0;   align-items: flex-start; }
      .toast-wrap.bottom-right { bottom: 0; right: 0;  align-items: flex-end; }
      .toast-wrap.bottom-left  { bottom: 0; left: 0;   align-items: flex-start; }

      .toast-item {
        pointer-events: all;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 13px 16px;
        border-radius: 14px;
        min-width: 260px;
        max-width: 340px;
        font-family: -apple-system, 'Helvetica Neue', sans-serif;
        font-size: 13.5px;
        font-weight: 400;
        line-height: 1.45;
        letter-spacing: -0.01em;
        color: rgba(255,255,255,0.92);

        background: rgba(40, 40, 42, 0.72);
        backdrop-filter: saturate(180%) blur(28px);
        -webkit-backdrop-filter: saturate(180%) blur(28px);

        border: 1px solid rgba(255,255,255,0.10);
        box-shadow:
          0 2px 6px rgba(0,0,0,0.18),
          0 8px 32px rgba(0,0,0,0.28),
          inset 0 1px 0 rgba(255,255,255,0.08);

        cursor: default;
        opacity: 0;
        transform: translateY(8px) scale(0.97);
        transition:
          opacity 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94),
          transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        position: relative;
        overflow: hidden;
      }

      .toast-item.show {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .toast-item.hide {
        opacity: 0;
        transform: translateY(6px) scale(0.97);
        transition-duration: 0.22s;
      }

      .toast-icon {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
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

  show(message, type = 'info', customOptions = {}) {
    if (this.toasts.length >= this.options.maxToasts) {
      this._remove(this.toasts[0], true);
    }

    const duration = customOptions.duration ?? this.options.duration;
    const title    = customOptions.title || null;

    const el = document.createElement('div');
    el.className = `toast-item ${type}${!title ? ' no-title' : ''}`;

    el.innerHTML = `
      <div class="toast-icon">${this._icon(type)}</div>
      <div class="toast-body">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-msg">${message}</div>
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

    const schedule = (delay) => {
      clearTimeout(info.timeout);
      clearTimeout(info.backup);
      info.timeout = setTimeout(() => this._remove(info, false), delay);
      info.backup  = setTimeout(() => { if (!info.removing) this._remove(info, true); }, delay + 600);
    };

    schedule(duration);
    this.toasts.push(info);

    el.querySelector('.toast-close').addEventListener('click', () => this._remove(info, false));

    el.addEventListener('mouseenter', () => {
      clearTimeout(info.timeout);
      clearTimeout(info.backup);
      bar.style.transitionProperty = 'none';
    });

    el.addEventListener('mouseleave', () => {
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
    }, force ? 0 : 280);
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
