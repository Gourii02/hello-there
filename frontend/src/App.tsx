import { useEffect, useState, type FormEvent } from 'react'
import './App.css'

type BouquetPhoto = {
  imageUrl: string
  sourceUrl: string
  title: string
  artist: string
  license: string
}

function App() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [totalGreetings, setTotalGreetings] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [greeting, setGreeting] = useState('')
  const [bouquet, setBouquet] = useState<BouquetPhoto | null>(null)
  const [bouquetError, setBouquetError] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([
      fetch('/api/health', { signal: controller.signal }),
      fetch('/api/stats', { signal: controller.signal }),
    ])
      .then(async ([healthResponse, statsResponse]) => {
        if (!healthResponse.ok || !statsResponse.ok) throw new Error('API check failed')
        const stats: { totalGreetings: number } = await statsResponse.json()
        setTotalGreetings(stats.totalGreetings)
        setApiStatus('online')
      })
      .catch(() => {
        if (!controller.signal.aborted) setApiStatus('offline')
      })

    return () => controller.abort()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setGreeting('')
    setBouquet(null)
    setBouquetError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/greet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data: { greeting?: string; error?: string; totalGreetings?: number } = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'Something went wrong. Please try again.')
      }

      setGreeting(data.greeting ?? '')
      if (typeof data.totalGreetings === 'number') setTotalGreetings(data.totalGreetings)

      try {
        const bouquetResponse = await fetch('/api/bouquet')
        if (!bouquetResponse.ok) throw new Error('Bouquet lookup failed')
        setBouquet(await bouquetResponse.json() as BouquetPhoto)
      } catch {
        setBouquetError('Your hello is ready, but the bouquet could not load just now.')
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not reach the server.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Hello home">
          <span className="wordmark-mark">h.</span>
          <span>hello, there</span>
        </a>
        <div className="service-status">
          <span className={`status-dot status-${apiStatus}`} />
          <span>{apiStatus === 'online' ? 'all systems friendly' : apiStatus === 'offline' ? 'api needs a moment' : 'checking in'}</span>
        </div>
      </header>

      <section className="greeting-stage" aria-labelledby="page-title">
        <p className="eyebrow"><span>01</span> A small web experiment</p>
        <h1 id="page-title">A little hello,<br />with <em>your</em> name on it.</h1>
        <p className="intro">Every good thing starts with an introduction.</p>

        <form className="greeting-form" onSubmit={handleSubmit}>
          <label className="visually-hidden" htmlFor="name">Your name</label>
          <input
            id="name"
            name="name"
            autoComplete="given-name"
            maxLength={60}
            placeholder="Your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-describedby={error ? 'form-message' : undefined}
            required
          />
          <button type="submit" disabled={isLoading}>
            <span>{isLoading ? 'One moment' : 'Say hello'}</span>
            <span className="button-arrow" aria-hidden="true">↗</span>
          </button>
        </form>

        <div className="response" aria-live="polite" aria-atomic="true">
          {greeting && bouquet && (
            <figure className="bouquet-card">
              <div className="bouquet-image-wrap">
                <img
                  src={bouquet.imageUrl}
                  alt={`Bouquet of flowers: ${bouquet.title}`}
                  onError={() => {
                    setBouquet(null)
                    setBouquetError('Your hello is ready, but the bouquet could not load just now.')
                  }}
                />
              </div>
              <figcaption className="bouquet-caption">
                <span className="bouquet-label">A little something for you</span>
                <p className="greeting-message">{greeting}<span>✳</span></p>
                <span className="bouquet-credit">
                  <a href={bouquet.sourceUrl} target="_blank" rel="noreferrer">
                    Photo: {bouquet.artist || bouquet.title} · {bouquet.license}
                  </a>
                </span>
              </figcaption>
            </figure>
          )}
          {greeting && !bouquet && <p className="greeting-message">{greeting}<span>✳</span></p>}
          {bouquetError && <p className="bouquet-error">{bouquetError}</p>}
          {error && <p className="error-message" id="form-message">{error}</p>}
        </div>

        <div className="stage-note">
          <span className="note-line" />
          <span>Made for the moment you arrive.</span>
        </div>
      </section>

      <footer className="bottom-bar">
        <span>HELLO WORLD / 001</span>
        <span className="submission-count" aria-live="polite">
          <strong>{totalGreetings ?? '—'}</strong> HELLOS SENT
        </span>
        <span>BUILT TO SAY HI</span>
      </footer>
    </main>
  )
}

export default App