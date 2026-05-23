const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onMenuNewLab: (cb) => ipcRenderer.on('menu-new-lab', cb),
  onMenuExportNotebook: (cb) => ipcRenderer.on('menu-export-notebook', cb),
  onTrayStartFocus: (cb) => ipcRenderer.on('tray-start-focus', cb),
  onTrayOpenNotes: (cb) => ipcRenderer.on('tray-open-notes', cb),
  onTrayOpenLab: (cb) => ipcRenderer.on('tray-open-lab', cb),
  onShortcutStartFocus: (cb) => ipcRenderer.on('shortcut-start-focus', cb),
  onShortcutOpenLab: (cb) => ipcRenderer.on('shortcut-open-lab', cb),
  onShortcutNewNote: (cb) => ipcRenderer.on('shortcut-new-note', cb),
  isElectron: true
})
