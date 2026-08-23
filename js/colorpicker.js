// js/colorpicker.js
// Modal de seleção de cor (saturação/valor + matiz + campo hex).

import {
  customColorPickerModal,
  pickerHexInput,
  pickerSatBox,
  pickerSatBg,
  pickerSatPointer,
  pickerHueBar,
  pickerHueThumb,
  btnSelectColor
} from "./dom.js";
import { hsvToRgb, rgbToHex, hexToHsv } from "./utils.js";

let pickerH = 0, pickerS = 0, pickerV = 0;
let currentPickerCallback = null;

export function openCustomColorPicker(initialColor, onSelectCallback) {
  currentPickerCallback = onSelectCallback;
  const hsv = hexToHsv(initialColor || '#000000');
  pickerH = hsv.h;
  pickerS = hsv.s;
  pickerV = hsv.v;
  customColorPickerModal.classList.remove('hidden');
  requestAnimationFrame(() => {
    updatePickerUI();
  });
}

function updatePickerUI(updateInput = true) {
  const rgbBase = hsvToRgb(pickerH, 1, 1);
  pickerSatBg.style.backgroundColor = `rgb(${rgbBase.r}, ${rgbBase.g}, ${rgbBase.b})`;

  const satRect = pickerSatBox.getBoundingClientRect();
  const pointerX = pickerS * (satRect.width || 260);
  const pointerY = (1 - pickerV) * (satRect.height || 240);
  pickerSatPointer.style.left = `${pointerX}px`;
  pickerSatPointer.style.top = `${pointerY}px`;

  const hueRect = pickerHueBar.getBoundingClientRect();
  const hueX = (pickerH / 360) * (hueRect.width || 260);
  pickerHueThumb.style.left = `${hueX}px`;
  pickerHueThumb.style.backgroundColor = `rgb(${rgbBase.r}, ${rgbBase.g}, ${rgbBase.b})`;

  const finalRgb = hsvToRgb(pickerH, pickerS, pickerV);
  const hex = rgbToHex(finalRgb.r, finalRgb.g, finalRgb.b);
  if (updateInput) {
    pickerHexInput.value = hex;
  }
}

export function initColorPicker() {
  let isSatDragging = false;
  function handleSatPointer(e) {
    const rect = pickerSatBox.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    x = Math.max(0, Math.min(x, rect.width));
    y = Math.max(0, Math.min(y, rect.height));

    pickerS = x / rect.width;
    pickerV = 1 - (y / rect.height);
    updatePickerUI();
  }

  pickerSatBox.addEventListener('pointerdown', (e) => {
    isSatDragging = true;
    pickerSatBox.setPointerCapture(e.pointerId);
    handleSatPointer(e);
  });

  pickerSatBox.addEventListener('pointermove', (e) => {
    if (isSatDragging) handleSatPointer(e);
  });

  pickerSatBox.addEventListener('pointerup', () => {
    isSatDragging = false;
  });

  let isHueDragging = false;
  function handleHuePointer(e) {
    const rect = pickerHueBar.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));

    pickerH = (x / rect.width) * 360;
    if (pickerH >= 360) pickerH = 359.9;
    updatePickerUI();
  }

  pickerHueBar.addEventListener('pointerdown', (e) => {
    isHueDragging = true;
    pickerHueBar.setPointerCapture(e.pointerId);
    handleHuePointer(e);
  });

  pickerHueBar.addEventListener('pointermove', (e) => {
    if (isHueDragging) handleHuePointer(e);
  });

  pickerHueBar.addEventListener('pointerup', () => {
    isHueDragging = false;
  });

  pickerHexInput.addEventListener('input', (e) => {
    let val = e.target.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
      const hsv = hexToHsv(val);
      pickerH = hsv.h;
      pickerS = hsv.s;
      pickerV = hsv.v;
      updatePickerUI(false);
    }
  });

  btnSelectColor.addEventListener('click', () => {
    const finalRgb = hsvToRgb(pickerH, pickerS, pickerV);
    const hex = rgbToHex(finalRgb.r, finalRgb.g, finalRgb.b);
    if (currentPickerCallback) {
      currentPickerCallback(hex);
    }
    customColorPickerModal.classList.add('hidden');
  });
}

