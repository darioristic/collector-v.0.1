import { EventEmitter } from "node:events";

/**
 * Type-safe event emitter singleton
 * Extends Node.js EventEmitter with type safety
 */
class TypedEventEmitter extends EventEmitter {
  /**
   * Emit a typed event
   */
  emit<T extends string | symbol>(event: T, ...args: unknown[]): boolean {
    return super.emit(event, ...args);
  }

  /**
   * Register an event listener with type safety
   */
  on<T extends string | symbol>(
    event: T,
    listener: (...args: unknown[]) => void
  ): this {
    return super.on(event, listener);
  }

  /**
   * Register a one-time event listener
   */
  once<T extends string | symbol>(
    event: T,
    listener: (...args: unknown[]) => void
  ): this {
    return super.once(event, listener);
  }

  /**
   * Remove an event listener
   */
  off<T extends string | symbol>(
    event: T,
    listener: (...args: unknown[]) => void
  ): this {
    return super.off(event, listener);
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string | symbol): this {
    return super.removeAllListeners(event);
  }
}

/**
 * Global event emitter instance
 * Use this throughout the application to emit and listen to events
 */
export const eventEmitter = new TypedEventEmitter();

/**
 * Set max listeners to prevent memory leaks
 * Adjust based on your application's needs
 */
eventEmitter.setMaxListeners(50);

