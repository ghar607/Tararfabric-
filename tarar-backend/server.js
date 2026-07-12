const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 8080;
const DB_FILE = path.join(__dirname, 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/', express.static(path.join(__dirname, 'public')));

// ---------- DB helpers ----------
function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ---------- Multer (image upload) ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});
const upload = multer({ storage });

// ---------- Auth middleware ----------
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const db = readDB();
  const valid = db.sessions.includes(token);
  if (!token || !valid) {
    return res.status(401).json({ error: 'Unauthorized. Please login again.' });
  }
  next();
}

// ================= ADMIN AUTH =================
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  if (username === db.admin.username && password === db.admin.password) {
    const token = crypto.randomBytes(24).toString('hex');
    db.sessions.push(token);
    writeDB(db);
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid username or password' });
});

app.post('/api/admin/logout', requireAuth, (req, res) => {
  const token = req.headers.authorization.replace('Bearer ', '').trim();
  const db = readDB();
  db.sessions = db.sessions.filter(s => s !== token);
  writeDB(db);
  res.json({ success: true });
});

app.post('/api/admin/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const db = readDB();
  if (currentPassword !== db.admin.password) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  db.admin.password = newPassword;
  writeDB(db);
  res.json({ success: true });
});

// ================= SETTINGS =================
app.get('/api/settings', (req, res) => {
  res.json(readDB().settings);
});
app.put('/api/admin/settings', requireAuth, (req, res) => {
  const db = readDB();
  db.settings = { ...db.settings, ...req.body };
  writeDB(db);
  res.json(db.settings);
});

