import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { MiBalance } from './GrupoCard';

it('balance 0 → "Están a mano" con resaltador', () => {
  render(<MiBalance balance="0.00" />);
  expect(screen.getByText('Están a mano')).toHaveClass('saldado');
});

it('balance positivo → "Te deben" en verde, con signo +', () => {
  render(<MiBalance balance="1200.00" />);
  expect(screen.getByText('Te deben')).toBeInTheDocument();
  const monto = screen.getByText(/1\.200/);
  expect(monto.textContent?.replace(/\s/g, ' ')).toBe('+$ 1.200');
  expect(monto).toHaveClass('text-te-deben');
});

it('balance negativo → "Debés" en rojo, con signo −', () => {
  render(<MiBalance balance="-45600.50" />);
  expect(screen.getByText('Debés')).toBeInTheDocument();
  const monto = screen.getByText(/45\.600,50/);
  expect(monto.textContent?.replace(/\s/g, ' ')).toBe('−$ 45.600,50');
  expect(monto).toHaveClass('text-debes');
});
