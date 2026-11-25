import { useEffect, useRef, useState } from 'react'

import { MemoryAudioCapture } from './audio'
import { criticalFieldAccuracy, wordErrorRate } from './metrics'
import { runAzure, runElevenLabs } from './providers'
import { voiceTestCases } from './testCases'
import type { CapturedAudio, HandoffEvent, ProviderName, ProviderResult } from './types'

type Availability = Record<ProviderName, boolean>

export function VoiceLab() {
  const [consented, setConsented] = useState(false)
  const [testCaseId, setTestCaseId] = useState(voiceTestCases[0].id)
  const [capturing, setCapturing] = useState(false)
  const [audio, setAudio] = useState<CapturedAudio | null>(null)
  const [availability, setAvailability] = useState<Availability>({ azure: false, elevenlabs: false })
  const [results, setResults] = useState<ProviderResult[]>([])
  const [running, setRunning] = useState<ProviderName | null>(null)
  const [error, setError] = useState('')
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [handoff, setHandoff] = useState<HandoffEvent | null>(null)
  const [correction, setCorrection] = useState('')
  const [corrections, setCorrections] = useState<string[]>([])
  const capture = useRef<MemoryAudioCapture | null>(null)
  const testCase = voiceTestCases.find((item) => item.id === testCaseId) ?? voiceTestCases[0]

  useEffect(() => {
    fetch('/api/voice-lab/providers')
      .then(async (response) => {
        if (!response.ok) throw new Error('Provider status unavailable')
        return (await response.json()) as { providers: { provider: ProviderName; configured: boolean }[] }
      })
      .then((payload) => {
        setAvailability(
          Object.fromEntries(payload.providers.map((provider) => [provider.provider, provider.configured])) as Availability,
        )
      })
      .catch(() => setError('The local API is unavailable. Start Docker Compose and refresh.'))
  }, [])

  useEffect(() => {
    return () => {
      if (audio) URL.revokeObjectURL(audio.playbackUrl)
    }
  }, [audio])

  const resetTrial = (nextCaseId = testCaseId) => {
    setTestCaseId(nextCaseId)
    setResults([])
    setFailedAttempts(0)
    setHandoff(null)
    setCorrection('')
    setCorrections([])
    setError('')
    if (audio) URL.revokeObjectURL(audio.playbackUrl)
    setAudio(null)
  }

  const toggleCapture = async () => {
    setError('')
    try {
      if (capturing) {
        const recorded = await capture.current!.stop()
        setAudio(recorded)
        setCapturing(false)
        return
      }
      if (!consented) throw new Error('Tick the consent box before recording.')
      capture.current = new MemoryAudioCapture()
      await capture.current.start()
      setCapturing(true)
    } catch (cause) {
      setCapturing(false)
      setError(cause instanceof Error ? cause.message : 'Microphone capture failed')
    }
  }

  const runProvider = async (provider: ProviderName) => {
    if (!audio) return
    setRunning(provider)
    setError('')
    try {
      const result = provider === 'azure' ? await runAzure(audio.pcm16, testCase) : await runElevenLabs(audio.pcm16, testCase)
      setResults((current) => [...current.filter((item) => item.provider !== provider), result])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `${provider} failed`)
    } finally {
      setRunning(null)
    }
  }

  const recordFailedAttempt = () => {
    const next = Math.min(2, failedAttempts + 1)
    setFailedAttempts(next)
    if (next === 2) {
      setHandoff({
        type: 'human_handoff_requested',
        reason: 'recognition_failed_twice',
        attempt_count: 2,
        test_case_id: testCase.id,
        created_at: new Date().toISOString(),
      })
    }
  }

  const addCorrection = () => {
    if (!correction.trim()) return
    setCorrections((current) => [...current, correction.trim()])
    setCorrection('')
  }

  const speakReply = () => {
    speechSynthesis.cancel()
    const reply = testCase.language === 'en' ? 'I heard you. Please confirm the order number.' : 'سمعتك. من فضلك أكد رقم الأوردر.'
    speechSynthesis.speak(new SpeechSynthesisUtterance(reply))
  }

  const exportMeasurements = () => {
    const payload = {
      schema_version: 1,
      created_at: new Date().toISOString(),
      test_case: testCase,
      recording: audio ? { duration_ms: audio.durationMs, retained: false } : null,
      results,
      corrections: corrections.map((text) => ({
        text,
        word_error_rate: wordErrorRate(testCase.prompt, text),
        critical_field_accuracy: criticalFieldAccuracy(testCase.criticalFields, text),
      })),
      failed_attempts: failedAttempts,
      handoff,
      note: 'No raw audio is included.',
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `voice-lab-${testCase.id}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="voice-shell">
      <section className="voice-lab" aria-labelledby="voice-title">
        <a className="back-link" href="/">← Foundation</a>
        <p className="eyebrow">Checkpoint 3 · Disposable experiment</p>
        <h1 id="voice-title">Voice feasibility lab</h1>
        <p className="hero__summary">Record one consented clip in memory, replay the exact same audio to both providers, and compare fields and latency.</p>

        <div className="privacy-banner"><strong>Privacy:</strong> the recording stays in this browser tab. Exported JSON contains measurements, never audio.</div>

        <div className="lab-grid">
          <section className="lab-card">
            <span className="step-number">01</span>
            <h2>Choose and record</h2>
            <label className="field-label" htmlFor="test-case">Consented test sentence</label>
            <select id="test-case" value={testCaseId} onChange={(event) => resetTrial(event.target.value)} disabled={capturing}>
              {voiceTestCases.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <blockquote lang={testCase.language === 'en' ? 'en' : 'ar'} dir={testCase.language === 'en' ? 'ltr' : 'rtl'}>{testCase.prompt}</blockquote>
            <p className="muted">Check: {testCase.purpose}. Critical fields: {testCase.criticalFields.join(', ')}</p>
            <label className="consent-row"><input type="checkbox" checked={consented} onChange={(event) => setConsented(event.target.checked)} /> I consent to recording this test sentence in browser memory.</label>
            <button className={capturing ? 'danger-button' : 'primary-button'} onClick={toggleCapture} disabled={!consented && !capturing}>{capturing ? 'Stop recording' : 'Start recording'}</button>
            {audio && <div className="audio-review"><audio controls src={audio.playbackUrl} /><span>{(audio.durationMs / 1000).toFixed(1)} seconds</span></div>}
          </section>

          <section className="lab-card">
            <span className="step-number">02</span>
            <h2>Replay and compare</h2>
            <div className="provider-actions">
              {(['azure', 'elevenlabs'] as const).map((provider) => (
                <button key={provider} onClick={() => runProvider(provider)} disabled={!audio || !availability[provider] || running !== null}>
                  {running === provider ? 'Running…' : `Run ${provider === 'azure' ? 'Azure' : 'ElevenLabs'}`}
                  <small>{availability[provider] ? 'configured' : 'needs local key'}</small>
                </button>
              ))}
            </div>
            {results.length === 0 && <p className="empty-state">No provider measurement yet.</p>}
            {results.map((result) => (
              <article className="result-card" key={`${result.provider}-${result.transcript}`}>
                <h3>{result.provider}</h3>
                <p>{result.transcript || 'No speech recognized'}</p>
                <dl><div><dt>Critical fields</dt><dd>{Math.round(result.criticalFieldAccuracy * 100)}%</dd></div><div><dt>WER</dt><dd>{result.wordErrorRate.toFixed(2)}</dd></div><div><dt>First partial</dt><dd>{result.partialLatencyMs ?? '—'} ms</dd></div><div><dt>Final</dt><dd>{result.finalLatencyMs ?? '—'} ms</dd></div></dl>
                {result.limitation && <small>{result.limitation}</small>}
              </article>
            ))}
          </section>

          <section className="lab-card">
            <span className="step-number">03</span>
            <h2>Correction and handoff</h2>
            <div className="inline-field"><input aria-label="Correct transcript" value={correction} onChange={(event) => setCorrection(event.target.value)} placeholder="Type the corrected words" /><button onClick={addCorrection}>Record correction</button></div>
            {corrections.length > 0 && <p className="muted">Recorded corrections: {corrections.join(' · ')}</p>}
            <div className="two-way"><button onClick={speakReply}>Play browser reply</button><button onClick={() => speechSynthesis.cancel()}>Interrupt reply</button></div>
            <button className="danger-button" onClick={recordFailedAttempt} disabled={failedAttempts >= 2}>Mark recognition attempt failed ({failedAttempts}/2)</button>
            {handoff && <pre className="event-output" aria-label="Structured handoff event">{JSON.stringify(handoff, null, 2)}</pre>}
          </section>
        </div>

        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="lab-footer"><button onClick={exportMeasurements} disabled={results.length === 0 && !handoff && corrections.length === 0}>Export measurement JSON</button><span>No audio leaves the export.</span></div>
      </section>
    </main>
  )
}
