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
  getDocs,
  increment,
  runTransaction
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
let selectedBannerUrl = 'default';
let isLoginMode = false;
const profileCache = {};

// Controle de digitação
let typingTimeout = null;
let isTyping = false;
let typingListenersUnsubscribe = null;
let typingIndicatorText = document.getElementById('typingIndicatorText');

let selectedBannerColor = '#000000';
let editSelectedBannerColor = '#000000';
let roleSelectedColor = '#ffffff';

// Usuário alvo para moderação
let targetUserForModeration = null;

// Controle de mensagem para responder
let replyToMessage = null;
let replyToMessageId = null;

// Controle de reações
let activeReactionMessage = null;
let reactionTimeout = null;

// Admin check
const ADMIN_EMAIL = 'Eduardolp123444@gmail.com';
const ADMIN_PASSWORD = 'A7v-72fd9-019';
let isAdmin = false;

// Controle de swipe
let touchStartX = 0;
let touchStartY = 0;
let isSwiping = false;
let swipeMessageId = null;
let swipeMessageData = null;
let swipeRow = null;

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
  return { displayName: username, avatarUrl: '', bannerUrl: 'default' };
}

async function getUserRoles(serverId, username) {
  try {
    const snap = await getDoc(doc(db, "servers", serverId, "members", username));
    if (snap.exists()) {
      return snap.data().roles || [];
    }
  } catch (e) {}
  return [];
}

async function getUserRolesWithData(serverId, username) {
  const roleIds = await getUserRoles(serverId, username);
  if (!roleIds.length) return [];
  
  const roles = [];
  for (const roleId of roleIds) {
    const roleSnap = await getDoc(doc(db, "servers", serverId, "roles", roleId));
    if (roleSnap.exists()) {
      roles.push({ id: roleId, ...roleSnap.data() });
    }
  }
  return roles;
}

async function userHasPermission(serverId, username, permission) {
  const roles = await getUserRolesWithData(serverId, username);
  const serverData = await getDoc(doc(db, "servers", serverId));
  const isOwner = serverData.exists() && serverData.data().owner === username;
  
  if (isOwner) return true;
  
  for (const role of roles) {
    if (role.permissions && role.permissions[permission] === true) {
      return true;
    }
  }
  return false;
}

// ==================== SPLASH ====================
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
    checkAdminStatus();
  } else {
    authScreen.classList.remove('hidden');
    appScreen.classList.add('hidden');
  }
}

function checkAdminStatus() {
  const user = auth.currentUser;
  if (user && user.email) {
    if (user.email === ADMIN_EMAIL) {
      isAdmin = true;
      document.getElementById('btnAdminPanel').style.display = 'inline-flex';
    } else {
      isAdmin = false;
      document.getElementById('btnAdminPanel').style.display = 'none';
    }
  }
}

// ==================== DOM ELEMENTOS ====================
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
const btnOpenStore = document.getElementById('btnOpenStore');
const storeModal = document.getElementById('storeModal');
const btnCloseStoreModal = document.getElementById('btnCloseStoreModal');
const profileBannerPreview = document.getElementById('profileBannerPreview');
const storeItemsContainer = document.getElementById('storeItemsContainer');
const storeCoinsBalance = document.getElementById('storeCoinsBalance');

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
const coinsValue = document.getElementById('coinsValue');

// Modais
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
const userRolesSection = document.getElementById('userRolesSection');
const userRolesList = document.getElementById('userRolesList');
const moderationActions = document.getElementById('moderationActions');
const btnKickUser = document.getElementById('btnKickUser');
const btnBanUser = document.getElementById('btnBanUser');
const btnAssignRole = document.getElementById('btnAssignRole');
const giveStarsSection = document.getElementById('giveStarsSection');
const giveStarsContainer = document.getElementById('giveStarsContainer');

// Admin Panel
const adminPanelModal = document.getElementById('adminPanelModal');
const btnAdminPanel = document.getElementById('btnAdminPanel');
const btnCloseAdminPanel = document.getElementById('btnCloseAdminPanel');
const adminItemName = document.getElementById('adminItemName');
const adminItemUrl = document.getElementById('adminItemUrl');
const adminItemPrice = document.getElementById('adminItemPrice');
const btnAdminCreateItem = document.getElementById('btnAdminCreateItem');
const btnAdminRefreshItems = document.getElementById('btnAdminRefreshItems');
const adminItemsList = document.getElementById('adminItemsList');

// Servidores
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
const serverRolesList = document.getElementById('serverRolesList');
const btnCreateRole = document.getElementById('btnCreateRole');
const serverLevelText = document.getElementById('serverLevelText');
const serverStarsCount = document.getElementById('serverStarsCount');
const levelProgressFill = document.getElementById('levelProgressFill');
const levelProgressText = document.getElementById('levelProgressText');

// Role Modal
const roleModal = document.getElementById('roleModal');
const btnCloseRoleModal = document.getElementById('btnCloseRoleModal');
const roleModalTitle = document.getElementById('roleModalTitle');
const inputRoleName = document.getElementById('inputRoleName');
const btnSaveRole = document.getElementById('btnSaveRole');
const btnDeleteRole = document.getElementById('btnDeleteRole');
const previewColorRole = document.getElementById('previewColorRole');
const txtColorRole = document.getElementById('txtColorRole');
const btnTriggerColorRole = document.getElementById('btnTriggerColorRole');
const permSendMessage = document.getElementById('permSendMessage');
const permMentionRoles = document.getElementById('permMentionRoles');
const permTextEditor = document.getElementById('permTextEditor');
const permManageRoles = document.getElementById('permManageRoles');
const permKick = document.getElementById('permKick');
const permBan = document.getElementById('permBan');
const permDeleteAll = document.getElementById('permDeleteAll');
const permDeleteOwn = document.getElementById('permDeleteOwn');
const permSendImage = document.getElementById('permSendImage');
const permReply = document.getElementById('permReply');

// Assign Role Modal
const assignRoleModal = document.getElementById('assignRoleModal');
const btnCloseAssignRoleModal = document.getElementById('btnCloseAssignRoleModal');
const assignRoleList = document.getElementById('assignRoleList');

// Tooltips
const reactionTooltip = document.getElementById('reactionTooltip');
const reactionTooltipContent = document.getElementById('reactionTooltipContent');
const replyTooltip = document.getElementById('replyTooltip');
const btnReplyMessage = document.getElementById('btnReplyMessage');
const btnCopyMessage = document.getElementById('btnCopyMessage');
const btnDeleteMessage = document.getElementById('btnDeleteMessage');

// Crop
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

// ==================== TOAST ====================
function showToast(message, type = 'info') {
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'success' ? ' success' : '');
  el.textContent = message;
  toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ==================== AUTENTICAÇÃO ====================
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
    await carregarMoedas();
    carregarAmigos();
    carregarServidores();
    checkAdminStatus();
  } else {
    currentUsername = null;
    isAdmin = false;
    document.getElementById('btnAdminPanel').style.display = 'none';
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

  // Verificar login admin
  if (isLoginMode && email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return;
    } catch (e) {
      authError.textContent = 'Erro ao logar como admin.';
      return;
    }
  }

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
        uid: userCred.user.uid, pronouns: '', bio: '', avatarUrl: '', bannerUrl: 'default'
      });

      await setDoc(doc(db, "coins", uName), { money: 100 });
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

// ==================== MOEDAS ====================
async function carregarMoedas() {
  if (!currentUsername) return;
  try {
    const coinRef = doc(db, "coins", currentUsername);
    const coinSnap = await getDoc(coinRef);
    if (coinSnap.exists()) {
      coinsValue.textContent = coinSnap.data().money || 0;
    } else {
      await setDoc(coinRef, { money: 100 });
      coinsValue.textContent = '100';
    }
    onSnapshot(coinRef, (docSnap) => {
      if (docSnap.exists()) {
        const val = docSnap.data().money || 0;
        coinsValue.textContent = val;
        if (storeCoinsBalance) storeCoinsBalance.textContent = val;
      }
    });
  } catch (e) {
    console.error('Erro ao carregar moedas:', e);
  }
}

async function comprarItem(itemId, price) {
  if (!currentUsername) return false;
  try {
    const coinRef = doc(db, "coins", currentUsername);
    await runTransaction(db, async (transaction) => {
      const coinSnap = await transaction.get(coinRef);
      if (!coinSnap.exists()) throw new Error("Saldo não encontrado");
      const balance = coinSnap.data().money || 0;
      if (balance < price) throw new Error("Saldo insuficiente");
      transaction.update(coinRef, { money: increment(-price) });
      
      const purchasesRef = doc(db, "purchases", currentUsername);
      const purchasesSnap = await transaction.get(purchasesRef);
      if (purchasesSnap.exists()) {
        transaction.update(purchasesRef, { items: arrayUnion(itemId) });
      } else {
        transaction.set(purchasesRef, { items: [itemId] });
      }
    });
    showToast('Item comprado com sucesso!', 'success');
    return true;
  } catch (e) {
    showToast(e.message || 'Erro ao comprar item');
    return false;
  }
}

