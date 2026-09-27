import 'dotenv/config'
import express from 'express'
import { findBouquetPhoto } from './bouquet.js'
import { pool } from './db.js'
import { createGreeting } from './greeting.js'

type BouquetLoader = typeof findBouquetPhoto

export function createApp(loadBouquet: BouquetLoader = findBouquetPhoto) {
  const app = express()

  app.use(express.json({ limit: '10kb' }))

  app.get('/api/health', async (_request, response) => {
    try {
      await pool.query('SELECT 1')
      response.json({ status: 'ok' })
    } catch (error) {
      console.error('Database health check failed:', error)
      response.status(503).json({ status: 'unavailable' })
    }
  })

  app.get('/api/stats', async (_request, response) => {
    try {
      const result = await pool.query<{ total: number }>(
        'SELECT COUNT(*)::int AS total FROM greeting_submissions',
      )
      response.json({ totalGreetings: result.rows[0].total })
    } catch (error) {
      console.error('Greeting count query failed:', error)
      response.status(503).json({ error: 'The greeting count is temporarily unavailable.' })
    }
  })

  app.get('/api/bouquet', async (_request, response) => {
    try {
      response.json(await loadBouquet())
    } catch (error) {
      console.error('Bouquet image lookup failed:', error)
      response.status(502).json({ error: 'A bouquet image is unavailable right now.' })
    }
  })

  app.post('/api/greet', async (request, response) => {
    const result = createGreeting(request.body?.name)

    if ('error' in result) {
      response.status(400).json(result)
      return
    }

    try {
      await pool.query('INSERT INTO greeting_submissions (name) VALUES ($1)', [result.name])
      const count = await pool.query<{ total: number }>(
        'SELECT COUNT(*)::int AS total FROM greeting_submissions',
      )
      response.json({ greeting: result.greeting, totalGreetings: count.rows[0].total })
    } catch (error) {
      console.error('Greeting submission could not be saved:', error)
      response.status(503).json({ error: 'Your hello could not be saved. Please try again.' })
    }
  })

  return app
}

export default createApp()