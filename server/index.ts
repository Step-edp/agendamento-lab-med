import express from 'express'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { migrate } from './migrate.js'
import { seed } from './seed.js'
import { requireAuth } from './auth.js'
import { login, logout, me, exchangeSsoToken } from './routes/users.js'
import { listCsds } from './routes/csds.js'
import { createMeterSchedule, listMeterSchedules } from './routes/meter-schedules.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT ?? 3000)

async function start() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL não configurada.')
    process.exit(1)
  }

  await migrate()
  await seed()

  const app = express()

  const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  app.use((req, res, next) => {
    const origin = req.headers.origin
    if (origin && (allowedOrigins.length === 0 || allowedOrigins.includes(origin))) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Access-Control-Allow-Credentials', 'true')
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    if (req.method === 'OPTIONS') {
      res.sendStatus(204)
      return
    }
    next()
  })

  app.use(express.json({ limit: '2mb' }))
  app.use(cookieParser())

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, app: 'agendamento-lab-med' })
  })

  app.post('/api/auth/login', login)
  app.get('/api/auth/me', requireAuth, me)
  app.post('/api/auth/logout', logout)
  app.post('/api/auth/sso-exchange', exchangeSsoToken)

  app.get('/api/csds', requireAuth, listCsds)
  app.get('/api/meter-schedules', requireAuth, listMeterSchedules)
  app.post('/api/meter-schedules', requireAuth, createMeterSchedule)

  const distPath = path.resolve(__dirname, '../../dist')
  app.use(express.static(distPath))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })

  app.listen(PORT, () => {
    console.log(`Agendamento Lab Med rodando na porta ${PORT}`)
  })
}

start().catch((error) => {
  console.error('Falha ao iniciar servidor:', error)
  process.exit(1)
})
