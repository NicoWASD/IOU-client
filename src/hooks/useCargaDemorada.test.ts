import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useCargaDemorada } from './useCargaDemorada';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('una respuesta en menos de 150 ms nunca muestra el esqueleto', () => {
  const { result, rerender } = renderHook(({ c }) => useCargaDemorada(c), {
    initialProps: { c: true },
  });
  expect(result.current).toMatchObject({ esqueleto: false, enEspera: true });
  act(() => vi.advanceTimersByTime(100));
  rerender({ c: false });
  expect(result.current).toMatchObject({ esqueleto: false, enEspera: false });
  act(() => vi.advanceTimersByTime(1000));
  expect(result.current.esqueleto).toBe(false);
});

it('el esqueleto aparece a los 150 ms y se mantiene al menos 300 ms', () => {
  const { result, rerender } = renderHook(({ c }) => useCargaDemorada(c), {
    initialProps: { c: true },
  });
  act(() => vi.advanceTimersByTime(150));
  expect(result.current.esqueleto).toBe(true);
  act(() => vi.advanceTimersByTime(50));
  rerender({ c: false });
  expect(result.current.esqueleto).toBe(true);
  act(() => vi.advanceTimersByTime(249));
  expect(result.current.esqueleto).toBe(true);
  act(() => vi.advanceTimersByTime(1));
  expect(result.current.esqueleto).toBe(false);
});

it('pasados 3 s avisa del cold start', () => {
  const { result } = renderHook(() => useCargaDemorada(true));
  act(() => vi.advanceTimersByTime(2999));
  expect(result.current.coldStart).toBe(false);
  act(() => vi.advanceTimersByTime(1));
  expect(result.current.coldStart).toBe(true);
});
