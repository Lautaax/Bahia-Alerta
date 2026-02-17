
/**
 * Servicio de Base de Datos MySQL - Bahía Alerta
 * Conexión mediante Node.js Backend (localhost:3001)
 */

const API_URL = "http://localhost:3001";

export interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  database: string;
  pass: string;
  connected: boolean;
}

export const DB_CONFIG: MySQLConfig = {
  host: "127.0.0.1",
  port: 3306,
  user: "dbb",
  database: "db",
  pass: "Lauta0533",
  connected: false
};

/**
 * Registra un nuevo usuario en MySQL
 */
export const registerUser = async (userData: any) => {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: "Error de conexión con el servidor." };
  }
};

/**
 * Autentica un usuario contra MySQL
 */
export const loginUser = async (email: string, passHash: string) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: passHash })
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: "Error de conexión con el servidor." };
  }
};

/**
 * Inicia sesión con Google enviando los datos del perfil al backend
 */
export const loginWithGoogle = async (profile: { googleId: string, name: string, email: string, avatar: string }) => {
  try {
    const response = await fetch(`${API_URL}/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: "Error de conexión con el servidor." };
  }
};

/**
 * Envía datos al backend Node.js para persistencia en MySQL
 */
export const syncToMySQL = async (tableName: string, action: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => {
  if (tableName !== 'alerts') return { success: true };

  try {
    const response = await fetch(`${API_URL}/sync-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload })
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[MySQL Sync] Error:", error);
    return { success: false, error: "Servidor backend desconectado" };
  }
};

/**
 * Verifica si el servidor Node.js y MySQL están operativos
 */
export const checkDBStatus = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/status`);
    const data = await response.json();
    return data.status === 'online';
  } catch (error) {
    return false;
  }
};
