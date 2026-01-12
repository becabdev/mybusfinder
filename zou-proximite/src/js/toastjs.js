// Apple-Style Toast Notifications
// Elegant, animated toast notifications inspired by Apple's design language
// Usage: toastBottomRight.error/info/warning/success('Your message here');
//
// Configuration options:
//     const toast = new ToastNotification({
//         position: 'bottom-right',    // top-right/top-left/bottom-right/bottom-left
//         duration: 4000,              // Display duration in milliseconds
//         maxToasts: 4,                // Maximum simultaneous toasts
//         blurAmount: '20px'           // Background blur intensity
//     });
//
// By Becab Systems - Bechir Abidi
// Enhanced with Apple-inspired design

class ToastNotification {
  constructor(options = {}) {
    this.options = {
      duration: options.duration || 4000,
      maxToasts: options.maxToasts || 4,
      containerClass: options.containerClass || 'apple-toast-container',
      toastClass: options.toastClass || 'apple-toast',
      blurAmount: options.blurAmount || '20px',
      transition: {
        springBezier: 'cubic-bezier(0.16, 1, 0.3, 1)',
        duration: '0.6s',
        exitDuration: '0.35s'
      },
      ...options
    };

    this.toasts = [];
    this.container = null;
    this.initContainer();
  }

  initContainer() {
    const containerId = `${this.options.containerClass}-${this.options.position}`;
    
    if (!document.querySelector(`.${containerId}`)) {
      this.container = document.createElement('div');
      this.container.className = `${this.options.containerClass} ${containerId}`;
      
      Object.assign(this.container.style, {
        position: 'fixed',
        zIndex: '10000',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '20px',
        pointerEvents: 'none'
      });
      
      switch (this.options.position) {
        case 'top-right':
          Object.assign(this.container.style, {
            top: '0',
            right: '0',
            alignItems: 'flex-end'
          });
          break;
        case 'top-left':
          Object.assign(this.container.style, {
            top: '0',
            left: '0',
            alignItems: 'flex-start'
          });
          break;
        case 'bottom-left':
          Object.assign(this.container.style, {
            bottom: '0',
            left: '0',
            alignItems: 'flex-start'
          });
          break;
        case 'bottom-right':
          Object.assign(this.container.style, {
            bottom: '0',
            right: '0',
            alignItems: 'flex-end'
          });
          break;
      }
      
      document.body.appendChild(this.container);
    } else {
      this.container = document.querySelector(`.${containerId}`);
    }
  }

  getTypeConfig(type) {
    const typeConfigs = {
      'success': {
        backgroundColor: 'rgba(52, 199, 89, 0.95)',
        iconColor: '#ffffff',
        textColor: '#ffffff',
        shadowColor: 'rgba(52, 199, 89, 0.4)',
        icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
      },
      'error': {
        backgroundColor: 'rgba(255, 59, 48, 0.95)',
        iconColor: '#ffffff',
        textColor: '#ffffff',
        shadowColor: 'rgba(255, 59, 48, 0.4)',
        icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`
      },
      'warning': {
        backgroundColor: 'rgba(255, 149, 0, 0.95)',
        iconColor: '#ffffff',
        textColor: '#ffffff',
        shadowColor: 'rgba(255, 149, 0, 0.4)',
        icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`
      },
      'info': {
        backgroundColor: 'rgba(0, 122, 255, 0.95)',
        iconColor: '#ffffff',
        textColor: '#ffffff',
        shadowColor: 'rgba(0, 122, 255, 0.4)',
        icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
      }
    };

    return typeConfigs[type] || typeConfigs['info'];
  }

