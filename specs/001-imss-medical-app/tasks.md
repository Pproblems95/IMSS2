# Implementation Tasks: IMSS Medical Web Application

**Feature Branch**: `001-imss-medical-app`  
**Generated**: 2025-11-29  
**Specification**: [spec.md](spec.md)  
**Plan**: [plan.md](plan.md)  
**Task Generation Method**: `/speckit.tasks` workflow

## Task Generation Summary

- **Total Tasks**: 58 implementation tasks (includes 6 emergency escalation tasks + 1 business metrics alerting task)
- **User Stories**: 9 (P1: 3 stories, P2: 5 stories, P3: 1 story)
- **Task Breakdown**:
  - Phase 0: 8 research tasks
  - Phase 1: 9 design & infrastructure setup tasks
  - Phase 2A (US1-US3): 14 tasks for core P1 features
  - Phase 2B (US4-US8): 16 tasks for P2 essential features
  - Phase 2B (Emergency): 6 tasks for emergency escalation workflow (critical)
  - Phase 2C (US9): 3 tasks for P3 polish features
  - Phase 3: 3 QA & cross-cutting tasks (includes T079A alerting)
- **Parallelizable Tasks**: 24 (marked with [P]; includes emergency escalation frontend notification)
- **Independent Test Criteria**: Each user story includes specific, independently testable acceptance criteria
- **MVP Scope**: Phase 2A (US1-US3) covers core functionality: user authentication, appointment booking with urgency triage, and doctor directory
- **Estimated MVP Duration**: 4-6 weeks for core P1 features (160-200 development hours)

---

## Phase 0: Research & Infrastructure Preparation

**Goal**: Establish technical foundation, validate design decisions, and prepare development environment.

**Independent Test Criteria**: Each research task produces a documented decision and architectural pattern that can be validated against project requirements.

- [X] T001 Research triage algorithm standards with validation method `research.md` - 5-question assessment, IMSS protocol comparison, accuracy validation against doctor-assigned urgency (target: 95% per SC-003)
- [X] T002 [P] Evaluate Spanish localization libraries and Mexican formatting conventions `research.md` - i18n-js vs ngx-translate, date/time/currency formatting, medical terminology
- [X] T003 [P] Document CURP validation rules and IMSS integration options `research.md` - 18-character format, offline validation, potential API integration
- [X] T004 [P] Design appointment scheduling algorithm for urgency-based slot assignment `research.md` - High/Mid/Low urgency timing (24h/72h/1-2w), conflict avoidance logic, SC-004 validation strategy
- [X] T005 [P] Design Redis caching strategy for appointment slot lookup optimization `research.md` - Cache invalidation, <1s lookup performance target, load testing for 500 concurrent users, horizontal scaling approach
- [X] T006 [P] Research Mexican healthcare compliance and privacy requirements `research.md` - Mexican LGPD healthcare regulations, IMSS data protection standards, WCAG 2.1 AA accessibility guidelines, GDPR applicability
- [X] T007 [P] Establish structured logging and email service integration strategy `research.md` - JSON logging with CURP masking (first 6 chars), audit trail for medical data, SendGrid/AWS SES 2-minute SLA validation, Spanish email templates, error context requirements
- [X] T008 [P] Document JWT security and authentication best practices `research.md` - JWT token expiry (24 hours), refresh token strategy, token rotation, CURP as unique identifier, bcrypt configuration, HTTPS/TLS, CORS requirements

---

## Phase 1: Design Artifacts & Infrastructure Setup

**Goal**: Create detailed design documentation, API contracts, and local development environment. All tasks block Phase 2 implementation.

**Independent Test Criteria**: Each design artifact can be validated against specification requirements before implementation begins. API contracts validated by backend team independently of frontend.

