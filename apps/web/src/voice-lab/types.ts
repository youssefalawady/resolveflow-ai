export type ProviderName = 'azure' | 'elevenlabs'

export type VoiceTestCase = {
  id: string
  label: string
  language: 'ar' | 'en' | 'mixed'
  azureLocale: 'ar-EG' | 'en-US'
  prompt: string
  criticalFields: string[]
  purpose: string
}

export type TranscriptUpdate = {
  text: string
  elapsedMs: number
}

export type ProviderResult = {
  provider: ProviderName
  transcript: string
  partialLatencyMs: number | null
  finalLatencyMs: number | null
  wordErrorRate: number
  criticalFieldAccuracy: number
  updates: TranscriptUpdate[]
  limitation?: string
}

export type CapturedAudio = {
  pcm16: Int16Array
  durationMs: number
  playbackUrl: string
}

export type HandoffEvent = {
  type: 'human_handoff_requested'
  reason: 'recognition_failed_twice'
  attempt_count: 2
  test_case_id: string
  created_at: string
}
