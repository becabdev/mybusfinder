// Simple Toast Notifications — minimal & clean
// Usage: toast.error/info/warning/success('Message...');
// By Becab Systems — reworked minimal edition (without ai this time haha, because it was making unnecessary complications with the code structure and readability)

class ToastNotification {
  constructor(options = {}) {
    this.options = {
      duration:    options.duration   ?? 3000,
      maxToasts:   options.maxToasts  ?? 5,
      position:    options.position   || 'bottom-right',
      ...options
    };
    this.toasts    = [];
    this.container = null;
    this._initStyles();
    this._initContainer();
  }

  _initStyles() {
    if (document.getElementById('toast-minimal-css')) return;
    const style = document.createElement('style');
    style.id = 'toast-minimal-css';
    style.textContent = `
      .toast-wrap {
        position: fixed;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 16px;
        pointer-events: none;
      }
      .toast-wrap.top-right    { top: 0; right: 0; align-items: flex-end; }
      .toast-wrap.top-left     { top: 0; left: 0;  align-items: flex-start; }
      .toast-wrap.bottom-right { bottom: 0; right: 0; align-items: flex-end; }
      .toast-wrap.bottom-left  { bottom: 0; left: 0;  align-items: flex-start; }

      .toast-item {
        pointer-events: all;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 11px 14px;
        border-radius: 6px;
        font-family: 'DM Mono', 'Courier New', monospace;
        font-size: 13px;
        font-weight: 500;
        line-height: 1.4;
        max-width: 300px;
        color: #f5f5f5;
        background: #1a1a1a;
        border: 1px solid #2e2e2e;
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
        opacity: 0;
        transform: translateY(6px);
        transition: opacity 0.2s ease, transform 0.2s ease;
        cursor: default;
        position: relative;
        overflow: hidden;
      }

      .toast-item.show {
        opacity: 1;
        transform: translateY(0);
      }

      .toast-item.hide {
        opacity: 0;
        transform: translateY(6px);
      }

      /* accent line on left */
      .toast-item::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 3px;
        border-radius: 6px 0 0 6px;
      }

      .toast-item.success::before { background: #22c55e; }
      .toast-item.error::before   { background: #ef4444; }
      .toast-item.warning::before { background: #f59e0b; }
      .toast-item.info::before    { background: #6b7280; }

      .toast-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        flex-shrink: 0;
        margin-left: 4px;
      }
      .toast-item.success .toast-dot { background: #22c55e; }
      .toast-item.error   .toast-dot { background: #ef4444; }
      .toast-item.warning .toast-dot { background: #f59e0b; }
      .toast-item.info    .toast-dot { background: #6b7280; }

      .toast-msg { flex: 1; }

      .toast-close {
        margin-left: 4px;
        opacity: 0.4;
        cursor: pointer;
        font-size: 14px;
        line-height: 1;
        flex-shrink: 0;
        user-select: none;
        transition: opacity 0.15s;
      }
      .toast-close:hover { opacity: 0.9; }

      .toast-progress {
        position: absolute;
        bottom: 0; left: 0;
        height: 2px;
        width: 100%;
        background: #ffffff18;
        transform-origin: left;
        transform: scaleX(1);
      }
    `;
    document.head.appendChild(style);
  }

  _initContainer() {
    const id = `toast-wrap-${this.options.position}`;
    this.container = document.getElementById(id);
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = id;
      this.container.className = `toast-wrap ${this.options.position}`;
      document.body.appendChild(this.container);
    }
  }

  show(message, type = 'info', customOptions = {}) {
    if (this.toasts.length >= this.options.maxToasts) {
      this._remove(this.toasts[0], true);
    }

    const duration = customOptions.duration ?? this.options.duration;
    const el       = document.createElement('div');
    el.className   = `toast-item ${type}`;

    el.innerHTML = `
      <div class="toast-dot"></div>
      <div class="toast-msg">${message}</div>
      <div class="toast-close">✕</div>
      <div class="toast-progress"></div>
    `;

    this.container.appendChild(el);
    void el.offsetWidth; // reflow
    el.classList.add('show');

    // progress bar animation
    const bar = el.querySelector('.toast-progress');
    bar.style.transition = `transform ${duration}ms linear`;
    setTimeout(() => { bar.style.transform = 'scaleX(0)'; }, 30);

    const info = {
      el,
      removing: false,
      timeout:  null,
      backup:   null
    };

    const schedule = (delay) => {
      clearTimeout(info.timeout);
      clearTimeout(info.backup);
      info.timeout = setTimeout(() => this._remove(info, false), delay);
      info.backup  = setTimeout(() => { if (!info.removing) this._remove(info, true); }, delay + 800);
    };

    schedule(duration);
    this.toasts.push(info);

    // close button
    el.querySelector('.toast-close').addEventListener('click', () => this._remove(info, false));

    // pause on hover
    el.addEventListener('mouseenter', () => {
      clearTimeout(info.timeout);
      clearTimeout(info.backup);
      bar.style.transitionProperty = 'none';
    });

    el.addEventListener('mouseleave', () => {
      const scaleX = parseFloat(getComputedStyle(bar).transform.split(',')[0].replace('matrix(', '')) || 0;
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
    }, force ? 0 : 220);
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
