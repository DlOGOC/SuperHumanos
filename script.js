console.log("SCRIPT CARREGADO");

/* ======= script.js ======= */
function distributeAttributePoints(player){
  const attribute = ["strength", "intelligence", "dex", "defense", "faith", "vigor", "mind"];

  attribute.forEach(attr => player[attr] = 1);

  let remaingPoints = 30;

  while(remaingPoints >0){
    const attr = attribute[Math.floor(Math.random() * attribute.length)]

    if(player[attr] <8){
      player[attr]++;
      remaingPoints--;
    }
  }
}

/* ===== DADOS DO JOGADOR ===== */

const BASE_HP = 50;
const HP_PER_VIGOR = 8;

const BASE_MANA = 20;
const MANA_PER_MIND = 6;

function recalculateMaxStats() {

  const oldMaxHp = player.maxHp || 1;
  const oldMaxMana = player.maxMana || 1;

  // ===== VIDA =====
  const vigor = player.vigor;
  let hpBonus;

  if (vigor <= 10) {
    hpBonus = vigor * HP_PER_VIGOR;
  }
  else if (vigor <= 20) {
    hpBonus =
      10 * HP_PER_VIGOR +
      Math.floor((vigor - 10) * HP_PER_VIGOR * 0.6);
  }
  else {
    hpBonus =
      10 * HP_PER_VIGOR +
      Math.floor(10 * HP_PER_VIGOR * 0.6) +
      Math.floor((vigor - 20) * HP_PER_VIGOR * 0.3);
  }

  player.maxHp = BASE_HP + hpBonus;


  // ===== MANA =====
  const mind = player.mind;
  let manaBonus;

  if (mind <= 10) {
    manaBonus = mind * MANA_PER_MIND;
  }
  else if (mind <= 20) {
    manaBonus =
      10 * MANA_PER_MIND +
      Math.floor((mind - 10) * MANA_PER_MIND * 0.6);
  }
  else {
    manaBonus =
      10 * MANA_PER_MIND +
      Math.floor(10 * MANA_PER_MIND * 0.6) +
      Math.floor((mind - 20) * MANA_PER_MIND * 0.3);
  }

  player.maxMana = BASE_MANA + manaBonus;


  // ===== PRESERVAR PROPORÇÃO =====
  player.hp = Math.round(player.hp * (player.maxHp / oldMaxHp));
  player.mana = Math.round(player.mana * (player.maxMana / oldMaxMana));

  // ===== SEGURANÇA =====
  player.hp = Math.max(1, Math.min(player.hp, player.maxHp));
  player.mana = Math.max(0, Math.min(player.mana, player.maxMana));

  applyShieldBonus();
  updateSidebar();
}

function applyShieldBonus() {
  const sub = player.equippedSubWeapon;

  if (sub && shields[sub.name]) {
    player.defense += shields[sub.name].defenseBonus;
  }
}

let player = {
  name: "",
  level: 1,
  xp:0,
  xpToNext:100,
  statPoints:0,
  hp: 100, maxHp: 100,
  mana: 50, maxMana: 50,
  hunger: 100, sleep: 100, energy: 100,
  strength: 10, intelligence: 10, dex: 10, defense: 10, faith:10, mind: 10, 
  vigor: 8,
  money: 0,
  guild: null,
  guildMember: false,
  defending: false,
  status: {}, // e.g. { burning: {turns:3, value:3}, frozen: {turns:2} }
  mainWeapons: "Mãos vazias",
  subWeapons: "Mãos vazias",
  learnedSkills: [],
  isVampire: false,
  isWerewolf: false,
  equippedArmor: null,
  inventory: {
    weapons: [],
    shields: [],
    armors: [],
    keyItems: [],
    books: []
  },
  vampireClaws: {
    active: false,
    turns: 0,
    previousMain: null,
    previousSub: null
}

};

function calculateXpForLevel(level) {
  return Math.floor(90 * Math.pow(1.35, level - 1));
}

function updateLevelButtons() {
  const show = player.statPoints > 0;

  const ids = [
    "btn-up-str",
    "btn-up-int",
    "btn-up-faith",
    "btn-up-mind",
    "btn-up-dex",
    "btn-up-def",
    "btn-up-vigor"
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.classList.toggle("show", show);
  });
}


function increaseStat(stat) {
  if (player.statPoints <= 0) return;

  player[stat] += 1;
  player.statPoints -= 1;

  recalculateMaxStats();

  if (player.statPoints <= 0) {
    document.getElementById("levelUpBox").style.display = "none";
  }

  updateSidebar();
  saveGame();
}

function levelUp() {
  player.level += 1;
  player.xp -= player.xpToNext;
  player.xpToNext = calculateXpForLevel(player.level);

  player.statPoints += 1;

  updateSidebar();
  updateLevelButtons();
}

function spendPoint(stat) {
  if (player.statPoints <= 0) return;

  player[stat] += 1;
  player.statPoints -= 1;

  recalculateMaxStats();
  updateSidebar();
  updateLevelButtons();

  saveGame();
}

function gainXP(amount) {
  player.xp += amount;

  while (player.xp >= player.xpToNext) {
    levelUp();
  }

  updateSidebar();
  saveGame();
}

/* ===== IMAGEM DO JOGADOR =====*/
const playerFace = {
  skin: "skin_1",
  skin_color: "light",
    skin_effects: {
    vitiligo: false,
    freckles: false
  },
  eye_shape: "eye_1",
  eye_color: "blue",
  hasDarkCircles: false,
  hair_front: "hair_1",
  hair_back:  "hair_1",
  hair_front_color: "black",
  hair_back_color:  "black",
  eyebrow_shape: "brow_1",
  eyebrow_color: "black",
  mouth: "mouth_1",
  cloth: "base"
};

let barberPreview = null;



/* ===== CAPTURA DOS ELEMENTOS DO DOM =====*/
const noneRadio = document.getElementById("effect-none");
const vitiligoCheckbox = document.getElementById("vitiligo-toggle");
const frecklesCheckbox = document.getElementById("freckles-toggle");

function syncSkinEffectsUI() {
  const anyEffectChecked =
    vitiligoCheckbox.checked || frecklesCheckbox.checked;

  if (anyEffectChecked) {
    noneRadio.checked = false;
  }

  if (noneRadio.checked) {
    vitiligoCheckbox.checked = false;
    frecklesCheckbox.checked = false;
  }

  playerFace.skin_effects.vitiligo = vitiligoCheckbox.checked;
  playerFace.skin_effects.freckles = frecklesCheckbox.checked;

  updateSkinEffects();
}

noneRadio.addEventListener("change", syncSkinEffectsUI);
vitiligoCheckbox.addEventListener("change", syncSkinEffectsUI);
frecklesCheckbox.addEventListener("change", syncSkinEffectsUI);


function updateSkinEffects() {
  updateVitiligo();
  updateFreckles();
}

/* ===== ATUALIZAR PERFIL =====*/

const EMPTY_IMG = "img/common/empty.webp";

function safeSetImage(imgElement, src) {
  if (!imgElement) return;

  imgElement.onerror = () => {
    imgElement.src = EMPTY_IMG;
  };

  imgElement.src = src;
}

function updateEyebrow() {
  const colorImg = document.getElementById("eyebrow-color");
  const lineImg  = document.getElementById("eyebrow-line");

  if (!colorImg || !lineImg) return;

  if (playerFace.eyebrow_shape === "none") {
    colorImg.src = EMPTY_IMG;
    lineImg.src  = EMPTY_IMG;
    return;
  }

  const basePath = `img/eyebrows/${playerFace.eyebrow_shape}`;

  colorImg.src = `${basePath}/color/${playerFace.eyebrow_color}.webp`;
  lineImg.src  = `${basePath}/line/${playerFace.eyebrow_color}.webp`;
}

function updateHairFront() {
  const base = `img/hair/front/${playerFace.hair_front}/${playerFace.hair_front_color}`;

  document.getElementById("hair-front-color").src = `${base}_color.webp`;
  document.getElementById("hair-front-line").src  = `${base}_line.webp`;

  updateWerewolfEars();
}

function updateHairBack() {
  const base = `img/hair/back/${playerFace.hair_back}/${playerFace.hair_back_color}`;

  document.getElementById("hair-back-color").src = `${base}_color.webp`;
  document.getElementById("hair-back-line").src  = `${base}_line.webp`;
}

function updateHair(){
  updateHairBack();
  updateHairFront();
}

function updateVitiligo() {
  const img = document.getElementById("skin-vitiligo");
  if (!img) return;

  if (!playerFace.skin_effects.vitiligo) {
    img.src = EMPTY_IMG;
    return;
  }

  if(!player?.isVampire){
      img.src =
    `img/faces/skin/effects/vitiligo/${playerFace.skin}/${playerFace.skin_color}.webp`;
  } else{
    img.src = `img/faces/skin/effects/vitiligo/${playerFace.skin}/ears_${playerFace.skin_color}.webp`;
    img.classList.add("flip");
  }

}

function updateFreckles() {
  const img = document.getElementById("skin-freckles");
  if (!img) return;

  if (!playerFace.skin_effects.freckles) {
    img.src = EMPTY_IMG;
    return;
  }
  
  if(!player?.isVampire){
    img.src = `img/faces/skin/effects/freckles/${playerFace.skin}/${playerFace.skin_color}.webp`;
  }else{
    img.src = `img/faces/skin/effects/freckles/${playerFace.skin}/ears_${playerFace.skin_color}.webp`;
  }
  
}

function updateSkin() {
  const base = `img/skin/base/${playerFace.skin}/${playerFace.skin_color}`;

  document.getElementById("skin-color").src = `${base}_color.webp`;
  document.getElementById("skin-line").src  = `${base}_line.webp`;
  updateVitiligo();
  updateVampireEars();
}

function updateEyes() {
  const sclera = document.getElementById("eye-sclera");
  const line   = document.getElementById("eye-line");
  const color  = document.getElementById("eye-color");

  if (!sclera || !line || !color) return;

  const base = `img/eyes/${playerFace.eye_shape}`;

  sclera.src = `${base}/sclera.webp`;
  line.src   = `${base}/line.webp`;
  color.src  = `${base}/colors/${playerFace.eye_color}.webp`;

  updateFatigueVisuals();

}

function updateVampireEye(){
  const img = document.getElementById("eye-color");
  if(!img) return;

  img.src = `img/eyes/${playerFace.eye_shape}/colors/vampire.webp`;

}

function updateVampireEars(){
  const lineImg  = document.getElementById("vampire-ears-line");
  const colorImg = document.getElementById("vampire-ears-color");

  if (!lineImg || !colorImg) return;

  if (!player?.isVampire){
    lineImg.src  = EMPTY_IMG;
    colorImg.src = EMPTY_IMG;
    return;
  }

  if (!playerFace?.skin || !playerFace?.skin_color){
    lineImg.src  = EMPTY_IMG;
    colorImg.src = EMPTY_IMG;
    return;  
  }

  const base = `img/skin/base/${playerFace.skin}/`;

  colorImg.src = `${base}ears_${playerFace.skin_color}_color.webp`;
  lineImg.src  = `${base}ears_${playerFace.skin_color}_line.webp`;
}


function updateWerewolfEye(){
  const img = document.getElementById("eye-color");
  if(!img) return;

  img.src = `img/eyes/${playerFace.eye_shape}/colors/purple.webp`;
}

function updateWerewolfEars(){

  const lineImg = document.getElementById("ears_line");
  const colorImg = document.getElementById("ears_color");

  if(!lineImg || !colorImg) return;

  if(!player?.isWerewolf){
    lineImg.src = EMPTY_IMG;
    colorImg.src = EMPTY_IMG;
    return;
  }

  if(!playerFace?.hair_front || !playerFace?.hair_front_color){
    lineImg.src = EMPTY_IMG;
    colorImg.src = EMPTY_IMG;
    return;
  }

  const base = `img/hair/front/${playerFace.hair_front}/ears/`;

  lineImg.src = base + playerFace.hair_front_color + "_line.webp";
  colorImg.src = base + playerFace.hair_front_color + "_color.webp";
}

function becomeVampire(){
  player.isVampire = true;
  playerFace.hair_front_color = "white";
  playerFace.hair_back_color = "white";
  updateFace();
}

function cureVampire(){
  player.isVampire = false;
  updateFace();
}

function becomeWerewolf(){
  player.isWerewolf = true;
  updateFace();
}

function cureWerewolf(){
  player.isWerewolf = false;
  updateFace();
}

function updateDarkCircles() {
  const img = document.getElementById("eye-darkcircles");
  if (!img) return;

  if (!playerFace.hasDarkCircles) {
    img.src = EMPTY_IMG;
    return;
  }

  img.src = `img/eyes/${playerFace.eye_shape}/darkcircles.webp`;
}

function updateMouth() {
  const colorImg = document.getElementById("mouth-color");
  const lineImg  = document.getElementById("mouth-line");

  if (!colorImg || !lineImg) return;

  // Se estiver na Forma Vampírica, força sorriso
  const mouthToUse = player.vampireClaws?.active
    ? "mouth_2"   // sorriso
    : playerFace.mouth;

  const base = `img/mouths/${mouthToUse}`;

  safeSetImage(colorImg, `${base}/color.webp`);
  safeSetImage(lineImg,  `${base}/line.webp`);
}


function updateCloth() {
  const colorImg = document.getElementById("cloth-color");
  const lineImg  = document.getElementById("cloth-line");

  if (!colorImg || !lineImg) return;

  if (!playerFace.cloth || playerFace.cloth === "none") {
    colorImg.src = EMPTY_IMG;
    lineImg.src  = EMPTY_IMG;
    return;
  }

  const base = `img/clothes/${playerFace.cloth}`;

  colorImg.src = `${base}/color.webp`;
  lineImg.src  = `${base}/line.webp`;

  updateSidebar();
}

function getWerewolfPath(){
  return `img/hair/front/${playerFace.hair}/ears`
}

function updateFace() {
  updateSkin();
  updateHair();
  updateEyebrow();
  updateEyes();
  updateMouth();
  updateCloth();
  updateSkinEffects()
  updateFatigueVisuals();
  updateWerewolfEars();
  updateVampireEars();
}

updateFace();

/* ===== CONTROLE DOS RADIOS =====*/

/* ===== CABELOS =====*/
document
  .querySelectorAll('input[name="hair-front-shape"]')
  .forEach(radio => {
    radio.addEventListener("change", e => {
      playerFace.hair_front = e.target.value;
      updateHairFront();
    });
  });

document
  .querySelectorAll('input[name="hair-front-color"]')
  .forEach(radio => {
    radio.addEventListener("change", e => {
      playerFace.hair_front_color = e.target.value;
      updateHairFront(); // ou updateFace()
    });
  });

document
  .querySelectorAll('input[name="hair-back-shape"]')
  .forEach(radio => {
    radio.addEventListener("change", e => {
      playerFace.hair_back = e.target.value;
      updateHairBack();
    });
  });

  document
  .querySelectorAll('input[name="hair-back-color"]')
  .forEach(radio => {
    radio.addEventListener("change", e => {
      playerFace.hair_back_color = e.target.value;
      updateHairBack();
    });
  });

/* ===== SOMBRANCELHA =====*/

document.querySelectorAll('input[name="eyebrow-shape"]').forEach(radio => {
  radio.addEventListener("change", e => {
    playerFace.eyebrow_shape = e.target.value;
    updateEyebrow();
  });
});

document.querySelectorAll('input[name="eyebrow-color"]').forEach(radio => {
  radio.addEventListener("change", e => {
    playerFace.eyebrow_color = e.target.value;
    updateEyebrow();
  });
});

/* ===== OLHOS =====*/

document
  .querySelectorAll('input[name="eye-shape"]')
  .forEach(radio => {
    radio.addEventListener("change", e => {
      playerFace.eye_shape = e.target.value;
      updateEyes();
    });
  });

document
  .querySelectorAll('input[name="eye-color"]')
  .forEach(radio => {
    radio.addEventListener("change", e => {
      playerFace.eye_color = e.target.value;
      updateEyes();
    });
  });

/* ===== BOCA =====*/

document
  .querySelectorAll('input[name="mouth"]')
  .forEach(radio => {
    radio.addEventListener("change", e => {
      playerFace.mouth = e.target.value;
      updateMouth();
    });
  });

/* ===== PELE =====*/

document
  .querySelectorAll('input[name="skin_color"]')
  .forEach(radio => {
    radio.addEventListener("change", e => {
      playerFace.skin_color = e.target.value;
      updateSkin();
    });
  });

document
  .querySelectorAll('input[name="skin-color"]')
  .forEach(radio => {
    radio.addEventListener("change", e => {
      playerFace.skin_color = e.target.value;
      updateSkin();
    });
  });

function syncNoneEffect() {
  const none = document.getElementById("effect-none");

  none.checked =
    !playerFace.skin_effects.vitiligo &&
    !playerFace.skin_effects.freckles;
}

document
  .getElementById("effect-none")
  .addEventListener("change", () => {

    playerFace.skin_effects.vitiligo = false;
    playerFace.skin_effects.freckles = false;

    document.getElementById("vitiligo-toggle").checked = false;
    document.getElementById("freckles-toggle").checked = false;

    updateVitiligo();
    updateFreckles();
  });

document
  .getElementById("vitiligo-toggle")
  .addEventListener("change", e => {

    playerFace.skin_effects.vitiligo = e.target.checked;

    if (e.target.checked) {
      document.getElementById("effect-none").checked = false;
    } else {
      syncNoneEffect();
    }
    updateVitiligo();
  });

document
  .getElementById("freckles-toggle")
  .addEventListener("change", e => {

    playerFace.skin_effects.freckles = e.target.checked;

    if (e.target.checked) {
      document.getElementById("effect-none").checked = false;
    } else {
      syncNoneEffect();
    }
    updateFreckles();
  });

/* ===== ARMAS DO JOGADOR =====*/

//vantagens e desvantagens nos tipos de arams:
const typeAdvantages = {
  // ===== BASE =====
  fisic:   { strong: "distance", weak: "arcane" },
  distance: { strong: "fisic",   weak: "arcane" },

  // ===== ELEMENTAIS =====
  fire:     { strong: "ice",      weak: "arcane" },
  ice:      { strong: "eletric",  weak: "arcane" },
  eletric:  { strong: "distance", weak: "arcane" },

  // ===== ARCANO (OP) =====
  arcane:   { strong: "fire",     weak: "arcane" },

  // ===== DIVINO / SOMBRIO =====
  holy:     { strong: "dark",     weak: "arcane" },
  dark:     { strong: "holy",     weak: "arcane" },
};

const books = {

  "grimorio_chamas": {
    title: "Grimório das Chamas",
    pages: [

`O fogo começa pequeno.
  Sempre pequeno.

  Um homem certa vez observou a própria cidade queimar.
  Não foi acidente.
  Não foi guerra.

  Foi escolha.

  Ele ergueu a mão e murmurou algo quase inaudível —
  não como quem ordena,
  mas como quem aceita.

  As chamas não explodiram.
  Elas surgiram das próprias cinzas.
  favilla... ele disse, enquanto o primeiro telhado desabava.

  O curioso é que o fogo não obedecia à voz,
  mas à convicção.
  Só quando ele compreendeu que destruir também é criar,
  as brasas ganharam forma.

  E então a cidade virou memória.
  `

    ]
  }
};

function giveBook(bookId) {

  if (!books[bookId]) {
    console.warn("Livro inexistente:", bookId);
    return;
  }

  if (!player.inventory.books.includes(bookId)) {
    player.inventory.books.push(bookId);
  }

  saveGame();
  renderInventory();
}

let currentBook = null;
let currentPage = 0;

function readBook(id) {

  const book = books[id];
  if (!book) return;

  currentBook = book;
  currentPage = 0;

  // fecha inventário
  document
    .getElementById("inventoryModal")
    ?.classList.add("hidden");

  // abre livro
  document
    .getElementById("book-screen")
    .classList.remove("hidden");

  renderBookPage();
}

