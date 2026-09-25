/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Web Worker based timer to bypass background tab throttling in browsers (iOS/Android/Desktop)
class WorkerTimer {
  private worker: Worker | null = null;
  private nextId = 1;
  private callbacks = new Map<number, () => void>();
  private intervals = new Set<number>();

  constructor() {
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        const workerCode = `
          const timeouts = new Map();
          self.onmessage = function(e) {
            const { action, id, delay, isInterval } = e.data;
            if (action === 'set') {
              if (isInterval) {
                const timerId = setInterval(() => {
                  self.postMessage({ id });
                }, delay);
                timeouts.set(id, { timerId, isInterval: true });
              } else {
                const timerId = setTimeout(() => {
                  self.postMessage({ id });
                  timeouts.delete(id);
                }, delay);
                timeouts.set(id, { timerId, isInterval: false });
              }
            } else if (action === 'clear') {
              const item = timeouts.get(id);
              if (item) {
                if (item.isInterval) clearInterval(item.timerId);
                else clearTimeout(item.timerId);
                timeouts.delete(id);
              }
            }
          };
        `;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob));
        this.worker.onmessage = (e) => {
          const { id } = e.data;
          const callback = this.callbacks.get(id);
          if (callback) {
            callback();
            if (!this.intervals.has(id)) {
              this.callbacks.delete(id);
            }
          }
        };
      } catch (err) {
        console.warn('WorkerTimer initialization failed, falling back to window timers:', err);
        this.worker = null;
      }
    }
  }

  setTimeout(callback: () => void, delayMs: number): number {
    const id = this.nextId++;
    this.callbacks.set(id, callback);
    if (this.worker) {
      this.worker.postMessage({ action: 'set', id, delay: Math.max(0, delayMs), isInterval: false });
    } else {
      const fallbackId = window.setTimeout(() => {
        const cb = this.callbacks.get(id);
        if (cb) {
          cb();
          this.callbacks.delete(id);
        }
      }, delayMs);
      (this as any)[`_fallback_${id}`] = fallbackId;
    }
    return id;
  }

  clearTimeout(id: number): void {
    this.callbacks.delete(id);
    this.intervals.delete(id);
    if (this.worker) {
      this.worker.postMessage({ action: 'clear', id });
    } else {
      const fallbackId = (this as any)[`_fallback_${id}`];
      if (fallbackId) {
        window.clearTimeout(fallbackId);
        delete (this as any)[`_fallback_${id}`];
      }
    }
  }

  setInterval(callback: () => void, delayMs: number): number {
    const id = this.nextId++;
    this.callbacks.set(id, callback);
    this.intervals.add(id);
    if (this.worker) {
      this.worker.postMessage({ action: 'set', id, delay: Math.max(0, delayMs), isInterval: true });
    } else {
      const fallbackId = window.setInterval(() => {
        const cb = this.callbacks.get(id);
        if (cb) cb();
      }, delayMs);
      (this as any)[`_fallback_${id}`] = fallbackId;
    }
    return id;
  }

  clearInterval(id: number): void {
    this.clearTimeout(id);
  }
}

export const workerTimer = new WorkerTimer();
