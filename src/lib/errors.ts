// Pathfinder-AI — Error handling utilities

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  FORBIDDEN = 'FORBIDDEN',
  DB_ERROR = 'DB_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  STREAM_ERROR = 'STREAM_ERROR',
}

export class ApiError extends Error {
  code: ErrorCode
  status: number

  constructor(message: string, code: ErrorCode, status: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

export function handleApiError(error: unknown): { error: string; code: string; message: string; status: number } {
  if (error instanceof ApiError) {
    return {
      error: error.message,
      code: error.code,
      message: error.message,
      status: error.status,
    }
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      code: ErrorCode.INTERNAL_ERROR,
      message: error.message,
      status: 500,
    }
  }

  return {
    error: 'Unknown error',
    code: ErrorCode.INTERNAL_ERROR,
    message: String(error),
    status: 500,
  }
}
