
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Alert, AlertCategory, NotificationSettings, Comment } from './types';
import AuthScreen from './components/AuthScreen';
import Layout from './components/Layout';
import AlertFeed from './components/AlertFeed';
import CreateAlertModal from './components/CreateAlertModal';
import MapView from './components/MapView';
import GeminiChat from './components/GeminiChat';
import AlertFilterBar from './components/AlertFilterBar';
import SettingsModal from './components/SettingsModal';
import AlertDetailsModal from './components/AlertDetailsModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  setDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from './services/firebase';

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  radiusKm: 5,
  categories: Object.values(AlertCategory)
};

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [view, setView] = useState<'feed' | 'map'>('feed');
  const [activeTab, setActiveTab] = useState<'alerts' | 'assistant'>('alerts');
  
  const [selectedCategory, setSelectedCategory] = useState<AlertCategory | 'All' | 'MyReports'>('All');
  const [showResolved, setShowResolved] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  // Escuchar alertas de Firestore en tiempo real
  useEffect(() => {
    if (!isAuthenticated) return;

    const q = query(collection(db, "alerts"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAlerts: Alert[] = [];
      snapshot.forEach((doc) => {
        fetchedAlerts.push({ id: doc.id, ...doc.data() } as Alert);
      });
      setAlerts(fetchedAlerts);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const handleSaveSettings = (newSettings: NotificationSettings) => {
    setNotificationSettings(newSettings);
    localStorage.setItem('bahia_alerta_settings', JSON.stringify(newSettings));
    setIsSettingsOpen(false);
  };

  const handleAddOrUpdateAlert = async (data: { category: AlertCategory, description: string, image?: string, location: { lat: number, lng: number, address: string } }) => {
    if (!user) return;

    if (editingAlert) {
      const alertRef = doc(db, "alerts", editingAlert.id);
      await updateDoc(alertRef, { ...data });
      setEditingAlert(null);
    } else {
      const newAlert = {
        userId: user.id,
        userName: user.name,
        userReputation: user.reputation,
        category: data.category,
        description: data.description,
        image: data.image || null,
        location: data.location,
        timestamp: Date.now(),
        upvotes: 0,
        downvotes: 0,
        status: 'active',
        comments: []
      };
      await addDoc(collection(db, "alerts"), newAlert);
    }
    setIsModalOpen(false);
  };

  const handleVote = async (id: string, type: 'up' | 'down') => {
    const alertRef = doc(db, "alerts", id);
    const alert = alerts.find(a => a.id === id);
    if (!alert) return;

    if (type === 'up') {
      await updateDoc(alertRef, { upvotes: alert.upvotes + 1 });
    } else {
      await updateDoc(alertRef, { downvotes: alert.downvotes + 1 });
    }
  };

  const handleResolveAlert = async (id: string) => {
    const alertRef = doc(db, "alerts", id);
    await updateDoc(alertRef, { status: 'resolved' });
    setSelectedAlert(null);
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (selectedCategory === 'MyReports') {
        return alert.userId === user?.id;
      }
      const categoryMatch = selectedCategory === 'All' || alert.category === selectedCategory;
      const statusMatch = showResolved 
        ? (alert.status === 'resolved' || alert.status === 'verified') 
        : (alert.status === 'active' || alert.status === 'verified');
      
      return categoryMatch && statusMatch;
    });
  }, [alerts, selectedCategory, showResolved, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-600">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 font-black text-3xl animate-bounce">B</div>
        <p className="mt-4 text-white font-bold tracking-widest text-xs uppercase animate-pulse">Conectando a Firebase...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <AuthScreen />;

  return (
    <Layout 
      onLogout={logout} 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      onOpenSettings={() => setIsSettingsOpen(true)}
    >
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {activeTab === 'alerts' ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                {selectedCategory === 'MyReports' ? 'Mis Reportes' : 'Bahía Blanca'}
              </h1>
              <div className="flex space-x-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200 w-fit">
                <button onClick={() => setView('feed')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'feed' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>Lista</button>
                <button onClick={() => setView('map')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'map' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>Mapa</button>
              </div>
            </div>

            <AlertFilterBar 
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              showResolved={showResolved}
              onToggleResolved={setShowResolved}
            />

            {view === 'feed' ? (
              filteredAlerts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300 px-6">
                  <p className="text-gray-400 font-medium">No hay alertas en esta categoría.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AlertFeed alerts={filteredAlerts} onVote={handleVote} currentUser={user} onSelect={setSelectedAlert} onEdit={(a) => { setEditingAlert(a); setIsModalOpen(true); }} />
                </div>
              )
            ) : (
              <MapView alerts={filteredAlerts} onSelectAlert={setSelectedAlert} userSettings={notificationSettings} />
            )}
            
            <button 
              onClick={() => { setEditingAlert(null); setIsModalOpen(true); }}
              className="fixed bottom-24 right-6 bg-red-600 text-white p-4 rounded-full shadow-xl hover:bg-red-700 hover:scale-105 active:scale-95 transition-all flex items-center space-x-2 z-40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              <span className="font-semibold pr-1">Reportar</span>
            </button>
          </>
        ) : (
          <GeminiChat />
        )}
      </div>

      {(isModalOpen || editingAlert) && (
        <CreateAlertModal onClose={() => { setIsModalOpen(false); setEditingAlert(null); }} onSubmit={handleAddOrUpdateAlert} initialAlert={editingAlert} />
      )}

      {isSettingsOpen && <SettingsModal settings={notificationSettings} onSave={handleSaveSettings} onClose={() => setIsSettingsOpen(false)} />}

      {selectedAlert && user && (
        <AlertDetailsModal 
          alert={selectedAlert} 
          currentUser={user}
          onClose={() => setSelectedAlert(null)}
          onResolve={handleResolveAlert}
          onAddComment={async (id, text) => {
            const alertRef = doc(db, "alerts", id);
            const alert = alerts.find(a => a.id === id);
            if (!alert) return;
            const newComment: Comment = {
              id: Math.random().toString(36).substr(2, 9),
              userId: user.id,
              userName: user.name,
              text,
              timestamp: Date.now()
            };
            await updateDoc(alertRef, { comments: [...(alert.comments || []), newComment] });
          }}
        />
      )}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
