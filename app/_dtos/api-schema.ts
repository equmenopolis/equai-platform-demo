export type ApiResponseOk<T = unknown> = {
  status: "OK";
  result: T;
};

export type ApiResponseError = {
  status: "ERROR";
  errorMessage: string;
};

export type ApiResponse<T = unknown> = ApiResponseOk<T> | ApiResponseError;

export interface EquApiResponse<T = unknown> {
  status: string;
  result?: T;
  errorMessage?: string;
}
