// js/dom.js
// Todas as referências de elementos DOM usadas pelo sistema, centralizadas aqui.
// Obs: os inputs de arquivo #serverAvatarFileInput dentro do modal de criar
// servidor são recriados dinamicamente (innerHTML) em servers.js, então lá
// eles são buscados de novo com document.getElementById na hora do uso.

export const splashScreen = document.getElementById('splashScreen');
export const splashIcon = document.getElementById('splashIcon');

export const authScreen = document.getElementById('authScreen');
export const appScreen = document.getElementById('appScreen');
export const authTitle = document.getElementById('authTitle');
export const authSub = document.getElementById('authSub');
export const authUsername = document.getElementById('authUsername');
export const authEmail = document.getElementById('authEmail');
export const authPassword = document.getElementById('authPassword');
export const authConfirmPassword = document.getElementById('authConfirmPassword');
export const btnAuthSubmit = document.getElementById('btnAuthSubmit');
export const btnToggleAuthMode = document.getElementById('btnToggleAuthMode');
export const authError = document.getElementById('authError');
export const groupUsername = document.getElementById('groupUsername');
export const groupConfirmPassword = document.getElementById('groupConfirmPassword');

export const userDisplayName = document.getElementById('userDisplayName');
export const userHandle = document.getElementById('userHandle');
export const userAvatarMain = document.getElementById('userAvatarMain');
export const btnLogout = document.getElementById('btnLogout');

export const friendUsernameInput = document.getElementById('friendUsernameInput');
export const btnAddFriend = document.getElementById('btnAddFriend');
export const friendsList = document.getElementById('friendsList');
export const serversList = document.getElementById('serversList');

export const btnBack = document.getElementById('btnBack');
export const chatTargetTitle = document.getElementById('chatTargetTitle');
export const chatTargetHandle = document.getElementById('chatTargetHandle');
export const chatAvatar = document.getElementById('chatAvatar');
export const chatMessages = document.getElementById('chatMessages');
export const chatForm = document.getElementById('chatForm');
export const messageInput = document.getElementById('messageInput');
export const fileInput = document.getElementById('fileInput');
export const btnServerHeaderInfo = document.getElementById('btnServerHeaderInfo');

export const toastContainer = document.getElementById('toastContainer');

export const profileModal = document.getElementById('profileModal');
export const btnOpenSelfProfile = document.getElementById('btnOpenSelfProfile');
export const btnOpenTargetProfile = document.getElementById('btnOpenTargetProfile');
export const btnCloseProfileModal = document.getElementById('btnCloseProfileModal');
export const btnSaveProfile = document.getElementById('btnSaveProfile');
export const profileModalTitle = document.getElementById('profileModalTitle');

export const modalAvatarPreview = document.getElementById('modalAvatarPreview');
export const modalAvatarEditOverlay = document.getElementById('modalAvatarEditOverlay');
export const avatarFileInput = document.getElementById('avatarFileInput');

export const editDisplayName = document.getElementById('editDisplayName');
export const viewDisplayName = document.getElementById('viewDisplayName');
export const editPronouns = document.getElementById('editPronouns');
export const viewPronouns = document.getElementById('viewPronouns');
export const editBio = document.getElementById('editBio');
export const viewBio = document.getElementById('viewBio');

export const btnOpenCreateServer = document.getElementById('btnOpenCreateServer');
export const createServerModal = document.getElementById('createServerModal');
export const btnCloseCreateServer = document.getElementById('btnCloseCreateServer');
export const serverIconPickerLabel = document.getElementById('serverIconPickerLabel');
export const inputServerName = document.getElementById('inputServerName');
export const inputServerDesc = document.getElementById('inputServerDesc');
export const btnConfirmCreateServer = document.getElementById('btnConfirmCreateServer');

export const inviteFriendsModal = document.getElementById('inviteFriendsModal');
export const btnCloseInviteModal = document.getElementById('btnCloseInviteModal');
export const txtInviteLink = document.getElementById('txtInviteLink');
export const btnCopyInviteLink = document.getElementById('btnCopyInviteLink');
export const inviteFriendsListContainer = document.getElementById('inviteFriendsListContainer');

export const serverInfoModal = document.getElementById('serverInfoModal');
export const btnCloseServerInfoModal = document.getElementById('btnCloseServerInfoModal');
export const serverInfoModalTitle = document.getElementById('serverInfoModalTitle');
export const serverInfoModalAvatar = document.getElementById('serverInfoModalAvatar');
export const serverInfoName = document.getElementById('serverInfoName');
export const serverInfoOwner = document.getElementById('serverInfoOwner');
export const modalServerInviteLink = document.getElementById('modalServerInviteLink');
export const btnModalCopyLink = document.getElementById('btnModalCopyLink');
export const serverInfoDescText = document.getElementById('serverInfoDescText');
export const serverMembersListContainer = document.getElementById('serverMembersListContainer');
export const btnOpenInviteMore = document.getElementById('btnOpenInviteMore');
export const btnLeaveOrDeleteServer = document.getElementById('btnLeaveOrDeleteServer');
export const editServerNameInput = document.getElementById('editServerNameInput');
export const editServerDescInput = document.getElementById('editServerDescInput');
export const btnSaveServerEdit = document.getElementById('btnSaveServerEdit');
export const editBannerColorSection = document.getElementById('editBannerColorSection');

export const cropModal = document.getElementById('cropModal');
export const cropCanvas = document.getElementById('cropCanvas');
export const cropContainer = document.getElementById('cropContainer');
export const cropZoom = document.getElementById('cropZoom');
export const zoomVal = document.getElementById('zoomVal');
export const btnCancelCrop = document.getElementById('btnCancelCrop');
export const btnApplyCrop = document.getElementById('btnApplyCrop');

export const customColorPickerModal = document.getElementById('customColorPickerModal');
export const pickerHexInput = document.getElementById('pickerHexInput');
export const pickerSatBox = document.getElementById('pickerSatBox');
export const pickerSatBg = document.getElementById('pickerSatBg');
export const pickerSatPointer = document.getElementById('pickerSatPointer');
export const pickerHueBar = document.getElementById('pickerHueBar');
export const pickerHueThumb = document.getElementById('pickerHueThumb');
export const btnSelectColor = document.getElementById('btnSelectColor');

export const btnTriggerColorCreate = document.getElementById('btnTriggerColorCreate');
export const previewColorCreate = document.getElementById('previewColorCreate');
export const txtColorCreate = document.getElementById('txtColorCreate');

export const btnTriggerColorEdit = document.getElementById('btnTriggerColorEdit');
export const previewColorEdit = document.getElementById('previewColorEdit');
export const txtColorEdit = document.getElementById('txtColorEdit');

