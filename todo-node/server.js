const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');//librería que usás en Node.js para trabajar con JWT
//jwt Sirve para identificar de forma segura a un usuario.

//Se utiliza en APIs, sitios web, apps móviles, etc.

//Es un string dividido en 3 partes
const JWT_SECRET = process.env.JWT_SECRET;

const app = express();
const port = process.env.PORT || 3000;

const db = new sqlite3.Database('./tasks.db');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

//DESDE ACA EMPIEZA EL CRUD(CREATE O CREAR,READ O LEER, UPDATE O ACTUALIZAR Y DELETE O ELIMINAR)

// Crear tablas si no existen
db.run(`CREATE TABLE IF NOT EXISTS user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT,
    completed INTEGER DEFAULT 0,
  user_id INTEGER,
  FOREIGN KEY(user_id) REFERENCES user(id)
)`);

// Middleware para verificar token
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Falta token' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.userId = decoded.userId;
    next();
  });
}

// Registro
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Faltan datos' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('INSERT INTO user (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
      if (err) return res.status(400).json({ error: 'Usuario ya existe' });
      res.json({ message: 'Usuario creado' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});


// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Faltan datos' });

  db.get('SELECT * FROM user WHERE username = ?', [username], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Error en la base de datos' });
    if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  });
});

// Autenticación requerida a partir de acá
app.use('/api/tasks', authMiddleware);

// Obtener tareas del usuario logueado
app.get('/api/tasks', (req, res) => {
  db.all('SELECT * FROM tasks WHERE user_id = ?', [req.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al obtener tareas' });
    const tasks = rows.map(row => ({ id: row.id, text: row.text, completed: !!row.completed }));
    res.json(tasks);
  });
});

// Crear nueva tarea
app.post('/api/tasks', (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Texto requerido' });
  }

  db.run('INSERT INTO tasks (text, completed, user_id) VALUES (?, ?, ?)', [text.trim(), 0, req.userId], function (err) {
    if (err) return res.status(500).json({ error: 'Error al crear tarea' });
    res.json({ id: this.lastID, text: text.trim(), completed: false });
  });
});

// Actualizar tarea
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { text, completed } = req.body;
  db.run('UPDATE tasks SET text = ?, completed = ? WHERE id = ? AND user_id = ?',
    [text, completed ? 1 : 0, id, req.userId],
    function (err) {
      if (err) return res.status(500).json({ error: 'Error al actualizar tarea' });
      res.json({ id: parseInt(id), text, completed });
    });
});

// Eliminar tarea
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, req.userId], function (err) {
    if (err) return res.status(500).json({ error: 'Error al eliminar tarea' });
    res.status(204).send();
  });
});

// Servir index.html por defecto
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Manejar rutas no encontradas (Error 404)
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
