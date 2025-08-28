/**
 * Session start event types
 */
export type SessionStartType = 'init' | 'active';

/**
 * Session start event data
 */
export interface SessionStartData {
  type: SessionStartType;
  timestamp: number;
}

/**
 * Session end event data
 */
export interface SessionEndData {
  duration: number;
  total_duration: number;
  timestamp: number;
}

/**
 * Session life event data (periodic heartbeat)
 */
export interface SessionLifeData {
  duration: number;
  total_duration: number;
  timestamp: number;
}

/**
 * Session event handler function types
 */
export type SessionStartHandler = (data: SessionStartData) => void;
export type SessionEndHandler = (data: SessionEndData) => void;
export type SessionLifeHandler = (data: SessionLifeData) => void;

/**
 * Session lifecycle methods interface
 */
export interface SessionLifecycleMethods {
  /**
   * Register a callback function to be called when session starts
   * @param callback - The function to be called on session start
   */
  on_session_start: (callback: SessionStartHandler) => void;
  
  /**
   * Register a callback function to be called when session ends  
   * @param callback - The function to be called on session end
   */
  on_session_end: (callback: SessionEndHandler) => void;
  
  /**
   * Register a callback function to be called periodically during active session
   * @param callback - The function to be called on session life event
   */
  on_session_life: (callback: SessionLifeHandler) => void;
}

/**
 * Configuration options for SessionLifecycle
 */
export interface SessionLifecycleConfig {
  /** Heartbeat interval in milliseconds (default: 30000 = 30s) */
  heartbeatInterval?: number;
  /** User inactivity timeout in milliseconds (default: 120000 = 2min) */
  inactivityTimeout?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * Session state enum
 */
enum SessionState {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  PAUSED = 'paused'
}

/**
 * SessionLifecycle class for managing session lifecycle events
 */
export class SessionLifecycle {
  private startCallbacks: SessionStartHandler[] = [];
  private endCallbacks: SessionEndHandler[] = [];
  private lifeCallbacks: SessionLifeHandler[] = [];
  private config: Required<SessionLifecycleConfig>;
  
  // State management
  private state: SessionState = SessionState.INACTIVE;
  private sessionStartTime: number = 0;
  private lastActivityTime: number = 0;
  private lastHeartbeatTime: number = 0;
  private lastEventTime: number = 0;
  private pauseStartTime: number = 0;
  
  // Timers
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private initTimer: ReturnType<typeof setTimeout> | null = null;
  
  // Event listeners
  private visibilityChangeListener: (() => void) | null = null;
  private activityListeners: Array<{ element: Element | Document | Window, event: string, listener: () => void }> = [];
  private beforeUnloadListener: (() => void) | null = null;
  private mobileLifecycleListeners: Array<{ element: Element | Document | Window, event: string, listener: () => void }> = [];
  
  private isInitialized = false;
  private isMobile = false;

  /**
   * Create a new SessionLifecycle instance
   * @param config - Optional configuration object
   */
  constructor(config: SessionLifecycleConfig = {}) {
    // 检测移动设备
    this.isMobile = this.detectMobileDevice();
    
    // 根据设备类型设置默认配置
    const mobileOptimizedDefaults = this.isMobile ? {
      heartbeatInterval: 30000, // 移动端使用更长的心跳间隔以节省电量
      inactivityTimeout: 120000, // 移动端使用更长的不活动超时（3分钟）
      debug: false
    } : {
      heartbeatInterval: 30000, // 桌面端30秒
      inactivityTimeout: 120000, // 桌面端2分钟
      debug: false
    };

    this.config = {
      ...mobileOptimizedDefaults,
      ...config
    };

    if (this.config.debug) {
      this.log(`Device detected: ${this.isMobile ? 'Mobile' : 'Desktop'}`);
      this.log(`Config: heartbeat=${this.config.heartbeatInterval}ms, inactivity=${this.config.inactivityTimeout}ms`);
    }
  }

  /**
   * Detect if the current device is a mobile device
   */
  private detectMobileDevice(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false; // Server-side or non-browser environment
    }

