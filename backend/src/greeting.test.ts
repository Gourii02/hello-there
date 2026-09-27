import assert from 'node:assert/strict'
import test from 'node:test'
import { createGreeting } from './greeting.js'

test('greets a trimmed name', () => {
  assert.deepEqual(createGreeting('  Ada  '), { greeting: 'Hello, Ada!', name: 'Ada' })
})

test('rejects a blank name', () => {
  assert.deepEqual(createGreeting('   '), { error: 'Please enter your name.' })
})

test('rejects a name that is not text', () => {
  assert.deepEqual(createGreeting(42), { error: 'Please enter your name.' })
})

test('rejects names longer than 60 characters', () => {
  assert.deepEqual(createGreeting('a'.repeat(61)), {
    error: 'Your name must be 60 characters or fewer.',
  })
})