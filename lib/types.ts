export interface CreateExerciseEventRequest {
  exerciseId: string;
  fileExtension: string;
  fileSize: number;
}

export interface CreateExerciseEventResponse {
  exerciseEventId: string;
  uploadUrl: string;
}

export interface ExerciseEventResponse {
  exerciseEventId: string;
  exerciseId: string;
  status: 'new' | 'processing' | 'scored' | 'failed';
  score?: number;
  analysisResults?: any[];
  [key: string]: any;
}
