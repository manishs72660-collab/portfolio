const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const blogRoutes = require('./routes/blogRoutes');
const profileRoutes = require('./routes/profileRoutes');
const contactRoutes = require('./routes/contactRoutes');
const statsRoutes = require('./routes/statsRoutes');
const ragRoutes = require('./routes/ragRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const frontendOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://portfolio-eta-drab-90.vercel.app',
  ...(process.env.FRONTEND_URL || '').split(','),
]
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.get('Origin');

  if (!origin) return next();
  if (!frontendOrigins.includes(origin.replace(/\/+$/, ''))) {
    return res.status(403).json({ message: 'Origin not allowed' });
  }

  res.vary('Origin');
  res.set('Access-Control-Allow-Origin', origin);
  res.set('Access-Control-Allow-Credentials', 'true');
  res.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.json({ message: 'Portfolio API is running' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/rag', ragRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
