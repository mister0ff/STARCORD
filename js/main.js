// js/main.js
// Ponto de entrada da aplicação. Importa todos os módulos e chama suas
// funções de inicialização (wiring de eventos). A ordem de chamada aqui
// não importa para a maioria dos módulos, mas initAuth() deve ser chamado
// por último pois é ele quem dispara onAuthStateChanged e revela a tela certa.

import { initColorPicker } from "./colorpicker.js";
import { initCrop } from "./crop.js";
import { initProfile } from "./profile.js";
import { initChat } from "./chat.js";
import { initServers } from "./servers.js";
import { initAuth } from "./auth.js";

initColorPicker();
initCrop();
initProfile();
initChat();
initServers();
initAuth();

