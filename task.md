# Resort Map — Code Test

*You are creating the world's first interactive cabana booking website for luxury resorts. Our goal is to offer guests a seamless digital experience: browse an interactive map of the resort, see poolside cabanas availability in real time, and book their ideal lounging spot just steps from the pool—all with just a couple of clicks. This project integrates a visually-rich resort map with live cabana availability and booking, redefining poolside convenience for our guests. Map format and asset usage are described below.*

---

## Task

Build a webapp that displays the resort map and allows guests to book cabanas. The frontend should rely entirely on a RESTful API for all data.

- **Backend:** Provides a RESTful API that serves all information needed to display the interactive, bookable resort map and to handle cabana bookings.
- **Frontend:** Provides an interactive resort map and enables cabana booking.

  - **Resort Map View:**
    - Displays a visual map of the resort using tiles from `assets`.
    - Map layout and cabana availability are rendered based on the API response.
    - Legend:
      - `W` = cabana
      - `p` = pool
      - `#` = path
      - `c` = chalet
      - `.` = empty space

  - **Cabana Interaction:**
    - When a guest clicks on a cabana (`W`):
      - If the cabana is **available**, show a booking interface (1-step flow: prompt for room number and guest name). Show confirmation of booking and redirect back to map view.
      - If the cabana is **unavailable**, display information that it's not available.

  - **Booking Feedback:**
    - Once a cabana is booked, update the map immediately to show that it is no longer available (e.g., use a distinct visual style for booked cabanas).

  - **Validation:** Booking is only allowed if room number and name match a current guest (validated via API using the bookings file).

The backend reads map layout and booking/guest data from files specified via CLI options: `--map <path-to-map>` (for the ASCII resort map; defaults to `map.ascii` in the working directory) and `--bookings <path-to-bookings>` (for bookings and guest information; defaults to `bookings.json` in the working directory).
Be sure to use the provided example map (`map.ascii`) and bookings (`bookings.json`) files as the required format for your input files.

There is no need for persistent storage for cabana bookings—in-memory or session state on the backend is fine.

No auth—assume that knowing room number and guest name is sufficient auth.

The booking flow should end with a clear confirmation and the map visibly updated (booked cabana distinct). Errors (e.g. invalid room/name) should show a short, human-readable message.

---

## Deliverables

- **Source code** in a git repository (please provide a link and make sure we have permissions to view/download code).
- **README:** Please ensure your README is well-structured, concise, and clearly documents how to run and use your app.
Readme should containt a short paragraph explaining your core design decisions and any trade-offs (e.g. why you structured the API/UI as you did, what you kept simple or skipped).
- **Single entrypoint:** Provide a **single command** (e.g. `./run.sh`, `npm run start`, or `dotnet run`) that launches both backend and frontend together, so reviewers need only run one command from the project root. This starting command **must accept** the `--map <path>` and `--bookings <path>` arguments so reviewers can specify alternative map or bookings files at startup.
- **AI-assisted workflow documentation:** Please include your AI workflow in `AI.md`. Which tools you used, what kind of prompts and how many steps it took. This will not be judged, but a topic we would like to discuss during the interview.
- **Screenshot:** Please include a screenshot (in your repository, e.g., `screenshot.png`) showing your running solution (map view).
- **Automated Tests:** Include automated tests covering core backend and frontend functionality. Tests should validate booking logic, REST API behavior, map updates, and UI responses to typical user actions. Document how to run all tests in the README.
- **LLM use:** If you use an LLM or coding agent (which we encourage), include the key prompts or agent setup you used. We may ask detailed questions about both the solution and how you used the tooling.

---

## General notes

- **Languages:** Use **.NET and/or JavaScript/TypeScript** only. Other languages are not in scope.
- Keep it simple; avoid over-engineering. Within that stack, any reasonable libraries or frameworks are fine as long as they are documented.
- No real auth or persistent storage required—in-memory/session state for cabana bookings is enough.
- When in doubt, assume we had a simple solution in mind; feel free to ask questions.
