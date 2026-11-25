import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { VoiceLab } from './VoiceLab'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('VoiceLab', () => {
  it('requires consent and exposes provider configuration without secrets', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          providers: [
            { provider: 'azure', configured: false, secret_exposed: false },
            { provider: 'elevenlabs', configured: true, secret_exposed: false },
          ],
          audio_retention: 'memory-only',
        }),
        { status: 200 },
      ),
    )

    render(<VoiceLab />)

    expect(screen.getByRole('button', { name: 'Start recording' })).toBeDisabled()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Run Azure.*needs local key/ })).toBeDisabled()
    })
    expect(screen.queryByText(/secret/i)).not.toBeInTheDocument()
  })

  it('creates a structured handoff after two failed recognition attempts', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ providers: [] }), { status: 200 }),
    )
    render(<VoiceLab />)

    fireEvent.click(screen.getByRole('button', { name: /Mark recognition attempt failed \(0\/2\)/ }))
    fireEvent.click(screen.getByRole('button', { name: /Mark recognition attempt failed \(1\/2\)/ }))

    const event = screen.getByLabelText('Structured handoff event')
    expect(event).toHaveTextContent('human_handoff_requested')
    expect(event).toHaveTextContent('recognition_failed_twice')
    expect(event).toHaveTextContent('"attempt_count": 2')
  })
})
