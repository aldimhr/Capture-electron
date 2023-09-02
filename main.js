const {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  MessageChannelMain,
  screen,
  Menu,
  Notification,
  clipboard,
} = require('electron');

const path = require('path');
const screenshot = require('screenshot-desktop');
let fs = require('fs');
const url = require('url');
const sharp = require('sharp');

const createWindow = () => {
  const win = new BrowserWindow({
    webPreferences: {
      contextIsolation: true,
      // nodeIntegration: false, // Disable nodeIntegration
      // contextIsolation: true, // Enable contextIsolation
      preload: path.join(__dirname, 'src/preload.js'),
    },
  });
  win.loadFile('src/index.html');
  win.maximize();
  // Uncomment the following line to open DevTools by default
  win.webContents.openDevTools();
  // Load index.html
  win.loadURL(
    url.format({
      pathname: path.join(__dirname, 'src/index.html'),
      protocol: 'file:',
      slashes: true,
    })
  );

  // We'll be sending one end of this channel to the main world of the
  // context-isolated page.
  const { port1, port2 } = new MessageChannelMain();

  // Register global shortcuts
  const shortcutKey = 'Control+Shift+A'; // You can change this to your desired shortcut key
  globalShortcut.register(shortcutKey, () => {
    // This callback will be executed when the shortcut key is pressed
    console.log('shortcut');

    port2.postMessage({
      taskbarHeight: getTaskBarHeight(),
    });
  });

  // The preload script will receive this IPC message and transfer the port
  // over to the main world.
  win.webContents.postMessage('shortcut-screenshot', null, [port1]);

  // -==================================
};

// Don't forget to unregister the globalShortcut when the app is about to quit
app.on('will-quit', () => {
  globalShortcut.unregister(shortcutKey);
});

app.on('ready', () => {
  ipcMain.handle('capture-screen', async () => {
    // get last display
    let displays = await screenshot.listDisplays();
    let img = await screenshot({ screen: displays[displays.length - 1].id });
    console.log(img);

    // save to local
    const currentDate = new Date();
    const formattedDateTime = currentDate.toLocaleString(); // Format tanggal dan waktu default
    let saveDirectory = path.join(app.getPath('pictures'), `Kepcer`);
    let fileName = formattedDateTime.replace(/\\|\//gi, '-').replace(/:|,/gi, ' ') + '.png';
    let filePath = saveImageToLocal(saveDirectory, fileName, img);

    const NOTIFICATION_TITLE = 'Kepcer';
    const NOTIFICATION_BODY = `Success capture screen
${saveDirectory}/${fileName}`;

    new Notification({
      title: NOTIFICATION_TITLE,
      body: NOTIFICATION_BODY,
    }).show();

    return { img, saveDirectory, filePath, fileName };
  });

  ipcMain.handle('capture-copy', async (img) => {
    console.log({ img });
    // clipboard.writeImage(img);
  });

  ipcMain.handle('capture-save', async () => {});
  ipcMain.handle('capture-delete', async () => {});

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function loadConfig(callback) {
  const filePath = './config.json';
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      // If the file doesn't exist or there's an error reading it, return an empty object
      callback({});
    } else {
      try {
        // Parse the JSON data into a JavaScript object
        const configData = JSON.parse(data);
        callback(configData);
      } catch (err) {
        // If there's an error parsing JSON, return an empty object
        callback({});
      }
    }
  });
}
function updateConfig(configData, callback) {
  const filePath = './config.json';

  // Convert the configuration object to JSON format
  const jsonConfig = JSON.stringify(configData, null, 2);

  // Write the JSON data to the file
  fs.writeFile(filePath, jsonConfig, 'utf8', (err) => {
    if (err) {
      console.error('Error saving the configuration:', err);
    } else {
      console.log('Configuration saved successfully!');
    }
    callback();
  });
}

function getTaskBarHeight() {
  // Get the primary display's bounds
  const primaryDisplay = screen.getPrimaryDisplay();
  const displayBounds = primaryDisplay.bounds;

  // Get the primary display's work area
  const workArea = primaryDisplay.workArea;

  // Calculate the taskbar height
  const taskbarHeight = displayBounds.height - workArea.height + 10;
  return taskbarHeight;
}

function saveImageToLocal(saveDirectory, fileName, img) {
  // Create the directory if it doesn't exist
  if (!fs.existsSync(saveDirectory)) {
    fs.mkdirSync(saveDirectory, { recursive: true });
  }

  // Save file
  const filePath = path.join(saveDirectory, fileName);

  sharp(img)
    .metadata()
    .then((metadata) => {
      // Use the sharp library to perform the crop operation
      const currentHeight = metadata.height;
      const newHeight = currentHeight - getTaskBarHeight();

      sharp(img)
        .extract({ left: 0, top: 0, width: metadata.width, height: newHeight })
        .toFile(filePath, (err) => {
          if (err) {
            console.error('Error cropping and saving the image:', err);
          } else {
            console.log('Image cropped and saved successfully!');
          }
        });
    });

  return filePath;
}
