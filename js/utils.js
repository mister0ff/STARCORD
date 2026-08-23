// js/utils.js
// Funções utilitárias genéricas: username, perfil em cache, toasts e conversões de cor.

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./config.js";
import { profileCache } from "./state.js";
import { toastContainer } from "./dom.js";

export function cleanUsername(input) {
  if (!input) return "";
  let str = input.trim().toLowerCase();
  if (str.startsWith('@')) str = str.substring(1);
  return str.replace(/[^a-z0-9_]/g, '');
}

export async function getProfileCached(username) {
  if (profileCache[username]) return profileCache[username];
  try {
    const snap = await getDoc(doc(db, "profiles", username));
    if (snap.exists()) {
      profileCache[username] = snap.data();
      return profileCache[username];
    }
  } catch (e) {}
  return { displayName: username, avatarUrl: '' };
}

export function showToast(message, type = 'info') {
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'success' ? ' success' : '');
  el.textContent = message;
  toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

/* ---------- Conversões de cor (usadas pelo seletor de cores) ---------- */

export function hsvToRgb(h, s, v) {
  let r, g, b;
  let i = Math.floor(h / 60) % 6;
  let f = h / 60 - Math.floor(h / 60);
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);
  switch (i) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function hexToHsv(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6) return { h: 0, s: 0, v: 0 };
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  let d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s, v: v };
}

