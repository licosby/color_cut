const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script - Exposes safe IPC functions to the renderer process
 * via contextBridge for security (contextIsolation: true)
 */
contextBridge.exposeInMainWorld('api', {
  /**
   * Open a file dialog to select a 3D model
   * Returns: { filePath, fileName, extension, data } or null if cancelled
   */
  openModel: () => ipcRenderer.invoke('open-model'),

  /**
   * Save a single STL file
   * @param {string} filename - Suggested filename
   * @param {ArrayBuffer} data - STL binary data
   * Returns: { success, filePath } or { success: false, error }
   */
  saveSTL: (filename, data) => ipcRenderer.invoke('save-stl', { filename, data }),

  /**
   * Save multiple STL files to a directory
   * @param {Array<{filename: string, data: ArrayBuffer}>} files - Array of files to save
   * Returns: { success, files: string[] } or { success: false, error }
   */
  saveAllSTL: (files) => ipcRenderer.invoke('save-all-stl', { files }),

  /**
   * Get the default save location path
   * Returns: string path
   */
  getDefaultSavePath: () => ipcRenderer.invoke('get-default-save-path'),

  /**
   * Listen for events from main process
   */
  on: (channel, callback) => {
    const validChannels = ['export-progress', 'export-complete', 'error'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },

  /**
   * Remove event listener
   */
  removeListener: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  },
});
