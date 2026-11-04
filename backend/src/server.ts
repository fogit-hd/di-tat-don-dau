import { createServer } from 'node:http'
import express from 'express'
import { createFactoryGame } from './games/di-tat-don-dau/server'
import { createDuckGame } from './games/duck-race/server'

/** Deployment composition only: games never import one another. One Render port. */
export function createBackend() {
  const app = express()
  const server = createServer(app)
  const factory = createFactoryGame(server)
  const duck = createDuckGame(server)

  // Preserve the full path and keep body limits, errors and state game-local.
  app.use((req, res, next) => {
    if (req.path === '/api/duck-race' || req.path.startsWith('/api/duck-race/')) {
      duck.app(req, res, next)
    } else {
      factory.app(req, res, next)
    }
  })

  async function start(port = Number(process.env.PORT || 4607), host = '0.0.0.0') {
    await factory.start()
    await duck.start()
    await new Promise<void>((resolve, reject) => {
      const failed = (error: Error) => { server.off('listening', ready); reject(error) }
      const ready = () => { server.off('error', failed); resolve() }
      server.once('error', failed)
      server.once('listening', ready)
      server.listen(port, host)
    })
  }

  async function close() {
    factory.stop()
    duck.stop()
    // io.close() would close the other game's shared HTTP listener as well.
    for (const game of [factory, duck]) {
      game.io.disconnectSockets(true)
      game.io.engine.close()
    }
    if (server.listening) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  }
  return { app, server, factory, duck, start, close }
}
