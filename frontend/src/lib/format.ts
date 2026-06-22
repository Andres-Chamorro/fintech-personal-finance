export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1];
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string | string[] } } };
    const message = axiosError.response?.data?.message;
    if (Array.isArray(message)) return message[0];
    if (typeof message === 'string') return message;
  }
  return 'Ha ocurrido un error inesperado';
}
