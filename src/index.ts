import { useState, useEffect } from "react";
import { UseStore, get, set, del } from "idb-keyval";

// key is expected to remain constant across renders
export default function useIDBState<T>(
  key: string,
  initialValue: T | (() => T),
  customStore?: UseStore
) {
  const [state, setState] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (typeof window === "undefined") {
      return;
    }

    get<T>(key, customStore).then((value) => {
      if (!mounted) {
        return;
      }

      if (value !== undefined) {
        setState(value);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (state === undefined) {
      del(key, customStore);
      return;
    }

    set(key, state, customStore);
  }, [state, loading]);

  return [state, setState, loading] as const;
}