- [X] T009 Create data model documentation with PostgreSQL schema `data-model.md` - 7 entities (User, Doctor, Appointment, UrgencyAssessment, MedicineRequest, SickLeaveRequest, DoctorSchedule) with relationships, constraints, indexes
- [X] T010 [P] Generate Auth API contract (OpenAPI) `contracts/auth.openapi.yaml` - POST /register (CURP validation), POST /login, POST /logout, POST /password-reset with request/response schemas
- [X] T011 [P] Generate Appointments API contract (OpenAPI) `contracts/appointments.openapi.yaml` - GET/POST/PUT /appointments, filtering by date/doctor/specialty, history endpoint with schemas
- [X] T012 [P] Generate Doctors API contract (OpenAPI) `contracts/doctors.openapi.yaml` - GET /doctors (directory), GET /doctors/:id (profile), GET /doctors/search (filter by specialty) with availability schemas
- [X] T013 [P] Generate Triage API contract (OpenAPI) `contracts/triage.openapi.yaml` - POST /triage/assess with 5-question questionnaire, urgency classification response (LOW/MID/HIGH)
- [X] T014 [P] Generate Requests API contract (OpenAPI) `contracts/requests.openapi.yaml` - POST/PUT medicine requests, POST/PUT sick leave requests with approval workflow schemas
- [X] T015 Create quickstart guide for local development `quickstart.md` - Prerequisites (Node.js 18+, PostgreSQL 14+, npm), backend/frontend setup, test running, local workflow example
- [X] T016 Initialize backend project structure with TypeScript, Express, PostgreSQL connection `backend/src/config/`, `backend/package.json`, `backend/tsconfig.json` - Database migrations setup, connection pooling configuration
- [X] T017 [P] Initialize frontend React project with TypeScript, Vite, routing `frontend/src/`, `frontend/package.json`, `frontend/tsconfig.json` - React Router setup, i18n-js configuration, environment variables structure

---

## Phase 2A: Core P1 Features (User Stories 1-3)

### User Story 1: Account Creation and Authentication (P1)

**Story Goal**: Users can create accounts with CURP-based registration and authenticate securely.

**Independent Test Criteria**: New user can register with valid CURP (18 chars), receive confirmation email in Spanish, log in successfully, access protected features, and log out.

**Implementation Tasks**:

- [X] T018 [US1] Implement User model with CURP primary identifier `backend/src/models/User.ts` - Attributes: id, email, password_hash, CURP (18 alphanumeric), name, phone, assigned_doctor_id, created_at, updated_at
- [X] T019 [US1] Implement CURP validation utility (18-character format) `backend/src/utils/validation.ts` - Offline validation, error messages in Spanish, integration with registration form
- [X] T020 [US1] Implement AuthService with registration workflow `backend/src/services/AuthService.ts` - CURP format validation, email uniqueness check, password hashing (bcrypt), user creation, error handling in Spanish
- [X] T021 [US1] Implement JWT token generation and verification `backend/src/utils/jwt.ts` - Token lifecycle (expiry: 24h), secure signing, CURP claim, token refresh strategy
- [X] T022 [US1] Create auth API endpoints (register, login, logout, password-reset) `backend/src/api/routes/auth.routes.ts` - POST /register, POST /login, POST /logout, POST /password-reset; request validation, Spanish error messages
- [X] T023 [US1] Implement authentication middleware for protected routes `backend/src/api/middleware/auth.middleware.ts` - JWT verification, CURP extraction, request context setup; reusable across all protected endpoints
- [X] T024 [P] [US1] Create Register component with CURP field validation `frontend/src/components/Auth/Register.tsx` - Spanish form labels, email/password/CURP/phone fields, real-time CURP validation (18 chars), submit to /register endpoint
- [X] T025 [P] [US1] Create Login component with credential form `frontend/src/components/Auth/Login.tsx` - Spanish form labels, email and password fields, login to /login endpoint, token storage in localStorage, error message display
- [X] T026 [US1] Create useAuth custom hook for authentication state `frontend/src/hooks/useAuth.ts` - Token management, user context (CURP, email, name), logout function, protected route wrapper
- [X] T027 [US1] Implement registration integration test (email + CURP format validation) `backend/tests/integration/auth.integration.test.ts` - Register with valid CURP, verify error for invalid CURP, verify email uniqueness, confirm user creation in DB
- [X] T028 [US1] Implement login integration test with JWT token validation `backend/tests/integration/auth.integration.test.ts` - Login with correct credentials, verify JWT token returned, verify token invalid after logout, test incorrect password rejection
- [X] T029 [P] [US1] Create Cypress end-to-end test for registration → login → dashboard flow `frontend/tests/e2e/registration.cy.ts` - Register new account, verify confirmation, login with new credentials, verify dashboard access, verify logout redirects to login

### User Story 2: Book Medical Appointments (P1)

**Story Goal**: Users can discover available appointment slots, select preferred date/doctor, complete triage assessment, and receive confirmation.

**Independent Test Criteria**: Logged-in user can filter appointments by doctor and date, select a slot, complete 5-question triage assessment, receive urgency classification, and get confirmation with unique reference number.

**Implementation Tasks**:

