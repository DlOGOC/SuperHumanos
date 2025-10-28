/* ======= script.js ======= */

/* ===== DADOS DO JOGADOR ===== */
let player = {
  name: "",
  hp: 100, maxHp: 100,
  mana: 50, maxMana: 50,
  hunger: 100, sleep: 100, energy: 100,
  strength: 10, intelligence: 10, skill: 10, defense: 10, vigor: 8,
  powerType: null,
  defending: false,
  status: {} // e.g. { burning: {turns:3, value:3}, frozen: {turns:2} }
};

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
  minute: 0,
  hour: 8,
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
  const powers = ["Pirocinese", "Criogenese", "Telecinese", "Eletrocinese"];
  player.powerType = powers[Math.floor(Math.random() * powers.length)];

  const story = `Tudo começou quando você ainda era criança. 

Seus pais sempre contavam como sentiam que você era especial. 
Tudo aconteceu bem na sua infância — você era uma criança normal e feliz. 

As coisas começaram a mudar quando as dores de cabeça começaram. 
Seus pais mudaram do dia para a noite; você já não podia mais sair de casa. 
Fazia exercícios físicos todos os dias e começou a se sentir preso em sua própria casa. 

Mas você, era uma criança obediente e que amava seus pais, então sempre obedecia. 
Com o passar dos anos, começou a adquirir músculos mais definidos e, quando raramente saía, 
não conseguia mais se entrosar com pessoas facilmente. Foi como um baque. 

"Eu não sou normal" — era o que se passava na sua cabeça sempre que saía. 
Você via crianças sorrindo e aproveitando suas infâncias, algo que você, por algum motivo que nunca soube, 
perdeu do dia para a noite. Mas isso ainda não foi o suficiente para te abalar. 
Afinal, seus pais te amam e cuidam de você, e isso era tudo o que você precisava.`;

  changeScene(story, () =>{
    criarBotaoHistoria("Continuar", continueBackStory);
  })
}

function continueBackStory() {
  const story = `Com os anos se passando, você crescia e seus pais envelheciam.

Quando você fez 18 anos, seu presente de aniversário não foi algo que você gosta de lembrar.

Mas mesmo assim, você lembra, de cada detalhe.

O dia estava claro e ensolarado, não combinava nem um pouco com o que você estava prestes a ver 
quando abrisse a porta do quarto de seus pais.

Seus corpos frios e sem cor foram o primeiro sinal que você teve. 
Quando se aproximou, pôde sentir que eles já não mais estavam neste mundo. 
Eles te ensinaram a medir o pulso, e você fez isso — o que só confirmou suas suspeitas.

Eles estavam mortos.`;

  changeScene(story, () =>{
    criarBotaoHistoria("Continuar", backStory2);
  })
}

