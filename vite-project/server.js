
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de conexión (usando tus datos)
const dbConfig = {
  host: '127.0.0.1',
  port: 3306,
  user: 'dbb',
  password: 'Lauta0533',
  database: 'db'
};

// Endpoint para verificar estado
app.get('/status', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.ping();
    await connection.end();
    res.json({ status: 'online', database: dbConfig.database });
  } catch (error) {
    res.status(500).json({ status: 'offline', error: error.message });
  }
});

// Endpoint de Registro Tradicional
app.post('/register', async (req, res) => {
  const { id, name, email, password, avatar } = req.body;
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'El email ya está registrado.' });
    }

    const query = `
      INSERT INTO users (id, name, email, password, avatar, reputation, isAnonymous)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await connection.execute(query, [id, name, email, password, avatar, 100, 0]);
    
    res.json({ success: true, user: { id, name, email, avatar, reputation: 100, isAnonymous: false } });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Endpoint de Login Tradicional
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT id, name, email, avatar, reputation, isAnonymous FROM users WHERE email = ? AND password = ?', 
      [email, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
    }

    res.json({ success: true, user: rows[0] });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// NUEVO: Endpoint de Login con Google
app.post('/google-login', async (req, res) => {
  const { googleId, name, email, avatar } = req.body;
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Buscar usuario por email
    const [rows] = await connection.execute(
      'SELECT id, name, email, avatar, reputation, isAnonymous FROM users WHERE email = ?', 
      [email]
    );

    if (rows.length > 0) {
      // Usuario ya existe, devolvemos sus datos
      res.json({ success: true, user: rows[0] });
    } else {
      // Usuario nuevo, lo registramos (sin password ya que usa Google)
      const userId = `g_${googleId.substring(0, 10)}_${Math.random().toString(36).substr(2, 5)}`;
      const query = `
        INSERT INTO users (id, name, email, password, avatar, reputation, isAnonymous)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      // Usamos un placeholder para password
      await connection.execute(query, [userId, name, email, 'GOOGLE_AUTH_USER', avatar, 100, 0]);
      
      res.json({ 
        success: true, 
        user: { id: userId, name, email, avatar, reputation: 100, isAnonymous: false } 
      });
    }
  } catch (error) {
    console.error('Google Login Error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Endpoint para sincronizar alertas
app.post('/sync-alert', async (req, res) => {
  const { action, payload } = req.body;
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);

    if (action === 'INSERT') {
      const query = `
        INSERT INTO alerts (id, userId, userName, category, description, address, lat, lng, timestamp, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await connection.execute(query, [
        payload.id, payload.userId, payload.userName, payload.category, 
        payload.description, payload.location.address, payload.location.lat, 
        payload.location.lng, payload.timestamp, payload.status
      ]);
    } else if (action === 'UPDATE') {
      const query = `
        UPDATE alerts SET 
        category = ?, description = ?, status = ?, upvotes = ?, downvotes = ?
        WHERE id = ?
      `;
      await connection.execute(query, [
        payload.category, payload.description, payload.status, 
        payload.upvotes, payload.downvotes, payload.id
      ]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('MySQL Error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Bahía Alerta corriendo en http://localhost:${PORT}`);
});
