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


## Project Structure

- `tests/`: Contains the test specifications.
- `lib/`: Contains helper classes and types.
    - `services/`: Service objects for API interactions.
    - `types.ts`: TypeScript interfaces for API contracts.
- `test-strategy.md`: Design document covering negative scenarios and test strategy.
- `exercise-service.json`: Mockoon configuration.


## Troubleshooting

If tests fail with `ECONNREFUSED`, ensure the mock server is running on port 3000.
If tests fail with unexpected status codes, ensure no other tests are running concurrently against the same mock instance.
