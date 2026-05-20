"use client";

import { useState } from "react";

export const useLoading = () => {
  const [isLoading, setIsLoading] = useState(false);

  const withLoading = async (
    targetFunction: () => Promise<void>,
    errorCallback?: (error: unknown) => void,
  ) => {
    setIsLoading(true);
    try {
      await targetFunction();
    } catch (error) {
      errorCallback?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, withLoading };
};
