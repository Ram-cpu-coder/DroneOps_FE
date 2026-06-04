import { useCallback, useEffect, useRef, useState } from "react";

export const useApiResource = (loader, fallbackData = []) => {
  const [data, setData] = useState(Array.isArray(fallbackData) ? [] : null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const fallbackRef = useRef(fallbackData);

  useEffect(() => {
    fallbackRef.current = fallbackData;
  }, [fallbackData]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await loader();
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
