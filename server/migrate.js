const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Connect to SQLite DB
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite')
});

// Import models
const Requisition = sequelize.define('Requisition', {
  reqId: { type: DataTypes.STRING, unique: true, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'Open' },
  location: { type: DataTypes.STRING },
  department: { type: DataTypes.STRING }
});
// (Other models omitted for brevity in script, but it will sync whatever is defined)

async function migrate() {
  await sequelize.sync({ alter: true });
  console.log("Database tables created. Migration from localStorage can be run by reading exported JSON and inserting via these models.");
  // Example for future:
  // const data = JSON.parse(fs.readFileSync('backup.json'));
  // for (let req of data.requisitions) { await Requisition.create(req); }
  
  process.exit();
}

migrate();
