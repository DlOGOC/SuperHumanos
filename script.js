/* ======= script.js ======= */

/* ===== DADOS DO JOGADOR ===== */
let player = {
  name: "",
  hp: 100, maxHp: 100,
  mana: 50, maxMana: 50,
  hunger: 100, sleep: 100, energy: 100,
  strength: 10, intelligence: 10, skill: 10, defense: 10, vigor: 8,
  money: 500,
  guild: null,
  defending: false,
  status: {} // e.g. { burning: {turns:3, value:3}, frozen: {turns:2} }
};

/* ===== CLASSES DO JOGADOR =====*/

let guild = {
  warrior: 0,
  mage: 0,
  thief: 0,
  cleric: 0
};

/* ===== ESTADO DA MÃE ===== */
let mother = 0;
function motherStatus(){
  if(mother === 0){
    return `Sua mãe parece bem.`;
  }else if(mother < 0 && mother > 3){
    return `Sua mãe disfrça bem, mas a falta de tratamento está cobrando o preço.`;
  }else if(mother < 3 && mother > 5){
    return `Sua mãe já não consegue mais esconder as tosses, ela não parece ter mais muito tempo se não receber tratamento.`;
  }else if(mother < 5 && mother >7){
    return `Sua mãe faleceu.`;
  }
}
/* ===== RELAÇÕES DO JOGADOR ===== */

let friendships = {
  "Leandro": { know: false, value: 0, description: ""},
  "João José": { know: false, value: 0, description: ""},
  //adicionar mais aqui
};
/**
 * @param {string} name - nome de quem terá a amizade alterada;
 * @param {number} amount - valor a ser alterado
 */
function changeFriendship(name, amount){
  if(!friendships[name]) return;
  if(friendships[name].value <0) friendships[name].value = Math.min(100, Math.max(0, friendships[name].value - amount));
  else friendships[name].value = Math.min(100, Math.max(0, friendships[name].value + amount));

  //atualiza descrição automáticamente
  const val = friendships[name].value;
  if(val < 100) friendships[name].description = "Odeia você";
    else if(val < 50) friendships[name].description = "Não gosta de você";
    else if(val < 20) friendships[name].description = "Não gosta muito de você";
    else if(val < 50) friendships[name].description = "Gosta de você";
    else if(val < 100) friendships[name].description = "Confia em você";
}
/* ========== AUXILIARES DE STATUS ========== */
function applyStatus(entity, statusName, turns, value = null) {
  if (!entity.status) entity.status = {};
  entity.status[statusName] = { turns: turns, value: value };
}

function hasStatus(entity, name) {
  return entity.status && entity.status[name] && entity.status[name].turns > 0;
}

function clearStatus(entity, name) {
  if (entity.status && entity.status[name]) delete entity.status[name];
}

/* Processa DOTs e efeitos no começo do turno; retorna true se pode agir */
function processStatuses(entity, who) {
  if (!entity.status) entity.status = {};

  // DOTs
  if (hasStatus(entity, "burning")) {
    const dmg = entity.status.burning.value || Math.max(2, Math.round(entity.maxHp * 0.05));
    entity.hp = Math.max(0, entity.hp - dmg);
    entity.status.burning.turns--;
    if (entity.status.burning.turns <= 0) clearStatus(entity, "burning");
    log(`${who === "player" ? "Você" : entity.name} sofre ${dmg} de queimadura.`);
  }
  if (hasStatus(entity, "bleeding")) {
    const dmg = entity.status.bleeding.value || (8 + Math.floor(Math.random() * 3));
    entity.hp = Math.max(0, entity.hp - dmg);
    entity.status.bleeding.turns--;
    if (entity.status.bleeding.turns <= 0) clearStatus(entity, "bleeding");
    log(`${who === "player" ? "Você" : entity.name} perde ${dmg} por sangramento.`);
  }

  // reduzir turnos de statuses passivos
  ["blinded","frozen","confused"].forEach(s => {
    if (hasStatus(entity, s)) {
      entity.status[s].turns--;
      if (entity.status[s].turns <= 0) clearStatus(entity, s);
    }
  });

  // paralizado (perde o turno garantidamente)
  if(hasStatus(entity, "paralizado")){
    log(`${who === "player" ? "você" : entity.name} está paralizado e perde o turno`);
    entity.status.paralizado.turns --;
    if(entity.status.paralizado.turn <=0){
      clearStatus(entity, "paralizado");
      return false; //perde o turno
    }
  }
  // Confusion check (50% perder o turno)
  if (hasStatus(entity, "confused")) {
    const lose = Math.random() < 0.5;
    if (lose) {
      log(`${who === "player" ? "Você" : entity.name} está confuso e perde o turno!`);
      return false;
    }
  }

  return entity.hp > 0;
}

/* Efeito visual: shake na barra de HP da vítima */
function hpShake(targetStr) {
  // targetStr: "player" ou "enemy"
  const id = targetStr === "player" ? "player-hp-fill" : "enemy-hp-fill";
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("hp-shake");
  setTimeout(() => el.classList.remove("hp-shake"), 350);
}

/* ========== UI / SIDEBAR / TEMPO ========== */
function updateSidebar() {
  const setWidth = (id, pct) => {
    const el = document.getElementById(id);
    if (el) el.style.width = Math.max(0, Math.min(100, pct)) + "%";
  };
  if (document.getElementById("bar-hp")) setWidth("bar-hp", (player.hp / player.maxHp) * 100);
  if (document.getElementById("bar-mana")) setWidth("bar-mana", (player.mana / player.maxMana) * 100);
  if (document.getElementById("bar-hunger")) setWidth("bar-hunger", player.hunger);
  if (document.getElementById("bar-sleep")) setWidth("bar-sleep", player.sleep);
  if (document.getElementById("attr-talent")) setWidth("attr-talent"), player.powerType;
  
  const setText = (id, v) => { const e = document.getElementById(id); if (e) e.innerText = v; };
  setText("sidebar-name", player.name || "Jogador");
  setText("attr-strength", player.strength);
  setText("attr-int", player.intelligence);
  setText("attr-skill", player.skill);
  setText("attr-defense", player.defense);
  setText("attr-vigor", player.vigor);
  setText("attr-energy", Math.round(player.energy));
  setText("attr-talent", player.powerType);
}