function backStory2(){
  
  let story = "";

  switch (player.powerType) {
    case "Pirocinese":
      story = `A sala começou a ficar mais quente, tudo parecia estar queimando, a raiva, a confusão, destruindo sua mente.
      
      Você se lembra dos momentos que passou com seus pais, os momentos felizes, os momentos tristes, tudo, um mar de memórias inunda sua mente e a percepção de que nada disso vai voltar faz com que você sinta que está morto por dentro.
      
      Seu corpo esquenta, está muito quente, "por que está tão quente?" você se pergunta até sentir lágrimas cairem e queimar seu rosto, evaporando antes mesmo de tocar sua bochecha, você grita de dor, seu rosto queimando, a dor não para, cada lágrima é uma dor diferente.
      
      Você tenta se acalmar, fecha os olhos e respira fundo, pensando no abraço de sua mãe, tentando enganar a sua mente de que tudo está bem.
      
      Você consegue se acalmar aos poucos, então abre os olhos, e novamente, mais uma cena de terror.
      
      O quarto está carbonizado, suas roupas em frangalhos, você sente dentro de você...
      
      A sua habilidade, é Pirocinese.`
      
      break;
    case "Criogenese":
      story = `A sala começa a esfriar, tudo começa a ficar frio, você sente seu próprio corpo ficando frio, sua respiração o unico vapor quente na sala.
      
      A princípio você acha que isso é apenas dor do luto. Mas quando você começa a chorar, escuta um barulho no chão, ao olhar, suas lágrimas ao caírem se quebram, congeladas.
      
      Você se assuta com essa visão, tocando por estinto em seu rosto e sentindo o quão frio está.
      
      Caindo sentado em uma pilha de cacos de gelo quebrado, sua respiração fica irregular, seu coração apertado, tentando retomar o controle você ouve um barulho ensurdecedor e deixa um grito irromper da sua garganta.
      
      Quando se dá conta, todo o quarto está congelado, gelo saindo por toda parte.
      
      Apesar do medo, algo dentro de você se alegra ao ver o lugar, quase como a sensação de ver um trabalho que concluiu, você sente dentro de você...
      
      A sua habilidade é Criogenese.`;

      break;

      case "Telecinese":
        story = `Um barulho ensurdecedor que faz seu cérebro chacolahar e então você está no chão, gritando de agonia.
        
        Lágrimas escorrendo dos seus olhos, seu corpo se contorcendo até o barulho começar a ficar mais nítido... Vozes. Milhares de vozes, sua cabeça parece que vai explodir.
        
        Você coloca as mãos nos ouvidos inutilmente tentando abafar o som, mas é impossível, a dor é tanto que sua mente entorpece.
        
        Por um segundo as vozes passam, e esse tempo é suficente para você perceber o seu arredor...
        
        Tudo está flutuando, inclusive você, a cômoda, o guarda-roupas, a cama em que seus pais estavam deitados antes, que agora flutuam por cima.
        
        Seus olhos se arregalam, confusão sendo agora a única coisa que passa por sua mente.
        
        Você respira e fecha os olhos, tentando se concentrar e lentamente, começa a sentir que está descendo até o chão.
        
        Quando abre os olhos de novo, tudo está de volta no lugar, e você sente, no fundo do seu âmago:
        
        A sua habilidade é Telecinese.`;

        break;
      
      case "Eletrocinese":
        story = `O som de um zumbido preenche seus ouvidos, tão alto que parece vir de dentro da sua cabeça.

          Você sente algo percorrendo seu corpo — rápido, imprevisível, como se suas veias estivessem vivas. 
          Ao olhar para suas mãos, percebe pequenas faíscas estalando entre os dedos.

          Um lampejo de medo te domina. O ar ao redor vibra, e o cheiro de queimado invade o quarto. 
          As lâmpadas explodem uma a uma, e as faíscas se transformam em descargas que percorrem as paredes.

          Com o coração acelerado, você respira fundo, tentando controlar a corrente elétrica que agora corre dentro de você. 
          A sensação é viciante e aterrorizante ao mesmo tempo.

          Você entende, no fundo, que algo mudou para sempre.

          Sua habilidade é Eletrocinese.`;

      break;
    default:
      break;
  }
  // Revela o talento na interface
const talentLine = document.getElementById("talent-line");
if (talentLine) talentLine.style.display = "block";
updateSidebar();

    changeScene(story, () =>{
    criarBotaoHistoria("Continuar", backStory3);
  })
}
 
function backStory3() {
  advanceTime(30, 15, 3);
  meetCharacter("João José");
  const story = `Alguns dias se passaram e você está no velório de seus pais, foi um dia triste, mas necessário, você pode se despedir adquadamente, surpeendentemente, a dor do seu luto diminui, e isso faz você se sentir estranho.
  
  O dia se passa e vários familiares aparecem, afinal seus pais eram muito amados pela família, mas todos sabiam que você era quem sofria mais, então todos te abraçavam e ofereciam ajuda, que você educadamente recusava, afinal, você já tinha um objetivo em mente: descobrir o que matou seus pais.
  
  Afinal, a autopsia não revelou nada, e isso não saia da sua cabeça.
  
  Seus pensamentos são interrompidos quando um homem que você nunca viu aparece, ele aparenta estar procurando alguém e quando ele olha para você, parece que ele encontrou.
  
  O homem caminha em sua direção lentamente, com uma expressão resoluta. Seu terno preto, junto com seu fedora também preto, seus cabelos dourados se destacavam por ser a única coisa além de sua pele branca que não eram pretos.
  
  Quando chega em você, o homem tira seu chapéu e faz uma mensura.
  
  "Meu nome é João José, meus pêsames por sua perda, senhor ${player.name}. Sinto muito ter que dar mais uma notícia ruim para você, mas..." — dimnuindo a voz, quase um cochicho ele continuou "você foi descoberto. Na verdade, não ainda. Mas o governo sabe que nasceu um super. Eu dei um jeito de que as coisas ainda não apontem para você, mas nada que fosse definitivo. Sei que é estranho e sua cabeça deve estar a mil agora, mas preciso que venha comigo. Posso te deixar seguro."`;

    changeScene(story, () =>{
    criarBotaoHistoria("Aceitar ir com o desconhecido", strangeMan);
    criarBotaoHistoria("Recusar ir com o desconhecido", backStory4);
  })
  }

  function backStory4(){
    changeFriendship("João José", -5)
    const story = `Você nega, não importa quem esse homem é, tudo isso parece ser uma armadilha "como ele sabe meu nome?" e "como ele descobriu o que eu sou?" são algumas das perguntas que passam por sua mente, você não pode confiar nele.
    
    Algo na entrada do cemitério chama a sua atenção, um carro chega, um carro preto, lentamente entrando e indo até o estacionamento, você nunca viu esse carro antes, e só tem vocês ali, isso é estranho. 
    
    A atenção de João José também vai até o carro, e quando ele volta a atenção até você, sua expreção é de medo.
    
    "Eles chegaram!" diz ele, pegando do seu braço com uma força que você não imaginava que ele tinha e te puxando com ele.`;

    changeScene(story, () =>{
    criarBotaoHistoria("Deixar que ele te leve", strangeMan);
    criarBotaoHistoria("Resistir", recuseStrangeMan);
  })
  }

