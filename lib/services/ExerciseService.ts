import { APIRequestContext, APIResponse } from '@playwright/test';
import { CreateExerciseEventRequest, CreateExerciseEventResponse, ExerciseEventResponse } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class ExerciseService {
  constructor(private request: APIRequestContext) {}

  /**
   * Creates a new exercise event for a user.
   */
  async createExerciseEvent(userId: string, data: CreateExerciseEventRequest): Promise<CreateExerciseEventResponse> {
    const response = await this.request.post(`/exercise/v1/user/${userId}/exercise-event`, {
      data,
    });
    await this.validateResponse(response, 201);
    return response.json();
  }

  /**
   * Uploads a video file to the provided upload URL.
   */
  async uploadVideo(uploadUrl: string, filePath: string): Promise<void> {
    const fileBuffer = fs.readFileSync(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const contentType = extension === '.mov' ? 'video/quicktime' : 'application/octet-stream';

    const response = await this.request.put(uploadUrl, {
      data: fileBuffer,
      headers: {
        'Content-Type': contentType,
      },
    });
    await this.validateResponse(response, 200);
  }

  /**
   * Fetches the current status of an exercise event.
   */
  async getExerciseEvent(exerciseEventId: string): Promise<ExerciseEventResponse> {
    const response = await this.request.get(`/exercise/v1/exercise-event/${exerciseEventId}`);
    await this.validateResponse(response, 20);
    return response.json();
  }

  /**
   * Helper to validate response status codes.
   */
  private async validateResponse(response: APIResponse, expectedStatus: number) {
    if (response.status() !== expectedStatus) {
      throw new Error(`API Request failed. Status: ${response.status()} ${response.statusText()}. Body: ${await response.text()}. Expected status: ${expectedStatus}.`);
    }
  }
}
