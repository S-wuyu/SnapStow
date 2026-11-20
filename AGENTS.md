# SnapStow project instructions

## Project context

- Read [PRD.md](PRD.md) for product scope, requirements, and acceptance criteria.
- Read the [UI/UX design](docs/design/design.md) and follow the [design instructions](docs/design/AGENTS.md) for user-facing behavior, Figma, and design documentation, including work requested from the project root. Treat design proposals and open questions according to their stated status. Flag disagreements between the design and PRD before implementing the affected behavior.
- Read the [technical architecture](docs/technical/architecture.md) and follow the [technical instructions](docs/technical/AGENTS.md) when evaluating or changing the stack, system boundaries, storage, or recovery behavior, including work requested from the project root.
- SnapStow v0.1 targets Windows desktop. Use PowerShell for commands in the current Windows workspace and keep project paths relative to this root.
- The workspace is in the documentation stage. The implementation stack, app entry point, test locations, and setup, launch, build, and test commands are pending. Verify them against the implementation and record them here as they become available.

## Working agreements

- When the user releases the selection drag, close the capture overlay and return control to the desktop immediately. Keep background archive feedback inside the management window that the user opens. Follow the PRD's local processing and data retention rules for captures, credentials, and review items.
- Ship a portable Windows package. Keep application state, source captures, settings, caches, and diagnostics under the executable directory. Write archived attachments and project documents to the user-selected work root. Read the [portable distribution decision](docs/technical/decisions/001-portable-distribution.md) before changing data paths or packaging.
- Use disposable folders and synthetic chat content on the existing Windows installation for routine verification. Keep automated checks off the active desktop. Schedule brief, opt-in manual checks for real hotkeys, focus, and drag behavior. Windows Sandbox and separate VMs are optional. Follow the [Windows test plan](docs/technical/windows-testing.md) and keep GitHub Actions and paid automation out of the project.
- Ask for confirmation before making external writes or sending external messages, performing destructive actions or purchases, or rotating or revoking credentials. Preserve existing sessions and keep secrets out of output and project files.

## Maintain this file as the project grows

- When the user establishes a durable project constraint, or the work establishes a verified development convention, update this file in the same task. Replace obsolete rules and record where source and tests live and how to set up, run, build, and test once those details are verified.
- Keep product requirements in the PRD, UI behavior under `docs/design/`, and architecture and technical decisions under `docs/technical/`. Give documentation areas that govern major decisions their own scoped `AGENTS.md` and link those instructions here. When the project adds feature or decision records, link to the relevant index once it becomes useful. Keep implementation status and verification results with the documents that own them.
- Before closing substantial work, check for changed requirements, UI behavior, implementation constraints, verification results, and unresolved blockers. Update the relevant source of truth only when it materially changes. Report checks actually run and any remaining verification gaps.