function strangeMan(){
  const story = `Você deixa o homem te levar até o seu carro, ele abre a porta de trás para você e faz a volta para ir até o banco do motorista "Eu queria te deixar na frente, mas nós precisamos pegar alguém no caminho e... Digamos que ela gosta muito de sentar no banco da frente."`;

  changeScene(story, () =>{
    criarBotaoHistoria("Continuar", strangeManCar);
  })
}

function strangeManCar(){
  advanceTime(20, 1);
  const story = `Vocês andam um pouco, na janela, você pode ver que está em uma estrada de terra, algumas árvores aparecem periódicamente, o calor é suprimido pelo ar-condicionado do carro, então a viagem é agradavel apesar de tudo. 
  
  Depois de alguns minutos, o carro diminui a velocidade e para. 
  
  A porta do carona abre rápidamente e uma pessoa coberta por uma capa entra e fecha a porta já dando espaço para o carro andar.
  
  "Senhor ${player.name}, te apresento a senhorita Maria, ela também é uma super, como você, também é a lider desta organização. Antes que nós cheguemos, eu gostaria de pedir desculpas pela forma que nos conhecemos, acredite em mim, eu gostaria de ter conseguido te achar antes, mas eu nunca consegui te localizar nem mesmo com outros supers que tinham habilidade para isso. Também queria que tivéssemos tido tempo para te explicar as coisas e não precisarmos de todo esse fuzuê, mas não se preocupe, não existe lugar mais seguro para você do que nossa organização."`;

    changeScene(story, () =>{
    criarBotaoHistoria("Continuar", strangeManCar2);
  })
}

function recuseStrangeMan() {
  changeFriendship("João José", -5);
  const story = `Você força e não deixa o homem te levar, o que não agrada nem um pouco ele, que aumenta a força e fala com a voz irritada "Você quer morrer garoto? Eles estão aqui para descobrir quem é o super, se te acharem, sua vida vai acabar. Eu queria poder te dar uma escolha, mas não é assim que o mundo funciona, não vou deixar que você acabe com a sua vida dessa forma"
  
  Ele solta seu braço e se prepara para luta.`;

  changeScene(story, (choices) => {
    const foundBtn = document.createElement("button");
    foundBtn.innerText = "Em guarda";
    foundBtn.onclick = () => startBattle("João José");
    choices.appendChild(foundBtn);
  }, 300, "powerText", "powerChoices");
}

function strangeManWins() {
  dormir(20,1);
  const story = `Você acorda no banco de trás de um carro em movimento, dirigido por aquele homem de antes.
  
  Você levanta rápido e ele logo diz "Você dormiu bem? O que eu usei em você foi só um dardo tranquilizante, afinal, eu não podia deixar você ficar fazendo aquele drama todo e estragar toda a operação".`;

    changeScene(story, () =>{
    criarBotaoHistoria("Ficar calado", aceptStrangeMan2);
    criarBotaoHistoria(`"Você me sequestrou"`, recuseStrangeMan2);
  })
}

