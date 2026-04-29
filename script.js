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

  player.maxHp = BASE_HP + hpBonus + (player.werewolfBonusVigor || 0);

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

  player.maxMana = BASE_MANA + manaBonus + (player.vampireBonusMind || 0);


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
  blood: 0,
  maxBlood: 100,
  isWerewolf: false,
  rage: 0,
  maxRage: 100,
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
},
  vampireBonusMind: 0,
  werewolfBonusVigor: 0,
  companions: []
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
  playerFace.eyebrow_color = "white";
  playerFace.eyebrow_color = "white";
  learnSkill("forma_vampirica");
  learnSkill("drenar_sangue");

  const currentHpPercent = player.hp / player.maxHp;
  if(player.vigor<10){
  player.vigor = 1;
  }else{
    player.vigor -= 10;
  }
  player.hp = Math.round(player.maxHp * currentHpPercent);

  player.vampireBonusMind = 5;
  
  recalculateMaxStats();
  updateFace();
  updateSidebar();
}

function becomeWerewolf(){
  player.isWerewolf = true;
  player.werewolfBonusVigor = 5;
  player.defense += 5;
  player.strength += 10;
  player.dex += 10;
  if(player.mind <10){
    player.mind = 1;
  }else{
    player.mind -= 10;
  };
  if(player.intelligence <10){
    player.intelligence = 1;
  }else{
    player.intelligence -= 10;
  };
    if(player.faith <10){
    player.faith = 1;
  }else{
    player.faith -= 10;
  };
  recalculateMaxStats();
  learnSkill("frenesi_bestial");
  updateSidebar();
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
  if (
    player.equippedSubWeapon &&
    shields[player.equippedSubWeapon.name]
  ) {
    const oldShield =
      shields[player.equippedSubWeapon.name];

    player.defense -= oldShield.defenseBonus;
  }


  player.defense += newShield.defenseBonus;


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
},

  drenar_sangue:{
    name: "Drenar Sangue",
    type: "dark",
    manaCost: 10,
    power: 0.5,
    critChance: 0.4,
    lifesteal: 0.5,
    description: "Drena o sangue do inimigo, curando a si e saciando a fome."
},

