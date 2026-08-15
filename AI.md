# AI-Assisted Workflow

Codex was used as an implementation and learning assistant. The code was reviewed against `task.md`, kept intentionally small, and checked with the local test suite after changes.

## Final technical stack

- Node.js 18+
- Express 5 for the backend
- CommonJS modules
- Vanilla JavaScript for the frontend
- Bootstrap 5.3.8 for the modal and responsive utilities
- REST API with JSON
- File-based startup inputs: `map.ascii` and `bookings.json`
- In-memory `Set` for the current booking state

## Tools used

- Codex for requirements analysis, architecture discussion, implementation, refactoring, documentation, and code review.
- PowerShell for running Node.js, npm, file checks, and local verification.
- Chrome DevTools for manual layout, Network, LCP, and CLS inspection.
- Node.js `assert` and a custom test runner for automated checks.

## Main prompts and work stages

1. Read `task.md` and inspect the map, booking data, assets, and existing `serv` folder.
2. Build a simple REST API and frontend with one startup command that accepts `--map` and `--bookings`.
3. Explain the project using Flask analogies and add clear English comments.
4. Implement the interactive map, cabana booking, guest validation, road-neighbour detection, and immediate map updates.
5. Refine the responsive UI, Bootstrap modal, logo, favicon, tile sprite layers, road assets, and mobile layout according to visual feedback.
6. Migrate the HTTP layer from built-in Node.js routing to Express while keeping the domain logic simple.
7. Separate the Express app, startup entry point, service/domain logic, and browser-side JavaScript.
8. Add architecture, security, production OAuth/GDPR notes, and Network/LCP/CLS documentation.
9. Compare the tests with the manually adjusted HTML/CSS and update test expectations without changing the requested visual result.

## Representative prompts

- "Implement everything required by the task in `serv` simply, with comments that are easy to understand for a Python/Flask developer."
- "Explain how the frontend communicates with the backend, how map and booking files load, and how the project maps to Flask."
- "Migrate the HTTP layer to Express while keeping the architecture small and readable."
- "Use the four neighbouring cells to select and rotate the correct road asset."
- "Use the parchment sprite sheet as a lower layer and transparent chalet, cabana, and road PNGs above it."
- "Prepare `serv` for GitHub and document how to install, run, test, and understand the project."
- "Take the current manually edited CSS/HTML as the source of truth and make the tests pass without reverting those changes."

## Verification

The automated suite is run from the `serv` directory:

```powershell
npm.cmd test
```

The current result is:

```text
All tests passed: 9
```

The tests cover CLI options, map parsing, road asset selection, API health, map responses, invalid guests, successful booking, map updates, duplicate booking, and important frontend source contracts.

The frontend contract test is not a full browser E2E test. Manual Chrome DevTools checks are still needed for visual layout, mobile interaction, Network, LCP, and CLS.

## Important limitations

The current demo does not implement real authentication, Google OAuth, GDPR consent storage, HTTPS, payments, a persistent database, or production security controls. Those items are documented as a production roadmap, while the submitted demo remains intentionally simple and runnable with Vanilla JavaScript and Express.
