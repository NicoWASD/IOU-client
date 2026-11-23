import { afterEach, expect, it, vi } from 'vitest';
import { tokenStore } from './tokenStore';

afterEach(() => {
  vi.restoreAllMocks();
  tokenStore.clear();
});

it('guarda, lee y borra el token', () => {
  tokenStore.set('abc');
  expect(tokenStore.get()).toBe('abc');
  tokenStore.clear();
  expect(tokenStore.get()).toBeNull();
});

it('si localStorage no está disponible, funciona en memoria', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('SecurityError');
  });
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('SecurityError');
  });
  tokenStore.set('xyz');
  expect(tokenStore.get()).toBe('xyz');
});
