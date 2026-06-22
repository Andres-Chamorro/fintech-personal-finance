'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { budgetsService } from '@/services/budgets.service';
import { categoriesService } from '@/services/categories.service';
import Toast from '@/components/Toast';
import PageHeader from '@/components/PageHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatCurrency, getMonthName, getErrorMessage } from '@/lib/format';
import type { Budget, Category } from '@/types';

export default function BudgetsPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [formData, setFormData] = useState({
    amount: '',
    month: currentMonth,
    year: currentYear,
    categoryId: '',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [user, authLoading, router]);

  const fetchData = async () => {
    try {
      const [budgetsData, categoriesData] = await Promise.all([
        budgetsService.getAll(),
        categoriesService.getAll(),
      ]);
      setBudgets(budgetsData);
      setCategories(categoriesData);
    } catch {
      setToastMessage('Error al cargar datos');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingBudget(null);
    setFormData({ amount: '', month: currentMonth, year: currentYear, categoryId: '' });
    setShowModal(true);
  };

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      amount: String(budget.amount),
      month: budget.month,
      year: budget.year,
      categoryId: budget.categoryId,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBudget(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.year < currentYear ||
        (formData.year === currentYear && formData.month < currentMonth)) {
      setToastMessage('No se pueden crear presupuestos para meses anteriores al actual');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      const payload = { ...formData, amount: parseFloat(formData.amount) };

      if (editingBudget) {
        await budgetsService.update(editingBudget.id, payload);
        setToastMessage('Presupuesto actualizado exitosamente');
      } else {
        await budgetsService.create(payload);
        setToastMessage('Presupuesto creado exitosamente');
      }
      setToastType('success');
      setShowToast(true);
      closeModal();
      setFormData({ amount: '', month: currentMonth, year: currentYear, categoryId: '' });
      fetchData();
    } catch (error) {
      setToastMessage(getErrorMessage(error));
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este presupuesto?')) {
      try {
        await budgetsService.delete(id);
        setToastMessage('Presupuesto eliminado');
        setToastType('success');
        setShowToast(true);
        fetchData();
      } catch (error) {
        setToastMessage(getErrorMessage(error));
        setToastType('error');
        setShowToast(true);
      }
    }
  };

  if (authLoading || !user) return null;

  return (
    <>
      {showToast && (
        <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
      )}

      <div className="min-h-screen bg-gray-50">
        <PageHeader title="Presupuestos" onLogout={logout} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <button onClick={openCreateModal} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold">
              + Nuevo Presupuesto
            </button>
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-6">
              {budgets.map((budget) => (
                <div key={budget.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{budget.category.name}</h3>
                      <p className="text-sm text-gray-500">{getMonthName(budget.month)} {budget.year}</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => openEditModal(budget)} className="text-primary-600 hover:text-primary-900 text-sm font-medium">Editar</button>
                      <button onClick={() => handleDelete(budget.id)} className="text-red-600 hover:text-red-900 text-sm">Eliminar</button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Presupuesto:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(budget.amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Gastado:</span>
                      <span className="font-semibold text-red-600">{formatCurrency(budget.spent)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Restante:</span>
                      <span className={`font-semibold ${budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(budget.remaining)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progreso</span>
                      <span className="font-semibold text-gray-900">{budget.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          budget.percentage >= 100 ? 'bg-red-600' : budget.percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {budget.alerts && budget.alerts.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {budget.alerts.map((alert, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg text-sm ${
                            alert.includes('CRÍTICO')
                              ? 'bg-red-50 border border-red-200 text-red-800'
                              : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                          }`}
                        >
                          {alert}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {budgets.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No tienes presupuestos configurados</p>
                  <button onClick={openCreateModal} className="mt-4 text-primary-600 hover:text-primary-700 font-semibold">
                    Crear tu primer presupuesto
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">
              {editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                <select required value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} disabled={!!editingBudget} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed">
                  <option value="">Selecciona una categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {editingBudget && <p className="text-xs text-gray-500 mt-1">La categoría no se puede cambiar al editar</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monto del Presupuesto</label>
                <input type="number" required min="1000" step="1000" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" placeholder="Mínimo $1,000" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mes</label>
                  <select value={formData.month} onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })} disabled={!!editingBudget} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month} disabled={formData.year === currentYear && month < currentMonth}>
                        {getMonthName(month)}
                      </option>
                    ))}
                  </select>
                  {!editingBudget && <p className="text-xs text-gray-500 mt-1">No se permiten meses pasados</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Año</label>
                  <input
                    type="number"
                    min={currentYear}
                    value={formData.year}
                    disabled={!!editingBudget}
                    onChange={(e) => {
                      const newYear = parseInt(e.target.value);
                      setFormData({
                        ...formData,
                        year: newYear,
                        month: newYear === currentYear && formData.month < currentMonth ? currentMonth : formData.month,
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              {editingBudget && <p className="text-xs text-gray-500">El mes y año no se pueden cambiar al editar</p>}
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                  {editingBudget ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
