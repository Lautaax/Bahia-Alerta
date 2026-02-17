
import React, { useState } from 'react';
import { Alert, AlertCategory, Comment, User } from '../types';

interface AlertDetailsModalProps {
  alert: Alert;
  currentUser: User;
  onClose: () => void;
  onResolve?: (id: string) => void;
  onAddComment: (alertId: string, commentText: string) => void;
}

const AlertDetailsModal: React.FC<AlertDetailsModalProps> = ({ alert, currentUser, onClose, onResolve, onAddComment }) => {
  const [commentInput, setCommentInput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSendComment = () => {
    if (!commentInput.trim()) return;
    onAddComment(alert.id, commentInput.trim());
    setCommentInput('');
  };

  const handleShare = async () => {
    const shareData = {
      title: `🚨 Bahía Alerta: ${alert.category}`,
      text: `${alert.description} en ${alert.location.address}. Reportado en Bahía Alerta.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
           console.error('Error sharing:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isBrokenAsphalt = alert.category === AlertCategory.BROKEN_ASPHALT;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{alert.category}</span>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">Detalles de Alerta</h2>
          </div>
          <div className="flex space-x-2 relative">
            <button 
              onClick={handleShare}
              title="Compartir alerta"
              className="flex items-center space-x-2 text-blue-600 hover:text-white hover:bg-blue-600 px-4 py-2.5 bg-white rounded-2xl shadow-sm border border-gray-100 transition-all active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="text-xs font-bold uppercase">Difundir</span>
            </button>
            
            {copied && (
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-3 py-1 rounded-full animate-in fade-in slide-in-from-top-1 whitespace-nowrap shadow-lg">
                Copiado al portapapeles
              </div>
            )}

            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 p-2.5 bg-white rounded-2xl shadow-sm border border-gray-100 transition-all active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {alert.image && (
            <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <img src={alert.image} alt="Evidencia" className="w-full h-auto object-cover max-h-64" />
            </div>
          )}

          <div className="space-y-4">
            <p className="text-lg text-gray-800 leading-relaxed font-medium">
              {alert.description}
            </p>
            <div className="flex items-center text-sm text-gray-500 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
              <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-semibold">{alert.location.address}</span>
            </div>

            {isBrokenAsphalt && alert.status !== 'resolved' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col space-y-3">
                 <div className="flex items-center space-x-2 text-amber-800">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span className="text-sm font-bold">REPARACIÓN PENDIENTE</span>
                 </div>
                 <p className="text-xs text-amber-700 leading-tight">Este pozo persistirá en el mapa hasta que sea confirmado como reparado por los vecinos.</p>
                 <button 
                   onClick={() => onResolve?.(alert.id)}
                   className="w-full bg-amber-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-amber-700 transition-colors shadow-sm"
                 >
                   Confirmar Reparación
                 </button>
              </div>
            )}

            <div className="flex items-center justify-between py-4 border-y border-gray-100">
               <div className="flex items-center space-x-3">
                 <img src={`https://picsum.photos/seed/${alert.userId}/100`} className="w-10 h-10 rounded-xl border border-gray-200" alt="avatar" />
                 <div>
                   <p className="text-sm font-bold text-gray-900">{alert.userName}</p>
                   <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Reportado a las {formatTime(alert.timestamp)}</p>
                 </div>
               </div>
               <div className="flex space-x-2">
                 <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-100">+{alert.upvotes}</span>
                 <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-100">-{alert.downvotes}</span>
               </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center">
              Aportes de Vecinos
              <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px]">{alert.comments?.length || 0}</span>
            </h3>
            
            <div className="space-y-3">
              {alert.comments && alert.comments.length > 0 ? (
                alert.comments.map(c => (
                  <div key={c.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-xs text-blue-600">{c.userName}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{formatTime(c.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-snug">{c.text}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs text-gray-400 font-medium italic">Sin comentarios aún. Sé el primero en aportar información.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex space-x-2 items-center bg-gray-50 p-1.5 rounded-2xl border border-gray-200 focus-within:border-blue-400 transition-colors">
            <input 
              type="text" 
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
              placeholder="Escribe un aporte o actualización..."
              className="flex-1 bg-transparent border-none outline-none text-sm px-3 py-2.5"
            />
            <button 
              onClick={handleSendComment}
              disabled={!commentInput.trim()}
              className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 transition-all active:scale-95 shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertDetailsModal;
