
import React from 'react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  activeTab: 'alerts' | 'assistant';
  onTabChange: (tab: 'alerts' | 'assistant') => void;
  onOpenSettings: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout, activeTab, onTabChange, onOpenSettings }) => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-inner">B</div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight text-gray-900 leading-none">Bahía Alerta</span>
              <div className="flex items-center mt-1">
                 <div className="w-1.5 h-1.5 rounded-full mr-1 bg-green-500 animate-pulse"></div>
                 <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Powered by Firebase Cloud</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button onClick={onOpenSettings} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            </button>
            <div className="h-8 w-px bg-gray-100 mx-1"></div>
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-bold text-gray-900">{user.name}</span>
                <span className="text-[10px] text-blue-600 font-black">★ {user.reputation}</span>
              </div>
              <img src={user.avatar} alt="User" className="w-9 h-9 rounded-xl border-2 border-white shadow-sm group-hover:border-blue-100 transition-all object-cover" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-6 py-2 pb-6 flex justify-around items-center z-50">
        <button onClick={() => onTabChange('alerts')} className={`flex flex-col items-center p-2 rounded-2xl transition-all ${activeTab === 'alerts' ? 'text-blue-600 bg-blue-50/50 scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={activeTab === 'alerts' ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          <span className="text-[10px] mt-1 font-bold">Alertas</span>
        </button>
        <button onClick={() => onTabChange('assistant')} className={`flex flex-col items-center p-2 rounded-2xl transition-all ${activeTab === 'assistant' ? 'text-blue-600 bg-blue-50/50 scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={activeTab === 'assistant' ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          <span className="text-[10px] mt-1 font-bold">Asistente</span>
        </button>
        <button onClick={onLogout} className="flex flex-col items-center p-2 rounded-2xl text-gray-400 hover:text-red-600 transition-all hover:bg-red-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          <span className="text-[10px] mt-1 font-bold">Cerrar</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
