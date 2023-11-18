import { useState, useEffect } from "react";
import { UseStore, get, set, del } from "idb-keyval";

export default function useIDBState<T>(
  key: IDBValidKey,
  initialValue: T | (() => T),
  customStore?: UseStore
) {
  const [state, setState] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [currentKey, setCurrentKey] = useState(key);

  useEffect(() => {
    let mounted = true;

    if (typeof window === "undefined") {
      return;
    }

    setLoading(true);
    get<T>(key, customStore).then((value) => {
      if (!mounted) {
        return;
      }

      if (value !== undefined) {
        setState(value);
      } else if (state !== undefined) {
        set(key, state, customStore);
      }

      setLoading(false);
      setCurrentKey(key);
    });

    return () => {
      mounted = false;
    };
  }, [key]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (state === undefined) {
      del(currentKey, customStore);
      return;
    }

    set(currentKey, state, customStore);
  }, [currentKey, state, loading]);

  return [state, setState, loading] as const;
}
