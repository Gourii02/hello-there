import 'dotenv/config'
import { spawnSync } from 'node:child_process'
import { Pool } from 'pg'
import { fileURLToPath } from 'node:url'

const explicitTestUrl = process.env.TEST_DATABASE_URL
const configuredUrl = explicitTestUrl ?? process.env.DATABASE_URL

if (!configuredUrl) {
  throw new Error('Set DATABASE_URL or TEST_DATABASE_URL before running integration tests.')
}

const testDatabaseUrl = new URL(configuredUrl)

if (!explicitTestUrl) {
  const applicationDatabaseName = decodeURIComponent(testDatabaseUrl.pathname.slice(1))
  if (!/^[a-zA-Z0-9_]+$/.test(applicationDatabaseName)) {
    throw new Error('The application database name must contain only letters, numbers, and underscores.')
  }
  testDatabaseUrl.pathname = `/${applicationDatabaseName}_test`
}

const testDatabaseName = decodeURIComponent(testDatabaseUrl.pathname.slice(1))

if (!/^[a-zA-Z0-9_]+_test$/.test(testDatabaseName)) {
  throw new Error('Integration tests only run against a database whose name ends in _test.')
}

const adminUrl = new URL(testDatabaseUrl)
adminUrl.pathname = '/postgres'
const adminPool = new Pool({ connectionString: adminUrl.toString() })

try {
  const existing = await adminPool.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [testDatabaseName],
  )

  if (existing.rowCount === 0) {
    await adminPool.query(`CREATE DATABASE "${testDatabaseName}"`)
    console.log(`Created isolated test database ${testDatabaseName}.`)
  }
} finally {
  await adminPool.end()
}

const backendDirectory = fileURLToPath(new URL('../', import.meta.url))
const migrationScript = fileURLToPath(new URL('./migrate.mjs', import.meta.url))
const testRunner = fileURLToPath(new URL('../../node_modules/tsx/dist/cli.mjs', import.meta.url))
const testEnvironment = { ...process.env, DATABASE_URL: testDatabaseUrl.toString() }

function run(commandArguments) {
  const result = spawnSync(process.execPath, commandArguments, {
    cwd: backendDirectory,
    env: testEnvironment,
    stdio: 'inherit',
  })

  if (result.error) throw result.error
  return result.status ?? 1
}

const migrationStatus = run([migrationScript])
if (migrationStatus !== 0) {
  process.exitCode = migrationStatus
} else {
  process.exitCode = run([testRunner, '--test', 'src/app.integration.test.ts'])
}