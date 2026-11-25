# Draft Fictional Store Policies

> **DRAFT / FICTIONAL — NOT APPROVED FOR REAL CUSTOMERS**
>
> These rules exist only for the ResolveFlow AI university demonstration and seeded test data. They are proposed defaults, not legal advice, not a statement of any retailer's policy, and not yet team-approved. Implementation must use a versioned machine-readable policy file; this document explains the intended draft. Until the team approves `draft-v1`, all remedies should be treated as simulation-only.

## Policy metadata

- Proposed policy identifier: `resolveflow-demo-draft-v1`
- Status: draft
- Currency: EGP for seeded examples; amounts are stored as integer piastres/minor units.
- Time calculation: UTC timestamps, calendar-day windows, with customer-facing dates localized.
- Evidence and thresholds are scenario fixtures for evaluation, not production fraud controls.

## Universal rules

1. A confirmed order and affected item/charge are required before an automated remedy.
2. The system must check existing cases and completed/pending actions before proposing or executing a remedy.
3. A different issue on the same order is not automatically a duplicate.
4. The exact proposal and any required customer agreement are recorded before execution.
5. Current policy eligibility and business preconditions are rechecked immediately before mutation.
6. Each refund, replacement, credit, reservation, and shipment uses a stable idempotency key and a database uniqueness constraint.
7. The automated system may choose only remedies explicitly allowed below and within its authorization limits.
8. Conflicting critical evidence, unverifiable identity/order ownership, suspected abuse, policy exceptions, or any value above an automated limit must escalate.
9. A customer can request a human at any time without losing collected evidence.
10. A completed irreversible action remains completed. Follow-up uses a new authorized action or escalation, never a fictional rollback.

## Proposed automated authorization limits

| Remedy | Draft automated limit | Other requirements |
|---|---:|---|
| Refund to original payment method | up to EGP 2,000 per case | captured payment; unrefunded eligible amount; evidence/window rules pass |
| Replacement | item value up to EGP 2,000 | available reservable stock; eligible issue; shipping supported |
| Delivery-fee refund | up to the fee actually paid | qualifying late/undelivered outcome |
| Goodwill store credit | up to EGP 200 | allowed reason code; no duplicate credit for the same incident |
| Any combined remedy | up to EGP 2,000 total automated value | no double compensation for the same loss |

Values above these limits require human approval. The system never refunds more than the captured, not-previously-refunded amount attributable to the affected item/fee.

## Scenario policies

### Damaged item

Proposed window: report within **14 calendar days after recorded delivery**.

Required evidence:

- order/item and delivery are confirmed;
- customer description of damage;
- one supporting signal for automated action: development fixture evidence, carrier damage event, warehouse packing exception, or staff-verified photo flag. The demo should not pretend an LLM has reliably inspected a photo unless that capability is separately implemented and evaluated.

Eligible remedies, chosen once for the affected quantity:

- replacement when stock can be reserved; or
- refund of the affected item amount when replacement is unavailable or the customer prefers refund.

Return is waived for seeded low-value/unsafe-to-ship damaged items; all other return requirements are a draft exception that must be explicitly represented in the scenario. Reports after the window escalate rather than auto-deny if the evidence suggests carrier/warehouse fault.

### Missing item

Proposed window: report within **7 calendar days after delivery** (or the final parcel in a split shipment).

The investigator checks order lines, parcel splits, pick/pack records, delivered quantities, and prior remedies. If the item is still in a separate in-transit parcel, explain its status and do not compensate yet unless it is beyond its promised date. If evidence supports omission, offer replacement or affected-item refund within limits.

### Wrong item

Proposed window: report within **14 calendar days after delivery**.

Confirm expected and received item identifiers/descriptions. Offer replacement of the ordered item when stock is available, otherwise refund it. A return requirement, if any, must be explicit in the scenario and proposal. Do not create a replacement shipment until the stock reservation succeeds.