async function verificarCompra(itemId) {
  if (!currentUsername) return false;
  try {
    const snap = await getDoc(doc(db, "purchases", currentUsername));
    if (snap.exists()) {
      const items = snap.data().items || [];
      return items.includes(itemId);
    }
    return false;
  } catch {
    return false;
  }
}

// ==================== ADMIN PANEL ====================
btnAdminPanel.addEventListener('click', () => {
  if (!isAdmin) {
    showToast('Acesso negado. Você não é administrador.');
    return;
  }
  adminPanelModal.classList.remove('hidden');
  carregarItemsAdmin();
});

btnCloseAdminPanel.addEventListener('click', () => {
  adminPanelModal.classList.add('hidden');
});

async function carregarItemsAdmin() {
  try {
    const itemsSnap = await getDocs(collection(db, "store_items"));
    adminItemsList.innerHTML = '';
    if (itemsSnap.empty) {
      adminItemsList.innerHTML = '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:10px;">Nenhum item na loja.</div>';
      return;
    }
    for (const docSnap of itemsSnap.docs) {
      const item = docSnap.data();
      const itemId = docSnap.id;
      const div = document.createElement('div');
      div.style.cssText = "display:flex;justify-content:space-between;align-items:center;background:var(--bg-card);padding:6px 10px;border-radius:8px;";
      div.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;flex:1;overflow:hidden;">
          <div style="width:30px;height:30px;border-radius:4px;background-size:cover;background-position:center;background-image:url('${item.imageUrl || ''}');flex-shrink:0;"></div>
          <div style="flex:1;overflow:hidden;">
            <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name || 'Sem nome'}</div>
            <div style="font-size:11px;color:var(--text-muted);">💰 ${item.price || 0} moedas</div>
          </div>
        </div>
        <button class="btn" style="padding:4px 10px;font-size:10px;background:#ff1744;" data-delete="${itemId}">✕</button>
      `;
      const deleteBtn = div.querySelector('[data-delete]');
      deleteBtn.addEventListener('click', async () => {
        if (confirm(`Excluir "${item.name || 'item'}" permanentemente?`)) {
          await deleteDoc(doc(db, "store_items", itemId));
          showToast('Item excluído!', 'success');
          carregarItemsAdmin();
        }
      });
      adminItemsList.appendChild(div);
    }
  } catch (e) {
    showToast('Erro ao carregar itens: ' + e.message);
  }
}

btnAdminCreateItem.addEventListener('click', async () => {
  const name = adminItemName.value.trim();
  const imageUrl = adminItemUrl.value.trim();
  const price = parseInt(adminItemPrice.value);

  if (!name) { showToast('Digite um nome para o item.'); return; }
  if (!imageUrl) { showToast('Digite a URL da imagem.'); return; }
  if (!price || price < 1) { showToast('Digite um preço válido.'); return; }

  try {
    await addDoc(collection(db, "store_items"), {
      name: name,
      imageUrl: imageUrl,
      price: price,
      type: 'banner',
      createdAt: serverTimestamp()
    });
    showToast('Item criado com sucesso!', 'success');
    adminItemName.value = '';
    adminItemUrl.value = '';
    adminItemPrice.value = '';
    carregarItemsAdmin();
  } catch (e) {
    showToast('Erro ao criar item: ' + e.message);
  }
});

btnAdminRefreshItems.addEventListener('click', carregarItemsAdmin);

// ==================== LOJA ====================
async function carregarLoja() {
  if (!currentUsername) return;
  
  const coinSnap = await getDoc(doc(db, "coins", currentUsername));
  if (coinSnap.exists()) {
    storeCoinsBalance.textContent = coinSnap.data().money || 0;
  }

  // Itens fixos da loja (efeitos de texto)
  const fixedItems = [
    { id: 'rainbow_effect', name: '🌈 Efeito Rainbow', price: 526, type: 'rainbow', imageUrl: '🌈' },
    { id: 'gradient_effect', name: '🎨 Efeito Degrade', price: 273, type: 'gradient', imageUrl: '🎨' }
  ];

  // Carregar itens do Firebase
  const itemsSnap = await getDocs(query(collection(db, "store_items"), orderBy("price", "asc")));
  
  storeItemsContainer.innerHTML = '';
  
  const purchasesSnap = await getDoc(doc(db, "purchases", currentUsername));
  const purchasedItems = purchasesSnap.exists() ? (purchasesSnap.data().items || []) : [];

  // Mostrar itens fixos primeiro
  for (const item of fixedItems) {
    const isOwned = purchasedItems.includes(item.id);
    const div = document.createElement('div');
    div.className = 'store-banner-option' + (isOwned ? ' owned' : '');
    
    div.innerHTML = `
      <div class="store-banner-preview" style="background:linear-gradient(135deg,#ff6b6b,#f9a825,#4d96ff);display:flex;align-items:center;justify-content:center;font-size:20px;">${item.imageUrl}</div>
      <div class="store-banner-info">
        <span style="font-weight:700;font-size:13px;">${item.name}</span>
        <span class="price">${isOwned ? '✅ Adquirido' : `${item.price} ⭐`}</span>
      </div>
      <button class="btn" style="padding:6px 12px;font-size:11px;" ${isOwned ? 'disabled' : ''}>
        ${isOwned ? 'Usar' : 'Comprar'}
      </button>
    `;

    const btn = div.querySelector('button');
    if (!isOwned) {
      btn.addEventListener('click', async () => {
        const success = await comprarItem(item.id, item.price);
        if (success) {
          carregarLoja();
        }
      });
    } else {
      btn.addEventListener('click', async () => {
        // Aplicar efeito
        await setDoc(doc(db, "profiles", currentUsername), { 
          textEffect: item.type,
          textEffectData: { type: item.type }
        }, { merge: true });
        showToast(`Efeito ${item.name} aplicado!`, 'success');
        storeModal.classList.add('hidden');
      });
    }

    storeItemsContainer.appendChild(div);
  }

  // Separador
  const separator = document.createElement('div');
  separator.style.cssText = "width:100%;height:1px;background:var(--border-color);margin:4px 0;";
  storeItemsContainer.appendChild(separator);

  // Itens do Firebase (banners)
  if (itemsSnap.empty) {
    const empty = document.createElement('div');
    empty.style.cssText = "color:var(--text-muted);text-align:center;padding:10px;font-size:13px;";
    empty.textContent = 'Nenhum banner disponível.';
    storeItemsContainer.appendChild(empty);
    return;
  }

  for (const docSnap of itemsSnap.docs) {
    const item = docSnap.data();
    const itemId = docSnap.id;
    const isOwned = purchasedItems.includes(itemId);

    const div = document.createElement('div');
    div.className = 'store-banner-option' + (isOwned ? ' owned' : '');
    
    const previewStyle = item.imageUrl ? `background-image: url('${item.imageUrl}')` : 'background: linear-gradient(135deg, #333, #666)';
    
    div.innerHTML = `
      <div class="store-banner-preview" style="${previewStyle}"></div>
      <div class="store-banner-info">
        <span style="font-weight:700;font-size:13px;">${item.name || 'Banner'}</span>
        <span class="price">${isOwned ? '✅ Adquirido' : `${item.price || 0} ⭐`}</span>
      </div>
      <button class="btn" style="padding:6px 12px;font-size:11px;" ${isOwned ? 'disabled' : ''}>
        ${isOwned ? 'Usar' : 'Comprar'}
      </button>
    `;

    const btn = div.querySelector('button');
    if (!isOwned) {
      btn.addEventListener('click', async () => {
        const price = parseInt(item.price || 0);
        const success = await comprarItem(itemId, price);
        if (success) {
          carregarLoja();
        }
      });
    } else {
      btn.addEventListener('click', async () => {
        await setDoc(doc(db, "profiles", currentUsername), { 
          bannerUrl: item.imageUrl 
        }, { merge: true });
        profileCache[currentUsername] = null;
        aplicarBannerNaVisualizacao(item.imageUrl, profileBannerPreview);
        showToast('Banner aplicado!', 'success');
        storeModal.classList.add('hidden');
      });
    }

    storeItemsContainer.appendChild(div);
  }
}

// ==================== BANNERS ====================
function aplicarBannerNaVisualizacao(bannerVal, el) {
  if (!el) return;
  if (bannerVal === 'default' || !bannerVal) {
    el.style.backgroundImage = 'none';
    el.style.background = 'linear-gradient(135deg, var(--accent-red), #400000)';
  } else {
    el.style.backgroundImage = `url('${bannerVal}')`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
  }
}

// ==================== PERFIL ====================
async function carregarMeuPerfil() {
  const profileRef = doc(db, "profiles", currentUsername);
  onSnapshot(profileRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      userDisplayName.textContent = data.displayName || currentUsername;
      userHandle.textContent = `@${currentUsername}`;
      selectedBannerUrl = data.bannerUrl || 'default';
      aplicarBannerNaVisualizacao(selectedBannerUrl, profileBannerPreview);

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

// ==================== CROP ====================
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

// ==================== MODAL PERFIL ====================
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
  aplicarBannerNaVisualizacao(data.bannerUrl || 'default', profileBannerPreview);
  userRolesSection.style.display = 'none';
  moderationActions.style.display = 'none';
  giveStarsSection.style.display = 'none';

  if (data.avatarUrl) {
    modalAvatarPreview.style.backgroundImage = `url(${data.avatarUrl})`;
    modalAvatarPreview.textContent = '';
  } else {
    modalAvatarPreview.style.backgroundImage = 'none';
    modalAvatarPreview.textContent = currentUsername[0].toUpperCase();
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
      bio: editBio.value.trim(),
      bannerUrl: selectedBannerUrl
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

// ==================== ABRIR PERFIL DE OUTRO USUÁRIO ====================
async function abrirPerfilUsuario(username) {
  if (!username || username === currentUsername) return;
  targetUserForModeration = username;
  
  const profileSnap = await getDoc(doc(db, "profiles", username));
  const data = profileSnap.data() || {};
  
  profileModalTitle.textContent = `@${username}`;
  btnSaveProfile.classList.add('hidden');
  modalAvatarEditOverlay.classList.add('hidden');
  editDisplayName.classList.add('hidden');
  editPronouns.classList.add('hidden');
  editBio.classList.add('hidden');
  viewDisplayName.classList.remove('hidden');
  viewPronouns.classList.remove('hidden');
  viewBio.classList.remove('hidden');
  viewDisplayName.textContent = data.displayName || username;
  viewPronouns.textContent = data.pronouns || 'Não informado';
  viewBio.textContent = data.bio || 'Sem biografia.';
  aplicarBannerNaVisualizacao(data.bannerUrl || 'default', profileBannerPreview);

  if (data.avatarUrl) {
    modalAvatarPreview.style.backgroundImage = `url(${data.avatarUrl})`;
    modalAvatarPreview.textContent = '';
  } else {
    modalAvatarPreview.style.backgroundImage = 'none';
    modalAvatarPreview.textContent = username[0].toUpperCase();
  }

  // Verificar se está em um servidor
  if (currentServerId) {
    const isMember = await verificarMembroServidor(currentServerId, username);
    if (isMember) {
      const userRoles = await getUserRolesWithData(currentServerId, username);
      if (userRoles.length > 0) {
        userRolesSection.style.display = 'flex';
        userRolesList.innerHTML = userRoles.map(r => 
          `<span class="role-item" style="color:${r.color || '#ffffff'};">● ${r.name}</span>`
        ).join('');
      } else {
        userRolesSection.style.display = 'flex';
        userRolesList.innerHTML = '<span style="font-size:12px;color:var(--text-muted);">Nenhum cargo</span>';
      }

      // Verificar permissões do usuário atual
      const canKick = await userHasPermission(currentServerId, currentUsername, 'kick');
      const canBan = await userHasPermission(currentServerId, currentUsername, 'ban');
      const canManageRoles = await userHasPermission(currentServerId, currentUsername, 'manageRoles');
      const isOwner = activeServerData && activeServerData.owner === currentUsername;

      if ((canKick || canBan || canManageRoles || isOwner) && username !== currentUsername) {
        moderationActions.style.display = 'flex';
        btnKickUser.style.display = canKick || isOwner ? 'inline-flex' : 'none';
        btnBanUser.style.display = canBan || isOwner ? 'inline-flex' : 'none';
        btnAssignRole.style.display = canManageRoles || isOwner ? 'inline-flex' : 'none';
      } else {
        moderationActions.style.display = 'none';
      }

      // Mostrar opção de dar Astros (para o servidor, não para o usuário)
      giveStarsSection.style.display = 'flex';
      giveStarsContainer.innerHTML = '';
      const starOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      for (const stars of starOptions) {
        const price = stars * 10;
        const btn = document.createElement('button');
        btn.className = 'btn starcord-btn';
        btn.style.cssText = `padding:4px 10px;font-size:10px;background:${stars >= 5 ? '#f9a825' : '#ff6b6b'};`;
        btn.textContent = `${stars}⭐ | ${price}💰`;
        btn.addEventListener('click', async () => {
          await darAstrosParaServidor(stars);
        });
        giveStarsContainer.appendChild(btn);
      }
    } else {
      userRolesSection.style.display = 'none';
      moderationActions.style.display = 'none';
      giveStarsSection.style.display = 'none';
    }
  } else {
    userRolesSection.style.display = 'none';
    moderationActions.style.display = 'none';
    giveStarsSection.style.display = 'none';
  }

  profileModal.classList.remove('hidden');
}

// ==================== ASTROS ====================
async function darAstrosParaServidor(quantidade) {
  if (!currentServerId) return;
  const price = quantidade * 10;
  
  try {
    const coinRef = doc(db, "coins", currentUsername);
    await runTransaction(db, async (transaction) => {
      const coinSnap = await transaction.get(coinRef);
      if (!coinSnap.exists()) throw new Error("Saldo não encontrado");
      const balance = coinSnap.data().money || 0;
      if (balance < price) throw new Error("Saldo insuficiente");
      transaction.update(coinRef, { money: increment(-price) });
      
      // Adicionar astros ao servidor
      const serverRef = doc(db, "servers", currentServerId);
      const serverSnap = await transaction.get(serverRef);
      if (!serverSnap.exists()) throw new Error("Servidor não encontrado");
      const currentStars = serverSnap.data().stars || 0;
      transaction.update(serverRef, { 
        stars: currentStars + quantidade,
        // Atualizar nível baseado nos astros
        level: getLevelFromStars(currentStars + quantidade).level
      });
    });
    showToast(`${quantidade} Astros dados ao servidor! ⭐`, 'success');
    atualizarNivelServidor();
    carregarMoedas();
  } catch (e) {
    showToast(e.message || 'Erro ao dar Astros');
  }
}

async function getServerStars(serverId) {
  try {
    const snap = await getDoc(doc(db, "servers", serverId));
    if (snap.exists()) {
      return snap.data().stars || 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

function getLevelFromStars(stars) {
  if (stars < 3) return { level: 1, nextLevel: 2, needed: 3, progress: stars / 3 };
  if (stars < 5) return { level: 2, nextLevel: 3, needed: 5, progress: stars / 5 };
  if (stars < 7) return { level: 3, nextLevel: 4, needed: 7, progress: stars / 7 };
  if (stars < 9) return { level: 4, nextLevel: 5, needed: 9, progress: stars / 9 };
  if (stars < 11) return { level: 5, nextLevel: 6, needed: 11, progress: stars / 11 };
  if (stars < 13) return { level: 6, nextLevel: 7, needed: 13, progress: stars / 13 };
  return { level: 7, nextLevel: 7, needed: 13, progress: 1 };
}

function getLevelBenefits(level) {
  const benefits = {
    1: ['📌 Banner Personalizado', '🎨 Cor do Banner'],
    2: ['🖼️ Galeria de Imagens', '✨ Ícone GIF'],
    3: ['🌈 Cargos com Degrade', '🔤 Fontes Diferentes'],
    4: ['🏷️ Tags do Servidor', '📊 Mais Slots'],
    5: ['🌟 Emojis Personalizados', '🎵 Integração'],
    6: ['👑 Título Exclusivo', '💎 Benefícios VIP'],
    7: ['🚀 Todos os Benefícios', '⭐ Mega Boost']
  };
  return benefits[level] || ['📌 Benefício Básico'];
}

async function atualizarNivelServidor() {
  if (!currentServerId) return;
  const stars = await getServerStars(currentServerId);
  const levelInfo = getLevelFromStars(stars);
  
  serverLevelText.textContent = `Level ${levelInfo.level}`;
  serverStarsCount.textContent = `${stars} Astros`;
  levelProgressFill.style.width = `${levelInfo.progress * 100}%`;
  levelProgressText.textContent = `${stars} / ${levelInfo.needed} Astros para Level ${levelInfo.nextLevel}`;
  
  // Atualizar nível no Firestore
  await updateDoc(doc(db, "servers", currentServerId), {
    level: levelInfo.level
  }).catch(() => {});
}

btnOpenTargetProfile.addEventListener('click', () => {
  if (currentServerId && activeServerData) {
    abrirModalInfoServidor();
  } else if (targetUsername) {
    abrirPerfilUsuario(targetUsername);
  }
});

// ==================== MODERAÇÃO ====================
btnKickUser.addEventListener('click', async () => {
  if (!targetUserForModeration || !currentServerId) return;
  if (confirm(`Expulsar @${targetUserForModeration} do servidor?`)) {
    try {
      await updateDoc(doc(db, "servers", currentServerId), {
        members: arrayRemove(targetUserForModeration)
      });
      await deleteDoc(doc(db, "servers", currentServerId, "members", targetUserForModeration));
      showToast(`@${targetUserForModeration} foi expulso.`);
      profileModal.classList.add('hidden');
      abrirModalInfoServidor();
    } catch (e) {
      showToast('Erro ao expulsar: ' + e.message);
    }
  }
});

btnBanUser.addEventListener('click', async () => {
  if (!targetUserForModeration || !currentServerId) return;
  if (confirm(`Banir @${targetUserForModeration} do servidor?`)) {
    try {
      await updateDoc(doc(db, "servers", currentServerId), {
        members: arrayRemove(targetUserForModeration),
        banned: arrayUnion(targetUserForModeration)
      });
      await deleteDoc(doc(db, "servers", currentServerId, "members", targetUserForModeration));
      showToast(`@${targetUserForModeration} foi banido.`);
      profileModal.classList.add('hidden');
      abrirModalInfoServidor();
    } catch (e) {
      showToast('Erro ao banir: ' + e.message);
    }
  }
});

btnAssignRole.addEventListener('click', () => {
  if (!targetUserForModeration || !currentServerId) return;
  abrirModalAtribuirCargo(targetUserForModeration);
});

// ==================== ATRIBUIR CARGO ====================
async function abrirModalAtribuirCargo(username) {
  assignRoleList.innerHTML = '';
  assignRoleModal.classList.remove('hidden');

  try {
    const rolesSnap = await getDocs(collection(db, "servers", currentServerId, "roles"));
    const userRoles = await getUserRoles(currentServerId, username);

    if (rolesSnap.empty) {
      assignRoleList.innerHTML = '<div style="color:var(--text-muted);font-size:13px;text-align:center;">Nenhum cargo disponível.</div>';
      return;
    }

    for (const docSnap of rolesSnap.docs) {
      const role = docSnap.data();
      const roleId = docSnap.id;
      const hasRole = userRoles.includes(roleId);

      const div = document.createElement('div');
      div.style.cssText = "display:flex;justify-content:space-between;align-items:center;background:var(--bg-card);padding:8px 12px;border-radius:8px;";
      div.innerHTML = `
        <span style="color:${role.color || '#ffffff'};font-weight:500;font-size:13px;">${role.name}</span>
        <button class="btn starcord-btn" style="padding:4px 12px;font-size:11px;background:${hasRole ? '#ff1744' : '#23c268'};">
          ${hasRole ? 'Remover' : 'Adicionar'}
        </button>
      `;

      const btn = div.querySelector('button');
      btn.addEventListener('click', async () => {
        try {
          const memberRef = doc(db, "servers", currentServerId, "members", username);
          const currentRoles = await getUserRoles(currentServerId, username);
          let newRoles;
          if (currentRoles.includes(roleId)) {
            newRoles = currentRoles.filter(id => id !== roleId);
          } else {
            newRoles = [...currentRoles, roleId];
          }
          await setDoc(memberRef, { roles: newRoles }, { merge: true });
          showToast(`Cargo ${hasRole ? 'removido' : 'adicionado'}!`, 'success');
          abrirModalAtribuirCargo(username);
        } catch (e) {
          showToast('Erro: ' + e.message);
        }
      });

      assignRoleList.appendChild(div);
    }
  } catch (e) {
    showToast('Erro ao carregar cargos: ' + e.message);
  }
}

btnCloseAssignRoleModal.addEventListener('click', () => {
  assignRoleModal.classList.add('hidden');
});

// ==================== SERVIDORES ====================
function verificarMembroServidor(serverId, username) {
  return new Promise(async (resolve) => {
    const snap = await getDoc(doc(db, "servers", serverId));
    if (snap.exists() && snap.data().members.includes(username)) {
      const banned = snap.data().banned || [];
      if (banned.includes(username)) {
        resolve(false);
        return;
      }
      resolve(true);
    } else {
      resolve(false);
    }
  });
}

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
      banned: [],
      stars: 0,
      level: 1,
      tags: [],
      createdAt: serverTimestamp()
    });

    await setDoc(doc(db, "servers", serverRef.id, "members", currentUsername), {
      roles: []
    });

    await setDoc(doc(db, "servers", serverRef.id, "roles", "everyone"), {
      name: "@todos",
      color: "#ffffff",
      permissions: {
        sendMessage: true,
        mentionRoles: false,
        textEditor: false,
        manageRoles: false,
        kick: false,
        ban: false,
        deleteAll: false,
        deleteOwn: true,
        sendImage: true,
        reply: true
      },
      isDefault: true
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
  showToast('Link copiado!', 'success');
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
        <button class="btn starcord-btn" style="padding:6px 12px; font-size:11px;">Convidar</button>
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
        const banned = sData.banned || [];
        if (banned.includes(currentUsername)) return;
        
        const item = document.createElement('div');
        item.classList.add('server-item');
        let avatarStyle = sData.iconUrl ? `style="background-image: url('${sData.iconUrl}')"` : '';
        let avatarContent = sData.iconUrl ? '' : sData.name[0].toUpperCase();

        item.innerHTML = `
          <div class="server-avatar" ${avatarStyle}>${avatarContent}</div>
          <div class="server-details">
            <div class="server-name">${sData.name}</div>
            <div class="server-sub">⭐ Level ${sData.level || 1} • ${sData.members.length} membros</div>
          </div>
        `;
        item.addEventListener('click', () => abrirServidorChat(sId));
        serversList.appendChild(item);
      }
    });
  });
}

// ==================== CHAT ====================
async function abrirServidorChat(serverId) {
  currentServerId = serverId;
  targetUsername = null;
  btnServerHeaderInfo.classList.remove('hidden');

  const sSnap = await getDoc(doc(db, "servers", serverId));
  if (!sSnap.exists()) return;
  
  // Verificar se o usuário está banido
  const banned = sSnap.data().banned || [];
  if (banned.includes(currentUsername)) {
    showToast('Você foi banido deste servidor.');
    return;
  }
  
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
  setupTypingSystem();
  atualizarNivelServidor();
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
  setupTypingSystem();
}

// ==================== PROCESSAR TEXTO COM EFEITOS ====================
async function processarTextoComEmbeds(text, bodyDiv, userRoles = []) {
  if (!text) return;
  
  const textDiv = document.createElement('div');
  textDiv.className = 'chat-msg-text';

  let processedText = text;
  
  // Efeitos de texto (comprados)
  const profileSnap = await getDoc(doc(db, "profiles", currentUsername));
  const profileData = profileSnap.data();
  const textEffect = profileData?.textEffect || '';
  const textEffectData = profileData?.textEffectData || {};

  if (textEffect === 'rainbow') {
    processedText = `<span class="text-rainbow">${processedText}</span>`;
  } else if (textEffect === 'gradient') {
    const colors = textEffectData.colors || ['#ff6b6b', '#ee5a24', '#f9a825'];
    const gradient = `linear-gradient(135deg, ${colors.join(', ')})`;
    processedText = `<span class="text-gradient" style="background:${gradient};-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${processedText}</span>`;
  }

  // Processar # ## ### (se tiver permissão)
  const canUseEditor = await userHasPermission(currentServerId, currentUsername, 'textEditor');
  if (canUseEditor || !currentServerId) {
    const lines = processedText.split('\n');
    let processed = [];
    for (const line of lines) {
      if (line.startsWith('### ')) {
        processed.push(`<h3>${line.substring(4)}</h3>`);
      } else if (line.startsWith('## ')) {
        processed.push(`<h2>${line.substring(3)}</h2>`);
      } else if (line.startsWith('# ')) {
        processed.push(`<h1>${line.substring(2)}</h1>`);
      } else {
        processed.push(line);
      }
    }
    processedText = processed.join('\n');
  }

  // Processar menções de cargo
  if (currentServerId) {
    const rolesSnap = await getDocs(collection(db, "servers", currentServerId, "roles"));
    const rolesMap = {};
    rolesSnap.forEach(docSnap => {
      const role = docSnap.data();
      rolesMap[role.name.replace('@', '')] = role.color || '#ffffff';
    });

    for (const [roleName, color] of Object.entries(rolesMap)) {
      const regex = new RegExp(`@${roleName}\\b`, 'g');
      processedText = processedText.replace(regex, 
        `<span class="role-mention" style="color:${color};">@${roleName}</span>`);
    }
  }

  // Processar convites
  const inviteRegex = /starcord\.gg\/([a-zA-Z0-9]+)/g;
  let lastIdx = 0;
  let match;
  let tempText = processedText;
  const parts = [];

  while ((match = inviteRegex.exec(tempText)) !== null) {
    if (match.index > lastIdx) {
      parts.push({ type: 'text', content: tempText.substring(lastIdx, match.index) });
    }
    parts.push({ type: 'invite', code: match[1], full: match[0] });
    lastIdx = inviteRegex.lastIndex;
  }
  if (lastIdx < tempText.length) {
    parts.push({ type: 'text', content: tempText.substring(lastIdx) });
  }

  if (parts.length === 0) {
    textDiv.innerHTML = tempText;
  } else {
    for (const part of parts) {
      if (part.type === 'text') {
        const span = document.createElement('span');
        span.innerHTML = part.content;
        textDiv.appendChild(span);
      } else if (part.type === 'invite') {
        const linkSpan = document.createElement('span');
        linkSpan.style.color = "var(--accent-red)";
        linkSpan.style.fontWeight = "600";
        linkSpan.textContent = part.full;
        textDiv.appendChild(linkSpan);

        try {
          const q = query(collection(db, "servers"), where("inviteCode", "==", part.code));
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
                    <div class="invite-embed-name">${sData.name} <span style="color:#23c268; font-size:12px;">✔</span></div>
                    <div class="invite-embed-members">⭐ ${sData.level || 1} • ${sData.members ? sData.members.length : 1} membros</div>
                  </div>
                </div>
                <div class="invite-embed-desc-text">${sData.description || 'Servidor da comunidade Starcord.'}</div>
                <button class="invite-embed-join-btn">Ir para o Servidor</button>
              </div>
            `;

            const joinBtn = embedCard.querySelector('.invite-embed-join-btn');
            joinBtn.addEventListener('click', async () => {
              if (!sData.members.includes(currentUsername)) {
                const banned = sData.banned || [];
                if (banned.includes(currentUsername)) {
                  showToast('Você está banido deste servidor.');
                  return;
                }
                await updateDoc(doc(db, "servers", sId), {
                  members: arrayUnion(currentUsername)
                });
                await setDoc(doc(db, "servers", sId, "members", currentUsername), {
                  roles: []
                }, { merge: true });
                showToast(`Você entrou em ${sData.name}!`, 'success');
              }
              abrirServidorChat(sId);
            });
          } else {
            embedCard.innerHTML = `
              <div class="invite-embed-banner" style="background-color: #ff4d4d;"></div>
              <div class="invite-embed-body">
                <div class="invite-embed-name" style="color: #ff4d4d;">Convite Inválido</div>
                <div class="invite-embed-desc-text">O link <b>starcord.gg/${part.code}</b> não existe.</div>
              </div>
            `;
          }
          textDiv.appendChild(embedCard);
        } catch(err) {
          console.error(err);
        }
      }
    }
  }

  bodyDiv.appendChild(textDiv);
}

// ==================== REAÇÕES ====================
async function addReaction(messageId, emoji) {
  if (!currentServerId) return;
  const ref = doc(db, "servers", currentServerId, "messages", messageId);
  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists()) return;
      const reactions = snap.data().reactions || {};
      if (!reactions[emoji]) {
        reactions[emoji] = { count: 0, users: [] };
      }
      if (reactions[emoji].users.includes(currentUsername)) {
        reactions[emoji].count--;
        reactions[emoji].users = reactions[emoji].users.filter(u => u !== currentUsername);
        if (reactions[emoji].count <= 0) {
          delete reactions[emoji];
        }
      } else {
        reactions[emoji].count++;
        reactions[emoji].users.push(currentUsername);
      }
      transaction.update(ref, { reactions });
    });
  } catch (e) {
    console.error('Erro ao reagir:', e);
  }
}

function renderReactions(messageId, reactions) {
  if (!reactions || Object.keys(reactions).length === 0) return '';
  let html = '<div class="message-reactions">';
  for (const [emoji, data] of Object.entries(reactions)) {
    if (data.count > 0) {
      html += `<span class="message-reaction" data-msgid="${messageId}" data-emoji="${emoji}">${emoji} <span class="count">${data.count}</span></span>`;
    }
  }
  html += '</div>';
  return html;
}

// ==================== CARREGAR MENSAGENS (SEM DELAY) ====================
function carregarMensagensServidor(serverId) {
  chatMessages.innerHTML = '';
  const q = query(collection(db, "servers", serverId, "messages"), orderBy("timestamp", "asc"));
  if (unsubscribeMessages) unsubscribeMessages();

  unsubscribeMessages = onSnapshot(q, async (snapshot) => {
    // Limpar e recarregar tudo de uma vez
    chatMessages.innerHTML = '';
    const fragment = document.createDocumentFragment();
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const msgId = docSnap.id;
      let name = data.senderDisplayName;
      let avatar = data.senderAvatar;

      if (!name || avatar === undefined) {
        const p = await getProfileCached(data.sender);
        name = p.displayName || data.sender;
        avatar = p.avatarUrl || '';
      }

      const userRoles = await getUserRolesWithData(serverId, data.sender);
      const roleColor = userRoles.length > 0 ? userRoles[0].color : null;

      let hora = '';
      if (data.timestamp) {
        hora = data.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      const row = document.createElement('div');
      row.classList.add('chat-message-row');
      row.dataset.msgid = msgId;

      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'chat-msg-avatar';
      if (avatar) avatarDiv.style.backgroundImage = `url('${avatar}')`;
      else avatarDiv.textContent = name ? name[0].toUpperCase() : '?';
      avatarDiv.addEventListener('click', () => abrirPerfilUsuario(data.sender));

      const bodyDiv = document.createElement('div');
      bodyDiv.className = 'chat-msg-body';

      if (data.replyTo) {
        const replyDiv = document.createElement('div');
        replyDiv.className = 'message-reply-indicator';
        const replyMsg = data.replyTo;
        replyDiv.innerHTML = `<span class="reply-sender">@${replyMsg.sender}</span> → ${replyMsg.text || '[arquivo]'}`;
        bodyDiv.appendChild(replyDiv);
      }

      const headerDiv = document.createElement('div');
      headerDiv.className = 'chat-msg-header';
      const nameSpan = document.createElement('span');
      nameSpan.className = 'chat-msg-name';
      nameSpan.textContent = name;
      if (roleColor) {
        nameSpan.style.color = roleColor;
      }
      nameSpan.addEventListener('click', () => abrirPerfilUsuario(data.sender));

      const timeSpan = document.createElement('span');
      timeSpan.className = 'chat-msg-time';
      timeSpan.textContent = hora;

      headerDiv.appendChild(nameSpan);
      headerDiv.appendChild(timeSpan);
      bodyDiv.appendChild(headerDiv);

      if (data.text) {
        await processarTextoComEmbeds(data.text, bodyDiv, userRoles);
      }

      if (data.fileUrl) {
        const img = document.createElement('img');
        img.src = data.fileUrl;
        img.alt = 'Anexo';
        bodyDiv.appendChild(img);
      }

      if (data.reactions) {
        const reactionsHtml = renderReactions(msgId, data.reactions);
        if (reactionsHtml) {
          const div = document.createElement('div');
          div.innerHTML = reactionsHtml;
          bodyDiv.appendChild(div.firstChild);
        }
      }

      row.appendChild(avatarDiv);
      row.appendChild(bodyDiv);
      
      // Configurar interações da mensagem
      setupMessageInteractions(row, msgId, data);
      
      fragment.appendChild(row);
    }
    
    chatMessages.appendChild(fragment);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

function setupMessageInteractions(row, msgId, data) {
  let pressTimer = null;
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;

  // Long press para tooltip de reações
  row.addEventListener('mousedown', () => {
    pressTimer = setTimeout(() => {
      showReactionTooltip(row, msgId);
    }, 500);
  });
  row.addEventListener('mouseup', () => { clearTimeout(pressTimer); });
  row.addEventListener('mouseleave', () => { clearTimeout(pressTimer); });

  // Touch para reações (double tap)
  let lastTap = 0;
  row.addEventListener('touchstart', (e) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      // Double tap - mostrar reações
      showReactionTooltip(row, msgId);
      lastTap = 0;
    } else {
      lastTap = now;
    }
    
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isSwiping = false;
  });

  // Swipe para responder
  row.addEventListener('touchmove', (e) => {
    const diffX = e.touches[0].clientX - touchStartX;
    const diffY = e.touches[0].clientY - touchStartY;
    
    if (Math.abs(diffX) > 30 && Math.abs(diffX) > Math.abs(diffY) && !isSwiping) {
      isSwiping = true;
      // Efeito visual de swipe
      row.style.transform = `translateX(${Math.min(diffX, 80)}px)`;
      row.style.transition = 'none';
      
      if (diffX > 60) {
        row.style.borderLeft = '3px solid var(--accent-red)';
        row.style.backgroundColor = 'var(--bg-hover)';
        // Responder a mensagem
        replyToMessage = data;
        replyToMessageId = msgId;
        messageInput.focus();
        messageInput.placeholder = `Respondendo a ${data.senderDisplayName || data.sender}...`;
        showToast('Respondendo a mensagem!', 'success');
      }
    }
  });

  row.addEventListener('touchend', () => {
    if (isSwiping) {
      row.style.transform = 'translateX(0px)';
      row.style.transition = 'transform 0.3s ease';
      row.style.borderLeft = 'none';
      row.style.backgroundColor = 'transparent';
    }
    isSwiping = false;
  });

  // Clique em reação
  row.querySelectorAll('.message-reaction').forEach(el => {
    el.addEventListener('click', async () => {
      const emoji = el.dataset.emoji;
      await addReaction(msgId, emoji);
    });
  });

  // Tooltip de ações (segurar para aparecer)
  row.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showReplyTooltip(row, msgId, data);
  });
}

function showReactionTooltip(row, msgId) {
  const rect = row.getBoundingClientRect();
  reactionTooltip.style.left = `${Math.max(10, rect.left + rect.width / 2 - 140)}px`;
  reactionTooltip.style.top = `${Math.max(10, rect.top - 60)}px`;
  reactionTooltip.classList.add('show');

  reactionTooltipContent.querySelectorAll('.reaction-emoji').forEach(btn => {
    btn.onclick = async () => {
      const emoji = btn.dataset.emoji;
      await addReaction(msgId, emoji);
      reactionTooltip.classList.remove('show');
    };
  });

  clearTimeout(reactionTimeout);
  reactionTimeout = setTimeout(() => {
    reactionTooltip.classList.remove('show');
  }, 5000);
}

function showReplyTooltip(row, msgId, data) {
  const rect = row.getBoundingClientRect();
  replyTooltip.style.left = `${Math.max(10, rect.left + rect.width / 2 - 100)}px`;
  replyTooltip.style.top = `${Math.max(10, rect.top - 50)}px`;
  replyTooltip.classList.add('show');

  btnReplyMessage.onclick = () => {
    replyToMessage = data;
    replyToMessageId = msgId;
    replyTooltip.classList.remove('show');
    messageInput.focus();
    messageInput.placeholder = `Respondendo a ${data.senderDisplayName || data.sender}...`;
  };

  btnCopyMessage.onclick = () => {
    navigator.clipboard.writeText(data.text || '');
    showToast('Mensagem copiada!', 'success');
    replyTooltip.classList.remove('show');
  };

  // Verificar permissão para excluir
  const canDeleteAll = userHasPermission(currentServerId, currentUsername, 'deleteAll');
  const canDeleteOwn = userHasPermission(currentServerId, currentUsername, 'deleteOwn') && data.sender === currentUsername;
  if (canDeleteAll || canDeleteOwn) {
    btnDeleteMessage.style.display = 'inline-flex';
    btnDeleteMessage.onclick = async () => {
      if (confirm('Excluir esta mensagem?')) {
        await deleteDoc(doc(db, "servers", currentServerId, "messages", msgId));
        showToast('Mensagem excluída!');
        replyTooltip.classList.remove('show');
      }
    };
  } else {
    btnDeleteMessage.style.display = 'none';
  }

  setTimeout(() => {
    replyTooltip.classList.remove('show');
  }, 8000);
}

function carregarMensagensChatPrivado(friendUser) {
  chatMessages.innerHTML = '';
  const roomId = [currentUsername, friendUser].sort().join('_');
  const q = query(collection(db, "chats", roomId, "messages"), orderBy("timestamp", "asc"));
  if (unsubscribeMessages) unsubscribeMessages();

  unsubscribeMessages = onSnapshot(q, async (snapshot) => {
    chatMessages.innerHTML = '';
    const fragment = document.createDocumentFragment();
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const msgId = docSnap.id;
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
      row.dataset.msgid = msgId;

      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'chat-msg-avatar';
      if (avatar) avatarDiv.style.backgroundImage = `url('${avatar}')`;
      else avatarDiv.textContent = name ? name[0].toUpperCase() : '?';
      avatarDiv.addEventListener('click', () => abrirPerfilUsuario(data.sender));

      const bodyDiv = document.createElement('div');
      bodyDiv.className = 'chat-msg-body';

      if (data.replyTo) {
        const replyDiv = document.createElement('div');
        replyDiv.className = 'message-reply-indicator';
        const replyMsg = data.replyTo;
        replyDiv.innerHTML = `<span class="reply-sender">@${replyMsg.sender}</span> → ${replyMsg.text || '[arquivo]'}`;
        bodyDiv.appendChild(replyDiv);
      }

      const headerDiv = document.createElement('div');
      headerDiv.className = 'chat-msg-header';
      const nameSpan = document.createElement('span');
      nameSpan.className = 'chat-msg-name';
      nameSpan.textContent = name;
      nameSpan.addEventListener('click', () => abrirPerfilUsuario(data.sender));

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
      
      // Configurar interações para chat privado também
      setupMessageInteractions(row, msgId, data);
      
      fragment.appendChild(row);
    }
    
    chatMessages.appendChild(fragment);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

// ==================== ENVIO DE MENSAGENS ====================
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  messageInput.value = '';
  messageInput.placeholder = 'Digite sua mensagem...';

  if (targetUsername) {
    const chatId = [currentUsername, targetUsername].sort().join('_');
    await setDoc(doc(db, "typing_status", chatId), {
      user: currentUsername,
      timestamp: serverTimestamp()
    });
  }

  const myProfile = await getProfileCached(currentUsername);

  if (currentServerId) {
    const canSend = await userHasPermission(currentServerId, currentUsername, 'sendMessage');
    if (!canSend) {
      showToast('Você não tem permissão para enviar mensagens.');
      return;
    }

    const msgData = {
      text: text,
      fileUrl: null,
      sender: currentUsername,
      senderDisplayName: myProfile.displayName || currentUsername,
      senderAvatar: myProfile.avatarUrl || '',
      timestamp: serverTimestamp()
    };

    if (replyToMessage) {
      msgData.replyTo = {
        sender: replyToMessage.sender,
        text: replyToMessage.text || '[arquivo]'
      };
      replyToMessage = null;
      replyToMessageId = null;
    }

    await addDoc(collection(db, "servers", currentServerId, "messages"), msgData);
  } else if (targetUsername) {
    const roomId = [currentUsername, targetUsername].sort().join('_');
    const msgData = {
      text: text,
      fileUrl: null,
      sender: currentUsername,
      senderDisplayName: myProfile.displayName || currentUsername,
      senderAvatar: myProfile.avatarUrl || '',
      timestamp: serverTimestamp()
    };

    if (replyToMessage) {
      msgData.replyTo = {
        sender: replyToMessage.sender,
        text: replyToMessage.text || '[arquivo]'
      };
      replyToMessage = null;
      replyToMessageId = null;
    }

    await addDoc(collection(db, "chats", roomId, "messages"), msgData);
  }
});

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (event) => {
    const fileUrl = event.target.result;
    const myProfile = await getProfileCached(currentUsername);

    if (currentServerId) {
      const canSend = await userHasPermission(currentServerId, currentUsername, 'sendImage');
      if (!canSend) {
        showToast('Você não tem permissão para enviar imagens.');
        return;
      }
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

// ==================== SISTEMA DE DIGITAÇÃO ====================
function setupTypingSystem() {
  const chatInput = messageInput;

  chatInput.addEventListener('input', () => {
    if (!targetUsername && !currentServerId) return;
    
    const chatId = targetUsername 
      ? [currentUsername, targetUsername].sort().join('_') 
      : `server_${currentServerId}`;

    const typingRef = doc(db, "typing_status", chatId);

    if (chatInput.value.trim().length > 0) {
      if (!isTyping) {
        isTyping = true;
        setDoc(typingRef, {
          user: currentUsername,
          timestamp: serverTimestamp()
        });
      }
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        isTyping = false;
        setDoc(typingRef, {
          user: currentUsername,
          timestamp: serverTimestamp()
        });
      }, 3000);
    } else {
      if (isTyping) {
        isTyping = false;
        clearTimeout(typingTimeout);
        setDoc(typingRef, {
          user: currentUsername,
          timestamp: serverTimestamp()
        });
      }
    }
  });

  function startListeningTyping() {
    if (typingListenersUnsubscribe) {
      typingListenersUnsubscribe();
      typingListenersUnsubscribe = null;
    }

    if (!targetUsername && !currentServerId) return;

    const chatId = targetUsername 
      ? [currentUsername, targetUsername].sort().join('_') 
      : `server_${currentServerId}`;

    const typingRef = doc(db, "typing_status", chatId);
    
    typingListenersUnsubscribe = onSnapshot(typingRef, (docSnap) => {
      if (!docSnap.exists()) {
        typingIndicatorText.textContent = '';
        return;
      }

      const data = docSnap.data();
      const typingUser = data.user;
      
      if (typingUser === currentUsername) {
        typingIndicatorText.textContent = '';
        return;
      }

      const now = Date.now();
      const typingTime = data.timestamp?.toDate?.()?.getTime() || 0;
      const isRecent = (now - typingTime) < 5000;

      if (isRecent && typingUser) {
        getProfileCached(typingUser).then(profile => {
          const displayName = profile.displayName || typingUser;
          typingIndicatorText.textContent = `${displayName} está digitando...`;
        });
      } else {
        typingIndicatorText.textContent = '';
      }
    });
  }

  if (targetUsername || currentServerId) {
    startListeningTyping();
  }

  const originalAbrirChat = abrirChatAmigo;
  const originalAbrirServer = abrirServidorChat;

  window.abrirChatAmigo = async function(friendUser, pData) {
    await originalAbrirChat(friendUser, pData);
    startListeningTyping();
  };

  window.abrirServidorChat = async function(serverId) {
    await originalAbrirServer(serverId);
    startListeningTyping();
  };
}

// ==================== AMIGOS ====================
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

// ==================== SERVER INFO MODAL ====================
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
  const serverLevel = activeServerData.level || 1;
  
  if (isOwner) {
    btnSaveServerEdit.classList.remove('hidden');
    editServerNameInput.classList.remove('hidden');
    editServerDescInput.classList.remove('hidden');
    
    // Banner personalizado (Level 1+)
    if (serverLevel >= 1) {
      editBannerColorSection.classList.remove('hidden');
    } else {
      editBannerColorSection.classList.add('hidden');
    }
    
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

  // Nível do servidor
  await atualizarNivelServidor();

  // Carregar cargos
  carregarCargosServidor(currentServerId);

  // Carregar membros
  serverMembersListContainer.innerHTML = '';
  for (const mUser of activeServerData.members) {
    const mProfile = await getProfileCached(mUser);
    const userRoles = await getUserRolesWithData(currentServerId, mUser);
    const roleColor = userRoles.length > 0 ? userRoles[0].color : null;

    const mRow = document.createElement('div');
    mRow.className = 'member-row';
    
    const avatarStyle = mProfile.avatarUrl ? `background-image:url('${mProfile.avatarUrl}')` : '';
    const avatarText = mProfile.avatarUrl ? '' : (mProfile.displayName || mUser)[0].toUpperCase();

    let actionHtml = '';
    const canKick = await userHasPermission(currentServerId, currentUsername, 'kick');
    const canBan = await userHasPermission(currentServerId, currentUsername, 'ban');
    
    if ((isOwner || canKick || canBan) && mUser !== currentUsername) {
      actionHtml = `
        <div style="display:flex; gap:4px;">
          ${canKick || isOwner ? `<button class="btn starcord-btn" style="background:#ff6b35; padding:4px 8px; font-size:10px;" data-kick="${mUser}">Expulsar</button>` : ''}
          ${canBan || isOwner ? `<button class="btn starcord-btn" style="background:#ff1744; padding:4px 8px; font-size:10px;" data-ban="${mUser}">Banir</button>` : ''}
        </div>
      `;
    } else if (mUser === activeServerData.owner) {
      actionHtml = `<span style="font-size:10px; color:var(--accent-red); font-weight:700;">👑 DONO</span>`;
    }

    // Tags do servidor (Level 4+)
    let tagsHtml = '';
    if (serverLevel >= 4 && activeServerData.tags && activeServerData.tags.length > 0) {
      const userTags = activeServerData.tags.filter(t => t.members && t.members.includes(mUser));
      if (userTags.length > 0) {
        tagsHtml = userTags.map(t => 
          `<span style="background:${t.color || '#4d96ff'};color:#fff;padding:1px 6px;border-radius:4px;font-size:9px;margin-left:4px;">${t.name}</span>`
        ).join('');
      }
    }

    mRow.innerHTML = `
      <div class="member-info" data-user="${mUser}">
        <div class="member-avatar-small" style="${avatarStyle}">${avatarText}</div>
        <span class="member-name-role" style="${roleColor ? `color:${roleColor};` : ''}">${mProfile.displayName || mUser}</span>
        ${tagsHtml}
        ${userRoles.length > 0 ? `<span style="font-size:10px;color:var(--text-muted);">${userRoles.map(r => r.name).join(', ')}</span>` : ''}
      </div>
      ${actionHtml}
    `;

    mRow.querySelector('.member-info').addEventListener('click', () => {
      abrirPerfilUsuario(mUser);
    });

    if (canKick || isOwner) {
      const kickBtn = mRow.querySelector('[data-kick]');
      if (kickBtn) {
        kickBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const user = kickBtn.dataset.kick;
          if (confirm(`Expulsar @${user}?`)) {
            await updateDoc(doc(db, "servers", currentServerId), { members: arrayRemove(user) });
            await deleteDoc(doc(db, "servers", currentServerId, "members", user));
            showToast(`@${user} expulso.`);
            abrirModalInfoServidor();
          }
        });
      }
    }
    if (canBan || isOwner) {
      const banBtn = mRow.querySelector('[data-ban]');
      if (banBtn) {
        banBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const user = banBtn.dataset.ban;
          if (confirm(`Banir @${user}?`)) {
            await updateDoc(doc(db, "servers", currentServerId), { 
              members: arrayRemove(user),
              banned: arrayUnion(user)
            });
            await deleteDoc(doc(db, "servers", currentServerId, "members", user));
            showToast(`@${user} banido.`);
            abrirModalInfoServidor();
          }
        });
      }
    }

    serverMembersListContainer.appendChild(mRow);
  }

  serverInfoModal.classList.remove('hidden');
}

// ==================== CARGOS DO SERVIDOR ====================
async function carregarCargosServidor(serverId) {
  serverRolesList.innerHTML = '';
  
  try {
    const rolesSnap = await getDocs(collection(db, "servers", serverId, "roles"));
    if (rolesSnap.empty) {
      serverRolesList.innerHTML = '<span style="font-size:12px;color:var(--text-muted);">Nenhum cargo criado.</span>';
      return;
    }

    for (const docSnap of rolesSnap.docs) {
      const role = docSnap.data();
      const roleId = docSnap.id;
      
      const div = document.createElement('div');
      div.className = 'role-item';
      div.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:4px 8px;";
      div.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="role-color-dot" style="background:${role.color || '#ffffff'};"></span>
          <span style="color:${role.color || '#ffffff'};font-weight:500;font-size:13px;">${role.name}</span>
          ${role.isDefault ? '<span style="font-size:10px;color:var(--text-muted);">(padrão)</span>' : ''}
        </div>
        <button class="btn starcord-btn" style="padding:2px 8px;font-size:10px;" data-roleid="${roleId}">${role.isDefault ? 'Editar Permissões' : 'Editar'}</button>
      `;

      const editBtn = div.querySelector('button');
      editBtn.addEventListener('click', () => abrirModalEditarCargo(roleId));

      serverRolesList.appendChild(div);
    }
  } catch (e) {
    console.error('Erro ao carregar cargos:', e);
  }
}

// ==================== CRIAR/EDITAR CARGO ====================
let editingRoleId = null;

btnCreateRole.addEventListener('click', () => {
  editingRoleId = null;
  roleModalTitle.textContent = 'Criar Cargo';
  inputRoleName.value = '';
  roleSelectedColor = '#ffffff';
  previewColorRole.style.backgroundColor = roleSelectedColor;
  txtColorRole.textContent = roleSelectedColor;
  permSendMessage.checked = true;
  permMentionRoles.checked = false;
  permTextEditor.checked = false;
  permManageRoles.checked = false;
  permKick.checked = false;
  permBan.checked = false;
  permDeleteAll.checked = false;
  permDeleteOwn.checked = true;
  permSendImage.checked = true;
  permReply.checked = true;
  btnDeleteRole.style.display = 'none';
  roleModal.classList.remove('hidden');
});

function abrirModalEditarCargo(roleId) {
  editingRoleId = roleId;
  roleModalTitle.textContent = roleId === 'everyone' ? 'Editar @todos' : 'Editar Cargo';
  
  getDoc(doc(db, "servers", currentServerId, "roles", roleId)).then((snap) => {
    if (snap.exists()) {
      const data = snap.data();
      inputRoleName.value = data.name || '';
      if (roleId !== 'everyone') {
        roleSelectedColor = data.color || '#ffffff';
        previewColorRole.style.backgroundColor = roleSelectedColor;
        txtColorRole.textContent = roleSelectedColor;
      } else {
        // @todos - só pode editar permissões
        inputRoleName.disabled = true;
      }
      permSendMessage.checked = data.permissions?.sendMessage || false;
      permMentionRoles.checked = data.permissions?.mentionRoles || false;
      permTextEditor.checked = data.permissions?.textEditor || false;
      permManageRoles.checked = data.permissions?.manageRoles || false;
      permKick.checked = data.permissions?.kick || false;
      permBan.checked = data.permissions?.ban || false;
      permDeleteAll.checked = data.permissions?.deleteAll || false;
      permDeleteOwn.checked = data.permissions?.deleteOwn || false;
      permSendImage.checked = data.permissions?.sendImage || false;
      permReply.checked = data.permissions?.reply || false;
      btnDeleteRole.style.display = roleId === 'everyone' ? 'none' : 'inline-flex';
      roleModal.classList.remove('hidden');
    }
  });
}

btnCloseRoleModal.addEventListener('click', () => { 
  roleModal.classList.add('hidden');
  inputRoleName.disabled = false;
});

btnSaveRole.addEventListener('click', async () => {
  const name = inputRoleName.value.trim();
  if (!name && editingRoleId !== 'everyone') { showToast('Digite um nome para o cargo.'); return; }

  const permissions = {
    sendMessage: permSendMessage.checked,
    mentionRoles: permMentionRoles.checked,
    textEditor: permTextEditor.checked,
    manageRoles: permManageRoles.checked,
    kick: permKick.checked,
    ban: permBan.checked,
    deleteAll: permDeleteAll.checked,
    deleteOwn: permDeleteOwn.checked,
    sendImage: permSendImage.checked,
    reply: permReply.checked
  };

  try {
    if (editingRoleId) {
      const updateData = { permissions };
      if (editingRoleId !== 'everyone') {
        updateData.name = name;
        updateData.color = roleSelectedColor;
      }
      await updateDoc(doc(db, "servers", currentServerId, "roles", editingRoleId), updateData);
      showToast('Cargo atualizado!', 'success');
    } else {
      const newRoleRef = doc(collection(db, "servers", currentServerId, "roles"));
      await setDoc(newRoleRef, {
        name: name,
        color: roleSelectedColor,
        permissions: permissions,
        isDefault: false
      });
      showToast('Cargo criado!', 'success');
    }
    roleModal.classList.add('hidden');
    inputRoleName.disabled = false;
    carregarCargosServidor(currentServerId);
  } catch (e) {
    showToast('Erro: ' + e.message);
  }
});

btnDeleteRole.addEventListener('click', async () => {
  if (!editingRoleId || editingRoleId === 'everyone') return;
  if (confirm('Excluir este cargo permanentemente?')) {
    try {
      await deleteDoc(doc(db, "servers", currentServerId, "roles", editingRoleId));
      const membersSnap = await getDocs(collection(db, "servers", currentServerId, "members"));
      for (const memberDoc of membersSnap.docs) {
        const memberData = memberDoc.data();
        if (memberData.roles && memberData.roles.includes(editingRoleId)) {
          await updateDoc(memberDoc.ref, {
            roles: arrayRemove(editingRoleId)
          });
        }
      }
      showToast('Cargo excluído!', 'success');
      roleModal.classList.add('hidden');
      carregarCargosServidor(currentServerId);
    } catch (e) {
      showToast('Erro: ' + e.message);
    }
  }
});

// ==================== SELEÇÃO DE CORES ====================
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
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
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
  if (max === min) { h = 0; } else {
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
  requestAnimationFrame(updatePickerUI);
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
  if (updateInput) pickerHexInput.value = hex;
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
pickerSatBox.addEventListener('pointermove', (e) => { if (isSatDragging) handleSatPointer(e); });
pickerSatBox.addEventListener('pointerup', () => { isSatDragging = false; });

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
pickerHueBar.addEventListener('pointermove', (e) => { if (isHueDragging) handleHuePointer(e); });
pickerHueBar.addEventListener('pointerup', () => { isHueDragging = false; });

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
  if (currentPickerCallback) currentPickerCallback(hex);
  customColorPickerModal.classList.add('hidden');
});

// ==================== TRIGGER DE CORES ====================
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

document.getElementById('btnTriggerColorRole').addEventListener('click', () => {
  openCustomColorPicker(roleSelectedColor, (hex) => {
    roleSelectedColor = hex;
    previewColorRole.style.backgroundColor = hex;
    txtColorRole.textContent = hex;
  });
});

// ==================== LOJA BOTÃO ====================
btnOpenStore.addEventListener('click', (e) => {
  e.stopPropagation();
  storeModal.classList.remove('hidden');
  carregarLoja();
});
btnCloseStoreModal.addEventListener('click', () => { storeModal.classList.add('hidden'); });

// ==================== BACK BUTTON ====================
btnBack.addEventListener('click', () => {
  appScreen.classList.remove('chat-open');
  targetUsername = null;
  currentServerId = null;
  activeServerData = null;
  btnServerHeaderInfo.classList.add('hidden');
  if (typingListenersUnsubscribe) {
    typingListenersUnsubscribe();
    typingListenersUnsubscribe = null;
  }
  typingIndicatorText.textContent = '';
  replyToMessage = null;
  replyToMessageId = null;
  reactionTooltip.classList.remove('show');
  replyTooltip.classList.remove('show');
});

// ==================== SERVER INFO BOTÕES ====================
btnCloseServerInfoModal.addEventListener('click', () => { serverInfoModal.classList.add('hidden'); });
btnModalCopyLink.addEventListener('click', () => {
  navigator.clipboard.writeText(modalServerInviteLink.textContent);
  showToast('Link copiado!', 'success');
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
    showToast('Servidor atualizado!', 'success');
    serverInfoModal.classList.add('hidden');
    abrirServidorChat(currentServerId);
  } catch (err) {
    showToast('Erro ao atualizar servidor.');
  }
});

