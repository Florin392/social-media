export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface ApiErrorResponse {
  status: "error";
  statusCode: number;
  message: string;
  errors?: Record<string, string>;
}

export interface ApiSuccessResponse<T> {
  status: "succes";
  statusCode: number;
  message: string;
  data: T;
}
