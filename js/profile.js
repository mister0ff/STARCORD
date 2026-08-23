// js/profile.js
// Modal de perfil: edição do próprio perfil e visualização do perfil de outros.

import { doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./config.js";
import { state, profileCache } from "./state.js";
import { showToast } from "./utils.js";
import { handleImageSelect } from "./crop.js";
import { abrirModalInfoServidor } from "./servers.js";
import {
  profileModal,
  btnOpenSelfProfile,
  btnOpenTargetProfile,
  btnCloseProfileModal,
  btnSaveProfile,
  profileModalTitle,
  modalAvatarPreview,
  modalAvatarEditOverlay,
  avatarFileInput,
  editDisplayName,
  viewDisplayName,
  editPronouns,
  viewPronouns,
  editBio,
  viewBio,
  userDisplayName,
  userHandle,
  userAvatarMain
} from "./dom.js";

export async function carregarMeuPerfil() {
  const profileRef = doc(db, "profiles", state.currentUsername);
  onSnapshot(profileRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      userDisplayName.textContent = data.displayName || state.currentUsername;
      userHandle.textContent = `@${state.currentUsername}`;
      if (data.avatarUrl) {
        userAvatarMain.style.backgroundImage = `url(${data.avatarUrl})`;
        userAvatarMain.textContent = '';
      } else {
        userAvatarMain.style.backgroundImage = 'none';
        userAvatarMain.textContent = state.currentUsername[0].toUpperCase();
      }
    }
  });
}

export function initProfile() {
  avatarFileInput.addEventListener('change', (e) => handleImageSelect(e, 'user'));

  btnOpenSelfProfile.addEventListener('click', async () => {
    const profileSnap = await getDoc(doc(db, "profiles", state.currentUsername));
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
      modalAvatarPreview.textContent = state.currentUsername[0].toUpperCase();
    }
    profileModal.classList.remove('hidden');
  });

  btnOpenTargetProfile.addEventListener('click', async () => {
    if (state.currentServerId && state.activeServerData) { abrirModalInfoServidor(); return; }
    if (!state.targetUsername) return;
    const profileSnap = await getDoc(doc(db, "profiles", state.targetUsername));
    const data = profileSnap.data() || {};
    profileModalTitle.textContent = `@${state.targetUsername}`;
    btnSaveProfile.classList.add('hidden');
    modalAvatarEditOverlay.classList.add('hidden');
    editDisplayName.classList.add('hidden');
    editPronouns.classList.add('hidden');
    editBio.classList.add('hidden');
    viewDisplayName.classList.remove('hidden');
    viewPronouns.classList.remove('hidden');
    viewBio.classList.remove('hidden');
    viewDisplayName.textContent = data.displayName || state.targetUsername;
    viewPronouns.textContent = data.pronouns || 'Não informado';
    viewBio.textContent = data.bio || 'Sem biografia.';
    if (data.avatarUrl) {
      modalAvatarPreview.style.backgroundImage = `url(${data.avatarUrl})`;
      modalAvatarPreview.textContent = '';
    } else {
      modalAvatarPreview.style.backgroundImage = 'none';
      modalAvatarPreview.textContent = state.targetUsername[0].toUpperCase();
    }
    profileModal.classList.remove('hidden');
  });

  btnCloseProfileModal.addEventListener('click', () => {
    profileModal.classList.add('hidden');
    state.tempAvatarBase64 = null;
  });

  btnSaveProfile.addEventListener('click', async () => {
    btnSaveProfile.disabled = true;
    try {
      const updateData = {
        displayName: editDisplayName.value.trim() || state.currentUsername,
        pronouns: editPronouns.value.trim(),
        bio: editBio.value.trim()
      };
      if (state.tempAvatarBase64) updateData.avatarUrl = state.tempAvatarBase64;
      await setDoc(doc(db, "profiles", state.currentUsername), updateData, { merge: true });
      profileCache[state.currentUsername] = null;
      showToast('Perfil salvo!', 'success');
      profileModal.classList.add('hidden');
      state.tempAvatarBase64 = null;
    } catch (err) {
      showToast('Erro ao salvar: ' + err.message);
    } finally {
      btnSaveProfile.disabled = false;
    }
  });
}

