import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

export interface LoadingState {
  navigation: boolean;
  search: boolean;
  posts: boolean;
  hero: boolean;
  postDetail: boolean;
  global: boolean;
}

interface LoadingContextType {
  loadingStates: LoadingState;
  setLoading: (key: keyof LoadingState, value: boolean) => void;
  setMultipleLoading: (states: Partial<LoadingState>) => void;
  clearAllLoading: () => void;
  isAnyLoading: boolean;
}

const initialLoadingState: LoadingState = {
  navigation: false,
  search: false,
  posts: false,
  hero: false,
  postDetail: false,
  global: false,
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: React.ReactNode;
  initialState?: Partial<LoadingState>;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({
  children,
  initialState = {},
}) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({
    ...initialLoadingState,
    ...initialState,
  });

  const setLoading = useCallback((key: keyof LoadingState, value: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const setMultipleLoading = useCallback((states: Partial<LoadingState>) => {
    setLoadingStates(prev => ({
      ...prev,
      ...states,
    }));
  }, []);

  const clearAllLoading = useCallback(() => {
    setLoadingStates(initialLoadingState);
  }, []);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  // Global loading indicator management
  useEffect(() => {
    if (loadingStates.global || isAnyLoading) {
      document.body.style.cursor = "wait";
      // Add loading class for global styling
      document.documentElement.classList.add("loading");
    } else {
      document.body.style.cursor = "";
      document.documentElement.classList.remove("loading");
    }

    return () => {
      document.body.style.cursor = "";
      document.documentElement.classList.remove("loading");
    };
  }, [loadingStates.global, isAnyLoading]);

  // Keyboard shortcut to clear all loading states (for development)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && event.shiftKey && event.ctrlKey) {
        clearAllLoading();
        console.log("All loading states cleared");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clearAllLoading]);

  const value: LoadingContextType = {
    loadingStates,
    setLoading,
    setMultipleLoading,
    clearAllLoading,
    isAnyLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}

      {/* Global loading overlay when global loading is true */}
      {loadingStates.global && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground animate-pulse">
              Loading...
            </p>
          </div>
        </div>
      )}

      {/* Subtle loading indicator bar */}
      {isAnyLoading && !loadingStates.global && (
        <div className="fixed top-0 left-0 right-0 z-40 h-0.5 bg-gradient-to-r from-primary via-accent to-primary animate-pulse" />
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};

// Utility hook for managing a specific loading state
export const useSpecificLoading = (key: keyof LoadingState) => {
  const { loadingStates, setLoading } = useLoading();

  const isLoading = loadingStates[key];

  const startLoading = useCallback(
    () => setLoading(key, true),
    [key, setLoading]
  );
  const stopLoading = useCallback(
    () => setLoading(key, false),
    [key, setLoading]
  );
  const toggleLoading = useCallback(
    () => setLoading(key, !isLoading),
    [key, setLoading, isLoading]
  );

  return {
    isLoading,
    startLoading,
    stopLoading,
    toggleLoading,
  };
};

// Utility hook for async operations with loading states
export const useAsyncLoading = <T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  loadingKey: keyof LoadingState
) => {
  const { setLoading } = useLoading();
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<R | null>(null);

  const execute = useCallback(
    async (...args: T): Promise<R | null> => {
      try {
        setLoading(loadingKey, true);
        setError(null);
        const result = await asyncFn(...args);
        setData(result);
        return result;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("An error occurred");
        setError(error);
        console.error(`Error in ${loadingKey} operation:`, error);
        return null;
      } finally {
        setLoading(loadingKey, false);
      }
    },
    [asyncFn, loadingKey, setLoading]
  );

  return {
    execute,
    error,
    data,
    clearError: () => setError(null),
    clearData: () => setData(null),
  };
};

// Utility hook for debounced loading
export const useDebouncedLoading = (
  key: keyof LoadingState,
  delay: number = 300
) => {
  const { setLoading } = useLoading();
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const startDebouncedLoading = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const id = setTimeout(() => {
      setLoading(key, true);
    }, delay);

    setTimeoutId(id);
  }, [key, delay, setLoading, timeoutId]);

  const stopDebouncedLoading = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setLoading(key, false);
  }, [key, setLoading, timeoutId]);

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return {
    startDebouncedLoading,
    stopDebouncedLoading,
  };
};
