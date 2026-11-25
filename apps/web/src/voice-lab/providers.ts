import { criticalFieldAccuracy, wordErrorRate } from './metrics'
import type { ProviderResult, TranscriptUpdate, VoiceTestCase } from './types'

const sampleRate = 16_000
const chunkSamples = 1_600

const delay = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds))

async function postJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { method: 'POST' })
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { detail?: string }
    throw new Error(payload.detail ?? `Token request failed (${response.status})`)
  }
  return (await response.json()) as T
}

function resultFor(
  provider: ProviderResult['provider'],
  testCase: VoiceTestCase,
  transcript: string,
  updates: TranscriptUpdate[],
  finalLatencyMs: number | null,
  limitation?: string,
): ProviderResult {
  return {
    provider,
    transcript,
    partialLatencyMs: updates[0]?.elapsedMs ?? null,
    finalLatencyMs,
    wordErrorRate: wordErrorRate(testCase.prompt, transcript),
    criticalFieldAccuracy: criticalFieldAccuracy(testCase.criticalFields, transcript),
    updates,
    limitation,
  }
}

export async function runAzure(
  pcm16: Int16Array,
  testCase: VoiceTestCase,
): Promise<ProviderResult> {
  const SpeechSDK = await import('microsoft-cognitiveservices-speech-sdk')
  const auth = await postJson<{ token: string; region: string }>('/api/voice-lab/tokens/azure')
  const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(auth.token, auth.region)
  speechConfig.speechRecognitionLanguage = testCase.azureLocale
  const format = SpeechSDK.AudioStreamFormat.getWaveFormatPCM(sampleRate, 16, 1)
  const pushStream = SpeechSDK.AudioInputStream.createPushStream(format)
  const audioConfig = SpeechSDK.AudioConfig.fromStreamInput(pushStream)
  const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig)
  const startedAt = performance.now()
  const updates: TranscriptUpdate[] = []
  const finals: string[] = []
  let finalLatencyMs: number | null = null

  recognizer.recognizing = (_sender, event) => {
    if (event.result.text) updates.push({ text: event.result.text, elapsedMs: Math.round(performance.now() - startedAt) })
  }
  recognizer.recognized = (_sender, event) => {
    if (event.result.reason === SpeechSDK.ResultReason.RecognizedSpeech && event.result.text) {
      finals.push(event.result.text)
      finalLatencyMs = Math.round(performance.now() - startedAt)
    }
  }

  await new Promise<void>((resolve, reject) => recognizer.startContinuousRecognitionAsync(resolve, reject))
  for (let offset = 0; offset < pcm16.length; offset += chunkSamples) {
    const chunk = pcm16.slice(offset, offset + chunkSamples)
    pushStream.write(chunk.buffer as ArrayBuffer)
    await delay((chunk.length / sampleRate) * 1000)
  }
  pushStream.close()
  await delay(900)
  await new Promise<void>((resolve, reject) => recognizer.stopContinuousRecognitionAsync(resolve, reject))
  recognizer.close()
  const transcript = finals.join(' ').trim()
  return resultFor(
    'azure',
    testCase,
    transcript,
    updates,
    finalLatencyMs,
    testCase.language === 'mixed'
      ? 'Azure is intentionally fixed to ar-EG here; its documented continuous language ID cannot switch within one sentence.'
      : undefined,
  )
}

function bytesToBase64(chunk: Int16Array): string {
  const bytes = new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export async function runElevenLabs(
  pcm16: Int16Array,
  testCase: VoiceTestCase,
): Promise<ProviderResult> {
  const auth = await postJson<{ token: string }>('/api/voice-lab/tokens/elevenlabs')
  const parameters = new URLSearchParams({
    token: auth.token,
    model_id: 'scribe_v3_live',
    audio_format: 'pcm_16000',
    commit_strategy: 'manual',
    include_language_detection: 'true',
  })
  if (testCase.language === 'mixed') parameters.set('multilang_mode', 'true')
  else parameters.set('language_code', testCase.language)
  const socket = new WebSocket(`wss://api.elevenlabs.io/v1/speech-to-text/realtime?${parameters}`)
  const startedAt = performance.now()
  const updates: TranscriptUpdate[] = []

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('ElevenLabs connection timed out')), 10_000)
    socket.onopen = () => {
      window.clearTimeout(timeout)
      resolve()
    }
    socket.onerror = () => {
      window.clearTimeout(timeout)
      reject(new Error('ElevenLabs WebSocket connection failed'))
    }
  })

  const finalResult = new Promise<{ transcript: string; latency: number }>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('ElevenLabs final transcript timed out')), 15_000)
    socket.onmessage = (event: MessageEvent<string>) => {
      const message = JSON.parse(event.data) as { message_type?: string; text?: string }
      if (message.message_type === 'partial_transcript' && message.text) {
        updates.push({ text: message.text, elapsedMs: Math.round(performance.now() - startedAt) })
      }
      if (message.message_type === 'committed_transcript') {
        window.clearTimeout(timeout)
        resolve({ transcript: message.text ?? '', latency: Math.round(performance.now() - startedAt) })
      }
    }
    socket.onerror = () => {
      window.clearTimeout(timeout)
      reject(new Error('ElevenLabs transcription failed'))
    }
  })

  for (let offset = 0; offset < pcm16.length; offset += chunkSamples) {
    const chunk = pcm16.slice(offset, offset + chunkSamples)
    socket.send(
      JSON.stringify({
        message_type: 'input_audio_chunk',
        audio_base_64: bytesToBase64(chunk),
        commit: offset + chunkSamples >= pcm16.length,
      }),
    )
    await delay((chunk.length / sampleRate) * 1000)
  }
  const final = await finalResult
  socket.close()
  return resultFor('elevenlabs', testCase, final.transcript, updates, final.latency)
}
