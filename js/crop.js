// js/crop.js
// Modal de ajuste/corte (crop) de imagem, usado tanto pelo avatar do usuário
// quanto pelo ícone do servidor. O alvo ativo ('user' ou 'server') é
// controlado por activeCropTarget e definido por quem chama handleImageSelect.

import {
  cropModal,
  cropCanvas,
  cropContainer,
  cropZoom,
  zoomVal,
  btnCancelCrop,
  btnApplyCrop,
  modalAvatarPreview,
  serverIconPickerLabel
} from "./dom.js";
import { state } from "./state.js";

const ctx = cropCanvas.getContext('2d');

let loadedImg = null;
let imgPos = { x: 0, y: 0 };
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let activeCropTarget = 'user';

export function handleImageSelect(e, target) {
  activeCropTarget = target;
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    loadedImg = new Image();
    loadedImg.onload = () => {
      cropZoom.value = 100;
      zoomVal.textContent = '100%';
      imgPos = { x: 0, y: 0 };
      drawCropCanvas();
      cropModal.classList.remove('hidden');
    };
    loadedImg.src = event.target.result;
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function drawCropCanvas() {
  if (!loadedImg) return;
  ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
  const scale = cropZoom.value / 100;
  const w = cropCanvas.width * scale;
  const h = (loadedImg.height / loadedImg.width) * w;
  const x = (cropCanvas.width - w) / 2 + imgPos.x;
  const y = (cropCanvas.height - h) / 2 + imgPos.y;
  ctx.drawImage(loadedImg, x, y, w, h);
}

export function initCrop() {
  cropZoom.addEventListener('input', () => {
    zoomVal.textContent = `${cropZoom.value}%`;
    drawCropCanvas();
  });

  cropContainer.addEventListener('pointerdown', (e) => {
    isDragging = true;
    dragStart = { x: e.clientX - imgPos.x, y: e.clientY - imgPos.y };
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    imgPos = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y };
    drawCropCanvas();
  });

  window.addEventListener('pointerup', () => { isDragging = false; });

  btnCancelCrop.addEventListener('click', () => {
    cropModal.classList.add('hidden');
    loadedImg = null;
  });

  btnApplyCrop.addEventListener('click', () => {
    const croppedBase64 = cropCanvas.toDataURL('image/jpeg', 0.85);
    if (activeCropTarget === 'user') {
      state.tempAvatarBase64 = croppedBase64;
      modalAvatarPreview.style.backgroundImage = `url(${state.tempAvatarBase64})`;
      modalAvatarPreview.textContent = '';
    } else {
      state.tempServerAvatarBase64 = croppedBase64;
      serverIconPickerLabel.innerHTML = `<img src="${state.tempServerAvatarBase64}" alt="Icon">`;
    }
    cropModal.classList.add('hidden');
  });
}

