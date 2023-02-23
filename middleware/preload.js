const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('chatapi', {
  generateKey: () => {
    ipcRenderer.send('generate:key')
  },
  keyGenerated: (keyPair) => {
    ipcRenderer.on('key:generated', keyPair)
  },
  sendMessage: (messageInstance) => {
    ipcRenderer.send('send:message', messageInstance)
  },
  receiveMessage: (messageInstance) => {
    ipcRenderer.on('received:message', messageInstance)
  },
  getOldMessages: () => {
    ipcRenderer.send('get:old:messages')
  },
})
