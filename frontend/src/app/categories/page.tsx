'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { categoriesService } from '@/services/categories.service';
import Toast from '@/components/Toast';
import type { Category } from '@/types';

export default function CategoriesPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchCategories();
  }, [user, authLoading, router]);

  const fetchCategories = async () => {
    try {
      const data = await categoriesService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', color: '#3B82F6' });
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3B82F6',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoriesService.update(editingCategory.id, formData);
        setToastMessage('Categoría actualizada exitosamente');
      } else {
        await categoriesService.create(formData);
        setToastMessage('Categoría creada exitosamente');
      }
      setToastType('success');
      setShowToast(true);
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', color: '#3B82F6' });
      fetchCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      setToastMessage(error.response?.data?.message || 'Error al guardar categoría');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
      try {
        await categoriesService.delete(id);
        setToastMessage('Categoría eliminada');
        setToastType('success');
        setShowToast(true);
        fetchCategories();
      } catch (error: any) {
        console.error('Error deleting category:', error);
        setToastMessage(error.response?.data?.message || 'Error al eliminar categoría');
        setToastType('error');
        setShowToast(true);
      }
    }
  };

  if (authLoading || !user) return null;

  return (
    <>
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                  title="Volver al Dashboard"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="font-medium">Volver</span>
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
              </div>
              <button onClick={logout} className="text-sm text-red-600 hover:text-red-700 font-medium">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <button
              onClick={openCreateModal}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              + Nueva Categoría
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: category.color || '#3B82F6' }}
                      >
                        <span className="text-white font-bold text-lg">
                          {category.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(category)}
                        className="text-primary-600 hover:text-primary-900 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  placeholder="Ej: Alimentación"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  rows={3}
                  placeholder="Descripción de la categoría"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 w-20 rounded border border-gray-300"
                  />
                  <span className="text-sm text-gray-600">{formData.color}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingCategory(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingCategory ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
