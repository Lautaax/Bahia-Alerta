
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AuthScreen: React.FC = () => {
  const { login, register, loginWithGoogle, loginAsGuest } = useAuth();
  const [authMethod, setAuthMethod] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let result;
      if (authMethod === 'register') {
        result = await register(name, email, password);
      } else {
        result = await login(email, password);
      }

      if (!result.success) {
        setError(result.error || 'Ocurrió un error inesperado.');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError("Error de red o configuración de Firebase.");
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    const result = await loginWithGoogle();
    if (!result.success) {
      setError(result.error || "Error al iniciar sesión con Google");
      setIsSubmitting(false);
    }
  };

  const handleLocalGuestSignIn = () => {
    setError(null);
    loginAsGuest();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-900 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
             <span className="text-blue-600 text-4xl font-black italic">B</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Bahía Alerta</h1>
          <p className="text-blue-100 text-sm mt-2 opacity-80">Seguridad Comunitaria • Cloud Enabled</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-white/20">
          <div className="flex bg-white/5 rounded-2xl p-1 mb-8">
            <button 
              onClick={() => { setAuthMethod('login'); setError(null); }}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${authMethod === 'login' ? 'bg-white text-blue-700 shadow-md' : 'text-white/60 hover:text-white'}`}
            >
              Ingresar
            </button>
            <button 
              onClick={() => { setAuthMethod('register'); setError(null); }}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${authMethod === 'register' ? 'bg-white text-blue-700 shadow-md' : 'text-white/60 hover:text-white'}`}
            >
              Crear Cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-100 text-[11px] font-bold p-3 rounded-xl">
                ⚠️ {error}
              </div>
            )}

            {authMethod === 'register' && (
              <input 
                type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y Apellido"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all font-medium text-sm"
              />
            )}

            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo electrónico"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all font-medium text-sm"
            />

            <input 
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all font-medium text-sm"
            />

            <button 
              type="submit" disabled={isSubmitting}
              className="w-full bg-white text-blue-700 py-4 rounded-2xl font-black text-sm tracking-widest transition-all hover:bg-blue-50 shadow-xl active:scale-95 disabled:opacity-50 mt-4"
            >
              {isSubmitting ? 'PROCESANDO...' : (authMethod === 'login' ? 'INICIAR SESIÓN' : 'REGISTRARME')}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-white/40">
              <span className="bg-indigo-900/50 px-3 backdrop-blur-sm">O continúa con</span>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full bg-white flex items-center justify-center space-x-3 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-gray-700 font-bold text-sm">Google</span>
            </button>

            <button 
              onClick={handleLocalGuestSignIn}
              className="w-full bg-white/5 border border-white/20 text-white flex items-center justify-center space-x-3 py-4 rounded-2xl hover:bg-white/10 transition-all active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="font-bold text-sm">Explorar como Invitado</span>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-[10px] text-blue-100/60 font-medium">Acceso Local Sin Registro para Invitados</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
