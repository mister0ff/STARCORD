// js/state.js
// Estado global compartilhado entre todos os módulos.

export const state = {
  currentUsername: null,
  targetUsername: null,
  currentServerId: null,
  currentChannelId: null,      // Rastreia o canal ativo
  currentChannelName: null,    // Nome do canal ativo
  activeServerData: null,
  unsubscribeServer: null,     // Unsubscribe do listener de servidor
  unsubscribeMessages: null,   // Unsubscribe do listener de mensagens
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
