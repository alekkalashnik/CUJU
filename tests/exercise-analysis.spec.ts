import { test, expect } from '@playwright/test';
import { ExerciseService } from '../lib/services/ExerciseService';
import * as path from 'path';

test.describe('Exercise Analysis Flow', () => {
  let exerciseService: ExerciseService;
  const userId = 'test-user-123';
  const exerciseId = '34';
  const videoFilePath = path.join(__dirname, 'fixtures', 'dummy-video.mov');

  test.beforeEach(async ({ request }) => {
    exerciseService = new ExerciseService(request);
  });

  test('should successfully process an uploaded exercise video', async () => {
    // 1. Create Exercise Event
    const createResponse = await exerciseService.createExerciseEvent(userId, {
      exerciseId,
      fileExtension: 'mov',
      fileSize: 1024, // Arbitrary size for mock
    });

    expect(createResponse.exerciseEventId).toBeDefined();
    expect(createResponse.uploadUrl).toBeDefined();

    const { exerciseEventId, uploadUrl } = createResponse;
    console.log(`Created event: ${exerciseEventId}`);

    // 2. Upload Video
    await exerciseService.uploadVideo(uploadUrl, videoFilePath);
    console.log('Video uploaded successfully');

    // 3. Poll for Status "scored"
    // Using expect.poll to retry until the condition is met
    let finalEvent: any;
    await expect.poll(async () => {
      const event = await exerciseService.getExerciseEvent(exerciseEventId);
      console.log(`Current status: ${event.status}`);
      finalEvent = event;
      return event.status;
    }, {
      // Custom polling configuration
      message: 'Exercise event status should become "scored"',
      timeout: 10_000, // 10 seconds max wait
      intervals: [1000, 2000, 3000], // Retry intervals
    }).toBe('scored');

    // 4. Validate Final Result
    // We use the captured event because the mock loops responses and fetching again might return 'new'
    expect(finalEvent.score).toBeDefined();
    expect(finalEvent.analysisResults).toBeDefined();
    expect(finalEvent.analysisResults?.length).toBeGreaterThan(0);
  });
});