/* ===== LOBISOMEN ===== */

  frenesi_bestial: {
    name: "Frenesi Bestial",
    type: "werewolf",
    power: 1, 
    critChance: 0.1,
    consumeAllRage: true,
    description: "Consome toda a fúria e causa um golpe extremamente poderoso."
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

function hpShake(target) {

  let id = null;

  if (target === player) {
    id = "player-hp-fill";
  } 
  else if (alliesInBattle.includes(target)) {
    id = `ally-hp-fill-${target.id}`;
  } 
  else if (enemiesInBattle.includes(target)) {
    id = `enemy-hp-fill-${target.id}`;
  }

  if (!id) return;

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
  if (document.getElementById("attr-talent")) setWidth("attr-talent", player.powerType);
  
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

// ===== SANGUE =====
const bloodSection = document.getElementById("blood-section");
const bloodWrapper = document.getElementById("blood-bar");

if (bloodSection && bloodWrapper) {
  if (player.isVampire) {
    bloodSection.style.display = "block";
    setWidth("bar-blood", (player.blood / player.maxBlood) * 100);
    bloodWrapper.dataset.tooltip = `${player.blood} / ${player.maxBlood}`;
  } else {
    bloodSection.style.display = "none";
  }
}

// ===== FÚRIA =====
const rageSection = document.getElementById("rage-section");
const rageWrapper = document.getElementById("rage-bar");

if (rageSection && rageWrapper) {
  if (player.isWerewolf) {
    rageSection.style.display = "block";
    setWidth("bar-rage", (player.rage / player.maxRage) * 100);
    rageWrapper.dataset.tooltip = `${player.rage} / ${player.maxRage}`;
  } else {
    rageSection.style.display = "none";
  }
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

  window.scrollTo(0, 0);
  
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
    log("Não é possível salvar em combate.");
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
    intro();
  }

  updateSidebar();
}



/* ========== HISTÓRIA ========== */
function intro() {

  window.scrollTo(0, 0);

  const story = `Eu sempre tive uma vida difícil, nossa família era bem pobre e não era fácil sobreviver, mas ainda eramos felizes. 
  
   Até um dia que um homem vestindo roupas estranhas chegou, e mesmo que eu fosse criança, eu ainda lembro que meus pais ficaram estranhos, já não eramos mais uma família feliz mas ainda estávamos juntos... mesmo que esse sentimento não durasse tanto.
   
   As coisas mudaram quando eu fiz 10 anos, meu pai abandonou a casa, e o que já era difícil ficou ainda mais, minha mãe não conseguia sustentar eu e ela... quem dirá o bebê que meu pai deixou de presente em seu ventre antes de sumir.
    
   Quando Beattrice nasceu, tudo desmoronou, eu já tinha certa idade então entendia que a atenção de minha mãe seria direcionada para a criança que nascera agora, mas o que eu não imaginava era que eu seria tida como culpada por tudo que aconteceu. Até hoje tenho as marcas...
   
   Os anos se passaram e eu fiz os meus 16 anos, Beattrice tinha 6, e mais uma vez, aquele homem com roupas estranhas apareceu, eu não consigo me lembrar exatamente como eram suas roupas, minha memória está embaçada em toda a minha infância e adolescência, mas ainda consigo lembrar do desespero de ver aquele homem novamente levar algo precioso de mim, minha irmã foi levada nesse dia e com isso, minha mãe mudou completamente. O que era raro, começou a acontecer frequentemente, foram os 2 anos mais sofridos de todos, mas eu sabia que aquilo não era a minha mãe, aquele monstro já não era mais aquela que cuidava de mim.
   
   Finalmente quando aquele homem voltou, eu lembro de algo que ele disse: "A Torre salvará a todos, na Torre você vai poder recuperar tudo". Esse foi o último dia que vi tanto a minha mãe quando aquele homem.`;

  changeScene(
    story,
    () => {
      criarBotaoHistoria("Continuar", "continueBackStory");
    },
    320,
    "powerText",
    "powerChoices",
    "intro"
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



/* ========== COMBATE ========== */

let selectedEnemyIndex = 0;

let selectedTarget = null; // pode ser aliado OU inimigo

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

    isPlayer: baseData.isPlayer || false,
    isCompanion: baseData.isCompanion || false
  };
}

function createCompanion(baseData) {
  return {
    ...structuredClone(baseData),
    isPlayer: false,
    isCompanion: true,
    defending: false,
    status: {},
  };
};

function hireCompanion(companionKey) {

  if (player.companions.length >= 4) {
    log("Você já tem o máximo de 4 companheiros.");
    return;
  }

  const base = companionsDatabase[companionKey];
  if (!base) return;

  const newCompanion = createCompanion(base);

  player.companions.push(newCompanion);

  log(`${newCompanion.name} agora luta ao seu lado.`);
}

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
let alliesInBattle = [];

function getCurrentEnemy() {
  return enemiesInBattle[currentEnemyIndex];
}

/* INIMIGOS */
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
  },

  mira: {
    name: "Mira",
    hp: 150,
    maxHp: 150,
    attack: 25,
    defense: 15,
    powerType: "fisic",
    stats: {},
    skills: [
      "apunhalada",
      "estocada_precisa"
    ],
    xp: 300,
    skillChance: 0.5,
    description: "Sua rival da guilda, ela te olha com arrogância e desdém"
  }
};

