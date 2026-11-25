import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from './App'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('App', () => {
  it('shows that the foundation is ready when API and database checks pass', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'ok' }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: 'ok',
            service: 'api',
            checks: { database: 'up' },
          }),
          { status: 200 },
        ),
      )

    render(<App />)

    expect(screen.getByRole('heading', { name: 'Development foundation' })).toBeVisible()
    await waitFor(() => {
      expect(screen.getByText('Ready for development')).toBeVisible()
    })
  })

  it('shows offline services when the health request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network unavailable'))

    render(<App />)

    await waitFor(() => {
      expect(screen.getAllByText('offline')).toHaveLength(2)
    })
  })
})
