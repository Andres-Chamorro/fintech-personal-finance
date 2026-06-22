'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { transactionsService } from '@/services/transactions.service';
import { budgetsService } from '@/services/budgets.service';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatCurrency } from '@/lib/format';
import type { Balance, Budget } from '@/types';

export default function DashboardPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [balanceData, budgetsData] = await Promise.all([
          transactionsService.getBalance(),
          budgetsService.getAll(),
        ]);
        setBalance(balanceData);
        setBudgets(budgetsData);
      } catch {
        // errors silently handled — dashboard shows zero values
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Financiero</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.firstName || user.email}
            </span>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Ingresos Totales</h3>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(balance?.totalIncome || 0)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Gastos Totales</h3>
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(balance?.totalExpense || 0)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Balance</h3>
                <p className={`text-3xl font-bold ${(balance?.balance || 0) >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
                  {formatCurrency(balance?.balance || 0)}
                </p>
              </div>
            </div>

            {/* Budgets with Alerts */}
            {budgets.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Presupuestos del Mes</h2>
                <div className="space-y-4">
                  {budgets.map((budget) => (
                    <div key={budget.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {budget.category.name}
                        </h3>
                        <span className="text-sm font-medium text-gray-600">
                          {budget.percentage.toFixed(1)}%
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                        <div
                          className={`h-2.5 rounded-full ${
                            budget.percentage >= 100
                              ? 'bg-red-600'
                              : budget.percentage >= 80
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Gastado: {formatCurrency(budget.spent)}</span>
                        <span>Presupuesto: {formatCurrency(budget.amount)}</span>
                      </div>

                      {budget.alerts.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {budget.alerts.map((alert, idx) => (
                            <p
                              key={idx}
                              className={`text-sm ${
                                alert.includes('CRÍTICO')
                                  ? 'text-red-700'
                                  : 'text-yellow-700'
                              }`}
                            >
                              {alert}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/transactions"
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 text-center"
              >
                + Nueva Transacción
              </Link>
              <Link
                href="/transactions"
                className="bg-white hover:bg-gray-50 text-gray-900 font-semibold py-4 px-6 rounded-lg border-2 border-gray-200 transition duration-200 text-center"
              >
                Ver Transacciones
              </Link>
              <Link
                href="/categories"
                className="bg-white hover:bg-gray-50 text-gray-900 font-semibold py-4 px-6 rounded-lg border-2 border-gray-200 transition duration-200 text-center"
              >
                Gestionar Categorías
              </Link>
              <Link
                href="/budgets"
                className="bg-white hover:bg-gray-50 text-gray-900 font-semibold py-4 px-6 rounded-lg border-2 border-gray-200 transition duration-200 text-center"
              >
                Configurar Presupuestos
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