/* ===== SISTEMA DE TEMPO ===== */

// jogo começa numa quinta-feira, 1 de janeiro de 2025
let gameTime = {
  minute: 59,
  hour: 7,
  day: 1,
  month: 1,
  year: 2025,
  weekdayIndex: 3 // 0=Domingo 
};

const weekDays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function updateGameTimeDisplay() {
  const h = String(gameTime.hour).padStart(2, "0");
  const m = String(gameTime.minute).padStart(2, "0");
  const d = String(gameTime.day).padStart(2, "0");
  const mo = String(gameTime.month).padStart(2, "0");
  const y = gameTime.year;
  const weekday = weekDays[gameTime.weekdayIndex % 7];

  const elTime = document.getElementById("game-time");
  const elDate = document.getElementById("game-date");
  const elWeek = document.getElementById("game-weekday");

  if (elTime) elTime.innerText = `${h}:${m}`;
  if (elDate) elDate.innerText = `${d}/${mo}/${y}`;
  if (elWeek) elWeek.innerText = weekday;
}

/**
 * Avança o tempo do jogo.
 * @param {number} min - minutos a avançar
 * @param {number} horas - horas a avançar
 * @param {number} dias - dias a avançar
 * @param {number} meses - meses a avançar
 * @param {number} anos - anos a avançar
 */
function advanceTime(min = 0, horas = 0, dias = 0, meses = 0, anos = 0) {
  gameTime.minute += min;
  while (gameTime.minute >= 60) {
    gameTime.minute -= 60;
    gameTime.hour++;
  }

  gameTime.hour += horas;
  while (gameTime.hour >= 24) {
    gameTime.hour -= 24;
    gameTime.day++;
    gameTime.weekdayIndex = (gameTime.weekdayIndex + 1) % 7;
  }

  gameTime.day += dias;
  gameTime.month += meses;
  gameTime.year += anos;

  // corrige dias e meses conforme o calendário
  while (true) {
    let daysInMonth = monthDays[gameTime.month - 1];
    if (gameTime.month === 2 && isLeapYear(gameTime.year)) daysInMonth = 29;

    if (gameTime.day > daysInMonth) {
      gameTime.day -= daysInMonth;
      gameTime.month++;
      gameTime.weekdayIndex = (gameTime.weekdayIndex + 1) % 7;
      if (gameTime.month > 12) {
        gameTime.month = 1;
        gameTime.year++;
      }
    } else break;
  }
  updateNeeds(min + horas * 60);
  updateGameTimeDisplay();
}
/* ======= SIDEBAR RELAÇÕES ======= */
document.getElementById("friends-btn").onclick = () =>{
  document.getElementById("friends-panel").classList.add("show");
  updateFriendshipUI();
};

document.getElementById("close-friends").onclick = () =>{
  document.getElementById("friends-panel").classList.remove("show");
};

function updateFriendshipUI(){
  const list = document.getElementById("friends-list");
  if(!list) return;
  list.innerHTML = "";
  let knowCount = 0;

  for(const name in friendships){
    const friend = friendships[name];
    if(!friend || !friend.know) continue;
    knowCount ++;
  
  const p = document.createElement("p");
  const val = typeof friend.value === "Number" ? friend.value: 0;
  const desc = friend.description || "Não tem uma opnião sobre você";

  p.innerHTML = `<strong>${name}<\strong>: ${desc}.`;
  list.appendChild(p);
    }

    if(knowCount === 0){
      const msg = document.createElement("p");
      msg.innerText = "Você ainda não conhece ninguém.";
      list.appendChild(p);
    }
  
}

function meetCharacter(name){
  if(!friendships[name]) return;
  friendships[name].know = true;
  updateFriendshipUI();
}
/* ======= GERENCIAMENTO DE NECESSIDADES ======= */

// Define as taxas de mudança a cada hora
const hungerDecayPerHour = 4;   // fome diminui 4% por hora
const sleepDecayPerHour = 3;    // sono diminui 3% por hora
const energyDecayPerHour = 5;   // energia diminui 5% por hora

/**
 * Atualiza fome, sono e energia conforme o tempo passou
 * @param {number} minutesPassed - minutos decorridos
 */
function updateNeeds(minutesPassed) {
  const hoursPassed = minutesPassed / 60;

  // Reduz necessidades conforme tempo
  player.hunger = Math.max(0, player.hunger - hungerDecayPerHour * hoursPassed);
  player.sleep = Math.max(0, player.sleep - sleepDecayPerHour * hoursPassed);
  player.energy = Math.max(0, player.energy - energyDecayPerHour * hoursPassed);

  // Se algum valor ficar muito baixo, afeta energia
  if (player.hunger < 20 || player.sleep < 20) {
    player.energy = Math.max(0, player.energy - 2);
  }

  // Atualiza as barras da interface
  updateSidebar();
  checkPlayerStatus();
}

/* ======= FEEDBACK DE ESTADO DO JOGADOR ======= */

let lastStatus = { hunger: "", sleep: "", energy: "" };

