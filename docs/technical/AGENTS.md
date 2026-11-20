# SnapStow technical documentation instructions

Apply these instructions to architecture, technology choices, diagrams, and decisions that affect system boundaries, capture, OCR, file search, storage, or recovery.

## Sources of truth

- Read the [PRD](../../PRD.md) for product requirements and acceptance criteria, the [UI/UX design](../design/design.md) for interactions and states, and [architecture.md](architecture.md) for the current technical proposal and verification plan.
- Use the [portable distribution decision](decisions/001-portable-distribution.md) for release and data layout, and the [Windows test plan](windows-testing.md) for isolation and release verification.
- Flag conflicts with product requirements or user-facing behavior before implementing the affected change. Follow the [design instructions](../design/AGENTS.md) when the work also changes the design.

## Making and recording decisions

- For consequential choices, compare viable options against the project's Windows constraints, local data handling, performance targets, and failure cases. Cite primary sources and state which assumptions still need a prototype or measurement.
- Keep recommendations and open questions in the architecture until a choice is settled. Record a settled choice that affects future work in a separate decision record under `decisions/`. Link it from the architecture and capture the context, alternatives, rationale, consequences, and evidence.
- Reflect verified Windows behavior and actual commands when implementation becomes available. Record the environment, sample conditions, observed results, and remaining gaps for checks that affect a decision.

## Keeping the diagrams current

- Keep the editable Mermaid source and its rendered SVG together under `diagrams/`. When a change affects a documented flow, state, or relationship, update both and check the rendered labels and links.
- Use synthetic captures and disposable directories for verification. Keep secrets and actual chat content out of technical examples and diagrams.