### Late delivery

Late means the current time is after the latest promised delivery timestamp and the delivery has not been recorded complete.

- If tracking has a credible near-term estimate, the default proposal is an updated expectation; a delivery-fee refund or goodwill credit may be offered when the order is at least **2 calendar days late**.
- If at least **7 calendar days late**, there is no usable tracking update, or the carrier marks the parcel lost, treat it as potentially undelivered.
- Perishable/time-critical seeded scenarios escalate when lateness makes the order unusable.

### Undelivered order

Required checks include delivery scan, recipient/location evidence available in the simulated service, carrier status, address confirmation flag, payment state, and prior remedies.

When carrier evidence says lost or the order is at least 7 days beyond the promise with no credible update, offer replacement or refund within limits. A conflict such as “delivered” scan versus customer non-receipt requires more evidence or escalation; the LLM must not choose which source is true by assertion.

### Refund outside the normal window

The deterministic checker returns `OUTSIDE_WINDOW` and does not authorize an automatic refund. The case escalates with the relevant evidence. Draft exception reason codes that a human may approve are:

- documented carrier or warehouse fault;
- system outage prevented an on-time complaint;
- serious accessibility/medical circumstance represented in the fictional scenario;
- staff promise already recorded;
- other exceptional circumstance with staff rationale.

Human approval creates a separate, attributable policy-exception decision. It does not rewrite the original rule result.

### Duplicate complaint

The same normalized order, affected line/quantity, issue type, and incident identity maps to one canonical issue fingerprint. A concurrent duplicate submission links to the existing case and returns its current status. It must not start a second remedy.

A complaint about another item, another parcel/incident, or a materially different issue on the same order receives a distinct fingerprint and may create a new linked case. Ambiguous matches are flagged for reconciliation rather than silently merged.

### Conflicting evidence

Critical conflict includes incompatible delivered quantities, payment/refund status, item identity, delivery state, or customer agreement. Automation may gather more evidence but cannot execute while a material conflict remains. The case escalates with both source references and a clear unresolved question.

## Customer agreement

Agreement is required before a replacement, refund, store credit, or remedy choice that changes customer rights/state. The system presents remedy type, amount/currency where applicable, affected item/quantity, destination/payment method at an appropriately masked level, and any return obligation. Agreement references the exact proposal version.

No new agreement is required for read-only investigation, status explanation, or escalation. If execution parameters materially change after agreement, create a new proposal version and ask again.

## Execution and compensation

For replacement:

1. authorize against this policy version and current evidence;
2. reserve the exact item/quantity;
3. create the replacement shipment;
4. on known final shipment failure, release the reservation as a separate compensation action;
5. on unknown shipment outcome, query by idempotency key before retry/release;
6. if release also fails, retain both failures and escalate for staff action.

For refund, the simulated finance service checks captured and already-refunded amounts within the same transaction/constraint boundary. A successful refund is not reversible in the workflow; correction requires a new staff-authorized process.

## Human escalation priorities (draft)

- **Urgent:** suspected account/payment security issue, repeated dangerous product report, or a live customer safety concern in a seeded scenario.
- **High:** customer explicitly requests a person, policy exception needed, conflicting critical evidence, high-value remedy, or failed/unknown mutation after retry budget.
- **Normal:** repeated speech recognition failure, unsupported issue type, missing evidence that automation cannot obtain, or routine staff review.

The university demo is not an emergency service. Customer-facing wording must not claim otherwise.

## Questions requiring team approval before implementation

- Confirm or change all time windows and EGP limits.
- Decide which seeded items require return and how return state is simulated.
- Decide the minimum evidence for damage/wrong-item claims without overclaiming image analysis.
- Decide whether goodwill credit is in scope and whether it can combine with a fee refund.
- Define customer identity verification suitable for a fictional demo.
- Define staff roles allowed to approve each exception/value tier.
- Confirm transcript/audio retention and consent language.
