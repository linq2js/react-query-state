import { useCallback, useState } from "react";
import { QueryClient, useQuery, useQueryClient } from "react-query";

const STATE_KEY = `@${Date.now().toString(36)}`;

type State<T> = T extends Promise<infer TResolve>
  ? TResolve
  : T extends () => infer TResult
  ? State<TResult>
  : T;
type PrevState<T> = T extends Promise<infer TResolve>
  ? TResolve | undefined
  : T extends () => infer TResult
  ? PrevState<TResult>
  : T;
type MutableState<T> = State<T> | SetState<T>;
type SetState<T> = (prev: PrevState<T>) => State<T> | Promise<State<T>>;

function createStateKey(key: any | any[]) {
  return Array.isArray(key) ? key.concat(STATE_KEY) : [key, STATE_KEY];
}

function setGlobalStateInternal<T>(
  queryClient: QueryClient,
  key: any | any[],
  value: MutableState<T>,
  queryData?: any,
  stateKey?: any,
  onSyncValueChanged?: () => void
) {
  if (!queryData) {
    if (!stateKey) stateKey = createStateKey(key);
    queryData = queryClient.getQueryData(stateKey);
  }
  let prevValue = queryData.value;
  if (typeof value === "function") {
    queryData.value = (value as Function)(
      typeof queryData.value?.then === "function"
        ? queryClient.getQueryData(key)
        : queryData.value
    );
  } else {
    queryData.value = value;
  }
  if (prevValue === queryData.value) return;
  queryClient.prefetchQuery(key);
  // is async value
  if (typeof queryData.value?.then === "function") return;
  onSyncValueChanged?.();
}

export function setGlobalState(
  queryClient: QueryClient,
  value: Record<string, any>
): void;
export function setGlobalState<T>(
  queryClient: QueryClient,
  key: any | any[],
  value: MutableState<T>
): void;
export function setGlobalState(queryClient: QueryClient, ...args: any[]) {
  if (args.length < 2) {
    return Object.entries(args[0]).forEach(([key, value]) => {
      setGlobalStateInternal(queryClient, key, value);
    });
  }
  setGlobalStateInternal(queryClient, args[0], args[1]);
}

export function useGlobalState<T = unknown>(
  key: any | any[],
  defaultValue?: T
): [
  State<T>,
  (value: MutableState<T>) => void,
  { loading: boolean; error: any }
] {
  const queryClient = useQueryClient();
  const tempKey = createStateKey(key);
  const rerender = useState<any>()[1];
  let queryData: any = queryClient.getQueryData(tempKey);
  if (!queryData) {
    try {
      queryData = {
        loading: false,
        value:
          typeof defaultValue === "function"
            ? (defaultValue as any)()
            : defaultValue,
      };
    } catch (error) {
      queryData = { error };
    }
    queryClient.setQueryData(tempKey, queryData);
  }
  const isPromise = typeof queryData.value?.then === "function";
  const query = useQuery(
    key,
    () => {
      if (queryData.error) {
        throw queryData.error;
      }
      return queryData.value;
    },
    {
      staleTime: Infinity,
      cacheTime: Infinity,
    }
  );
  const setState = useCallback(
    (value: MutableState<T>) => {
      setGlobalStateInternal(queryClient, key, value, queryData, tempKey, () =>
        rerender({})
      );
    },
    [query, rerender]
  );

  queryData.loading = isPromise ? query.isLoading : false;
  return [isPromise ? query.data : queryData.value, setState, queryData];
}