btnLeaveOrDeleteServer.addEventListener('click', async () => {
  const isOwner = activeServerData.owner === currentUsername;
  if (isOwner) {
    if (confirm('Excluir permanentemente este servidor?')) {
      await deleteDoc(doc(db, "servers", currentServerId));
      serverInfoModal.classList.add('hidden');
      appScreen.classList.remove('chat-open');
      currentServerId = null;
      showToast('Servidor excluído.');
    }
  } else {
    if (confirm('Sair deste servidor?')) {
      await updateDoc(doc(db, "servers", currentServerId), { members: arrayRemove(currentUsername) });
      await deleteDoc(doc(db, "servers", currentServerId, "members", currentUsername));
      serverInfoModal.classList.add('hidden');
      appScreen.classList.remove('chat-open');
      currentServerId = null;
      showToast('Você saiu do servidor.');
    }
  }
});

// ==================== AUTCOMPLETE DE MENSAGEM ====================
let mentionTimeout = null;
messageInput.addEventListener('input', async (e) => {
  const value = messageInput.value;
  const lastAt = value.lastIndexOf('@');
  if (lastAt !== -1 && currentServerId) {
    const search = value.substring(lastAt + 1);
    clearTimeout(mentionTimeout);
    mentionTimeout = setTimeout(async () => {
      const rolesSnap = await getDocs(collection(db, "servers", currentServerId, "roles"));
      const roles = [];
      rolesSnap.forEach(doc => {
        const data = doc.data();
        if (!data.isDefault) {
          roles.push(data.name.replace('@', ''));
        }
      });
      const matching = roles.filter(r => r.toLowerCase().startsWith(search.toLowerCase()));
      if (matching.length > 0) {
        const before = value.substring(0, lastAt + 1);
        const after = value.substring(lastAt + 1 + search.length);
        messageInput.value = before + matching[0] + after;
        messageInput.setSelectionRange(before.length + matching[0].length, before.length + matching[0].length);
      }
    }, 300);
  }
});

// ==================== INICIALIZAÇÃO ====================
setupTypingSystem();
carregarLoja();

// Fechar tooltips ao clicar fora
document.addEventListener('click', (e) => {
  if (!reactionTooltip.contains(e.target)) {
    reactionTooltip.classList.remove('show');
  }
  if (!replyTooltip.contains(e.target)) {
    replyTooltip.classList.remove('show');
  }
});

console.log('🔥 Starcord inicializado com sucesso!');