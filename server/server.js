const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET_KEY = "my_super_secret_recruitment_key"; // In production, use process.env

const app = express();
app.use(cors());
app.use(express.json());

// Setup uploads folder
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
  }
});
const upload = multer({ storage: storage });


// Initialize SQLite database using Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite')
});

// Define Models with JSON data storage to support flexible frontend schemas
const Requisition = sequelize.define('Requisition', {
  reqId: { type: DataTypes.STRING, unique: true, allowNull: false },
  data: { type: DataTypes.JSON, allowNull: false }
});

const Candidate = sequelize.define('Candidate', {
  canId: { type: DataTypes.STRING, unique: true, allowNull: false },
  reqId: { type: DataTypes.STRING },
  data: { type: DataTypes.JSON, allowNull: false }
});

const Worklog = sequelize.define('Worklog', {
  logId: { type: DataTypes.STRING, unique: true },
  reqId: { type: DataTypes.STRING },
  data: { type: DataTypes.JSON, allowNull: false }
});

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: 'Recruiter' }
});

const Reminder = sequelize.define('Reminder', {
  remId: { type: DataTypes.STRING, unique: true, allowNull: false },
  user: { type: DataTypes.STRING, allowNull: false },
  data: { type: DataTypes.JSON, allowNull: false }
});

// Authentication Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Failed to authenticate token' });
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.username = decoded.username;
    next();
  });
};

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Access denied: insufficient permissions' });
    }
    next();
  };
};

// Basic API Routes
app.get('/api/requisitions', verifyToken, async (req, res) => {
  const reqs = await Requisition.findAll();
  res.json(reqs.map(r => r.data));
});

app.post('/api/requisitions', verifyToken, async (req, res) => {
  try {
    const newReq = await Requisition.create({ reqId: req.body.id, data: req.body });
    res.json(newReq.data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/requisitions/:id', verifyToken, async (req, res) => {
  try {
    await Requisition.update({ data: req.body }, { where: { reqId: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/requisitions/:id', verifyToken, requireRole(['Admin', 'Management']), async (req, res) => {
  try {
    await Requisition.destroy({ where: { reqId: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/candidates', verifyToken, async (req, res) => {
  const candidates = await Candidate.findAll();
  res.json(candidates.map(c => c.data));
});

app.post('/api/candidates', verifyToken, async (req, res) => {
  try {
    const newCand = await Candidate.create({ canId: req.body.id, reqId: req.body.reqId, data: req.body });
    res.json(newCand.data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/candidates/:id', verifyToken, async (req, res) => {
  try {
    await Candidate.update({ data: req.body, reqId: req.body.reqId }, { where: { canId: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/candidates/:id', verifyToken, requireRole(['Admin', 'Management']), async (req, res) => {
  try {
    await Candidate.destroy({ where: { canId: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/worklogs', verifyToken, async (req, res) => {
  const logs = await Worklog.findAll();
  res.json(logs.map(l => l.data));
});

app.post('/api/worklogs', verifyToken, async (req, res) => {
  try {
    // Generate a unique ID for worklogs if they don't have one
    const logId = req.body.id || 'WL-' + Date.now();
    req.body.id = logId;
    const log = await Worklog.create({ logId: logId, reqId: req.body.reqId, data: req.body });
    res.json(log.data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/worklogs/:id', verifyToken, requireRole(['Admin', 'Management']), async (req, res) => {
  try {
    await Worklog.destroy({ where: { logId: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/reminders', verifyToken, async (req, res) => {
  const rems = await Reminder.findAll();
  res.json(rems.map(r => r.data));
});

app.post('/api/reminders', verifyToken, async (req, res) => {
  try {
    const remId = req.body.id || 'REM-' + Date.now();
    req.body.id = remId;
    const r = await Reminder.create({ remId: remId, user: req.body.user || 'system', data: req.body });
    res.json(r.data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/reminders/:id', verifyToken, async (req, res) => {
  try {
    await Reminder.destroy({ where: { remId: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// File Upload API
app.post('/api/upload', upload.single('resume'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the public URL for the file
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// Authentication API
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username } });
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  
  const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, SECRET_KEY, { expiresIn: '24h' });
  res.json({ token, role: user.role, username: user.username });
});


app.get('/api/sync', verifyToken, async (req, res) => {
  const reqs = await Requisition.findAll();
  const cands = await Candidate.findAll();
  const logs = await Worklog.findAll();
  const rems = await Reminder.findAll();
  res.json({ 
    requisitions: reqs.map(r => r.data), 
    candidates: cands.map(c => c.data), 
    worklogs: logs.map(l => l.data), 
    reminders: rems.map(r => r.data) 
  });
});

app.post('/api/sync', verifyToken, async (req, res) => {
  try {
    const { requisitions, candidates, worklogs, reminders } = req.body;
    
    if (requisitions) {
      await Requisition.destroy({ where: {} });
      await Requisition.bulkCreate(requisitions.map(r => ({ reqId: r.id, data: r })));
    }
    if (candidates) {
      await Candidate.destroy({ where: {} });
      await Candidate.bulkCreate(candidates.map(c => ({ canId: c.id, reqId: c.reqId, data: c })));
    }
    if (worklogs) {
      await Worklog.destroy({ where: {} });
      await Worklog.bulkCreate(worklogs.map(l => {
         const lid = l.id || 'WL-' + Math.random().toString(36).substr(2, 9);
         l.id = lid;
         return { logId: lid, reqId: l.reqId, data: l };
      }));
    }
    if (reminders) {
      await Reminder.destroy({ where: {} });
      await Reminder.bulkCreate(reminders.map(r => {
         const rid = r.id || 'REM-' + Math.random().toString(36).substr(2, 9);
         r.id = rid;
         return { remId: rid, user: r.user || 'system', data: r };
      }));
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    const newUser = await User.create({
      username,
      password: bcrypt.hashSync(password, 10),
      role: role || 'Recruiter'
    });
    res.json({ success: true, user: { id: newUser.id, username: newUser.username, role: newUser.role } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Sync DB and Start Server
const PORT = process.env.PORT || 3000;
sequelize.sync({ alter: true }).then(async () => {
  console.log('Database synced');
  
  // Seed initial admin user if none exists
  const adminCount = await User.count();
  if (adminCount === 0) {
    await User.create({
      username: 'admin',
      password: bcrypt.hashSync('admin123', 10),
      role: 'Admin'
    });
    console.log('Created default admin user (admin / admin123)');
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to sync database:', err);
});

