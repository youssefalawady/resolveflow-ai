import { describe, expect, it } from 'vitest'

import { criticalFieldAccuracy, normalizeTranscript, wordErrorRate } from './metrics'

describe('voice metrics', () => {
  it('normalizes Arabic digits and letter variants', () => {
    expect(normalizeTranscript('الأوردر ١٢٣٥!')).toBe('الاوردر 1235')
  })

  it('calculates word error rate', () => {
    expect(wordErrorRate('order 123 is late', 'order 123 is late')).toBe(0)
    expect(wordErrorRate('order 123 is late', 'order 124 is late')).toBe(0.25)
  })

  it('scores critical fields independently', () => {
    expect(criticalFieldAccuracy(['6402', 'refund'], 'الأوردر ٦٤٠٢ needs a refund')).toBe(1)
    expect(criticalFieldAccuracy(['6402', 'refund'], 'order 6402')).toBe(0.5)
  })
})
