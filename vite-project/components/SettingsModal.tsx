
import React, { useState } from 'react';
import { AlertCategory, NotificationSettings } from '../types';
import { DB_CONFIG } from '../services/databaseService';

interface SettingsModalProps {
  settings: NotificationSettings;
  onSave: (settings: NotificationSettings) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose }) => {
  const [localSettings, setLocalSettings] = useState<NotificationSettings>(settings);

  const toggleCategory = (cat: AlertCategory) => {
    setLocalSettings(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat]
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Ajustes del Sistema</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* MySQL Info - Basada en imagen del usuario */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
             <div className="flex items-center space-x-2 mb-3">
               <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M3 12v3c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-3a2 2 0 00-2-2H5a2 2 0 00-2 2zm2-1a1 1 0 00-1 1v3a1 1 0 001 1h10a1 1 0 001-1v-3a1 1 0 00-1-1H5z" /><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" /></svg>
               <h3 className="text-xs font-black text-blue-700 uppercase tracking-widest">Base de Datos MySQL</h3>
             </div>
             <div className="grid grid-cols-2 gap-4 text-[10px]">
                <div>
                  <p className="text-gray-400 uppercase font-black tracking-tighter">Host / Puerto</p>
                  <p className="font-bold text-gray-700">{DB_CONFIG.host}:{DB_CONFIG.port}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase font-black tracking-tighter">Nombre DB</p>
                  <p className="font-bold text-gray-700">{DB_CONFIG.database}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase font-black tracking-tighter">Usuario</p>
                  <p className="font-bold text-gray-700">{DB_CONFIG.user}</p>
                </div>
                <div className="flex items-end">
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-black tracking-tighter">CONECTADO</span>
                </div>
             </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Notificaciones Push</h3>
              <p className="text-xs text-gray-500">Alertas críticas en tiempo real</p>
            </div>
            <button 
              onClick={() => setLocalSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${localSettings.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${localSettings.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Radio de búsqueda</h3>
              <span className="text-blue-600 font-bold text-sm">{localSettings.radiusKm} km</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={localSettings.radiusKm}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, radiusKm: parseInt(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Categorías de interés</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(AlertCategory).map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left ${localSettings.categories.includes(cat) ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-gray-200 text-gray-500'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => onSave(localSettings)}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95"
          >
            Guardar y Sincronizar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
