// js/servers.js
// Gerenciamento completo de Servidores, Categorias, Canais e Configurações de Dono.

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

/* ---------- Carregar Servidores do Usuário ---------- */

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
        if (state.currentServerId === sId) item.classList.add('active');

        let avatarStyle = sData.iconUrl ? `style="background-image: url('${sData.iconUrl}')"` : '';
        let avatarContent = sData.iconUrl ? '' : sData.name[0].toUpperCase();

        item.innerHTML = `
          <div class="server-avatar" ${avatarStyle}>${avatarContent}</div>
          <div class="server-details">
            <div class="server-name">${sData.name}</div>
            <div class="server-sub">${sData.members.length} membro(s)</div>
          </div>
        `;
        item.addEventListener('click', () => selecionarServidor(sId));
        serversList.appendChild(item);
      }
    });
  });
}

/* ---------- Seleção e Exibição do Servidor (Categorias e Canais) ---------- */

export async function selecionarServidor(serverId) {
  state.currentServerId = serverId;
  state.targetUsername = null;
  btnServerHeaderInfo.classList.remove('hidden');

  const serverDocRef = doc(db, "servers", serverId);
  
  if (state.unsubscribeServer) state.unsubscribeServer();
  
  state.unsubscribeServer = onSnapshot(serverDocRef, (sSnap) => {
    if (!sSnap.exists()) return;
    state.activeServerData = sSnap.data();

    if (!state.activeServerData.categories) {
      state.activeServerData.categories = [
        {
          id: "cat_default",
          name: "GERAL",
          collapsed: false,
          channels: [{ id: "chan_general", name: "chat-geral", type: "chat" }]
        }
      ];
      updateDoc(serverDocRef, { categories: state.activeServerData.categories });
    }

    renderizarArvoreServidor(serverId, state.activeServerData);
  });
}

function renderizarArvoreServidor(serverId, serverData) {
  let treeContainer = document.querySelector('#serverTreeContainer');
  if (!treeContainer) {
    treeContainer = document.createElement('div');
    treeContainer.id = 'serverTreeContainer';
    treeContainer.className = 'server-tree-container';
    serversList.after(treeContainer);
  }

  treeContainer.innerHTML = '';

  const serverHeader = document.createElement('div');
  serverHeader.className = 'server-header-bar';
  serverHeader.innerHTML = `
    <span class="server-header-title">${serverData.name}</span>
    <button class="btn btn-secondary btn-icon" id="btnConfigServer" title="Configurações">⚙️</button>
  `;
  serverHeader.querySelector('#btnConfigServer').addEventListener('click', abrirModalInfoServidor);
  treeContainer.appendChild(serverHeader);

  serverData.categories.forEach((category) => {
    const group = document.createElement('div');
    group.className = 'category-group';

    const isCollapsed = category.collapsed || false;
    const arrowChar = isCollapsed ? '>' : '<';

    const headerBtn = document.createElement('button');
    headerBtn.className = 'category-header-btn';
    headerBtn.innerHTML = `
      <div class="category-title-wrap">
        <span>${category.name}</span>
      </div>
      <span class="category-arrow">${arrowChar}</span>
    `;

    const channelsList = document.createElement('div');
    channelsList.className = `category-channels-list ${isCollapsed ? 'hidden' : ''}`;

    headerBtn.addEventListener('click', async () => {
      category.collapsed = !category.collapsed;
      await updateDoc(doc(db, "servers", serverId), { categories: serverData.categories });
    });

    if (category.channels && category.channels.length > 0) {
      category.channels.forEach((channel) => {
        const chanBtn = document.createElement('button');
        chanBtn.className = 'channel-btn';
        if (state.currentChannelId === channel.id) chanBtn.classList.add('active');

        chanBtn.innerHTML = `
          <span class="channel-icon">#</span>
          <span>${channel.name}</span>
        `;

        chanBtn.addEventListener('click', () => abrirCanalChat(serverId, channel));
        channelsList.appendChild(chanBtn);
      });
    }

    group.appendChild(headerBtn);
    group.appendChild(channelsList);
    treeContainer.appendChild(group);
  });

  if (!state.currentChannelId && serverData.categories[0]?.channels[0]) {
    abrirCanalChat(serverId, serverData.categories[0].channels[0]);
  }
}

/* ---------- Abrir Chat de um Canal Especifico ---------- */

export async function abrirCanalChat(serverId, channel) {
  state.currentServerId = serverId;
  state.currentChannelId = channel.id;
  state.currentChannelName = channel.name;
  state.targetUsername = null;

  chatTargetTitle.textContent = `# ${channel.name}`;
  chatTargetHandle.textContent = `${state.activeServerData?.name || 'Servidor'} • Canal de Texto`;

  if (state.activeServerData?.iconUrl) {
    chatAvatar.style.backgroundImage = `url(${state.activeServerData.iconUrl})`;
    chatAvatar.textContent = '';
  } else {
    chatAvatar.style.backgroundImage = 'none';
    chatAvatar.textContent = state.activeServerData?.name ? state.activeServerData.name[0].toUpperCase() : '#';
  }

  appScreen.classList.add('chat-open');
  carregarMensagensCanal(serverId, channel.id);
}

