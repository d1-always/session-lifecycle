/**
 * Session lifecycle event handler function type
 */
export type SessionEventHandler = () => void;

/**
 * Session lifecycle methods interface
 */
export interface SessionLifecycleMethods {
  /**
   * Register a callback function to be called when session starts
   * @param callback - The function to be called on session start
   */
  on_session_start: (callback: SessionEventHandler) => void;
  
  /**
   * Register a callback function to be called when session ends  
   * @param callback - The function to be called on session end
   */
  on_session_end: (callback: SessionEventHandler) => void;
}

/**
 * Configuration options for SessionLifecycle
 */
export interface SessionLifecycleConfig {
  // Reserved for future configuration options
  [key: string]: any;
}

/**
 * SessionLifecycle class for managing session lifecycle events
 */
export class SessionLifecycle {
  private startCallbacks: SessionEventHandler[] = [];
  private endCallbacks: SessionEventHandler[] = [];
  private config: SessionLifecycleConfig;

  /**
   * Create a new SessionLifecycle instance
   * @param config - Optional configuration object
   */
  constructor(config: SessionLifecycleConfig = {}) {
    this.config = config;
  }

  /**
   * Get the session lifecycle methods
   * @returns Object containing on_session_start and on_session_end methods
   */
  public getMethods(): SessionLifecycleMethods {
    return {
      on_session_start: (callback: SessionEventHandler) => {
        if (typeof callback !== 'function') {
          throw new Error('Callback must be a function');
        }
        this.startCallbacks.push(callback);
      },
      
      on_session_end: (callback: SessionEventHandler) => {
        if (typeof callback !== 'function') {
          throw new Error('Callback must be a function');
        }
        this.endCallbacks.push(callback);
      }
    };
  }

  /**
   * Internal method to trigger session start events
   * This method is reserved for future internal implementation
   */
  private triggerSessionStart(): void {
    this.startCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in session start callback:', error);
      }
    });
  }

  /**
   * Internal method to trigger session end events
   * This method is reserved for future internal implementation
   */
  private triggerSessionEnd(): void {
    this.endCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in session end callback:', error);
      }
    });
  }
}

/**
 * Factory function to create a new SessionLifecycle instance and return its methods
 * @param config - Optional configuration object
 * @returns Object containing on_session_start and on_session_end methods
 */
export function createSessionLifecycle(config?: SessionLifecycleConfig): SessionLifecycleMethods {
  const instance = new SessionLifecycle(config);
  return instance.getMethods();
}

// Default export for easier importing
export default createSessionLifecycle;
