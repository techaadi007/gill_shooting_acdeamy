require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false }) : null;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json({ limit: '20kb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 80, standardHeaders: true, legacyHeaders: false }));
app.use(express.static(path.join(__dirname, '..')));

const clean = value => typeof value === 'string' ? value.trim().replace(/[<>]/g, '') : '';
const emailPattern = /^\S+@\S+\.\S+$/;
const phonePattern = /^[0-9+ ()-]{10,20}$/;
function requireFields(body, fields) {
  const data = Object.fromEntries(Object.entries(body || {}).map(([key, value]) => [key, clean(value)]));
  for (const field of fields) if (!data[field]) return [null, `${field} is required`];
  if (!emailPattern.test(data.email)) return [null, 'Enter a valid email'];
  if (!phonePattern.test(data.phone)) return [null, 'Enter a valid phone number'];
  return [data, null];
}
async function query(text, values) {
  if (!pool) throw new Error('DATABASE_URL is not configured');
  return pool.query(text, values);
}

app.post('/api/admissions', async (req, res, next) => {
  const [data, error] = requireFields(req.body, ['name', 'phone', 'email']);
  if (error) return res.status(400).json({ error });
  try {
    await query('insert into admissions (full_name, phone, email, preferred_program, message) values ($1, $2, $3, $4, $5)', [data.name, data.phone, data.email, data.program || null, data.message || null]);
    return res.status(201).json({ message: 'Admission enquiry received' });
  } catch (err) { return next(err); }
});
app.post('/api/contact', async (req, res, next) => {
  const [data, error] = requireFields(req.body, ['name', 'phone', 'email', 'message']);
  if (error) return res.status(400).json({ error });
  try {
    await query('insert into contact_messages (name, phone, email, subject, message) values ($1, $2, $3, $4, $5)', [data.name, data.phone, data.email, data.subject || null, data.message]);
    return res.status(201).json({ message: 'Message received' });
  } catch (err) { return next(err); }
});
for (const [route, table] of Object.entries({ programs: 'programs', coaches: 'coaches', gallery: 'gallery', news: 'news', testimonials: 'testimonials', achievements: 'achievements', facilities: 'facilities' })) {
  app.get(`/api/${route}`, async (_, res, next) => {
    try { res.json((await query(`select * from ${table} order by sort_order asc, created_at desc`)).rows); }
    catch (err) { next(err); }
  });
}
app.use((err, _, res, __) => { console.error(err.message); res.status(500).json({ error: 'Unable to process this request right now.' }); });
app.use((_, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));
app.listen(port, () => console.log(`Gill Academy running at http://localhost:${port}`));