- [X] T030 [US2] Implement Appointment model with urgency level and status `backend/src/models/Appointment.ts` - Attributes: id, user_id FK, doctor_id FK, scheduled_at, urgency_level (enum: LOW/MID/HIGH), reason, status (enum: BOOKED/COMPLETED/CANCELLED), clinical_notes, created_at
- [X] T031 [US2] Implement DoctorSchedule model for slot availability `backend/src/models/DoctorSchedule.ts` - Attributes: id, doctor_id FK, date, available_slots (array), booked_slots (array), max_capacity; tracks doctor availability per day
- [X] T032 [P] [US2] Implement UrgencyAssessment model for triage responses `backend/src/models/UrgencyAssessment.ts` - Attributes: id, appointment_id FK, question_responses (JSON array of 5 answers), calculated_urgency (enum), timestamp; stores assessment data
- [X] T033 [US2] Implement TriageService with 5-question assessment algorithm `backend/src/services/TriageService.ts` - Evaluate responses to medical urgency questions, classify as LOW/MID/HIGH, store assessment, return classification; achieve 95% accuracy target per SC-003
- [X] T034 [P] [US2] Implement AppointmentService for booking and filtering `backend/src/services/AppointmentService.ts` - Create appointment, filter by date/doctor/specialty, check availability, prevent double-booking, generate unique reference number, persist to DB
- [X] T035 [US2] Implement SchedulingService for automatic assignment based on urgency `backend/src/services/SchedulingService.ts` - Assign slots based on urgency (High: 24h, Mid: 72h, Low: 1-2w), load balance across doctors, handle unavailability, return proposed appointment time
- [X] T036 [P] [US2] Create appointment API endpoints (list, create, filter, detail) `backend/src/api/routes/appointments.routes.ts` - GET /appointments (with filters), POST /appointments (create with triage), GET /appointments/:id, PUT /appointments/:id (cancel/reschedule)
- [X] T037 [P] [US2] Create BookAppointment component with doctor/date filtering `frontend/src/components/Appointments/BookAppointment.tsx` - Display available doctors and dates, filter by specialty/date range, select slot, show urgency assessment form, submit to POST /appointments endpoint
- [X] T038 [P] [US2] Create TriageQuestionnaire component with 5-question form `frontend/src/components/Triage/TriageQuestionnaire.tsx` - Display exactly 5 medical urgency questions in Spanish, capture responses (yes/no or severity scale), calculate urgency on submit, show urgency classification result
- [ ] T039 [US2] Implement appointment confirmation email service `backend/src/services/AppointmentService.ts` - Send Spanish-language confirmation email within 2 minutes of booking (SC-011), include appointment details, unique reference number, doctor info, instructions
- [X] T040 [US2] Create AppointmentList component showing booked appointments `frontend/src/components/Appointments/AppointmentList.tsx` - Display user's current/upcoming appointments, show date, doctor, urgency level, status; implement 3-minute booking flow achievement per SC-002
- [X] T041 [US2] Implement appointment booking integration test (slot selection + triage) `backend/tests/integration/appointments.integration.test.ts` - Create appointment with triage assessment, verify urgency classification stored, verify confirmation email triggered, verify slot no longer available (no double-booking)
- [X] T042 [P] [US2] Create Cypress test for appointment booking workflow `frontend/tests/e2e/appointment-booking.cy.ts` - Login, select doctor/date, complete triage (5 questions), receive urgency classification, confirm booking, verify appointment in list, verify reference number displayed

### User Story 3: View Doctor Information and Availability (P1)

**Story Goal**: Users can browse all doctors, filter by specialty, view profiles with qualifications and availability.

**Independent Test Criteria**: User can access doctor directory, filter doctors by specialty, view individual doctor profile with qualifications and current week availability, and select doctor for booking.

**Implementation Tasks**:

