##### CUJU Exercise Analysis Tests #####

This repository contains automated test for the CUJU Exercise Analysis Flow, implemented using Playwright and TypeScript.

# Prerequisites

- Node.js (v14 or higher)
- npm


# Installation

1.  Clone the repository.
2.  Install dependencies:
    npm install

3.  Install Playwright browsers:
    npx playwright install


## Running the Mock Server

The tests rely on a local Mockoon server.

1.  Start the mock server (in a separate terminal or background):
    npx mockoon-cli start --data ./tests/mocks/exercise-service.json --port 3000
    

## Running Tests

**Note**: Due to the stateful nature of the mock server (sequential responses), tests must be run with a single worker to avoid race conditions.

Run all tests:
npx playwright test --workers=1

Run a specific test file:
npx playwright test tests/exercise-analysis.spec.ts --workers=1

Run in UI mode (for debugging):
npx playwright test --ui --workers=1


## CI/CD & Reports

Tests are automatically run on every push to `main` via GitHub Actions.
The latest test report is deployed to GitHub Pages and can be viewed here:
[https://alekkalashnik.github.io/CUJU/](https://alekkalashnik.github.io/CUJU/)


## Project Structure

- `.github/workflows/`: CI/CD configuration.
- `tests/`: Contains the test specifications.
    - `mocks/`: Contains Mockoon configuration (`exercise-service.json`).
- `lib/`: Contains helper classes and types.
    - `services/`: Service objects for API interactions.
    - `types.ts`: TypeScript interfaces for API contracts.
- `playwright.config.ts`: Playwright configuration.
- `test-strategy.md`: Design document covering negative scenarios and test strategy.


## Troubleshooting

If tests fail with `ECONNREFUSED`, ensure the mock server is running on port 3000.
If tests fail with unexpected status codes, ensure no other tests are running concurrently against the same mock instance.
