'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { transactionsService } from '@/services/transactions.service';
import { categoriesService } from '@/services/categories.service';
import Toast from '@/components/Toast';
import PageHeader from '@/components/PageHeader';
import FormModal from '@/components/FormModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatCurrency, getErrorMessage } from '@/lib/format';
import type { Transaction, Category } from '@/types';
import { TransactionType } from '@/types';

interface TransactionFilters {
  type: string;
  categoryId: string;
  startDate: string;
  endDate: string;
  sortOrder: 'ASC' | 'DESC';
  page: number;
  limit: number;
}

export default function TransactionsPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [filters, setFilters] = useState<TransactionFilters>({
    type: '',
    categoryId: '',
    startDate: '',
    endDate: '',
    sortOrder: 'DESC',
    page: 1,
    limit: 10,
  });

  const [formData, setFormData] = useState({
    type: TransactionType.EXPENSE,
    amount: '',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
    categoryId: '',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchCategories();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchTransactions();
  }, [filters, user]);

  const fetchCategories = async () => {
    try {
      setCategories(await categoriesService.getAll());
    } catch {
      // categories are optional for display
    }
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: filters.page,
        limit: filters.limit,
        sortOrder: filters.sortOrder,
      };
      if (filters.type) params.type = filters.type;
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const transData = await transactionsService.getAll(params);
      setTransactions(transData.data);
      setTotalPages(transData.pagination.totalPages);
      setCurrentPage(transData.pagination.page);
    } catch {
      setToastMessage('Error al cargar transacciones');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        transactionDate: formData.transactionDate,
        categoryId: formData.categoryId || undefined,
      };

      if (isEditing && editingId) {
        await transactionsService.update(editingId, dataToSend);
        setToastMessage('Transacción actualizada exitosamente');
      } else {
        await transactionsService.create(dataToSend);
        setToastMessage('Transacción creada exitosamente');
      }
      setToastType('success');
      setShowToast(true);
      handleCloseModal();
      await fetchTransactions();
    } catch (error) {
      setToastMessage(getErrorMessage(error));
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta transacción?')) {
      try {
        await transactionsService.delete(id);
        setToastMessage('Transacción eliminada');
        setToastType('success');
        setShowToast(true);
        fetchTransactions();
      } catch (error) {
        setToastMessage(getErrorMessage(error));
        setToastType('error');
        setShowToast(true);
      }
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setIsEditing(true);
    setEditingId(transaction.id);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description,
      transactionDate: transaction.transactionDate.split('T')[0],
      categoryId: transaction.categoryId || '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      type: TransactionType.EXPENSE,
      amount: '',
      description: '',
      transactionDate: new Date().toISOString().split('T')[0],
      categoryId: '',
    });
  };

  const handleFilterChange = (key: keyof TransactionFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({ type: '', categoryId: '', startDate: '', endDate: '', sortOrder: 'DESC', page: 1, limit: 10 });
  };

  if (authLoading || !user) return null;

  return (
    <>
      {showToast && (
        <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
      )}

      <div className="min-h-screen bg-gray-50">
        <PageHeader title="Transacciones" onLogout={logout} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
                  <option value="">Todos</option>
                  <option value="income">Ingreso</option>
                  <option value="expense">Egreso</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                <select value={filters.categoryId} onChange={(e) => handleFilterChange('categoryId', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
                  <option value="">Todas</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
                <input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
                <input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar</label>
                <select value={filters.sortOrder} onChange={(e) => handleFilterChange('sortOrder', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
                  <option value="DESC">Más reciente</option>
                  <option value="ASC">Más antigua</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={clearFilters} className="text-sm text-gray-600 hover:text-gray-900 underline">Limpiar filtros</button>
            </div>
          </div>

          <div className="mb-6">
            <button onClick={() => setShowModal(true)} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold">
              + Nueva Transacción
            </button>
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.transactionDate).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{transaction.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.category?.name || 'Sin categoría'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.type === TransactionType.INCOME
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type === TransactionType.INCOME ? 'Ingreso' : 'Egreso'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        <span className={transaction.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button onClick={() => handleEdit(transaction)} className="text-blue-600 hover:text-blue-900 mr-4">Editar</button>
                        <button onClick={() => handleDelete(transaction.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700">
                      Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
                    </p>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">←</button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                        <button key={page} onClick={() => handlePageChange(page)} className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === currentPage ? 'z-10 bg-primary-50 border-primary-500 text-primary-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}>{page}</button>
                      ))}
                      <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">→</button>
                    </nav>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <FormModal
        title={isEditing ? 'Editar Transacción' : 'Nueva Transacción'}
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        submitLabel={isEditing ? 'Actualizar' : 'Crear'}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
          <select name="type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
            <option value={TransactionType.INCOME}>Ingreso</option>
            <option value={TransactionType.EXPENSE}>Egreso</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Monto</label>
          <input type="number" required min="0.01" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" placeholder="Ej: 50000" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
          <input type="text" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
          <input type="date" required max={new Date().toISOString().split('T')[0]} value={formData.transactionDate} onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" />
          <p className="text-xs text-gray-500 mt-1">No se permiten fechas futuras</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Categoría (opcional)</label>
          <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
            <option value="">Sin categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </FormModal>
    </>
  );
}
