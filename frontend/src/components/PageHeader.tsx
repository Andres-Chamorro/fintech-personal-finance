'use client';

import { useRouter } from 'next/navigation';

interface PageHeaderProps {
  title: string;
  onLogout: () => void;
}

export default function PageHeader({ title, onLogout }: PageHeaderProps) {
  const router = useRouter();

  return (
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
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>
          <button onClick={onLogout} className="text-sm text-red-600 hover:text-red-700 font-medium">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  );
}
