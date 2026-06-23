import { describe, it, expect } from 'vitest';
import { formatCurrency, getMonthName, getErrorMessage } from '../../src/lib/format';

describe('formatCurrency', () => {
  it('should format a number as COP currency', () => {
    const result = formatCurrency(50000);
    expect(result).toContain('50');
  });

  it('should format zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });

  it('should format large numbers', () => {
    const result = formatCurrency(1500000);
    expect(result).toContain('1.500.000');
  });

  it('should format negative numbers', () => {
    const result = formatCurrency(-25000);
    expect(result).toContain('25.000');
  });
});

describe('getMonthName', () => {
  it('should return Enero for month 1', () => {
    expect(getMonthName(1)).toBe('Enero');
  });

  it('should return Junio for month 6', () => {
    expect(getMonthName(6)).toBe('Junio');
  });

  it('should return Diciembre for month 12', () => {
    expect(getMonthName(12)).toBe('Diciembre');
  });
});

describe('getErrorMessage', () => {
  it('should extract message from axios error response', () => {
    const error = {
      response: {
        data: {
          message: 'Credenciales inválidas',
        },
      },
    };
    expect(getErrorMessage(error)).toBe('Credenciales inválidas');
  });

  it('should return first message when response message is an array', () => {
    const error = {
      response: {
        data: {
          message: ['El email es inválido', 'La contraseña es requerida'],
        },
      },
    };
    expect(getErrorMessage(error)).toBe('El email es inválido');
  });

  it('should return default message for unknown errors', () => {
    expect(getErrorMessage(new Error('unknown'))).toBe('Ha ocurrido un error inesperado');
  });

  it('should return default message for null', () => {
    expect(getErrorMessage(null)).toBe('Ha ocurrido un error inesperado');
  });

  it('should return default message for undefined', () => {
    expect(getErrorMessage(undefined)).toBe('Ha ocurrido un error inesperado');
  });
});
