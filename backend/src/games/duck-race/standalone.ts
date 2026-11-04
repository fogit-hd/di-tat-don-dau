import { createServer } from 'node:http'
import express from 'express'
import { createDuckGame } from './server'

// Optional standalone deployment. The main backend already includes this game.
const app = express(), http = createServer(app), duck = createDuckGame(http)
app.use(duck.app)
void duck.start().then(() => {
  const port = Number(process.env.DUCK_PORT || process.env.PORT || 4608)
  http.listen(port, '0.0.0.0', () => console.log(`Quiz Duck Race API :${port}`))
}).catch(error => { duck.stop(); console.error('[duck-race startup]', error); process.exitCode = 1 })
