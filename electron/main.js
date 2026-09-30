const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'ColorCut 3D',
    icon: path.join(__dirname, '../public/icons/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#f3f4f6',
    titleBarStyle: 'default',
    autoHideMenuBar: true,
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC: Open model file dialog
ipcMain.handle('open-model', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Load 3D Model',
    filters: [
      { name: '3D Models', extensions: ['stl', 'obj', 'glb', 'gltf', '3mf'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  const fileData = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const extension = path.extname(filePath).toLowerCase();

  return {
    filePath,
    fileName,
    extension,
    data: fileData.buffer,
  };
});

// IPC: Save STL file
ipcMain.handle('save-stl', async (event, { filename, data }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export STL File',
    defaultPath: path.join(app.getPath('documents'), 'ColorCut3D', filename),
    filters: [
      { name: 'STL Files', extensions: ['stl'] },
    ],
  });

  if (result.canceled || !result.filePath) {
    return { success: false, error: 'Cancelled' };
  }

  try {
    // Ensure directory exists
    const dir = path.dirname(result.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file
    const buffer = Buffer.from(data);
    fs.writeFileSync(result.filePath, buffer);

    return { success: true, filePath: result.filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC: Save all STL files to a directory
ipcMain.handle('save-all-stl', async (event, { files }) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Export Directory',
    properties: ['openDirectory', 'createDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, error: 'Cancelled' };
  }

  const outputDir = result.filePaths[0];
  const savedFiles = [];

  try {
    for (const file of files) {
      const filePath = path.join(outputDir, file.filename);
      const buffer = Buffer.from(file.data);
      fs.writeFileSync(filePath, buffer);
      savedFiles.push(filePath);
    }

    return { success: true, files: savedFiles };
  } catch (error) {
    return { success: false, error: error.message, savedFiles };
  }
});

// IPC: Get default save location
ipcMain.handle('get-default-save-path', () => {
  return path.join(app.getPath('documents'), 'ColorCut3D');
});