function aceptStrangeMan2(){
  const story = `Você fica quieto e o homem acena com a cabeça em aprovação. Nós vamos precisar pegar uma pessoa no caminho, e então vamos para a base, te apresentar para os outros.`;

    changeScene(story, () =>{
    criarBotaoHistoria("Continuar", strangeManCar);
  })
}
function recuseStrangeMan2(){
    const story = `"Você não me deu escolha, queria que eu fizesse o que? Deixasse que eles nos capturassem?" sua voz fica fria, exalando irritação "Não me faça atirar de novo. Fique quieto que já estamos chegando."`;

    changeScene(story, () =>{
    criarBotaoHistoria("Continuar", strangeManCar);
  })
}

function strangeManCar2(){
  const story = `"Peço desculpas pelas ações do Senhor João, ${player.name}, ele não é alguém muito gentil, espero que você não tenha tido problemas com ele" ela vira para você e te da um sorriso amigável "Como eu tenho certeza que ele não te explicou nada, por favor, me permita te dizer o que somos nós. Nós somos a associação Super Humanos, protegemos e auxiliamos pessoas como você, tanto a se esconder quanto a dar uma vida normal. Mas isso é você quem decidirá, apenas queremos que mais pessoas como você consigam viver vidas normais da melhor forma possível, afinal, você sabe o que acontece com os super que o governo acha primeiro." um silêncio mórbido se instala no carro, até que a mulher continua "Mas nós não precisamos falar disso, desde a nossa fundação, nunca algo ruim aconteceu com algum super, como líder da compainha, me orgulho em falar que nenhum de nossos protegidos foram pegos, e os que foram, hoje estão vivos e bem na nossa base central."
  
  O carro para.
  
  "Senhoras e senhores, chegamos!" diz João, retirando o sinto e saindo do carro para abrir a porta do carona para Maria, que por sua vez, abre a porta para você.`;

  changeScene(story, () =>{
    criarBotaoHistoria("Continuar", baseSuper);
  })
}
function baseSuper(){
  const story = `Vocês saem do carro e andam pelas instalações, várias pessoas trabalhando, alguns super treinando, e todos que passam por vocês, comprimentam um a um, definitivamente o ambiente é agradável, quando entram dentro de um estabelecimento, Maria começa a guiar o caminho, parando em um quarto, o número 245 estampado do lado da porta: 

  "Este vai ser o seu quarto senhor ${player.name}, você ira dividir o quarto com uma pessoa que também acabou de chegar aqui" ela bate na porta e um homem que aparenta ter a sua idade, cabelos escuros e olhos verdes que constrastam com sua pele clara abre a porta, ele está vestindo o mesmo uniforme branco que todos os outros que estavam lá fora "Este é o senhor Leandro" diz Maria apontando para a pessoa, e depois aponta para você "e este é o senhor ${player.name}, espero que vocês consigam se adaptar, sei que vocês devem estar cansados e que a vinda para cá pode ter sido estressante, mas por favor, durmam e jantem, amanhã vocês terão todas as respostas de que precisam."`;

  changeScene(story, () => {
    criarBotaoHistoria("Entrar no quarto", quarto1);
  })
}

function quarto1(){
  const story = `Você está no quarto, Leandro está deitado na cama de cima, ele parece tão tímido quanto você.`
  changeScene(story, () =>{
    criarBotaoHistoria("Conversar com Leandro", quartoLeando);
    criarBotaoHistoria("Comer", comerSozinho)
    criarBotaoHistoria("Dormir", quartoLeandoDormir);
  })
}

function comerSozinho(){
  const story = `Você come sozinho, o pão está delicioso, mas a bebida você não consegue distinguir o gosto, ainda assim está boa.`;
  player.hunger = 100;
  updateSidebar();
  changeScene(story, () =>{
    criarBotaoHistoria("Conversar com Leandro", quartoLeando);
    criarBotaoHistoria("Dormir", quartoLeandoDormir);
  })
}

function quartoLeando(){

  let skillFalada = ``;

  switch (player.powerType) {
    case "Pirocinese": skillFalada = `eu consigo criar e controlar o fogo`;
      break;
    case "Criogenese": skillFalada = `eu consigo criar e controlar o gelo`;
      break;
    case "Telecinese": skillFalada = `eu consigo controlar as coisas com a mente`;
      break;
    case "Eletrocinese": skillFalada = `eu consigo criar e controlar a eletricidade`;
    default:
      break;
  }

    let story = `Você chega perto de Leandro e ele se empertiga "Oi!", você acena para ele que responde "Você também tem poderes?"
  "Sim", você responde "${skillFalada}", e você?
  "Ehh... Eu só consigo trocar a cor das coisas... É meio inútil, eu sei, mas pelo menos, minhas roupas nunca parecem sujas", ele dá um sorriso, que logo se espelha em seu rosto.
  "Como você descobriu o seu poder?", pergunta Leandro, meio sem jeito "Claro, se não for muito pessoal"`;

  changeScene(story, () =>{
    criarBotaoHistoria("Falar", falar1);
    criarBotaoHistoria("Não falar", ficarCalado1);
  })
}

