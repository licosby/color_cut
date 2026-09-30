/**
 * BrushThrottle - Throttles brush operations for smooth performance
 * Uses requestAnimationFrame and debouncing
 */
export class BrushThrottle {
  private pendingTriangles: Set<number> = new Set();
  private isProcessing = false;
  private lastFrameTime = 0;
  private frameInterval = 1000 / 60; // 60 FPS
  private callback: ((triangles: number[]) => void) | null = null;
  private debounceTimer: number | null = null;

  /**
   * Set the callback to process triangles
   */
  setCallback(callback: (triangles: number[]) => void): void {
    this.callback = callback;
  }

  /**
   * Add triangles to the pending queue (throttled)
   */
  addTriangles(triangles: number[]): void {
    for (const tri of triangles) {
      this.pendingTriangles.add(tri);
    }

    // Schedule processing on next frame
    if (!this.isProcessing) {
      this.scheduleProcessing();
    }
  }

  /**
   * Remove triangles from the pending queue (throttled)
   */
  removeTriangles(triangles: number[]): void {
    for (const tri of triangles) {
      this.pendingTriangles.delete(tri);
    }

    // Schedule processing on next frame
    if (!this.isProcessing) {
      this.scheduleProcessing();
    }
  }

  /**
   * Clear all pending triangles
   */
  clear(): void {
    this.pendingTriangles.clear();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private scheduleProcessing(): void {
    const now = performance.now();
    const timeSinceLastFrame = now - this.lastFrameTime;

    if (timeSinceLastFrame >= this.frameInterval) {
      // Process immediately
      this.processPending();
    } else {
      // Debounce to next frame
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = window.setTimeout(() => {
        this.processPending();
      }, this.frameInterval - timeSinceLastFrame);
    }
  }

  private processPending(): void {
    if (this.pendingTriangles.size === 0 || !this.callback) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    this.lastFrameTime = performance.now();

    // Process in batches to avoid blocking
    const batchSize = Math.min(this.pendingTriangles.size, 5000);
    const batch: number[] = [];
    
    let count = 0;
    for (const tri of this.pendingTriangles) {
      if (count >= batchSize) break;
      batch.push(tri);
      this.pendingTriangles.delete(tri);
      count++;
    }

    // Call the callback with the batch
    this.callback(batch);

    // If there are more triangles, schedule another frame
    if (this.pendingTriangles.size > 0) {
      requestAnimationFrame(() => this.processPending());
    } else {
      this.isProcessing = false;
    }
  }

  /**
   * Get the number of pending triangles
   */
  getPendingCount(): number {
    return this.pendingTriangles.size;
  }

  /**
   * Check if currently processing
   */
  isBusy(): boolean {
    return this.isProcessing || this.pendingTriangles.size > 0;
  }
}
