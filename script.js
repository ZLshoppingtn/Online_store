/*
  Script principal — Boutique e‑commerce
  - Ouvre/ferme la modale
  - Auto-remplit le produit choisi
  - Envoie la commande via Google Apps Script (POST)
*/

const GAS_URL = "https://script.google.com/macros/s/AKfycbxSJ2yWrM9V0V1sFXb7aiqqbNMHUrj_r4COaNTZ0jBTA_FaY1R7kzF5ttLNeE2BgMv0/exec";

const modal = document.getElementById('orderModal');
const form = document.getElementById('commandeForm');
const submitBtn = document.getElementById('submitBtn');
const yearEl = document.getElementById('year');
const toastContainer = document.getElementById('toastContainer');

function showToast(message, type = 'success', position = 'bottom') {
  if (!toastContainer) { try { alert(message); } catch (_) {} return; }
  
  // Set container class based on position
  toastContainer.className = 'toast-container';
  if (position === 'top') toastContainer.classList.add('top');
  if (position === 'center') toastContainer.classList.add('center');
  
  const el = document.createElement('div');
  el.className = 'toast ' + (type === 'error' ? 'toast--error' : 'toast--success');
  el.textContent = message;
  
  // Insert at beginning for top position, append for bottom
  if (position === 'top') {
    toastContainer.insertBefore(el, toastContainer.firstChild);
  } else {
    toastContainer.appendChild(el);
  }
  
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 250); }, 3000);
}

if (yearEl) yearEl.textContent = new Date().getFullYear();

function buildWhatsAppUrl(phoneNumber, message) {
  let cleanPhone = String(phoneNumber || '').replace(/\D/g, '');
  if (cleanPhone.length === 8) cleanPhone = `216${cleanPhone}`;
  const encodedMsg = encodeURIComponent(message || '');
  const qs = encodedMsg ? `?text=${encodedMsg}` : '';
  return `https://wa.me/${cleanPhone}${qs}`;
}

function wireWhatsAppLinks(root = document) {
  const links = root.querySelectorAll('[data-wa][data-msg]');
  links.forEach((a) => {
    const phone = a.getAttribute('data-wa') || '';
    const msg = a.getAttribute('data-msg') || '';
    const url = buildWhatsAppUrl(phone, msg);
    a.setAttribute('href', url);
    if (!a.getAttribute('target')) a.setAttribute('target', '_blank');
    const rel = a.getAttribute('rel') || '';
    if (!/noopener/i.test(rel)) a.setAttribute('rel', (rel + ' noopener noreferrer').trim());
  });
}

document.addEventListener('DOMContentLoaded', () => {
  wireWhatsAppLinks(document);

  const floatWrap = document.querySelector('.whatsapp-float');
  const floatBtn = document.querySelector('.whatsapp-float-btn');
  const menu = document.querySelector('.whatsapp-float .wa-menu');

  if (floatWrap) floatWrap.setAttribute('aria-expanded', 'false');

  function closeMenu() {
    if (!menu || !floatWrap) return;
    menu.hidden = true;
    floatWrap.setAttribute('aria-expanded', 'false');
  }

  function toggleMenu() {
    if (!menu || !floatWrap) return;
    const isOpen = floatWrap.getAttribute('aria-expanded') === 'true';
    menu.hidden = isOpen;
    floatWrap.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
  }

  if (floatBtn && menu) {
    floatBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleMenu();
    });

    document.addEventListener('click', (e) => {
      if (!floatWrap) return;
      if (!floatWrap.contains(e.target)) closeMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }
});

function openModal(productName, details = {}) {
  const productInput = document.getElementById('article');
  if (productInput) productInput.value = productName || '';

  const previewTitle = document.getElementById('previewTitle');
  const previewImg = document.getElementById('previewImg');
  const previewPriceNew = document.getElementById('previewPriceNew');
  const previewPriceOld = document.getElementById('previewPriceOld');
  const previewDesc = document.getElementById('previewDesc');
  const previewStarsIco = document.getElementById('previewStarsIco');
  const previewStarsCount = document.getElementById('previewStarsCount');

  if (previewTitle) previewTitle.textContent = productName || '';
  if (previewImg && details.img) { previewImg.src = details.img; previewImg.alt = productName || ''; }
  if (previewPriceNew) previewPriceNew.textContent = details.priceNew || '';
  if (previewPriceOld) previewPriceOld.textContent = details.priceOld || '';
  if (previewDesc) previewDesc.textContent = details.desc || '';
  if (previewStarsIco) previewStarsIco.textContent = details.starsIco || '';
  if (previewStarsCount) previewStarsCount.textContent = details.starsCount || '';

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  modal.setAttribute('aria-modal', 'true');
  document.body.style.overflow = 'hidden';
  document.body.classList.add('no-scroll');
  document.body.classList.add('modal-open');

  const firstField = document.getElementById('nomPrenom');
  if (firstField) setTimeout(() => firstField.focus(), 50);

  const tsInput = document.getElementById('ts');
  if (tsInput) tsInput.value = String(Date.now());
}

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  modal.setAttribute('aria-modal', 'false');
  document.body.style.overflow = '';
  document.body.classList.remove('no-scroll');
  document.body.classList.remove('modal-open');
}

