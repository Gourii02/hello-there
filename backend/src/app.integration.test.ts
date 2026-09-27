import assert from 'node:assert/strict'
import { once } from 'node:events'
import type { Server } from 'node:http'
import test, { after, before, beforeEach } from 'node:test'
import { createApp } from './app.js'
import type { BouquetPhoto } from './bouquet.js'
import { pool } from './db.js'

const connectionString = process.env.DATABASE_URL
if (!connectionString || !new URL(connectionString).pathname.endsWith('_test')) {
  throw new Error('Integration tests must use a PostgreSQL database ending in _test.')
}

const testBouquet: BouquetPhoto = {
  imageUrl: 'https://example.test/bouquet.jpg',
  sourceUrl: 'https://example.test/source',
  title: 'Test bouquet',
  artist: 'Test artist',
  license: 'Test license',
}

const app = createApp(async () => testBouquet)
let server: Server
let baseUrl: string

before(async () => {
  server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  baseUrl = `http://127.0.0.1:${address.port}`
})

beforeEach(async () => {
  await pool.query('TRUNCATE TABLE greeting_submissions RESTART IDENTITY')
})

after(async () => {
  if (server?.listening) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve())
    })
  }
  await pool.end()
})

test('saves a greeting and returns the updated database total', async () => {
  const response = await fetch(`${baseUrl}/api/greet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '  Ada  ' }),
  })

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    greeting: 'Hello, Ada!',
    totalGreetings: 1,
  })

  const saved = await pool.query<{ name: string }>(
    'SELECT name FROM greeting_submissions ORDER BY id',
  )
  assert.deepEqual(saved.rows, [{ name: 'Ada' }])

  const statsResponse = await fetch(`${baseUrl}/api/stats`)
  assert.deepEqual(await statsResponse.json(), { totalGreetings: 1 })
})

test('rejects a blank name without saving a row', async () => {
  const response = await fetch(`${baseUrl}/api/greet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '   ' }),
  })

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'Please enter your name.' })

  const count = await pool.query<{ total: number }>(
    'SELECT COUNT(*)::int AS total FROM greeting_submissions',
  )
  assert.equal(count.rows[0].total, 0)
})

test('returns the injected bouquet without calling Wikimedia', async () => {
  const response = await fetch(`${baseUrl}/api/bouquet`)
  assert.deepEqual(await response.json(), testBouquet)
})