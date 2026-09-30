/**
 * ProjectManager - Handles auto-save and project state persistence
 * Saves to localStorage for recovery after browser refresh
 */
export class ProjectManager {
  private static STORAGE_KEY = 'colorcut3d-project';
  private static AUTOSAVE_INTERVAL = 30000; // 30 seconds
  private autoSaveTimer: number | null = null;

  /**
   * Save current project state to localStorage
   */
  save(state: {
    paintedTriangles: number[];
    layers: any[];
    connectors: any[];
    fileName: string;
  }): void {
    try {
      const serialized = JSON.stringify({
        ...state,
        timestamp: Date.now(),
        version: '1.0',
      });
      localStorage.setItem(ProjectManager.STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  }

  /**
   * Load project state from localStorage
   */
  load(): {
    paintedTriangles: number[];
    layers: any[];
    connectors: any[];
    fileName: string;
    timestamp: number;
  } | null {
    try {
      const serialized = localStorage.getItem(ProjectManager.STORAGE_KEY);
      if (!serialized) return null;

      const data = JSON.parse(serialized);
      
      // Validate data structure
      if (!data.paintedTriangles || !Array.isArray(data.paintedTriangles)) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to load project:', error);
      return null;
    }
  }

  /**
   * Check if there's a saved project
   */
  hasSavedProject(): boolean {
    return localStorage.getItem(ProjectManager.STORAGE_KEY) !== null;
  }

  /**
   * Clear saved project
   */
  clear(): void {
    localStorage.removeItem(ProjectManager.STORAGE_KEY);
  }

  /**
   * Start auto-save timer
   */
  startAutoSave(getState: () => {
    paintedTriangles: number[];
    layers: any[];
    connectors: any[];
    fileName: string;
  }): void {
    this.stopAutoSave();
    
    this.autoSaveTimer = window.setInterval(() => {
      const state = getState();
      this.save(state);
    }, ProjectManager.AUTOSAVE_INTERVAL);
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer !== null) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Get time since last save
   */
  getTimeSinceLastSave(): number | null {
    const data = this.load();
    if (!data) return null;
    return Date.now() - data.timestamp;
  }
}

export const projectManager = new ProjectManager();
