const arabicDiacritics = /[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g
const punctuation = /[^\p{L}\p{N}\s]/gu
const digitMap: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
}

export function normalizeTranscript(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => digitMap[digit])
    .replace(arabicDiacritics, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLocaleLowerCase()
    .replace(punctuation, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function editDistance(reference: string[], hypothesis: string[]): number {
  const previous = Array.from({ length: hypothesis.length + 1 }, (_, index) => index)
  for (let row = 1; row <= reference.length; row += 1) {
    const current = [row]
    for (let column = 1; column <= hypothesis.length; column += 1) {
      const substitution = previous[column - 1] + (reference[row - 1] === hypothesis[column - 1] ? 0 : 1)
      current[column] = Math.min(previous[column] + 1, current[column - 1] + 1, substitution)
    }
    previous.splice(0, previous.length, ...current)
  }
  return previous[hypothesis.length]
}

export function wordErrorRate(reference: string, hypothesis: string): number {
  const referenceWords = normalizeTranscript(reference).split(' ').filter(Boolean)
  const hypothesisWords = normalizeTranscript(hypothesis).split(' ').filter(Boolean)
  if (referenceWords.length === 0) return hypothesisWords.length === 0 ? 0 : 1
  return editDistance(referenceWords, hypothesisWords) / referenceWords.length
}

export function criticalFieldAccuracy(fields: string[], transcript: string): number {
  if (fields.length === 0) return 1
  const normalizedTranscript = normalizeTranscript(transcript)
  const matches = fields.filter((field) => normalizedTranscript.includes(normalizeTranscript(field)))
  return matches.length / fields.length
}