- [X] T043 [US3] Implement Doctor model with qualifications and ratings `backend/src/models/Doctor.ts` - Attributes: id, name, specialty, qualifications (array), years_experience, available_hours (JSON), current_patient_load, average_rating; doctor directory management
- [X] T044 [US3] Implement DoctorService for directory and availability queries `backend/src/services/DoctorService.ts` - Get all doctors, filter by specialty, check availability for date range, calculate response time, retrieve ratings; enable real-time availability display
- [X] T045 [P] [US3] Create doctor API endpoints (list, detail, search/filter) `backend/src/api/routes/doctors.routes.ts` - GET /doctors (directory), GET /doctors/:id (profile with availability), GET /doctors/search?specialty=X (filter); return availability data for booking flow
- [X] T046 [P] [US3] Create DoctorDirectory component showing all doctors `frontend/src/components/Doctors/DoctorDirectory.tsx` - Display doctor list with name, specialty, average rating, current availability status in Spanish; implement filtering UI
- [X] T047 [P] [US3] Create DoctorFilter component for specialty and availability filtering `frontend/src/components/Doctors/DoctorFilter.tsx` - Filter by specialty dropdown, filter by availability (today/this week/any date), real-time filter results, clear filters button
- [X] T048 [P] [US3] Create DoctorProfile component with qualifications and availability `frontend/src/components/Doctors/DoctorProfile.tsx` - Display doctor name, specialty, qualifications, years of experience, average rating, current week availability slots, "Book with this doctor" button
- [X] T049 [US3] Implement doctor directory integration test (filtering and detail) `backend/tests/integration/doctors.integration.test.ts` - Get all doctors, filter by specialty, verify doctor detail endpoint returns availability, verify ratings calculated correctly
- [X] T050 [P] [US3] Create Cypress test for doctor directory and filtering `frontend/tests/e2e/doctor-selection.cy.ts` - Access doctor directory, filter by specialty, view doctor profile, verify availability displayed, verify "Book with doctor" button functional

---

## Phase 2B: Essential P2 Features (User Stories 4-8) + Emergency Escalation

### Emergency Escalation Workflow (Critical Path)

**Story Goal**: System detects high-urgency emergency cases (trauma, chest pain) and routes to immediate emergency response with 911 dispatch and on-call physician notification.

**Independent Test Criteria**: Urgency assessment containing emergency symptoms (trauma/chest pain) triggers immediate escalation; system sends notification to on-call team within 1 minute; 911 dispatch integration functional.

**Implementation Tasks**:

- [ ] T050A [Emergency] Implement emergency case detection in TriageService `backend/src/services/TriageService.ts` - Identify emergency-level symptoms (trauma indicators, chest pain, difficulty breathing), flag appointments as EMERGENCY urgency level (beyond HIGH)
- [ ] T050B [Emergency] Create emergency escalation API endpoint `backend/src/api/routes/appointments.routes.ts` - POST /appointments/emergency-escalate, route to on-call team notification system, log emergency event with timestamp and patient info (CURP masked)
- [ ] T050C [Emergency] Implement on-call physician notification service `backend/src/services/OnCallService.ts` - Send emergency notification to on-call physician within 1 minute, include patient urgency level, symptoms summary, callback phone number
- [ ] T050D [Emergency] Create 911 dispatch integration stub `backend/src/services/DispatchService.ts` - Prepare for 911 system integration (Phase 3); for MVP, logs emergency events with recommended dispatch information; includes patient location and urgency details
- [ ] T050E [Emergency] Implement emergency escalation integration test `backend/tests/integration/emergency.integration.test.ts` - Test emergency case detection, verify escalation endpoint triggers notification, verify audit trail logging
- [ ] T050F [P] [Emergency] Create emergency case UI notification `frontend/src/components/Common/EmergencyNotification.tsx` - Display emergency escalation status to patient, show "Emergency Response Team Notified" message in Spanish, provide callback timeline

---

## Phase 2B: Essential P2 Features (User Stories 4-8)

### User Story 4: Automatic Appointment Assignment (P2)

**Story Goal**: System automatically assigns appointment times based on urgency level with user override option.

**Independent Test Criteria**: After urgency assessment, system proposes appointment time appropriate to urgency level (High: <24h, Mid: <72h, Low: 1-2 weeks); user can accept or manually select alternative.

**Implementation Tasks**:

- [ ] T051 [US4] Enhance SchedulingService with urgency-based time window assignment `backend/src/services/SchedulingService.ts` - Implement urgency-based slot assignment (High: 24h, Mid: 72h, Low: 1-2w), verify availability within window, return top 3 alternative slots
- [ ] T052 [P] [US4] Create appointment proposal UI showing automatic assignment `frontend/src/components/Appointments/AppointmentProposal.tsx` - Display system-recommended appointment time based on urgency, show urgency-based timing expectation, "Accept" and "View Alternatives" buttons, list 3 alternative options
- [ ] T053 [US4] Implement assignment verification integration test (urgency timing) `backend/tests/integration/scheduling.integration.test.ts` - Test High urgency (24h window), Mid urgency (72h window), Low urgency (1-2w window), verify alternatives available, verify assignment logic correct

### User Story 5: Change Assigned Doctor (P2)

**Story Goal**: Users can change their preferred doctor anytime with impact on future appointments.