function checkPlayerStatus() {
  const h = player.hunger;
  const s = player.sleep;
  const e = player.energy;

  let msg = [];

  // === FOME ===
  if (h <= 10 && lastStatus.hunger !== "faminto") {
    msg.push("🍞 Você está faminto! Precisa comer algo logo.");
    lastStatus.hunger = "faminto";
  } else if (h <= 30 && lastStatus.hunger !== "com fome") {
    msg.push("🥪 Seu estômago ronca... está ficando com fome.");
    lastStatus.hunger = "com fome";
  } else if (h > 60 && lastStatus.hunger !== "saciado") {
    msg.push("😋 Você se sente satisfeito e bem alimentado.");
    lastStatus.hunger = "saciado";
  }

  // === SONO ===
  if (s <= 10 && lastStatus.sleep !== "exausto") {
    msg.push("💤 Você está exausto... precisa dormir urgentemente.");
    lastStatus.sleep = "exausto";
  } else if (s <= 30 && lastStatus.sleep !== "cansado") {
    msg.push("😴 Está ficando sonolento, talvez devesse descansar.");
    lastStatus.sleep = "cansado";
  } else if (s > 70 && lastStatus.sleep !== "descansado") {
    msg.push("☀️ Você se sente descansado e alerta.");
    lastStatus.sleep = "descansado";
  }

  // === ENERGIA ===
  if (e <= 10 && lastStatus.energy !== "esgotado") {
    msg.push("⚡ Você está sem energia... seus movimentos estão lentos.");
    lastStatus.energy = "esgotado";
  } else if (e <= 30 && lastStatus.energy !== "baixo") {
    msg.push("💧 Sua energia está baixa, você se sente fraco.");
    lastStatus.energy = "baixo";
  } else if (e > 70 && lastStatus.energy !== "cheio") {
    msg.push("🔥 Você está cheio de energia e pronto para agir!");
    lastStatus.energy = "cheio";
  }

  // Exibe mensagens novas no log
  msg.forEach(m => log(m));
}

/* ======= SISTEMA DE DESCANSO ======= */
/**
 * O jogador dorme e recupera status conforme o tempo dormido.
 * @param {number} min - minutos dormidos
 * @param {number} hr - horas dormidas
 */
function dormir(min = 0, hr = 0) {
  const totalMin = min + hr * 60;
  const hours = totalMin / 60;

  // Recuperação proporcional ao tempo dormido
  const hpRecovery = hours * 8;        // recupera 8 HP por hora
  const manaRecovery = hours * 6;      // recupera 6 Mana por hora
  const sleepRecovery = hours * 12;    // recupera 12% de sono por hora
  const energyRecovery = hours * 10;   // recupera 10% de energia por hora

  // Aplica recuperação
  player.hp = Math.min(player.maxHp, player.hp + hpRecovery);
  player.mana = Math.min(player.maxMana, player.mana + manaRecovery);
  player.sleep = Math.min(100, player.sleep + sleepRecovery);
  player.energy = Math.min(100, player.energy + energyRecovery);

  // Dormir não gasta fome, mas o tempo ainda passa
  advanceTime(min, hr);

  // Atualiza UI
  updateSidebar();
  wake(min, hr);
}
/* ========== COMER ========== */
/** 
* @param {string} foodName - nome da comida
* @param {number} foodValue - quanto recupera de fome
* @param {number} energyValue - o quanto recupera de energia
* @param {number} hpValue - o quanto recupera de vida
*/
function comer(foodName = "comida", foodValue = 20, energyValue = 10, hpValue = 5){
  //recuperação de status
  player.hunger = Math.min(100, player.hunger + foodValue);
  player.energy = Math.min(100, player.energy + energyValue);
  player.hp = Math.min(player.maxHp, player.hp + hpValue);
  advanceTime(10);
  updateSidebar();

}
/* ========== SIDEBAR TOGGLE ========== */
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("toggle-sidebar");
function toggleSidebar() {
  if (!sidebar || !toggleBtn) return;
  sidebar.classList.toggle("expanded");
  toggleBtn.innerText = sidebar.classList.contains("expanded") ? "<" : ">";
}

/* ========== EFEITO: FADE-IN POR PARÁGRAFO ========== */
function typeText(elementId, text, speed = 320, callback = null) {
  const el = document.getElementById(elementId);
  if (!el) { if (callback) callback(); return; }
  el.innerHTML = "";
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim() !== "");
  paragraphs.forEach((p, i) => {
    const pEl = document.createElement("p");
    pEl.style.opacity = "0";
    pEl.style.transition = "opacity 0.6s ease, transform 0.35s ease";
    pEl.style.transform = "translateY(6px)";
    pEl.innerHTML = p.replace(/\n/g, "<br>");
    el.appendChild(pEl);
    setTimeout(() => { pEl.style.opacity = "1"; pEl.style.transform = "translateY(0)"; }, i * speed);
  });
  const total = paragraphs.length * speed + 600;
  setTimeout(() => { if (callback) callback(); }, total);
}

/* ========== TROCA DE CENA ========== */
/**
 * Cria um botão que chama automaticamente a próxima função da história.
 * @param {string} texto - texto do botão
 * @param {string|function} proxima - nome da função (string) ou referência direta à função
 * @param {string} containerId - id do container de botões (padrão: "powerChoices")
 */
function criarBotaoHistoria(texto, proxima, containerId = "powerChoices") {
  const btnDiv = document.getElementById(containerId);
  if (!btnDiv) return;

  const btn = document.createElement("button");
  btn.innerText = texto;

  // aceita tanto string quanto referência direta à função
  if (typeof proxima === "string") {
    btn.onclick = () => {
      if (typeof window[proxima] === "function") window[proxima]();
      else console.warn(`Função ${proxima} não encontrada.`);
    };
  } else if (typeof proxima === "function") {
    btn.onclick = proxima;
  }

  btnDiv.appendChild(btn);
}

function clearButtons(containerId) {
  const btnDiv = document.getElementById(containerId);
  if (!btnDiv) return;
  Array.from(btnDiv.children).forEach(b => { b.style.transition = "opacity 200ms"; b.style.opacity = "0"; });
  setTimeout(() => { if (btnDiv) btnDiv.innerHTML = ""; }, 220);
}
function changeScene(text, buttonSetup, speed = 320, elementId = "powerText", buttonsContainerId = "powerChoices") {
  clearButtons(buttonsContainerId);
  const textEl = document.getElementById(elementId);
  if (!textEl) {
    const fakeDiv = document.getElementById(buttonsContainerId);
    if (fakeDiv) buttonSetup(fakeDiv);
    return;
  }
  textEl.innerHTML = "";
  typeText(elementId, text, speed, () => {
    const btnDiv = document.getElementById(buttonsContainerId);
    if (btnDiv) buttonSetup(btnDiv);
  });
}

