const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

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

// Bulk Sync API (for smooth transition from localStorage)
app.get('/api/sync', async (req, res) => {
  const reqs = await Requisition.findAll();
  const cands = await Candidate.findAll();
  const logs = await Worklog.findAll();
  res.json({ requisitions: reqs, candidates: cands, worklogs: logs });
});

app.post('/api/sync', async (req, res) => {
  try {
    const { requisitions, candidates, worklogs } = req.body;
    
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
    
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Sync DB and Start Server
const PORT = process.env.PORT || 3000;
sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced');
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to sync database:', err);
});
