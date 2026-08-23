// js/chat.js
// Lista de amigos, chat privado (1:1), envio de mensagens/arquivos e
// renderização de embeds de convite de servidor dentro das mensagens.

import {
  collection, doc, addDoc, getDoc, setDoc, query, orderBy, onSnapshot,
  serverTimestamp, where, getDocs, updateDoc, arrayUnion
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./config.js";
import { state } from "./state.js";
import { cleanUsername, getProfileCached, showToast } from "./utils.js";
import { abrirServidorChat } from "./servers.js";
import {
  friendUsernameInput,
  btnAddFriend,
  friendsList,
  btnBack,
  chatTargetTitle,
  chatTargetHandle,
  chatAvatar,
  chatMessages,
  chatForm,
  messageInput,
  fileInput,
  btnServerHeaderInfo,
  appScreen
} from "./dom.js";

/* ---------- Renderização de embeds de convite dentro do texto ---------- */

export async function processarTextoComEmbeds(text, bodyDiv) {
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
            if (!sData.members.includes(state.currentUsername)) {
              await updateDoc(doc(db, "servers", sId), {
                members: arrayUnion(state.currentUsername)
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
      } catch (err) {
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

/* ---------- Renderização genérica de uma lista de mensagens ---------- */

async function renderizarMensagens(snapshot) {
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
}

export function carregarMensagensChatPrivado(friendUser) {
  chatMessages.innerHTML = '';
  const roomId = [state.currentUsername, friendUser].sort().join('_');
  const q = query(collection(db, "chats", roomId, "messages"), orderBy("timestamp", "asc"));
  if (state.unsubscribeMessages) state.unsubscribeMessages();

  state.unsubscribeMessages = onSnapshot(q, (snapshot) => {
    renderizarMensagens(snapshot);
  });
}

/* ---------- Amigos ---------- */

export function carregarAmigos() {
  const friendsRef = collection(db, "users", state.currentUsername, "friends");
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
  state.targetUsername = friendUser;
  state.currentServerId = null;
  state.activeServerData = null;
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

/* ---------- Inicialização de eventos ---------- */

export function initChat() {
  [friendUsernameInput].forEach(input => {
    input.addEventListener('input', (e) => {
      e.target.value = cleanUsername(e.target.value);
    });
  });

  btnBack.addEventListener('click', () => {
    appScreen.classList.remove('chat-open');
    state.targetUsername = null;
    state.currentServerId = null;
    state.activeServerData = null;
    btnServerHeaderInfo.classList.add('hidden');
  });

  btnAddFriend.addEventListener('click', async () => {
    const friendUser = cleanUsername(friendUsernameInput.value);
    if (!friendUser) return;
    if (friendUser === state.currentUsername) { showToast('Você não pode adicionar a si mesmo.'); return; }

    btnAddFriend.disabled = true;
    try {
      const friendProfileSnap = await getDoc(doc(db, "profiles", friendUser));
      if (!friendProfileSnap.exists()) { showToast('Usuário não encontrado.'); return; }

      await setDoc(doc(db, "users", state.currentUsername, "friends", friendUser), { username: friendUser, addedAt: serverTimestamp() });
      await setDoc(doc(db, "users", friendUser, "friends", state.currentUsername), { username: state.currentUsername, addedAt: serverTimestamp() });

      friendUsernameInput.value = '';
      showToast(`@${friendUser} adicionado!`, 'success');
    } catch (err) {
      showToast('Erro ao adicionar amigo: ' + err.message);
    } finally {
      btnAddFriend.disabled = false;
    }
  });

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;
    messageInput.value = '';

    const myProfile = await getProfileCached(state.currentUsername);

    if (state.currentServerId) {
      await addDoc(collection(db, "servers", state.currentServerId, "messages"), {
        text: text,
        fileUrl: null,
        sender: state.currentUsername,
        senderDisplayName: myProfile.displayName || state.currentUsername,
        senderAvatar: myProfile.avatarUrl || '',
        timestamp: serverTimestamp()
      });
    } else if (state.targetUsername) {
      const roomId = [state.currentUsername, state.targetUsername].sort().join('_');
      await addDoc(collection(db, "chats", roomId, "messages"), {
        text: text,
        fileUrl: null,
        sender: state.currentUsername,
        senderDisplayName: myProfile.displayName || state.currentUsername,
        senderAvatar: myProfile.avatarUrl || '',
        timestamp: serverTimestamp()
      });
    }
  });

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const fileUrl = event.target.result;
      const myProfile = await getProfileCached(state.currentUsername);

      if (state.currentServerId) {
        await addDoc(collection(db, "servers", state.currentServerId, "messages"), {
          text: '',
          fileUrl: fileUrl,
          sender: state.currentUsername,
          senderDisplayName: myProfile.displayName || state.currentUsername,
          senderAvatar: myProfile.avatarUrl || '',
          timestamp: serverTimestamp()
        });
      } else if (state.targetUsername) {
        const roomId = [state.currentUsername, state.targetUsername].sort().join('_');
        await addDoc(collection(db, "chats", roomId, "messages"), {
          text: '',
          fileUrl: fileUrl,
          sender: state.currentUsername,
          senderDisplayName: myProfile.displayName || state.currentUsername,
          senderAvatar: myProfile.avatarUrl || '',
          timestamp: serverTimestamp()
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });
}

// Exporta também o renderizador genérico para ser usado por servers.js
export { renderizarMensagens };