function continueStory(text){
  const storyBox = document.getElementById("storyText");
  storyBox.innerHTML += `<p>${text}</p>`;
  startStory.scrollTop = startStory.scrollHeight;
}

function cleanChoices(){
  const choicesDiv = document.getElementById("choices");
  choicesDiv.innerHTML = "";
}

function showNextButton(action){
  const choicesDiv = document.getElementById("choices");
  const btn = document.createElement("button");
  btn.innerText = "Continuar";
  btn.onclick = action;
  choicesDiv.appendChild(btn);
}
/**
 * ===== ADICIONA BOTÕES SEM APAGAR O CONTEÚDO NA TELA =====
 * @param {string[]} opcoes - lista de opções {(texto, ação)}
 * @param {string} containerId - id do container (defaut: "powerChoices")
 */

function adicionarEscolhasInline(opcoes, containerId = "powerChoices"){
  const container = document.createElement(containerId);
  if(!containerId);

  //remover todos os botões anteriores
  container.innerHTML = "";

  opcoes.forEach(op =>{
    const btn = document.createElement("button");
    btn.innerText = op.texto;

    if(typeof op.acao === "string" && typeof window[op.acao] === "function"){
      btn.onclick = op.acao;
    }

    container.appendChild(btn);
  })
}
/* ========== INICIALIZAÇÃO (DOM ready) ========== */
document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      const name = (document.getElementById("playerNameInput") || {}).value || "";
      if (!name.trim()) return alert("Por favor, insira seu nome!");
      player.name = name.trim();
      document.getElementById("intro-screen").style.display = "none";
      document.getElementById("power-screen").style.display = "block";
      if (typeof discoverPower === "function") discoverPower();
      updateSidebar();
    });
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", toggleSidebar);
    toggleBtn.addEventListener("touchstart", e => { e.preventDefault(); toggleSidebar(); });
  }

  updateSidebar();
  updateGameTimeDisplay();
});

/* ========== HISTÓRIA ========== */
function discoverPower() {

  const story = `Quando eu era criança, via meus pais trabalhando duro para nos sustentar, não eramos uma família grande, apenas eu, ele e minha mãe, apesar da pobreza, eramos felizes.
  
  Com os anos se passando, meus pais foram ficando velhos e o mundo começou a se complicar, guerras de mais. O império do rei Vagh queria dominar tudo, e realmente estava conseguindo, seu guerreiros mágicos eram imparáveis, ainda são na verdade.
  
  Meu pai foi convocado para o exército para proteger nosso país, ele já era um militar de cargo alto, então não iria para as linhas de frente, mas guerras são imprevisíveis, eu não sei o que aconteceu lá, pois o único sobrevivente - meu pai - nunca falou sobre, mas todo o seu batalhão de 3 mil homens foram completamente dominados no campo de batalha, e como um soldado honrado que ele era, não fugiu sem lutar, quando chegou em casa, ele estava apenas uma carcaça do que já fora um dia, seu corpo antes grande e musculoso, não era maior que o de uma criança, sua mente deteriorada pelos acontecimentos, nunca funcionou como antes.
  
  Para ajudar a cuidar de meu pai, comecei a trabalhar cedo, algumas obras ali, alguns atendimentos em bares aqui, mas seus remédios eram caros, e a cada mercador atacado no caminho da capital, os preços aumentavam, nós não conseguimos ajudá-lo por muito tempo e ele sabia disso, assim como sabia que nunca desistiríamos dele, por isso ele fugiu, mesmo não conseguindo mais andar, ele sumiu e nunca mais achamos seu corpo. 
  
  Tanto eu quanto minha mãe ficamos arrasados, mas era perceptível a mudança financeira, o que fazia com que nossos corações doessem sempre que pensavámos que agora conseguiríamos uma vida melhor.`;

  changeScene(story, () =>{
    criarBotaoHistoria("Continuar", continueBackStory);
  })
}

function continueBackStory(){
  const story = `Mas a vida não é algo que deixa você aproveitar por muito tempo, alguns anos depois, uma onda de praga se alastrou por Armenzian, eu e minha mãe nos afastamos de nossos empregos, nossa vida com alguns luxos básicos em troca da nossa vida como um todo, achamos que era uma troca justa. 
  
  Conseguimos sobreviver a praga sem problemas, mas demoramos a conseguir emprego novamente, a fome já não deixava mais com que pudéssemos escolher muito. Então qualquer coisa que achassemos, seria o trabalho perfeito. 
  
  Nunca me arrependi tanto na minha vida, eu consegui emprego primeiro, trabalhava fazendo patrulhas a noite, algo perigoso, mas que recentemente abriu vaga pois um criminoso assassinou o meu antecessor, mas isso não me importava, pois até que o salário era bom. Minha mãe conseguiu emprego algumas semanas depois, ela seria assistente do alfaiate da nossa vila, conseguimos nos virar, mas como sempre, quando nos acostumamos com a vida boa, algo ruim aconteceu.`;

  changeScene(story, () =>{
    criarBotaoHistoria("Continuar", continueBackStory2);
  })
}

function continueBackStory2(){
  const story = `Minha mãe adoeceu. Sua idade avançada começou a cobrar o preço, a expectativa de vida em Armenzian é de 24 anos, minha mãe chegou aos 30, seu pulmão estava com problema, ela não conseguia respirar, e novamente me vi na mesma situação de anos atrás, mas dessa vez, as coisas não iriam se repetir. Procurei um médico confiável para tratar dela em casa, seu tratamento é caro, mas eu não deixei que aquilo aconteça novamente.
  
  Preciso conseguir $500 toda semana para que ele trate dela.`;
  changeScene(story, () =>{
    criarBotaoHistoria("Continuar", houseUser());
  })
}

