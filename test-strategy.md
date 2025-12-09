# Test Strategy & Design Document

## 1. Assumptions & Key Decisions

To ensure the tests are reliable given the current mock environment, I made the following decisions:

*   **Sequential Execution**: The mock server is stateful and loops through responses sequentially. To prevent race conditions (e.g., one test seeing the "scored" state meant for another), tests are configured to run with `workers: 1`.
*   **State Capture**: In the polling logic, I capture the event object immediately when the status is `scored`. This is because the mock loops back to `new` after `scored`, so re-fetching the event for validation would fail.
*   **IPv4 Binding**: I explicitly set the `baseURL` to `http://127.0.0.1:3000` instead of `localhost` to avoid `ECONNREFUSED` errors caused by Node.js preferring IPv6 (`::1`) while the mock listens on IPv4.
*   **Upload URL**: I assume the `uploadUrl` returned by the API is either relative to the base URL or a full absolute URL. Playwright handles both, but for the mock, it's treated as relative.

## 2. Negative Test Cases & Edge Cases

Here are the key scenarios I'd cover to ensure the system doesn't break under invalid conditions:

### Input Validation
*   **Invalid File Types**: Uploading a non-video file (e.g., `.txt`, `.exe`) should be rejected or fail processing.
*   **File Size Limits**: Uploading a file exceeding the maximum allowed size (e.g., >500MB) should return `413 Payload Too Large`.
*   **Empty/Corrupt Files**: Uploading a 0-byte file or a corrupted video header.
*   **Invalid User IDs**: Attempting to create an event for a non-existent or malformed `userId`.

### API Error Handling
*   **Unauthorized Access**: Accessing endpoints without a valid token (if auth were implemented).
*   **Resource Not Found**: Requesting status for a non-existent `exerciseEventId` (should return `404`).
*   **Method Not Allowed**: Using `POST` on the status endpoint or `GET` on the creation endpoint.

### Process Failures
*   **Analysis Failure**: Simulating a scenario where the analysis fails (status transitions to `failed`).
*   **Timeout**: Polling for a result that never transitions from `processing` (handling stuck jobs).
*   **Concurrent Uploads**: Attempting to upload to the same `uploadUrl` multiple times.

## 3. Handling Long-Running Workflows

Since the real analysis takes minutes, we can't just sit there blocking the thread.

*   **Smart Polling**: Use exponential backoff (check in 1s, then 2s, 4s...) so we don't hammer the API.
*   **Webhooks (Preferred)**: If the backend supports it, let's use a webhook listener instead of polling. It's faster and cleaner.
*   **Async Check**: Trigger the analysis in the test setup. Allow the test runner to proceed with other tests. Check the status at a later stage or use a separate "monitor" job.
*   **Timeout Management**: Set a strict limit (e.g., 5 mins) and fail the test if it's still not done.
*   **State Persistence**: Ensure the test can resume checking even if the network flickers (idempotency).

## 4. Framework & Data Management

To ensure the test suite remains maintainable and scalable as the team and codebase grow, I propose the following approach:

### Structuring for Maintainability & Scalability
*   **Service Object Pattern**:
    *   **Why**: Decouples test logic from API implementation details. If an endpoint changes from `/v1` to `/v2`, we update one service file, not 50 tests.
    *   **How**: All API interactions live in `lib/services/` (e.g., `ExerciseService.ts`). Tests simply call `service.createEvent()`.
*   **Strict Typing**:
    *   **Why**: Catches contract violations at compile time.
    *   **How**: Define TypeScript interfaces for all request/response bodies in `lib/types.ts`. No `any` types allowed in core logic.
*   **Shared Fixtures**:
    *   **Why**: Reduces boilerplate in `test.beforeEach`.
    *   **How**: Extend Playwright's `test` object to automatically provide initialized services (e.g., `test({ exerciseService } => ...)`).

### Configuration Management
*   **Environment-Based Config**:
    *   Use `.env` files (e.g., `.env.local`, `.env.staging`) to manage sensitive data and environment-specific URLs.
    *   **Example**: `BASE_URL` might be `localhost:3000` locally but `https://api.staging.cuju.com` in CI.
*   **Runtime Overrides**:
    *   Allow overriding key settings via CLI variables (e.g., `RETRIES=2 npx playwright test`) to adapt to flaky network conditions without code changes.

### Test Data Lifecycle
*   **Dynamic Data Generation**:
    *   **Rule**: Never use hardcoded IDs or filenames.
    *   **Implementation**: Use libraries like `faker` or `uuid` to generate unique `userId`s, emails, and filenames for *every single test run*. This prevents "test pollution" where one test fails because another test modified the same user.
*   **Cleanup Strategy**:
    *   **Soft Cleanup**: Use `afterAll` hooks to delete resources created during the test.
    *   **Hard Cleanup**: Run a nightly cron job to wipe "stale" test data (older than 24h) from the staging environment, ensuring we don't accumulate junk over time.
*   **Mocking vs. Real Data**:
    *   **Mocks (Mockoon)**: Use for edge cases that are hard to trigger (e.g., 500 errors, specific timeout scenarios).
    *   **Real Data**: Use for happy path and critical integration flows to ensure the actual system works as expected.

### Parallel Execution & Conflict Handling
*   **Isolation is Key**:
    *   Since every test generates its own unique data (User A, Video B), tests can run in parallel without stepping on each other's toes.
*   **Resource Locking**:
    *   For shared resources that *cannot* be isolated (like this specific stateful Mockoon instance), we enforce serial execution (`workers: 1`).
    *   In a real environment, we would use a distributed lock (e.g., Redis) or simply rely on the unique data strategy to avoid conflicts.
*   **CI Sharding**:
    *   As the suite grows to hundreds of tests, we split execution across multiple CI machines (`npx playwright test --shard=1/4`) to keep feedback loops fast (under 10 mins).
