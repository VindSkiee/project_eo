export interface BaseResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
  error?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
}
