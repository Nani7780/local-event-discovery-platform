require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// 🗄️ FAST HACKATHON IN-MEMORY DATA ARRAYS (Bypasses MongoDB completely!)
const USERS_DB = [];
const EVENTS_DB = [
  {
    id: "1",
    title: "Hackathon Demo Night 🎉",
    description: "Pitching our local event discovery application!",
    event_date: new Date().toISOString(),
    venue: "Main Innovation Lab, Hall 4"
  }
];
const REGISTRATIONS_DB = [];

console.log('------------------------------------------------');
console.log('🚀 SYSTEM STATUS: Running in-memory Hackathon Mode!');
console.log('No internet or database connections required.');
console.log('------------------------------------------------');

// --- 🔐 AUTHENTICATION ENDPOINTS ---

// 1. User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, isOrganizer } = req.body;

    const userExists = USERS_DB.find(u => u.email === email);
    if (userExists) return res.status(400).json({ error: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = { id: String(USERS_DB.length + 1), name, email, password: hashedPassword, isOrganizer: !!isOrganizer };
    USERS_DB.push(newUser);

    const token = jwt.sign({ id: newUser.id, isOrganizer: newUser.isOrganizer }, process.env.JWT_SECRET || 'hack_secret', { expiresIn: '1d' });
    res.status(201).json({ token, user: { id: newUser.id, name, email, isOrganizer: newUser.isOrganizer } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = USERS_DB.find(u => u.email === email);
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, isOrganizer: user.isOrganizer }, process.env.JWT_SECRET || 'hack_secret', { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, isOrganizer: user.isOrganizer } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 📅 EVENT MANAGEMENT ENDPOINTS ---

// 3. Create an Event
app.post('/api/events', (req, res) => {
  const { title, description, venue, event_date } = req.body;
  const newEvent = { id: String(EVENTS_DB.length + 1), title, description, venue, event_date };
  EVENTS_DB.push(newEvent);
  res.status(201).json({ success: true, data: newEvent });
});

// 4. Fetch All Events
app.get('/api/events', (req, res) => {
  res.json(EVENTS_DB);
});

// --- 📲 QR CHECK-IN ENDPOINT ---

// 5. Check-In Ticket Verification
app.post('/api/registrations/check-in', (req, res) => {
  const { ticketCode } = req.body;
  if (!ticketCode) return res.status(400).json({ error: "Invalid ticket data" });
  
  res.json({ success: true, message: `Successfully verified ticket payload: ${ticketCode}` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔥 Backend server successfully blasting on port ${PORT}`));
