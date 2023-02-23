require('dotenv').config()
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

const Hyperswarm = require('hyperswarm')
const Corestore = require('corestore')
const Hyperdrive = require('hyperdrive')
const b4a = require('b4a')
const goodbye = require('graceful-goodbye')

const keygen = require('./keygen')

const swarm = new Hyperswarm()
const store = new Corestore('storage')
const drive = new Hyperdrive(store)
const conns = []
let topic
let discovery

swarm.on('connection', async (conn) => {
  const data = []
  for await (const entry of drive.entries()) {
    data.push(JSON.parse((await drive.get(entry.key)).toString()))
  }
  conn.write(JSON.stringify(data))
  conns.push(conn)
  conn.once('close', () => conns.splice(conns.indexOf(conn), 1))
  conn.on('data', async (data) => {
    try {
      data = b4a.toString(data, 'utf-8')
      data = JSON.parse(data)
      if (Array.isArray(data)) {
        for (const singleField of data) {
          await drive.put(
            `MessageAt${singleField.timeStamp}`,
            JSON.stringify(singleField)
          )
        }
      } else {
        window.webContents.send('received:message', JSON.stringify(data))
        await drive.put(`MessageAt${data.timeStamp}`, JSON.stringify(data))
      }
    } catch (err) {
      return
    }
  })
})

let mainWindow
let window

goodbye(() => swarm.destroy())

drive.ready().then(() => {
  // eslint-disable-next-line no-undef
  topic = process.env.TOPIC
  discovery = swarm.join(b4a.from(topic, 'hex'), { server: true, client: true })
  discovery.flushed().then(() => {
    mainWindow = () => {
      window = new BrowserWindow({
        webPreferences: {
          // eslint-disable-next-line no-undef
          preload: path.join(__dirname) + '/middleware/preload.js',
        },
      })

      ipcMain.on('generate:key', () => {
        const { publicKey, secretKey } = keygen()
        const keyPair = { publicKey, secretKey }
        window.webContents.send('key:generated', keyPair)
      })

      ipcMain.on('send:message', async (_event, messageInstance) => {
        messageInstance = JSON.parse(messageInstance)
        await drive.put(
          `MessageAt${messageInstance.timeStamp}`,
          JSON.stringify(messageInstance)
        )
        for (const conn of conns) {
          conn.write(JSON.stringify(messageInstance))
        }
      })

      ipcMain.on('get:old:messages', async () => {
        for await (const entry of drive.entries()) {
          window.webContents.send(
            'received:message',
            (await drive.get(entry.key)).toString()
          )
        }
      })

      window.loadURL('http://localhost:3000')
    }

    app.whenReady().then(() => {
      mainWindow()
    })
  })
})