function renderBookPage() {

  document.getElementById("book-title")
    .textContent = currentBook.title;

  document.getElementById("book-page")
    .innerText = currentBook.pages[currentPage];

  document.getElementById("page-indicator")
    .textContent =
      `${currentPage + 1} / ${currentBook.pages.length}`;
}

function nextPage() {
  if (currentPage < currentBook.pages.length - 1) {
    currentPage++;
    renderBookPage();
  }
}

function prevPage() {
  if (currentPage > 0) {
    currentPage--;
    renderBookPage();
  }
}

function closeBook() {
  document
    .getElementById("book-screen")
    .classList.add("hidden");
}

const shields = {
  "Escudo de madeira": {
    name: "Escudo de madeira",
    defenseBonus: 2,
    blockChance: 0.25
  },

  "Escudo de aço": {
    name: "Escudo de aço",
    defenseBonus: 4,
    blockChance: 0.35
  }
};

const weapons = {
  "Mãos vazias": {
    name: "Mãos vazias",
    type: "fisic",
    baseDamage: 5,
    slot: "both"
  },

  "Garras de vampiro": {
    name: "Garras de vampiro",
    type: "fisic",
    baseDamage: 25,
    slot: "both"
  },

  "Espada de treino": {
    name: "Espada de treino",
    type: "fisic",
    baseDamage: 10,
    skills: ["corte_forte"],
    slot: "main"
  },

  "Espada de aço": {
    name: "Espada de aço",
    type: "fisic",
    baseDamage: 15,
    skills: ["corte_forte", "estocada_precisa", "corte_giratorio"],
    slot: "main"
  },

  "Cajado simples": {
    name: "Cajado simples",
    type: "magic",
    baseDamage: 6,
    skills: ["bola_de_fogo"],
    slot: "both"
  },

  "Espada dentada": {
    name: "Espada dentada",
    type: "dark",
    baseDamage: 15,
    skills: ["corte_forte", "golpe_vampirico"],
    slot: "main"
  },

  "Adaga": {
    name: "Adaga",
    type: "fisic",
    baseDamage: 6,
    skills: [
      "apunhalar", "estocada_precisa"
    ],
    slot: "both"
  },

  "Arco do ladino": {
    name: "Arco do ladino",
    type: "distance",
    baseDamage: 15,
    skills: ["flecha_envenenada", "flecha_perfurante"],
    slot: "main"
  },

  "Clava do clérigo": {
    name: "Clava do clérigo",
    type: "fisic",
    baseDamage: 15,
    skills: ["cura_basica", "esmagar"],
    slot: "main"
  },

  "Cimitarra Gigante": {
    name: "Cimitarra Gigante",
    type: "fisic",
    baseDamage: 18,
    slot: "main",
    twoHand: true
  }

};

/* ===== ARMADURAS DO JOGADOR =====*/

const ARMORS = {
  base: {
    id: "base",
    name: "Armadura Básica",
    defense: 2
  },

  full_thief: {
    id: "full_thief",
    name: "Armadura de Ladino Completa",
    defense: 4
  },

  full_thief_no_mask:{
    id: "full_thief_no_mask",
    name: "Armadura de Ladino Completa (Sem Máscara)",
    defense: 4
  },

  thief_mask:{
    id: "thief_mask",
    name: "Armadura de Ladino",
    defense: 3
  },

  thief_no_mask:{
    id: "thief_no_mask",
    name: "Armadura de Ladino (Sem Máscara)",
    defense: 3
  },

  warrior_guid_no_fur:{
    id: "warrior_guid_no_fur",
    name: "Armadura de guerreiro da guilda",
    defense: 4
  },

 warrior_guild_fur:{
    id: "warrior_guild_fur",
    name: "Armadura de guerreiro da guilda condecorado",
    defense: 6
  },

  mage_guild:{
    id: "mage_guild",
    name: "Armadura de mago da guilda",
    defense: 3
  }
};


/* ===== EQUIPAR A ARMADURA =====*/

function equipArmor(armorId) {
  const newArmor = ARMORS[armorId];
  if (!newArmor) return;

  //  Remove bônus da armadura antiga
  if (player.equippedArmor) {
    const oldArmor = ARMORS[player.equippedArmor];
    if (oldArmor) {
      player.defense -= oldArmor.defense;
    }
  }

  //  Aplica bônus da nova armadura
  player.defense += newArmor.defense;

  // Atualiza estados
  player.equippedArmor = armorId;
  playerFace.cloth = armorId;

  renderInventory();
  updateCloth();
}

function equipShield(id) {

  const newShield = shields[id];
  if (!newShield) return;

    if (player.equippedWeapon?.twoHand) {
    equipWeapon("Mãos vazias");
  }
  // 👉 REMOVE BÔNUS DO ESCUDO ANTIGO
  if (
    player.equippedSubWeapon &&
    shields[player.equippedSubWeapon.name]
  ) {
    const oldShield =
      shields[player.equippedSubWeapon.name];

    player.defense -= oldShield.defenseBonus;
  }

  // 👉 APLICA BÔNUS DO NOVO
  player.defense += newShield.defenseBonus;

  // 👉 EQUIPA DE VERDADE
  player.equippedSubWeapon = {
    name: newShield.name,
    type: "shield"
  };

  updateSidebar();
  saveGame();
  renderInventory();
}


function renderInventory() {

  const mainSlot  = document.getElementById("slot-main");
  const subSlot   = document.getElementById("slot-sub");
  const armorSlot = document.getElementById("slot-armor");

  // ===== ARMA EQUIPADA =====
  mainSlot.textContent =
    player.equippedWeapon?.name || "—";
  
  if(player.equippedWeapon?.twoHand){
    subSlot.textContent =
      player.equippedWeapon.name;
  }else{
    subSlot.textContent =
      player.equippedSubWeapon?.name || "—";
  }
  // ===== ARMADURA EQUIPADA =====
  const armorObj = ARMORS[player.equippedArmor];
  armorSlot.textContent =
    armorObj ? armorObj.name : "—";


  const wDiv = document.getElementById("inv-weapons");
  const sDiv = document.getElementById("inv-shields"); 
  const aDiv = document.getElementById("inv-armors");
  const kDiv = document.getElementById("inv-keys");
  const bDiv = document.getElementById("inv-books");


  // ===== ARMAS =====
let html = "<h5>Armas</h5>";

player.inventory.weapons.forEach(wName => {

  const isMain =
    player.equippedWeapon?.name === wName;

  const isSub =
    player.equippedSubWeapon?.name === wName;

  html += `
    <div class="inv-item">
      ⚔ ${wName}

      <button onclick="equipWeapon('${wName}')">
        ${isMain ? "Equipado (Main)" : "Main"}
      </button>

      <button onclick="equipSubWeapon('${wName}')">
        ${isSub ? "Equipado (Sub)" : "Sub"}
      </button>

    </div>
  `;
});

document.getElementById("inv-weapons").innerHTML = html;

// ===== ESCUDOS =====
  let sHtml = "<h5>Escudos</h5>";

  player.inventory.shields.forEach(id => {

    const shield = shields[id];
    if (!shield) return;

    const isSub =
      player.equippedSubWeapon?.name === shield.name;

    sHtml += `
      <div class="inv-item">
        🛡 ${shield.name}

        <button onclick="equipShield('${id}')">
          ${isSub ? "Equipado" : "Equipar"}
        </button>
      </div>
    `;
  });

  sDiv.innerHTML = sHtml;

  // ===== ARMADURAS =====
  aDiv.innerHTML = "";

  player.inventory.armors.forEach(id => {

    const armor = ARMORS[id];
    if (!armor) return;

    const isEquipped =
      player.equippedArmor === id;

    aDiv.innerHTML += `
      <div class="inv-item">
        🧥 ${armor.name}
        <button onclick="equipArmor('${id}')">
          ${isEquipped ? "Usando" : "Equipar"}
        </button>
      </div>
    `;
  });


  // ===== KEY ITEMS =====
  kDiv.innerHTML = "";

  player.inventory.keyItems.forEach(item => {
    kDiv.innerHTML += `
      <div>🔑 ${item.name || item}</div>
    `;
  });


// ===== LIVROS =====
bDiv.innerHTML = "<h5>Livros</h5>";

player.inventory.books.forEach(id => {

  const book = books[id];
  if (!book) return;

  bDiv.innerHTML += `
    <div class="inv-item">
      📘 ${book.title}

      <button onclick="readBook('${id}')">
        Ler
      </button>
    </div>
  `;
});

}

document.getElementById("btn-inventory")
  .onclick = () => {

    document
      .getElementById("inventoryModal")
      .classList.remove("hidden");

    toggleSidebar();
    renderInventory();
};

document.getElementById("close-inv")
  .onclick = () => {
    document
      .getElementById("inventoryModal")
      .classList.add("hidden");
};

// fechar com ESC
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    document
      .getElementById("inventoryModal")
      .classList.add("hidden");
  }
});

function giveArmor(id) {
  if (!ARMORS[id]) return;

  if (!player.inventory.armors.includes(id)) {
    player.inventory.armors.push(id);
  }

  saveGame();
  renderInventory();
}

function giveWeapon(name) {
  if (!weapons[name]) return;

  if (!player.inventory.weapons.includes(name)) {
    player.inventory.weapons.push(name);
  }

  saveGame();
  renderInventory();
}

function giveShield(id) {
  if (!shields[id]) return;

  if (!player.inventory.shields.includes(id)) {
    player.inventory.shields.push(id);
  }

  saveGame();
  renderInventory();
}
/* ===== SKILLS DO JOGADOR =====*/

const skills = {

  /* ===== WEAPON SKILLS ===== */
  corte_forte: {
    name: "Corte Forte",
    type: "weapon_skill",
    power: 1.5,
    critChance: 0.15,
    manaCost: 5,
    description: "Um golpe pesado com a espada"
  },

  estocada_precisa: {
    name: "Estocada Precisa",
    type: "weapon_skill",
    power: 1.3,
    critChance: 0.25,
    manaCost: 10,
    applyBleed: true,
    description: "Um golpe rápido e preciso visando pontos vitais"
  },

  apunhalar: {
    name: "Apunhalar",
    type: "weapon_skill",
    power: 1.5,
    critChance: 0.40,
    manaCost: 15,
    description: "Uma apunhalada visando um ataque crítico"
  },

  esmagar: {
    name: "Esmagar",
    type: "weapon_skill",
    power: 1.7,
    critChance: 0.1,
    manaCost: 15,
    applyStun: true,
    description: "Um ataque brutal que quebra defesas e atordoa"
  },

  corte_giratorio: {
    name: "Corte Giratório",
    type: "weapon_skill",
    power: 1.5,
    critChance: 0.15,
    description: "Um giro amplo que atinge o inimigo"
  },

  /* ===== MAGIC ===== */
  
  /* ===== FIRE ===== */
  bola_de_fogo: {
    name: "Bola de Fogo",
    type: "fire",
    power: 1.5,
    critChance: 0.1,
    manaCost: 10,
    description: "Uma explosão de chamas"
  },

  grande_bola_de_fogo: {
    name: "Grande Bola de Fogo",
    type: "fire",
    power: 1.9,
    critChance: 0.5,
    manaCost: 20,
    description: "Uma explosão poderosa de chamas"
  },

  explosao_igneia: {
    name: "Explosão Ígnea",
    type: "fire",
    power: 1.9,
    critChance: 0.1,
    manaCost: 15,
    description: "Uma detonação de fogo concentrado"
},

  muralha_de_chamas: {
    name: "Muralha de Chamas",
    type: "fire",
    power: 1.6,
    critChance: 0.1,
    manaCost: 13,
    description: "Uma parede de fogo avança contra o inimigo"
},

  brasas_vivas: {
    name: "Brasas Vivas",
    type: "fire",
    power: 1.3,
    critChance: 0.15,
    applyBurn: true,
    manaCost: 9,
    description: "Fragmentos incandescentes queimam o alvo"
 },

  explosao: {
    name: "Explosão",
    type: "fire",
    power: 1.5,
    manaCost: 15,
    critChance: 0.2,
    target: "all_enemies",
    description: "Uma grande explosão de fogo que atinge todos os inimigos"
  },



  /* ===== ICE ===== */
  congelar: {
    name: "Congelar",
    type: "ice",
    power: 1.2,
    critChance: 0.1,
    manaCost: 9,
    status: "freeze",
    description: "Reduz a mobilidade do inimigo com gelo"
  },

  lanca_de_gelo: {
    name: "Lança de Gelo",
    type: "ice",
    power: 1.5,
    critChance: 0.15,
    manaCost: 11,
    description: "Um projétil congelante atravessa o inimigo"
  },

  nevasca: {
    name: "Nevasca",
    type: "ice",
    power: 1.4,
    critChance: 0.15,
    manaCost: 14,
    description: "Uma tempestade congelante cobre a área"
  },

  /* ===== ELETRIC ===== */
  faisca_estatica: {
    name: "Faísca Estática",
    type: "eletric",
    power: 1.2,
    critChance: 0.2,
    manaCost: 7,
    description: "Uma descarga elétrica rápida e instável"
  },

  raio_celeste: {
    name: "Raio Celeste",
    type: "eletric",
    power: 1.8,
    critChance: 0.15,
    manaCost: 14,
    description: "Um raio violento cai do céu"
  },

  sobrecarga: {
    name: "Sobrecarga",
    type: "eletric",
    power: 1.4,
    critChance: 0.25,
    manaCost: 10,
    description: "Energia elétrica instável explode no alvo"
  },

  /* ===== ARCANE ===== */
  pulso_arcano: {
    name: "Raio Arcano",
    type: "arcane",
    power: 1.6,
    critChance: 0.15,
    manaCost: 12,
    description: "Um disparo concentrado de energia mágica"
  },

  onda_arcana: {
    name: "Onda Arcana",
    type: "arcane",
    power: 1.4,
    critChance: 0.2,
    manaCost: 12,
    description: "Energia mágica se espalha em linha reta"
  },

  ruptura_arcana: {
    name: "Ruptura Arcana",
    type: "arcane",
    power: 1.7,
    critChance: 0.2,
    manaCost: 14,
    description: "A magia se rompe dentro do inimigo"
  },

  vortice_arcano: {
    name: "Vórtice Arcano",
    type: "arcane",
    power: 1.5,
    critChance: 0.15,
    manaCost: 13,
    description: "Energia arcana gira e despedaça o alvo"
  },
  
  silencio_arcano: {
    name: "Silêncio Arcano",
    type: "arcane",
    power: 1.1,
    critChance: 0.1,
    manaCost: 12,
    applySilence: true,
    silenceDuration: 2,
    description: "Bloqueia a conjuração do inimigo por alguns turnos"
  },

  /* ===== DISTANCE ===== */
  flecha_perfurante: {
    name: "Flecha Perfurante",
    type: "distance",
    power: 1.4,
    critChance: 0.2,
    description: "Uma flecha que atravessa armaduras"
  },

  chuva_de_flechas: {
    name: "Chuva de Flechas",
    type: "distance",
    power: 1.1,
    critChance: 0.1,
    description: "Vários projéteis atingem o inimigo"
  },

  tiro_rapido: {
    name: "Tiro Rápido",
    type: "distance",
    power: 1.3,
    critChance: 0.25,
    description: "Disparo veloz à distância"
  },

  flecha_envenenada: {
    name: "Flecha Envenenada",
    type: "distance",
    power: 0.8,
    critChance: 0.5,
    applyPoison: true,
    description: "Dispara uma flecha envenenada"
  },

  /* ===== HOLY ===== */
  cura_basica: {
    name: "Cura Báscia",
    type: "holy",
    heal: true,
    power: 1.2,
    manaCost: 8,
    critChance: 0.1,
    description: "Recupera um pouco de vida"
  },

  julgamento: {
    name: "Julgamento",
    type: "holy",
    power: 1.5,
    critChance: 0.2,
    manaCost: 13,
    description: "Energia sagrada castiga criaturas impuras"
  },

  toque_da_luz: {
    name: "Toque da Luz",
    type: "holy",
    heal: true,
    power: 1.4,
    critChance: 0.15,
    manaCost: 10,
    description: "A luz divina restaura ferimentos"
  },

  castigo_divino: {
    name: "Castigo Divino",
    type: "holy",
    power: 1.7,
    critChance: 0.2,
    manaCost: 14,
    description: "A ira dos céus atinge o inimigo"
  },

  luz_restauradora: {
    name: "Luz Restauradora",
    type: "holy",
    heal: true,
    power: 1.6,
    critChance: 0.15,
    manaCost: 14,
    description: "Uma luz intensa restaura profundamente a vida"
  },

  sentenca_sagrada: {
    name: "Sentença Sagrada",
    type: "holy",
    power: 1.8,
    critChance: 0.2,
    manaCost: 16,
    description: "O julgamento final da luz divina"
  },

  /* ===== DARK ===== */
  golpe_vampirico: {
    name: "Golpe Vampírico",
    type: "weapon_skill",
    power: 1.1,
    lifesteal: 0.35, // 35% do dano vira cura
    critChance: 0.15,
    description: "Rouba a vitalidade do inimigo"
  },

  toque_sombrio: {
    name: "Toque Sombrio",
    type: "dark",
    power: 1.3,
    lifesteal: 0.25,
    critChance: 0.15,
    manaCost: 10,
    description: "Drena vida através da escuridão"
  },

  maldicao: {
    name: "Maldição",
    type: "dark",
    power: 1.1,
    critChance: 0.1,
    manaCost: 8,
    applyCurse: true,
    description: "Enfraquece o inimigo lentamente"
  },

  abraco_das_sombras: {
    name: "Abraço das Sombras",
    type: "dark",
    power: 1.3,
    lifesteal: 0.3,
    critChance: 0.15,
    manaCost: 11,
    description: "As trevas drenam a vitalidade do alvo"
  },

  marca_da_maldicao: {
    name: "Marca da Maldição",
    type: "dark",
    power: 1.2,
    critChance: 0.1,
    manaCost: 9,
    applyCurse: true,
    description: "Uma maldição enfraquece o inimigo"
  },

  agonia_profunda: {
    name: "Agonia Profunda",
    type: "dark",
    power: 1.3,
    critChance: 0.15,
    manaCost: 10,
    applyCurse: true,
    description: "Dor contínua consome o inimigo"
  },

  sangria_sombria: {
    name: "Sangria Sombria",
    type: "dark",
    power: 1.4,
    lifesteal: 0.3,
    critChance: 0.1,
    manaCost: 12,
    description: "O sangue do inimigo fortalece as trevas"
  },

  ritual_sombrio: {
    name: "Ritual Sombrio",
    power: 0.8,
    heal: true,
    areaHeal: true
  },

  forma_vampirica:{
    name: "Forma Vampírica",
    type: "dark",
    manaCost: 40,
    power: 0,
    critChance: 0.01,
    target: "self",
    duration: 4,
    description: "Invoca garras vampíricas por 3 turnos, drenando vida a cada ataque."
}



};

/* ===== ENCANTAMENTOS =====*/

const spellDictionary = {

  /* ===== FIRE ===== */
  ignis: "bola_de_fogo",
  spour: "grande_bola_de_fogo",
  flamma: "muralha_de_chamas",
  favilla: "brasas_vivas",
  megu: "explosao",

  /* ===== ICE ===== */
  glacies: "congelar",
  hiems: "nevasca",
  nix: "lanca_de_gelo",

  /* ===== ELETRIC ===== */
  fulgur: "pulso_arcano",
  scintilla: "faisca_estatica",
  fulmen: "raio_celeste",
  impetus: "sobrecarga",

  /* ===== ARCANE ===== */
  unda: "onda_arcana",
  ruptura: "ruptura_arcana",
  vortex: "vortice_arcano",

  /* ===== HOLY ===== */
  lux: "cura_basica",
  judicium: "julgamento",
  benedictio: "toque_da_luz",
  puritas: "castigo_divino",
  sententia: "sentenca_sagrada",
  sanctum: "luz_restauradora",

  /* ===== DARK ===== */
  umbra: "toque_sombrio",
  maledictio: "maldicao",
  cruor: "marca_da_maldicao",
  tenebrae: "abraco_das_sombras",
  dolor: "agonia_profunda",
  sanguis: "sangria_sombria",
};


