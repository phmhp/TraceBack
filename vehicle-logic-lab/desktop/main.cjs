const { app, BrowserWindow, Menu } = require('electron')
const path = require('node:path')
let gameWindow
app.setName('Vehicle Logic Lab')
if (!app.requestSingleInstanceLock()) app.quit()
else {
  app.on('second-instance', () => { if (gameWindow) { if (gameWindow.isMinimized()) gameWindow.restore(); gameWindow.focus() } })
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null)
    gameWindow = new BrowserWindow({
      width: 1440, height: 960, minWidth: 980, minHeight: 720,
      title: 'Vehicle Logic Lab — 꼬마차 정비소', backgroundColor: '#fbf5e6', icon: path.join(__dirname, 'app.png'),
      autoHideMenuBar: true, show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true },
    })
    gameWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    gameWindow.webContents.on('will-navigate', event => event.preventDefault())
    gameWindow.webContents.on('before-input-event', (event, input) => {
      if (input.type === 'keyDown' && input.key === 'F11') { event.preventDefault(); gameWindow.setFullScreen(!gameWindow.isFullScreen()) }
    })
    gameWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
    gameWindow.once('ready-to-show', () => { gameWindow.maximize(); gameWindow.show() })
    gameWindow.on('closed', () => { gameWindow = null })
  })
  app.on('window-all-closed', () => app.quit())
}
