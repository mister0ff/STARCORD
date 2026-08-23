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

    // Renderiza os canais e categorias dentro do container do servidor ativo
    renderizarArvoreServidorNoPainel(serverId, state.activeServerData);
  });
}

function renderizarArvoreServidorNoPainel(serverId, serverData) {
  // Procura ou cria um container específico para o menu interno do servidor
  let serverSidebar = document.querySelector('#serverInternalSidebar');
  if (!serverSidebar) {
    serverSidebar = document.createElement('div');
    serverSidebar.id = 'serverInternalSidebar';
    serverSidebar.className = 'server-internal-sidebar';
    // Insere logo após a lista de servidores lateral
    serversList.after(serverSidebar);
  }

  serverSidebar.innerHTML = '';

  // Cabeçalho do Servidor Interno
  const serverHeader = document.createElement('div');
  serverHeader.className = 'server-header-bar';
  serverHeader.innerHTML = `
    <span class="server-header-title">${serverData.name}</span>
    <button class="btn btn-secondary btn-icon" id="btnConfigServer" title="Configurações">⚙️</button>
  `;
  serverHeader.querySelector('#btnConfigServer').addEventListener('click', abrirModalInfoServidor);
  serverSidebar.appendChild(serverHeader);

  // Lista de Categorias e Canais com suporte a retrair (< / >)
  const categoriesContainer = document.createElement('div');
  categoriesContainer.className = 'server-categories-scroll';

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
    categoriesContainer.appendChild(group);
  });

  serverSidebar.appendChild(categoriesContainer);

  // Seleciona o primeiro canal por padrão se nenhum estiver aberto
  if (!state.currentChannelId && serverData.categories[0]?.channels[0]) {
    abrirCanalChat(serverId, serverData.categories[0].channels[0]);
  }
}