  show(message, type = 'info', customOptions = {}) {
    if (this.toasts.length >= this.options.maxToasts) {
      this.removeToast(this.toasts[0].element, true);
    }
    
    const config = this.getTypeConfig(type);
    
    const toast = document.createElement('div');
    toast.className = `${this.options.toastClass} ${this.options.toastClass}-${type}`;
    
    Object.assign(toast.style, {
      position: 'relative',
      cursor: 'default',
      padding: '0',
      borderRadius: '14px',
      minWidth: '300px',
      maxWidth: '380px',
      transform: this.options.position.includes('top') ? 'translateY(-20px) scale(0.95)' : 'translateY(20px) scale(0.95)',
      opacity: '0',
      overflow: 'hidden',
      color: config.textColor,
      boxShadow: `0 10px 40px ${config.shadowColor}, 0 2px 8px rgba(0, 0, 0, 0.1)`,
      pointerEvents: 'auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale'
    });
    
    const toastContent = `
      <div class="toast-blur-bg"></div>
      <div class="toast-content">
        <div class="toast-icon">${config.icon}</div>
        <div class="toast-message">${message}</div>
        <div class="toast-close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
      </div>
    `;
    
    toast.innerHTML = toastContent;
    
    Object.assign(toast.style, {
      transition: `transform ${this.options.transition.duration} ${this.options.transition.springBezier}, 
                   opacity ${this.options.transition.duration} ${this.options.transition.springBezier},
                   box-shadow 0.3s ease`
    });
    
    const blurBg = toast.querySelector('.toast-blur-bg');
    Object.assign(blurBg.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundColor: config.backgroundColor,
      backdropFilter: `blur(${this.options.blurAmount}) saturate(180%)`,
      WebkitBackdropFilter: `blur(${this.options.blurAmount}) saturate(180%)`,
      borderRadius: 'inherit',
      zIndex: '0'
    });
    
    const contentElement = toast.querySelector('.toast-content');
    Object.assign(contentElement.style, {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      padding: '14px 16px',
      gap: '12px',
      zIndex: '1'
    });
    
