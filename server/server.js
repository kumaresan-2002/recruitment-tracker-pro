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

// Define Models
const Requisition = sequelize.define('Requisition', {
  reqId: { type: DataTypes.STRING, unique: true, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'Open' },
  location: { type: DataTypes.STRING },
  department: { type: DataTypes.STRING }
});

const Candidate = sequelize.define('Candidate', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: 'New' },
  reqId: { type: DataTypes.STRING }
});

const Worklog = sequelize.define('Worklog', {
  date: { type: DataTypes.DATEONLY, allowNull: false },
  reqId: { type: DataTypes.STRING },
  recruiter: { type: DataTypes.STRING },
  desc: { type: DataTypes.STRING },
  sourced: { type: DataTypes.INTEGER, defaultValue: 0 },
  screened: { type: DataTypes.INTEGER, defaultValue: 0 },
  submitted: { type: DataTypes.INTEGER, defaultValue: 0 }
});

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: 'Recruiter' }
});

const Reminder = sequelize.define('Reminder', {
  date: { type: DataTypes.DATEONLY, allowNull: false },
  text: { type: DataTypes.STRING, allowNull: false },
  user: { type: DataTypes.STRING, allowNull: false },
  targetId: { type: DataTypes.STRING }
});

// Basic API Routes
app.get('/api/requisitions', async (req, res) => {
  const reqs = await Requisition.findAll();
  res.json(reqs);
});

app.post('/api/requisitions', async (req, res) => {
  try {
    const newReq = await Requisition.create(req.body);
    res.json(newReq);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/candidates', async (req, res) => {
  const candidates = await Candidate.findAll();
  res.json(candidates);
});

app.post('/api/candidates', async (req, res) => {
  try {
    const newCand = await Candidate.create(req.body);
    res.json(newCand);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/worklogs', async (req, res) => {
  const logs = await Worklog.findAll();
  res.json(logs);
});

app.post('/api/worklogs', async (req, res) => {
  try {
    const log = await Worklog.create(req.body);
    res.json(log);
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

// Bulk Sync API (for smooth transition from localStorage)
app.get('/api/sync', verifyToken, async (req, res) => {
  const reqs = await Requisition.findAll();
  const cands = await Candidate.findAll();
  const logs = await Worklog.findAll();
  const rems = await Reminder.findAll();
  res.json({ requisitions: reqs, candidates: cands, worklogs: logs, reminders: rems });
});

app.post('/api/sync', verifyToken, async (req, res) => {
  try {
    const { requisitions, candidates, worklogs, reminders } = req.body;
    
    if (requisitions) {
      await Requisition.destroy({ where: {} });
      await Requisition.bulkCreate(requisitions);
    }
    if (candidates) {
      await Candidate.destroy({ where: {} });
      await Candidate.bulkCreate(candidates);
    }
    if (worklogs) {
      await Worklog.destroy({ where: {} });
      await Worklog.bulkCreate(worklogs);
    }
    if (reminders) {
      await Reminder.destroy({ where: {} });
      await Reminder.bulkCreate(reminders);
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
