
import React from 'react';
import { Alert, AlertCategory, User } from '../types';

interface AlertFeedProps {
  alerts: Alert[];
  onVote: (id: string, type: 'up' | 'down') => void;
  currentUser?: User | null;
  onEdit?: (alert: Alert) => void;
  onSelect?: (alert: Alert) => void;
}

const CategoryIcon: React.FC<{ category: AlertCategory; className?: string }> = ({ category, className = "w-3 h-3" }) => {
  switch (category) {
    case AlertCategory.ACCIDENT:
      return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5z"/></svg>;
    case AlertCategory.CRIME:
      return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 10c-2.7 0-5.8-1.29-6-2.01.02-1.99 3.97-3.08 6-3.08 2.04 0 5.99 1.09 6 3.08-.2.72-3.3 2.01-6 2.01z"/></svg>;
    case AlertCategory.TRAFFIC:
      return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-1v2h1v2h-1v2h1v2h-1v2h1v2h-1v2h1v2h-1v2h-2V6h-2v14h-2V6h-2v14H9V6H7v14H5V6H4V4h16v2z"/></svg>;
    case AlertCategory.FIRE:
      return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>;
    case AlertCategory.SERVICE:
      return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>;
    case AlertCategory.BROKEN_ASPHALT:
      return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 3.45l8.47 14.55H3.53L12 5.45zM11 10v6h2v-6h-2zm0 8v2h2v-2h-2z"/></svg>;
    default:
      return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>;
  }
};

const AlertFeed: React.FC<AlertFeedProps> = ({ alerts, onVote, currentUser, onEdit, onSelect }) => {
  const isGuest = currentUser?.id === 'guest';

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
    if (!currentUser || isGuest || alert.userId !== currentUser.id) return false;
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
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border flex items-center gap-1.5 ${getCategoryColor(alert.category)}`}>
                <CategoryIcon category={alert.category} />
                {alert.category}
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
                 <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${alert.userId}`} alt="avatar" />
              </div>
              <span className="text-xs font-semibold text-gray-700">{alert.userName}</span>
              <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">★ {alert.userReputation}</span>
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={(e) => { e.stopPropagation(); if(!isGuest) onVote(alert.id, 'up'); }}
                className={`flex items-center space-x-1 transition-colors ${isGuest ? 'text-gray-300 cursor-default' : 'text-gray-500 hover:text-green-600'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                <span className="text-sm font-bold">{alert.upvotes}</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); if(!isGuest) onVote(alert.id, 'down'); }}
                className={`flex items-center space-x-1 transition-colors ${isGuest ? 'text-gray-300 cursor-default' : 'text-gray-500 hover:text-red-600'}`}
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
