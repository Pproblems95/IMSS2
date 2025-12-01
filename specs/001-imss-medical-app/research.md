# Phase 0 Research: IMSS Medical Web Application

**Generated**: 2025-11-29
**Purpose**: Capture Phase 0 research outputs (T001-T008) with clear decisions, rationale, and implementation recommendations so Phase 1/2 can proceed without ambiguity.

## T001 - Triage algorithm standards and validation method

Objective: Define the 5-question triage algorithm structure, scoring, and validation method against doctor-assigned urgency.

Decision:
- Use a weighted scoring model across 5 questions (0-3 scale per question) with thresholds:
  - 0-4 => LOW
  - 5-8 => MID
  - 9-15 => HIGH
- Two emergency-trigger flags override total score: chest pain and severe breathing difficulty (immediate EMERGENCY)
- Store raw answers and computed score in `UrgencyAssessment` for auditability

Validation method:
- Create a small labeled dataset from 200 historical appointments (doctor-labelled urgency) for initial validation.
- Use stratified sampling: 70% train, 30% validation. Compute accuracy, precision, recall and confusion matrix.
- Target: >=95% match for HIGH classification; if not reached, iterate on question weights and thresholds.
- For production, run weekly batch validation and surface drift alerts via `T079A`.

Deliverables:
- `research/triage-algorithm.md` with questions, scoring, thresholds, and dataset schema
- Prototype `backend/src/services/TriageService.prototype.ts` implementing scoring and emergency flags
- Validation script `backend/tests/validation/triage_validation.ts` to run dataset checks

## T002 - Spanish localization libraries and Mexican formatting

Objective: Choose i18n tooling and date/number formatting libraries.

Decision:
- Use `i18next` + `react-i18next` (better community support) for frontend and `i18n-js` fallback; maintain `es-MX` locale files
- Use `Intl.DateTimeFormat('es-MX')` for date/time formatting; custom helper `frontend/src/utils/dateFormat.ts` to enforce `DD/MM/YYYY 24:00` patterns
- Use `dayjs` with `locale('es')` for parsing and formatting where needed

Deliverables:
- `frontend/src/i18n/es.json` translation file skeleton
- `frontend/src/utils/dateFormat.ts` enforcing Mexican formats
- List of medical term translations for review with Spanish-speaking clinical SME

## T003 - CURP validation rules and integration options

Objective: Validate CURP offline and determine if external IMSS API needed.

Decision:
- Implement offline CURP format validation according to official CURP regex (18 chars: 4 letters + 6 digits (DOB) + 6 alnum + 2 check) for client-side quick validation and server-side strict validation
- Do not integrate external CURP API for MVP (reduces dependencies); add optional connector in `CURPService` for future verification

Deliverables:
- `backend/src/utils/curpValidation.ts` with regex and tests
- `frontend/src/utils/validation.ts` with real-time CURP validation (masking display after submission)

## T004 - Appointment scheduling algorithm for urgency-based slot assignment

Objective: Determine algorithm for assigning slots based on urgency while avoiding conflicts.

Decision:
- Use a greedy assignment algorithm with backfilling across doctors of the same specialty:
  - For HIGH urgency: search next 24h window per doctor availability; prefer doctor with least current load
  - For MID urgency: search next 72h window
  - For LOW urgency: search next 1-2w window
- Use Redis cache for available slots per doctor/day to speed lookups; maintain write-through invalidation on booking/cancellation

Deliverables:
- `research/scheduling-algorithm.md` with pseudocode and complexity analysis
- `backend/src/services/SchedulingService.ts` initial implementation with Redis-backed slot index
- Performance benchmark script `backend/tests/performance/scheduling_benchmark.ts`

## T005 - Redis caching strategy for appointment slot lookup

Objective: Define cache keys, TTLs, and invalidation strategy to achieve <1s lookup performance.

Decision:
- Cache key pattern: `slots:{doctor_id}:{date}` storing available slot array and version token
- TTL: 60 seconds for hot data; use publish/subscribe invalidation on booking or schedule change
- On booking: write-through update to Redis and DB transaction; publish `slots:update:{doctor_id}` channel to notify other nodes
- Use Redis cluster for horizontal scaling; monitor miss ratio and adjust TTLs

Deliverables:
- `research/redis-strategy.md` with key patterns, TTL, invalidation, and sample code
- `backend/src/cache/slotsCache.ts` helper module
- Integration tests for cache invalidation on booking

## T006 - Mexican healthcare compliance and privacy requirements

Objective: Compile LGPD/IMSS privacy constraints and WCAG accessibility guidelines.

Decision:
- Follow Mexican healthcare privacy practices and store PII encrypted at rest using AES-256 for sensitive fields
- CURP stored encrypted; in logs CURP masked to first 6 characters only (e.g., "ABCDEF**********")
- Retention policy: appointment records retained 7 years; audit logs retained 1 year
- Accessibility: follow WCAG 2.1 AA; forms labelled, color contrast checked, keyboard nav tested

Deliverables:
- `research/privacy-compliance.md` summarizing LGPD and IMSS requirements and required DB encryption fields
- Server-side middleware `backend/src/api/middleware/privacy.middleware.ts` to mask CURP in logs
- Accessibility checklist for critical flows

## T007 - Structured logging and email service integration strategy

Objective: Define structured logging format and choose email provider.

Decision:
- Logging: Use JSON structured logging (Winston/Pino). Fields: timestamp, level, service, requestId, user: {curp_masked}, appointmentId, action, duration_ms, error (if any)
- Mask CURP using helper `maskCurp(curp)` before logging
- Email: Use AWS SES for reliability and deliverability; fallback provider SendGrid. Implement an adapter pattern for switching providers
- Email templates in Spanish stored in `backend/src/templates/emails/es/` and validated in Phase 1

Deliverables:
- `research/logging-email.md` with logging schema, retention, rotation, and SES adapter design
- `backend/src/utils/logger.ts` with maskCurp integration
- Email adapter `backend/src/services/EmailService.ts` supporting SES + SendGrid

## T008 - JWT security and authentication best practices

Objective: Define JWT lifecycles, refresh strategy, and token rotation.

Decision:
- Access token: JWT, expiry 24 hours, short-lived for sessions
- Refresh token: store server-side refresh token with one-time rotation; rotate on each use and revoke on logout
- Store refresh tokens in Redis with TTL 7 days and support token rotation (issue new refresh token and revoke old one)
- Use RS256 signing (asymmetric) if key management available; otherwise HS256 with secure secret rotation
- Require HTTPS/TLS for all endpoints; set `SameSite=Strict` for cookies if cookies used

Deliverables:
- `research/jwt-strategy.md` with token lifecycle, rotation, storage, and revocation patterns
- `backend/src/utils/jwt.ts` prototype implementing access & refresh token functions
- Integration tests for token rotation and revocation

---

## Next Steps (Immediate)

- Create `data-model.md` (T009) from spec entities and relationships
- Start Phase 1 API contract generation (T010-T014) using OpenAPI template
- Implement `backend` and `frontend` scaffolding (T016-T017)
- Schedule quick design review with clinical SME for triage questions and Spanish phrasing


**Phase 0 Status**: Deliverables for T001-T008 created as research artifacts and prototypes. Mark `T001-T008` as ready for Phase 1 consumption.
