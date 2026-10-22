import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { categories, createInitialStore, products, suppliers } from './seed.js';

const directory = path.dirname(fileURLToPath(importikbo.meta.url));
const dataDirectory = process.env.VERCEL === '1' ? path.join('/tmp', 'meridian-trade') : path.join(directory, 'data');
const storePath = path.join(dataDirectory, 'store.json');
const jwtSecret = process.env.JWT_SECRET || 'local-development-secret-change-this';
const app = express();
const port = Number(process.env.PORT || 3001);
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
mkdirSync(dataDirectory, { recursive: true });
if (!existsSync(storePath)) writeFileSync(storePath, JSON.stringify(createInitialStore(), null, 2));
const readStore = () => JSON.parse(readFileSync(storePath, 'utf8'));
const writeStore = (store) => writeFileSync(storePath, JSON.stringify(store, null, 2));
const emailIsValid = (email) => /^\S+@\S+\.\S+$/.test(email);
const makeToken = (user) => jwt.sign({ id: user.id, email: user.email, name: user.name }, jwtSecret, { expiresIn: '7d' });

function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Sign in to continue.' });
  try { req.user = jwt.verify(token, jwtSecret); next(); }
  catch { return res.status(401).json({ error: 'Your session has expired. Please sign in again.' }); }
}

app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin === allowedOrigin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'Meridian Trade API' }));
app.get('/api/categories', (req, res) => res.json(categories));
app.get('/api/products', (req, res) => {
  const query = String(req.query.q || '').trim().toLowerCase();
  const category = String(req.query.category || '').trim();
  const sort = String(req.query.sort || 'featured');
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  let items = products.filter((product) => {
    const categoryMatches = !category || product.category === category;
    const searchable = `${product.name} ${product.category} ${product.supplier} ${product.country} ${product.summary}`.toLowerCase();
    return categoryMatches && (!query || searchable.includes(query));
  });
  if (sort === 'price-asc') items = [...items].sort((a, b) => a.priceFrom - b.priceFrom);
  if (sort === 'price-desc') items = [...items].sort((a, b) => b.priceFrom - a.priceFrom);
  res.json({ items: items.slice(0, limit), total: items.length });
});
app.get('/api/products/:id', (req, res) => {
  const product = products.find((item) => item.id === req.params.id);
  return product ? res.json(product) : res.status(404).json({ error: 'Product not found.' });
});
app.get('/api/suppliers', (req, res) => {
  const query = String(req.query.q || '').trim().toLowerCase();
  const items = suppliers.filter((item) => `${item.name} ${item.category} ${item.country} ${item.city}`.toLowerCase().includes(query));
  res.json({ items, total: items.length });
});
app.get('/api/suppliers/:id', (req, res) => {
  const supplier = suppliers.find((item) => item.id === req.params.id);
  return supplier ? res.json({ ...supplier, products: products.filter((item) => item.supplierId === supplier.id) }) : res.status(404).json({ error: 'Supplier not found.' });
});

app.post('/api/quotes', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const requested = Array.isArray(req.body.items) ? req.body.items : [{ productId: req.body.productId, quantity: req.body.quantity }];
  if (!emailIsValid(email)) return res.status(400).json({ error: 'Enter a valid business email.' });
  if (!requested.length || requested.some((line) => !products.some((item) => item.id === line.productId) || !Number.isInteger(Number(line.quantity)) || Number(line.quantity) < 1)) return res.status(400).json({ error: 'Choose valid products and quantities.' });
  const store = readStore();
  const quote = {
    id: `MTQ-${Date.now().toString().slice(-8)}`, email,
    message: String(req.body.message || '').trim().slice(0, 2000), status: 'Sent to suppliers', createdAt: new Date().toISOString(),
    items: requested.map((line) => { const product = products.find((item) => item.id === line.productId); return { productId: product.id, productName: product.name, supplier: product.supplier, quantity: Number(line.quantity) }; }),
  };
  store.quotes.unshift(quote); writeStore(store); res.status(201).json({ quote });
});
app.post('/api/messages', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const message = String(req.body.message || '').trim();
  const supplier = suppliers.find((item) => item.id === req.body.supplierId);
  if (!supplier) return res.status(404).json({ error: 'Supplier not found.' });
  if (!emailIsValid(email) || message.length < 3) return res.status(400).json({ error: 'Enter a valid email and message.' });
  const store = readStore();
  const conversation = { id: `MSG-${Date.now().toString().slice(-8)}`, email, supplierId: supplier.id, supplier: supplier.name, productId: req.body.productId || null, message: message.slice(0, 2000), createdAt: new Date().toISOString() };
  store.messages.unshift(conversation); writeStore(store); res.status(201).json({ conversation: { id: conversation.id, status: 'sent' } });
});
app.post('/api/supplier-leads', (req, res) => {
  const company = String(req.body.company || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  if (company.length < 2 || !emailIsValid(email)) return res.status(400).json({ error: 'Enter your company name and a valid business email.' });
  const store = readStore();
  const lead = { id: `LEAD-${Date.now().toString().slice(-8)}`, company: company.slice(0, 120), email, createdAt: new Date().toISOString() };
  store.supplierLeads.unshift(lead); writeStore(store); res.status(201).json({ lead: { id: lead.id, status: 'received' } });
});
app.post('/api/orders/track', (req, res) => {
  const number = String(req.body.trackingNumber || '').trim().toUpperCase();
  const order = readStore().orders.find((item) => item.trackingNumber.toUpperCase() === number);
  return order ? res.json({ order }) : res.status(404).json({ error: 'No order was found for that number.' });
});
app.post('/api/auth/register', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (name.length < 2 || !emailIsValid(email) || password.length < 8) return res.status(400).json({ error: 'Add your name, a valid email, and a password with at least 8 characters.' });
  const store = readStore();
  if (store.users.some((user) => user.email === email)) return res.status(409).json({ error: 'An account with that email already exists.' });
  const user = { id: `USR-${Date.now()}`, name: name.slice(0, 100), email, passwordHash: await bcrypt.hash(password, 12), createdAt: new Date().toISOString() };
  store.users.push(user); writeStore(store); res.status(201).json({ token: makeToken(user), user: { id: user.id, name: user.name, email: user.email } });
});
app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = readStore().users.find((item) => item.email === email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Email or password is incorrect.' });
  res.json({ token: makeToken(user), user: { id: user.id, name: user.name, email: user.email } });
});
app.get('/api/auth/me', authenticate, (req, res) => {
  const user = readStore().users.find((item) => item.id === req.user.id);
  return user ? res.json({ user: { id: user.id, name: user.name, email: user.email } }) : res.status(404).json({ error: 'Account not found.' });
});

const builtClient = path.resolve(directory, '../client/dist');
app.use(express.static(builtClient));
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API endpoint not found.' });
  res.sendFile(path.join(builtClient, 'index.html'), (error) => { if (error) res.status(404).send('Build the client with npm run build first.'); });
});
if (process.env.VERCEL !== '1') app.listen(port, () => console.log(`Meridian API listening on http://localhost:${port}`));

export default app;
