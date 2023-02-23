import { useState, useEffect, useRef } from 'react'
import { v4 } from 'uuid'
import Swal from 'sweetalert2'

export const App = () => {
  const messageEndRef = useRef(null)
  const [messageList, setMessageList] = useState([
    {
      id: '0',
      name: 'Server',
      timeStamp: '1677130069177',
      publicKey: 'server',
      message: 'Hi, welcome to SimpleChat! Go ahead and send me a message. 😄',
    },
  ])
  const [message, setMessage] = useState('')
  const [displayName, setDisplayName] = useState(
    localStorage.getItem('displayName') || null
  )
  const [publicKey, setPublicKey] = useState(
    localStorage.getItem('publicKey') || null
  )
  const [secretKey, setSecretKey] = useState(
    localStorage.getItem('secretKey') || null
  )
  const [loading, setLoading] = useState(true)

  const sendMessage = () => {
    const id = v4()
    const name = displayName
    const timeStamp = Date.now()
    const messageInstance = { id, name, timeStamp, publicKey, message }
    window.chatapi.sendMessage(JSON.stringify(messageInstance))
    appendMessage(messageInstance)
    setMessage('')
  }

  const appendMessage = (messageInstance) => {
    setMessageList((array) => {
      array = [...array, messageInstance]
      array = array.sort((a, b) => a.timeStamp - b.timeStamp)
      return array
    })
  }

  const newUserPopUp = async () => {
    const { value } = await Swal.fire({
      title: 'Enter your name',
      input: 'text',
    })
    window.chatapi.generateKey()
    window.chatapi.keyGenerated((event, keyPair) => {
      localStorage.setItem('publicKey', keyPair.publicKey)
      localStorage.setItem('secretKey', keyPair.secretKey)

      setPublicKey(keyPair.publicKey)
      setSecretKey(keyPair.secretKey)
      setLoading(false)
    })

    localStorage.setItem('displayName', value)
    setDisplayName(value)
  }

  useEffect(() => {
    if (publicKey === null) {
      newUserPopUp()
    } else {
      setLoading(false)
    }

    window.chatapi.receiveMessage((_event, messageInstance) => {
      messageInstance = JSON.parse(messageInstance)
      appendMessage(messageInstance)
    })

    window.chatapi.getOldMessages()
  }, [])

  useEffect(() => {
    if (messageEndRef.current !== null) {
      messageEndRef.current.scrollIntoView({ behaviour: 'smooth' })
    }
  })

  return loading ? (
    'Loading...'
  ) : (
    <section className="msger">
      <header className="msger-header">
        <div className="msger-header-title">
          <i className="fas fa-comment-alt"></i> Chat Application
        </div>
        <div className="msger-header-options">
          <span>
            <i className="fas fa-cog"></i>
          </span>
        </div>
      </header>

      <main className="msger-chat">
        {messageList.map((data) => {
          return (
            <div
              className={
                data.publicKey === publicKey ? 'msg right-msg' : 'msg left-msg'
              }
              key={data.id}
            >
              <div className="msg-img"></div>

              <div className="msg-bubble">
                <div className="msg-info">
                  <div className="msg-info-name">
                    {data.publicKey === publicKey ? 'You' : data.name}
                  </div>
                </div>

                <div className="msg-text" ref={messageEndRef}>
                  {data.message}
                </div>
              </div>
            </div>
          )
        })}
      </main>

      <form className="msger-inputarea">
        <input
          type="text"
          className="msger-input"
          placeholder="Enter your message..."
          value={message}
          onChange={(e) => {
            e.preventDefault()
            setMessage(e.target.value)
          }}
        />
        <button style={{ cursor: 'pointer' }} title="Upload Image">
          <i className="fas fa-image"></i>
        </button>
        <button
          type="submit"
          className="msger-send-btn"
          onClick={(e) => {
            e.preventDefault()
            sendMessage()
          }}
        >
          Send
        </button>
      </form>
    </section>
  )
}