function houseUser() {
  advanceTime(1);
  const story = `Você está em casa`;

  changeScene(story, () =>{
    criarBotaoHistoria("Seu quarto (00:01)", userRoom());
    criarBotaoHistoria("Quarto da sua mãe (00:01)", motherRoom());
    criarBotaoHistoria("Sair de casa (00:01)", leftUserHouse());
  })

  /*changeScene(story, (choices) => {
    const fightBtn = document.createElement("button");
    fightBtn.innerText = "Enfrentar o drone";
    fightBtn.onclick = () => startBattle("Drone de Captura");

    const hideBtn = document.createElement("button");
    hideBtn.innerText = "Tentar se esconder";
    hideBtn.onclick = () => hideFromDrone();

    choices.appendChild(fightBtn);
    choices.appendChild(hideBtn);
  }, 300, "storyText", "choices");*/
}

function userRoom(){
  advanceTime(1);
  const story = `Você está no seu quarto, o lugar é vazio e sem graça, sua cama pequena está arrumada e convidativa para dormir`;
  changeScene(story, () =>{
    criarBotaoHistoria("Dormir", sleep());
    criarBotaoHistoria("Sair do quarto (00:01)", houseUser());
  })
}

function sleep(){
  const story = `Quantas horas você quer dormir?`;
  changeScene(story, () =>{
    criarBotaoHistoria("8 horas", dormir(8));
    criarBotaoHistoria("7 horas", dormir(7));
    criarBotaoHistoria("6 horas", dormir(6));
    criarBotaoHistoria("5 horas", dormir(5));
    criarBotaoHistoria("4 horas", dormir(4));
    criarBotaoHistoria("3 horas", dormir(3));
    criarBotaoHistoria("2 horas", dormir(2));
    criarBotaoHistoria("1 hora", dormir(1));
  })
}

function wake(min, hr){
  let sono;
  if(player.sleep<30){
    sono = `você está muito cansado.`;
  }else if(player.sleep>20 && player.sleep<50){
    sono = `você está cansado ainda.`;
  }else if(player.sleep>51 && player.sleep<80){
    sono = `você está alerta.`;
  }else if(player.sleep>80 && player.sleep<=100){
    sono = `você está descansado.`;
  }
  let story = `Você dormiu por ${hr} horas e ${min} minutos, ${sono}
  
  Quer dormir mais?`;

  changeScene(story, () =>{
    criarBotaoHistoria("Voltar a dormir", sleep());
    criarBotaoHistoria("Levantar", userRoom());
  })
}

function motherRoom(){
  advanceTime(1);
  const story = `Você está no quarto de Melody.
  
  ${motherStatus}`;

  changeScene(story, () =>{
    criarBotaoHistoria("Sair do quarto (00:01)", userRoom());
  })
}



function leftUserHouse(){
  advanceTime(1);

}
function hideFromDrone() {
  const story = `Você se esconde atrás de destroços. 
O drone passa lentamente, escaneando a área. Por um momento, o silêncio é absoluto... 
até que a luz vermelha se volta para você.`;

  changeScene(story, (choices) => {
    const foundBtn = document.createElement("button");
    foundBtn.innerText = "O drone te encontrou!";
    foundBtn.onclick = () => startBattle("Drone de Captura");
    choices.appendChild(foundBtn);
  }, 300, "storyText", "choices");
}

/* ========== COMBATE ========== */

/* =========================
   LISTA DE INIMIGOS
========================= */
let enemy = {};

const enemies = {
  drone: {
    name: "Drone de Captura",
    maxHp: 50,
    hp: 50,
    attack: 10,
    defense: 5,
    powerType: "Elétrico",
    status: {},
    description: "Um drone enviado pelo governo para caçar supers.",
  },

  joaoJose: {
    name: "João José",
    maxHp: 120,
    hp: 120,
    attack: 14,
    defense: 10,
    powerType: "Físico",
    status: {},
    description: "Um homem comum, mas com treinamento militar. Seus golpes são precisos e frios.",
  },
};

/* =========================
   INÍCIO DO COMBATE
========================= */
function startBattle(enemyName = "Drone de Captura") {

  // limpa textos e botões da história
const textArea = document.getElementById("powerText");
const choicesArea = document.getElementById("powerChoices");
if (textArea) textArea.innerHTML = "";
if (choicesArea) choicesArea.innerHTML = "";

  // esconde qualquer tela de história que ainda esteja visível
const storyScreens = ["power-screen", "story-screen"];
storyScreens.forEach(id => {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
});

const battle = document.getElementById("battle-screen");
  if (battle) battle.style.display = "block";

const logBox = document.getElementById("battle-log");
if (logBox) logBox.innerHTML = "";


  // procura o inimigo na lista
  const foundEnemy = Object.values(enemies).find(e => e.name === enemyName);
  if (foundEnemy) {
    enemy = structuredClone(foundEnemy);
  } else {
    enemy = { name: enemyName, hp: 50, maxHp: 50, attack: 8, defense: 5, powerType: "Físico", status: {} };
  }

  document.getElementById("story-screen").style.display = "none";
  document.getElementById("battle-screen").style.display = "block";
  const pn = document.getElementById("playerName"); if (pn) pn.innerText = player.name;
  const en = document.getElementById("enemy-name"); if (en) en.innerText = enemy.name;

  player.hp = Math.min(player.hp, player.maxHp);
  player.mana = Math.min(player.mana, player.maxMana);
  player.defending = false;

  updateBars();
  updateSkills();
  log(`⚔️ ${enemy.description || "Um inimigo apareceu!"}`);
}