    // 检查用户代理字符串
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = [
      'android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 
      'windows phone', 'mobile', 'opera mini', 'iemobile'
    ];
    
    const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));

    // 检查触摸支持
    const hasTouchSupport = 'ontouchstart' in window || 
                          (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);

    // 检查屏幕尺寸（移动端通常较小）
    const hasSmallScreen = window.screen && 
                          (window.screen.width <= 768 || window.screen.height <= 768);

    // 检查设备方向API（主要在移动设备上可用）
    const hasOrientationAPI = 'orientation' in window;

    // 综合判断
    const isMobile = isMobileUA || (hasTouchSupport && hasSmallScreen) || hasOrientationAPI;

    return isMobile;
  }

  /**
   * Get the session lifecycle methods and auto-initialize
   * @returns Object containing session lifecycle methods
   */
  public getMethods(): SessionLifecycleMethods {
    const methods: SessionLifecycleMethods = {
      on_session_start: (callback: SessionStartHandler) => {
        if (typeof callback !== 'function') {
          throw new Error('Callback must be a function');
        }
        this.startCallbacks.push(callback);
        // 延迟初始化，确保第一个回调函数注册后再初始化
        this.scheduleInitialization();
      },
      
      on_session_end: (callback: SessionEndHandler) => {
        if (typeof callback !== 'function') {
          throw new Error('Callback must be a function');
        }
        this.endCallbacks.push(callback);
        this.scheduleInitialization();
      },
      
      on_session_life: (callback: SessionLifeHandler) => {
        if (typeof callback !== 'function') {
          throw new Error('Callback must be a function');
        }
        this.lifeCallbacks.push(callback);
        this.scheduleInitialization();
      }
    };

    return methods;
  }

  /**
   * Schedule delayed initialization to ensure callbacks are registered first
   */
  private scheduleInitialization(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    // Clear any existing initialization timer
    if (this.initTimer) {
      clearTimeout(this.initTimer);
    }

    // Schedule initialization after a short delay to ensure all callbacks are registered
    this.initTimer = setTimeout(() => {
      if (!this.isInitialized) {
        this.initialize();
      }
    }, 0); // Use 0ms delay to put initialization at end of current call stack
  }

  /**
   * Initialize session tracking
   */
  private initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    this.log('Initializing session lifecycle tracking');
    this.isInitialized = true;
    this.sessionStartTime = Date.now();
    this.lastActivityTime = this.sessionStartTime;

    // Set up event listeners
    this.setupPageVisibilityListener();
    this.setupActivityListeners();
    this.setupMobileLifecycleListeners();
    this.setupBeforeUnloadListener();

    // Start session
    this.startSession('init');
  }

  /**
   * Set up page visibility change listener
   */
  private setupPageVisibilityListener(): void {
    if (typeof document === 'undefined') return;

    this.visibilityChangeListener = () => {
      if (document.hidden) {
        // Page became hidden - pause session
        this.log('Page hidden - pausing session');
        this.pauseSession().catch(error => {
          console.error('Error pausing session:', error);
        });
      } else {
        // Page became visible - resume session
        this.log('Page visible - resuming session');
        this.resumeSession();
      }
    };

    document.addEventListener('visibilitychange', this.visibilityChangeListener);
  }

  /**
   * Set up user activity listeners
   */
  private setupActivityListeners(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // 基础事件（所有设备）
    const baseEvents = ['click', 'scroll', 'keydown'];
    
    // 移动端触摸事件
    const touchEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];
    
    // 桌面端鼠标事件
    const mouseEvents = ['mousemove', 'mousedown', 'mouseup'];
    
    // 手势事件（iOS Safari）
    const gestureEvents = ['gesturestart', 'gesturechange', 'gestureend'];
    
    // 组合所有事件
    const events = [
      ...baseEvents,
      ...touchEvents,
      ...mouseEvents,
      ...gestureEvents
    ];
    
    const activityHandler = () => {
      this.onUserActivity();
    };

    events.forEach(eventName => {
      const listener = { 
        element: document, 
        event: eventName, 
        listener: activityHandler 
      };
      this.activityListeners.push(listener);
      
      // 使用 passive 监听器提高移动端性能
      document.addEventListener(eventName, listener.listener, { 
        passive: true,
        capture: false 
      });
    });
    
    this.log(`Activity listeners registered: ${events.length} events`);
  }

  /**
   * Set up mobile-specific lifecycle listeners
   */
  private setupMobileLifecycleListeners(): void {
    if (typeof window === 'undefined') return;

    // 设备方向变化（移动端）
    const orientationHandler = () => {
      this.log('Device orientation changed');
      this.onUserActivity(); // 方向变化视为用户活动
    };

    // 网络状态变化
    const networkHandler = () => {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      this.log(`Network status changed: ${isOnline ? 'online' : 'offline'}`);
      
      if (!isOnline && this.state === SessionState.ACTIVE) {
        // 网络断开时暂停会话
        this.log('Network offline - pausing session');
        this.pauseSession().catch(error => {
          console.error('Error pausing session due to network offline:', error);
        });
      } else if (isOnline && this.state === SessionState.PAUSED) {
        // 网络恢复时可能需要恢复会话
        this.log('Network online - resuming session may be needed');
        this.onUserActivity(); // 触发活动检测
      }
    };

    // 页面显示/隐藏（移动端更可靠）
    const pageShowHandler = () => {
      this.log('Page shown (pageshow event)');
      if (this.state === SessionState.PAUSED) {
        this.resumeSession();
      }
    };

    const pageHideHandler = () => {
      this.log('Page hidden (pagehide event)');
      if (this.state === SessionState.ACTIVE) {
        this.pauseSession().catch(error => {
          console.error('Error pausing session during pagehide:', error);
        });
      }
    };

    // 应用焦点变化
    const focusHandler = () => {
      this.log('Window gained focus');
      this.onUserActivity();
    };

    const blurHandler = () => {
      this.log('Window lost focus');
      // 失去焦点时不立即暂停，等待visibilitychange或pagehide
    };

    // 注册事件监听器
    const mobileEvents = [
      { element: window, event: 'orientationchange', listener: orientationHandler },
      { element: window, event: 'online', listener: networkHandler },
      { element: window, event: 'offline', listener: networkHandler },
      { element: window, event: 'pageshow', listener: pageShowHandler },
      { element: window, event: 'pagehide', listener: pageHideHandler },
      { element: window, event: 'focus', listener: focusHandler },
      { element: window, event: 'blur', listener: blurHandler }
    ];

    mobileEvents.forEach(({ element, event, listener }) => {
      this.mobileLifecycleListeners.push({ element, event, listener });
      element.addEventListener(event, listener, { passive: true });
    });

    this.log(`Mobile lifecycle listeners registered: ${mobileEvents.length} events`);
  }

  /**
   * Set up page unload listener to ensure session end event is triggered
   */
  private setupBeforeUnloadListener(): void {
    if (typeof window === 'undefined') return;

    this.beforeUnloadListener = () => {
      this.log('Page unloading - ensuring session end event');
      // 确保在页面卸载前触发 session end 事件
      if (this.state === SessionState.ACTIVE) {
        this.endSession().catch(error => {
          console.error('Error ending session during page unload:', error);
        });
      }
    };

    window.addEventListener('beforeunload', this.beforeUnloadListener);
    window.addEventListener('pagehide', this.beforeUnloadListener);
  }

  /**
   * Handle user activity
   */
  private onUserActivity(): void {
    const now = Date.now();
    this.lastActivityTime = now;
    this.lastEventTime = now; // 用户活动也是事件

    // If session was inactive due to inactivity, restart it
    if (this.state === SessionState.INACTIVE && this.isPageVisible()) {
      this.log('User activity detected - restarting session');
      this.startSession('active');
    } else if (this.state === SessionState.ACTIVE) {
      // Reset inactivity timer
      this.resetInactivityTimer();
    }
  }

  /**
   * Start a new session
   */
  private startSession(type: SessionStartType): void {
    if (this.state === SessionState.ACTIVE) return;

    this.log(`Starting session with type: ${type}`);
    this.state = SessionState.ACTIVE;
    this.sessionStartTime = Date.now();
    this.lastActivityTime = this.sessionStartTime;
    this.lastHeartbeatTime = this.sessionStartTime;
    this.lastEventTime = this.sessionStartTime;

    // Start heartbeat timer
    this.startHeartbeat();
    
    // Start inactivity timer
    this.resetInactivityTimer();

    // Trigger callbacks
    this.triggerSessionStart({
      type: type,
      timestamp: this.sessionStartTime
    });
  }

  /**
   * End the current session
   */
  private async endSession(): Promise<void> {
    if (this.state === SessionState.INACTIVE) return;

    const now = Date.now();
    const intervalDuration = this.lastEventTime > 0 ? now - this.lastEventTime : 0; // 最近一次事件到当前的间隔
    const totalDuration = this.sessionStartTime > 0 ? now - this.sessionStartTime : 0; // 总会话时间
    
    this.log(`Ending session - interval: ${intervalDuration}ms, total: ${totalDuration}ms`);
    this.state = SessionState.INACTIVE;

    // Stop timers
    this.stopHeartbeat();
    this.stopInactivityTimer();

    // Trigger callbacks and wait for completion
    await this.triggerSessionEnd({
      duration: intervalDuration,      // 最近一次事件到当前的间隔时间
      total_duration: totalDuration,   // 会话总时间
      timestamp: now
    });
    
    // Update last event time
    this.lastEventTime = now;
  }

  /**
   * Pause session (when page becomes hidden)
   */
  private async pauseSession(): Promise<void> {
    if (this.state !== SessionState.ACTIVE) return;

    const now = Date.now();
    const intervalDuration = this.lastEventTime > 0 ? now - this.lastEventTime : 0; // 最近一次事件到当前的间隔
    const totalDuration = this.sessionStartTime > 0 ? now - this.sessionStartTime : 0; // 总会话时间
    
    this.log(`Pausing session - interval: ${intervalDuration}ms, total: ${totalDuration}ms`);
    this.state = SessionState.PAUSED;
    this.pauseStartTime = now; // 记录暂停开始时间

    // Stop timers
    this.stopHeartbeat();
    this.stopInactivityTimer();

    // Trigger end event and wait for completion
    await this.triggerSessionEnd({
      duration: intervalDuration,      // 最近一次事件到当前的间隔时间
      total_duration: totalDuration,   // 会话总时间
      timestamp: now
    });
    
    // Update last event time
    this.lastEventTime = now;
  }

  /**
   * Resume session (when page becomes visible again)
   */
  private resumeSession(): void {
    if (this.state !== SessionState.PAUSED) return;

    const now = Date.now();
    const pauseDuration = this.pauseStartTime > 0 ? now - this.pauseStartTime : 0;
    
    this.log(`Attempting to resume session after ${pauseDuration}ms pause (${this.isMobile ? 'Mobile' : 'Desktop'})`);
    
    // 移动端使用更保守的恢复策略
    // const resumeThreshold = this.isMobile 
    //   ? Math.max(this.config.heartbeatInterval * 2, 60000) // 移动端：至少1分钟或2倍心跳间隔
    //   : this.config.heartbeatInterval; // 桌面端：心跳间隔
    const resumeThreshold = this.config.heartbeatInterval;
    
    if (pauseDuration > resumeThreshold) {
      this.log(`Pause duration > ${resumeThreshold}ms (threshold), starting new session`);
      this.startSession('active');
    } else {
      this.log(`Pause duration <= ${resumeThreshold}ms (threshold), resuming current session`);
      
      // 移动端：更保守的恢复策略
      if (this.isMobile) {
        // 移动端先设为INACTIVE，等待用户活动
        this.state = SessionState.INACTIVE;
        this.log('Mobile device: waiting for user activity before full resume');
      } else {
        // 桌面端：直接恢复
        this.state = SessionState.ACTIVE;
        this.startHeartbeat();
        this.resetInactivityTimer();
        
        this.triggerSessionStart({
          type: 'active',
          timestamp: now
        });
        
        this.lastEventTime = now;
      }
    }
  }

  /**
   * Start heartbeat timer
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.state === SessionState.ACTIVE && this.sessionStartTime > 0) {
        const now = Date.now();
        const heartbeatDuration = now - this.lastHeartbeatTime; // 单次心跳间隔时间
        const totalDuration = now - this.sessionStartTime; // 从session开始的总时间
        
        this.log(`Heartbeat - interval: ${heartbeatDuration}ms, total session: ${totalDuration}ms`);
        
        this.triggerSessionLife({
          duration: heartbeatDuration,
          total_duration: totalDuration,
          timestamp: now
        });
        
        // 更新最后心跳时间和最后事件时间
        this.lastHeartbeatTime = now;
        this.lastEventTime = now;
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat timer
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Reset inactivity timer
   */
  private resetInactivityTimer(): void {
    this.stopInactivityTimer();
    
    this.inactivityTimer = setTimeout(() => {
      this.log('User inactivity detected - ending session');
      this.endSession().catch(error => {
        console.error('Error ending session due to inactivity:', error);
      });
    }, this.config.inactivityTimeout);
  }

  /**
   * Stop inactivity timer
   */
  private stopInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  /**
   * Check if page is currently visible
   */
  private isPageVisible(): boolean {
    return typeof document === 'undefined' ? true : !document.hidden;
  }

  /**
   * Trigger session start callbacks
   */
  private triggerSessionStart(data: SessionStartData): void {
    this.startCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in session start callback:', error);
      }
    });
  }

  /**
   * Trigger session end callbacks and return a promise that resolves when all callbacks are processed
   */
  private async triggerSessionEnd(data: SessionEndData): Promise<void> {
    const promises = this.endCallbacks.map(callback => {
      return new Promise<void>((resolve) => {
        try {
          // Execute callback in next tick to ensure it runs after current call stack
          setTimeout(() => {
            try {
              callback(data);
            } catch (error) {
              console.error('Error in session end callback:', error);
            } finally {
              resolve();
            }
          }, 0);
        } catch (error) {
          console.error('Error scheduling session end callback:', error);
          resolve();
        }
      });
    });

    // Wait for all callbacks to complete
    await Promise.all(promises);
  }

  /**
   * Trigger session life callbacks
   */
  private triggerSessionLife(data: SessionLifeData): void {
    this.lifeCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in session life callback:', error);
      }
    });
  }

  /**
   * Log debug messages
   */
  private log(message: string): void {
    if (this.config.debug) {
      console.log(`[SessionLifecycle] ${message}`);
    }
  }

  /**
   * Clean up resources
   */
  public async destroy(): Promise<void> {
    this.log('Destroying session lifecycle instance');
    
    // End current session and wait for callbacks to complete
    if (this.state === SessionState.ACTIVE) {
      await this.endSession();
    }

    // Stop timers
    this.stopHeartbeat();
    this.stopInactivityTimer();
    
    // Clear initialization timer
    if (this.initTimer) {
      clearTimeout(this.initTimer);
      this.initTimer = null;
    }

    // Remove event listeners
    if (this.visibilityChangeListener && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityChangeListener);
    }

    if (this.beforeUnloadListener && typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.beforeUnloadListener);
      window.removeEventListener('pagehide', this.beforeUnloadListener);
    }

    this.activityListeners.forEach(({ element, event, listener }) => {
      element.removeEventListener(event, listener);
    });

    this.mobileLifecycleListeners.forEach(({ element, event, listener }) => {
      element.removeEventListener(event, listener);
    });

    // Clear callbacks and listeners
    this.startCallbacks = [];
    this.endCallbacks = [];
    this.lifeCallbacks = [];
    this.activityListeners = [];
    this.mobileLifecycleListeners = [];
    this.visibilityChangeListener = null;
    this.beforeUnloadListener = null;
    this.isInitialized = false;
  }
}

