// js/dom.js
// Centralização dos seletores DOM da aplicação.

export const splashScreen = document.querySelector('#splashScreen');
export const splashIcon = document.querySelector('#splashIcon');
export const authScreen = document.querySelector('#authScreen');
export const appScreen = document.querySelector('.app-container');

export const authTitle = document.querySelector('#authTitle');
export const authSub = document.querySelector('#authSub');
export const authUsername = document.querySelector('#authUsername');
export const authEmail = document.querySelector('#authEmail');
export const authPassword = document.querySelector('#authPassword');
export const authConfirmPassword = document.querySelector('#authConfirmPassword');
export const btnAuthSubmit = document.querySelector('#btnAuthSubmit');
export const btnToggleAuthMode = document.querySelector('#btnToggleAuthMode');
export const authError = document.querySelector('#authError');
export const groupUsername = document.querySelector('#groupUsername');
export const groupConfirmPassword = document.querySelector('#groupConfirmPassword');
export const btnLogout = document.querySelector('#btnLogout');

export const serversList = document.querySelector('.servers-list');
export const friendsList = document.querySelector('.friends-list');

export const chatArea = document.querySelector('.chat-area');
export const chatTargetTitle = document.querySelector('#chatTargetTitle') || document.querySelector('.chat-user-target .user-display-name');
export const chatTargetHandle = document.querySelector('#chatTargetHandle') || document.querySelector('.chat-user-target .user-handle');
export const chatAvatar = document.querySelector('#chatAvatar') || document.querySelector('.chat-user-target .user-avatar-main');
export const chatMessages = document.querySelector('.chat-messages');
export const chatForm = document.querySelector('#chatForm') || document.querySelector('.chat-footer');
export const messageInput = document.querySelector('#messageInput') || document.querySelector('.chat-footer input');
export const fileInput = document.querySelector('#fileInput');
export const btnBack = document.querySelector('#btnBack') || document.querySelector('.chat-back-btn');

export const btnServerHeaderInfo = document.querySelector('#btnServerHeaderInfo');
export const btnOpenCreateServer = document.querySelector('#btnOpenCreateServer');
export const createServerModal = document.querySelector('#createServerModal');
export const btnCloseCreateServer = document.querySelector('#btnCloseCreateServer');
export const serverIconPickerLabel = document.querySelector('#serverIconPickerLabel');
export const inputServerName = document.querySelector('#inputServerName');
export const inputServerDesc = document.querySelector('#inputServerDesc');
export const btnConfirmCreateServer = document.querySelector('#btnConfirmCreateServer');
export const previewColorCreate = document.querySelector('#previewColorCreate');
export const txtColorCreate = document.querySelector('#txtColorCreate');
export const btnTriggerColorCreate = document.querySelector('#btnTriggerColorCreate');

export const inviteFriendsModal = document.querySelector('#inviteFriendsModal');
export const btnCloseInviteModal = document.querySelector('#btnCloseInviteModal');
export const txtInviteLink = document.querySelector('#txtInviteLink');
export const btnCopyInviteLink = document.querySelector('#btnCopyInviteLink');
export const inviteFriendsListContainer = document.querySelector('#inviteFriendsListContainer');

export const serverInfoModal = document.querySelector('#serverInfoModal');
export const btnCloseServerInfoModal = document.querySelector('#btnCloseServerInfoModal');
export const serverInfoModalTitle = document.querySelector('#serverInfoModalTitle');
export const serverInfoModalAvatar = document.querySelector('#serverInfoModalAvatar');
export const serverInfoName = document.querySelector('#serverInfoName');
export const serverInfoOwner = document.querySelector('#serverInfoOwner');
export const modalServerInviteLink = document.querySelector('#modalServerInviteLink');
export const btnModalCopyLink = document.querySelector('#btnModalCopyLink');
export const serverInfoDescText = document.querySelector('#serverInfoDescText');
export const serverMembersListContainer = document.querySelector('#serverMembersListContainer');
export const btnOpenInviteMore = document.querySelector('#btnOpenInviteMore');
export const btnLeaveOrDeleteServer = document.querySelector('#btnLeaveOrDeleteServer');

export const editServerNameInput = document.querySelector('#editServerNameInput');
export const editServerDescInput = document.querySelector('#editServerDescInput');
export const btnSaveServerEdit = document.querySelector('#btnSaveServerEdit');
export const editBannerColorSection = document.querySelector('#editBannerColorSection');
export const previewColorEdit = document.querySelector('#previewColorEdit');
export const txtColorEdit = document.txtColorEdit || document.querySelector('#txtColorEdit');
export const btnTriggerColorEdit = document.querySelector('#btnTriggerColorEdit');

export const profileModal = document.querySelector('#profileModal');
export const btnOpenSelfProfile = document.querySelector('#btnOpenSelfProfile');
export const btnOpenTargetProfile = document.querySelector('#btnOpenTargetProfile');
export const btnCloseProfileModal = document.querySelector('#btnCloseProfileModal');
export const btnSaveProfile = document.querySelector('#btnSaveProfile');
export const profileModalTitle = document.querySelector('#profileModalTitle');
export const modalAvatarPreview = document.querySelector('#modalAvatarPreview');
export const modalAvatarEditOverlay = document.querySelector('#modalAvatarEditOverlay');
export const avatarFileInput = document.querySelector('#avatarFileInput');
export const editDisplayName = document.querySelector('#editDisplayName');
export const viewDisplayName = document.querySelector('#viewDisplayName');
export const editPronouns = document.querySelector('#editPronouns');
export const viewPronouns = document.querySelector('#viewPronouns');
export const editBio = document.querySelector('#editBio');
export const viewBio = document.querySelector('#viewBio');
export const userDisplayName = document.querySelector('#userDisplayName');
export const userHandle = document.querySelector('#userHandle');
export const userAvatarMain = document.querySelector('#userAvatarMain');

export const friendUsernameInput = document.querySelector('#friendUsernameInput');
export const btnAddFriend = document.querySelector('#btnAddFriend');

export const cropModal = document.querySelector('#cropModal');
export const cropCanvas = document.querySelector('#cropCanvas');
export const cropContainer = document.querySelector('#cropContainer');
export const cropZoom = document.querySelector('#cropZoom');
export const zoomVal = document.querySelector('#zoomVal');
export const btnCancelCrop = document.querySelector('#btnCancelCrop');
export const btnApplyCrop = document.querySelector('#btnApplyCrop');

export const customColorPickerModal = document.querySelector('#customColorPickerModal');
export const pickerHexInput = document.querySelector('#pickerHexInput');
export const pickerSatBox = document.querySelector('#pickerSatBox');
export const pickerSatBg = document.querySelector('#pickerSatBg');
export const pickerSatPointer = document.querySelector('#pickerSatPointer');
export const pickerHueBar = document.querySelector('#pickerHueBar');
export const pickerHueThumb = document.querySelector('#pickerHueThumb');
export const btnSelectColor = document.querySelector('#btnSelectColor');

export const toastContainer = document.querySelector('.toast-container') || document.body;
