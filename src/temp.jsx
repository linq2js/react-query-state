import React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { useGlobalState } from "react-query-global-state";

const DEFAULT_COUNT = 1;
const queryClient = new QueryClient();

function CounterApp() {
  const [count, setCount] = useGlobalState("count", DEFAULT_COUNT);

  return (
    <div>
      <h1>{count}</h1>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

export default function () {
  return (
    <QueryClientProvider client={queryClient}>
      <CounterApp />
    </QueryClientProvider>
  );
}