function learnSkill(skillKey) {
  // skill existe?
  if (!skills[skillKey]) {
    console.warn("Skill inexistente:", skillKey);
    return;
  }

  // inicializa caso não exista
  if (!player.learnedSkills) {
    player.learnedSkills = [];
  }

  // já aprendeu?
  if (player.learnedSkills.includes(skillKey)) {
    log(`📘 Você já conhece ${skills[skillKey].name}.`);
    return;
  }

  // aprende
  player.learnedSkills.push(skillKey);

  log(`✨ Você aprendeu uma nova habilidade: ${skills[skillKey].name}!`);
}


//equipar arma
function equipWeapon(weaponName) {

  const weapon = weapons[weaponName];
  if (!weapon) return;

  if (weapon.slot === "sub") {
    return;
  }
  
if (player.equippedWeapon?.name === weaponName) {
    // se for twoHand, limpa subWeapon
    if (weapon.twoHand) {
        player.equippedSubWeapon = weapons["Mãos vazias"];
    }

    // volta arma principal para padrão
    player.equippedWeapon = weapons["Mãos vazias"];

    renderInventory();
    updateSidebar();
    saveGame();
    return; // sai da função para não continuar
}

    // ===== Checagem TWO-HAND da arma principal =====
    if (player.equippedWeapon?.twoHand) {
        // Reseta os dois slots
        player.equippedWeapon = weapons["Mãos vazias"];
        player.equippedSubWeapon = weapons["Mãos vazias"];

        renderInventory();
        updateSidebar();
        saveGame()
    }

  if (weapon.twoHand) {
    player.equippedSubWeapon = null;
  }

  player.equippedWeapon = weapon;

   if (
    player.equippedSubWeapon &&
    player.equippedSubWeapon.name === weaponName
  ) {
    // ok, continua two-hand
  }
  else if (
    player.equippedSubWeapon &&
    player.equippedSubWeapon.slot === "main"
  ) {
    // sub era uma arma MAIN → ficou inválida
    player.equippedSubWeapon = null;
  }

  // se a nova arma for twoHand, limpa qualquer escudo
if (weapon.twoHand) {
  if (
    player.equippedSubWeapon &&
    shields[player.equippedSubWeapon.name]
  ) {
    const oldShield = shields[player.equippedSubWeapon.name];
    player.defense -= oldShield.defenseBonus;
  }

  player.equippedSubWeapon = null;
}

  // Dá as skills da arma
  if (weapon.skills) {
    weapon.skills.forEach(s => {
      if (!player.learnedSkills.includes(s))
        player.learnedSkills.push(s);
    });
  }

  renderInventory();
  updateSidebar();
  saveGame();
};