**Independent Test Criteria**: User with assigned doctor can navigate to settings, select new doctor, verify change applied to user profile, and future appointments can be rescheduled with new doctor.

**Implementation Tasks**:

- [ ] T054 [US5] Add doctor change workflow to AuthService `backend/src/services/AuthService.ts` - Update user's preferred doctor, cascade to future appointments (mark for rescheduling), notify user of change
- [ ] T055 [P] [US5] Create DoctorChangeModal component in user profile `frontend/src/components/Auth/DoctorChangeModal.tsx` - Display current assigned doctor, show doctor directory for selection, "Change Doctor" confirmation button, success/error messages in Spanish
- [ ] T056 [US5] Create doctor change API endpoint `backend/src/api/routes/auth.routes.ts` - PUT /user/doctor (authenticated), update preferred doctor, return updated user object, trigger notification
- [ ] T057 [P] [US5] Add doctor change section to user profile/settings page `frontend/src/pages/DashboardPage.tsx` - Display current assigned doctor, "Change Doctor" button, trigger DoctorChangeModal, confirm change with toast notification

### User Story 6: Request Medications (P2)

**Story Goal**: Users submit medication requests for doctor review and approval with status tracking.

**Independent Test Criteria**: User can submit medicine request with medication name and reason, doctor receives request in queue, user sees status updates (pending/approved/denied) with doctor notes.

**Implementation Tasks**:

