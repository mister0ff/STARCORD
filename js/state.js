// js/state.js
// Estado global compartilhado entre todos os módulos.
// Usamos um objeto (em vez de variáveis soltas) para que as mudanças feitas
// em um módulo sejam sempre visíveis nos outros módulos que importarem "state".

export const state = {
  currentUsername: null,
  targetUsername: null,
  currentServerId: null,
  activeServerData: null,
  unsubscribeMessages: null,
  tempAvatarBase64: null,
  tempServerAvatarBase64: null,
  isLoginMode: false,
  selectedBannerColor: '#000000',
  editSelectedBannerColor: '#000000',
  newlyCreatedServerId: null,
  newlyCreatedInviteCode: null,
  splashFinished: false,
  authChecked: false
};

// Cache de perfis (username -> dados do perfil)
export const profileCache = {};