    const iconElement = toast.querySelector('.toast-icon');
    Object.assign(iconElement.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: '0',
      color: config.iconColor
    });
    
    const messageElement = toast.querySelector('.toast-message');
    Object.assign(messageElement.style, {
      flex: '1',
      fontSize: '15px',
      fontWeight: '510',
      lineHeight: '1.45',
      letterSpacing: '-0.015em'
    });
    
    const closeElement = toast.querySelector('.toast-close');
    Object.assign(closeElement.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '24px',
      height: '24px',
      marginLeft: '4px',
      opacity: '0',
      cursor: 'pointer',
      flexShrink: '0',
      transition: 'opacity 0.2s ease, transform 0.15s ease',
      borderRadius: '6px'
    });
    
    this.container.appendChild(toast);
    
    setTimeout(() => {
      Object.assign(toast.style, {
        transform: 'translateY(0) scale(1)',
        opacity: '1'
      });
    }, 10);
    
    const duration = customOptions.duration !== undefined ? 
      customOptions.duration : 
      this.options.duration;

    const toastId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    toast.dataset.toastId = toastId;

    const toastInfo = {
      id: toastId,
      element: toast,
      timeout: setTimeout(() => {
        this.removeToast(toast, false);
      }, duration),
      removing: false
    };

    const backupTimeout = setTimeout(() => {
      const index = this.toasts.findIndex(t => t.id === toastId);
      if (index !== -1 && !this.toasts[index].removing) {
        this.removeToast(toast, true);
      }
    }, duration + 1000);

    toastInfo.backupTimeout = backupTimeout;
    this.toasts.push(toastInfo);
    
    const closeButton = toast.querySelector('.toast-close');
    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const toastElement = e.currentTarget.closest(`.${this.options.toastClass}`);
        if (toastElement) {
          this.removeToast(toastElement, true);
        }
      });
      
      closeButton.addEventListener('mousedown', () => {
        closeButton.style.transform = 'scale(0.9)';
      });
      
      closeButton.addEventListener('mouseup', () => {
        closeButton.style.transform = 'scale(1)';
      });
    }
    
    toast.addEventListener('mouseenter', () => {
      const close = toast.querySelector('.toast-close');
      if (close) {
        close.style.opacity = '0.6';
      }
      
      toast.style.boxShadow = `0 12px 50px ${config.shadowColor}, 0 4px 12px rgba(0, 0, 0, 0.15)`;
      
      clearTimeout(toastInfo.timeout);
      clearTimeout(toastInfo.backupTimeout);
    });
    
    toast.addEventListener('mouseleave', () => {
      const close = toast.querySelector('.toast-close');
      if (close) {
        close.style.opacity = '0';
      }
      
      toast.style.boxShadow = `0 10px 40px ${config.shadowColor}, 0 2px 8px rgba(0, 0, 0, 0.1)`;
      
      if (!toastInfo.removing) {
        const remainingTime = 1000;
        
        toastInfo.timeout = setTimeout(() => {
          this.removeToast(toast, false);
        }, remainingTime);
        
        toastInfo.backupTimeout = setTimeout(() => {
          const index = this.toasts.findIndex(t => t.id === toastId);
          if (index !== -1 && !this.toasts[index].removing) {
            this.removeToast(toast, true);
          }
        }, remainingTime + 1000);
      }
    });
    
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.opacity = '1';
      closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
    });
    
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.opacity = '0.6';
      closeButton.style.backgroundColor = 'transparent';
    });
    
    return toastInfo;
  }

  removeToast(toast, force = false) {
    let index = -1;
    if (typeof toast === 'string') {
      index = this.toasts.findIndex(t => t.id === toast);
    } else {
      const toastId = toast.dataset.toastId;
      index = this.toasts.findIndex(t => t.id === toastId);
      if (index === -1) {
        index = this.toasts.findIndex(t => t.element === toast);
      }
    }
    
    if (index === -1) return;
    
    this.toasts[index].removing = true;
    clearTimeout(this.toasts[index].timeout);
    clearTimeout(this.toasts[index].backupTimeout);
    
    const toastElement = this.toasts[index].element;
    
    Object.assign(toastElement.style, {
      transition: `transform ${this.options.transition.exitDuration} ${this.options.transition.springBezier}, 
                   opacity ${this.options.transition.exitDuration} ease`,
      transform: this.options.position.includes('top') ? 
        'translateY(-20px) scale(0.9)' : 
        'translateY(20px) scale(0.9)',
      opacity: '0'
    });
    
    const removeDelay = force ? 50 : 350;
    
    setTimeout(() => {
      if (toastElement && toastElement.parentNode) {
        toastElement.parentNode.removeChild(toastElement);
      }
      
      const currentIndex = this.toasts.findIndex(t => t.id === this.toasts[index].id);
      if (currentIndex !== -1) {
        this.toasts.splice(currentIndex, 1);
      }
    }, removeDelay);
  }

  success(message, options = {}) {
    return this.show(message, 'success', options);
  }
  
  error(message, options = {}) {
    return this.show(message, 'error', options);
  }
  
  warning(message, options = {}) {
    return this.show(message, 'warning', options);
  }
  
  info(message, options = {}) {
    return this.show(message, 'info', options);
  }
  
  clear() {
    this.toasts.forEach(toast => {
      clearTimeout(toast.timeout);
      clearTimeout(toast.backupTimeout);
      toast.removing = true;
      
      if (toast.element && toast.element.parentNode) {
        toast.element.parentNode.removeChild(toast.element);
      }
    });
    this.toasts = [];
  }
}

// Pre-configured instances for each position
const toastTopRight = new ToastNotification({
  position: 'top-right', 
  duration: 4000,           
  maxToasts: 4,
  blurAmount: '20px'
});

const toastTopLeft = new ToastNotification({
  position: 'top-left', 
  duration: 4000,           
  maxToasts: 4,
  blurAmount: '20px'
});

const toastBottomRight = new ToastNotification({
  position: 'bottom-right', 
  duration: 4000,           
  maxToasts: 4,
  blurAmount: '20px'
});

const toastBottomLeft = new ToastNotification({
  position: 'bottom-left', 
  duration: 4000,           
  maxToasts: 4,
  blurAmount: '20px'
});
