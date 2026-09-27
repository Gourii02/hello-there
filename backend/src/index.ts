import express from 'express'
import { fileURLToPath } from 'node:url'
import app from './app.js'

const port = Number(process.env.PORT) || 3001
const frontendDist = fileURLToPath(new URL('../../frontend/dist/', import.meta.url))
const frontendIndex = fileURLToPath(new URL('../../frontend/dist/index.html', import.meta.url))

app.use(express.static(frontendDist))
app.get(/^(?!\/api(?:\/|$)).*/, (_request, response) => {
  response.sendFile(frontendIndex)
})

app.listen(port, () => {
  console.log(`Greeting API listening on http://localhost:${port}`)
})