function updateBars() {
  const pct = (v,m) => Math.max(0, Math.min(100, (v/m)*100));
  const pHp = document.getElementById("player-hp-fill");
  const pMana = document.getElementById("player-mana-fill");
  const eHp = document.getElementById("enemy-hp-fill");
  if (pHp) pHp.style.width = pct(player.hp, player.maxHp) + "%";
  if (pMana) pMana.style.width = pct(player.mana, player.maxMana) + "%";
  if (eHp) eHp.style.width = pct(enemy.hp, enemy.maxHp) + "%";
  updateSidebar();
}

function updateStatusIcons() {
  const playerStatusEl = document.getElementById("player-status");
  const enemyStatusEl = document.getElementById("enemy-status");
  if (!playerStatusEl || !enemyStatusEl) return;

  const emojiMap = {
    burning: "🔥",
    frozen: "❄️",
    bleeding: "🩸",
    confused: "💫",
    blinded: "🌀",
    paralizado: "⚡"
  };
  const descMap = {
    burning: "Queimando — perde HP a cada turno.",
    frozen: "Congelado — ataque para causar muito dano.",
    bleeding: "Sangramento — sofre dano contínuo.",
    confused: "Confuso — chance de perder o turno.",
    blinded: "Cego — ataques têm chance de errar.",
    paralizado: "Paralizado — perde um turno."
  };

  const makeIcons = (entity) => {
    if (!entity.status) return "";
    return Object.keys(entity.status)
      .filter(s => entity.status[s].turns > 0)
      .map(s => {
        const emoji = emojiMap[s] || "?";
        const desc = descMap[s] || s;
        return `<span class="status-icon" data-tip="${desc}">${emoji}</span>`;
      })
      .join("");
  };

  playerStatusEl.innerHTML = makeIcons(player);
  enemyStatusEl.innerHTML = makeIcons(enemy);
}

/* Chame updateStatusIcons() sempre que atualizar turnos ou barras */
function updateBars() {
  const pct = (v,m) => Math.max(0, Math.min(100, (v/m)*100));
  document.getElementById("player-hp-fill").style.width = pct(player.hp, player.maxHp) + "%";
  document.getElementById("player-mana-fill").style.width = pct(player.mana, player.maxMana) + "%";
  document.getElementById("enemy-hp-fill").style.width = pct(enemy.hp, enemy.maxHp) + "%";
  updateSidebar();
  updateStatusIcons(); 
}

/* Narrador dinâmico + aplica efeitos visuais */
function narrateAttack(attacker, defenderName, damage, isCrit, wasDefended, attackType = "fisico") {
  let narration = "";

  if (attacker === "player" && isCrit) {
    switch (attackType) {
      case "Pirocinese":
        narration = `🔥 ${player.name} desencadeia uma explosão de chamas — crítico! ${defenderName} é engolido pelo fogo.`;
        applyStatus(enemy, "burning", 3, Math.max(2, Math.round(enemy.maxHp*0.03)));
        break;
      case "Criogenese":
        narration = `❄️ Um golpe gélido perfeito! ${player.name} congela partes do ${defenderName}, causando dano crítico.`;
        applyStatus(enemy, "frozen", 2);
        break;
      case "Telecinese":
        narration = `🌀 ${player.name} arremessa o ${defenderName} com força total — impacto crítico!`;
        applyStatus(enemy, "confused", 2);
        break;
      case "Eletrocinese":
        narration = `⚡ ${player.name} atinge ${defenderName} com um raio intenso — causando uma descarga neural!`;
        applyStatus(enemy, "paralizado", 1);
        break;
      default:
        narration = `💥 ${player.name} desfere um ataque devastador, um crítico que faz o ${defenderName} cambalear!`;
        applyStatus(enemy, "confused", 2);
    }
    hpShake("enemy");
  } else if (attacker === "player") {
    if (attackType === "fisico"){ 
      narration = `${player.name} ataca o ${defenderName}, causando ${damage} de dano.`
  }else {
      narration = `${player.name} usa ${attackType.toLowerCase()} e causa ${damage} de dano ao ${defenderName}.`;
    }
  }

  if (attacker === "enemy" && isCrit) {
    switch (defenderName) {
      case "Drone de Captura":
        narration = `💥 O ${defenderName} dispara uma rajada concentrada! ${player.name} sente o impacto percorrer o corpo!`;
        applyStatus(player, "confused", 2);
        break;
      default:
        narration = `💥 ${defenderName} acerta um golpe crítico em ${player.name}!`;
        applyStatus(player, "confused", 2);
        if (hasStatus(player, "frozen")) {
          damage *= 2;
          clearStatus(player, "frozen");
          log(`❄️ O gelo que envolvia ${player.name} se quebra com o impacto!`);
          // se quebrar gelo, aplica sangramento por sinergia
          applyStatus(player, "bleeding", 3, 8);
        }
    }
    hpShake("player");
  } else if (attacker === "enemy" && wasDefended) {
    narration = `${defenderName} atacou, mas ${player.name} defendeu parcialmente, reduzindo o dano.`;
  } else if (attacker === "enemy" && !isCrit && !wasDefended) {
    narration = `${defenderName} atacou e causou ${damage} de dano em ${player.name}.`;
    player.hp = matchMedia.max(0, player.hp - damage);

  }

  if (narration) log(narration);
}

