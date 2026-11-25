import type { CapturedAudio } from './types'

const outputSampleRate = 16_000

function mergeFrames(frames: Float32Array[]): Float32Array {
  const length = frames.reduce((total, frame) => total + frame.length, 0)
  const merged = new Float32Array(length)
  let offset = 0
  for (const frame of frames) {
    merged.set(frame, offset)
    offset += frame.length
  }
  return merged
}

function resample(input: Float32Array, inputRate: number): Float32Array {
  if (inputRate === outputSampleRate) return input
  const outputLength = Math.round((input.length * outputSampleRate) / inputRate)
  const output = new Float32Array(outputLength)
  const ratio = inputRate / outputSampleRate
  for (let index = 0; index < outputLength; index += 1) {
    const position = index * ratio
    const left = Math.floor(position)
    const right = Math.min(left + 1, input.length - 1)
    const fraction = position - left
    output[index] = input[left] * (1 - fraction) + input[right] * fraction
  }
  return output
}

function toPcm16(input: Float32Array): Int16Array {
  return Int16Array.from(input, (sample) => {
    const clamped = Math.max(-1, Math.min(1, sample))
    return clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff
  })
}

function wavBlob(pcm: Int16Array): Blob {
  const buffer = new ArrayBuffer(44 + pcm.byteLength)
  const view = new DataView(buffer)
  const write = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index))
  }
  write(0, 'RIFF')
  view.setUint32(4, 36 + pcm.byteLength, true)
  write(8, 'WAVEfmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, outputSampleRate, true)
  view.setUint32(28, outputSampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  write(36, 'data')
  view.setUint32(40, pcm.byteLength, true)
  new Int16Array(buffer, 44).set(pcm)
  return new Blob([buffer], { type: 'audio/wav' })
}

export class MemoryAudioCapture {
  private context: AudioContext | null = null
  private stream: MediaStream | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private worklet: AudioWorkletNode | null = null
  private mute: GainNode | null = null
  private frames: Float32Array[] = []

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    this.context = new AudioContext()
    await this.context.audioWorklet.addModule('/pcm-capture-worklet.js')
    this.source = this.context.createMediaStreamSource(this.stream)
    this.worklet = new AudioWorkletNode(this.context, 'pcm-capture')
    this.mute = this.context.createGain()
    this.mute.gain.value = 0
    this.frames = []
    this.worklet.port.onmessage = (event: MessageEvent<Float32Array>) => {
      this.frames.push(new Float32Array(event.data))
    }
    this.source.connect(this.worklet).connect(this.mute).connect(this.context.destination)
  }

  async stop(): Promise<CapturedAudio> {
    if (!this.context || !this.stream) throw new Error('Recording has not started')
    const inputRate = this.context.sampleRate
    this.stream.getTracks().forEach((track) => track.stop())
    this.source?.disconnect()
    this.worklet?.disconnect()
    this.mute?.disconnect()
    await this.context.close()
    const pcm16 = toPcm16(resample(mergeFrames(this.frames), inputRate))
    const blob = wavBlob(pcm16)
    this.context = null
    this.stream = null
    return {
      pcm16,
      durationMs: Math.round((pcm16.length / outputSampleRate) * 1000),
      playbackUrl: URL.createObjectURL(blob),
    }
  }
}