/* ALIADOS */
const companionsDatabase = {

  mira: {
    name: "Mira",
    maxHp: 150,
    hp: 150,
    attack: 12,
    defense: 8,
    dex: 10,
    skills: ["apunhlada", "estocada_precisa"],
    description: "Sua rival da guilda"
  },

  elena: {
    name: "Elena",
    maxHp: 120,
    hp: 120,
    maxMana: 80,
    mana: 80,
    attack: 12,
    defense: 8,
    dex: 7,
    skills: ["cura_basica", "julgamento"],
    description: "Uma clériga gentil, mas determinada."
  },

  kael: {
    name: "Kael",
    maxHp: 150,
    hp: 150,
    attack: 18,
    defense: 10,
    dex: 9,
    skills: ["corte_forte"],
    description: "Um espadachim impulsivo."
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
    e.preventDefault(); 
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

function checkBattleEnd() {

  // Remove inimigos mortos
  enemiesInBattle = enemiesInBattle.filter(e => e.hp > 0);

  if (currentEnemyIndex >= enemiesInBattle.length) {
    currentEnemyIndex = 0;
  }

  const alliesAlive = alliesInBattle.some(a => a.hp > 0);
  const enemiesAlive = enemiesInBattle.length > 0;

  if (!alliesAlive) {
    endBattle(false);
    return true;
  }

  if (!enemiesAlive) {
    endBattle(true);
    return true;
  }

  renderEnemyTargets();
  updateEnemyHUD();
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

  // procura aliados na lista
alliesInBattle = [player, ...player.companions];

currentEnemyIndex = 0;

selectedEnemyIndex = 0;

selectedTarget = enemiesInBattle[0]; // padrão começa em inimigo

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

function renderAlliesStatus() {

  const container = document.getElementById("allies-status");
  container.innerHTML = "";

  if (!alliesInBattle) return;

  const allies = alliesInBattle.filter(a => a !== player);

  const count = allies.length;

  // Controle de layout
  if (count <= 2) {
    container.style.gridTemplateColumns = "1fr";
  } else {
    container.style.gridTemplateColumns = "1fr 1fr";
  }

  allies.forEach((ally, index) => {

    const percent = Math.max(0, (ally.hp / ally.maxHp) * 100);

    const card = document.createElement("div");
    card.className = "ally-card";

  card.innerHTML = `
    <div class="ally-name">${ally.name}</div>
    <div class="ally-status">
      ${makeStatusIcons(ally)}
    </div>
    <div class="ally-bar">
      <div 
      id="ally-hp-fill-${index}"
      class="ally-hp-fill" 
      style="width:${percent}%">
    </div>
    </div>
  `;
    // Caso especial: 3 aliados → último ocupa linha inteira
    if (count === 3 && index === 2) {
      card.style.gridColumn = "1 / -1";
    }

    card.onclick = () => {
  selectedTarget = ally;
  renderAlliesStatus();
  renderEnemyTargets();
};

if (selectedTarget === ally) {
  card.classList.add("selected");
}
    container.appendChild(card);
  });
}

function renderEnemyTargets() {
  const container = document.getElementById("enemy-targets");
  if (!container) return;

  container.innerHTML = "";

  enemiesInBattle.forEach((enemy, index) => {

    const btn = document.createElement("button");
    btn.innerText = enemy.name;
    btn.className = "enemy-target-btn";

    if (selectedTarget === enemy) {
      btn.classList.add("selected");
    }

    btn.onclick = () => {
      selectedTarget = enemy;
      selectedEnemyIndex = index;
      renderEnemyTargets();
      renderAlliesStatus();
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
  const enemy = getSelectedEnemy();
  if (!enemy) return;

  const playerStatusEl = document.getElementById("player-status");
  const enemyStatusEl  = document.getElementById("enemy-status");

  if (!playerStatusEl || !enemyStatusEl) return;

  playerStatusEl.innerHTML = makeStatusIcons(player);
  enemyStatusEl.innerHTML  = makeStatusIcons(enemy);
}

function makeStatusIcons(entity) {
  if (!entity.status) return "";

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
    curse: "Maldição — ataque e defesa reduzidos.",
    silence: "Silêncio — não pode conjurar magias.",
    poisoning: "Envenenamento — sofre dano contínuo."
  };

  return Object.keys(entity.status)
    .filter(s => entity.status[s].turns > 0)
    .map(s => {
      const emoji = emojiMap[s] || "?";
      const desc = descMap[s] || s;
      return `<span class="status-icon" data-tip="${desc}">${emoji}</span>`;
    })
    .join("");
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

  renderAlliesStatus();
  updateSidebar();
  updateStatusIcons(); 
}

/* Narrador dinâmico + aplica efeitos visuais */
function narrateAttack(
  attacker,
  defender,
  damage,
  isCrit,
  wasDefended,
  attackType = "fisic",
  spellText = null
) {

  const attackerName = attacker.name;
  const defenderName = defender.name;

  const isPlayer = attacker === player;
  const isEnemy = enemiesInBattle.includes(attacker);
  const isAlly = alliesInBattle.includes(attacker) && attacker !== player;

  let narration = "";

  /* =========================
     ATAQUES CRÍTICOS
  ========================== */

  if (isCrit) {

    if (!isEnemy) { // player OU companion

      switch (attackType) {

        case "weapon_skill":
          narration = `💥 ${attackerName} executa um golpe com precisão brutal contra ${defenderName}, causando ${damage} de dano crítico!`;
          applyStatus(defender, "confused", 2);
          break;

        case "distance":
          narration = `🏹 ${attackerName} acerta um disparo perfeito em ${defenderName}, causando ${damage} de dano crítico!`;
          applyStatus(defender, "bleeding", 3, 8);
          break;

        case "fire":
          narration = `🔥 ${attackerName} libera chamas intensas que engolem ${defenderName}, causando ${damage} de dano crítico!`;
          applyStatus(defender, "burning", 3, Math.max(2, Math.round(defender.maxHp * 0.03)));
          break;

        case "ice":
          narration = `❄️ O frio absoluto de ${attackerName} congela ${defenderName}, causando ${damage} de dano crítico!`;
          applyStatus(defender, "frozen", 2);
          break;

        case "holy":
          narration = `✨ A fé de ${attackerName} invoca julgamento divino sobre ${defenderName}, causando ${damage} de dano crítico sagrado!`;
          applyStatus(defender, "confused", 2);
          break;

        case "eletric":
          narration = `⚡ ${attackerName} lança uma descarga elétrica devastadora contra ${defenderName}, causando ${damage} de dano crítico!`;
          applyStatus(defender, "paralizado", 1);
          break;

        case "dark":
          narration = `🌑 As sombras respondem a ${attackerName} e envolvem ${defenderName}, causando ${damage} de dano crítico!`;
          applyStatus(defender, "blinded", 2);
          break;

        case "arcane":
          narration = `🌀 A energia arcana se distorce e explode contra ${defenderName}, causando ${damage} de dano crítico!`;
          break;

        default:
          narration = `💥 ${attackerName} desfere um golpe devastador em ${defenderName}, causando ${damage} de dano crítico!`;
          applyStatus(defender, "confused", 2);
      }

      hpShake(defender);

    } else { // inimigo crítico

      narration = `💥 ${attackerName} acerta um golpe crítico em ${defenderName}!`;
      applyStatus(defender, "confused", 2);

      if (hasStatus(defender, "frozen")) {
        damage *= 2;
        clearStatus(defender, "frozen");
        log(`❄️ O gelo que envolvia ${defenderName} se quebra com o impacto!`);
        applyStatus(defender, "bleeding", 3, 8);
      }

      hpShake(defender);
    }

  }

  /* =========================
     ATAQUES NORMAIS
  ========================== */

  else {

    if (!isEnemy) { // player ou companion

      if (attackType === "fisic") {
        narration = `${attackerName} ataca ${defenderName}, causando ${damage} de dano.`;

      } else if (attackType === "weapon_skill") {
        const skillName = spellText || attackType.toLowerCase();
        narration = `${attackerName} executa ${skillName} em ${defenderName}, causando ${damage} de dano.`;

      } else {
        const spellName = spellText || attackType.toLowerCase();
        narration = `✨ ${attackerName} conjura ${spellName} em ${defenderName}, causando ${damage} de dano.`;
      }

    }

    else { // inimigo normal

      if (wasDefended) {
        narration = `${attackerName} atacou, mas ${defenderName} defendeu parcialmente, reduzindo o dano.`;
      } else {
        const special = getEnemyAttackDescription(attackerName, defenderName);
        narration = special
          ? `${special} e causou ${damage} de dano.`
          : `${attackerName} atacou ${defenderName}, causando ${damage} de dano.`;
      }
    }

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
};

function deactivateVampireClaws() {

  player.equippedWeapon = player.vampireClaws.previousMain;
  player.equippedSubWeapon = player.vampireClaws.previousSub;

  player.vampireClaws.active = false;
  player.vampireClaws.turns = 0;

  log("As garras se retraem lentamente.");

  updateSkills();
  updateFace();
};

function gainBlood(amount) {
  if (!player.isVampire) return;

  player.blood += amount;
  if (player.blood > player.maxBlood)
    player.blood = player.maxBlood;

  updateSidebar();
};

function spendBlood(amount) {
  if (player.blood < amount) return false;

  player.blood -= amount;
  updateSidebar();
  return true;
};

function gainRage(amount) {
  if (!player.isWerewolf) return;

  player.rage += amount;
  if (player.rage > player.maxRage)
    player.rage = player.maxRage;

  updateSidebar();
};

function spendRage(amount) {
  if (player.rage < amount) return false;

  player.rage -= amount;
  updateSidebar();
  return true;
};

/* ===== AÇÕES DO JOGADOR ===== */
function attack() {

  if (player.hp <= 0) {
  log("Você está inconsciente.");
  return;
}
  const target = selectedTarget;
  if (!target) return;

  if (!processStatuses(player, "player")) {
    if (target.hp > 0 && player.hp > 0)
      setTimeout(companionsTurn, 800);
    return;
  }

  updateMagicUI();

  // ===== CEGUEIRA =====
  const blindMiss = hasStatus(player, "blinded") ? 0.35 : 0;
  if (Math.random() < blindMiss) {
    log(`${player.name} tentou atacar, mas estava cego e errou!`);
    if (target.hp > 0) setTimeout(companionsTurn, 800);
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
  if (hasStatus(target, "frozen")) {
    damage *= 2;
    clearStatus(target, "frozen");

    log(`❄️ O gelo que envolvia ${target.name} se quebra com o impacto!`);

    // sinergia
    applyStatus(target, "bleeding", 3, 8);
  }

  // ===== APLICA DANO =====
  target.hp = Math.max(0, target.hp - damage);

  if (player.isWerewolf && damage > 0) {
    gainRage(Math.floor(damage * 0.25));
  };

  if (player.vampireClaws?.active && damage > 0) {
  const steal = Math.floor(damage * 0.4);
  const before = player.hp;

  player.hp = Math.min(player.maxHp, player.hp + steal);

  if (player.isVampire && damage > 0) {
    gainBlood(Math.floor(damage * 0.2));
  };
  log(`🩸 ${player.name} drena ${player.hp - before} de vida.`);
}

  narrateAttack(
    player,
    target,
    damage,
    isCrit,
    false,
    weapon.type
  );

  updateBars();

  // ===== FIM DE COMBATE =====
if (target.hp <= 0) {

  log(`${target.name} foi derrotado!`);
  gainXP(target.xp||0);
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


  setTimeout(companionsTurn, 800);
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
  vampire:      "#6e1d14", // vinho
  werewolf:     "#d88d2b"  // laranja
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

  const allies = [player, ...companions].filter(a => a && a.hp > 0);
  const enemies = enemiesInBattle.filter(e => e && e.hp > 0);

  switch (skill.target) {

    case "all_enemies":
      return isEnemy ? allies : enemies;

    case "all_allies":
      return isEnemy ? enemies : allies;

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
  if (player.hp <= 0) {
  log("Você está inconsciente.");
  return;
}
  const target = selectedTarget;
  if (!target) return;

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
  };

let rageConsumed = 0;

if (skill.consumeAllRage) {
  if (!player.isWerewolf) {
    log("Apenas lobisomens podem usar essa habilidade.");
    return;
  }

  if (player.rage <= 0) {
    log("Você não tem Fúria suficiente.");
    return;
  }

  rageConsumed = player.rage;
  player.rage = 0; // zera depois
}

  if (skill.manaCost && player.mana < skill.manaCost) {
    log("Mana insuficiente.");
    return;
  };

  if (skill.bloodCost) {
    if (!spendBlood(skill.bloodCost)) {
      log("Sangue insuficiente.");
      return;
    };
  };

  if (skill.rageCost) {
    if (!spendRage(skill.rageCost)) {
      log("Fúria insuficiente.");
      return;
    }
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

  const allAllies = [player, ...alliesInBattle];

  let target;

  // Se o alvo selecionado for aliado, cura ele
  if (selectedTarget && allAllies.includes(selectedTarget)) {
    target = selectedTarget;
  } else {
    // Se for inimigo ou null, cura o player
    target = player;
  }

  const scaling = getMagicScaling(player, skill);

  let healAmount = Math.floor(
    (skill.power * weapon.baseDamage) + scaling
  );

  const isCrit = Math.random() < (skill.critChance || 0);
  if (isCrit) healAmount *= 2;

  const before = target.hp;

  target.hp = Math.min(target.maxHp, target.hp + healAmount);

  log(
    `${player.name} usa ${skill.name} em ${target.name} e recupera ${
      target.hp - before
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
      calculateWeaponDamage(player, target, skill, weapon));
  };

  damage = applyDamage(target, damage, skill.type);

  ({ damage, isCrit } =
  calculateWeaponDamage(player, target, skill, weapon));

if (skill.consumeAllRage) {

  const strengthScaling = player.strength * 0.7;
  const rageScaling = rageConsumed * 1.5;

  damage += Math.floor(strengthScaling + rageScaling);

  log(`Você libera ${rageConsumed} de Fúria em um ataque devastador!`);
}
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
    target,
    "silence",
    skill.silenceDuration || 2
  );
  log(`🤐 ${enemy.name} foi silenciado!`);
}

  narrateAttack(
    player,
    target,
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
    if (player.isVampire && damage > 0) {
      const bloodGain = Math.floor(damage * 0.9);
      gainBlood(bloodGain);
    }
  }

  /* =========================
     MALDIÇÃO
     ========================= */
  if (skill.applyCurse) {
    applyStatus(target, "curse", 3);
    log(`🕯️ ${target.name} foi amaldiçoado.`);
  }

  /* =========================
    SANGRAMENTO
    ========================= */

    if (skill.applyBleed) {
      applyStatus(target, "bleeding", 3, 8);
      log(`🩸 ${target.name} está sangrando.`);
    }

  /* =========================
    CONFUSÃO
    ========================= */

    if (skill.applyStun){
      applyStatus(target, "confused", 2);
      log(`💫 ${target.name} está atordoado`);
    }

  /* =========================
    ENVENENAMENTO
    ========================= */

    if(skill.applyPoison){
      applyStatus(target, "poisoning", 3, 9);
      log(`🧪 ${target.name} está envenenado.`)
    }

  /* =========================
    QUEIMADURA
    ========================= */
    
    if(skill.applyBurn){
      applyStatus(target, "burning", 3, Math.max(2, Math.round(target.maxHp * 0.03)));
      log(`🔥 ${target.name} está queimando.`)
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
  if (player.hp <= 0) {
  log("Você está inconsciente.");
  return;
  }

  const weapon = player.equippedWeapon;

  const target = selectedTarget;
  if (!target) return;

  const input = document.getElementById("spell-input");
  if (!input) return;

  const spellText = input.value.trim().toLowerCase().replace(/\s+/g, " ");;
  input.value = "";

  const skillKey = spellDictionary[spellText];

  if (!skillKey || !skills[skillKey]) {
    log("O encantamento falha. Nada acontece.");
    setTimeout(companionsTurn, 800);
    return;
  }

  const skill = skills[skillKey];

  // ===== SILÊNCIO =====
  if (hasStatus(player, "silence")) {
    log("Você está silenciado e não consegue conjurar magias.");
    setTimeout(companionsTurn, 800);
    return;
  }


  if (!processStatuses(player, "player")) {
    setTimeout(companionsTurn, 800);
    return;
  }

  updateMagicUI();
  const cost = skill.manaCost || 0;

  // magia acima do nível do personagem
  if (cost > player.maxMana) {
    log("Esse encantamento é de um nível superior ao seu.");
    setTimeout(companionsTurn, 800);
    return;
  }

  // mana insuficiente
  if (cost > player.mana) {
    log("Mana insuficiente.");
    setTimeout(companionsTurn, 800);
    return;
  }

  // consome mana
  player.mana -= cost;

  const scaling = getMagicScaling(player, skill);

  /* =========================
     MAGIA DE CURA
     ========================= */
if (skill.heal) {

  const allAllies = [player, ...alliesInBattle];

  let target;

  // Se o alvo selecionado for aliado, cura ele
  if (selectedTarget && allAllies.includes(selectedTarget)) {
    target = selectedTarget;
  } else {
    // Se for inimigo ou null, cura o player
    target = player;
  }

  const scaling = getMagicScaling(player, skill);

  let healAmount = Math.floor(
    (skill.power * weapon.baseDamage) + scaling
  );

  const isCrit = Math.random() < (skill.critChance || 0);
  if (isCrit) healAmount *= 2;

  const before = target.hp;

  target.hp = Math.min(target.maxHp, target.hp + healAmount);

  log(
    `${player.name} usa ${skill.name} em ${target.name} e recupera ${
      target.hp - before
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

damage = applyDamage(target, damage, skill.type);
target.hp = Math.max(0, target.hp - damage);


narrateAttack(
  player,
  target,
  damage,
  isCrit,
  false,
  skill.type,
  skill.name,
  target
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
  applyStatus(target, "curse", 3);
  log(`🕯️ ${target.name} foi amaldiçoado.`);
}

updateBars();

if (target.hp > 0) {
  setTimeout(companionsTurn, 800);
}

if (target.hp <= 0) {

  log(`${target.name} foi derrotado!`);
gainXP(target.xp||0);
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
function getEnemyAttackDescription(enemyName, defenderName) {
  switch (enemyName) {

    case "João José":
      return [
        `João José ataca o rosto de ${defenderName} com força!`,
        `João José desfere um chute certeiro nas costelas de ${defenderName}!`,
        `João José dá um soco rápido no abdômen de ${defenderName}!`,
        `Ele avança com precisão e acerta ${defenderName} com um golpe potente!`,
        `João José golpeia ${defenderName} com a frieza de um soldado treinado!`
      ][Math.floor(Math.random() * 5)];

    case "Drone de Captura":
      return [
        `O Drone dispara lasers elétricos contra ${defenderName}!`,
        `O Drone trava sua mira e atira uma rajada energética em ${defenderName}!`,
        `O Drone vibra no ar e lança uma descarga contra ${defenderName}!`
      ][Math.floor(Math.random() * 3)];

    case "Rudo":
      return [
        `Rudo avança em disparada e acerta ${defenderName} em cheio com sua espada!`,
        `Rudo pula e acerta um soco no rosto de ${defenderName}!`,
        `Rudo joga a espada contra ${defenderName} e a pega no ar!`,
        `Rudo desfere uma sequência de golpes contra ${defenderName}!`
      ][Math.floor(Math.random() * 4)];

    case "Crhistine":
      return [
        `Crhistine avança com sangue nos olhos contra ${defenderName}!`,
        `Crhistine ataca ${defenderName} com determinação!`,
        `Crhistine desfere uma sequência de golpes com sua espada em ${defenderName}!`
      ][Math.floor(Math.random() * 3)];

    default:
      return `${enemyName} ataca ${defenderName} impiedosamente!`;
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
  if (player.isWerewolf) {
    gainRage(Math.floor(base * 0.4));
  }

narrateAttack(
  user,
  target,
  base,
  isCrit,
  false,
  skill.type,
  skill.name
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
    };

  // ===== VERIFICA DERROTA =====
if (checkBattleEnd()) return;

  updateBars();
}

function enemyAction() {

  const enemy = enemiesInBattle[currentEnemyIndex];
  if (!enemy) return;

  if (!processStatuses(enemy, "enemy")) {

    updateBars();

    currentEnemyIndex++;

    if (currentEnemyIndex >= enemiesInBattle.length) {

      currentEnemyIndex = 0;

      if (player.vampireClaws?.active) {
        player.vampireClaws.turns--;
        if (player.vampireClaws.turns <= 0) {
          deactivateVampireClaws();
        }
      }

      if (player.hp > 0) {
        playerTurn();
      } else {
        setTimeout(companionsTurn, 900);
      }

    } else {
      setTimeout(enemyAction, 900);
    }

    return;
  }

  const canUseSkill =
    enemy.skills &&
    enemy.skills.length > 0 &&
    Math.random() < (enemy.skillChance || 0.3);

  if (canUseSkill) {
    const skillKey =
      enemy.skills[Math.floor(Math.random() * enemy.skills.length)];

    const target = getRandomAllyTarget();
    if (!target) return;

    useSkill(enemy, target, skillKey, true);
  } else {
    enemyBasicAttack(enemy);
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

    if (player.hp > 0) {
      playerTurn();
    } else {
      setTimeout(companionsTurn, 900);
    }

  } else {
    setTimeout(enemyAction, 900);
  }
}

function getRandomAllyTarget() {
  const livingAllies = alliesInBattle.filter(a => a.hp > 0);
  if (livingAllies.length === 0) return null;

  return livingAllies[Math.floor(Math.random() * livingAllies.length)];
}

function enemyBasicAttack() {
  const enemy = enemiesInBattle[currentEnemyIndex];
  if (!enemy) return;

  const target = getRandomAllyTarget();
  if (!target) return;

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

// BLOQUEIO COM ESCUDO
const sub = target.equippedSubWeapon;

  if (sub && shields[sub.name]) {
    const shield = shields[sub.name];

    if (Math.random() < shield.blockChance) {
      damage = Math.floor(damage * 0.4); // 60% redução
      log("Escudo bloqueou grande parte do dano!");
    }
  }

  // DEFENDER NORMAL
  if (target.defending) {
    damage = Math.floor(damage / 2);
    target.defending = false;
  }


  target.hp = Math.max(0, target.hp - damage);

  narrateAttack(enemy, target, damage, isCrit, false);

  if (checkBattleEnd()) return;

  updateBars();
}

function companionAction(companion) {

  if (!processStatuses(companion, "ally")) return;

  const livingEnemies = enemiesInBattle.filter(e => e.hp > 0);
  if (livingEnemies.length === 0) return;

  const target = livingEnemies[Math.floor(Math.random() * livingEnemies.length)];

  // 40% chance de usar skill
  const canUseSkill =
    companion.skills &&
    companion.skills.length > 0 &&
    Math.random() < 0.4;

  if (canUseSkill) {

    const skillKey =
      companion.skills[
        Math.floor(Math.random() * companion.skills.length)
      ];

    const skill = skills[skillKey];

if (skill.heal) {
  const allyToHeal = alliesInBattle
    .filter(a => a.hp > 0 && a.hp < a.maxHp)
    .sort((a,b) => a.hp - b.hp)[0];

  useSkill(companion, allyToHeal || companion, skillKey, false);
} else {
  useSkill(companion, target, skillKey, false);
}

  } else {

    companionBasicAttack(companion, target);

  }

  checkBattleEnd();
  updateBars();
}

let currentCompanionTurn = 0;

function companionsTurn() {
  const livingCompanions = player.companions.filter(c => c.hp > 0);

  if (livingCompanions.length === 0) {
    setTimeout(enemyAction, 800);
    return;
  }

  if (currentCompanionTurn >= livingCompanions.length) {
    currentCompanionTurn = 0;
    setTimeout(enemyAction, 800);
    return;
  }

  const companion = livingCompanions[currentCompanionTurn];

  companionAction(companion)

  currentCompanionTurn++;

  checkBattleEnd();
  setTimeout(companionsTurn, 800);
}

function companionBasicAttack(companion, target) {

  if (!target) return;

  const critChance = 0.15;
  const isCrit = Math.random() < critChance;

  let base =
    Math.floor(Math.random() * companion.attack) +
    Math.floor(companion.attack * 0.5);

  if (isCrit) base *= 2;

  base = applyDamage(target, base, "fisic");

  target.hp = Math.max(0, target.hp - base);

  log(
    `${companion.name} ataca ${target.name} causando ${base} de dano` +
    (isCrit ? " 💥 CRÍTICO!" : "")
  );

    if (enemiesInBattle.length === 0) {
    endBattle(true);
    return;
  }

  checkBattleEnd();
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
    intro();

    document.getElementById("btn-up-str").onclick = () => spendPoint("strength");
    document.getElementById("btn-up-int").onclick = () => spendPoint("intelligence");
    document.getElementById("btn-up-faith").onclick = () => spendPoint("faith");
    document.getElementById("btn-up-mind").onclick = () => spendPoint("mind");
    document.getElementById("btn-up-dex").onclick = () => spendPoint("dex");
    document.getElementById("btn-up-def").onclick = () => spendPoint("defense");
    document.getElementById("btn-up-vigor").onclick = () => spendPoint("vigor");

  });

});

