// store.js - connects storefront pages to the live product/category API

async function apiGet(path) {
  try {
    const res = await fetch('/api' + path);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('API error:', e);
    return null;
  }
}

function money(n) {
  n = Number(n) || 0;
  return 'Rs. ' + n.toLocaleString('en-PK');
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function starsHTML(rating) {
  const full = Math.round(rating || 4);
  let s = '';
  for (let i = 0; i < 5; i++) s += i < full ? '\u2605' : '\u2606';
  return s;
}

function productCardHTML(p) {
  const img = (p.images && p.images[0]) ? ('<img src="' + p.images[0] + '" alt="' + p.name + '" style="width:100%;height:100%;object-fit:cover;">') : 'Product Image';
  const priceHTML = p.discountPrice
    ? ('<span class="price">' + money(p.discountPrice) + '</span> <span class="price-old">' + money(p.price) + '</span>')
    : ('<span class="price">' + money(p.price) + '</span>');
  const swatches = (p.colors || []).slice(0, 4).map(c => '<span class="swatch" style="background:' + c + ';"></span>').join('');
  return '' +
    '<div class="product-card">' +
      '<a href="product.html?id=' + p.id + '" class="product-thumb">' + img + '<span class="tag">' + (p.featured ? 'Featured' : 'New') + '</span>' +
        '<button class="wish-btn" onclick="event.preventDefault(); toggleWishlist(\'' + p.id + '\')">&#9825;</button>' +
      '</a>' +
      '<div class="product-info">' +
        '<span class="p-cat">' + (p.category || '') + '</span>' +
        '<h4><a href="product.html?id=' + p.id + '" style="color:inherit;text-decoration:none;">' + p.name + '</a></h4>' +
        '<div class="stars">' + starsHTML(p.rating) + ' <span style="color:#a39a8f;font-size:0.75rem;">(' + (p.reviewsCount || 0) + ')</span></div>' +
        '<div class="price-row">' + priceHTML + '</div>' +
        '<div class="swatches">' + swatches + '</div>' +
        '<div class="product-actions">' +
          '<button class="btn btn-primary add-cart-btn" onclick="addToCart(\'' + p.id + '\')">Add to Cart</button>' +
          '<a href="product.html?id=' + p.id + '" class="btn btn-outline">Buy Now</a>' +
        '</div>' +
      '</div>' +
    '</div>';
}

async function renderShopGrid() {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;
  const category = getParam('category');
  let url = '';
  if (category) url += '?category=' + encodeURIComponent(category);
  const products = await apiGet('/products' + url);
  if (!products || !products.length) {
    grid.innerHTML = '<p style="padding:40px;text-align:center;color:#a39a8f;">No products found.</p>';
    return;
  }
  grid.innerHTML = products.map(productCardHTML).join('');
}

async function renderHomeGrid() {
  const grid = document.getElementById('home-grid');
  if (!grid) return;
  const products = await apiGet('/products');
  if (!products || !products.length) return;
  let list = products.slice();
  list.sort((a, b) => {
    const aSeason = a.season === 'Autumn-Winter' ? 0 : 1;
    const bSeason = b.season === 'Autumn-Winter' ? 0 : 1;
    return aSeason - bSeason;
  });
  list = list.slice(0, 8);
  grid.innerHTML = list.map(productCardHTML).join('');
}

async function renderProductDetail() {
  const id = getParam('id');
  const wrap = document.querySelector('.pd-info');
  if (!id || !wrap) return;
  const p = await apiGet('/products/' + id);
  if (!p) return;

  const titleEl = wrap.querySelector('h1');
  if (titleEl) titleEl.textContent = p.name;

  const catEl = wrap.querySelector('.p-cat');
  if (catEl) catEl.textContent = (p.category || '') + ' \u00b7 SKU: ' + p.id;

  const priceRow = wrap.querySelector('.price-row');
  if (priceRow) {
    priceRow.innerHTML = p.discountPrice
      ? ('<span class="price">' + money(p.discountPrice) + '</span><span class="price-old">' + money(p.price) + '</span>')
      : ('<span class="price">' + money(p.price) + '</span>');
  }

  const descEl = wrap.querySelector('.pd-desc');
  if (descEl) descEl.textContent = p.description || '';

  const stockEl = wrap.querySelector('.stock-status');
  if (stockEl) stockEl.innerHTML = p.status === 'in_stock' ? '&#9679; In Stock \u2014 Ready to Ship' : '&#9679; Out of Stock';

  const galleryEl = document.querySelector('.pd-gallery-main');
  if (galleryEl && p.images && p.images[0]) {
    galleryEl.innerHTML = '<img src="' + p.images[0] + '" alt="' + p.name + '" style="width:100%;height:100%;object-fit:cover;">';
  }

  document.title = p.name + ' \u2014 Libas House';
  const crumb = document.querySelector('.breadcrumb');
  if (crumb) crumb.innerHTML = '<a href="index.html">Home</a> / <a href="shop.html">Shop</a> / ' + p.name;

  const addBtn = document.querySelector('.add-cart-btn');
  if (addBtn) addBtn.onclick = () => addToCart(p.id);
}

function getCart() {
  try { return JSON.parse(localStorage.getItem('libas_cart') || '[]'); } catch(e) { return []; }
}
function saveCart(cart) {
  localStorage.setItem('libas_cart', JSON.stringify(cart));
  updateCartBadge();
}
function addToCart(id, qty) {
  qty = qty || 1;
  const cart = getCart();
  const existing = cart.find(item => item.id === id);
  if (existing) existing.qty += qty;
  else cart.push({ id: id, qty: qty });
  saveCart(cart);
  if (typeof showToast === 'function') showToast('Added to cart');
}
function updateCartBadge() {
  const count = getCart().reduce((sum, i) => sum + i.qty, 0);
  document.querySelectorAll('a[href="cart.html"] .badge').forEach(b => b.textContent = count);
}

function getWishlist() {
  try { return JSON.parse(localStorage.getItem('libas_wishlist') || '[]'); } catch(e) { return []; }
}
function saveWishlist(list) {
  localStorage.setItem('libas_wishlist', JSON.stringify(list));
  updateWishlistBadge();
}
function toggleWishlist(id) {
  let list = getWishlist();
  if (list.includes(id)) list = list.filter(x => x !== id);
  else list.push(id);
  saveWishlist(list);
  if (typeof showToast === 'function') showToast('Wishlist updated');
}
function updateWishlistBadge() {
  const count = getWishlist().length;
  document.querySelectorAll('a[href="wishlist.html"] .badge').forEach(b => b.textContent = count);
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  updateWishlistBadge();
  if (document.getElementById('shop-grid')) renderShopGrid();
  if (document.querySelector('.pd-info')) renderProductDetail();
  else if (document.getElementById('home-grid')) renderHomeGrid();
});
