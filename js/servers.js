// js/servers.js
// Criação de servidores, listagem, modal de informações/gerenciamento,
// membros, convites e mensagens dentro de um servidor.

import {
  collection, doc, addDoc, setDoc, getDoc, updateDoc, deleteDoc, query, orderBy,
  onSnapshot, serverTimestamp, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./config.js";
import { state } from "./state.js";
import { getProfileCached, showToast } from "./utils.js";
import { openCustomColorPicker } from "./colorpicker.js";
import { handleImageSelect } from "./crop.js";
import { renderizarMensagens } from "./chat.js";
import {
  serversList,
  chatTargetTitle,
  chatTargetHandle,
  chatAvatar,
  chatMessages,
  btnServerHeaderInfo,
  appScreen,
  btnOpenCreateServer,
  createServerModal,
  btnCloseCreateServer,
  serverIconPickerLabel,
  inputServerName,
  inputServerDesc,
  btnConfirmCreateServer,
  previewColorCreate,
  txtColorCreate,
  btnTriggerColorCreate,
  inviteFriendsModal,
  btnCloseInviteModal,
  txtInviteLink,
  btnCopyInviteLink,
  inviteFriendsListContainer,
  serverInfoModal,
  btnCloseServerInfoModal,
  serverInfoModalTitle,
  serverInfoModalAvatar,
  serverInfoName,
  serverInfoOwner,
  modalServerInviteLink,
  btnModalCopyLink,
  serverInfoDescText,
  serverMembersListContainer,
  btnOpenInviteMore,
  btnLeaveOrDeleteServer,
  editServerNameInput,
  editServerDescInput,
  btnSaveServerEdit,
  editBannerColorSection,
  previewColorEdit,
  txtColorEdit,
  btnTriggerColorEdit
} from "./dom.js";

/* ---------- Lista de servidores na sidebar ---------- */

export function carregarServidores() {
  const serversRef = collection(db, "servers");
  onSnapshot(serversRef, (snapshot) => {
    serversList.innerHTML = '';
    snapshot.forEach((docSnap) => {
      const sData = docSnap.data();
      const sId = docSnap.id;
      if (sData.members && sData.members.includes(state.currentUsername)) {
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

/* ---------- Abrir chat de um servidor ---------- */

export async function abrirServidorChat(serverId) {
  state.currentServerId = serverId;
  state.targetUsername = null;
  btnServerHeaderInfo.classList.remove('hidden');

  const sSnap = await getDoc(doc(db, "servers", serverId));
  if (!sSnap.exists()) return;
  state.activeServerData = sSnap.data();

  chatTargetTitle.textContent = state.activeServerData.name;
  chatTargetHandle.textContent = `Servidor • ${state.activeServerData.members.length} membros`;

  if (state.activeServerData.iconUrl) {
    chatAvatar.style.backgroundImage = `url(${state.activeServerData.iconUrl})`;
    chatAvatar.textContent = '';
  } else {
    chatAvatar.style.backgroundImage = 'none';
    chatAvatar.textContent = state.activeServerData.name[0].toUpperCase();
  }

  appScreen.classList.add('chat-open');
  carregarMensagensServidor(serverId);
}

function carregarMensagensServidor(serverId) {
  chatMessages.innerHTML = '';
  const q = query(collection(db, "servers", serverId, "messages"), orderBy("timestamp", "asc"));
  if (state.unsubscribeMessages) state.unsubscribeMessages();

  state.unsubscribeMessages = onSnapshot(q, (snapshot) => {
    renderizarMensagens(snapshot);
  });
}

/* ---------- Criação de servidor ---------- */

function resetCreateServerIconPicker() {
  serverIconPickerLabel.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
    <span>ENVIAR</span>
    <input type="file" id="serverAvatarFileInput" accept="image/*" />
  `;
  document.getElementById('serverAvatarFileInput').addEventListener('change', (e) => {
    handleImageSelect(e, 'server');
  });
}

function initCreateServerModal() {
  btnOpenCreateServer.addEventListener('click', () => {
    inputServerName.value = `Servidor de .${state.currentUsername}®`;
    inputServerDesc.value = 'Bem-vindo ao nosso servidor!';
    state.tempServerAvatarBase64 = null;
    state.selectedBannerColor = '#000000';
    previewColorCreate.style.backgroundColor = state.selectedBannerColor;
    txtColorCreate.textContent = state.selectedBannerColor;

    resetCreateServerIconPicker();
    createServerModal.classList.remove('hidden');
  });

  btnCloseCreateServer.addEventListener('click', () => { createServerModal.classList.add('hidden'); });

  btnTriggerColorCreate.addEventListener('click', () => {
    openCustomColorPicker(state.selectedBannerColor, (hex) => {
      state.selectedBannerColor = hex;
      previewColorCreate.style.backgroundColor = hex;
      txtColorCreate.textContent = hex;
    });
  });

  btnConfirmCreateServer.addEventListener('click', async () => {
    const name = inputServerName.value.trim() || `Servidor de ${state.currentUsername}`;
    const desc = inputServerDesc.value.trim();
    const inviteCode = Math.random().toString(36).substring(2, 10);

    btnConfirmCreateServer.disabled = true;
    try {
      const serverRef = doc(collection(db, "servers"));
      await setDoc(serverRef, {
        name: name,
        description: desc,
        iconUrl: state.tempServerAvatarBase64 || '',
        bannerColor: state.selectedBannerColor,
        owner: state.currentUsername,
        inviteCode: inviteCode,
        members: [state.currentUsername],
        createdAt: serverTimestamp()
      });

      state.newlyCreatedServerId = serverRef.id;
      state.newlyCreatedInviteCode = inviteCode;

      createServerModal.classList.add('hidden');
      abrirModalConvidarAmigos(state.newlyCreatedServerId, inviteCode);
      showToast('Servidor criado com sucesso!', 'success');
    } catch (err) {
      showToast('Erro ao criar servidor: ' + err.message);
    } finally {
      btnConfirmCreateServer.disabled = false;
    }
  });
}

/* ---------- Modal de convidar amigos ---------- */

function abrirModalConvidarAmigos(serverId, inviteCode) {
  txtInviteLink.textContent = `starcord.gg/${inviteCode}`;
  carregarListaAmigosParaConvite(serverId);
  inviteFriendsModal.classList.remove('hidden');
}

function carregarListaAmigosParaConvite() {
  inviteFriendsListContainer.innerHTML = '';
  const colRef = collection(db, "users", state.currentUsername, "friends");
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
        const roomId = [state.currentUsername, fUser].sort().join('_');
        const myProfile = await getProfileCached(state.currentUsername);
        await addDoc(collection(db, "chats", roomId, "messages"), {
          text: `Ei! Entre no meu servidor do Starcord: starcord.gg/${state.newlyCreatedInviteCode}`,
          fileUrl: null, sender: state.currentUsername,
          senderDisplayName: myProfile.displayName || state.currentUsername,
          senderAvatar: myProfile.avatarUrl || '',
          timestamp: serverTimestamp()
        });
        showToast(`Convite enviado para @${fUser}!`, 'success');
      });
      inviteFriendsListContainer.appendChild(row);
    }
  });
}

function initInviteModal() {
  btnCloseInviteModal.addEventListener('click', () => {
    inviteFriendsModal.classList.add('hidden');
    if (state.newlyCreatedServerId) abrirServidorChat(state.newlyCreatedServerId);
  });

  btnCopyInviteLink.addEventListener('click', () => {
    navigator.clipboard.writeText(txtInviteLink.textContent);
    showToast('Link copiado para a área de transferência!', 'success');
  });
}

/* ---------- Modal de informações / gerenciamento do servidor ---------- */

export async function abrirModalInfoServidor() {
  if (!state.currentServerId) return;
  const sSnap = await getDoc(doc(db, "servers", state.currentServerId));
  if (!sSnap.exists()) return;
  state.activeServerData = sSnap.data();

  serverInfoModalTitle.textContent = state.activeServerData.name;
  serverInfoName.textContent = state.activeServerData.name;
  serverInfoOwner.textContent = `Dono: @${state.activeServerData.owner}`;
  serverInfoDescText.textContent = state.activeServerData.description || 'Sem descrição.';
  modalServerInviteLink.textContent = `starcord.gg/${state.activeServerData.inviteCode}`;

  if (state.activeServerData.iconUrl) {
    serverInfoModalAvatar.style.backgroundImage = `url(${state.activeServerData.iconUrl})`;
    serverInfoModalAvatar.textContent = '';
  } else {
    serverInfoModalAvatar.style.backgroundImage = 'none';
    serverInfoModalAvatar.textContent = state.activeServerData.name[0].toUpperCase();
  }

  const isOwner = state.activeServerData.owner === state.currentUsername;
  if (isOwner) {
    btnSaveServerEdit.classList.remove('hidden');
    editServerNameInput.classList.remove('hidden');
    editServerDescInput.classList.remove('hidden');
    editBannerColorSection.classList.remove('hidden');
    serverInfoName.classList.add('hidden');
    serverInfoDescText.classList.add('hidden');

    editServerNameInput.value = state.activeServerData.name;
    editServerDescInput.value = state.activeServerData.description || '';
    state.editSelectedBannerColor = state.activeServerData.bannerColor || '#000000';

    previewColorEdit.style.backgroundColor = state.editSelectedBannerColor;
    txtColorEdit.textContent = state.editSelectedBannerColor;

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
  for (const mUser of state.activeServerData.members) {
    const mProfile = await getProfileCached(mUser);
    const mRow = document.createElement('div');
    mRow.style.cssText = "display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); padding: 6px 10px; border-radius: 8px;";

    let mAvatar = mProfile.avatarUrl ? `<div class="friend-avatar" style="width:28px;height:28px;background-image:url('${mProfile.avatarUrl}')"></div>` : `<div class="friend-avatar" style="width:28px;height:28px;font-size:11px;">${(mProfile.displayName||mUser)[0].toUpperCase()}</div>`;
    let actionHtml = '';
    if (isOwner && mUser !== state.currentUsername) {
      actionHtml = `<button class="btn" style="background:#ff4d4d; padding:4px 8px; font-size:10px;" data-kick="${mUser}">Expulsar</button>`;
    } else if (mUser === state.activeServerData.owner) {
      actionHtml = `<span style="font-size:10px; color:var(--accent-red); font-weight:700;">DONO</span>`;
    }

    mRow.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        ${mAvatar}
        <span style="font-size: 12px; font-weight: 600;">${mProfile.displayName || mUser} (@${mUser})</span>
      </div>
      ${actionHtml}
    `;

    if (isOwner && mUser !== state.currentUsername) {
      mRow.querySelector('button').addEventListener('click', async () => {
        if (confirm(`Deseja expulsar @${mUser} do servidor?`)) {
          await updateDoc(doc(db, "servers", state.currentServerId), { members: arrayRemove(mUser) });
          showToast(`@${mUser} foi expulso.`);
          abrirModalInfoServidor();
        }
      });
    }
    serverMembersListContainer.appendChild(mRow);
  }

  serverInfoModal.classList.remove('hidden');
}

function initServerInfoModal() {
  btnCloseServerInfoModal.addEventListener('click', () => { serverInfoModal.classList.add('hidden'); });

  btnModalCopyLink.addEventListener('click', () => {
    navigator.clipboard.writeText(modalServerInviteLink.textContent);
    showToast('Link de convite copiado!', 'success');
  });

  btnOpenInviteMore.addEventListener('click', () => {
    serverInfoModal.classList.add('hidden');
    state.newlyCreatedInviteCode = state.activeServerData.inviteCode;
    state.newlyCreatedServerId = state.currentServerId;
    abrirModalConvidarAmigos(state.currentServerId, state.activeServerData.inviteCode);
  });

  btnTriggerColorEdit.addEventListener('click', () => {
    openCustomColorPicker(state.editSelectedBannerColor, (hex) => {
      state.editSelectedBannerColor = hex;
      previewColorEdit.style.backgroundColor = hex;
      txtColorEdit.textContent = hex;
    });
  });

  btnSaveServerEdit.addEventListener('click', async () => {
    const newName = editServerNameInput.value.trim() || state.activeServerData.name;
    const newDesc = editServerDescInput.value.trim();

    try {
      await updateDoc(doc(db, "servers", state.currentServerId), {
        name: newName,
        description: newDesc,
        bannerColor: state.editSelectedBannerColor
      });
      showToast('Servidor atualizado com sucesso!', 'success');
      serverInfoModal.classList.add('hidden');
      abrirServidorChat(state.currentServerId);
    } catch (err) {
      showToast('Erro ao atualizar servidor.');
    }
  });

  btnLeaveOrDeleteServer.addEventListener('click', async () => {
    const isOwner = state.activeServerData.owner === state.currentUsername;
    if (isOwner) {
      if (confirm('Tem certeza que deseja excluir permanentemente este servidor?')) {
        await deleteDoc(doc(db, "servers", state.currentServerId));
        serverInfoModal.classList.add('hidden');
        appScreen.classList.remove('chat-open');
        state.currentServerId = null;
        showToast('Servidor excluído.');
      }
    } else {
      if (confirm('Tem certeza que deseja sair deste servidor?')) {
        await updateDoc(doc(db, "servers", state.currentServerId), { members: arrayRemove(state.currentUsername) });
        serverInfoModal.classList.add('hidden');
        appScreen.classList.remove('chat-open');
        state.currentServerId = null;
        showToast('Você saiu do servidor.');
      }
    }
  });

  btnServerHeaderInfo.addEventListener('click', abrirModalInfoServidor);
}

/* ---------- Inicialização geral do módulo ---------- */

export function initServers() {
  initCreateServerModal();
  initInviteModal();
  initServerInfoModal();
}