- [ ] T058 [US6] Implement MedicineRequest model and service `backend/src/models/MedicineRequest.ts`, `backend/src/services/MedicineService.ts` - Create request, track status (PENDING/APPROVED/DENIED), store doctor notes, generate pickup instructions
- [ ] T059 [P] [US6] Create medicine request API endpoints (create, list, update) `backend/src/api/routes/requests.routes.ts` - POST /medicine-requests (create), GET /medicine-requests (list user's requests), PUT /medicine-requests/:id (doctor approval/denial)
- [ ] T060 [P] [US6] Create MedicineRequestForm component `frontend/src/components/Requests/MedicineRequest.tsx` - Form for medication name, dosage, reason, submit to POST /medicine-requests, show success message with request ID
- [ ] T061 [US6] Create doctor medicine request queue endpoint `backend/src/api/routes/requests.routes.ts` - GET /medicine-requests/pending (for doctors), display requests for review, enable approval/denial with notes
- [ ] T062 [P] [US6] Create MedicineRequestList component showing request history `frontend/src/components/Requests/MedicineRequestList.tsx` - Display user's medicine requests with status (pending/approved/denied), doctor notes (if any), pickup instructions (if approved)

### User Story 7: View Appointment History (P2)

**Story Goal**: Users access complete record of past appointments with clinical notes and export capability.

**Independent Test Criteria**: User can navigate to appointment history, view all past appointments with date/doctor/reason/notes, and export history as PDF file.

**Implementation Tasks**:

- [ ] T063 [US7] Implement appointment history query in AppointmentService `backend/src/services/AppointmentService.ts` - Query completed appointments for user, include clinical notes, sort by date (newest first), support export to PDF format
- [ ] T064 [P] [US7] Create appointment history API endpoint `backend/src/api/routes/appointments.routes.ts` - GET /appointments/history (list past appointments), GET /appointments/history/export (PDF export) with user's appointment records
- [ ] T065 [P] [US7] Create AppointmentHistory component showing past appointments `frontend/src/components/Appointments/AppointmentHistory.tsx` - Display list of completed appointments with date, doctor, reason, status; add clinical notes section (if available)
- [ ] T066 [P] [US7] Implement PDF export functionality for appointment history `frontend/src/utils/pdfExport.ts` - Generate PDF with user name, CURP (masked), appointment list, clinical notes; trigger download on user action
- [ ] T067 [US7] Implement appointment history integration test (export functionality) `backend/tests/integration/appointments.integration.test.ts` - Query history, verify completed appointments returned, verify PDF export contains correct data

### User Story 8: Request Sick Leave (P2)

**Story Goal**: Users submit medical sick leave requests for doctor approval with certificate generation.

**Independent Test Criteria**: User submits sick leave request with dates and reason, doctor approves in queue, user receives and downloads official IMSS sick leave certificate.

**Implementation Tasks**:

- [ ] T068 [US8] Implement SickLeaveRequest model and service `backend/src/models/SickLeaveRequest.ts`, `backend/src/services/SickLeaveService.ts` - Create request, track status, generate IMSS-formatted certificate on approval, store certificate path
- [ ] T069 [P] [US8] Create sick leave request API endpoints (create, list, approve/deny) `backend/src/api/routes/requests.routes.ts` - POST /sick-leave-requests (create), GET /sick-leave-requests (list user's requests), PUT /sick-leave-requests/:id (doctor approval)
- [ ] T070 [P] [US8] Create SickLeaveRequestForm component `frontend/src/components/Requests/SickLeaveRequest.tsx` - Form for reason and date range selection, submit to POST /sick-leave-requests, show success with request ID
- [ ] T071 [US8] Implement IMSS sick leave certificate generation `backend/src/services/SickLeaveService.ts` - Generate PDF with IMSS header, user name, CURP, dates, doctor signature placeholder, official formatting per IMSS standards
- [ ] T072 [P] [US8] Create SickLeaveList component with download functionality `frontend/src/components/Requests/SickLeaveRequest.tsx` - Display approved sick leave requests, show dates and status, enable certificate download via /sick-leave-requests/:id/certificate endpoint
- [ ] T073 [US8] Implement sick leave request integration test (certificate generation) `backend/tests/integration/requests.integration.test.ts` - Create request, approve by doctor, verify certificate generated and accessible for download

---

## Phase 2C: Polish P3 Features (User Story 9)

### User Story 9: Request Sick Leave - P3 Polish (P3)

**Story Goal**: Optimize sick leave workflow and add advanced features (rescheduling, bulk export).

**Independent Test Criteria**: User can view all sick leave requests, download certificates, and filter/search by date range.

**Implementation Tasks**:

- [ ] T074 [US9] Implement sick leave request search and filtering `backend/src/services/SickLeaveService.ts` - Filter by date range, status (pending/approved/denied), enable bulk download of multiple certificates
- [ ] T075 [P] [US9] Create advanced SickLeaveFilter component with date range picker `frontend/src/components/Requests/SickLeaveFilter.tsx` - Filter sick leave requests by date range, status; bulk select and download functionality
- [ ] T076 [US9] Implement bulk certificate download functionality `frontend/src/utils/bulkExport.ts` - Generate ZIP file containing multiple certificates, trigger download with filename timestamp

---

## Phase 3: Quality Assurance & Cross-Cutting Concerns

**Goal**: Ensure system reliability, performance, accessibility, and observability.

**Independent Test Criteria**: System successfully handles 500 concurrent users, page load <2s, API response <500ms; WCAG 2.1 AA compliance verified; error tracking and logging operational.

- [ ] T077 Implement structured JSON logging across backend services `backend/src/utils/logger.ts` - Log all API requests/responses with CURP (masked), appointment ID, urgency level; include error context, stack traces, performance metrics; integrate with centralized logging (ELK stack or CloudWatch)
- [ ] T078 Implement error boundary components and centralized error handling `frontend/src/components/Common/ErrorBoundary.tsx`, `backend/src/api/middleware/errorHandler.middleware.ts` - Catch and log errors with user context, display Spanish error messages, avoid exposing sensitive data, trigger alerts for critical errors
- [ ] T079 Implement performance testing and load testing for 500 concurrent users `backend/tests/performance/` - Create load test suite (Artillery or k6) for appointment booking workflow (login → book → confirm), verify <2s page load and <500ms API response under 500 concurrent users; identify bottlenecks and optimize Redis caching per Phase 0 research (T005)
- [ ] T079A Configure business metric alerting thresholds `backend/src/monitoring/alerts.ts` - Define and configure alerts for: triage accuracy >95% (SC-003), doctor response time <4 hours (SC-013), appointment confirmation email delivery <2 minutes (SC-011), system uptime >99.5% (SC-008); integrate with monitoring dashboard

---

## Task Dependency Graph

**Critical Path (MVP - Phase 2A)**:

```
T018 (User Model)
  ↓
T020 (AuthService) ← T019 (CURP Validation)
  ↓
T022 (Auth Endpoints) ← T021 (JWT)
  ↓
T023 (Auth Middleware)
  ↓
[Parallel: T024, T025, T026]
  ↓
T027, T028, T029 (Auth Tests)
  ↓
T030 (Appointment Model)
  ├→ T031 (DoctorSchedule)
  ├→ T032 (UrgencyAssessment)
  ├→ T033 (TriageService)
  ├→ T034 (AppointmentService)
  ├→ T035 (SchedulingService)
  ↓
T036 (Appointment Endpoints)
  ↓
[Parallel: T037, T038, T040]
  ↓
T039 (Confirmation Email)
  ↓
T041, T042 (Booking Tests)
  ↓
T043 (Doctor Model)
  ↓
T044 (DoctorService)
  ↓
T045 (Doctor Endpoints)
  ↓
[Parallel: T046, T047, T048]
  ↓
T049, T050 (Doctor Tests)
```

**Non-Blocking (P2 & P3 Features)**:
- Phase 2B features (T051-T073) can start once auth and appointment infrastructure complete
- Phase 2C features (T074-T076) can start once P2 complete
- Phase 3 QA (T077-T079) should run continuously throughout Phases 2A-2C

---

## Parallel Execution Examples

**For User Story 1 (Auth)**: Tasks can execute in parallel after T018, T019:
- **Stream A**: T020 (AuthService) → T022 (Endpoints) → T027 (Tests)
- **Stream B**: T021 (JWT) → T023 (Middleware)
- **Stream C**: T024 (Register Component), T025 (Login Component), T026 (useAuth hook) → T029 (E2E Test)

**For User Story 2 (Appointments)**: Tasks can execute in parallel after models:
- **Stream A**: T033 (TriageService) → T038 (Component) → T041 (Integration Test)
- **Stream B**: T034 (AppointmentService) → T037 (Component) → T042 (E2E Test)
- **Stream C**: T035 (SchedulingService) → T039 (Email) + T040 (Component)

**For User Story 3 (Doctors)**: Tasks can execute in parallel after T043:
- **Stream A**: T044 (DoctorService) → T045 (Endpoints)
- **Stream B**: T046 (DoctorDirectory) + T047 (Filter) + T048 (Profile) → T050 (E2E Test)
- **Stream C**: T049 (Integration Test)

---

## Independent Testing Strategy

Each user story can be tested independently following this pattern:

**US1 Testing** (Auth):
- Unit: CURPService validation, password hashing, JWT creation/verification
- Integration: Registration + email, login + token verification, logout + token invalidation
- E2E: Register → confirm → login → access protected area → logout

**US2 Testing** (Appointments):
- Unit: Triage algorithm (95% accuracy), urgency classification, appointment filtering logic
- Integration: Book appointment + triage + confirmation email, verify no double-booking, verify urgency stored
- E2E: Login → select doctor/date → complete triage → receive confirmation → view in appointments list

**US3 Testing** (Doctors):
- Unit: Doctor filtering by specialty, availability calculation
- Integration: Get doctor list, filter by specialty, verify detail endpoint returns availability
- E2E: Access directory → filter by specialty → view profile → book appointment

**US4+ Testing** (P2 & P3 Features):
- Each follows similar pattern once core infrastructure (Auth + Appointments) is complete
- Can be tested independently by creating test user accounts and test doctor/appointment data

---

## MVP Scope Recommendation

**Minimum Viable Product = Phase 2A (US1-US3)**

This includes:
- ✅ Account registration with CURP-based authentication
- ✅ Appointment booking with urgency triage (5 questions → urgency classification)
- ✅ Doctor directory with filtering by specialty
- ✅ Automatic assignment based on urgency level
- ✅ Email confirmations in Spanish
- ✅ WCAG 2.1 AA basic compliance
- ✅ ~80% test coverage for core services

**Time Estimate**: 4-6 weeks (160-200 development hours)

**Deliverables**:
- Fully functional appointment booking system
- Validated triage algorithm (95% accuracy)
- Doctor directory with real-time availability
- User authentication with CURP validation
- Spanish UI with Mexican localization
- Email confirmations within 2 minutes

**P2 Features (US4-US8)** add:
- Automatic assignment refinements
- Doctor change workflow
- Medicine request workflow
- Sick leave certificate generation
- Appointment history with PDF export

**P3 Features (US9)** add:
- Advanced filtering and bulk operations
- Performance optimization under load

---

## Implementation Strategy

### Phase Execution Order

1. **Phase 0 (1-2 weeks)**: Research tasks (T001-T008) run in parallel to validate technical decisions
2. **Phase 1 (1 week)**: Design artifacts (T009-T017) created from research outcomes; unblock Phase 2 implementation
3. **Phase 2A (4-6 weeks)**: Core P1 features (T018-T050) using TDD (tests written first); MVP completion
4. **Phase 2B (3-4 weeks)**: P2 essential features (T051-T073) with same TDD rigor
5. **Phase 2C (1-2 weeks)**: P3 polish features (T074-T076)
6. **Phase 3 (Continuous)**: QA and cross-cutting concerns (T077-T079) throughout implementation

### Task Prioritization Within Phase

**Phase 2A Suggested Order**:
1. Start with T018-T028 (User authentication) - foundational, all features depend on this
2. Move to T030-T042 (Appointments + Triage) - core feature, can run in parallel after auth complete
3. Finish with T043-T050 (Doctors) - can run in parallel, less blocking dependency

### Team Composition Recommendation

- **1 Backend Engineer**: Phase 1 design (contracts), then T018-T035 (Auth + Appointments services)
- **1 Frontend Engineer**: T024-T025, T037-T040, T046-T048 (UI components)
- **1 QA Engineer**: T027-T029, T041-T042, T049-T050 (Testing; can start week 2)
- **1 DevOps/Infra**: T016-T017, T077-T079 (Infrastructure, logging, performance)

---

## Success Criteria per Phase

### Phase 2A Completion Criteria

- ✅ All auth endpoints tested and working (register, login, logout, password reset)
- ✅ All appointments can be booked end-to-end within 3 minutes
- ✅ Triage assessment produces urgency classification with 95% accuracy
- ✅ Doctor directory returns all doctors with real-time availability
- ✅ Appointment confirmation emails sent in Spanish within 2 minutes
- ✅ CURP validation rejects invalid formats, accepts 18-character valid formats
- ✅ All Phase 2A code reaches ≥80% test coverage
- ✅ Page load <2s, API response <500ms for all endpoints
- ✅ UI completely in Spanish with no English text
- ✅ WCAG 2.1 AA compliance verified for registration/login/booking flows

### Phase 2B Completion Criteria

- ✅ All P2 features (US4-US8) implemented and tested
- ✅ Medicine request and sick leave request workflows functional
- ✅ Appointment history and PDF export working
- ✅ Doctor change workflow tested
- ✅ 90% of features complete and merged to main branch

### Phase 2B Emergency Escalation Completion Criteria

- ✅ Emergency case detection functional (trauma/chest pain symptoms recognized)
- ✅ On-call physician notification sent within 1 minute of emergency escalation
- ✅ Emergency escalation endpoint tested and documented
- ✅ Patient sees emergency response status in UI
- ✅ Audit trail logs all emergency events with CURP (masked) and timestamp

### Phase 3 Completion Criteria

- ✅ Performance load test passes (500 concurrent users, <2s page load, <500ms API)
- ✅ Structured JSON logging active across all services with CURP masking and audit trail
- ✅ Error handling and observability complete
- ✅ Business metric alerting thresholds configured and operational
- ✅ 100% Phase 3 code coverage achieved
- ✅ Deployment pipeline working (CI/CD via GitHub Actions)

---

## Notes for Implementation

- **Test-First Approach**: Per project constitution, all features start with failing test. Services tested in isolation before component integration.
- **Spanish Localization**: All UI text, error messages, and emails MUST be Spanish (email-only for MVP; SMS deferred to Phase 2B). Use i18n-js with es.json translation file.
- **CURP Validation & Logging**: 18-character alphanumeric format. Validate at registration; mask first 6 chars in all logs and error messages.
- **Urgency Classification**: Five-question assessment determines LOW/MID/HIGH urgency; include emergency detection (trauma/chest pain) that triggers escalation workflow. Target 95% accuracy per SC-003.
- **Emergency Escalation**: Urgency assessment indicates HIGH+emergency symptoms → immediate 911 dispatch routing + on-call notification (T050A-T050F). Must be completed in Phase 2B.
- **Performance Targets**: Continuous monitoring required. <2s page load p95, <500ms API response p95 are gates for Phase 2 completion. Redis caching for <1s appointment lookup required.
- **Email Confirmations**: Must be sent within 2 minutes of booking (SC-011). Use transactional email service with Spanish templates; validate 2-minute SLA in Phase 0 research (T007).
- **Database**: PostgreSQL 14+ required. Use migrations for schema versioning (Knex or TypeORM).
- **Authentication**: JWT tokens with 24-hour expiry + refresh token strategy. Implement token rotation security (T023). HTTPS/CORS required.
- **Structured Logging**: JSON logging with CURP masking, audit trail for medical data, error context, business metrics. Exclude sensitive fields (passwords, payment data).
- **Business Metric Alerting**: Configure alerts for triage accuracy (>95%), doctor response (<4h), email delivery (<2min), system uptime (>99.5%).
- **No External Dependencies for MVP**: CURP validation offline, triage algorithm self-contained, emergency 911 integration stubbed for Phase 3.

---

**Status**: ✅ **TASKS READY FOR PHASE 2 IMPLEMENTATION** - All 52 tasks defined, prioritized, and ready for assignment.

