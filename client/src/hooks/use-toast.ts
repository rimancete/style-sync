import * as React from 'react';

import type { ToastActionElement, ToastProps } from '~/components/ui/toast';

/**
 * Toast state lives in a module-level store rather than a React context so that
 * non-React callers — notably the `notify` helper used by mutation facades —
 * can raise a toast without a hook.
 */

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type State = {
  toasts: ToasterToast[];
};

type Action =
  | { type: 'ADD_TOAST'; toast: ToasterToast }
  | { type: 'UPDATE_TOAST'; toast: Partial<ToasterToast> & Pick<ToasterToast, 'id'> }
  | { type: 'DISMISS_TOAST'; toastId?: string }
  | { type: 'REMOVE_TOAST'; toastId?: string };

let count = 0;
let memoryState: State = { toasts: [] };

const listeners: ((state: State) => void)[] = [];
const removeTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function generateId(): string {
  count += 1;
  return String(count);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_TOAST':
      return { toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };

    case 'UPDATE_TOAST':
      return {
        toasts: state.toasts.map((toast) =>
          toast.id === action.toast.id ? { ...toast, ...action.toast } : toast
        ),
      };

    case 'DISMISS_TOAST':
      return {
        toasts: state.toasts.map((toast) =>
          action.toastId === undefined || toast.id === action.toastId
            ? { ...toast, open: false }
            : toast
        ),
      };

    case 'REMOVE_TOAST':
      return {
        toasts:
          action.toastId === undefined
            ? []
            : state.toasts.filter((toast) => toast.id !== action.toastId),
      };
  }
}

function dispatch(action: Action): void {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

function scheduleRemoval(toastId: string): void {
  if (removeTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    removeTimeouts.delete(toastId);
    dispatch({ type: 'REMOVE_TOAST', toastId });
  }, TOAST_REMOVE_DELAY);

  removeTimeouts.set(toastId, timeout);
}

type ToastInput = Omit<ToasterToast, 'id'>;

export function toast(props: ToastInput) {
  const id = generateId();

  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) {
          dismiss();
        }
      },
    },
  });

  scheduleRemoval(id);

  return {
    id,
    dismiss,
    update: (next: Partial<ToastInput>) =>
      dispatch({ type: 'UPDATE_TOAST', toast: { ...next, id } }),
  };
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);

    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  };
}
