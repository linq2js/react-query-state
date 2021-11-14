import { createElement, FC } from "react";
import { QueryClient, QueryClientProvider } from "react-query";

import { renderHook } from "@testing-library/react-hooks";

import { useGlobalState } from "./index";

test("sync value", async () => {
  const [wrapper] = createWrapper();
  const { result } = renderHook(
    () => {
      return useGlobalState("count", 1);
    },
    { wrapper }
  );
  expect(result.current[0]).toBe(1);
  expect(result.current[2].loading).toBe(false);

  result.current[1](2);
  expect(result.current[0]).toBe(2);
  expect(result.current[2].loading).toBe(false);

  result.current[1]((prev) => prev + 1);
  expect(result.current[0]).toBe(3);
  expect(result.current[2].loading).toBe(false);
});

test("sync func", async () => {
  const [wrapper] = createWrapper();
  const callback = jest.fn();
  const f = () => {
    callback();
    return 1;
  };
  const { result, rerender } = renderHook(
    () => {
      return useGlobalState("count", f);
    },
    { wrapper }
  );
  expect(result.current[0]).toBe(1);
  expect(result.current[2].loading).toBe(false);
  expect(callback).toBeCalledTimes(1);
  rerender();
  expect(result.current[0]).toBe(1);
  expect(result.current[2].loading).toBe(false);
  expect(callback).toBeCalledTimes(1);
});

test("async value", async () => {
  const [wrapper] = createWrapper();
  const { result } = renderHook(
    () => {
      return useGlobalState(
        "count",
        delay(10).then(() => 1)
      );
    },
    { wrapper }
  );
  expect(result.current[0]).toBe(undefined);
  expect(result.current[2].loading).toBe(true);
  await delay(1);
  expect(result.current[0]).toBe(undefined);
  expect(result.current[2].loading).toBe(true);
  await delay(10);
  expect(result.current[0]).toBe(1);
  expect(result.current[2].loading).toBe(false);
});

function createWrapper(): [FC, QueryClient] {
  const queryClient = new QueryClient();

  return [
    ({ children }: any) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
    queryClient,
  ];
}

function delay(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
