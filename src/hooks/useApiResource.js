import { useCallback, useEffect, useRef, useState } from "react";

export const useApiResource = (loader, fallbackData = []) => {
  const [data, setData] = useState(Array.isArray(fallbackData) ? [] : null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const fallbackRef = useRef(fallbackData);

  const loadWithColdStartRetry = async () => {
    try {
      return await loader();
    } catch (error) {
      const message = error.message?.toLowerCase() ?? "";
      const looksLikeColdStart = message.includes("failed to fetch") || message.includes("networkerror") || message.includes("load failed");

      if (!looksLikeColdStart) throw error;

      await new Promise((resolve) => window.setTimeout(resolve, 800));
      return loader();
    }
  };

  useEffect(() => {
    fallbackRef.current = fallbackData;
  }, [fallbackData]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await loadWithColdStartRetry();
      setData(result ?? fallbackRef.current);
      setIsFallback(false);
    } catch (requestError) {
      setData(fallbackRef.current);
      setIsFallback(true);
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, error, isLoading, isFallback, refresh, setData };
};
