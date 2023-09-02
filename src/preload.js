const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  handleCaptureScreen: () => ipcRenderer.invoke('capture-screen'),
  handleCaptureCopy: (img) => ipcRenderer.invoke('capture-copy', img),
  handleCaptureSave: () => ipcRenderer.invoke('capture-save'),
  handleCaptureDelete: () => ipcRenderer.invoke('capture-delete'),
});

// We need to wait until the main world is ready to receive the message before
// sending the port. We create this promise in the preload so it's guaranteed
// to register the onload listener before the load event is fired.
const windowLoaded = new Promise((resolve) => {
  window.onload = resolve;
});

ipcRenderer.on('shortcut-screenshot', async (event) => {
  await windowLoaded;

  // We use regular window.postMessage to transfer the port from the isolated
  // world to the main world.
  window.postMessage('shortcut-screenshot', '*', event.ports);
});
