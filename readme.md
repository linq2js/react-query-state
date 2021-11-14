# react-query-global-state

Global state hook for react-query

## Installation

NPM

```bash
npm i react-query-global-state --save
```

YARN

```bash
yarn add react-query-global-state
```

## Peer dependencies

- react-query

## Usages

```jsx
import { useGlobalState } from "react-query-global-state";

const DEFAULT_COUNT = 1;

function CounterApp() {
  const [count, setCount] = useGlobalState("count", DEFAULT_COUNT);

  return (
    <div>
      <h1>{count}</h1>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

## API References

### useGlobalState(key, defaultValue)

A hook to access global state

- key: Can be single value or array
- defaultValue: Can be anything or a function that return default value
- return: A tuple of [value, setValueFn, { loading, error }]

```js
const [unknownValue] = useGlobalState('singleKey');
const [numberValue] = useGlobalState('singleKey', 1);
useGlobalState(['key1', 'key2']);
const [stringValue] = useGlobalState('valueFromFactory', () => 'hello');
const [resolvedValueOrUndefined, setValue, { loading, error }] = useGlobalState('asyncVlaue', Promise.resolve(1));

```

### setGlobalState(queryClient, key, value)

A function to update global state outside react component

- key: Can be single value or array
- value: Can be anything or a function the retrieves previous value and return new value

```js
setGlobalState('count', 100);
setGlobalState('count', Promise.resolve(100));
setGlobalState('count', prev => /* prev value might be undefined */ prev + 1);
```