// Global instance management
declare global {
  interface Window {
    __sessionLifecycleInstance?: SessionLifecycle;
  }
}

/**
 * Factory function to create a new SessionLifecycle instance and return its methods
 * Ensures only one instance exists per page - automatically destroys previous instances
 * @param config - Optional configuration object
 * @returns Promise that resolves to object containing session lifecycle methods and instance
 */
export async function createSessionLifecycle(config?: SessionLifecycleConfig): Promise<SessionLifecycleMethods & { destroy: () => Promise<void> }> {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // If there's already an existing instance, destroy it first and wait for completion
    if (window.__sessionLifecycleInstance) {
      console.log('[SessionLifecycle] Destroying previous instance to ensure singleton behavior');
      await window.__sessionLifecycleInstance.destroy();
      window.__sessionLifecycleInstance = undefined;
    }
  }
  
  const instance = new SessionLifecycle(config);
  const methods = instance.getMethods();
  
  // Store the new instance globally (browser only)
  if (typeof window !== 'undefined') {
    window.__sessionLifecycleInstance = instance;
  }
  
  return {
    ...methods,
    destroy: async () => {
      await instance.destroy();
      // Clear global reference when destroyed
      if (typeof window !== 'undefined' && window.__sessionLifecycleInstance === instance) {
        window.__sessionLifecycleInstance = undefined;
      }
    }
  };
}