// Gestion des boutons et cartes produits
Array.from(document.querySelectorAll('.btn-order')).forEach(btn => {
  btn.addEventListener('click', () => {
    const product = btn.getAttribute('data-product') || '';
    const details = {
      img: btn.getAttribute('data-img') || '',
      priceNew: btn.getAttribute('data-price-new') || '',
      priceOld: btn.getAttribute('data-price-old') || '',
      desc: btn.closest('.product')?.querySelector('.product-desc')?.textContent?.trim() || '',
      starsIco: btn.closest('.product')?.querySelector('.stars-ico')?.textContent?.trim() || '',
      starsCount: btn.closest('.product')?.querySelector('.stars .count')?.textContent?.trim() || ''
    };
    if (!details.img) {
      const imgEl = btn.closest('.product')?.querySelector('.product-media img');
      if (imgEl) details.img = imgEl.getAttribute('src') || '';
    }
    openModal(product, details);
  });
});

const productsGrid = document.querySelector('.products-grid');
if (productsGrid) {
  productsGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.product');
    if (!card) return;
    if (e.target.closest('.btn-order')) return;
    const btn = card.querySelector('.btn-order');
    if (!btn) return;
    const product = btn.getAttribute('data-product') || card.querySelector('.product-title')?.textContent?.trim() || '';
    const details = {
      img: btn.getAttribute('data-img') || card.querySelector('.product-media img')?.getAttribute('src') || '',
      priceNew: btn.getAttribute('data-price-new') || card.querySelector('.price-new')?.textContent?.trim() || '',
      priceOld: btn.getAttribute('data-price-old') || card.querySelector('.price-old')?.textContent?.trim() || '',
      desc: card.querySelector('.product-desc')?.textContent?.trim() || '',
      starsIco: card.querySelector('.stars-ico')?.textContent?.trim() || '',
      starsCount: card.querySelector('.stars .count')?.textContent?.trim() || ''
    };
    openModal(product, details);
  });
}

// Fermeture modal
Array.from(document.querySelectorAll('[data-close]')).forEach(el => el.addEventListener('click', closeModal));
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

// Soumission formulaire
form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const hp = form.querySelector('#website');
  if (hp && hp.value.trim() !== '') { showToast('Erreur de validation. Merci de réessayer.', 'error'); return; }

  const tsVal = parseInt((document.getElementById('ts')?.value || '0'), 10);
  if (!tsVal || (Date.now() - tsVal) < 3000) { showToast('Merci de patienter quelques secondes avant l\'envoi.', 'error'); return; }

  const last = parseInt(localStorage.getItem('zl_last_submit') || '0', 10);
  if (!isNaN(last) && (Date.now() - last) < 15000) { showToast('Veuillez éviter les soumissions répétées.', 'error'); return; }
  localStorage.setItem('zl_last_submit', String(Date.now()));

  const nameVal = form.nomPrenom.value.trim();
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ'\-\s]{2,}$/.test(nameVal)) {
    showToast("Le nom et prénom doivent être alphabétiques.", 'error'); form.nomPrenom.focus(); return;
  }

  const rawPhone = form.numero.value || '';
  const phoneDigits = rawPhone.replace(/\D/g, '');
  form.numero.value = phoneDigits;
  if (phoneDigits.length !== 8) { showToast('Le téléphone doit contenir exactement 8 chiffres.', 'error'); form.numero.focus(); return; }

  const q = parseInt(form.quantite.value, 10);
  if (!Number.isInteger(q) || q < 1) { showToast('La quantité doit être un entier positif.', 'error'); form.quantite.focus(); return; }

  if (!form.checkValidity()) { form.reportValidity(); return; }

  const data = new URLSearchParams();
  data.append('nomPrenom', form.nomPrenom.value.trim());
  data.append('numero', form.numero.value.trim());
  data.append('quantite', form.quantite.value);
  data.append('article', form.article.value.trim());
  if (form.adresse && form.adresse.value) data.append('adresse', form.adresse.value.trim());
  if (form.ts && form.ts.value) data.append('ts', form.ts.value);
  if (form.website && form.website.value) data.append('website', form.website.value);

  submitBtn.textContent = 'Envoi…'; submitBtn.disabled = true;

  try {
    const res = await fetch(GAS_URL, { method: 'POST', body: data });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    showToast('Commande envoyée avec succès !', 'success', 'center');
    form.reset();
    closeModal();
  } catch (err) {
    console.error('Erreur envoi commande:', err);
    showToast("Erreur lors de l'envoi. Merci de réessayer.", 'error');
  } finally {
    submitBtn.textContent = 'Commander'; submitBtn.disabled = false;
  }
});
