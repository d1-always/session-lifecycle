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
  
  private isInitialized = false;

  /**
   * Create a new SessionLifecycle instance
   * @param config - Optional configuration object
   */
  constructor(config: SessionLifecycleConfig = {}) {
    this.config = {
      heartbeatInterval: 30000, // 30 seconds
      inactivityTimeout: 120000, // 2 minutes
      debug: false,
      ...config
    };
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
        this.pauseSession();
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

    const events = ['click', 'scroll', 'mousemove', 'keydown', 'touchstart', 'touchmove'];
    
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
      document.addEventListener(eventName, listener.listener, { passive: true });
    });
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
        this.endSession();
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
  private endSession(): void {
    if (this.state === SessionState.INACTIVE) return;

    const now = Date.now();
    const intervalDuration = this.lastEventTime > 0 ? now - this.lastEventTime : 0; // 最近一次事件到当前的间隔
    const totalDuration = this.sessionStartTime > 0 ? now - this.sessionStartTime : 0; // 总会话时间
    
    this.log(`Ending session - interval: ${intervalDuration}ms, total: ${totalDuration}ms`);
    this.state = SessionState.INACTIVE;

    // Stop timers
    this.stopHeartbeat();
    this.stopInactivityTimer();

    // Trigger callbacks
    this.triggerSessionEnd({
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
  private pauseSession(): void {
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

    // Trigger end event
    this.triggerSessionEnd({
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
    
    this.log(`Attempting to resume session after ${pauseDuration}ms pause`);
    
    // 只有暂停超过30秒才重新启动会话
    if (pauseDuration > this.config.heartbeatInterval) {
      this.log(`Pause duration > ${this.config.heartbeatInterval}ms, starting new session`);
      this.startSession('active');
    } else {
      this.log(`Pause duration <= ${this.config.heartbeatInterval}ms, not resuming session`);
      // 可选：这里可以直接切换状态到INACTIVE，等待用户活动重新触发
      this.state = SessionState.INACTIVE;
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
      this.endSession();
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
   * Trigger session end callbacks
   */
  private triggerSessionEnd(data: SessionEndData): void {
    this.endCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in session end callback:', error);
      }
    });
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
  public destroy(): void {
    this.log('Destroying session lifecycle instance');
    
    // End current session
    if (this.state === SessionState.ACTIVE) {
      this.endSession();
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

    // Clear callbacks and listeners
    this.startCallbacks = [];
    this.endCallbacks = [];
    this.lifeCallbacks = [];
    this.activityListeners = [];
    this.visibilityChangeListener = null;
    this.beforeUnloadListener = null;
    this.isInitialized = false;
  }
}

/**
 * Factory function to create a new SessionLifecycle instance and return its methods
 * @param config - Optional configuration object
 * @returns Object containing session lifecycle methods and instance
 */
export function createSessionLifecycle(config?: SessionLifecycleConfig): SessionLifecycleMethods & { destroy: () => void } {
  const instance = new SessionLifecycle(config);
  const methods = instance.getMethods();
  
  return {
    ...methods,
    destroy: () => instance.destroy()
  };
}

// Default export for easier importing
export default createSessionLifecycle;
