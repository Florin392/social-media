export class ApiResponse {
  static success<T>(data: T, message = "Success", statusCode = 200) {
    return {
      status: "success",
      statusCode,
      message,
      data,
    };
  }

  static error(message: string, statusCode = 500, errors: any = null) {
    return {
      status: "error",
      statusCode,
      message,
      errors,
    };
  }
}
