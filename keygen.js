module.exports = () => {
  const DHT = require('@hyperswarm/dht')
  const b4a = require('b4a')

  const keyPair = DHT.keyPair()
  const publicKey = b4a.toString(keyPair.publicKey, 'hex')
  const secretKey = b4a.toString(keyPair.secretKey, 'hex')

  return { publicKey, secretKey }
}
