import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required. Configure backend/.env before starting the API.')
}

export const pool = new Pool({ connectionString })