/* ===== AÇÕES DO JOGADOR ===== */
function attack() {
  if (!processStatuses(player, "player")) { if (enemy.hp > 0 && player.hp > 0) setTimeout(enemyAttack, 800); return; }
  const blindMiss = hasStatus(player, "blinded") ? 0.35 : 0;
  if (Math.random() < blindMiss) { log(`${player.name} tentou atacar, mas estava cego e errou!`); if (enemy.hp > 0) setTimeout(enemyAttack, 800); return; }

  const critChance = 0.15;
  const isCrit = Math.random() < critChance;
  const base = Math.floor(Math.random()*8) + 8;
  let damage = isCrit ? base*2 : base;

  if (hasStatus(enemy, "frozen")) {
    damage *= 2;
    clearStatus(enemy, "frozen");
    log(`❄️ O gelo que envolvia ${enemy.name} se quebra com o impacto!`);
    // se quebrar gelo, aplica sangramento por sinergia
    applyStatus(enemy, "bleeding", 3, 8);
  }

  enemy.hp = Math.max(0, enemy.hp - damage);
  narrateAttack("player", enemy.name, damage, isCrit, false, "fisico");

  updateBars();
if (enemy.hp <= 0) {
  if(enemy.name == "João José"){
    log(`${enemy.name} puxa uma pistola e dispara contra você. "Você me forçou a isso Senhor ${player.name}"`);
    log("Você desmaia.");
    const logBox = document.getElementById("battle-log");
  if (logBox) {
    const btn = document.createElement("button");
    btn.innerText = "Continuar";

    // usa o estilo padrão dos botões do jogo
    btn.onclick = () => {
      document.getElementById("battle-screen").style.display = "none";
      document.getElementById("power-screen").style.display = "block";
      if(enemy.name == "João José"){
        strangeManWins(); // retorna para a história
      }

    };

    // adiciona o botão diretamente ao log
    logBox.appendChild(btn);
    logBox.scrollTop = logBox.scrollHeight;
  }

  }
  if(enemy.name != "João José"){
    log(` ${enemy.name} foi derrotado!`);
      // Cria o botão de continuar dentro do log
  const logBox = document.getElementById("battle-log");
  if (logBox) {
    const btn = document.createElement("button");
    btn.innerText = "Continuar";

    // usa o estilo padrão dos botões do jogo
    btn.onclick = () => {
      document.getElementById("battle-screen").style.display = "none";
      document.getElementById("story-screen").style.display = "block";
      startStory(); // retorna para a história
    };

    // adiciona o botão diretamente ao log
    logBox.appendChild(btn);
    logBox.scrollTop = logBox.scrollHeight;
  }

  return; // evita continuar o turno após a morte do inimigo
  }

}
  else setTimeout(enemyAttack, 900);
}

function defend() {
  if (!processStatuses(player, "player")) { if (enemy.hp>0) setTimeout(enemyAttack,900); return; }
  player.defending = true;
  log(`${player.name} assume uma postura defensiva.`);
  setTimeout(enemyAttack, 900);
}

function flee() {
  log(`${player.name} tentou fugir!`);
  document.getElementById("battle-screen").style.display = "none";
  document.getElementById("story-screen").style.display = "block";
}

function usePower() {
  if (!processStatuses(player, "player")) { if (enemy.hp > 0) setTimeout(enemyAttack, 900); return; }
  if (!player.powerType) { log("Você ainda não descobriu seu poder!"); return; }

  const manaCost = 15;
  if (player.mana < manaCost) { log("Mana insuficiente!"); return; }

  const blindMiss = hasStatus(player, "blinded") ? 0.25 : 0;
  if (Math.random() < blindMiss) {
    log(`${player.name} tentou usar o poder, mas estava cego e errou!`);
    setTimeout(enemyAttack, 900);
    return;
  }

  const isCrit = Math.random() < 0.18;
  player.mana = Math.max(0, player.mana - manaCost);
  let base = Math.floor(Math.random() * 10) + 8;
  let damage = isCrit ? base * 2 : base;

  // === EFEITOS POR PODER ===
  switch (player.powerType) {
    case "Pirocinese":
      damage += 4;
      enemy.hp = Math.max(0, enemy.hp - damage);
      narrateAttack("player", enemy.name, damage, isCrit, false, "Pirocinese");
      if (isCrit) applyStatus(enemy, "burning", 3, Math.max(2, Math.round(enemy.maxHp * 0.03)));
      break;

    case "Criogenese":
      damage += 2;
      enemy.hp = Math.max(0, enemy.hp - damage);
      narrateAttack("player", enemy.name, damage, isCrit, false, "Criogenese");
      if (isCrit) applyStatus(enemy, "frozen", 2);
      break;

    case "Telecinese":
      damage += 3;
      enemy.hp = Math.max(0, enemy.hp - damage);
      narrateAttack("player", enemy.name, damage, isCrit, false, "Telecinese");
      if (isCrit) applyStatus(enemy, "confused", 2);
      break;

    case "Eletrocinese":
      damage += 4;
      enemy.hp = Math.max(0, enemy.hp - damage);
      narrateAttack("player", enemy.name, damage, isCrit, false, "Eletrocinese");
      if(isCrit) applyStatus(enemy, "paralizado", 1);
      break;
  }

  updateBars();


  if (enemy.hp <= 0) {
  if(enemy.name == "João José"){
    log(`${enemy.name} puxa uma pistola e dispara contra você. "Você me forçou a isso Senhor ${player.name}"`);
    log("Você desmaia.");
    const logBox = document.getElementById("battle-log");
  if (logBox) {
    const btn = document.createElement("button");
    btn.innerText = "Continuar";

    // usa o estilo padrão dos botões do jogo
    btn.onclick = () => {
      document.getElementById("battle-screen").style.display = "none";
      document.getElementById("power-screen").style.display = "block";
      if(enemy.name == "João José"){
        strangeManWins(); // retorna para a história
      }

    };

    // adiciona o botão diretamente ao log
    logBox.appendChild(btn);
    logBox.scrollTop = logBox.scrollHeight;
  }

  }
  if(enemy.name != "João José"){
    log(` ${enemy.name} foi derrotado!`, true);
  }
  }else setTimeout(enemyAttack, 900);
}