function carregarMensagensCanal(serverId, channelId) {
  chatMessages.replaceChildren();
  delete chatMessages.dataset.firstRender;
  
  const q = query(
    collection(db, "servers", serverId, "channels", channelId, "messages"),
    orderBy("timestamp", "asc")
  );

  if (state.unsubscribeMessages) state.unsubscribeMessages();

  state.unsubscribeMessages = onSnapshot(q, (snapshot) => {
    renderizarMensagens(snapshot);
  });
}

/* ---------- Criação de Servidor ---------- */

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
    inputServerName.value = `Servidor de ${state.currentUsername}`;
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
      const initialCategories = [
        {
          id: "cat_" + Date.now(),
          name: "GERAL",
          collapsed: false,
          channels: [
            { id: "chan_" + Date.now(), name: "chat-geral", type: "chat" }
          ]
        }
      ];

      await setDoc(serverRef, {
        name: name,
        description: desc,
        iconUrl: state.tempServerAvatarBase64 || '',
        bannerColor: state.selectedBannerColor,
        owner: state.currentUsername,
        inviteCode: inviteCode,
        members: [state.currentUsername],
        categories: initialCategories,
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

/* ---------- Modal de Convites ---------- */

function abrirModalConvidarAmigos(serverId, inviteCode) {
  txtInviteLink.textContent = `starcord.gg/${inviteCode}`;
  carregarListaAmigosParaConvite(serverId);
  inviteFriendsModal.classList.remove('hidden');
}

function carregarListaAmigosParaConvite(serverId) {
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
    if (state.newlyCreatedServerId) selecionarServidor(state.newlyCreatedServerId);
  });

  btnCopyInviteLink.addEventListener('click', () => {
    navigator.clipboard.writeText(txtInviteLink.textContent);
    showToast('Link copiado para a área de transferência!', 'success');
  });
}

/* ---------- Modal de Informações / Gerenciamento de Categorias do Dono ---------- */

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
  renderizarPainelGerenciamentoDono(isOwner);

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
      actionHtml = `<button class="btn" style="background:#ff4d4d; padding:4px 8px; font-size:10px;">Expulsar</button>`;
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

function renderizarPainelGerenciamentoDono(isOwner) {
  let managerContainer = document.querySelector('#ownerManagerSection');
  if (managerContainer) managerContainer.remove();

  if (!isOwner) return;

  managerContainer = document.createElement('div');
  managerContainer.id = 'ownerManagerSection';
  managerContainer.className = 'owner-manager-section';

  managerContainer.innerHTML = `
    <div class="owner-manager-title">Gerenciar Categorias e Canais</div>
    
    <div style="display:flex; gap:8px;">
      <input type="text" id="newCatNameInput" placeholder="Nome da Categoria..." style="flex:1;" />
      <button class="btn" id="btnCreateCategory" style="padding:6px 12px; font-size:11px;">+ Categoria</button>
    </div>

    <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
      <select id="selectCategoryForChannel" style="padding:8px; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-main); border-radius:8px; font-size:12px;">
      </select>
      <div style="display:flex; gap:8px;">
        <input type="text" id="newChannelNameInput" placeholder="Nome do Canal..." style="flex:1;" />
        <button class="btn" id="btnCreateChannel" style="padding:6px 12px; font-size:11px;">+ Canal</button>
      </div>
    </div>
  `;

  serverInfoDescText.after(managerContainer);

  const selectCat = managerContainer.querySelector('#selectCategoryForChannel');
  const categories = state.activeServerData.categories || [];

  selectCat.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  managerContainer.querySelector('#btnCreateCategory').addEventListener('click', async () => {
    const inputCat = managerContainer.querySelector('#newCatNameInput');
    const catName = inputCat.value.trim();
    if (!catName) return;

    categories.push({
      id: "cat_" + Date.now(),
      name: catName.toUpperCase(),
      collapsed: false,
      channels: []
    });

    await updateDoc(doc(db, "servers", state.currentServerId), { categories });
    showToast(`Categoria "${catName}" criada!`, 'success');
    abrirModalInfoServidor();
  });

  managerContainer.querySelector('#btnCreateChannel').addEventListener('click', async () => {
    const targetCatId = selectCat.value;
    const inputChan = managerContainer.querySelector('#newChannelNameInput');
    const chanName = inputChan.value.trim().toLowerCase().replace(/\s+/g, '-');

    if (!targetCatId || !chanName) return;

    const catIndex = categories.findIndex(c => c.id === targetCatId);
    if (catIndex !== -1) {
      categories[catIndex].channels.push({
        id: "chan_" + Date.now(),
        name: chanName,
        type: "chat"
      });

      await updateDoc(doc(db, "servers", state.currentServerId), { categories });
      showToast(`Canal "#${chanName}" criado!`, 'success');
      abrirModalInfoServidor();
    }
  });
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
      selecionarServidor(state.currentServerId);
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

/* ---------- Inicialização Geral do Módulo ---------- */

export function initServers() {
  initCreateServerModal();
  initInviteModal();
  initServerInfoModal();
}
