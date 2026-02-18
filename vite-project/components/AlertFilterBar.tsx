
import React from 'react';
import { AlertCategory } from '../types';

interface AlertFilterBarProps {
  selectedCategory: AlertCategory | 'All' | 'MyReports';
  onCategoryChange: (category: AlertCategory | 'All' | 'MyReports') => void;
  showResolved: boolean;
  onToggleResolved: (val: boolean) => void;
}

const AlertFilterBar: React.FC<AlertFilterBarProps> = ({ 
  selectedCategory, 
  onCategoryChange, 
  showResolved, 
  onToggleResolved 
}) => {
  return (
    <div className="mb-6 space-y-4">
      {/* Selector de Estado: Live vs Historial vs Mis Reportes */}
      <div className="flex flex-wrap gap-2 bg-gray-200/50 p-1 rounded-xl w-fit">
        <button 
          onClick={() => {
            onToggleResolved(false);
            if (selectedCategory === 'MyReports') onCategoryChange('All');
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!showResolved && selectedCategory !== 'MyReports' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          EN VIVO
        </button>
        <button 
          onClick={() => {
            onToggleResolved(true);
            if (selectedCategory === 'MyReports') onCategoryChange('All');
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${showResolved && selectedCategory !== 'MyReports' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          HISTORIAL
        </button>
        <button 
          onClick={() => onCategoryChange('MyReports')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedCategory === 'MyReports' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          MIS REPORTES
        </button>
      </div>

      {/* Selector de Categorías */}
      {selectedCategory !== 'MyReports' && (
        <div className="flex overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide space-x-2">
          <button
            onClick={() => onCategoryChange('All')}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border transition-all ${selectedCategory === 'All' ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'}`}
          >
            Todas
          </button>
          {Object.values(AlertCategory).map(cat => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border transition-all ${selectedCategory === cat ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertFilterBar;
