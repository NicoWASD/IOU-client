import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { iniciales, listarNombres, tonoDe } from '@/lib/avatar';
import { AvatarPila } from './Avatar';

describe('Avatar', () => {
  it('el tono es estable por id y está entre 1 y 6', () => {
    const ids = ['u1', 'u2', 'u3', '5f0c2a8e-1d2b-4c3a-9e8f-123456789abc'];
    for (const id of ids) {
      expect(tonoDe(id)).toBe(tonoDe(id));
      expect(tonoDe(id)).toBeGreaterThanOrEqual(1);
      expect(tonoDe(id)).toBeLessThanOrEqual(6);
    }
  });

  it.each([
    ['Sofía', 'S'],
    ['juan pérez', 'JP'],
    ['  Ana María  Gómez ', 'AG'],
    ['élida', 'É'],
  ])('iniciales(%s) → %s', (nombre, esperado) => {
    expect(iniciales(nombre)).toBe(esperado);
  });

  it('listarNombres une con coma e "y"', () => {
    expect(listarNombres(['Sofía'])).toBe('Sofía');
    expect(listarNombres(['Sofía', 'Tomi'])).toBe('Sofía y Tomi');
    expect(listarNombres(['Sofía', 'Tomi', 'Juli'])).toBe('Sofía, Tomi y Juli');
  });

  it('la pila muestra hasta 4 y el resto como +N, con todos los nombres para lectores', () => {
    const usuarios = ['Sofía', 'Tomi', 'Juli', 'Caro', 'Lu', 'Fede'].map((nombre, i) => ({
      id: `u${i}`,
      nombre,
    }));
    const { container } = render(<AvatarPila usuarios={usuarios} />);
    expect(screen.getByText('Sofía, Tomi, Juli, Caro, Lu y Fede')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(5);
  });
});
