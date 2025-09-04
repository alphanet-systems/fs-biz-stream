
"use client";

import { useState, useEffect, useCallback } from 'react';

type Fetcher<T> = () => Promise<T>;

export function useDataFetch<T>(fetcher: Fetcher<T>, initialData: T) {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetcher();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      // Optionally, handle the error in the UI
    } finally {
      setIsLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, setData, isLoading, refetch: fetchData };
}