/* ========================= DESCRIÇÕES DE ATAQUES DOS INIMIGOS ========================= */
function getEnemyAttackDescription(enemyName) {
  switch (enemyName) {
    case "João José":
      return [
        "João José ataca seu rosto com força!",
        "João José desfere um chute certeiro em suas costelas!",
        "João José dá um soco rápido em seu abdômen!",
        "Ele avança com precisão e te acerta um golpe potente!",
        "João José te golpeia com a frieza de um soldado treinado!"
      ][Math.floor(Math.random() * 5)];

    case "Drone de Captura":
      return [
        "O Drone dispara lasers elétricos em sua direção!",
        "O Drone trava sua mira e atira uma rajada energética!",
        "O Drone vibra no ar e lança uma descarga contra você!"
      ][Math.floor(Math.random() * 3)];

    default:
      return `${enemyName} ataca impiedosamente!`;
  }
}

/* ========== ATAQUE DO INIMIGO ========== */
function enemyAttack() {
  if (!processStatuses(enemy, "enemy")) { return; }

  const blindMiss = hasStatus(enemy, "blinded") ? 0.25 : 0;
  const missChance = 0.1 + blindMiss;
  if (Math.random() < missChance) { log(`${enemy.name} errou o ataque!`); return; }

  const isCrit = Math.random() < 0.15;
  let base = Math.floor(Math.random()*enemy.attack) + 6;
  let damage = isCrit ? base*2 : base;

  const wasDefended = player.defending;
  if (wasDefended) { damage = Math.floor(damage/2); player.defending = false; }

  if (hasStatus(player,"frozen")) { damage *= 2; clearStatus(player,"frozen"); log(`❄️ O gelo que cobria ${player.name} se quebra com o impacto!`); applyStatus(player,"bleeding",3,8); }

  log(getEnemyAttackDescription(enemy.name)); // mensagem de ataque personalizada

  player.hp = Math.max(0, player.hp - damage);
  if(player.hp <=0){
    player.hp = 0;
    updateBars();
    log(`☠️ ${player.name} foi derrotado...`)
    const logBox = document.getElementById("battle-log");
   if (logBox) {
     const btn = document.createElement("button");
     btn.innerText = "Continuar";
 
     // usa o estilo padrão dos botões do jogo
     btn.onclick = () => {
       document.getElementById("battle-screen").style.display = "none";
       document.getElementById("power-screen").style.display = "block";
       if(enemy.name == "João José"){
         strangeManWins(); // retorna para a história
       }
      };

          // adiciona o botão diretamente ao log
    logBox.appendChild(btn);
    logBox.scrollTop = logBox.scrollHeight;

    }
    return;
    
  }
  updateBars();
  if (isCrit) hpShake("player");

  
  // inimigo crítico pode aplicar bleed
  if (isCrit) {
    if (enemy.name === "Drone de Captura" && Math.random() < 0.35) applyStatus(player,"bleeding",3,6);
  }

  if (isCrit) narrateAttack("enemy", enemy.name, damage, true, wasDefended);
  else narrateAttack("enemy", enemy.name, damage, false, wasDefended);

  updateBars();
  if (player.hp <= 0){
    player.hp = 0;
    updateBars();
    log(`☠️ ${player.name} foi derrotado...`)
   const logBox = document.getElementById("battle-log");
  if (logBox) {
    const btn = document.createElement("button");
    btn.innerText = "Continuar";

    // usa o estilo padrão dos botões do jogo
    btn.onclick = () => {
      document.getElementById("battle-screen").style.display = "none";
      document.getElementById("power-screen").style.display = "block";
      if(enemy.name == "João José"){
        strangeManWins(); // retorna para a história
      }

    };

    // adiciona o botão diretamente ao log
    logBox.appendChild(btn);
    logBox.scrollTop = logBox.scrollHeight;
  }

  return; // evita continuar o turno após a morte do inimigo
}
  } 

/* ========== CONTROLE DE TURNOS ========== */
function playerTurn(action) {
  action();
}

/* ========== LOG / NARRAÇÃO (com histórico colorido e scroll automático) ========== */
function log(msg) {
  const el = document.getElementById("battle-log");
  if (!el) return;

  const p = document.createElement("p");
  p.innerText = msg;

  // Define uma classe CSS com base no tipo da mensagem
  if (/💀|☠️/i.test(msg)) p.classList.add("log-death");
  else if (/🔥|queim|Pirocinese|fogo/i.test(msg)) p.classList.add("log-fire");
  else if (/❄️|gelo|Criogenese|frio/i.test(msg)) p.classList.add("log-ice");
  else if (/🌀|Telecinese|impacto/i.test(msg)) p.classList.add("log-tele");
  else if (/⚡|paralis|eletrocinese|raio/i.test(msg)) p.classList.add("log-eletric");
  else if (/💥|crítico|critico/i.test(msg)) p.classList.add("log-crit");
  else if (/defendeu|reduzido|bloque/i.test(msg)) p.classList.add("log-defense");
  else if (/errou|falhou|confuso/i.test(msg)) p.classList.add("log-miss");
  else if (/sangra|sangramento/i.test(msg)) p.classList.add("log-bleed");
  else p.classList.add("log-normal");

  if (/crítico|critico/i.test(msg)) {
  p.style.fontWeight = "bold";
  p.style.textShadow = "0 0 6px red";
}

  el.appendChild(p);
  el.scrollTop = el.scrollHeight; // rola para o fim automaticamente
}


/* ========== SKILL BUTTONS ========== */
let playerSkills = [
  { name: "Atacar", action: () => playerTurn(attack) },
  { name: "Usar Poder", action: () => playerTurn(usePower) },
  { name: "Defender", action: () => playerTurn(defend) },
  { name: "Fugir", action: flee }
];
function updateSkills() {
  const container = document.getElementById("skill-buttons");
  if (!container) return;
  container.innerHTML = "";
  playerSkills.forEach(skill => {
    const btn = document.createElement("button");
    btn.innerText = skill.name;
    btn.onclick = skill.action;
    container.appendChild(btn);
  });
}

/* ========== INICIALIZAÇÃO FINAL ========== */
updateSidebar();
updateGameTimeDisplay();