// ================= CATEGORIES =================
app.get('/api/categories', (req, res) => {
  res.json(readDB().categories);
});
app.post('/api/admin/categories', requireAuth, (req, res) => {
  const db = readDB();
  const cat = { id: 'cat-' + uuidv4(), name: req.body.name };
  db.categories.push(cat);
  writeDB(db);
  res.json(cat);
});
app.put('/api/admin/categories/:id', requireAuth, (req, res) => {
  const db = readDB();
  const cat = db.categories.find(c => c.id === req.params.id);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  cat.name = req.body.name;
  writeDB(db);
  res.json(cat);
});
app.delete('/api/admin/categories/:id', requireAuth, (req, res) => {
  const db = readDB();
  db.categories = db.categories.filter(c => c.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// ================= PRODUCTS =================
app.get('/api/products', (req, res) => {
  const db = readDB();
  let list = db.products;
  const { category, featured, search } = req.query;
  if (category) list = list.filter(p => p.category === category);
  if (featured) list = list.filter(p => p.featured);
  if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  res.json(list);
});

app.get('/api/products/:id', (req, res) => {
  const db = readDB();
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

app.post('/api/admin/products', requireAuth, upload.array('images', 6), (req, res) => {
  const db = readDB();
  const body = req.body;
  const newImages = (req.files || []).map(f => '/uploads/' + f.filename);
  const product = {
    id: 'prod-' + uuidv4(),
    name: body.name,
    category: body.category,
    price: Number(body.price) || 0,
    discountPrice: Number(body.discountPrice) || 0,
    sizes: body.sizes ? JSON.parse(body.sizes) : [],
    colors: body.colors ? JSON.parse(body.colors) : [],
    stock: Number(body.stock) || 0,
    status: Number(body.stock) > 0 ? 'in_stock' : 'out_of_stock',
    featured: body.featured === 'true' || body.featured === true,
    description: body.description || '',
    fabric: body.fabric || '',
    productType: body.productType || 'clothing',
    season: body.season || 'All Season',
    volume: body.volume || '',
    concentration: body.concentration || '',
    notes: body.notes || '',
    strapMaterial: body.strapMaterial || '',
    movement: body.movement || '',
    images: newImages,
    rating: 0,
    reviewsCount: 0
  };
  db.products.push(product);
  writeDB(db);
  res.json(product);
});

app.put('/api/admin/products/:id', requireAuth, upload.array('images', 6), (req, res) => {
  const db = readDB();
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const body = req.body;

  if (body.name !== undefined) product.name = body.name;
  if (body.category !== undefined) product.category = body.category;
  if (body.price !== undefined) product.price = Number(body.price);
  if (body.discountPrice !== undefined) product.discountPrice = Number(body.discountPrice);
  if (body.sizes !== undefined) product.sizes = JSON.parse(body.sizes);
  if (body.colors !== undefined) product.colors = JSON.parse(body.colors);
  if (body.stock !== undefined) {
    product.stock = Number(body.stock);
    product.status = product.stock > 0 ? 'in_stock' : 'out_of_stock';
  }
  if (body.featured !== undefined) product.featured = body.featured === 'true' || body.featured === true;
  if (body.description !== undefined) product.description = body.description;
  if (body.fabric !== undefined) product.fabric = body.fabric;

  if (body.keepImages !== undefined) {
    try { product.images = JSON.parse(body.keepImages); } catch (e) {}
  }
  const newImages = (req.files || []).map(f => '/uploads/' + f.filename);
  product.images = [...(product.images || []), ...newImages];

  writeDB(db);
  res.json(product);
});

app.delete('/api/admin/products/:id', requireAuth, (req, res) => {
  const db = readDB();
  db.products = db.products.filter(p => p.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// ================= ORDERS =================
// Customer places order (public, no auth)
app.post('/api/orders', (req, res) => {
  const db = readDB();
  const body = req.body;
  const order = {
    id: 'TRR-' + Math.floor(1000 + Math.random() * 9000),
    customer: {
      name: body.customer?.name || '',
      phone: body.customer?.phone || '',
      email: body.customer?.email || '',
      address: body.customer?.address || '',
      city: body.customer?.city || '',
      province: body.customer?.province || ''
    },
    items: body.items || [],
    subtotal: body.subtotal || 0,
    shipping: body.shipping || 0,
    total: body.total || 0,
    paymentMethod: body.paymentMethod || 'COD',
    transactionId: body.transactionId || '',
    paymentVerified: body.paymentMethod === 'COD' ? null : false,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  db.orders.unshift(order);
  writeDB(db);
  res.json(order);
});

app.get('/api/admin/orders', requireAuth, (req, res) => {
  const db = readDB();
  res.json(db.orders);
});

app.get('/api/admin/orders/:id', requireAuth, (req, res) => {
  const db = readDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// Update order: status, transaction id, verify payment (green/red tick)
app.put('/api/admin/orders/:id', requireAuth, (req, res) => {
  const db = readDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const { status, transactionId, paymentVerified } = req.body;
  if (status !== undefined) order.status = status;
  if (transactionId !== undefined) order.transactionId = transactionId;
  if (paymentVerified !== undefined) order.paymentVerified = paymentVerified;

  writeDB(db);
  res.json(order);
});

app.delete('/api/admin/orders/:id', requireAuth, (req, res) => {
  const db = readDB();
  db.orders = db.orders.filter(o => o.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// ================= DASHBOARD =================
app.get('/api/admin/dashboard', requireAuth, (req, res) => {
  const db = readDB();
  const totalRevenue = db.orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const lowStock = db.products.filter(p => p.stock <= 5);
  res.json({
    totalOrders: db.orders.length,
    pendingOrders: db.orders.filter(o => o.status === 'pending').length,
    unverifiedPayments: db.orders.filter(o => o.paymentVerified === false).length,
    totalRevenue,
    totalProducts: db.products.length,
    totalCustomers: new Set(db.orders.map(o => o.customer.phone)).size,
    lowStock
  });
});

app.listen(PORT, () => {
  console.log('==========================================');
  console.log('  Libas Menswear Backend Running!');
  console.log('  Store API:   http://127.0.0.1:' + PORT + '/api');
  console.log('  Admin Panel: http://127.0.0.1:' + PORT + '/admin/login.html');
  console.log('  Default Login -> username: admin | password: tarar123');
  console.log('==========================================');
});