/**
 * Get the current active SessionLifecycle instance if it exists
 * @returns The current instance or undefined if no instance is active
 */
export function getCurrentSessionLifecycle(): SessionLifecycle | undefined {
  if (typeof window !== 'undefined') {
    return window.__sessionLifecycleInstance;
  }
  return undefined;
}

/**
 * Check if there's already an active SessionLifecycle instance
 * @returns True if an instance is active, false otherwise
 */
export function hasActiveSessionLifecycle(): boolean {
  return typeof window !== 'undefined' && !!window.__sessionLifecycleInstance;
}

/**
 * Destroy the current active SessionLifecycle instance if it exists
 * @returns Promise that resolves to true if an instance was destroyed, false if no instance was active
 */
export async function destroyCurrentSessionLifecycle(): Promise<boolean> {
  if (typeof window !== 'undefined' && window.__sessionLifecycleInstance) {
    await window.__sessionLifecycleInstance.destroy();
    window.__sessionLifecycleInstance = undefined;
    return true;
  }
  return false;
}

/**
 * Synchronous version of createSessionLifecycle for backward compatibility
 * Note: This version destroys previous instances without waiting for their callbacks to complete
 * @param config - Optional configuration object  
 * @returns Object containing session lifecycle methods and instance
 */
export function createSessionLifecycleSync(config?: SessionLifecycleConfig): SessionLifecycleMethods & { destroy: () => Promise<void> } {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // If there's already an existing instance, destroy it (without waiting)
    if (window.__sessionLifecycleInstance) {
      console.log('[SessionLifecycle] Destroying previous instance to ensure singleton behavior (sync)');
      window.__sessionLifecycleInstance.destroy().catch(error => {
        console.error('Error destroying previous instance:', error);
      });
      window.__sessionLifecycleInstance = undefined;
    }
  }
  
  const instance = new SessionLifecycle(config);
  const methods = instance.getMethods();
  
  // Store the new instance globally (browser only)
  if (typeof window !== 'undefined') {
    window.__sessionLifecycleInstance = instance;
  }
  
  return {
    ...methods,
    destroy: async () => {
      await instance.destroy();
      // Clear global reference when destroyed
      if (typeof window !== 'undefined' && window.__sessionLifecycleInstance === instance) {
        window.__sessionLifecycleInstance = undefined;
      }
    }
  };
}

// Default export for easier importing (async version for better callback handling)
export default createSessionLifecycle;
