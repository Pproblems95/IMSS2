# Project Constitution
<!-- Governance framework for code quality, testing discipline, user experience, and performance -->

## Core Principles

### I. Code Quality First
Every code change MUST meet these non-negotiable standards: (a) Passes automated linting without exceptions; (b) Maintains or improves code coverage ≥80%; (c) Includes clear comments for complex logic; (d) Follows DRY principle—no code duplication >3 lines; (e) Uses type safety where language permits. Code review gates enforce these standards; exceptions require architecture approval with documented rationale.

### II. Test-Driven Development (Mandatory)
TDD workflow is non-negotiable: (a) Tests written first and approved by stakeholder; (b) Tests fail initially (Red); (c) Minimal implementation to pass (Green); (d) Refactoring while maintaining test pass (Refactor). Acceptance criteria: 100% of new feature code covered by tests; All tests must be repeatable and deterministic. Integration tests MUST cover contract changes and inter-component communication.

### III. User Experience Consistency
All user-facing features MUST deliver consistent experience: (a) UI/UX design follows established patterns and component library; (b) Accessibility (WCAG 2.1 AA minimum) is required for all interfaces; (c) User feedback mechanisms (error messages, success states, loading indicators) must be consistent across all surfaces; (d) Documentation and help text must match user language, not technical jargon. Design review required before implementation; compliance verified in QA testing.

### IV. Performance by Default
Performance is a feature, not an afterthought: (a) All features establish baseline performance targets before implementation (e.g., response time, throughput, memory usage); (b) Load testing required for user-facing APIs (minimum 10x expected peak load); (c) Monitoring and alerting configured for degradation; (d) Performance regressions ≥10% trigger rollback or hotfix. Code-level optimization (algorithmic complexity, caching strategies) is reviewed alongside functionality.

### V. Observability and Debuggability
Structured logging and monitoring are mandatory: (a) All errors MUST be logged with context (user ID, operation, timestamp, stack trace); (b) Structured logging format (JSON) enables machine-readable analysis; (c) Key business metrics tracked and alerted (transaction success rate, latency, error rates); (d) Debugging support required—production logs must be queryable by request ID; (e) Performance metrics sampled at ≥1% of traffic to detect anomalies. No logging removed without ops review.

## Code Review and Quality Gates
All changes require automated validation + human review:

- **Automated Gates**: Lint pass, test pass (≥80% coverage), security scan, performance bench comparison
- **Human Review**: Minimum 2 approvals for production code; architecture review for >10% complexity increase
- **Rejection Criteria**: Missing tests, incomplete documentation, performance regression, accessibility violations, linting failures
- **Fast Track**: Docs-only, dependency updates (if security-clean) may have single approval with senior reviewer
- **Escalation**: Disputes resolved by tech lead with architecture team input

## Development Workflow and Testing Strategy

**Phase 1 - Specification**: User scenarios written, acceptance criteria defined, performance targets set
**Phase 2 - Test Design**: Test cases written and approved before any implementation
**Phase 3 - Implementation**: Code written to pass tests; TDD red-green-refactor cycle enforced
**Phase 4 - Integration**: Feature integrated with existing codebase; contract tests pass
**Phase 5 - QA & Performance**: Full regression test suite run; performance benchmarks vs. baseline; UX consistency verified
**Phase 6 - Deployment**: Automated deployment with monitoring; rollback plan documented and tested

**Testing Responsibilities**:
- Unit tests: Developer (coverage ≥80% of new code)
- Integration tests: Developer + QA (critical paths only)
- Performance tests: Performance engineer or lead developer
- Acceptance tests: QA in collaboration with product owner

## Governance

This Constitution is the supreme law governing all development activities. Deviations require written exception approval from the tech lead with rationale documented.

**Amendment Process**: Amendments require (1) written proposal with rationale, (2) tech lead + 2 senior developer approval, (3) version bump + changelog entry, (4) team communication + training if needed.

**Compliance Verification**: Every PR review MUST explicitly verify: ✓ Code Quality standards met, ✓ Tests pass + coverage maintained, ✓ UX consistent, ✓ Performance benchmarks acceptable. Use `.specify/templates/` for detailed implementation guides.

**Exceptions**: Documented only via PR comments with approval signatures and expiration date (max 30 days). Patterns in exceptions trigger constitution review.

**Version**: 1.0.0 | **Ratified**: 2025-11-29 | **Last Amended**: 2025-11-29
