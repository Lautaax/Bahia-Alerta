
import React from 'react';
import { Alert, AlertCategory, User } from '../types';

interface AlertFeedProps {
  alerts: Alert[];
  onVote: (id: string, type: 'up' | 'down') => void;
  currentUser?: User | null;
  onEdit?: (alert: Alert) => void;
  onSelect?: (alert: Alert) => void;
}

const AlertFeed: React.FC<AlertFeedProps> = ({ alerts, onVote, currentUser, onEdit, onSelect }) => {
  const getCategoryColor = (category: AlertCategory) => {
    switch (category) {
      case AlertCategory.ACCIDENT: return 'bg-red-100 text-red-800 border-red-200';
      case AlertCategory.CRIME: return 'bg-purple-100 text-purple-800 border-purple-200';
      case AlertCategory.TRAFFIC: return 'bg-blue-100 text-blue-800 border-blue-200';
      case AlertCategory.FIRE: return 'bg-orange-100 text-orange-800 border-orange-200';
      case AlertCategory.SERVICE: return 'bg-gray-100 text-gray-800 border-gray-200';
      case AlertCategory.BROKEN_ASPHALT: return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 60000);
    if (diff < 1) return 'Ahora mismo';
    if (diff < 60) return `Hace ${diff} min`;
    return `Hace ${Math.floor(diff/60)} h`;
  };

  const canEdit = (alert: Alert) => {
    if (!currentUser || alert.userId !== currentUser.id) return false;
    const tenMinutesInMs = 10 * 60 * 1000;
    return (Date.now() - alert.timestamp) < tenMinutesInMs;
  };

  return (
    <div className="space-y-4">
      {alerts.map(alert => (
        <div 
          key={alert.id} 
          onClick={() => onSelect?.(alert)}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow relative group cursor-pointer"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getCategoryColor(alert.category)}`}>
                {alert.category.toUpperCase()}
              </span>
              {alert.status === 'verified' && (
                <span className="flex items-center text-green-600 text-xs font-bold">
                  <svg className="w-3.5 h-3.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verificado
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {canEdit(alert) && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(alert);
                  }}
                  className="flex items-center text-blue-600 text-[10px] font-black uppercase tracking-tighter hover:bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Editar
                </button>
              )}
              <span className="text-xs text-gray-400 font-medium">
                {formatTime(alert.timestamp)}
              </span>
            </div>
          </div>

          <div className="flex gap-4 mb-3">
            <div className="flex-1">
              <p className="text-gray-900 font-medium leading-relaxed mb-2">
                {alert.description}
              </p>
              <div className="flex items-center text-[11px] text-gray-500 bg-gray-50 rounded-lg p-2 w-fit">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {alert.location.address}
              </div>
            </div>
            {alert.image && (
              <div className="w-24 h-24 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0">
                <img src={alert.image} alt="Reporte" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                 <img src={`https://picsum.photos/seed/${alert.userId}/100`} alt="avatar" />
              </div>
              <span className="text-xs font-semibold text-gray-700">{alert.userName}</span>
              <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">★ {alert.userReputation}</span>
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={(e) => { e.stopPropagation(); onVote(alert.id, 'up'); }}
                className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                <span className="text-sm font-bold">{alert.upvotes}</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onVote(alert.id, 'down'); }}
                className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="text-sm font-bold">{alert.downvotes}</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlertFeed;
