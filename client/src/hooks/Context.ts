/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react';
import constate from 'constate';

interface LocalReducerProps {
  initialValues: Record<string, any>;
}

function useLocalReducer({ initialValues }: LocalReducerProps) {
  const [localState, setLocalState] = useState(initialValues);

  const localDispatch = useCallback((newValues: Record<string, any>) => {
    setLocalState((prevState) => {
      return { ...prevState, ...newValues };
    });
  }, []);

  return { localState, localDispatch };
}

const [LocalStateProvider, useLocalState, useLocalDispatch] = constate(
  useLocalReducer,
  (value) => value.localState,
  (value) => value.localDispatch
);

export { LocalStateProvider, useLocalState, useLocalDispatch };
