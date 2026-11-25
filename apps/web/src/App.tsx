import { useEffect, useState } from 'react'

type ServiceState = 'checking' | 'online' | 'offline'

type HealthResponse = {
  status: 'ok' | 'not_ready'
  service: string
  checks: Record<string, 'up' | 'down'> | null
}

type EnvironmentState = {
  api: ServiceState
  database: ServiceState
}

const initialState: EnvironmentState = {
  api: 'checking',
  database: 'checking',
}

async function readEnvironmentHealth(): Promise<EnvironmentState> {
  const [liveResponse, readyResponse] = await Promise.all([
    fetch('/api/health/live'),
    fetch('/api/health/ready'),
  ])

  const readiness = (await readyResponse.json()) as HealthResponse

  return {
    api: liveResponse.ok ? 'online' : 'offline',
    database:
      readyResponse.ok && readiness.checks?.database === 'up' ? 'online' : 'offline',
  }
}

function StatusBadge({ state }: { state: ServiceState }) {
  return (
    <span className={`status status--${state}`}>
      <span className="status__dot" aria-hidden="true" />
      {state}
    </span>
  )
}

export default function App() {
  const [environment, setEnvironment] = useState<EnvironmentState>(initialState)

  useEffect(() => {
    let active = true

    readEnvironmentHealth()
      .then((health) => {
        if (active) setEnvironment(health)
      })
      .catch(() => {
        if (active) setEnvironment({ api: 'offline', database: 'offline' })
      })

    return () => {
      active = false
    }
  }, [])

  const foundationReady =
    environment.api === 'online' && environment.database === 'online'

  return (
    <main className="page-shell">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">ResolveFlow AI</p>
        <h1 id="page-title">Development foundation</h1>
        <p className="hero__summary">
          The application shell is connected. Complaint workflows, agents, and voice features
          will be added in later checkpoints.
        </p>

        <div className={`summary-card ${foundationReady ? 'summary-card--ready' : ''}`}>
          <span className="summary-card__label">Environment</span>
          <strong>{foundationReady ? 'Ready for development' : 'Checking services'}</strong>
        </div>

        <div className="service-grid" aria-label="Service status">
          <article className="service-card">
            <div>
              <span className="service-card__number">01</span>
              <h2>FastAPI</h2>
              <p>HTTP boundary and health endpoints</p>
            </div>
            <StatusBadge state={environment.api} />
          </article>

          <article className="service-card">
            <div>
              <span className="service-card__number">02</span>
              <h2>PostgreSQL</h2>
              <p>Durable project data and migrations</p>
            </div>
            <StatusBadge state={environment.database} />
          </article>

          <article className="service-card">
            <div>
              <span className="service-card__number">03</span>
              <h2>React</h2>
              <p>Customer and staff interfaces</p>
            </div>
            <StatusBadge state="online" />
          </article>
        </div>

        <p className="checkpoint-note">
          Checkpoint 2 · Foundation only · No customer data or hosted AI services
        </p>
      </section>
    </main>
  )
}
