import { useState, useEffect, useRef } from "react";
import { UseStore, get, set, del } from "idb-keyval";

const STORAGE_KEY = "use-idb-state-ts";

export default function useIDBState<T>(
  key: IDBValidKey,
  initialValue: T | (() => T),
  customStore?: UseStore
) {
  const [state, setState] = useState<T>(initialValue);
  const storedState = useRef<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [currentKey, setCurrentKey] = useState(key);
  const [ts, setTs] = useState(Date.now());

  const emitStorageEvent = (value: T | undefined) => {
    storedState.current = value;
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString(36));
    } catch (e) {}
  };

  useEffect(() => {
    let mounted = true;

    if (typeof window === "undefined") {
      return;
    }

    setLoading(true);
    get<T>(key, customStore)
      .then((value) => {
        if (!mounted) {
          return;
        }

        if (value !== undefined) {
          storedState.current = value;
          setState(value);
          return;
        }

        if (state !== undefined) {
          return set(key, state, customStore).then(() => {
            emitStorageEvent(state);
          });
        }

        storedState.current = undefined;
      })
      .finally(() => {
        if (!mounted) {
          return;
        }

        setCurrentKey(key);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [key, ts]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (state === storedState.current) {
      return;
    }

    (() => {
      if (state === undefined) {
        return del(currentKey, customStore);
      }

      return set(currentKey, state, customStore);
    })().then(() => {
      emitStorageEvent(state);
    });
  }, [currentKey, state, loading]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setTs(Date.now());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return [state, setState, loading] as const;
}
