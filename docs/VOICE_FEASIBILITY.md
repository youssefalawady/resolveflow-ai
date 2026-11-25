# Checkpoint 3 — Voice Feasibility

Status: **experiment implemented; real provider measurements and provider decision pending**.

This checkpoint is intentionally isolated from complaint logic. Its purpose is to measure the riskiest voice assumptions before the project commits to a provider or builds full voice orchestration.

## What the experiment does

The browser page at `http://localhost:5173/voice-lab`:

- requires explicit consent before requesting microphone permission;
- captures mono audio in browser memory and converts it to 16 kHz PCM;
- replays the same PCM clip at real-time pace to Azure Speech and ElevenLabs Scribe v3 Live;
- records first-partial and final-transcript latency;
- calculates normalized word error rate and exact inclusion of critical fields;
- supports a canned browser text-to-speech reply and immediate interruption;
- records manual corrections separately from provider output;
- produces a structured `human_handoff_requested` event after two marked recognition failures; and
- exports JSON measurements without raw audio or credentials.

Long-lived provider keys stay in the ignored server-side `.env`. The browser receives an Azure authorization token or an ElevenLabs single-use token from local FastAPI endpoints. Provider availability responses expose only booleans.

## Official documentation checked

Checked on **25 November 2026**. Prices and quotas are snapshots, not promises; recheck the linked provider pages before spending money or presenting current figures.

### Browser capture

- [`getUserMedia`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) requires a secure context and explicit user permission. `localhost` is treated as a trustworthy development origin.
- The experiment therefore never starts microphone capture on page load and cannot silently record.

### Azure Speech

- The [Azure language table](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support) lists Egyptian Arabic (`ar-EG`) for speech recognition.
- The [speech recognition guide](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-recognize-speech) documents browser microphone recognition and short-lived authorization-token use in the JavaScript SDK.
- Azure [language identification documentation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-identification) says continuous language identification cannot switch languages inside one sentence. For transparent comparison, mixed turns in this lab keep Azure fixed to `ar-EG` and record that limitation.
- The public [Azure Speech pricing page](https://azure.microsoft.com/pricing/details/speech/) showed an F0 allowance for standard real-time speech-to-text when checked. The exact offer depends on region and account, so no purchase or quota claim is treated as permanent.

### ElevenLabs Scribe

- [Realtime language options](https://elevenlabs.io/docs/eleven-api/guides/how-to/speech-to-text/realtime/language-options) document Scribe v3 Live multilingual mode, including mid-sentence language switching, through the raw WebSocket API.
- The [single-use token endpoint](https://elevenlabs.io/docs/api-reference/tokens/create) issues a `realtime_scribe` token that expires after 15 minutes and can have a bounded session duration. This lab requests a 120-second maximum.
- The [realtime speech-to-text WebSocket reference](https://elevenlabs.io/docs/api-reference/speech-to-text/v-1-speech-to-text-realtime) documents PCM 16 kHz chunks, partial transcripts, manual commit, and committed transcripts.
- The public [ElevenLabs pricing page](https://elevenlabs.io/pricing) showed limited free speech-to-text usage when checked. The lab does not assume that allowance will remain unchanged.

### LiveKit

- The [LiveKit JavaScript client reference](https://docs.livekit.io/reference/client-sdk-js/) and [React quickstart](https://docs.livekit.io/frontends/start/react-quickstart/) cover browser room connection and microphone publication.
- [LiveKit Cloud quotas and limits](https://docs.livekit.io/deploy/admin/quotas-and-limits/) distinguish hard-capped free/build usage from paid limits.
- LiveKit is deliberately not in this STT comparison. Adding a realtime transport layer would introduce another variable while recognition accuracy is still unknown. Revisit LiveKit for Checkpoint 8 after the recognition provider is selected.

## Fixed test set

Use only these synthetic, consented prompts. Do not substitute personal customer details.

| ID | Coverage | Prompt | Critical fields |
|---|---|---|---|
| `msa-damaged-order` | Modern Standard Arabic | `وصل طلبي رقم ٤٢١٧ والمنتج تالف` | `4217`, `تالف` |
| `egyptian-missing-item` | Egyptian Arabic | `الأوردر خمسة تمانية اتنين واحد ناقص منه الشاحن` | `5821`, `الشاحن` |
| `english-late-order` | English | `Order 7319 is three days late` | `7319`, `three days` |
| `mixed-refund` | Arabic/English code-switch | `الأوردر ٦٤٠٢ اتأخر و I need a refund` | `6402`, `refund` |
| `english-order-digits` | English spoken digits | `My order number is nine zero four six` | `9046` |
| `correction` | In-turn correction | `رقم الأوردر ١٢٣٤، لا معلش هو ١٢٣٥` | `1235` |
| `interruption` | Interruption/human request | `استنى، عايز أكلم موظف` | `موظف` |

## Fair measurement protocol

For each prompt:

1. Use the same quiet room, microphone, speaker distance, and natural speaking pace.
2. Record the prompt once and listen back to confirm the intended words are audible.
3. Send that exact in-memory clip once to Azure and once to ElevenLabs; do not rerecord per provider.
4. Save the exported JSON. Record provider errors and empty transcripts as failed runs rather than deleting them.
5. Repeat each prompt at least three times if free quotas permit. Report the number of successful and failed runs.

The UI measures latency from replay start, so it includes real-time audio transmission. Word error rate is a normalized word-level edit distance. Critical-field accuracy is the fraction of expected fields present after Arabic digit/diacritic and simple letter normalization. These are feasibility metrics, not a full linguistic evaluation.

## Raw measurements

No hosted-provider measurements have been collected yet. The implementation must not invent results. Add a summarized table here only after exported JSON files have been reviewed; raw audio must not be committed.

| Test case | Runs | Azure critical fields | ElevenLabs critical fields | Azure partial/final | ElevenLabs partial/final | Notes |
|---|---:|---:|---:|---|---|---|
| Pending | 0 | — | — | — | — | Credentials and human-spoken trials required |

## Decision gate

Provider selection is **not decided**. Choose only after the same clips have been measured. The decision should weigh:

- Egyptian Arabic and mid-sentence code-switch critical-field accuracy;
- order-number and correction accuracy;
- partial and final latency, including failed sessions;
- browser-token security and integration complexity;
- current quotas/pricing and the team's available university budget; and
- a safe fallback to text/human handoff.

Checkpoint 3 is complete only when the full small test set has real measurements, limitations and failed runs are documented, and the provider decision is recorded. The code and automated tests alone are not completion evidence.
