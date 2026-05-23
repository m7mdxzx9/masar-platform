const { app, BrowserWindow, shell, Menu, Tray, globalShortcut, dialog, nativeImage } = require('electron')
const path = require('path')

let mainWindow
let tray

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createMenu() {
  const template = [
    {
      label: 'ملف (File)',
      submenu: [
        { label: 'فتح مختبر جديد', accelerator: 'CmdOrCtrl+N', click: () => mainWindow?.webContents.send('menu-new-lab') },
        { label: 'فتح نافذة جديدة', accelerator: 'CmdOrCtrl+Shift+N', click: () => { createWindow(); mainWindow?.loadURL(isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../dist/index.html')}`) } },
        { type: 'separator' },
        { label: 'تصدير المفكرة', accelerator: 'CmdOrCtrl+E', click: () => mainWindow?.webContents.send('menu-export-notebook') },
        { type: 'separator' },
        { role: 'quit', label: 'خروج' }
      ]
    },
    {
      label: 'تعديل (Edit)',
      submenu: [
        { role: 'undo', label: 'تراجع' },
        { role: 'redo', label: 'إعادة' },
        { type: 'separator' },
        { role: 'cut', label: 'قص' },
        { role: 'copy', label: 'نسخ' },
        { role: 'paste', label: 'لصق' },
        { role: 'selectAll', label: 'تحديد الكل' }
      ]
    },
    {
      label: 'عرض (View)',
      submenu: [
        { role: 'reload', label: 'إعادة تحميل' },
        { role: 'forceReload', label: 'إعادة تحميل كامل' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'إعادة التكبير' },
        { role: 'zoomIn', label: 'تكبير' },
        { role: 'zoomOut', label: 'تصغير' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'ملء الشاشة' },
        ...(isDev ? [{ type: 'separator' }, { role: 'toggleDevTools', label: 'أدوات المطور' }] : [])
      ]
    },
    {
      label: 'مساعدة (Help)',
      submenu: [
        { label: 'حول مسار', click: () => {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'حول مسار',
            message: 'Masar v2.0.0',
            detail: 'منصة مسار للتعلم الذكي\nMasar AI Learning Platform\n\nArabic-first RTL platform for AI-powered education.'
          })
        }},
        { label: 'موقع مسار', click: () => shell.openExternal('https://masar.ai') }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createTray() {
  const iconSize = process.platform === 'darwin' ? 16 : 32
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  tray.setToolTip('Masar - منصة مسار')

  const contextMenu = Menu.buildFromTemplate([
    { label: 'فتح مسار', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus() } else { createWindow() } } },
    { label: 'بدء جلسة تركيز', click: () => mainWindow?.webContents.send('tray-start-focus') },
    { label: 'فتح الملاحظات', click: () => {
      if (mainWindow) { mainWindow.show(); mainWindow.focus(); mainWindow.webContents.send('tray-open-notes') }
      else { createWindow(); mainWindow?.webContents.once('did-finish-load', () => mainWindow?.webContents.send('tray-open-notes')) }
    }},
    { label: 'فتح المختبر', click: () => {
      if (mainWindow) { mainWindow.show(); mainWindow.focus(); mainWindow.webContents.send('tray-open-lab') }
      else { createWindow(); mainWindow?.webContents.once('did-finish-load', () => mainWindow?.webContents.send('tray-open-lab')) }
    }},
    { type: 'separator' },
    { label: 'إخفاء', click: () => mainWindow?.hide() },
    { label: 'خروج', click: () => { app.isQuitting = true; app.quit() } }
  ])

  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => { if (mainWindow) { mainWindow.show(); mainWindow.focus() } else { createWindow() } })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/icon.png'),
    backgroundColor: '#0a0e17',
    titleBarStyle: process.platform === 'darwin' ? 'hidden' : 'default',
    trafficLightPosition: { x: 15, y: 15 },
    show: false,
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadURL(`file://${path.join(__dirname, '../dist/index.html')}`)
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (isDev) {
      tray?.setImage(nativeImage.createFromPath(path.join(__dirname, '../public/icon.png')))
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('close', (e) => {
    if (!app.isQuitting && tray) {
      e.preventDefault()
      mainWindow.hide()
    }
  })
}

function registerShortcuts() {
  if (isDev) {
    globalShortcut.register('CmdOrCtrl+Shift+I', () => {
      mainWindow?.webContents.toggleDevTools()
    })
  }

  globalShortcut.register('CmdOrCtrl+Shift+F', () => {
    mainWindow?.webContents.send('shortcut-start-focus')
  })

  globalShortcut.register('CmdOrCtrl+Shift+L', () => {
    mainWindow?.webContents.send('shortcut-open-lab')
  })

  globalShortcut.register('CmdOrCtrl+Shift+N', () => {
    mainWindow?.webContents.send('shortcut-new-note')
  })
}

app.whenReady().then(() => {
  createMenu()
  createWindow()
  createTray()
  registerShortcuts()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
    else mainWindow?.show()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  app.isQuitting = true
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