function equipSubWeapon(weaponName) {

  const weapon = weapons[weaponName];
  if (!weapon) return;

      // Se já estiver equipada, volta para padrão
    if (player.equippedSubWeapon?.name === weaponName) {
        player.equippedSubWeapon = weapons["Mãos vazias"];
        renderInventory();
        updateSidebar();
        saveGame();
        return;
    }

        // Se arma principal for two-hand → força padrão
    if (player.equippedWeapon?.twoHand) {
        player.equippedWeapon = weapons["Mãos vazias"];
        player.equippedSubWeapon = weapons["Mãos vazias"];
        renderInventory();
        updateSidebar();
        saveGame();
    }
    // Se a arma principal for TWO HAND, ninguém entra no sub
  if (player.equippedWeapon?.twoHand) {
    equipWeapon("Mãos vazias");
    equipSubWeapon("Mãos vazias");
  }

  // permitir two-hand fake (mesma arma nas duas mãos)
  if (
    weapon.slot === "main" &&
    player.equippedWeapon?.name === weaponName
  ) {
    player.equippedSubWeapon = weapon;
    renderInventory();
    return;
  }

  // armas TWO HAND nunca podem ir pro sub
  if (weapon.twoHand) return;

    if (
    weapon.slot === "main" &&
    player.equippedWeapon?.name === weaponName
  ) {
    player.equippedSubWeapon = weapon;
    renderInventory();
    return;
  }
    if (weapon.twoHand) {
    return;
  }

  if (weapon.slot === "main") {
    return;
  }

  player.equippedSubWeapon = weapon;

  if (weapon.skills) {
    weapon.skills.forEach(s => {
      if (!player.learnedSkills.includes(s))
        player.learnedSkills.push(s);
    });
  }

  renderInventory();
  updateSidebar();
  saveGame();
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
  "Rudo":{ know: false, value: 0, description: "Está esperançoso com seu treinamento."},
  "Estevan": {know: false, value: 0, description: ""}
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

const ABSOLUTE_STATUS = ["curse"]; // nunca podem ser bloqueados

function isImmune(target, status) {
  if (ABSOLUTE_STATUS.includes(status)) return false;
  return target.immunities?.includes(status);
}

function getStatusName(status) {
  const names = {
    bleeding: "Sangramento",
    blind: "Cegueira",
    fear: "Medo",
    poison: "Veneno",
    burning: "Queimadura",
    curse: "Maldição",
    frozen: "Congelamento",
    paralizado: "Paralisia",
    confused: "Confusão",
    silence: "Silêncio",
    poisoning: "Envenenamento"
  };
  return names[status] || status;
}

/* Aplica status respeitando imunidade */
function applyStatus(entity, statusName, turns, value = null) {
  if (isImmune(entity, statusName)) {
    log(`${entity.name} é imune a ${getStatusName(statusName)}.`);
    return false;
  }

  if (!entity.status) entity.status = {};

  // se já existir, só renova se for mais forte
  if (entity.status[statusName]) {
    entity.status[statusName].turns = Math.max(
      entity.status[statusName].turns,
      turns
    );
    return true;
  }

  entity.status[statusName] = { turns, value };
  log(`${entity.name} sofre ${getStatusName(statusName)}.`);
  if (entity === player) updateMagicUI();
  return true;
}

function hasStatus(entity, name) {
  return entity.status?.[name]?.turns > 0;
}

function clearStatus(entity, name) {
  if (entity.status?.[name]) delete entity.status[name];
  if (entity === player) updateMagicUI();
}

/* ===========================
   PROCESSAMENTO DE STATUS
   =========================== */
function processStatuses(entity, who) {
  if (!entity.status) entity.status = {};

  /* ===== MALDIÇÃO (DOT) ===== */
  if (hasStatus(entity, "curse")) {
    const dot = Math.max(1, Math.floor(entity.maxHp * 0.03));
    entity.hp = Math.max(0, entity.hp - dot);
    entity.status.curse.turns--;

    log(`☠️ ${entity.name} sofre ${dot} de dano pela maldição.`);

    if (entity.status.curse.turns <= 0) {
      clearStatus(entity, "curse");
      log(`✨ A maldição sobre ${entity.name} se dissipa.`);
    }
  }

    /* ===== SILÊNCIO ===== */
  if (hasStatus(entity, "silence")) {
  entity.status.silence.turns--;

  if (entity.status.silence.turns <= 0) {
    clearStatus(entity, "silence");
    log(`🔊 ${entity.name} recupera a voz.`);
    if (entity === player) updateMagicUI();
  }
}

  /* ===== QUEIMADURA ===== */
  if (hasStatus(entity, "burning")) {
    const dmg = entity.status.burning.value ?? Math.max(2, Math.round(entity.maxHp * 0.05));
    entity.hp = Math.max(0, entity.hp - dmg);
    entity.status.burning.turns--;

    log(`${who === "player" ? "Você" : entity.name} sofre ${dmg} de queimadura.`);

    if (entity.status.burning.turns <= 0) clearStatus(entity, "burning");
  }

  /* ===== SANGRAMENTO ===== */
  if (hasStatus(entity, "bleeding")) {
    const dmg = entity.status.bleeding.value ?? (8 + Math.floor(Math.random() * 3));
    entity.hp = Math.max(0, entity.hp - dmg);
    entity.status.bleeding.turns--;

    log(`${who === "player" ? "Você" : entity.name} perde ${dmg} por sangramento.`);

    if (entity.status.bleeding.turns <= 0) clearStatus(entity, "bleeding");
  }

  /* ===== ENVENENAMENTO ===== */
  if (hasStatus(entity, "poisoning")){
    const dmg = entity.status.poisoning.value ?? (10 + Math.floor(Math.random()*4));
    entity.hp = Math.max(0, entity.hp - dmg);
    entity.status.poisoning.turns--;

    log(`${who === "player" ? "Você" : entity.name} perde ${dmg} por envenenamento.`);

    if(entity.status.poisoning.turns <= 0) clearStatus(entity, "poisoning");
  }

  /* ===== PARALISIA (PERDE TURNO) ===== */
  if (hasStatus(entity, "paralizado")) {
    log(`${who === "player" ? "Você" : entity.name} está paralisado e perde o turno.`);
    entity.status.paralizado.turns--;

    if (entity.status.paralizado.turns <= 0) clearStatus(entity, "paralizado");
    return false;
  }

  /* ===== CONFUSÃO (50%) ===== */
  if (hasStatus(entity, "confused")) {
    entity.status.confused.turns--;

    if (Math.random() < 0.5) {
      log(`${who === "player" ? "Você" : entity.name} está confuso e perde o turno!`);
      if (entity.status.confused.turns <= 0) clearStatus(entity, "confused");
      return false;
    }

    if (entity.status.confused.turns <= 0) clearStatus(entity, "confused");
  }

  /* ===== SILÊNCIO ===== */
  if (hasStatus(entity, "silence")) {
  updateMagicUI();
}

  /* ===== MEDO ===== */
  if (hasStatus(entity, "fear")) {
    entity.status.fear.turns--;
    log(`${who === "player" ? "Você" : entity.name} hesita tomado pelo medo.`);

    if (entity.status.fear.turns <= 0) clearStatus(entity, "fear");
  }

  return entity.hp > 0;
}

/* ===== EFEITO VISUAL ===== */
function hpShake(targetStr) {
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
  
  const hpBar = document.getElementById("hp-bar");
  if(hpBar){
    hpBar.dataset.tooltip = `${player.hp} / ${player.maxHp}`;
  }

  const manaBar = document.getElementById("mana-bar");
  if(manaBar){
    manaBar.dataset.tooltip = `${player.mana} / ${player.maxMana}`;
  }

  const hungerBar = document.getElementById("hunger-bar");
  if(hungerBar){
    hungerBar.dataset.tooltip = `${Math.floor(player.hunger)} / 100`;
  }
  const sleepBar = document.getElementById("sleep-bar");
  if(sleepBar){
    sleepBar.dataset.tooltip = `${Math.floor(player.sleep)} / 100`;
  }

  const setText = (id, v) => { const e = document.getElementById(id); if (e) e.innerText = v; };
  setText("sidebar-name", player.name || "Jogador");
  setText("attr-level", player.level);
  setText("attr-strength", player.strength);
  setText("attr-int", player.intelligence);
  setText("attr-mind", player.mind);
  setText("attr-dex", player.dex);
  setText("attr-faith", player.faith);
  setText("attr-defense", player.defense);
  setText("attr-vigor", player.vigor);
  //setText("attr-energy", Math.round(player.energy));
  setText("money", player.money.toFixed(2));

  updateLevelButtons();
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

/**
 * @param {number} moneyVal - quantidade de dinheiro adicionado
 */
function addMoney(moneyVal){
  player.money += moneyVal;
  updateSidebar();
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
  updateFatigueVisuals();

}

function updateFatigueVisuals() {
  // Vampiro SEMPRE tem olheiras
  if (player.isVampire) {
    playerFace.hasDarkCircles = true;
    updateDarkCircles();
    updateVampireEye();
    return;
  }

  if(player.isWerewolf) {
    updateWerewolfEye();
    return;
  }

  // Olheiras por cansaço
  if (player.sleep <= 30 || player.energy <= 20) {
    playerFace.hasDarkCircles = true;
  } else {
    playerFace.hasDarkCircles = false;
  }

  updateDarkCircles();
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

    // Dormir gasta fome, e o tempo ainda passa
    advanceTime(min, hr);
  // Aplica recuperação
  player.hp = Math.min(player.maxHp, player.hp + hpRecovery);
  player.mana = Math.min(player.maxMana, player.mana + manaRecovery);
  player.sleep = Math.min(100, player.sleep + sleepRecovery);
  player.energy = Math.min(100, player.energy + energyRecovery);

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
function criarBotaoHistoria(texto, proxima, containerId = "powerChoices", min = 0, hr = 0) {
  const btnDiv = document.getElementById(containerId);
  if (!btnDiv) return;

  const btn = document.createElement("button");
  btn.innerText = texto;

  btn.onclick = () => {
    if (min || hr) advanceTime(min, hr);

    if (typeof proxima == "string") {
      if (typeof window[proxima] ==="function"){
        window[proxima]();
      }else{
        console.warn(`Função ${proxima} não encontrada.`);
      }
    }else if (typeof proxima === "function"){
      proxima();
    }
  };

  btnDiv.appendChild(btn);
}

function forceStoryScreen() {
  document.getElementById("story-screen").style.display = "none";
  document.getElementById("power-screen").style.display = "block";
}

function clearButtons(containerId) {
  const btnDiv = document.getElementById(containerId);
  if (!btnDiv) return;

  // sem animaçãozinha traiçoeira
  btnDiv.innerHTML = "";
}


function changeScene(
  text,
  buttonSetup,
  speed = 320,
  elementId = "powerText",
  buttonsContainerId = "powerChoices",
  sceneName = null
) {

  if (sceneName) {
    gameState.currentScene = sceneName;
    saveGame();
  }

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

function startGameUI() {
  const intro = document.getElementById("intro-screen");
  const power = document.getElementById("power-screen");

  if (intro) intro.style.display = "none";
  if (power) power.style.display = "block";
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


/* =========== MENSAGEM DE TEMPO ================ */

let timeMessage;
  if(gameTime.hour>0 && gameTime.hour<4){
    timeMessage = `a madrugada é fria, as ruas estão completamente vazias, é possível ouvir até mesmo a sua própria respiração de tão silencioso.`;
  }else if(gameTime.hour>5 && gameTime.hour<12){
    timeMessage = `a manhã parece agitada, várias pessoas saindo para o trablaho ou coisas desse tipo.`;
  }else if(gameTime.hour>13 && gameTime.hour<17){
    timeMessage = `a tarde está movimentada, o Sol quente castiga sua pele.`;
  }else if(gameTime.hour>18 && gameTime.hour<24){
    timeMessage = `a noite é tranquila, com algumas pessoas voltando para casa, olhando atentamente, é possível ver bêbados escondidos nos becos.`;
  }

/* =========================================================
   SISTEMA CENTRAL DE SAVE
   ========================================================= */

let gameState = {
  // referências principais
  player: null,
  face: null,

  // progresso
  guild: null,
  friendships: null,
  mother: 0,
  trainingDay: 7,

  // tempo
  time: null,

  // história
  currentScene: "discoverPower",

  flags: {
    joinedGuild: false,
    finishedTraining: false,
    metLucy: false,
    metRudo: false,
    metChristine: false
  }
};

//==============================
//========== FLAGS =============
//==============================

// CRIAR FLAGS
function setFlag(name, value = true) {
  gameState.flags[name] = value;
  saveGame();
}

// TESTAR FLAGS
function hasFlag(name) {
  return !!gameState.flags[name];
}

// SOMAR VALOR NA FLAG
function addFlag(name, amount = 1) {
  if (typeof gameState.flags[name] !== "number") {
    gameState.flags[name] = 0;
  }

  gameState.flags[name] += amount;
  saveGame();
}

// SETAR VALOR NA FLAG
function setFlagValue(name, value) {
  gameState.flags[name] = value;
  saveGame();
}

// INVERTER O VALOR BOOLEANO DA FLAG
function toggleFlag(name) {
  gameState.flags[name] = !gameState.flags[name];
  saveGame();
}

function packGameState() {
  gameState.player = player;
  gameState.face = playerFace;
  gameState.guild = guild;
  gameState.friendships = friendships;
  gameState.mother = mother;
  gameState.trainingDay = gameState.trainingDay;
  gameState.time = gameTime;
}

function unpackGameState() {
  // objetos principais
  Object.assign(player, gameState.player);
  Object.assign(playerFace, gameState.face);
  Object.assign(guild, gameState.guild);
  Object.assign(friendships, gameState.friendships);

  mother = gameState.mother;
  trainingDay = gameState.trainingDay;

  // tempo
  Object.assign(gameTime, gameState.time);
}


function saveGame() {
  packGameState();
  localStorage.setItem("rpgSave", JSON.stringify(gameState));
}

function loadGame() {
  const data = localStorage.getItem("rpgSave");
  if (!data) return false;

  gameState = JSON.parse(data);
  unpackGameState();

  updateHair();
  updateSidebar();
  updateCloth();
  updateGameTimeDisplay();
  return true;
}

function manualSave() {
  if (BattleManager.active==true) {
    log("❌ Não é possível salvar em combate.");
    return;
  }

  saveGame();
}

function manualLoad() {
  if (!loadGame()) {
    alert("Nenhum save encontrado.");
    return;
  }

  startGameUI();

  // Se houver cena salva, volta pra ela
  if (gameState.currentScene && typeof window[gameState.currentScene] === "function") {
    window[gameState.currentScene]();
  } else {
    // fallback seguro
    discoverPower();
  }

  updateSidebar();
}



/* ========== HISTÓRIA ========== */
function discoverPower() {

  const story = `Quando eu era criança, via meus pais trabalhando duro para nos sustentar, não eramos uma família grande, apenas eu, ele e minha mãe, apesar da pobreza, eramos felizes.
  
  Com os anos se passando, meus pais foram ficando velhos e o mundo começou a se complicar, guerras de mais. O império do rei Vagh queria dominar tudo, e realmente estava conseguindo, seu guerreiros mágicos eram imparáveis, ainda são na verdade.
  
  Meu pai foi convocado para o exército para proteger nosso país, ele já era um militar de cargo alto, então não iria para as linhas de frente, mas guerras são imprevisíveis, eu não sei o que aconteceu lá, pois o único sobrevivente - meu pai - nunca falou sobre, mas todo o seu batalhão de 3 mil homens foram completamente dominados no campo de batalha, e como um soldado honrado que ele era, não fugiu sem lutar, quando chegou em casa, ele estava apenas uma carcaça do que já fora um dia, seu corpo antes grande e musculoso, não era maior que o de uma criança, sua mente deteriorada pelos acontecimentos, nunca funcionou como antes.
  
  Para ajudar a cuidar de meu pai, comecei a trabalhar cedo, algumas obras ali, alguns atendimentos em bares aqui, mas seus remédios eram caros, e a cada mercador atacado no caminho da capital, os preços aumentavam, nós não conseguimos ajudá-lo por muito tempo e ele sabia disso, assim como sabia que nunca desistiríamos dele, por isso ele fugiu, mesmo não conseguindo mais andar, ele sumiu e nunca mais achamos seu corpo. 
  
  Tanto eu quanto minha mãe ficamos arrasados, mas era perceptível a mudança financeira, o que fazia com que nossos corações doessem sempre que pensavámos que agora conseguiríamos uma vida melhor.`;

  changeScene(
    story,
    () => {
      criarBotaoHistoria("Continuar", "continueBackStory");
    },
    320,
    "powerText",
    "powerChoices",
    "discoverPower"
  );

}

function continueBackStory(){
  const story = `Mas a vida não é algo que deixa você aproveitar por muito tempo, alguns anos depois, uma onda de praga se alastrou por Armenzian, eu e minha mãe nos afastamos de nossos empregos, nossa vida com alguns luxos básicos em troca da nossa vida como um todo, achamos que era uma troca justa. 
  
  Conseguimos sobreviver a praga sem problemas, mas demoramos a conseguir emprego novamente, a fome já não deixava mais com que pudéssemos escolher muito. Então qualquer coisa que achassemos, seria o trabalho perfeito. 
  
  Nunca me arrependi tanto na minha vida, eu consegui emprego primeiro, trabalhava fazendo patrulhas a noite, algo perigoso, mas que recentemente abriu vaga pois um criminoso assassinou o meu antecessor, mas isso não me importava, pois até que o salário era bom. Minha mãe conseguiu emprego algumas semanas depois, ela seria assistente do alfaiate da nossa vila, conseguimos nos virar, mas como sempre, quando nos acostumamos com a vida boa, algo ruim aconteceu.`;

  changeScene(
  story,
  () => {
    criarBotaoHistoria("Continuar", "continueBackStory2");
  },
  320,
  "powerText",
  "powerChoices",
  "continueBackStory"
);

}

function continueBackStory2(){
  addMoney(500);
  const story = `Minha mãe adoeceu. Sua idade avançada começou a cobrar o preço, a expectativa de vida em Armenzian é de 24 anos, minha mãe chegou aos 30, seu pulmão estava com problema, ela não conseguia respirar, e novamente me vi na mesma situação de anos atrás, mas dessa vez, as coisas não iriam se repetir. Procurei um médico confiável para tratar dela em casa, seu tratamento é caro, mas eu não deixei que aquilo aconteça novamente.
  
  Preciso conseguir $500 toda semana para que ele trate dela.`;

  changeScene(
    story,
    () => {
      criarBotaoHistoria("Continuar", "houseUser");
    },
    320,
    "powerText",
    "powerChoices",
    "continueBackStory2"
  );
}

function houseUser() {

  const story = `Você está em casa`;

  changeScene(
    story,
    () => {
      criarBotaoHistoria("Seu quarto (00:01)", "userRoom", "powerChoices", 1);
      criarBotaoHistoria("Quarto da sua mãe (00:01)", "motherRoom", "powerChoices", 1);
      criarBotaoHistoria("Sair de casa (00:01)", "leftUserHouse", "powerChoices", 1);
    },
    320,
    "powerText",
    "powerChoices",
    "houseUser"
  );
}

function userRoom(){
  const story = `Você está no seu quarto, o lugar é vazio e sem graça, sua cama pequena está arrumada e convidativa para dormir`;

  changeScene(story, () =>{
    criarBotaoHistoria("Dormir", "sleep");
    criarBotaoHistoria("Sair do quarto (00:01)", "houseUser", "powerChoices", 1);
  },
    320,
    "powerText",
    "powerChoices",
    "userRoom"
  );
}

function sleep(){
  const story = `Quantas horas você quer dormir?`;
  changeScene(story, () =>{
    criarBotaoHistoria("8 horas", () => dormir(0, 8));
    criarBotaoHistoria("7 horas", () => dormir(0, 7));
    criarBotaoHistoria("6 horas", () => dormir(0, 6));
    criarBotaoHistoria("5 horas", () => dormir(0, 5));
    criarBotaoHistoria("4 horas", () => dormir(0, 4));
    criarBotaoHistoria("3 horas", () => dormir(0, 3));
    criarBotaoHistoria("2 horas", () => dormir(0, 2));
    criarBotaoHistoria("1 hora", () => dormir(0, 1));
  },
    320,
    "powerText",
    "powerChoices",
    "sleep"
  )
}

function wake(min, hr){
  let sono;

  if(player.sleep < 30){
    sono = `você está muito cansado.`;
  } else if(player.sleep < 50){
    sono = `você está cansado ainda.`;
  } else if(player.sleep < 80){
    sono = `você está alerta.`;
  } else {
    sono = `você está descansado.`;
  }

  let story = `Você dormiu por ${hr} horas e ${min} minutos, ${sono}

  (O jogo foi salvo automaticamente)`;

  saveGame();   // ← AUTO SAVE REAL

  changeScene(story, () =>{
    criarBotaoHistoria("Voltar a dormir", "sleep");
    criarBotaoHistoria("Levantar", "userRoom");
  },
    320,
    "powerText",
    "powerChoices",
    "wake"
  );
};


function motherRoom(){
  const story = `Você está no quarto de Melody.
  
  ${motherStatus()}`;

  changeScene(story, () =>{
    criarBotaoHistoria("Sair do quarto (00:01)", "houseUser", "powerChoices", 1);
  },
    320,
    "powerText",
    "powerChoices",
    "motherRoom"
  );
};



function leftUserHouse(){
  
  let story = `Você está na rua, ${timeMessage}`;

  changeScene(story, () =>{
    criarBotaoHistoria("Avenida da Guilda (00:05)", "guildStreet", "powerChoices", 5);
    criarBotaoHistoria("Rua principal (00:05)", "principalStreet", "powerChoices", 5);
    criarBotaoHistoria("Casa (00:01", "houseUser", "powerChoices", 1);
  },
    320,
    "powerText",
    "powerChoices",
    "leftUserHouse"
  );
};

function guildStreet(){
  const story = `Você está na rua da guilda, ${timeMessage}`;
  changeScene(story, () =>{
    criarBotaoHistoria("Guilda (00:01)", "guildHub", "powerChoices", 1);
    criarBotaoHistoria("Rua de casa (00:05", "leftUserHouse", "powerChoices", 1);
  },
    320,
    "powerText",
    "powerChoices",
    "guildStreet"
  );
};

function principalStreet(){
  const story = `Você está na rua principal da vila, ${timeMessage}`;
  changeScene(story, () =>{
    criarBotaoHistoria("Cabelereiro (00:01)", "barber", "powerChoices", 1);
    criarBotaoHistoria("Rua de casa (00:05", "leftUserHouse", "powerChoices", 1);
  },
    320,
    "powerText",
    "powerChoices",
    "principalStreet"
  );
};

function barber(){
 const story = `Olá! O que você vai querer hoje?`;

   changeScene(story, () => {
    criarBotaoHistoria("Cortar cabelo (50$)", "barberHairCut");
    criarBotaoHistoria("Pintar cabelo (25$)", "barberHairColor");
    criarBotaoHistoria("Sair", "principalStreet");
  },
    320,
    "powerText",
    "powerChoices",
    "barber"
  );
};

function previewHairCut(hairId) {
  barberPreview.hair_front = hairId;
  barberPreview.hair_back  = hairId;

  playerFace.hair_front = hairId;
  playerFace.hair_back  = hairId;

  updateHair();
};

function confirmHairCut() {
  if (player.money < 50) {
    changeScene(
      "Você não tem dinheiro suficiente para cortar o cabelo.",
      () => criarBotaoHistoria("Voltar", "barber")
    );
    return;
  };

  player.money -= 50;

  playerFace.hair_front = barberPreview.hair_front;
  playerFace.hair_back  = barberPreview.hair_back;

  updateHair();
  updateSidebar();

  changeScene(
    "O barbeiro termina o corte e sorri satisfeito.",
    () => criarBotaoHistoria("Voltar", "barber")
  );
};


function barberHairCut() {
  barberPreview = { ...playerFace };

  const story = `Escolha um novo corte de cabelo.`;

  changeScene(story, () => {
    criarBotaoHistoria("Cabelo 1", () => previewHairCut("hair_1"));
    criarBotaoHistoria("Cabelo 2", () => previewHairCut("hair_2"));
    criarBotaoHistoria("Cabelo 3", () => previewHairCut("hair_3"));
    criarBotaoHistoria("Cabelo 4", () => previewHairCut("hair_4"));
    criarBotaoHistoria("Confirmar", "confirmHairCut");
    criarBotaoHistoria("Cancelar", "barber");
  },
    320,
    "powerText",
    "powerChoices",
    "barberHairCut"
  );
};

function previewHairColor(color) {
  barberPreview.hair_front_color = color;
  barberPreview.hair_back_color  = color;

  playerFace.hair_front_color = color;
  playerFace.hair_back_color  = color;

  updateHair();
};

function confirmHairColor() {
  if (player.money < 25) {
    changeScene(
      "Você não tem dinheiro suficiente para pintar o cabelo.",
      () => criarBotaoHistoria("Voltar", "barber")
    );
    return;
  };

  player.money -= 25;

  playerFace.hair_front_color = barberPreview.hair_front_color;
  playerFace.hair_back_color  = barberPreview.hair_back_color;

  updateHair();
  updateSidebar();

  changeScene(
    "O barbeiro mistura as tintas e finaliza o trabalho.",
    () => criarBotaoHistoria("Voltar", "barber")
  );
};

function barberHairColor() {
  barberPreview = { ...playerFace };

  const story = `Escolha uma nova cor.`;

  changeScene(story, () => {
    criarBotaoHistoria("Preto", () => previewHairColor("black"));
    criarBotaoHistoria("Loiro", () => previewHairColor("blonde"));
    criarBotaoHistoria("Ruivo", () => previewHairColor("ginger"));
    criarBotaoHistoria("Confirmar", "confirmHairColor");
    criarBotaoHistoria("Cancelar", "barber");
  },
    320,
    "powerText",
    "powerChoices",
    "barberHairColor"
  );
};


function guildHub(){

  let message;
  if(!hasFlag("joinedGuild")){
    message = `Você não é um membro da guilda, você ainda precisará se registrar, olhando ao redor, aquele recepcionista está acenando para você, como se te chamasse.`
  }else{
    message = "";
  }
  const story = `Você entra no prédio da guilda, vários aventureiros estão neste local, suas armaduras reluzentes e alguns com roupas normais, o local apesar da grande diversidade de pessoas, é bem organizado, em geral, o ambiente parece bom.
  
   Você consegue ver o recepcionista em seu local de trabalho, o mural da guilda - local para aceitar suas missões.
   
   ${message}`;
   changeScene(story, () =>{
    criarBotaoHistoria("Ir para o recepcionista", "recepcionist");
    criarBotaoHistoria("Mural", "questBoard");
    criarBotaoHistoria("Voltar", "guildStreet");
   },
    320,
    "powerText",
    "powerChoices",
    "guildHub"
  );
};

function recepcionist(){
  
  if(!hasFlag("joinedGuild")){
    const story = `"Olá jovem, você está planejando entrar na nossa guilda?" - Sem esperar você responder, ele continua - "Que bom! nós estamos sempre precisando de membros novos, afinal, muitos monstros têm aparecido em todos os lugares e não temos contingente para todas as ocorrências. Aliás, meu nome é Estevan, estou aqui para o que precisar"
    
    Depois de alguns minutos, o registro da guilda está terminado e o recepcionista volta a falar "Antes que você entre oficialmente em nossa guilda, precisamos que você passa por um treinamento, não se preocupe, ele será apenas para que você consiga se adaptar ao rítimo dos combates que você irá enfrentar. Por favor, venha comigo, vou te levar para a área de treino."`;
    meetCharacter("Estevan");

    changeScene(story, () =>{
      criarBotaoHistoria("Começar o treinamento", "guildTraining");
      criarBotaoHistoria("Agora não", "guildHub");
    },
    320,
    "powerText",
    "powerChoices",
    "recepcionist"
    );
  };

  const story = `Olá ${player.name}! Você veio aqui dar um oi?`;

  changeScene(story, () =>{
    criarBotaoHistoria("Voltar", "guildHub");
  },
  320,
  "powerText",
  "powerChoices",
  "recepcionist"
  );
};

function questBoard(){

}

function guildTraining(){
  let training = ``;
  if(gameState.trainingDay == 7){
     training = `Estaven te explicou, existem alguns tipos de treinamento e você escolherá que tipo receberá por dia, o total de treino é de uma semana e durará 8 horas, você pode combinar todos os tipos de treino da forma que quiser para montar suas habilidades, no fim do treino, como uma prova final, você combaterá o instrutor, e quando passar, você receberá gratuitamente um conjunto de equipamento inicial.
    
      "Olá ${player.name}! Fiquei sabendo de você, eu sou o Rudoufh, mas pode me chamar de Rudo, serei o seu treinador, eu sei de tudo um pouco então espero ser bem útil para você, sou um veterano de guerra e tenho várias expectativas em você! Não me decepcione!" diz ele e logo dá um tapa nas suas costas.`;
      meetCharacter("Rudo");
  }
   let story = `Você possui ${gameState.trainingDay} dias de treino.
   
   ${training} 
   
   "Vamos começar? O que vamos treinar hoje?"`;
    changeScene(story, () =>{
      criarBotaoHistoria("Luta com espadas", () => trainClass("warrior"), "powerChoices", 0, 8);
      criarBotaoHistoria("Conceitos da magia", () => trainClass("mage"), "powerChoices", 0, 8);
      criarBotaoHistoria("Arte da furtividade", () => trainClass("thief"), "powerChoices", 0, 8);
      criarBotaoHistoria("Arte sagrada", () => trainClass("healer"), "powerChoices", 0, 8);
    },
    320,
    "powerText",
    "powerChoices",
    "guildTraining"
  );
}

// =========== FUNÇÃO DAS CLASSES ===========

function trainClass(classe) {
  if (gameState.trainingDay <= 0) {
    changeScene(
      "Seu período de treinamento terminou.",
      () => criarBotaoHistoria("Continuar", "finalTraining")
    ),
    320,
    "powerText",
    "powerChoices",
    "trainClass"
  }

  gameState.trainingDay--;

  // aplica ganho de atributo baseado no nível atual
  classTraining(classe, 7 - gameState.trainingDay);

  // chama a função narrativa específica
  switch (classe) {
    case "warrior": warrior(); break;
    case "mage": mage(); break;
    case "thief": thief(); break;
    case "healer": cleric(); break;
  }
}

function classTraining(classe, nivel){
  const ganhoMax = 4;
  const ganhoMin = 1;
  const ganho = Math.max(
  ganhoMin,
  Math.floor(
    ganhoMax - ((nivel - 1) / 6) * (ganhoMax - ganhoMin)
  )
);

  switch(classe){
    case "warrior":
      player.strength += ganho;
      break;
    case "mage":
      player.intelligence += ganho;
      break;
    case "thief":
      player.dex += ganho;
      break;
    case "healer":
      player.faith += ganho;
      break;
  }
}
// =========== TREINO DAS CLASSES ==============

function warrior(){
  guild.warrior++;
  let trainingDescription;
  switch (guild.warrior) {
    case 1:
      trainingDescription = `Você começa a treinar com Rudo, seus movimentos comparados aos dele, é quase como se uma formiga estivesse lutando contra um gigante, ele não perde muito tempo com a teoria e vocês logo começam a lutar com espadas de madeira, é exaustivo e doloroso, seu corpo parece que vai se quebrar diversas vezes, mas você aguenta.
      
      As horas passam e você continua apenas defendendo os ataques, cada golpe mais forte que o anterior, você sente que está se fortalecendo.`;
      break;
    case 2:
      trainingDescription = `Quando você se prepara, Rudo vêm para cima de você com tudo, seus músculos ainda em desenvolvimento rugem para acompanhar os movimentos e a força dele, o barulho das espadas de madeira batendo é ensurdecedor.
      
      As horas passam e você consegue ver uma melhora, você agora já não sente tanta dificuldade em se defender, seus reflexos definitivamente estão melhorando.`;
      break;
    case 3:
      trainingDescription = `Quando você pisa no pátio de treinamento, Rudo com um grito parte para cima de você com tudo. Afirmando que um bom guerreiro sabe se virar até de mãos limpas, você começa a se deviar batendo com a palma das mãos na espada de madeira o que vai te custar muito mais tarde.
      
      As horas passam e você sente suas mãos latejando de dor, mas pelo menos, agora você consegue resistir um pouco a mais de dor.`;

      player.defense += 2;
      break;
    case 4:
      trainingDescription = `Você chega na sala de treinamento e vê rudo com uma expressão séria. "Hoje vamos simular um combate real, estamos no meio do seu treinamento e quero saber como está o seu nível real, pegue a espada"`;
      break;
    case 5:
      trainingDescription = `Você chega na sala de treinamento e inesperadamente vê Rudo conversando com outra pessoa, um outro aluno, quando vêem você, o instrutor da guilda logo a comprimenta "Ei ${player.name}! Quero te apresentar a Crhistine, ela está aqui para treinar junto com a gente, no fim, o teste final de vocês será uma batalha em que aquela que ganhar, será aprovada para entrar na guilda." 
      
      Vocês duas se entreoloham assutadas e Rudo ri alto "Então é melhor darem o melhor de vocês nesses últimos dias, conto com isso!"
      
      O treino continue sem problemas e sem muita mudança de dinâmica, você e Christine lutam com as espadas de treino, não é de longe tão difícil quanto Rudo, mas definitivamente também não é fácil.
      
      Você sente que melhorou bastante no manejo da espada.`;
      setFlag(meetCrhistine, true);
      meetCharacter("Christine");
      break;
    case 6:
      trainingDescription = `Você entra na sala de treino e se depara com a sala de treino vazia, para alguns segundos depois ver Crhistine saindo de uma sala ao lado, ela já estava aqui antes de você... Talvez você tenha ficado para trás.
      
      Rudo chega alguns segundos depois e manda novamente que vocês lutem com as espadas de madeira, dando dicas e corrigindo postura sempre que necessário. 
      
      O treino é refrescante e cansativo, mas você sente que está dando o seu melhor então se sente feliz consigo mesma. 
      
      Rudo manda que vocês descansem bem hoje, pois amanhã será o dia do teste final.`;
      break;
    default:
      trainingDescription = `Você chega na sala de treino e vê várias outras pessoas da guilda, possivelmente aventureiros, o nervosismo é grande, mas você só precisa fazer o que aprendeu no treinamento. 
      
      Você espera alguns segundos e Christine aparece também, com o olhar determinado, seguida por Rudo, que ao entrar, todos os aventureiros na sala o aplaudem. Ele chega no meio da sala e chama você e sua oponente e começa a explicar "Vocês vão lutar com tudo que têm, sem se segurar, se eu sentir que alguém pode se machucar feio, eu vou parar a luta, então não se preocupem." ele limpa a garganta e continua "Esse combate simula um combate real, então, vocês vão usar espadas de verdade" e então vai até a caixa de armas e pega duas espadas iguais, e entrega à vocês. Crhistine pega sem exitar e vai para o meio do ringue.`
      break;
      }

      let story = `${trainingDescription}`;
      if(guild.warrior == 4){
        player.equippedWeapon = weapons["Espada de treino"];
        changeScene(story, () =>{
          criarBotaoHistoria("Pegar a espada", "fightRudo1");
        },
        320,
        "powerText",
        "powerChoices",
        "warrior"
      )
      }else if(guild.warrior == 7){
        player.equippedWeapon = weapons["Espada de aço"];
        changeScene(story, () =>{
          criarBotaoHistoria("Pegar a espada e ir para o ringue", "fightCrhistine");
        },
        320,
        "powerText",
        "powerChoices",
        "warrior"
      )
      }else{
      changeScene(story, () =>{
        criarBotaoHistoria("Continuar", "posTraining");
      },
      320,
      "powerText",
      "powerChoices",
      "warrior"
    )
    }
}

function fightRudo1() {
  startBattle("Rudo", (won) => {
    if (won) {
      winRudo1();
    } else {
      loseRudo1();
    }
  });
}

function winRudo1(){
  let story = `O aço já canta há minutos.

    Cada golpe seu encontra o de Rudo com força brutal. O impacto reverbera pelos braços, pelo ombro, pela coluna. Ele não pega leve. Cada ataque dele é preciso, pesado, calculado para quebrar sua defesa.

    Você sangra. Ele também.

    Mas você continua avançando.

    Rudo sorri ao perceber que você não recua nem quando a lâmina dele quase parte sua guarda ao meio.

    Ele gira, ataca pela lateral — você bloqueia.

    Ele avança — você responde com um golpe direto no peitoral.

    O impacto o faz recuar meio passo.

    É o suficiente.

    Você gira o corpo, usa o peso inteiro do seu torso e desce a lâmina com tudo.

    Antes que o golpe atinja, Stevan entra no meio.

    "O suficiente!"

    O silêncio toma conta do campo.

    Sua lâmina estava a centímetros do pescoço de Rudo.

    Ele respira fundo… e sorri.

    "Bem feito."

    Você não sente que apenas venceu.

    Você sente que foi reconhecido.`;

  forceStoryScreen();

  changeFriendship("Rudo", 5);
  changeScene(story, () =>{
    criarBotaoHistoria("Continuar", "posTraining");
  },
    320,
    "powerText",
    "powerChoices",
    "winRudo1"
  )
}

function loseRudo1(){
  let story = `O combate começa equilibrado.

    Mas Rudo luta como alguém que já viu campos de batalha reais.

    Ele começa a pressionar.

    Seus golpes ficam mais pesados. Mais rápidos. Mais difíceis de ler.

    Você bloqueia. Aguenta. Responde.

    Até errar.

    Por um segundo, sua guarda abre.

    Rudo não hesita.

    A lâmina dele para contra seu pescoço.

    Você nem viu o movimento completo.

    Stevan ergue a mão.

    "Vitória de Rudo."

    Você tenta respirar normalmente, mas o peito arde.

    Rudo se afasta.

    "Você é forte. Mas ainda pensa demais antes de agir."

    Não é humilhação.

    É um aviso.`;

  forceStoryScreen();

  changeScene(story, () =>{
    criarBotaoHistoria("Continuar", "posTraining");
  },
    320,
    "powerText",
    "powerChoices",
    "loseRudo1"
  )
}

function fightCrhistine(){
    startBattle("Crhistine", (won) => {
    if (won) {
      winCrhistine();
    } else {
      loseCrhistine();
    }
  });
}

function winCrhistine(){
  let story = `O combate já deixou de ser técnica há muito tempo.

    Agora é instinto.

    O som das espadas se chocando ecoa pela sala como trovões metálicos. Cada impacto vibra nos ossos. Cada bloqueio arranca força dos braços já exaustos. A plateia ruge, mas o som parece distante — como se o mundo tivesse se reduzido apenas a você e Christine.

    Vocês estão no mesmo nível.

    E isso é o problema.

    Golpes são desviados por centímetros. Lâminas raspam pele. O cheiro de ferro começa a se misturar ao suor. Pequenos cortes ardem nos braços, no rosto, nas costelas. Nenhuma das duas recua.

    Nenhuma cede.

    Vocês giram, avançam, bloqueiam — é quase belo. Uma dança violenta, sincronizada, mortal.

    Até que as espadas se chocam com força total.

    O impacto faz as duas recuarem.

    Respiração pesada. Visão turva. Pernas tremendo.

    Vocês sabem.

    Mais um golpe.

    Só mais um.

    Em silêncio, se encaram. Não há ódio ali — apenas reconhecimento. Respeito. Determinação.

    Com um grito que rasga o ar, vocês avançam ao mesmo tempo.

    Mas o som do choque nunca vem.

    Quando você abre os olhos — sem perceber que os havia fechado — ele está ali.

    Rudo.

    No meio das duas.

    Segurando as duas lâminas com as próprias mãos.

    Sangue escorre entre seus dedos, mas ele não demonstra dor.

    A sala mergulha em um silêncio absoluto.

    Ninguém respira.

    Ninguém se move.

    A voz dele ecoa firme, incontestável:

    — ${player.name} é a vencedora!

    Por um segundo, nada acontece.

    Então a sala explode.

    Gritos. Aplausos. O chão treme.

    Você sente as pernas falharem. Christine também cai. As duas atingem o chão quase ao mesmo tempo, olhando para o teto, ofegantes, incapazes de sequer levantar a espada.

    Exaustas.

    Feridas.

    Orgulhosas.

    Vocês deram tudo.

    E sobreviveram.`;

  changeFriendship("Rudo", 5);
  changeFriendship("Crhistine", 5);
  forceStoryScreen();
  changeScene(story, () =>{
    criarBotaoHistoria("Continuar", "posTraining");
  },
    320,
    "powerText",
    "powerChoices",
    "winCrhistine"
  )
}

function loseCrhistine(){
    let story = `O combate já não é sobre vencer.

    É sobre quem cai primeiro.

    As espadas se chocam tantas vezes que o som vira parte do próprio ar. Cada bloqueio é mais lento. Cada ataque exige esforço que o corpo já não tem. Christine sangra. Você também.

    Nenhuma está inteira.

    Nenhuma está disposta a parar.

    O suor arde nos olhos. A respiração sai irregular. As mãos doem ao segurar a espada.

    Vocês batem as lâminas com força e se afastam pela última vez.

    Mais um golpe decidirá.

    A plateia prende o fôlego.

    Vocês avançam.

    O mundo desacelera.

    Mas desta vez você sente.

    Um pequeno atraso no seu movimento. Um reflexo que falha por um segundo.

    É o suficiente.

    A lâmina de Christine passa pela sua defesa e para a poucos centímetros do seu pescoço.

    Ao mesmo tempo, você sente sua própria espada sendo travada.

    Rudo está ali.

    No meio.

    Segurando as duas lâminas com as mãos nuas.

    O sangue escorre, mas ele não desvia o olhar.

    Silêncio absoluto.

    Ele observa as posições. A vantagem. A diferença mínima que decidiu tudo.

    Então declara:

    — Christine é a vencedora!

    A sala explode em gritos.

    Mas você não escuta direito.

    Seu braço cede. A espada escorrega dos dedos. Você cai de joelhos primeiro.

    Christine também cai instantes depois, completamente esgotada.

    Não há zombaria.

    Ela olha para você.

    E naquele olhar não existe superioridade.

    Existe respeito.

    Você perdeu.

    Mas ninguém ali ousaria dizer que foi fraca.

    Porque, por um instante, a diferença entre vitória e derrota foi menor que um piscar de olhos.`;

  changeFriendship("Crhistine", 5);
  forceStoryScreen();
  changeScene(story, () =>{
    criarBotaoHistoria("Continuar", "posTraining");
  },
    320,
    "powerText",
    "powerChoices",
    "loseCrhistine"
  )
}

function mage(){
  guild.mage++;
  gameState.trainingDay--;
  let trainingDescription;
  switch (guild.mage) {
    case 1:
      trainingDescription = `Você entra no campo de treinamento, é uma vista agradável de um campo extenso com alguns bonecos de treino no final. Rudo já está lá te esperando "Vou ser sincero com você ${player.name}, eu não sei lançar quase nenhuma magia, mas eu conheço vários magos, e nesses dias, vou chamar esses conhecidos e eles vão te encinar algumas coisas e eu vou apenas fiscalizar seu cresciemnto", você ascente e ele chama um dos amigos que mencionou.
      
      Entra um homem com um robe marrom, olhos verdes e cabelo vermelho "Sou o Legh, vou te ajudar com magias de fogo, algumas básicas para você conseguir usar em combate real."
      
      E então, ele começa a te ensinar sobre os principios da magia, você descobre que existem dois tipos de magia, aquelas conjuradas, que você entoa o encantamento e aquelas que você apenas lança, o primeiro sendo o mais forte, porém o mais custoso e pode fazê-la ficar vulnerável se errar o encantamento, o segundo é um pouco menos eficaz, porém não existe risco da magia falhar. 
      
      Neste dia, você apenas aprendeu a teoria da magia, mas se sente mais inteligente.`;

      setFlag(meetLegh);
      meetCharacter("Legh");
      break;
    case 2:
      trainingDescription = `Quando você entra na sala de treino, vê novamente Legh que a cumprimenta e se levanta da sua cadeira. Rudo não está aqui. Mas antes que você possa perguntar o motivo, ele entra atrás de você "Desculpem o atraso, estava ajudando uma nova aspirante a aventureira, é possível que ela participe com você nas próximas aulas.
      
      Depois de alguns segundos Leigh assume a aula novamente e começa a explicar mais um pouco da teoria da magia e ensina quais elementos são mais fortes que outros.
      
      Fogo -> Gelo -> Elétrico -> Fogo
      Sagrado -> <- Escuridão

      E também, o elemento arcano, que mais forte que todos os elementos, é um tipo de magia ancestral que sobrepõe qualquer elemento, e por isso são extremamente poderosos, e também extremamente custosos. Não se conhece nenhum mago que consiga usar magia arcana sem ser por encantamento.
      
      Você começa a sentir vontade de aprender mais sobre magia, e é então que Legh continua "Sei que tudo isso pode ser maravilhoso, e realmente é. Mas escute garota, nunca treine encantamentos se não souber o que está fazendo, pois em um combate real, pode ser o motivo da sua morte."
      
      A aula acaba, mas não sem um aviso de que amanhã será o dia em que você vai aprender um encantamento.`;
      break;
    case 3:
      trainingDescription = `Você chega na sala de treino e Legh está explicando algumas coisas para uma outra gartoa, ela tem cabelos verdes que vão quase até o chão, quando perecebem sua presença, ambos se viram para para a comprimentar, que dá mais visão da sua nova colega, assim como o cabelo, seus olhos são verdes como esmeralda, sua pele um pouco escura e com sardas intensificam a cor de seus olhos "Chegou na hora certa ${player.name}, essa é Lucy vamos começar o treinamento de verdade? Hoje o dia será resevado inteiramente para o dominio do encantamento 'ignis' a bola de fogo.
      
      O dia se passa com vocês duas conjurando e entoando o dia todo, Legh e Rudo auxiliavam sempre que achavam necessário.
      
      Você aprendeu a conjurar bola de fogo`;

      setFlag(meetLucy)
      meetCharacter("Lucy");
      learnSkill("bola_de_fogo");
      player.mana=0;

      break;
    case 4:
      trainingDescription = `Quando você entra na sala de aula, vê Legh e Rudo sérios "Hoje nós vamos testar a habilidades de vocês individualmente" começa Rudo "uma a uma vocês vão lutar contra mim, não é o ideal, mas isso vai ensinar a vocês a se defender e o risco do campo de batalha real, pois nenhum monstro vai pegar leve. Você ${player.name}, pegue o cajado na caixa e vamos começar.`;

      break;
    case 5:
      trainingDescription = `Você chega no salão e Lucy está treinando sozinha, quando te vê, ela para "Nenhum deles chegou ainda, aparentemente, Legh está doente, pelo menos foi o que eu ouvi do recepcionista" você assente e começam a praticar os fundamentos da magia que já aprenderam até Rudo chegar que parece orgulhoso ao ver vocês duas próximas "A regra mais importante do nosso mundo: sempre tenha amigos, pois ninguém consegue lidar com tudo sozinho"
      
      Vocês continuam o treinamento, agora sob o olhar atento de Rudo que ajuda em situações pontuais,  Depois de algumas horas, vocês são interrompidas e o professor encerra o dia. Vocês duas estão cansadas, porém se sentem melhores.`;
      player.mind+=1;
      break;
    case 6:
      trainingDescription = `Quando vocês estão saindo do salão, exaustas após mais um dia de prática, a voz de Rudo ecoa atrás de vocês.

      "Esperem."

      O tom dele não é alto, mas é sério o suficiente para fazer as duas pararem imediatamente.

      Ele caminha até ficar à frente de vocês. Não há sorriso dessa vez.

      "Descansem bastante. Amanhã será o teste final."

      O ar parece ficar mais pesado.

      Lucy olha para você por um instante, e você percebe que ela também já entendeu o que isso significa.

      Rudo continua:

      "Aqui na guilda, o último dia não é sobre teoria. Não é sobre acertar um boneco parado. É sobre pressão. É sobre medo. É sobre controle."

      Ele cruza os braços.

      "Vocês duas estão no mesmo nível. Aprenderam juntas. Cresceram juntas. Então não faz sentido colocá-las contra alguém mais forte."

      Um pequeno silêncio.

      "Será um combate entre vocês."

      Não há plateia mencionada. Não há regras explicadas. Apenas a declaração.

      Lucy engole seco, mas não desvia o olhar. Pelo contrário — ela estende a mão para você.

      "Sem pegar leve."

      Não é um desafio. É um pedido.

      Rudo observa a cena, satisfeito.

      "Mana total. Equipamento padrão. Vitória por incapacitação. Eu estarei lá para impedir qualquer fatalidade."

      Ele se aproxima um pouco mais, o olhar firme em você.

      "${player.name}... amanhã não é só sobre vencer. É sobre provar que você consegue manter a cabeça fria quando tudo estiver desmoronando."

      O silêncio que fica depois pesa mais que qualquer encantamento.

      Vocês se despedem.

      Pela primeira vez desde que começou o treinamento, você sente algo diferente da empolgação.

      Expectativa.

      Ansiedade.

      E uma pontada de medo.

      Amanhã, uma de vocês sairá vencedora.`;
      
      break;

    default:
      trainingDescription = `Você chega na sala de treinamento, muitas outras pessoas estão sentadas esperando, quando você entra, Lucy está sentada e a cumprimenta, se levantando.
      
      Rudo avista você e pede para vocês duas se prepararem.`;
      break;
      }

      const story = `${trainingDescription}`;

      if(guild.mage == 4){
        player.equipWeapon = weapons ["Cajado simples"]

        changeScene(story, () =>{
          criarBotaoHistoria ("Pegar o cajado", "fightRudo2");
        },
        320,
        "powerText",
        "powerChoices",
        "mage"
      )
      }

      if(guild.mage == 6){
        changeScene(story, () =>{
          criarBotaoHistoria("Lutar", "fightLucy");
        },
      320,
      "powerText",
      "powerChoices",
      "mage"
      )
    }
      changeScene(story, () =>{
        criarBotaoHistoria("Continuar", "posTraining");
      },
      320,
      "powerText",
      "powerChoices",
      "mage"
    )
}

function fightRudo2(){
    startBattle("Rudo", (won) => {
    if (won) {
      winRudo2();
    } else {
      loseRudo2();
    }
  });
}

function winRudo2(){
  let story = `O combate estava acirrado com Rudo acertando vários golpes de sua espada em você, mas mesmo assim, não era o suficiente para te fazer desistir e com persistência, conseguiu fazer uma finta e esquivou de um golpe, apontando o cajado para o pescoço de Rudo e começando a conjurar, a ponta do cajado brilhando em um vermelho fogo.
  
  Legh dá a luta por encerrada, declarando você como vencedora. Todos a elogiam. E então é a vez da Lucy, o combate dos dois é muito diferente do seu, a garota começa correndo para trás e conjurando várias bolas de fogo, algumas até atinger Rudo que não parece se importar muito.
  
  Com persistência, Rudo consegue alcançar a garota que tenta imitar o seu movimento, mas o instrutor já estava preparado e acerta com tudo um ataque nela, que faz um movimento de puxar com o cajado e então, uma grande bola de fogo atinge as costas de Rudo, explodindo e queimando sua roupa e pele. Claramente o ataque foi mais forte do que ela imaginava, mas acaba vencendo a luta também e vocês duas são parabenizadas por tanto Legh quanto Rudo, que alguns segundos depois, parece que não acabou de ser acertado por uma magia poderosa.`;
  
    changeFriendship("Rudo", 5);
    forceStoryScreen();
    changeScene(story, () =>{
      criarBotaoHistoria("Continuar", "posTraining");
    },
    320,
    "powerText",
    "powerChoices",
    "winRudo2"
  );
}

function loseRudo2(){
  let story = `O combate estava acirrado, você conseguia acertar alguns golpes que chamuscavam Rudo, que não parecia ligar muito, a luta continuou por mais alguns minutos, sua mana se esgotando aos poucos, quando ficou sem reservas, apostou tudo em um ataque e pulou para cima do instrutor conjurando o encantamento 'ignis' quando terminou, já estava de cara com Rudo que sem pensar duas vezes, girou duas vezes e golpeou seu cajado, discipando o encantamento e o resto de sua mana. Você cai no chão, derrotada, mas se depara com a mão de Rudo estendida para te ajudar a levantar. Ele te elogia e Legh a chama para descansar enquanto observa a luta de Lucy, o combate dos dois é muito diferente do seu, a garota começa correndo para trás e conjurando várias bolas de fogo, algumas até atinger Rudo que não parece se importar muito.
  
  Com persistência, Rudo consegue alcançar a garota que tenta criar uma finta para acertá-lo com uma magia, mas o instrutor já estava preparado e acerta com tudo um ataque em Lucy, que faz um movimento de puxar com o cajado e então, uma grande bola de fogo atinge as costas de Rudo, explodindo e queimando sua roupa e pele. Claramente o ataque foi mais forte do que ela imaginava, mas acaba vencendo a luta. Vocês se comprimentam e descansam o resto do dia para se recuperarem.`;
  
    forceStoryScreen();
    changeScene(story, () =>{
      criarBotaoHistoria("Continuar", "posTraining");
    },
    320,
    "powerText",
    "powerChoices",
    "loseRudo2"
  );
}

function fightLucy(){
      startBattle("Lucy", (won) => {
    if (won) {
      winLucy();
    } else {
      loseLucy();
    }
  });
}

function winLucy(){
  let story = `O combate já não é mais técnica — é pura sobrevivência.

    O ar da sala queima nos pulmões. Cada feitiço lançado deixa o corpo mais leve e mais pesado ao mesmo tempo, como se a própria alma estivesse sendo arrancada junto com o mana. O chão está encharcado de suor e fuligem. As paredes tremem a cada impacto.

    Vocês duas estão no limite.

    Os braços tremem. A visão falha nas bordas. Restam forças apenas para uma última magia.

    E vocês sabem disso.

    Quando percebem o estado uma da outra — roupas chamuscadas, respiração irregular, mãos queimadas pela própria conjuração — algo quase belo acontece. Como se fosse ensaiado. Como se fosse uma dança silenciosa que só duas magas exaustas poderiam entender.

    Vocês param.

    Frente a frente.

    O silêncio que antecede o fim.

    Os encantamentos começam quase como sussurros roucos, mas ganham força à medida que a última centelha de poder é arrancada do fundo do peito. O ar vibra. O chão racha. Duas esferas de fogo surgem — não são apenas bolas de fogo… são tudo o que restou de vocês.

    Gigantes. Instáveis. Furiosas.

    Vocês lançam.

    A colisão não é uma explosão — é um colapso. A luz engole a sala. Um vórtice de chamas nasce no impacto, rugindo como uma criatura viva, puxando ar, poeira e magia para seu núcleo ardente. O calor é insuportável. O som é ensurdecedor.

    E então...

    Lucy cai de joelhos.

    O corpo não responde mais.

    Legh assume o comando antes que o vórtice consuma tudo. Grita ordens. Outros magos entram em ação, canalizando energia para estabilizar o caos. O turbilhão de fogo é comprimido, forçado a se desfazer em faíscas que evaporam no ar.

    Quando a claridade se dissipa, resta apenas fumaça… e vocês duas quase inconscientes.

    A voz de Legh ecoa pela sala, firme apesar da tensão:

    "Vitória declarada."

    Mas você mal escuta.

    O mundo escurece.

    Algumas horas depois, você desperta.

    O cheiro de ervas medicinais substitui o da fumaça. O corpo dói como se tivesse sido esmagado, mas está inteiro. Ao redor, os outros aventureiros observam em silêncio respeitoso — não é euforia que preenche o ambiente, é admiração.

    Lucy também está acordada.

    Exausta. Viva.

    Os parabéns vêm, mas são quase secundários. O que realmente ficou foi a sensação de ter atravessado o próprio limite… e voltado.

    Vocês não saem desse duelo apenas como vencedora e derrotada.

    Saem marcadas.`;

  forceStoryScreen();
    changeScene(story, () =>{
      criarBotaoHistoria("Continuar", "posTraining");
    },
    320,
    "powerText",
    "powerChoices",
    "winLucy"
  );
}

function loseLucy(){
  let story = `O combate já ultrapassou o limite do treino.

    O ar está quente demais para respirar direito. Cada conjuração arranca algo de dentro de vocês. O chão está marcado por explosões anteriores, fuligem espalhada por todos os lados.

    Vocês duas estão no fim.

    Restam forças apenas para uma última bola de fogo.

    O suor escorre pelo seu rosto, queimando ao tocar pequenos cortes. Seus braços tremem. A mana restante pulsa de forma instável dentro do peito.

    Quando vocês se encaram, percebem o mesmo estado na outra.

    Exaustas.
    Feridas.
    Determinadas.

    Sem dizer uma palavra, como se fosse ensaiado, vocês se afastam alguns passos.

    Os encantamentos começam.

    As vozes saem roucas, mas firmes. O ar vibra. O calor aumenta. Duas esferas de fogo surgem — maiores do que qualquer uma que já conjuraram antes.

    Não são apenas feitiços.

    É tudo o que restou.

    Vocês lançam.

    A colisão é brutal. A luz explode pela sala, formando um vórtice de chamas que gira descontrolado, puxando ar e energia ao redor. O barulho é ensurdecedor.

    Você tenta se manter de pé.

    Tenta.

    Mas sente primeiro.

    Sua magia começa a falhar.

    Por uma fração de segundo, a chama de Lucy se sobrepõe à sua.

    É o suficiente.

    A pressão atinge seu corpo como um impacto físico. O ar é arrancado dos seus pulmões. Seus joelhos cedem.

    Você cai.

    Ainda consciente o bastante para ver sua própria bola de fogo ser engolida pelo vórtice dominante.

    Legh assume o comando imediatamente, junto de outros magos, dissipando o turbilhão antes que saia do controle.

    O calor diminui.

    A luz some.

    E a voz firme ecoa pela sala:

    "Lucy é a vencedora."

    Você tenta se levantar.

    Não consegue.

    O mundo escurece antes mesmo de ouvir a reação da plateia.

    Quando acorda, horas depois, o cheiro de ervas e pomadas substitui o da fumaça.

    Seu corpo dói.

    Mas está inteiro.

    Ao seu lado, Lucy também está deitada, igualmente exausta. Ela percebe que você despertou e, apesar do cansaço, estende a mão em sua direção.

    "Você quase me venceu."

    Não há arrogância na voz dela.

    Só respeito.

    Os outros aventureiros parabenizam vocês duas. Não como vencedora e derrotada.

    Mas como magas que ultrapassaram o próprio limite.

    Você perdeu.

    Mas sabe de uma coisa:

    Não foi fraqueza.

    Foi detalhe.`;

  forceStoryScreen();
    changeScene(story, () =>{
      criarBotaoHistoria("Continuar", "posTraining");
    },
    320,
    "powerText",
    "powerChoices",
    "winLucy"
  );
}

function thief(){
  guild.thief++;
  gameState.trainingDay--;
  let trainingDescription;
  switch (guild.thief) {
    case 1:
      trainingDescription = `Você é levada para os fundos da guilda, um lugar apertado cheio de cordas, alvos riscados e mesas com fechaduras desmontadas. Um homem magro, de olhos cansados e sorriso torto, te observa encostado na parede.

      "Sou Kael. Não ensino a lutar bonito, ensino a sobreviver", ele diz jogando uma adaga de treino para você.

      As primeiras horas são humilhantes. Você tenta golpear um boneco de palha e ele corrige cada passo, cada movimento dos seus dedos. Kael explica que um ladino não vence pela força, mas pela precisão, pelo silêncio e pelo momento certo.

      No fim do dia, suas mãos estão doloridas, mas você sente que começou a entender como se mover sem desperdiçar energia.`;
      break;

    case 2:
      trainingDescription = `Kael te espera sentado sobre uma mesa, girando uma moeda entre os dedos. Ao lado dele está outra garota, postura relaxada demais para alguém que deveria ser novata.

      "Essa é Mira. Chegou ontem e já acha que manda no lugar."

      Ela te mede de cima a baixo com um sorriso debochado. "Então você é a outra? Espero que não seja lenta."

      O treino vira uma competição desde o primeiro minuto. Vocês atravessam obstáculos em silêncio enquanto Kael derruba garrafas para testar seus reflexos. Mira sempre tenta ir um passo além, como se precisasse provar algo.

      No fim do dia, você está exausta… e irritada por admitir que ela é realmente boa.`;

      setFlag(meetMira, true);
      meetCharacter("Mira");
      break;

    case 3:
      trainingDescription = `Hoje o foco são fechaduras. Kael espalha cofres velhos e entrega as gazuas.

      Mira abre o primeiro cadeado antes mesmo de você entender o ângulo certo. Ela te olha de canto e sussurra: "Se ficar para trás, não vou te esperar."

      As horas passam entre cliques metálicos e provocações. Sempre que você acerta, ela finge indiferença. Sempre que erra, ela solta um riso curto.

      Quando finalmente você abre um cofre difícil, Mira para de sorrir por um segundo. É a primeira vez que ela te vê como ameaça de verdade.`;

      break;

    case 4:
        trainingDescription = `Kael entra com Rudo logo atrás. O guerreiro cruza os braços e observa vocês duas como se fossem presas.

        "Hoje não vão lutar contra bonecos", diz Kael. "Rudo vai testar se vocês aguentam pressão real."

        Mira engole seco, mas tenta disfarçar. Antes de começar, ela se aproxima de você:

        "Não me faça passar vergonha."`;

      player.agility += 2;
      break;

    case 5:
      trainingDescription = `Você chega cedo e encontra Mira treinando sozinha. O sorriso dela sumiu.

      "Kael disse que o teste final é entre nós duas."

      O resto do dia é pesado. Vocês treinam em silêncio, sem provocações. Cada golpe parece mais sério que o anterior.

      Quando estão saindo, Mira para na porta:

      "Amanhã eu vou ganhar. Mas… obrigada por ter me feito melhorar."

      É o máximo de carinho que você já ouviu dela.`;

      break;

   case 6:
      trainingDescription = `A sala está cheia. Ladinos veteranos assistem encostados nas paredes. Kael entrega duas adagas de aço.

      Mira respira fundo ao seu lado.

      "Sem ressentimentos, tá?" ela sussurra.

      Kael levanta a voz: "Esse combate decide quem entra na guilda. Lutem como se a vida de vocês dependesse disso."

      Mira te encara — não com deboche, mas com respeito.`;

      break;

    default:
      break;
  }

  const story = `${trainingDescription}`;

      if(guild.thief == 4){
        player.equippedWeapon = weapons["Adaga"];
        player.equippedSubWeapon = weapons["Adaga"];
        changeScene(story, () =>{
          criarBotaoHistoria("Se preparar", "fightRudo3");
        },
        320,
        "powerText",
        "powerChoices",
        "thief"
      )
    }
  changeScene(story, () =>{
    criarBotaoHistoria("Continuar", "posTraining");
  },
  320,
  "powerText",
  "powerChoices",
  "thief"
  )
}

function fightRudo3(){
    startBattle("Rudo", (won) => {
    if (won) {
      winRudo3();
    } else {
      loseRudo3();
    }
  });
}

function winRudo3(){
  const story =`Rudo tenta manter você à vista.

    Você não permite.

    Passos leves. Mudanças de direção. Fintas.

    Ele ataca onde você estava.

    Você já não está mais lá.

    Você testa. Provoca. Some.

    Até que ele erra o tempo de um golpe.

    Você surge atrás.

    A lâmina para na lateral do pescoço dele.

    Silêncio.

    Kael ergue a mão.

    "Vitória."

    Rudo solta uma risada curta.

    "Finalmente alguém que entende que luta não é espetáculo… é eficiência.
    
    Agora é a vez de Mira. O combate é completamente diferente, ela parece estar dançando com Rudo, mesmo que não acerte nenum golpe nele, ele também não acerta nada nela. até que ela arremessa suas facas em Rudo que se defende fácilmente e nem você conseguiu enxergar como ou quando, mas Mira está com os pés nos ombros do treinador, agachada e com as duas láminas se crusando no pescoço dele "venci" diz ela como se não fosse muita coisa e com um pulo para trás sai de cima das suas costas.
    
    O dia vai chegando ao fim, e você é liberada, você sente que aprendeu muito hoje."`;

    forceStoryScreen();

    changeScene(story, () =>{
    criarBotaoHistoria("Continuar", "posTraining");
  },
  320,
  "powerText",
  "powerChoices",
  "winRudo3"
  )
}

function loseRudo3(){
  const story =`Desde o primeiro movimento, fica claro que nenhum dos dois pretende encerrar aquilo rapidamente.

    Você circula Rudo, leve, medindo distância, buscando ângulos. Ele mantém a postura firme, espada à frente, acompanhando cada passo seu com os olhos atentos de alguém que já enfrentou dezenas como você. O primeiro avanço é seu.

    Você surge pela lateral, adaga mirando a abertura sob o braço dele. Rudo gira a lâmina no último segundo e o metal encontra metal, arrancando faíscas. Você recua antes do contra-ataque, sentindo o vento da espada passar pelo seu rosto.

    O combate segue assim por minutos.

    Você testa a guarda dele. Ataca alto, corta baixo, força movimentação. Em duas ocasiões consegue arranhar sua armadura. Em outra, sente a ponta da espada dele rasgar sua manga e marcar sua pele.

    Nenhum golpe decisivo. Apenas desgaste. Rudo começa a pressionar.

    Ele diminui o espaço, obrigando você a usar mais energia para escapar. Cada esquiva exige mais das suas pernas. Cada salto cobra fôlego.

    Você tenta inverter o ritmo.

    Finge um erro.

    Deixa a guarda aberta de propósito.

    Ele morde a isca.

    A espada desce forte — você gira por baixo e consegue tocar as costelas dele com a ponta da adaga. Um golpe limpo. Mas não foi profundo o bastante.

    Rudo aprende.

    A partir dali, ele para de reagir.

    Ele começa a antecipar.

    Você percebe tarde demais.

    Quando tenta flanquear novamente, ele não gira atrás de você — ele avança para onde você vai estar.

    As lâminas se chocam de frente dessa vez.

    Força contra agilidade.

    Você tenta escorregar para o lado, mas o braço já está cansado. Sua troca de base é meio segundo mais lenta do que antes.

    É o suficiente.

    Rudo trava uma de suas adagas com a espada e, com a outra mão, segura seu pulso com força. Você ainda tenta se soltar. Gira o corpo. Usa o peso. Ele segura. A ponta da lâmina dele encosta no seu abdômen. Kael ergue a mão e encerra o combate.

    Você está ofegante. Suado. Ferido.

    Mas não derrotado por falta de habilidade.

    Derrotado por desgaste.

    Rudo solta seu pulso devagar.

    "Excelente mobilidade," ele diz, respirando pesado também. "Mas você deixou eu ditar o ritmo no final."`

    forceStoryScreen();

    changeScene(story, () =>{
    criarBotaoHistoria("Continuar", "posTraining");
  },
  320,
  "powerText",
  "powerChoices",
  "loseRudo3"
  )
}

function cleric(){
  guild.cleric++;
  gameState.trainingDay--;
  let trainingDescription;
  switch (guild.cleric) {
    case 1:
      trainingDescription = `Você é levada para o pequeno templo anexo à guilda. O cheiro de incenso domina o lugar. Uma mulher de voz calma te recebe com um sorriso gentil.

      "Sou Irmã Selene. Se quer seguir o caminho da luz, primeiro precisa aprender a escutar."

      O dia inteiro é dedicado a orações e ensinamentos sobre compaixão, fé e disciplina. Você não lança nenhuma magia, mas sente algo diferente, como se seu peito estivesse mais leve.`;
      break;

    case 2:
      trainingDescription = `Você encontra uma garota ajoelhada diante do altar. Ela se levanta rápido demais e quase derruba o incenso.

      "Sou Petra... prazer."

      Selene explica que vocês aprenderão juntos. Diferente de você, ela fala demais, pergunta demais e duvida de tudo.

      Enquanto você tenta sentir a energia sagrada, Petra reclama: "Se isso é dom divino, podia vir com manual."

      No fim do dia, você consegue fechar um pequeno corte. Petra falha — e finge que não se importa.`;

      setFlag(meetPetra, true);
      meetCharacter("Petra");
      learnSkill("cura_leve");
      break;

    case 3:
      trainingDescription = `O terceiro dia não começa com orações.

      Selene leva vocês para fora do templo, até o pátio da guilda, onde alguns aventureiros retornam feridos de uma missão. O cheiro de sangue substitui o incenso.

      "Hoje vocês vão aprender que fé não existe no silêncio do altar", ela diz. "Ela existe quando suas mãos tremem."

      Você é colocado diante de um homem com um corte profundo no ombro. O sangue escorre rápido demais. Petra está ao seu lado, pálida, mas tentando parecer firme.

      Você começa a oração.

      Diferente do primeiro feitiço simples, agora a luz demora a responder. Sua mente vacila ao ver a dor real diante de você.

      Petra tenta antes de você terminar — a energia dela surge instável, falha, desaparece.

      O homem geme.

      Você respira fundo e decide não pedir força.

      Decide oferecer a sua.

      A luz responde.

      Não de forma explosiva, mas constante. O ferimento começa a se fechar lentamente sob seus dedos.

      Quando termina, você está suada, esgotada… mas conseguiu.

      Petra observa em silêncio dessa vez.

      Pela primeira vez, ela não faz piada.`;

      player.faith += 1;
      break;

    case 4:
      trainingDescription = `Selene posiciona vocês dois frente a frente no centro do templo.

      "Clérigos não existem apenas para curar", ela diz com calma. "Existem para permanecer de pé."

      Vocês recebem maças de treino.

      O primeiro golpe de Petra é desajeitado, mas forte. Você bloqueia por instinto, sentindo o impacto vibrar pelo braço inteiro.

      A luta não é sobre velocidade.

      É sobre resistência.

      Vocês trocam golpes por longos minutos. Sempre que um acerta com força demais, o outro recua, ativa uma cura rápida, volta para a posição.

      Não há plateia gritando.

      Apenas o som seco de metal contra metal e respirações pesadas.

      Petra começa a pressionar, atacando em sequência, tentando quebrar sua defesa na insistência.

      Você aguenta.

      Aguenta mais.

      Quando ela finalmente recua para recuperar fôlego, você percebe algo:

      Ela luta com raiva.

      Você luta com propósito.

      Selene encerra antes que alguém caia.

      "Força sem serenidade é ruído", ela diz, olhando diretamente para Petra.`;
      break;

    case 5:
      trainingDescription = `O penúltimo dia é silencioso.

      Selene não ensina um novo feitiço.

      Ela apenas observa.

      Você e Petra se revezam entre atacar e sustentar defesas sagradas, criando barreiras de luz que se chocam e se dissipam no ar.

      A energia consome mais do que vocês esperavam.

      No meio do treino, Petra erra o tempo de uma oração e a barreira dela se parte antes de se formar completamente. Você quase atinge o ombro dela, mas interrompe o golpe no último segundo.

      Ela te encara.

      "Por que parou?"

      Você poderia dizer que foi misericórdia.

      Mas não foi.

      Foi controle.

      No fim do dia, Selene se aproxima.

      "Amanhã vocês não lutarão para provar fé", ela diz suavemente. "Lutarão para provar decisão."

      O templo parece menor ao sair.

      Amanhã será diferente.`;

      break;

    case 6:
      trainingDescription = `O templo está lotado. Selene entrega as maças cerimoniais.

      Tomas segura a dele com força.

      "Se eu apanhar, pega leve nas piadas depois."

      Selene ergue a voz: "Que a luz julgue seus corações."

      Você sente que não é só uma luta — é a despedida do treinamento de vocês dois.`;

      break;

    default:
      break;
  }

  const story = `${trainingDescription}`;
  changeScene(story, () =>{
    criarBotaoHistoria("Continuar", "posTraining");
  },
  320,
  "powerText",
  "powerChoices",
  "cleric"
  )
}


function posTraining(){
  const story = `"Você se saiu bem gaorta, continue vindo, estou ansioso para amanhã."
  
  Você vai andando da área de treinamento, seu corpo cansado mas ao mesmo tempo, revigorado.
  
  Passando pelo hall da guilda, Stevan lhe comprimenta, acenando como forma de dar tchau, você espelha seu gesto e segue seu caminho.`;
  changeScene(story, () =>{
    criarBotaoHistoria("Lobby da guilda (00:01)", "guildHub", "powerChoices", 1);
  },
    320,
    "powerText",
    "powerChoices",
    "posTraining"
  )
}

/* ========== COMBATE ========== */

let selectedEnemyIndex = 0;
function getSelectedEnemy() {
  return enemiesInBattle[selectedEnemyIndex] || null;
}

function nextEnemyTarget() {
  if (enemiesInBattle.length <= 1) return;

  currentEnemyIndex++;

  if (currentEnemyIndex >= enemiesInBattle.length)
    currentEnemyIndex = 0;

  const enemy = getCurrentEnemy();

  document.getElementById("enemy-name").innerText = enemy.name;

  updateBars();
}


function createCombatant(baseData, team) {
  return {
    id: crypto.randomUUID(),

    team,

    name: baseData.name,

    hp: baseData.hp,
    maxHp: baseData.maxHp,

    mana: baseData.mana || 0,
    maxMana: baseData.maxMana || 0,

    attack: baseData.attack || 0,
    defense: baseData.defense || 0,

    dex: baseData.dex || 5,

    status: structuredClone(baseData.status || {}),
    skills: structuredClone(baseData.skills || []),

    isPlayer: baseData.isPlayer || false
  };
}

const Battle = {
  active: false,

  allies: [],
  enemies: [],

  turnQueue: [],
  turnIndex: 0,

  state: "idle",

  onEnd: null
};

let BattleManager = {
  active: false,
  enemy: null,
  onEnd: null
};

function endBattle(result) {
  console.log("END BATTLE CHAMADO", result, BattleManager.onEnd);
  if (!BattleManager.active) return;

  BattleManager.active = false;

  document.getElementById("battle-screen").style.display = "none";
  document.getElementById("story-screen").style.display = "block";

  const callback = BattleManager.onEnd;

  BattleManager.enemy = null;
  BattleManager.onEnd = null;

  if (typeof callback === "function") {
    callback(result);
  }
}

/* =========================
   LISTA DE INIMIGOS
========================= */
let enemiesInBattle = [];
let currentEnemyIndex = 0;

function getCurrentEnemy() {
  return enemiesInBattle[currentEnemyIndex];
}

const enemies = {
  drone: {
    name: "Drone de Captura",
    maxHp: 50,
    hp: 50,
    attack: 10,
    defense: 5,
    powerType: "Elétrico",
    status: {},
    xp: 100,
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

  rudo: {
    name: "Rudo",
    maxHp: 120,
    hp: 120,
    attack: 15,
    defense: 13,
    powerType: "Físico",
    status: {},
    immunities: [],
    skills: [
      "corte_giratorio",
      "corte_forte"
    ],
    xp: 250,
    skillChance: 0.6,
    description: "O treinador da guilda."
  },

  lucy:{
    name: "Lucy",
    hp: 150,
    maxHp: 150,
    maxMana: 250,
    attack: 20,
    defense: 25,
    powerType: "fire",
    status: {},
    skills: [
      "bola_de_fogo",
      "lanca_de_gelo",
      "grande_bola_de_fogo"
    ],
    xp: 300,
    skillChance: 0.8,
    description: "Sua rival da guilda, seus olhos são determinados"
  },

  demon: {
    name: "Demônio Abissal",
    hp: 220,
    maxHp: 220,
    attack: 10,
    defense: 30,
    powerType: "dark",
    status: {},
    immunities: ["fear", "blind"],
    damageImmunities: ["dark"],
    resistances: {
      fire: 0.5,
      holy: 1.5
    },

    skills: [
      "silencio_arcano",
      "toque_sombrio",
      "bola_de_fogo",
      "ritual_sombrio"
    ],

    skillChance: 0.6, // 60% de chance de usar habilidade
    description: "Um demônio vindo do inferno"
  },

  crhistine: {
    name: "Crhistine",
    hp: 150,
    maxHp: 150,
    attack: 20,
    defense: 20,
    powerType: "fisic",
    status: {},
    skills:[
      "corte_forte", 
      "estocada_precisa", 
      "corte_giratorio"
    ],
    xp: 300,
    skillChance: 0.6,
    description: "Sua rival de treino, ela, tanto quanto você tem motivos para vencer essa luta"
  }
};

let tooltipTimeout = null;

function showSkillTooltip(skill, x, y) {
  const tooltip = document.getElementById("skill-tooltip");
  if (!tooltip || !skill?.description) return;

  tooltip.innerHTML = `<strong>${skill.name}</strong><br>${skill.description}`;
  tooltip.style.left = `${x + 12}px`;
  tooltip.style.top = `${y + 12}px`;
  tooltip.classList.remove("hidden");
}

function hideSkillTooltip() {
  const tooltip = document.getElementById("skill-tooltip");
  if (!tooltip) return;

  tooltip.classList.add("hidden");
}

function bindSkillTooltip(btn, skill) {
  /* ===== DESKTOP ===== */
  btn.addEventListener("mouseenter", e => {
    showSkillTooltip(skill, e.clientX, e.clientY);
  });

  btn.addEventListener("mousemove", e => {
    showSkillTooltip(skill, e.clientX, e.clientY);
  });

  btn.addEventListener("mouseleave", hideSkillTooltip);

  /* ===== MOBILE (TOQUE LONGO) ===== */
  btn.addEventListener("touchstart", e => {
    e.preventDefault(); // 👈 MUITO IMPORTANTE
    tooltipTimeout = setTimeout(() => {
      const touch = e.touches[0];
      showSkillTooltip(skill, touch.clientX, touch.clientY);
    }, 400);
  });


  btn.addEventListener("touchend", () => {
    clearTimeout(tooltipTimeout);
    hideSkillTooltip();
  });

  btn.addEventListener("touchcancel", () => {
    clearTimeout(tooltipTimeout);
    hideSkillTooltip();
  });
}

/* =========================
   INÍCIO DO COMBATE
========================= */
function StartBattle(config, onEnd) {

  Battle.active = true;
  Battle.onEnd = onEnd;

  Battle.allies = config.allies.map(a =>
    createCombatant(a, "ally")
  );

  Battle.enemies = config.enemies.map(name => {
    const base = Object.values(enemies)
      .find(e => e.name === name);

    return createCombatant(base, "enemy");
  });

  buildTurnQueue();

  Battle.turnIndex = 0;

  nextTurn();
}

function buildTurnQueue() {

  Battle.turnQueue = [
    ...Battle.allies,
    ...Battle.enemies
  ].filter(c => c.hp > 0);

  Battle.turnQueue.sort(
    (a,b)=> b.dex - a.dex
  );
}

function nextTurn() {

  if (checkBattleEnd()) return;

  if (Battle.turnIndex >= Battle.turnQueue.length)
    Battle.turnIndex = 0;

  const actor = Battle.turnQueue[Battle.turnIndex];

  if (actor.hp <= 0) {
    Battle.turnIndex++;
    nextTurn();
    return;
  }

  if (actor.isPlayer) {
    startPlayerTurn(actor);
  } else {
    setTimeout(()=> enemyTurn(actor), 600);
  }
}

function endTurn() {

  Battle.turnIndex++;

  buildTurnQueue();

  setTimeout(nextTurn, 400);
}

function checkBattleEnd() {

  const alliesAlive = Battle.allies.some(a => a.hp > 0);
  const enemiesAlive = Battle.enemies.some(e => e.hp > 0);

  if (!alliesAlive) {
    endBattle(false);
    return true;
  }

  if (!enemiesAlive) {
    endBattle(true);
    return true;
  }

  return false;
}


function startBattle(enemyName, onEndCallback) {
  if (typeof onEndCallback !== "function") {
    console.error("startBattle chamado SEM callback:", enemyName);
    return;
  }
  updateMagicUI();
  BattleManager.active = true;
  BattleManager.enemy = enemyName;
  BattleManager.onEnd = onEndCallback;

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
enemiesInBattle = [];

selectedEnemyIndex = 0;

if (Array.isArray(enemyName)) {

  enemyName.forEach(name => {
    const foundEnemy = Object.values(enemies).find(e => e.name === name);
    if (foundEnemy) {
      enemiesInBattle.push(structuredClone(foundEnemy));
    }
  });

} else {

  const foundEnemy = Object.values(enemies).find(e => e.name === enemyName);
  if (foundEnemy) {
    enemiesInBattle.push(structuredClone(foundEnemy));
  }

}

  document.getElementById("story-screen").style.display = "none";
  document.getElementById("battle-screen").style.display = "block";
  const pn = document.getElementById("playerName"); if (pn) pn.innerText = player.name;
  const en = document.getElementById("enemy-name"); 
  const firstEnemy = getCurrentEnemy();
    if (en && firstEnemy) en.innerText = firstEnemy.name;


  player.hp = Math.min(player.hp, player.maxHp);
  player.mana = Math.min(player.mana, player.maxMana);
  player.defending = false;

  updateBars();
  updateSkills();

  
if (en && firstEnemy) en.innerText = firstEnemy.name;
log(`⚔️ ${firstEnemy?.description || "Um inimigo apareceu!"}`);

renderEnemyTargets();
updateEnemyHUD();

}

function renderEnemyTargets() {
  const container = document.getElementById("enemy-targets");
  if (!container) return;

  container.innerHTML = "";

  enemiesInBattle.forEach((enemy, index) => {

    const btn = document.createElement("button");

    btn.innerText = enemy.name;
    btn.className = "enemy-target-btn";

    if (index === selectedEnemyIndex) {
      btn.classList.add("selected");
    }

btn.onclick = () => {
  selectedEnemyIndex = index;
  renderEnemyTargets();
  updateEnemyHUD();
};


    container.appendChild(btn);
  });
}

function updateEnemyHUD() {

  const enemy = getSelectedEnemy();
  if (!enemy) return;

  const en = document.getElementById("enemy-name");
  if (en) en.innerText = enemy.name;

  updateBars();
}

function updateStatusIcons() {
  const enemy = getCurrentEnemy();
if (!enemy) return;

  const playerStatusEl = document.getElementById("player-status");
  const enemyStatusEl = document.getElementById("enemy-status");
  if (!playerStatusEl || !enemyStatusEl) return;

  const emojiMap = {
    burning: "🔥",
    frozen: "❄️",
    bleeding: "🩸",
    confused: "💫",
    blinded: "👁️‍🗨️",
    paralizado: "⚡",
    curse: "☠️",
    silence: "🤐",
    poisoning: "🧪"
  };
  const descMap = {
    burning: "Queimando — perde HP a cada turno.",
    frozen: "Congelado — ataque para causar muito dano.",
    bleeding: "Sangramento — sofre dano contínuo.",
    confused: "Confuso — chance de perder o turno.",
    blinded: "Cego — ataques têm chance de errar.",
    paralizado: "Paralizado — perde um turno.",
    curse: "Maldição — ataque e defesa reduzidos, perde vida por turno.",
    silence: "Silêncio — não pode conjurar magias.",
    poisoning: "Envenenamento — sofre dano contínuo"
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
  const enemy = getSelectedEnemy();
if (enemy) {
  document.getElementById("enemy-hp-fill").style.width =
    pct(enemy.hp, enemy.maxHp) + "%";
}

  updateSidebar();
  updateStatusIcons(); 
}

/* Narrador dinâmico + aplica efeitos visuais */
function narrateAttack(attacker, defenderName, damage, isCrit, wasDefended, attackType = "fisic", spellText = null, enemy = null) {

  if (!enemy && attacker === "player") {
  enemy = getSelectedEnemy();
}

  let narration = "";

  if (attacker === "player" && isCrit) {
    switch (attackType) {
      case "weapon_skill":
        narration = `💥 ${player.name} executa um golpe com precisão brutal — um golpe crítico que faz ${defenderName} vacilar, causando ${damage} de dano!`;
        applyStatus(enemy, "confused", 2);
        break;
      case "distance":
        narration = `🏹 ${player.name} acerta um disparo perfeito! O projétil atinge ${defenderName} em cheio, causando ${damage} de dano — crítico!`;
        applyStatus(enemy, "bleeding", 3, 8);
        break;
      case "fire":
        narration = `🔥 ${player.name} desencadeia uma explosão de chamas — crítico! ${defenderName} é engolido pelo fogo, causando ${damage} de dano!`;
        applyStatus(enemy, "burning", 3, Math.max(2, Math.round(enemy.maxHp * 0.03)));
        break;
      case "ice":
        narration = `❄️ Um golpe gélido perfeito! ${player.name} congela partes do ${defenderName}, causando dano crítico, causando ${damage} de dano!`;
        applyStatus(enemy, "frozen", 2);
        break;
      case "holy":
        narration = `✨ A fé de ${player.name} responde, o julgamento divino cai sobre ${defenderName} com força total — causando ${damage} de dano crítico sagrado!`;
        applyStatus(enemy, "confused", 2);
        break;
      case "eletric":
        narration = `⚡ ${player.name} atinge ${defenderName} com um raio intenso — causando uma descarga neural, causando ${damage} de dano!`;
        applyStatus(enemy, "paralizado", 1);
        break;
      case "dark":
        narration = `🌑 Um sussurro maldito antecede o impacto. As trevas se fecham sobre ${defenderName}, causando ${damage} de dano!`;
        applyStatus(enemy, "blinded", 2);
        break;
      case "arcane":
        narration = `🌀 A magia se distorce e rasga a realidade — energia arcana explode contra ${defenderName}, causando ${damage} de dano!`;
        break;
      default:
        narration = `💥 ${player.name} desfere um ataque devastador, um crítico que faz o ${defenderName} cambalear, causando ${damage} de dano!`;
        applyStatus(enemy, "confused", 2);
    }
    hpShake("enemy");
  } else if (attacker === "player") {
  if (attackType === "fisic") { 
    narration = `${player.name} ataca ${defenderName}, causando ${damage} de dano.`;
  } else if (attackType === "weapon_skill"){
    const weaponSkill = spellText ? spellText : attackType.toLocaleLowerCase();
    narration = `${player.name} realiza um ${weaponSkill} e causa ${damage} de dano em ${defenderName}`;
  }else {
    const spellName = spellText ? spellText : attackType.toLowerCase();
    narration = `✨ ${player.name} conjura ${spellName} e causa ${damage} de dano ao ${defenderName}.`;
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

  const special = getEnemyAttackDescription(defenderName);

  narration = special
    ? `${special} e causou ${damage} de dano`
    : `${defenderName} atacou e causou ${damage} de dano em ${player.name}.`;

}


  if (narration) log(narration);
}

function applyDamage(target, damage, type) {
  if (type !== "arcane" && target.damageImmunities?.includes(type)) {
    log(`${target.name} é imune a dano ${type}.`);
    return 0;
  }

  if (target.resistances?.[type]) {
    damage = Math.floor(damage * target.resistances[type]);
  }

  return Math.max(0, damage);
}

function activateVampireClaws(duration) {

  player.vampireClaws.previousMain = player.equippedWeapon;
  player.vampireClaws.previousSub  = player.equippedSubWeapon;

  player.vampireClaws.active = true;
  player.vampireClaws.turns = duration;

  const claws = weapons["Garras de vampiro"];

  player.equippedWeapon = claws;
  player.equippedSubWeapon = claws;

  log("🩸 Seu corpo se contorce... garras emergem de seus dedos.");
  updateSkills();
  updateFace();
}

function deactivateVampireClaws() {

  player.equippedWeapon = player.vampireClaws.previousMain;
  player.equippedSubWeapon = player.vampireClaws.previousSub;

  player.vampireClaws.active = false;
  player.vampireClaws.turns = 0;

  log("As garras se retraem lentamente.");

  updateSkills();
  updateFace();
}

/* ===== AÇÕES DO JOGADOR ===== */
function attack() {

  const enemy = getSelectedEnemy();
if (!enemy) return;

  if (!processStatuses(player, "player")) {
    if (enemy.hp > 0 && player.hp > 0)
      setTimeout(enemyAction, 800);
    return;
  }

  updateMagicUI();

  // ===== CEGUEIRA =====
  const blindMiss = hasStatus(player, "blinded") ? 0.35 : 0;
  if (Math.random() < blindMiss) {
    log(`${player.name} tentou atacar, mas estava cego e errou!`);
    if (enemy.hp > 0) setTimeout(enemyAction, 800);
    return;
  }

  const weapon = player.equippedWeapon;
  const sub    = player.equippedSubWeapon;

  // ===== BASE DO DANO POR TIPO =====
  let baseDamage = 0;

  if (weapon.type === "fisic") {
    baseDamage =
      Math.floor(Math.random() * player.strength) +
      weapon.baseDamage;

  } else if (weapon.type === "distance") {
    baseDamage =
      Math.floor(Math.random() * player.dex) +
      weapon.baseDamage;

  } else {
    // mágico / outros
    baseDamage =
      Math.floor(Math.random() * 8) +
      weapon.baseDamage;
  }

  // ===== DUAL HAND =====
  if (sub && sub.type === "weapon") {

    // se a principal for twoHand, ignora sub
    if (!weapon.twoHand) {
      baseDamage += Math.floor(sub.baseDamage * 0.8);
    }
  }

  // ===== MALDIÇÃO =====
  if (hasStatus(player, "curse")) {
    baseDamage = Math.floor(baseDamage * 0.7);
  }

  // ===== CRÍTICO =====
  const critChance = 0.15;
  const isCrit = Math.random() < critChance;

  let damage = isCrit ? baseDamage * 2 : baseDamage;

  // ===== GELO =====
  if (hasStatus(enemy, "frozen")) {
    damage *= 2;
    clearStatus(enemy, "frozen");

    log(`❄️ O gelo que envolvia ${enemy.name} se quebra com o impacto!`);

    // sinergia
    applyStatus(enemy, "bleeding", 3, 8);
  }

  // ===== APLICA DANO =====
  enemy.hp = Math.max(0, enemy.hp - damage);

  if (player.vampireClaws?.active && damage > 0) {
  const steal = Math.floor(damage * 0.4);
  const before = player.hp;

  player.hp = Math.min(player.maxHp, player.hp + steal);

  log(`🩸 ${player.name} drena ${player.hp - before} de vida.`);
}

  narrateAttack(
    "player",
    enemy.name,
    damage,
    isCrit,
    false,
    weapon.type
  );

  updateBars();

  // ===== FIM DE COMBATE =====
if (enemy.hp <= 0) {

  log(`${enemy.name} foi derrotado!`);
  gainXP(enemy.xp||0);
enemiesInBattle.splice(selectedEnemyIndex, 1);

if (enemiesInBattle.length === 0) {
  endBattle(true);
  return;
}

if (selectedEnemyIndex >= enemiesInBattle.length) {
  selectedEnemyIndex = 0;
}

renderEnemyTargets();
updateEnemyHUD();



  if (enemiesInBattle.length === 0) {
    endBattle(true);
    return;
  }

  currentEnemyIndex = 0;
}


  setTimeout(enemyAction, 800);
}

function calculateWeaponDamage(attacker, defender, skill, weapon) {
  let base =
    Math.floor(Math.random() * 6) +
    weapon.baseDamage +
    attacker.strength;

  let damage = Math.floor(base * skill.power);
  let isCrit = Math.random() < skill.critChance;

  const adv = typeAdvantages[skill.type];
  if (adv) {
    if (adv.strong === defender.type) {
      damage = Math.floor(damage * 1.25);
      log("É super eficaz!");
    }
    if (adv.weak === defender.type) {
      damage = Math.floor(damage * 0.75);
      log("Não é muito eficaz...");
    }
  }

  if (isCrit) damage *= 2;

  return { damage, isCrit };
}

const skillTypeColors = {
  weapon_skill: "#8b5e3c", // marrom (arma)
  distance:     "#5e8b3c", // verde (distância)
  fire:         "#c0392b", // vermelho
  ice:          "#3498db", // azul
  eletric:      "#f1c40f", // amarelo
  arcane:       "#9b59b6", // roxo
  holy:         "#f5e960", // dourado
  dark:         "#2c2c2c", // preto
};

function applySkillColor(btn, skill) {
  const color = skillTypeColors[skill.type];

  if (color) {
    btn.style.backgroundColor = color;
    btn.style.color = "#fff";
  }
}

function showWeaponSkills() {
  const container = document.getElementById("skill-buttons");
  if (!container) return;

  container.innerHTML = "";

  const weapon = player.equippedWeapon;

  /* ===== SKILLS DA ARMA ===== */
  if (weapon && weapon.skills) {
    weapon.skills.forEach(skillKey => {
      const skill = skills[skillKey];
      if (!skill) return;

      const btn = document.createElement("button");
      btn.innerText = skill.name;
      btn.classList.add("skill-weapon");

      applySkillColor(btn, skill);
      bindSkillTooltip(btn, skill);

      btn.onclick = () => {
        hideSkillTooltip()
        playerTurn(() => weaponSkill(skillKey));
        updateSkills();
      };

      container.appendChild(btn);
    });
  }

  document.addEventListener("click", e => {
  if (!e.target.closest(".skill-weapon")) {
    hideSkillTooltip();
  }
});

  /* ===== SKILLS APRENDIDAS ===== */
  if (player.learnedSkills && player.learnedSkills.length > 0) {
    player.learnedSkills.forEach(skillKey => {
      if (weapon?.skills?.includes(skillKey)) return;

      const skill = skills[skillKey];
      if (!skill) return;

      const btn = document.createElement("button");
      btn.innerText = skill.name;
      btn.classList.add("skill-learned");

      applySkillColor(btn, skill);
      bindSkillTooltip(btn, skill);

      btn.onclick = () => {
        playerTurn(() => weaponSkill(skillKey));
        updateSkills();
      };

      container.appendChild(btn);
    });
  }

  /* ===== BOTÃO VOLTAR ===== */
  const backBtn = document.createElement("button");
  backBtn.innerText = "Voltar";
  backBtn.onclick = updateSkills;
  container.appendChild(backBtn);
}


function getMagicScaling(player, skill) {
  switch (skill.type) {
    case "holy":
    case "divine":
      return player.faith * 2;

    case "dark":
      return Math.floor((player.intelligence + player.faith) / 2) * 2;

    // elementais / arcanas
    case "fire":
    case "ice":
    case "eletric":
    case "arcane":
    default:
      return player.intelligence * 2;
  }
}

function getTargets(user, skill, isEnemy) {

  switch(skill.target){

    case "all_enemies":
      return isEnemy ? Battle.allies : enemiesInBattle;

    case "all_allies":
      return isEnemy ? enemiesInBattle : Battle.allies;

    case "self":
      return [user];

    case "single":
    default:
      return [
        isEnemy ? player : getSelectedEnemy()
      ];
  }
}

function weaponSkill(skillKey) {
  const enemy = getSelectedEnemy();
if (!enemy) return;

  if (!processStatuses(player, "player")) {
    if (enemy.hp > 0) setTimeout(enemyAction, 900);
    return;
  }

  updateMagicUI();

  const weapon = player.equippedWeapon;
  if (!weapon) {
    log("Você está desarmado.");
    return;
  }

  const skill = skills[skillKey];
  if (!skill) return;

  if (
    !(weapon.skills || []).includes(skillKey)
 &&
    !player.learnedSkills?.includes(skillKey)
  ) {
    log("Você não sabe usar essa habilidade.");
    return;
  }

  if (skill.manaCost && player.mana < skill.manaCost) {
    log("Mana insuficiente.");
    return;
  }

  if (skill.manaCost) player.mana -= skill.manaCost;

  const isMagic =
    skill.type !== "fisic" &&
    skill.type !== "weapon_skill";

  // ===== TRANSFORMAÇÃO VAMPÍRICA =====
  if (skillKey === "forma_vampirica") {

    if (player.vampireClaws?.active) {
      log("Você já está na Forma Vampírica.");
      return;
    }

    activateVampireClaws(skill.duration || 3);

    setTimeout(enemyAction, 900);
    return;
  }

  /* =========================
     CURA PURA
     ========================= */
  if (skill.heal) {
    const scaling = getMagicScaling(player, skill);

    let healAmount = Math.floor(
      (skill.power * weapon.baseDamage) + scaling
    );

    const isCrit = Math.random() < (skill.critChance || 0);
    if (isCrit) healAmount *= 2;

    const before = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + healAmount);

    log(
      `${player.name} usa ${skill.name} e recupera ${
        player.hp - before
      } de vida.`
    );

    updateBars();
    setTimeout(enemyAction, 900);
    return;
  }

  /* =========================
     DANO
     ========================= */
  let damage, isCrit;

  if (isMagic) {
    const scaling = getMagicScaling(player, skill);

    damage = Math.floor(
      (weapon.baseDamage * skill.power) + scaling
    );

    isCrit = Math.random() < skill.critChance;
    if (isCrit) damage *= 2;
  } else {
    ({ damage, isCrit } =
      calculateWeaponDamage(player, enemy, skill, weapon));
  }

  damage = applyDamage(enemy, damage, skill.type);
  const targets = getTargets(player, skill, false);

targets.forEach(target => {

  if (!target || target.hp <= 0) return;

  let finalDamage = applyDamage(target, damage, skill.type);

  target.hp = Math.max(0, target.hp - finalDamage);

  // status exemplo
  if (skill.applyBurn && finalDamage > 0) {
    applyStatus(target, "burning", 3, 6);
  }

});


  if (skill.applySilence && damage > 0) {
  applyStatus(
    enemy,
    "silence",
    skill.silenceDuration || 2
  );
  log(`🤐 ${enemy.name} foi silenciado!`);
}

  narrateAttack(
    "player",
    enemy.name,
    damage,
    isCrit,
    false,
    skill.type,
    skill.name
  );

  /* =========================
     ROUBO DE VIDA
     ========================= */
  if (skill.lifesteal && damage > 0) {
    const stealAmount = Math.floor(damage * skill.lifesteal);
    const before = player.hp;

    player.hp = Math.min(player.maxHp, player.hp + stealAmount);

    log(
      `${player.name} absorve ${player.hp - before} de vida do inimigo.`
    );
  }

  /* =========================
     MALDIÇÃO
     ========================= */
  if (skill.applyCurse) {
    applyStatus(enemy, "curse", 3);
    log(`🕯️ ${enemy.name} foi amaldiçoado.`);
  }

  /* =========================
    SANGRAMENTO
    ========================= */

    if (skill.applyBleed) {
      applyStatus(enemy, "bleeding", 3, 8);
      log(`🩸 ${enemy.name} está sangrando.`);
    }

  /* =========================
    CONFUSÃO
    ========================= */

    if (skill.applyStun){
      applyStatus(enemy, "confused", 2);
      log(`💫 ${enemy.name} está atordoado`);
    }

  /* =========================
    ENVENENAMENTO
    ========================= */

    if(skill.applyPoison){
      applyStatus(enemy, "poisoning", 3, 9);
      log(`🧪 ${enemy.name} está envenenado.`)
    }

  /* =========================
    QUEIMADURA
    ========================= */
    
    if(skill.applyBurn){
      applyStatus(enemy, "burning", 3, Math.max(2, Math.round(enemy.maxHp * 0.03)));
      log(`🔥 ${enemy.name} está queimando.`)
    }

  /* =========================
     STATUS NO CRÍTICO
     ========================= */
  if (isCrit && skill.statusOnCrit) {
    applyStatus(
      enemy,
      skill.statusOnCrit,
      skill.statusDuration || 2
    );
  }

  updateBars();

if (enemy.hp <= 0) {

  log(`${enemy.name} foi derrotado!`);
gainXP(enemy.xp||0);
  enemiesInBattle.splice(selectedEnemyIndex, 1);

  if (enemiesInBattle.length === 0) {
    endBattle(true);
    return;
  }

  currentEnemyIndex = 0;
}else {
  setTimeout(enemyAction, 900);
}


}

function defend() {
  if (!processStatuses(player, "player")) {
    if (enemy.hp > 0) setTimeout(enemyAction, 900);
    return;
  }

  updateMagicUI();

  player.defending = true;
  log(`${player.name} assume uma postura defensiva.`);
  setTimeout(enemyAction, 900);
}

function updateMagicUI() {
  const btn = document.getElementById("cast-spell-btn");
  const input = document.getElementById("spell-input");
  if (!btn || !input) return;

  if (hasStatus(player, "silence")) {
    btn.disabled = true;
    input.disabled = true;
    btn.textContent = "Silenciado";
    btn.classList.add("disabled-silence");
  } else {
    btn.disabled = false;
    input.disabled = false;
    btn.textContent = "Conjurar";
    btn.classList.remove("disabled-silence");
  }
}

function castSpellFromText() {
  const enemy = getSelectedEnemy();
if (!enemy) return;

  const input = document.getElementById("spell-input");
  if (!input) return;

  const spellText = input.value.trim().toLowerCase().replace(/\s+/g, " ");;
  input.value = "";

  const skillKey = spellDictionary[spellText];

  if (!skillKey || !skills[skillKey]) {
    log("O encantamento falha. Nada acontece.");
    setTimeout(enemyAction, 900);
    return;
  }

  const skill = skills[skillKey];

  // ===== SILÊNCIO =====
  if (hasStatus(player, "silence")) {
    log("Você está silenciado e não consegue conjurar magias.");
    setTimeout(enemyAction, 900);
    return;
  }


  if (!processStatuses(player, "player")) {
    if (enemy.hp > 0) setTimeout(enemyAction, 900);
    return;
  }

  updateMagicUI();
  const cost = skill.manaCost || 0;

  // magia acima do nível do personagem
  if (cost > player.maxMana) {
    log("Esse encantamento é de um nível superior ao seu.");
    setTimeout(enemyAction, 900);
    return;
  }

  // mana insuficiente
  if (cost > player.mana) {
    log("Mana insuficiente.");
    setTimeout(enemyAction, 900);
    return;
  }

  // consome mana
  player.mana -= cost;

  const scaling = getMagicScaling(player, skill);

  /* =========================
     MAGIA DE CURA
     ========================= */
  if (skill.heal) {
    let healAmount = Math.floor(
      (cost * skill.power) + scaling
    );

    const isCrit = Math.random() < (skill.critChance || 0);
    if (isCrit) healAmount *= 2;

    const before = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + healAmount);

    log(
      `${player.name} conjura ${skill.name} e recupera ${
        player.hp - before
      } de vida.`
    );

    updateBars();
    setTimeout(enemyAction, 900);
    return;
  }

/* =========================
   MAGIA DE DANO 
   ========================= */
let damage = Math.floor(
  (cost * skill.power) + scaling
);


const isCrit = Math.random() < skill.critChance;
if (isCrit) damage *= 2;

damage = applyDamage(enemy, damage, skill.type);
enemy.hp = Math.max(0, enemy.hp - damage);


narrateAttack(
  "player",
  enemy.name,
  damage,
  isCrit,
  false,
  skill.type,
  skill.name,
  enemy
);

/* =========================
   ROUBO DE VIDA
   ========================= */
if (skill.lifesteal && damage > 0) {
  const stealAmount = Math.floor(damage * skill.lifesteal);
  const before = player.hp;

  player.hp = Math.min(player.maxHp, player.hp + stealAmount);

  log(`🩸 ${player.name} absorve ${player.hp - before} de vida.`);
}

/* =========================
   MALDIÇÃO
   ========================= */
if (skill.applyCurse) {
  applyStatus(enemy, "curse", 3);
  log(`🕯️ ${enemy.name} foi amaldiçoado.`);
}

updateBars();

if (enemy.hp > 0) {
  setTimeout(enemyAction, 900);
}

if (enemy.hp <= 0) {

  log(`${enemy.name} foi derrotado!`);
gainXP(enemy.xp||0);
  enemiesInBattle.splice(selectedEnemyIndex, 1);

  if (enemiesInBattle.length === 0) {
    endBattle(true);
    return;
  }

  if (selectedEnemyIndex >= enemiesInBattle.length) {
    selectedEnemyIndex = 0;
  }

  renderEnemyTargets();
  updateEnemyHUD();
}

}

// ===== ENTER CONJURA MAGIA =====
const spellInput = document.getElementById("spell-input");

if (spellInput) {
  spellInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      castSpellFromText();
    }
  });
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

      case "Rudo":
        return [
          "Rudo avança em disparada e te acerta em cheio com sua espada!",
          "Rudo pula e te acerta um soco no rosto!",
          "Rudo joga a espada em você e a pega no ar",
          "Rudo desfere uma sequência de golpes"
        ][Math.floor(Math.random() * 4)];

      case "Crhistine":
         return [
          "Crhistine avança com sangue nos olhos!",
          "Crhistine ataca com determinação!",
          "Crhistine disfere uma sequência de golpes com sua espada"
         ][Math.floor(Math.random() * 3)];
    default:
      return `${enemyName} ataca impiedosamente!`;
  }
}

/* ========== ATAQUE DO INIMIGO ========== */
function useSkill(user, target, skillKey, isEnemy = false) {
  const skill = skills[skillKey];
  if (!skill) return;

  if (skill.heal) {

  if (isEnemy && skill.areaHeal) {

    enemiesInBattle.forEach(ally => {
      if (!ally || ally.hp <= 0) return;

      let heal = Math.floor(user.attack * skill.power);

      ally.hp = Math.min(ally.maxHp, ally.hp + heal);

      log(`✨ ${user.name} cura ${ally.name} (${heal})`);
    });

  } else {
    let heal = Math.floor(user.attack * skill.power);
    user.hp = Math.min(user.maxHp, user.hp + heal);

    log(`✨ ${user.name} usa ${skill.name} e se cura (${heal})`);
  }

  updateBars();
  return;
}



  // dano base
  let base = Math.floor(user.attack * skill.power);

  const isCrit = Math.random() < (skill.critChance || 0);
  if (isCrit) base *= 2;

  // imunidade total
  if (target.damageImmunities?.includes(skill.type)) {
    log(`🛑 ${target.name} é imune a ${skill.type}!`);
    return;
  }

  // resistência / fraqueza
  if (target.resistances?.[skill.type]) {
    base = Math.floor(base * target.resistances[skill.type]);
  }

  // aplica dano
  target.hp = Math.max(0, target.hp - base);

  narrateAttack(
  isEnemy ? "enemy" : "player",
  isEnemy ? user.name : target.name,
  base,
  isCrit,
  false,
  skill.type,
  skill.name,
  target
);

  // lifesteal
  if (skill.lifesteal) {
    const heal = Math.floor(base * skill.lifesteal);
    user.hp = Math.min(user.maxHp, user.hp + heal);
  }

  // status
  if (skill.applyCurse) {
    applyStatus(target, "curse", 3, 0);
  }

  // ===== SILÊNCIO =====
if (skill.applySilence && base > 0) {
  applyStatus(
    target,
    "silence",
    skill.silenceDuration || 2
  );

  log(`🤐 ${target.name} foi silenciado!`);

  // feedback visual imediato
  if (target === player) {
    updateMagicUI();
  }
}

  // ===== SANGRAMENTO =====
    if (skill.applyBleed) {
      applyStatus(target, "bleeding", 3, 8);
      log(`🩸 ${target.name} está sangrando.`);
    }

  // ===== QUEIMADURA =====
    else if (skill.type == "fire" && isCrit){
      applyStatus(target, "burning", 3, Math.max(2, Math.round(target.maxHp * 0.03)));
      log(`🔥 ${user.name} causa um crítico encendeador!`)      
    }
  // ===== CONGELAMENTO =====

    else if(skill.type == "ice" && isCrit){
      applyStatus(target, "frozen", 2);
      log(`❄️ O gelo congela impedosamente partes do corpo de ${target.name}!`)
  }

  // ===== CONFUSÃO =====
    else if(skill.type == "holy" && isCrit){
      log(`✨ A fé de ${user.name} é fortemente respondida, a luz divina confunde ${target.name}!`);
      applyStatus(target, "confused", 2);
  }
  // ===== CEGUEIRA =====
    else if(skill.type == "dark" && isCrit){
      log(`🌑 Um sussuro maldito irrompe na mente de ${target.name} o roubando a visão!`);
      applyStatus(target, "blinded", 2);
  }
  // ===== ENVENENAMENTO =====
    else if(skill.applyPoison){
      applyStatus(target, "poisoning", 3, 8);
      log(`🧪 ${target.name} está envenenado.`);
    }
    else{
      log(
        `${user.name} usa ${skill.name} causando ${base} de dano!` +
        (isCrit ? " 💥 CRÍTICO!" : "")
      );
    };

  // ===== VERIFICA DERROTA =====
if (target.hp <= 0) {
  target.hp = 0;
  updateBars();

  if (target === player) {
    log(`☠️ ${player.name} foi derrotado...`);
    endBattle(false);
  } else {
    log(`${target.name} foi derrotado!`);
    endBattle(true);
  }

  return;
}

  updateBars();
}

function enemyAction() {

  const enemy = enemiesInBattle[currentEnemyIndex];
  if (!enemy) return;

  if (!processStatuses(enemy, "enemy")) {
    updateBars();
    return;
  }

  const canUseSkill =
    enemy.skills &&
    enemy.skills.length > 0 && Math.random() < (enemy.skillChance || 0.3);

  if (canUseSkill) {
    const skillKey =
      enemy.skills[Math.floor(Math.random() * enemy.skills.length)];

    useSkill(enemy, player, skillKey, true);
  } else {
    enemyBasicAttack();
  }
  currentEnemyIndex++;

if (currentEnemyIndex >= enemiesInBattle.length) {

  currentEnemyIndex = 0;

  if (player.vampireClaws?.active) {
    player.vampireClaws.turns--;

    if (player.vampireClaws.turns <= 0) {
      deactivateVampireClaws();
    }
  }

  playerTurn();

} else {
  setTimeout(enemyAction, 900);
}


}

function enemyBasicAttack() {
  const enemy = enemiesInBattle[currentEnemyIndex];
  if (!enemy) return;

  const blindMiss = hasStatus(enemy, "blinded") ? 0.25 : 0;
  const missChance = 0.1 + blindMiss;

  if (Math.random() < missChance) {
    log(`${enemy.name} errou o ataque!`);
    updateBars();
    return;
  }

  const isCrit = Math.random() < 0.15;
  let attackPower = enemy.attack;

  if (hasStatus(enemy, "curse")) {
    attackPower = Math.floor(attackPower * 0.7);
  }

  let base = Math.floor(Math.random() * attackPower) + 6;
  let damage = isCrit ? base * 2 : base;

// 👉 BLOQUEIO COM ESCUDO
const sub = player.equippedSubWeapon;

  if (sub && shields[sub.name]) {
    const shield = shields[sub.name];

    if (Math.random() < shield.blockChance) {
      damage = Math.floor(damage * 0.4); // 60% redução
      log("🛡️ Escudo bloqueou grande parte do dano!");
    }
  }

  // 👉 DEFENDER NORMAL
  if (player.defending) {
    damage = Math.floor(damage / 2);
    player.defending = false;
  }


  player.hp = Math.max(0, player.hp - damage);

  narrateAttack("enemy", enemy.name, damage, isCrit, false);

  if (player.hp <= 0) {
    endBattle(false);
    return;
  }

  updateBars();
}


/* ========== CONTROLE DE TURNOS ========== */
function playerTurn(action) {

  if (typeof action === "function") {
    action();
  }
}


/* ========== LOG / NARRAÇÃO (com histórico colorido e scroll automático) ========== */
function log(msg) {
  const el = document.getElementById("battle-log");
  if (!el) return;

  const p = document.createElement("p");
  p.innerText = msg;

  // Define uma classe CSS com base no tipo da mensagem
  if (/💀|☠️/i.test(msg)) p.classList.add("log-death");
  else if (/🔥|queim|Pirocinese|fogo|ignis|chamas|brasas/i.test(msg)) p.classList.add("log-fire");
  else if (/❄️|gelo|Criogenese|frio|congel|nevasca/i.test(msg)) p.classList.add("log-ice");
  else if (/🌀|Telecinese|impacto/i.test(msg)) p.classList.add("log-tele");
  else if (/⚡|paralis|eletrocinese|faísca|elétric|choque|raio/i.test(msg)) p.classList.add("log-eletric");
  else if (/💥|crítico|critico/i.test(msg)) p.classList.add("log-crit");
  else if (/divin|sagrad|luz|julgamento|celestial/i.test(msg)) p.classList.add("log-divine");
  else if (/cura|recupera/i.test(msg)) p.classList.add("log-heal");
  else if (/absorve|rouba/i.test(msg)) p.classList.add("log-life-steal");
  else if (/🌑|sombr|dark|trevas|maldi|maldicao|amaldi|demoniac|infern|garras/i.test(msg)) p.classList.add("log-dark");
  else if (/arcan|mana|ritual|encantamento/i.test(msg)) p.classList.add("log-arcane");
  else if (/defendeu|reduzido|bloque/i.test(msg)) p.classList.add("log-defense");
  else if (/errou|falhou|confuso/i.test(msg)) p.classList.add("log-miss");
  else if (/sangra|sangramento/i.test(msg)) p.classList.add("log-bleed");
  else if (/🧪|envenena/i.test(msg)) p.classList.add("log-poison");
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
  { name: "Habilidades", action: () => showWeaponSkills() },
  { name: "Defender", action: () => playerTurn(defend) },
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


document.addEventListener("DOMContentLoaded", () => {

  console.log("DOM pronto");

  // 👉 ATIVA SIDEBAR
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("toggle-sidebar");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("expanded");
      toggleBtn.innerText =
        sidebar.classList.contains("expanded") ? "<" : ">";
    });
  }

  // 👉 BOTÃO COMEÇAR
  const btn = document.getElementById("startBtn");

  if (!btn) {
    console.log("BOTÃO NÃO ENCONTRADO");
    return;
  }

  btn.addEventListener("click", () => {

    console.log("CLICOU EM COMEÇAR");

    startGameUI();

    const name = document.getElementById("playerNameInput").value;
    player.name = name.trim();

    distributeAttributePoints(player);
    recalculateMaxStats();
    equipWeapon("Mãos vazias");
    equipSubWeapon("Mãos vazias");
    giveArmor("base");
    equipArmor("base");
    saveGame();
    discoverPower();

    document.getElementById("btn-up-str").onclick = () => spendPoint("strength");
    document.getElementById("btn-up-int").onclick = () => spendPoint("intelligence");
    document.getElementById("btn-up-faith").onclick = () => spendPoint("faith");
    document.getElementById("btn-up-mind").onclick = () => spendPoint("mind");
    document.getElementById("btn-up-dex").onclick = () => spendPoint("dex");
    document.getElementById("btn-up-def").onclick = () => spendPoint("defense");
    document.getElementById("btn-up-vigor").onclick = () => spendPoint("vigor");

  });

});

