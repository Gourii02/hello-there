export type GreetingResult =
  | { greeting: string; name: string }
  | { error: string }

export function createGreeting(name: unknown): GreetingResult {
  if (typeof name !== 'string' || name.trim().length === 0) {
    return { error: 'Please enter your name.' }
  }

  const trimmedName = name.trim()
  if (trimmedName.length > 60) {
    return { error: 'Your name must be 60 characters or fewer.' }
  }

  return { greeting: `Hello, ${trimmedName}!`, name: trimmedName }
}