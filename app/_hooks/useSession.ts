"use client";

import { useCallback } from "react";
import type {
  CreateSessionRequestSchema,
  CreateSessionResponse,
} from "@/app/_dtos";
import { apiClient } from "@/app/_lib/http/apiClient";

const useSession = () => {
  const create = useCallback(async (data: CreateSessionRequestSchema) => {
    const response = await apiClient.post<CreateSessionResponse>(
      "/sessions",
      data,
    );
    if (response.status === "OK") {
      return response.result;
    }
    throw new Error(response.errorMessage);
  }, []);

  return { create };
};

export default useSession;
