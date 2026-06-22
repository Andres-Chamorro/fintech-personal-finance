'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { categoriesService } from '@/services/categories.service';
import Toast from '@/components/Toast';
import PageHeader from '@/components/PageHeader';
import FormModal from '@/components/FormModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getErrorMessage } from '@/lib/format';
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
    } catch {
      setToastMessage('Error al cargar categorías');
      setToastType('error');
      setShowToast(true);
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

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
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
      closeModal();
      setFormData({ name: '', description: '', color: '#3B82F6' });
      fetchCategories();
    } catch (error) {
      setToastMessage(getErrorMessage(error));
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
        <PageHeader title="Categorías" onLogout={logout} />

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
            <LoadingSpinner />
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
                      <button onClick={() => openEditModal(category)} className="text-primary-600 hover:text-primary-900 text-sm">
                        Editar
                      </button>
                      <button onClick={() => handleDelete(category.id)} className="text-red-600 hover:text-red-900 text-sm">
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

      <FormModal
        title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
        isOpen={showModal}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitLabel={editingCategory ? 'Guardar' : 'Crear'}
      >
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Descripción (opcional)</label>
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
      </FormModal>
    </>
  );
}
