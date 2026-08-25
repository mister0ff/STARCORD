import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAoqc8NcgLAQqclCFY-q_PcxATIE0FqU_E",
  authDomain: "starcord-ee336.firebaseapp.com",
  projectId: "starcord-ee336",
  storageBucket: "starcord-ee336.firebasestorage.app",
  messagingSenderId: "166227286926",
  appId: "1:166227286926:web:8cafd28b2eda5fbaf0e2df",
  measurementId: "G-E06X0P832W"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUsername = null;
let targetUsername = null;
let currentServerId = null;
let activeServerData = null;
let unsubscribeMessages = null;
let tempAvatarBase64 = null;
let tempServerAvatarBase64 = null;
let isLoginMode = false;
const profileCache = {};

let selectedBannerColor = '#000000';
let editSelectedBannerColor = '#000000';

function cleanUsername(input) {
  if (!input) return "";
  let str = input.trim().toLowerCase();
  if (str.startsWith('@')) str = str.substring(1);
  return str.replace(/[^a-z0-9_]/g, '');
}

async function getProfileCached(username) {
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

// Splash Screen
let splashFinished = false;
let authChecked = false;
const splashScreen = document.getElementById('splashScreen');
const splashIcon = document.getElementById('splashIcon');
const SECOND_ICON_URL = "white_icon.png";

setTimeout(() => {
  splashIcon.src = SECOND_ICON_URL;
  setTimeout(() => {
    splashFinished = true;
    revelarTelaCorreta();
  }, 600);
}, 1000);

function revelarTelaCorreta() {
  if (!splashFinished || !authChecked) return;
  splashScreen.classList.add('hidden');
  if (currentUsername) {
    authScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
  } else {
    authScreen.classList.remove('hidden');
    appScreen.classList.add('hidden');
  }
}

// Elementos DOM Autenticação
const authScreen = document.getElementById('authScreen');
const appScreen = document.getElementById('appScreen');
const authTitle = document.getElementById('authTitle');
const authSub = document.getElementById('authSub');
const authUsername = document.getElementById('authUsername');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authConfirmPassword = document.getElementById('authConfirmPassword');
const btnAuthSubmit = document.getElementById('btnAuthSubmit');
const btnToggleAuthMode = document.getElementById('btnToggleAuthMode');
const authError = document.getElementById('authError');
const groupUsername = document.getElementById('groupUsername');
const groupConfirmPassword = document.getElementById('groupConfirmPassword');

const userDisplayName = document.getElementById('userDisplayName');
const userHandle = document.getElementById('userHandle');
const userAvatarMain = document.getElementById('userAvatarMain');
const btnLogout = document.getElementById('btnLogout');

const friendUsernameInput = document.getElementById('friendUsernameInput');
const btnAddFriend = document.getElementById('btnAddFriend');
const friendsList = document.getElementById('friendsList');
const serversList = document.getElementById('serversList');

const btnBack = document.getElementById('btnBack');
const chatTargetTitle = document.getElementById('chatTargetTitle');
const chatTargetHandle = document.getElementById('chatTargetHandle');
const chatAvatar = document.getElementById('chatAvatar');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const fileInput = document.getElementById('fileInput');
const btnServerHeaderInfo = document.getElementById('btnServerHeaderInfo');

const toastContainer = document.getElementById('toastContainer');

// Modais DOM
const profileModal = document.getElementById('profileModal');
const btnOpenSelfProfile = document.getElementById('btnOpenSelfProfile');
const btnOpenTargetProfile = document.getElementById('btnOpenTargetProfile');
const btnCloseProfileModal = document.getElementById('btnCloseProfileModal');
const btnSaveProfile = document.getElementById('btnSaveProfile');
const profileModalTitle = document.getElementById('profileModalTitle');

const modalAvatarPreview = document.getElementById('modalAvatarPreview');
const modalAvatarEditOverlay = document.getElementById('modalAvatarEditOverlay');
const avatarFileInput = document.getElementById('avatarFileInput');

const editDisplayName = document.getElementById('editDisplayName');
const viewDisplayName = document.getElementById('viewDisplayName');
const editPronouns = document.getElementById('editPronouns');
const viewPronouns = document.getElementById('viewPronouns');
const editBio = document.getElementById('editBio');
const viewBio = document.getElementById('viewBio');

// Modais Servidores DOM
const btnOpenCreateServer = document.getElementById('btnOpenCreateServer');
const createServerModal = document.getElementById('createServerModal');
const btnCloseCreateServer = document.getElementById('btnCloseCreateServer');
const serverAvatarFileInput = document.getElementById('serverAvatarFileInput');
const serverIconPickerLabel = document.getElementById('serverIconPickerLabel');
const inputServerName = document.getElementById('inputServerName');
const inputServerDesc = document.getElementById('inputServerDesc');
const btnConfirmCreateServer = document.getElementById('btnConfirmCreateServer');

const inviteFriendsModal = document.getElementById('inviteFriendsModal');
const btnCloseInviteModal = document.getElementById('btnCloseInviteModal');
const txtInviteLink = document.getElementById('txtInviteLink');
const btnCopyInviteLink = document.getElementById('btnCopyInviteLink');
const inviteFriendsListContainer = document.getElementById('inviteFriendsListContainer');

const serverInfoModal = document.getElementById('serverInfoModal');
const btnCloseServerInfoModal = document.getElementById('btnCloseServerInfoModal');
const serverInfoModalTitle = document.getElementById('serverInfoModalTitle');
const serverInfoModalAvatar = document.getElementById('serverInfoModalAvatar');
const serverInfoName = document.getElementById('serverInfoName');
const serverInfoOwner = document.getElementById('serverInfoOwner');
const modalServerInviteLink = document.getElementById('modalServerInviteLink');
const btnModalCopyLink = document.getElementById('btnModalCopyLink');
const serverInfoDescText = document.getElementById('serverInfoDescText');
const serverMembersListContainer = document.getElementById('serverMembersListContainer');
const btnOpenInviteMore = document.getElementById('btnOpenInviteMore');
const btnLeaveOrDeleteServer = document.getElementById('btnLeaveOrDeleteServer');
const editServerNameInput = document.getElementById('editServerNameInput');
const editServerDescInput = document.getElementById('editServerDescInput');
const btnSaveServerEdit = document.getElementById('btnSaveServerEdit');
const editBannerColorSection = document.getElementById('editBannerColorSection');

// Modal Crop DOM
const cropModal = document.getElementById('cropModal');
const cropCanvas = document.getElementById('cropCanvas');
const cropContainer = document.getElementById('cropContainer');
const cropZoom = document.getElementById('cropZoom');
const zoomVal = document.getElementById('zoomVal');
const btnCancelCrop = document.getElementById('btnCancelCrop');
const btnApplyCrop = document.getElementById('btnApplyCrop');
const ctx = cropCanvas.getContext('2d');

let loadedImg = null;
let imgPos = { x: 0, y: 0 };
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let activeCropTarget = 'user';

// Seletor de Cores Customizado
let pickerH = 0, pickerS = 0, pickerV = 0;
let currentPickerCallback = null;

const customColorPickerModal = document.getElementById('customColorPickerModal');
const pickerHexInput = document.getElementById('pickerHexInput');
const pickerSatBox = document.getElementById('pickerSatBox');
const pickerSatBg = document.getElementById('pickerSatBg');
const pickerSatPointer = document.getElementById('pickerSatPointer');
const pickerHueBar = document.getElementById('pickerHueBar');
const pickerHueThumb = document.getElementById('pickerHueThumb');
const btnSelectColor = document.getElementById('btnSelectColor');

function hsvToRgb(h, s, v) {
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

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function hexToHsv(hex) {
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

function openCustomColorPicker(initialColor, onSelectCallback) {
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

pickerSatBox.addEventListener('pointerup', (e) => {
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

pickerHueBar.addEventListener('pointerup', (e) => {
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

document.getElementById('btnTriggerColorCreate').addEventListener('click', () => {
  openCustomColorPicker(selectedBannerColor, (hex) => {
    selectedBannerColor = hex;
    document.getElementById('previewColorCreate').style.backgroundColor = hex;
    document.getElementById('txtColorCreate').textContent = hex;
  });
});

document.getElementById('btnTriggerColorEdit').addEventListener('click', () => {
  openCustomColorPicker(editSelectedBannerColor, (hex) => {
    editSelectedBannerColor = hex;
    document.getElementById('previewColorEdit').style.backgroundColor = hex;
    document.getElementById('txtColorEdit').textContent = hex;
  });
});

function showToast(message, type = 'info') {
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'success' ? ' success' : '');
  el.textContent = message;
  toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

[authUsername, friendUsernameInput].forEach(input => {
  input.addEventListener('input', (e) => {
    e.target.value = cleanUsername(e.target.value);
  });
});

btnToggleAuthMode.addEventListener('click', () => {
  isLoginMode = !isLoginMode;
  authError.textContent = '';

  if (isLoginMode) {
    authTitle.textContent = "Entrar no Starcord";
    authSub.textContent = "Digite seus dados para acessar";
    groupUsername.classList.add('hidden');
    groupConfirmPassword.classList.add('hidden');
    authPassword.placeholder = "Sua senha";
    btnAuthSubmit.textContent = "Entrar";
    btnToggleAuthMode.textContent = "Criar uma conta";
  } else {
    authTitle.textContent = "Criar Conta";
    authSub.textContent = "Preencha os dados abaixo";
    groupUsername.classList.remove('hidden');
    groupConfirmPassword.classList.remove('hidden');
    authPassword.placeholder = "Crie uma senha";
    btnAuthSubmit.textContent = "Cadastrar";
    btnToggleAuthMode.textContent = "Já tenho conta!";
  }
});

onAuthStateChanged(auth, async (user) => {
  authChecked = true;
  if (user) {
    const userMapSnap = await getDoc(doc(db, "users_map", user.uid));
    if (userMapSnap.exists()) {
      currentUsername = userMapSnap.data().username;
    } else {
      currentUsername = user.email.split('@')[0];
    }
    await carregarMeuPerfil();
    carregarAmigos();
    carregarServidores();
  } else {
    currentUsername = null;
  }
  revelarTelaCorreta();
});

btnAuthSubmit.addEventListener('click', async () => {
  const email = authEmail.value.trim();
  const password = authPassword.value;
  const uName = cleanUsername(authUsername.value);
  const confirmPassword = authConfirmPassword.value;
  authError.textContent = '';

  if (!email) { authError.textContent = 'Digite o seu e-mail.'; return; }
  if (!password) { authError.textContent = 'Digite a sua senha.'; return; }

  if (!isLoginMode) {
    if (!uName) { authError.textContent = 'Digite um nome de usuário.'; return; }
    if (password !== confirmPassword) { authError.textContent = 'As senhas não coincidem!'; return; }
  }

  btnAuthSubmit.disabled = true;

  try {
    if (isLoginMode) {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const profileSnap = await getDoc(doc(db, "profiles", uName));
      if (profileSnap.exists()) {
        authError.textContent = 'Este @username já está em uso.';
        btnAuthSubmit.disabled = false;
        return;
      }

      await setDoc(doc(db, "profiles", uName), {
        username: uName, displayName: uName, email: email,
        uid: userCred.user.uid, pronouns: '', bio: '', avatarUrl: ''
      });

      await setDoc(doc(db, "users_map", userCred.user.uid), {
        username: uName, email: email
      });
    }
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') authError.textContent = 'Este e-mail já está cadastrado.';
    else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') authError.textContent = 'E-mail ou senha incorretos.';
    else authError.textContent = 'Erro: ' + error.message;
  } finally {
    btnAuthSubmit.disabled = false;
  }
});

btnLogout.addEventListener('click', (e) => { e.stopPropagation(); signOut(auth); });

btnBack.addEventListener('click', () => {
  appScreen.classList.remove('chat-open');
  targetUsername = null;
  currentServerId = null;
  activeServerData = null;
  btnServerHeaderInfo.classList.add('hidden');
});

async function carregarMeuPerfil() {
  const profileRef = doc(db, "profiles", currentUsername);
  onSnapshot(profileRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      userDisplayName.textContent = data.displayName || currentUsername;
      userHandle.textContent = `@${currentUsername}`;
      if (data.avatarUrl) {
        userAvatarMain.style.backgroundImage = `url(${data.avatarUrl})`;
        userAvatarMain.textContent = '';
      } else {
        userAvatarMain.style.backgroundImage = 'none';
        userAvatarMain.textContent = currentUsername[0].toUpperCase();
      }
    }
  });
}

avatarFileInput.addEventListener('change', (e) => { activeCropTarget = 'user'; handleImageSelect(e); });
serverAvatarFileInput.addEventListener('change', (e) => { activeCropTarget = 'server'; handleImageSelect(e); });

function handleImageSelect(e) {
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

cropZoom.addEventListener('input', () => { zoomVal.textContent = `${cropZoom.value}%`; drawCropCanvas(); });
cropContainer.addEventListener('pointerdown', (e) => { isDragging = true; dragStart = { x: e.clientX - imgPos.x, y: e.clientY - imgPos.y }; });
window.addEventListener('pointermove', (e) => { if (!isDragging) return; imgPos = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }; drawCropCanvas(); });
window.addEventListener('pointerup', () => { isDragging = false; });

btnCancelCrop.addEventListener('click', () => { cropModal.classList.add('hidden'); loadedImg = null; });
btnApplyCrop.addEventListener('click', () => {
  const croppedBase64 = cropCanvas.toDataURL('image/jpeg', 0.85);
  if (activeCropTarget === 'user') {
    tempAvatarBase64 = croppedBase64;
    modalAvatarPreview.style.backgroundImage = `url(${tempAvatarBase64})`;
    modalAvatarPreview.textContent = '';
  } else {
    tempServerAvatarBase64 = croppedBase64;
    serverIconPickerLabel.innerHTML = `<img src="${tempServerAvatarBase64}" alt="Icon">`;
  }
  cropModal.classList.add('hidden');
});

btnOpenSelfProfile.addEventListener('click', async () => {
  const profileSnap = await getDoc(doc(db, "profiles", currentUsername));
  const data = profileSnap.data() || {};
  profileModalTitle.textContent = "Editar Perfil";
  btnSaveProfile.classList.remove('hidden');
  modalAvatarEditOverlay.classList.remove('hidden');
  editDisplayName.classList.remove('hidden');
  editPronouns.classList.remove('hidden');
  editBio.classList.remove('hidden');
  viewDisplayName.classList.add('hidden');
  viewPronouns.classList.add('hidden');
  viewBio.classList.add('hidden');
  editDisplayName.value = data.displayName || '';
  editPronouns.value = data.pronouns || '';
  editBio.value = data.bio || '';
  if (data.avatarUrl) {
    modalAvatarPreview.style.backgroundImage = `url(${data.avatarUrl})`;
    modalAvatarPreview.textContent = '';
  } else {
    modalAvatarPreview.style.backgroundImage = 'none';
    modalAvatarPreview.textContent = currentUsername[0].toUpperCase();
  }
  profileModal.classList.remove('hidden');
});

btnOpenTargetProfile.addEventListener('click', async () => {
  if (currentServerId && activeServerData) { abrirModalInfoServidor(); return; }
  if (!targetUsername) return;
  const profileSnap = await getDoc(doc(db, "profiles", targetUsername));
  const data = profileSnap.data() || {};
  profileModalTitle.textContent = `@${targetUsername}`;
  btnSaveProfile.classList.add('hidden');
  modalAvatarEditOverlay.classList.add('hidden');
  editDisplayName.classList.add('hidden');
  editPronouns.classList.add('hidden');
  editBio.classList.add('hidden');
  viewDisplayName.classList.remove('hidden');
  viewPronouns.classList.remove('hidden');
  viewBio.classList.remove('hidden');
  viewDisplayName.textContent = data.displayName || targetUsername;
  viewPronouns.textContent = data.pronouns || 'Não informado';
  viewBio.textContent = data.bio || 'Sem biografia.';
  if (data.avatarUrl) {
    modalAvatarPreview.style.backgroundImage = `url(${data.avatarUrl})`;
    modalAvatarPreview.textContent = '';
  } else {
    modalAvatarPreview.style.backgroundImage = 'none';
    modalAvatarPreview.textContent = targetUsername[0].toUpperCase();
  }
  profileModal.classList.remove('hidden');
});

btnCloseProfileModal.addEventListener('click', () => { profileModal.classList.add('hidden'); tempAvatarBase64 = null; });

btnSaveProfile.addEventListener('click', async () => {
  btnSaveProfile.disabled = true;
  try {
    const updateData = {
      displayName: editDisplayName.value.trim() || currentUsername,
      pronouns: editPronouns.value.trim(),
      bio: editBio.value.trim()
    };
    if (tempAvatarBase64) updateData.avatarUrl = tempAvatarBase64;
    await setDoc(doc(db, "profiles", currentUsername), updateData, { merge: true });
    profileCache[currentUsername] = null;
    showToast('Perfil salvo!', 'success');
    profileModal.classList.add('hidden');
    tempAvatarBase64 = null;
  } catch (err) {
    showToast('Erro ao salvar: ' + err.message);
  } finally {
    btnSaveProfile.disabled = false;
  }
});

btnOpenCreateServer.addEventListener('click', () => {
  inputServerName.value = `Servidor de .${currentUsername}®`;
  inputServerDesc.value = 'Bem-vindo ao nosso servidor!';
  tempServerAvatarBase64 = null;
  selectedBannerColor = '#000000';
  document.getElementById('previewColorCreate').style.backgroundColor = selectedBannerColor;
  document.getElementById('txtColorCreate').textContent = selectedBannerColor;

  serverIconPickerLabel.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
    <span>ENVIAR</span>
    <input type="file" id="serverAvatarFileInput" accept="image/*" />
  `;
  document.getElementById('serverAvatarFileInput').addEventListener('change', (e) => {
    activeCropTarget = 'server';
    handleImageSelect(e);
  });
  createServerModal.classList.remove('hidden');
});

btnCloseCreateServer.addEventListener('click', () => { createServerModal.classList.add('hidden'); });

let newlyCreatedServerId = null;
let newlyCreatedInviteCode = null;

btnConfirmCreateServer.addEventListener('click', async () => {
  const name = inputServerName.value.trim() || `Servidor de ${currentUsername}`;
  const desc = inputServerDesc.value.trim();
  const inviteCode = Math.random().toString(36).substring(2, 10);

  btnConfirmCreateServer.disabled = true;
  try {
    const serverRef = doc(collection(db, "servers"));
    await setDoc(serverRef, {
      name: name,
      description: desc,
      iconUrl: tempServerAvatarBase64 || '',
      bannerColor: selectedBannerColor,
      owner: currentUsername,
      inviteCode: inviteCode,
      members: [currentUsername],
      createdAt: serverTimestamp()
    });

    newlyCreatedServerId = serverRef.id;
    newlyCreatedInviteCode = inviteCode;

    createServerModal.classList.add('hidden');
    abrirModalConvidarAmigos(newlyCreatedServerId, inviteCode);
    showToast('Servidor criado com sucesso!', 'success');
  } catch (err) {
    showToast('Erro ao criar servidor: ' + err.message);
  } finally {
    btnConfirmCreateServer.disabled = false;
  }
});

function abrirModalConvidarAmigos(serverId, inviteCode) {
  txtInviteLink.textContent = `starcord.gg/${inviteCode}`;
  carregarListaAmigosParaConvite(serverId);
  inviteFriendsModal.classList.remove('hidden');
}

btnCloseInviteModal.addEventListener('click', () => {
  inviteFriendsModal.classList.add('hidden');
  if (newlyCreatedServerId) abrirServidorChat(newlyCreatedServerId);
});

btnCopyInviteLink.addEventListener('click', () => {
  navigator.clipboard.writeText(txtInviteLink.textContent);
  showToast('Link copiado para a área de transferência!', 'success');
});

async function carregarListaAmigosParaConvite(serverId) {
  inviteFriendsListContainer.innerHTML = '';
  const colRef = collection(db, "users", currentUsername, "friends");
  onSnapshot(colRef, async (snapshot) => {
    inviteFriendsListContainer.innerHTML = '';
    if (snapshot.empty) {
      inviteFriendsListContainer.innerHTML = '<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:10px;">Nenhum amigo na lista.</div>';
      return;
    }
    for (const docSnap of snapshot.docs) {
      const fUser = docSnap.id;
      const pData = await getProfileCached(fUser);
      const row = document.createElement('div');
      row.className = 'invite-friend-row';
      let avatarHtml = pData.avatarUrl ? `<div class="friend-avatar" style="background-image:url('${pData.avatarUrl}')"></div>` : `<div class="friend-avatar">${(pData.displayName||fUser)[0].toUpperCase()}</div>`;

      row.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          ${avatarHtml}
          <div>
            <div style="font-size:13px; font-weight:600;">${pData.displayName || fUser}</div>
            <div style="font-size:11px; color:var(--text-muted);">@${fUser}</div>
          </div>
        </div>
        <button class="btn" style="padding:6px 12px; font-size:11px;">Convidar</button>
      `;

      const btnConv = row.querySelector('button');
      btnConv.addEventListener('click', async () => {
        btnConv.disabled = true;
        btnConv.textContent = 'Enviado';
        const roomId = [currentUsername, fUser].sort().join('_');
        const myProfile = await getProfileCached(currentUsername);
        await addDoc(collection(db, "chats", roomId, "messages"), {
          text: `Ei! Entre no meu servidor do Starcord: starcord.gg/${newlyCreatedInviteCode}`,
          fileUrl: null, sender: currentUsername,
          senderDisplayName: myProfile.displayName || currentUsername,
          senderAvatar: myProfile.avatarUrl || '',
          timestamp: serverTimestamp()
        });
        showToast(`Convite enviado para @${fUser}!`, 'success');
      });
      inviteFriendsListContainer.appendChild(row);
    }
  });
}

function carregarServidores() {
  const serversRef = collection(db, "servers");
  onSnapshot(serversRef, (snapshot) => {
    serversList.innerHTML = '';
    snapshot.forEach((docSnap) => {
      const sData = docSnap.data();
      const sId = docSnap.id;
      if (sData.members && sData.members.includes(currentUsername)) {
        const item = document.createElement('div');
        item.classList.add('server-item');
        let avatarStyle = sData.iconUrl ? `style="background-image: url('${sData.iconUrl}')"` : '';
        let avatarContent = sData.iconUrl ? '' : sData.name[0].toUpperCase();

        item.innerHTML = `
          <div class="server-avatar" ${avatarStyle}>${avatarContent}</div>
          <div class="server-details">
            <div class="server-name">${sData.name}</div>
            <div class="server-sub">${sData.members.length} membro(s)</div>
          </div>
        `;
        item.addEventListener('click', () => abrirServidorChat(sId));
        serversList.appendChild(item);
      }
    });
  });
}

async function abrirServidorChat(serverId) {
  currentServerId = serverId;
  targetUsername = null;
  btnServerHeaderInfo.classList.remove('hidden');

  const sSnap = await getDoc(doc(db, "servers", serverId));
  if (!sSnap.exists()) return;
  activeServerData = sSnap.data();

  chatTargetTitle.textContent = activeServerData.name;
  chatTargetHandle.textContent = `Servidor • ${activeServerData.members.length} membros`;

  if (activeServerData.iconUrl) {
    chatAvatar.style.backgroundImage = `url(${activeServerData.iconUrl})`;
    chatAvatar.textContent = '';
  } else {
    chatAvatar.style.backgroundImage = 'none';
    chatAvatar.textContent = activeServerData.name[0].toUpperCase();
  }

  appScreen.classList.add('chat-open');
  carregarMensagensServidor(serverId);
}

async function processarTextoComEmbeds(text, bodyDiv) {
  if (!text) return;
  const textDiv = document.createElement('div');
  textDiv.className = 'chat-msg-text';

  const inviteRegex = /starcord\.gg\/([a-zA-Z0-9]+)/g;
  
  if (inviteRegex.test(text)) {
    inviteRegex.lastIndex = 0;
    let match;
    let lastIdx = 0;

    while ((match = inviteRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        let span = document.createElement('span');
        span.textContent = text.substring(lastIdx, match.index);
        textDiv.appendChild(span);
      }

      let inviteCode = match[1];

      let linkSpan = document.createElement('span');
      linkSpan.style.color = "var(--accent-red)";
      linkSpan.style.fontWeight = "600";
      linkSpan.textContent = match[0];
      textDiv.appendChild(linkSpan);

      try {
        const q = query(collection(db, "servers"), where("inviteCode", "==", inviteCode));
        const querySnapshot = await getDocs(q);

        const embedCard = document.createElement('div');
        embedCard.className = 'invite-embed-card';

        if (!querySnapshot.empty) {
          const sDoc = querySnapshot.docs[0];
          const sData = sDoc.data();
          const sId = sDoc.id;
          const bannerBg = sData.bannerColor || '#000000';

          embedCard.innerHTML = `
            <div class="invite-embed-banner" style="background-color: ${bannerBg};"></div>
            <div class="invite-embed-body">
              <div class="invite-embed-top">
                <div class="invite-embed-avatar" ${sData.iconUrl ? 'style="background-image:url(\''+sData.iconUrl+'\')"' : ''}>${sData.iconUrl ? '' : sData.name[0].toUpperCase()}</div>
                <div class="invite-embed-title-area">
                  <div class="invite-embed-name">${sData.name} <span style="color:#23c268; font-size:12px;" title="Verificado">✔</span></div>
                  <div class="invite-embed-members">🟢 ${Math.floor(Math.random()*15 + 3)} online • ${sData.members ? sData.members.length : 1} membros</div>
                </div>
              </div>
              <div class="invite-embed-desc-text">${sData.description || 'Servidor da comunidade Starcord.'}</div>
              <button class="invite-embed-join-btn">Ir para o Servidor</button>
            </div>
          `;

          const joinBtn = embedCard.querySelector('.invite-embed-join-btn');
          joinBtn.addEventListener('click', async () => {
            if (!sData.members.includes(currentUsername)) {
              await updateDoc(doc(db, "servers", sId), {
                members: arrayUnion(currentUsername)
              });
              showToast(`Você entrou em ${sData.name}!`, 'success');
            }
            abrirServidorChat(sId);
          });

        } else {
          embedCard.innerHTML = `
            <div class="invite-embed-banner" style="background-color: #ff4d4d;"></div>
            <div class="invite-embed-body">
              <div class="invite-embed-name" style="color: #ff4d4d;">Convite Inválido</div>
              <div class="invite-embed-desc-text">O link <b>starcord.gg/${inviteCode}</b> não existe ou o servidor foi excluído.</div>
            </div>
          `;
        }

        textDiv.appendChild(embedCard);
      } catch(err) {
        console.error(err);
      }

      lastIdx = inviteRegex.lastIndex;
    }

    if (lastIdx < text.length) {
      let span = document.createElement('span');
      span.textContent = text.substring(lastIdx);
      textDiv.appendChild(span);
    }
  } else {
    textDiv.textContent = text;
  }

  bodyDiv.appendChild(textDiv);
}

function carregarMensagensServidor(serverId) {
  chatMessages.innerHTML = '';
  const q = query(collection(db, "servers", serverId, "messages"), orderBy("timestamp", "asc"));
  if (unsubscribeMessages) unsubscribeMessages();

  unsubscribeMessages = onSnapshot(q, async (snapshot) => {
    chatMessages.innerHTML = '';
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      let name = data.senderDisplayName;
      let avatar = data.senderAvatar;

      if (!name || avatar === undefined) {
        const p = await getProfileCached(data.sender);
        name = p.displayName || data.sender;
        avatar = p.avatarUrl || '';
      }

      let hora = '';
      if (data.timestamp) {
        hora = data.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      const row = document.createElement('div');
      row.classList.add('chat-message-row');

      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'chat-msg-avatar';
      if (avatar) avatarDiv.style.backgroundImage = `url('${avatar}')`;
      else avatarDiv.textContent = name ? name[0].toUpperCase() : '?';

      const bodyDiv = document.createElement('div');
      bodyDiv.className = 'chat-msg-body';

      const headerDiv = document.createElement('div');
      headerDiv.className = 'chat-msg-header';
      const nameSpan = document.createElement('span');
      nameSpan.className = 'chat-msg-name';
      nameSpan.textContent = name;
      const timeSpan = document.createElement('span');
      timeSpan.className = 'chat-msg-time';
      timeSpan.textContent = hora;

      headerDiv.appendChild(nameSpan);
      headerDiv.appendChild(timeSpan);
      bodyDiv.appendChild(headerDiv);

      if (data.text) {
        await processarTextoComEmbeds(data.text, bodyDiv);
      }

      if (data.fileUrl) {
        const img = document.createElement('img');
        img.src = data.fileUrl;
        img.alt = 'Anexo';
        bodyDiv.appendChild(img);
      }

      row.appendChild(avatarDiv);
      row.appendChild(bodyDiv);
      chatMessages.appendChild(row);
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

btnServerHeaderInfo.addEventListener('click', abrirModalInfoServidor);

async function abrirModalInfoServidor() {
  if (!currentServerId) return;
  const sSnap = await getDoc(doc(db, "servers", currentServerId));
  if (!sSnap.exists()) return;
  activeServerData = sSnap.data();

  serverInfoModalTitle.textContent = activeServerData.name;
  serverInfoName.textContent = activeServerData.name;
  serverInfoOwner.textContent = `Dono: @${activeServerData.owner}`;
  serverInfoDescText.textContent = activeServerData.description || 'Sem descrição.';
  modalServerInviteLink.textContent = `starcord.gg/${activeServerData.inviteCode}`;

  if (activeServerData.iconUrl) {
    serverInfoModalAvatar.style.backgroundImage = `url(${activeServerData.iconUrl})`;
    serverInfoModalAvatar.textContent = '';
  } else {
    serverInfoModalAvatar.style.backgroundImage = 'none';
    serverInfoModalAvatar.textContent = activeServerData.name[0].toUpperCase();
  }

  const isOwner = activeServerData.owner === currentUsername;
  if (isOwner) {
    btnSaveServerEdit.classList.remove('hidden');
    editServerNameInput.classList.remove('hidden');
    editServerDescInput.classList.remove('hidden');
    editBannerColorSection.classList.remove('hidden');
    serverInfoName.classList.add('hidden');
    serverInfoDescText.classList.add('hidden');

    editServerNameInput.value = activeServerData.name;
    editServerDescInput.value = activeServerData.description || '';
    editSelectedBannerColor = activeServerData.bannerColor || '#000000';

    document.getElementById('previewColorEdit').style.backgroundColor = editSelectedBannerColor;
    document.getElementById('txtColorEdit').textContent = editSelectedBannerColor;

    btnLeaveOrDeleteServer.textContent = "Excluir Servidor";
  } else {
    btnSaveServerEdit.classList.add('hidden');
    editServerNameInput.classList.add('hidden');
    editServerDescInput.classList.add('hidden');
    editBannerColorSection.classList.add('hidden');
    serverInfoName.classList.remove('hidden');
    serverInfoDescText.classList.remove('hidden');
    btnLeaveOrDeleteServer.textContent = "Sair do Servidor";
  }

  serverMembersListContainer.innerHTML = '';
  for (const mUser of activeServerData.members) {
    const mProfile = await getProfileCached(mUser);
    const mRow = document.createElement('div');
    mRow.style.cssText = "display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); padding: 6px 10px; border-radius: 8px;";
    
    let mAvatar = mProfile.avatarUrl ? `<div class="friend-avatar" style="width:28px;height:28px;background-image:url('${mProfile.avatarUrl}')"></div>` : `<div class="friend-avatar" style="width:28px;height:28px;font-size:11px;">${(mProfile.displayName||mUser)[0].toUpperCase()}</div>`;
    let actionHtml = '';
    if (isOwner && mUser !== currentUsername) {
      actionHtml = `<button class="btn" style="background:#ff4d4d; padding:4px 8px; font-size:10px;" data-kick="${mUser}">Expulsar</button>`;
    } else if (mUser === activeServerData.owner) {
      actionHtml = `<span style="font-size:10px; color:var(--accent-red); font-weight:700;">DONO</span>`;
    }

    mRow.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        ${mAvatar}
        <span style="font-size: 12px; font-weight: 600;">${mProfile.displayName || mUser} (@${mUser})</span>
      </div>
      ${actionHtml}
    `;

    if (isOwner && mUser !== currentUsername) {
      mRow.querySelector('button').addEventListener('click', async () => {
        if (confirm(`Deseja expulsar @${mUser} do servidor?`)) {
          await updateDoc(doc(db, "servers", currentServerId), { members: arrayRemove(mUser) });
          showToast(`@${mUser} foi expulso.`);
          abrirModalInfoServidor();
        }
      });
    }
    serverMembersListContainer.appendChild(mRow);
  }

  serverInfoModal.classList.remove('hidden');
}

btnCloseServerInfoModal.addEventListener('click', () => { serverInfoModal.classList.add('hidden'); });

btnModalCopyLink.addEventListener('click', () => {
  navigator.clipboard.writeText(modalServerInviteLink.textContent);
  showToast('Link de convite copiado!', 'success');
});

btnOpenInviteMore.addEventListener('click', () => {
  serverInfoModal.classList.add('hidden');
  newlyCreatedInviteCode = activeServerData.inviteCode;
  newlyCreatedServerId = currentServerId;
  abrirModalConvidarAmigos(currentServerId, activeServerData.inviteCode);
});

btnSaveServerEdit.addEventListener('click', async () => {
  const newName = editServerNameInput.value.trim() || activeServerData.name;
  const newDesc = editServerDescInput.value.trim();

  try {
    await updateDoc(doc(db, "servers", currentServerId), {
      name: newName,
      description: newDesc,
      bannerColor: editSelectedBannerColor
    });
    showToast('Servidor atualizado com sucesso!', 'success');
    serverInfoModal.classList.add('hidden');
    abrirServidorChat(currentServerId);
  } catch (err) {
    showToast('Erro ao atualizar servidor.');
  }
});

btnLeaveOrDeleteServer.addEventListener('click', async () => {
  const isOwner = activeServerData.owner === currentUsername;
  if (isOwner) {
    if (confirm('Tem certeza que deseja excluir permanentemente este servidor?')) {
      await deleteDoc(doc(db, "servers", currentServerId));
      serverInfoModal.classList.add('hidden');
      appScreen.classList.remove('chat-open');
      currentServerId = null;
      showToast('Servidor excluído.');
    }
  } else {
    if (confirm('Tem certeza que deseja sair deste servidor?')) {
      await updateDoc(doc(db, "servers", currentServerId), { members: arrayRemove(currentUsername) });
      serverInfoModal.classList.add('hidden');
      appScreen.classList.remove('chat-open');
      currentServerId = null;
      showToast('Você saiu do servidor.');
    }
  }
});

// Adicionar Amigos
btnAddFriend.addEventListener('click', async () => {
  const friendUser = cleanUsername(friendUsernameInput.value);
  if (!friendUser) return;
  if (friendUser === currentUsername) { showToast('Você não pode adicionar a si mesmo.'); return; }

  btnAddFriend.disabled = true;
  try {
    const friendProfileSnap = await getDoc(doc(db, "profiles", friendUser));
    if (!friendProfileSnap.exists()) { showToast('Usuário não encontrado.'); return; }

    await setDoc(doc(db, "users", currentUsername, "friends", friendUser), { username: friendUser, addedAt: serverTimestamp() });
    await setDoc(doc(db, "users", friendUser, "friends", currentUsername), { username: currentUsername, addedAt: serverTimestamp() });

    friendUsernameInput.value = '';
    showToast(`@${friendUser} adicionado!`, 'success');
  } catch (err) {
    showToast('Erro ao adicionar amigo: ' + err.message);
  } finally {
    btnAddFriend.disabled = false;
  }
});

function carregarAmigos() {
  const friendsRef = collection(db, "users", currentUsername, "friends");
  onSnapshot(friendsRef, (snapshot) => {
    friendsList.innerHTML = '';
    snapshot.forEach(async (docSnap) => {
      const friendUser = docSnap.id;
      const pData = await getProfileCached(friendUser);
      const item = document.createElement('div');
      item.classList.add('friend-item');
      let avatarStyle = pData.avatarUrl ? `style="background-image: url('${pData.avatarUrl}')"` : '';
      let avatarContent = pData.avatarUrl ? '' : (pData.displayName || friendUser)[0].toUpperCase();

      item.innerHTML = `
        <div class="friend-avatar-wrapper">
          <div class="friend-avatar" ${avatarStyle}>${avatarContent}</div>
        </div>
        <div class="friend-details">
          <div class="friend-name">${pData.displayName || friendUser}</div>
          <div class="friend-last-msg">@${friendUser}</div>
        </div>
      `;
      item.addEventListener('click', () => abrirChatAmigo(friendUser, pData));
      friendsList.appendChild(item);
    });
  });
}

async function abrirChatAmigo(friendUser, pData) {
  targetUsername = friendUser;
  currentServerId = null;
  activeServerData = null;
  btnServerHeaderInfo.classList.add('hidden');

  chatTargetTitle.textContent = pData.displayName || friendUser;
  chatTargetHandle.textContent = `@${friendUser}`;
  if (pData.avatarUrl) {
    chatAvatar.style.backgroundImage = `url(${pData.avatarUrl})`;
    chatAvatar.textContent = '';
  } else {
    chatAvatar.style.backgroundImage = 'none';
    chatAvatar.textContent = (pData.displayName || friendUser)[0].toUpperCase();
  }

  appScreen.classList.add('chat-open');
  carregarMensagensChatPrivado(friendUser);
}

function carregarMensagensChatPrivado(friendUser) {
  chatMessages.innerHTML = '';
  const roomId = [currentUsername, friendUser].sort().join('_');
  const q = query(collection(db, "chats", roomId, "messages"), orderBy("timestamp", "asc"));
  if (unsubscribeMessages) unsubscribeMessages();

  unsubscribeMessages = onSnapshot(q, async (snapshot) => {
    chatMessages.innerHTML = '';
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      let name = data.senderDisplayName;
      let avatar = data.senderAvatar;

      if (!name || avatar === undefined) {
        const p = await getProfileCached(data.sender);
        name = p.displayName || data.sender;
        avatar = p.avatarUrl || '';
      }

      let hora = '';
      if (data.timestamp) {
        hora = data.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      const row = document.createElement('div');
      row.classList.add('chat-message-row');

      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'chat-msg-avatar';
      if (avatar) avatarDiv.style.backgroundImage = `url('${avatar}')`;
      else avatarDiv.textContent = name ? name[0].toUpperCase() : '?';

      const bodyDiv = document.createElement('div');
      bodyDiv.className = 'chat-msg-body';

      const headerDiv = document.createElement('div');
      headerDiv.className = 'chat-msg-header';
      const nameSpan = document.createElement('span');
      nameSpan.className = 'chat-msg-name';
      nameSpan.textContent = name;
      const timeSpan = document.createElement('span');
      timeSpan.className = 'chat-msg-time';
      timeSpan.textContent = hora;

      headerDiv.appendChild(nameSpan);
      headerDiv.appendChild(timeSpan);
      bodyDiv.appendChild(headerDiv);

      if (data.text) {
        await processarTextoComEmbeds(data.text, bodyDiv);
      }

      if (data.fileUrl) {
        const img = document.createElement('img');
        img.src = data.fileUrl;
        img.alt = 'Anexo';
        bodyDiv.appendChild(img);
      }

      row.appendChild(avatarDiv);
      row.appendChild(bodyDiv);
      chatMessages.appendChild(row);
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

// Envio de Mensagens
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  messageInput.value = '';

  const myProfile = await getProfileCached(currentUsername);

  if (currentServerId) {
    await addDoc(collection(db, "servers", currentServerId, "messages"), {
      text: text,
      fileUrl: null,
      sender: currentUsername,
      senderDisplayName: myProfile.displayName || currentUsername,
      senderAvatar: myProfile.avatarUrl || '',
      timestamp: serverTimestamp()
    });
  } else if (targetUsername) {
    const roomId = [currentUsername, targetUsername].sort().join('_');
    await addDoc(collection(db, "chats", roomId, "messages"), {
      text: text,
      fileUrl: null,
      sender: currentUsername,
      senderDisplayName: myProfile.displayName || currentUsername,
      senderAvatar: myProfile.avatarUrl || '',
      timestamp: serverTimestamp()
    });
  }
});

// Upload de Imagem/Arquivo no Chat
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (event) => {
    const fileUrl = event.target.result;
    const myProfile = await getProfileCached(currentUsername);

    if (currentServerId) {
      await addDoc(collection(db, "servers", currentServerId, "messages"), {
        text: '',
        fileUrl: fileUrl,
        sender: currentUsername,
        senderDisplayName: myProfile.displayName || currentUsername,
        senderAvatar: myProfile.avatarUrl || '',
        timestamp: serverTimestamp()
      });
    } else if (targetUsername) {
      const roomId = [currentUsername, targetUsername].sort().join('_');
      await addDoc(collection(db, "chats", roomId, "messages"), {
        text: '',
        fileUrl: fileUrl,
        sender: currentUsername,
        senderDisplayName: myProfile.displayName || currentUsername,
        senderAvatar: myProfile.avatarUrl || '',
        timestamp: serverTimestamp()
      });
    }
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});