function falar1(){
  switch (player.powerType) {
    case "Pirocinese": skillFalada = `o quarto estava queimando, tudo estava muito quente, foi assim que eu pecebi que o meu poder era com o fogo.`;
      break;
    case "Criogenese": skillFalada = `o quarto havia congelado, pilares de gelo começaram a brotar do chão... foi aí que eu perecebi que o meu poder era com o gelo.`;
      break;
    case "Telecinese": skillFalada = `todas as coisas do quarto começaram a flutuar, até mesmo eu flutuava, e minha cabeça doía, doía muito, quando a dor passou, todas as coisas voltaram para o chão.`;
    default:
    case "Eletrocinese": skillFalada = `eu senti uma corrente elétrica passando por mim que me fez tremer, aquilo não era possível, até que tudo que era elétrico começou a explodir e eu sentia como se fosse em mim, mas eu consegui me conter antes de acontecer algo de perigoso.`;
      break;
  }
  let story = `Você respira, a memória do que aconteceu ainda viva na sua mente, depois de alguns segundos, você consegue falar: 
  
  "A poucos dias, os meus pais morreram, e o choque foi imenso... quando eu percebi ${skillFalada}"`;

  changeScene(story, () =>{
    criarBotaoHistoria("continuar", dormirLeandro);
  })
}

function ficarCalado1(){
 const story = `Você respira fundo, lembrando das coisas que aconteceram quando você perdeu seus pais, você tenta falar mas as palavras prendem na sua garganta.
  
  "Desculpa, é muito difícil falar disso, espero que você entenda que não é nada pessoal."
  
  "Tudo bem" diz ele, envergonhado de ter feito uma pergunta muito pessoal "eu entendo, têm muitas coisas difíceis acontecendo com a gente esses dias."`;

  changeScene(story, () =>{
    criarBotaoHistoria("Continuar", fome);
  })
}

function fome(){
  const story = `Um barulho alto sai do seu estômago, sinalizando que você está com fome, antes que você possa ficar envergonhado, o mesmo som ecoa de Leandro:
  
  "Vamos comer? Não sei o que é aquilo, mas parece delicioso" diz leandro, apontando para dois copos contendo um liquido estranho e alguns pães em cima de uma mesa, ele espera você ir para seguir atrás de você.`;
  changeScene(story, () =>{
    criarBotaoHistoria("Jantar com Leandro", jantarLeandro);
  })
}

function jantarLeandro(){
  const story = `Vocês começam a comer, o gosto é estranho no início, mas o líquido começa a ficar saboroso, quanto mais você toma, menos sabe o que é. Você olhar para Leandro e parece que esta dúvida se espelha nele, mas vocês eventualmente acabam comendo tudo.`;
  player.hunger = 100;
  updateSidebar();
  changeScene(story, () =>{
    criarBotaoHistoria("Dormir", dormirLeandro);
  })
}
changeFriendship
function dormirLeandro(){
  const story = ``;
  changeScene(story, () =>{
    criarBotaoHistoria("...", dormirLeandro);
  })
}

function quartoLeandoDormir(){
  const story = `Você silenciosamente deita na cama de baixo, cansado e ainda confuso, você tenta dormir.`;
  dormir(0, 9);
  player.hunger = 100;
  updateSidebar();
  changeScene(story, () =>{
    criarBotaoHistoria("Acordar", quarto1)
  })
}
function startStory() {
  const story = `Um drone do governo se aproxima. O que você faz?`;

  changeScene(story, (choices) => {
    const fightBtn = document.createElement("button");
    fightBtn.innerText = "Enfrentar o drone";
    fightBtn.onclick = () => startBattle("Drone de Captura");

    const hideBtn = document.createElement("button");
    hideBtn.innerText = "Tentar se esconder";
    hideBtn.onclick = () => hideFromDrone();

    choices.appendChild(fightBtn);
    choices.appendChild(hideBtn);
  }, 300, "storyText", "choices");
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
