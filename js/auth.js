// js/auth.js
// Splash screen, tela de autenticação (login/cadastro) e listener de estado do Firebase Auth.

import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { auth, db } from "./config.js";
import { state } from "./state.js";
import { cleanUsername } from "./utils.js";
import { carregarMeuPerfil } from "./profile.js";
import { carregarAmigos } from "./chat.js";
import { carregarServidores } from "./servers.js";
import {
  splashScreen, splashIcon, authScreen, appScreen,
  authTitle, authSub, authUsername, authEmail, authPassword, authConfirmPassword,
  btnAuthSubmit, btnToggleAuthMode, authError, groupUsername, groupConfirmPassword,
  btnLogout
} from "./dom.js";

const SECOND_ICON_URL = "white_icon.png";

function revelarTelaCorreta() {
  if (!state.splashFinished || !state.authChecked) return;
  splashScreen.classList.add('hidden');
  if (state.currentUsername) {
    authScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
  } else {
    authScreen.classList.remove('hidden');
    appScreen.classList.add('hidden');
  }
}

function initSplash() {
  setTimeout(() => {
    splashIcon.src = SECOND_ICON_URL;
    setTimeout(() => {
      state.splashFinished = true;
      revelarTelaCorreta();
    }, 600);
  }, 1000);
}

export function initAuth() {
  initSplash();

  [authUsername].forEach(input => {
    input.addEventListener('input', (e) => {
      e.target.value = cleanUsername(e.target.value);
    });
  });

  btnToggleAuthMode.addEventListener('click', () => {
    state.isLoginMode = !state.isLoginMode;
    authError.textContent = '';

    if (state.isLoginMode) {
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
    state.authChecked = true;
    if (user) {
      const userMapSnap = await getDoc(doc(db, "users_map", user.uid));
      if (userMapSnap.exists()) {
        state.currentUsername = userMapSnap.data().username;
      } else {
        state.currentUsername = user.email.split('@')[0];
      }
      await carregarMeuPerfil();
      carregarAmigos();
      carregarServidores();
    } else {
      state.currentUsername = null;
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

    if (!state.isLoginMode) {
      if (!uName) { authError.textContent = 'Digite um nome de usuário.'; return; }
      if (password !== confirmPassword) { authError.textContent = 'As senhas não coincidem!'; return; }
    }

    btnAuthSubmit.disabled = true;

    try {
      if (state.isLoginMode) {
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
          uid: userCred.user.uid, pronouns: '', bio: '', avatarUrl: ''
        });

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
}

