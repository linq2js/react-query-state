import { useCallback } from "react";
import { Query, QueryClient, useQuery, useQueryClient } from "react-query";

type SetState<T> = (prev: T | undefined) => T | Promise<T>;

function createTempQueryKey(key: any | any[]) {
  return Array.isArray(key) ? key.concat("__temp") : [key, "__temp"];
}

function setGlobalStateInternal<T>(
  queryClient: QueryClient,
  key: any | any[],
  value: Promise<T> | T | SetState<T>,
  queryData?: any,
  tempKey?: any
) {
  if (!queryData) {
    if (!tempKey) tempKey = createTempQueryKey(key);
    queryData = queryClient.getQueryData(tempKey);
  }
  if (typeof value === "function") {
    queryData.value = (value as Function)(
      typeof queryData.value?.then === "function"
        ? queryClient.getQueryData(key)
        : queryData.value
    );
  } else {
    queryData.value = value;
  }
  queryClient.prefetchQuery(key);
}

export function setGlobalState<T>(
  queryClient: QueryClient,
  key: any | any[],
  value: Promise<T> | T | SetState<T>
) {
  setGlobalStateInternal(queryClient, key, value);
}

export function useGlobalState<T = unknown>(
  key: any | any[],
  defaultValue?: Promise<T> | T | (() => T | Promise<T>)
): [
  T,
  (value: Promise<T> | T | SetState<T>) => void,
  { loading: boolean; error: any }
] {
  const queryClient = useQueryClient();
  const tempKey = createTempQueryKey(key);
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
  const query = useQuery(
    key,
    () => {
      if (queryData.error) {
        throw queryData.error;
      }
      return queryData.value;
    },
    { staleTime: Infinity, cacheTime: Infinity }
  );
  const setState = useCallback(
    (value: Promise<T> | T | SetState<T>) => {
      setGlobalStateInternal(queryClient, key, value, queryData, tempKey);
    },
    [query]
  );
  queryData.loading =
    typeof queryData.value?.then === "function" ? query.isLoading : false;
  return [
    typeof queryData.value?.then === "function" ? query.data : queryData.value,
    setState,
    queryData,
  ];
}
