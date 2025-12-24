const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
// security and helpers
require('dotenv').config();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const validator = require('validator');

const DATA_FILE = path.join(__dirname, 'data.json');
// read secret from env; fallback only for development
const JWT_SECRET = process.env.JWT_SECRET || 'troque_esta_chave_por_uma_secreta_em_producao';

const app = express();
// Basic security headers
app.use(helmet());
// allow only our frontend during development
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Rate limiter for auth endpoints to reduce brute-force attempts
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

app.use(express.static(path.join(__dirname, '..', 'frontend'), { index: false }));

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOADS_DIR));

const multer = require('multer');
// limit uploads: accept only image mimetypes and small files
const storage = multer.diskStorage({
	destination: function (req, file, cb) { cb(null, UPLOADS_DIR); },
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname) || '';
		cb(null, Date.now() + '-' + Math.round(Math.random()*1e9) + ext);
	}
});
const upload = multer({
	storage,
	limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
	fileFilter: function (req, file, cb) {
		if (!file.mimetype.startsWith('image/')) return cb(new Error('Apenas imagens são permitidas'));
		cb(null, true);
	}
});

function loadData() {
	try {
		const raw = fs.readFileSync(DATA_FILE, 'utf8');
		return JSON.parse(raw);
	} catch (e) {
		return { users: [], clients: [] };
	}
}

function saveData(data) {
	fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.post('/api/register', authLimiter, async (req, res) => {
	// sanitize and validate input
	let { username, password } = req.body || {};
	username = typeof username === 'string' ? username.trim() : '';
	password = typeof password === 'string' ? password : '';
	if (!username || !password) return res.status(400).json({ error: 'username e password são obrigatórios' });
	if (!validator.isLength(username, { min: 4 })) return res.status(400).json({ error: 'username precisa ter pelo menos 4 caracteres' });
	if (!validator.isLength(password, { min: 4 })) return res.status(400).json({ error: 'password precisa ter pelo menos 4 caracteres' });
	const passHasLetter = /[A-Za-zÀ-ú]/.test(password);
	const passHasNumber = /\d/.test(password);
	if (!passHasLetter || !passHasNumber) return res.status(400).json({ error: 'password deve conter letras e números' });

	const data = loadData();
	if (data.users.find(u => u.username === username)) return res.status(400).json({ error: 'Usuário já existe' });

	const hash = await bcrypt.hash(password, 10);
	const user = { id: uuidv4(), username, passwordHash: hash };
	data.users.push(user);
	saveData(data);
	res.json({ success: true });
});

app.post('/api/login', authLimiter, async (req, res) => {
	const { username, password } = req.body || {};
	if (!username || !password) return res.status(400).json({ error: 'username e password são obrigatórios' });

	const data = loadData();
	const user = data.users.find(u => u.username === username);
	if (!user) return res.status(400).json({ error: 'Usuário ou senha inválidos' });

	const ok = await bcrypt.compare(password, user.passwordHash);
	if (!ok) return res.status(400).json({ error: 'Usuário ou senha inválidos' });

	const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '8h' });
	res.json({ token });
});

function authenticateToken(req, res, next) {
	const auth = req.headers['authorization'];
	if (!auth) return res.status(401).json({ error: 'Token não fornecido' });
	const parts = auth.split(' ');
	if (parts.length !== 2) return res.status(401).json({ error: 'Token inválido' });

	const token = parts[1];
	jwt.verify(token, JWT_SECRET, (err, user) => {
		if (err) return res.status(403).json({ error: 'Token inválido' });
		req.user = user;
		next();
	});
}

app.get('/api/clients', authenticateToken, (req, res) => {
	const q = (req.query.q || '').toLowerCase();
	const field = req.query.field || 'any';
	const data = loadData();
	let userClients = data.clients.filter(c => c.userId === req.user.userId);
	if (q) {
		userClients = userClients.filter(c => {
			if (field === 'name') return (c.name||'').toLowerCase().includes(q);
			if (field === 'email') return (c.email||'').toLowerCase().includes(q);
			if (field === 'phone') return (c.phone||'').toLowerCase().includes(q);
			return ((c.name||'') + ' ' + (c.email||'') + ' ' + (c.phone||'')).toLowerCase().includes(q);
		});
	}
	res.json(userClients);
});

app.post('/api/clients', authenticateToken, (req, res) => {
	const { name, email, phone } = req.body;
	if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

	const data = loadData();
	const client = { id: uuidv4(), userId: req.user.userId, name, email: email || '', phone: phone || '' };
	data.clients.push(client);
	saveData(data);
	res.json(client);
});

app.post('/api/clients/:id/photo', authenticateToken, upload.single('photo'), (req, res) => {
	const id = req.params.id;
	const data = loadData();
	const client = data.clients.find(c => c.id === id);
	if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });
	if (client.userId !== req.user.userId) return res.status(403).json({ error: 'Não autorizado' });
	if (!req.file) return res.status(400).json({ error: 'Arquivo não recebido' });
	client.photo = `/uploads/${req.file.filename}`;
	saveData(data);
	res.json({ success: true, photo: client.photo });
});

app.put('/api/clients/:id', authenticateToken, (req, res) => {
	const id = req.params.id;
	const { name, email, phone } = req.body;
	const data = loadData();
	const client = data.clients.find(c => c.id === id);
	if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });
	if (client.userId !== req.user.userId) return res.status(403).json({ error: 'Não autorizado' });
	if (name) client.name = name;
	if (email !== undefined) client.email = email;
	if (phone !== undefined) client.phone = phone;
	saveData(data);
	res.json(client);
});

app.delete('/api/clients/:id', authenticateToken, (req, res) => {
	const id = req.params.id;
	const data = loadData();
	const idx = data.clients.findIndex(c => c.id === id);
	if (idx === -1) return res.status(404).json({ error: 'Cliente não encontrado' });
	if (data.clients[idx].userId !== req.user.userId) return res.status(403).json({ error: 'Não autorizado' });
	const removed = data.clients.splice(idx, 1)[0];
	saveData(data);
	res.json({ success: true, removed });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server rodando na porta ${PORT}`);
});
