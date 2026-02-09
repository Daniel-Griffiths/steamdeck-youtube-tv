const {
  app,
  BrowserWindow,
  session,
  screen,
  webContents,
} = require("electron");
const { ElectronBlocker } = require("@ghostery/adblocker-electron");
const { autoUpdater } = require("electron-updater");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let blocker = null;
let updateDownloaded = false;

// Load blocker before creating window
async function initBlocker() {
  blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);

  // Enable on default session
  blocker.enableBlockingInSession(session.defaultSession);

  // Also enable on any new webContents (including webviews)
  app.on("web-contents-created", (event, contents) => {
    blocker.enableBlockingInSession(contents.session);
  });

  console.log("[AdBlocker] Initialized and ready");
}

function createWindow() {
  // Create the browser window.
  const { width = 1280, height = 720 } =
    screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width,
    height,
    icon: "icon.png",
    autoHideMenuBar: true,
    backgroundColor: "#282828",
    webPreferences: {
      webviewTag: true,
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // and load the index.html of the app.
  win.loadFile("index.html");

  win.maximize();

  // Open the DevTools.
  // win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  await initBlocker();
  createWindow();

  // Check for updates
  autoUpdater.checkForUpdates();
});

autoUpdater.on("update-downloaded", () => {
  updateDownloaded = true;
});

app.on("before-quit", () => {
  if (updateDownloaded) {
    autoUpdater.quitAndInstall(true, true);
  }
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
