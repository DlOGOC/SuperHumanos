/* ======= script.js ======= */
function distributeAttributePoints(player){
  const attribute = ["strength", "intelligence", "skill", "defense", "faith", "vigor", "mind"];

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
  const oldMaxHp = player.maxHp;
  const oldMaxMana = player.maxMana;

  if(player.vigor >= 10){
    player.maxHp = BASE_HP + player.vigor * (HP_PER_VIGOR/2);
  }else if(player.vigor >= 20){
    player.maxHp = BASE_HP + player.vigor * (HP_PER_VIGOR/8);
  }else{
    player.maxHp = BASE_HP + player.vigor * HP_PER_VIGOR;
  }

  if(player.mind >= 10){
    player.maxMana = BASE_MANA + player.mind * (MANA_PER_MIND/2);
  }else if(player.mind >= 20){
    player.maxMana = BASE_MANA + player.mind * (MANA_PER_MIND/6);
  }else{
    player.maxMana = BASE_MANA + player.mind * MANA_PER_MIND;
  }

  // mantém proporção atual (opcional, mas elegante)
  player.hp = Math.round(player.hp * (player.maxHp / oldMaxHp));
  player.mana = Math.round(player.mana * (player.maxMana / oldMaxMana));

  // segurança
  player.hp = Math.min(player.hp, player.maxHp);
  player.mana = Math.min(player.mana, player.maxMana);

  updateSidebar();
}


let player = {
  name: "",
  level: 0,
  xp:0,
  hp: 100, maxHp: 100,
  mana: 50, maxMana: 50,
  hunger: 100, sleep: 100, energy: 100,
  strength: 10, intelligence: 10, skill: 10, defense: 10, faith:10, mind: 10, 
  vigor: 8,
  money: 0,
  guild: null,
  guildMember: false,
  defending: false,
  status: {}, // e.g. { burning: {turns:3, value:3}, frozen: {turns:2} }
  mainWeapons: 0,
  subWeapons: 0,
  learnedSkills: [],
  isVampire: false,
  equippedArmor: null
};

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

  img.src =
    `img/faces/skin/effects/vitiligo/${playerFace.skin}/${playerFace.skin_color}.webp`;
}

function updateFreckles() {
  const img = document.getElementById("skin-freckles");
  if (!img) return;

  console.log(
  "Freckles path:",
  `img/faces/skin/effects/freckles/${playerFace.skin}/${playerFace.skin_color}.webp`
);

  if (!playerFace.skin_effects.freckles) {
    img.src = EMPTY_IMG;
    return;
  }

  img.src =
    `img/faces/skin/effects/freckles/${playerFace.skin}/${playerFace.skin_color}.webp`;
}

function updateSkin() {
  const base = `img/skin/base/${playerFace.skin}/${playerFace.skin_color}`;

  document.getElementById("skin-color").src = `${base}_color.webp`;
  document.getElementById("skin-line").src  = `${base}_line.webp`;
  updateVitiligo();
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

  updateDarkCircles();

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

  const base = `img/mouths/${playerFace.mouth}`;

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

function updateFace() {
  updateSkin();
  updateHair();
  updateEyebrow();
  updateEyes();
  updateMouth();
  updateCloth();
  updateSkinEffects()
  updateDarkCircles();

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

let timeLocal = 0;
let trainingDay = 8;
/* ===== ARMAS DO JOGADOR =====*/

//vantagens e desvantagens nos tipos de arams:
const typeAdvantages = {
  // ===== BASE =====
  fisico:   { strong: "distance", weak: "arcane" },
  distance: { strong: "fisico",   weak: "arcane" },

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


const weapons = {
  "Espada de treino": {
    name: "Espada de treino",
    type: "fisico",
    baseDamage: 10,
    skills: ["corte_forte"]
  },

  "Cajado simples": {
    name: "Cajado simples",
    type: "magic",
    baseDamage: 6,
    skills: ["bola_de_fogo"]
  },

  "Espada dentada": {
    name: "Espada dentada",
    type: "dark",
    baseDamage: 15,
    skills: ["corte_forte", "golpe_vampirico"]
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
    defense: 6
  },

  full_thief_no_mask:{
    id: "full_thief_no_mask",
    name: "Armadura de Ladino Completa (Sem Máscara)",
    defense: 6
  },

  thief:{
    id: "thief_mask",
    name: "Armadura de Ladino",
    defense: 6
  },

  thief:{
    id: "thief_no_mask",
    name: "Armadura de Ladino (Sem Máscara)",
    defense: 6
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

  updateCloth();
}



/* ===== SKILLS DO JOGADOR =====*/

const skills = {

  /* ===== WEAPON SKILLS ===== */
  corte_forte: {
    name: "Corte Forte",
    type: "weapon_skill",
    power: 1.5,
    critChance: 0.15,
    description: "Um golpe pesado com a espada"
  },
  estocada_precisa: {
    name: "Estocada Precisa",
    type: "weapon_skill",
    power: 1.3,
    critChance: 0.25,
    description: "Um golpe rápido e preciso visando pontos vitais"
  },

  esmagar: {
    name: "Esmagar",
    type: "weapon_skill",
    power: 1.7,
    critChance: 0.1,
    description: "Um ataque brutal que quebra defesas"
  },

  corte_giratorio: {
    name: "Corte Giratório",
    type: "weapon_skill",
    power: 1.5,
    critChance: 0.15,
    description: "Um giro amplo que atinge o inimigo"
  },

  /* ===== MAGIC ===== */
  bola_de_fogo: {
    name: "Bola de Fogo",
    type: "fire",
    power: 1.8,
    critChance: 0.1,
    manaCost: 10,
    description: "Uma explosão de chamas"
  },

  congelar: {
    name: "Congelar",
    type: "ice",
    power: 1.2,
    critChance: 0.1,
    manaCost: 9,
    status: "freeze",
    description: "Reduz a mobilidade do inimigo com gelo"
  },

  faisca_estatica: {
    name: "Faísca Estática",
    type: "eletric",
    power: 1.2,
    critChance: 0.2,
    manaCost: 7,
    description: "Uma descarga elétrica rápida e instável"
},

  raio_arcano: {
    name: "Raio Arcano",
    type: "arcane",
    power: 1.6,
    critChance: 0.15,
    manaCost: 12,
    description: "Um disparo concentrado de energia mágica"
  },

  explosao_igneia: {
    name: "Explosão Ígnea",
    type: "fire",
    power: 1.9,
    critChance: 0.1,
    manaCost: 15,
    description: "Uma detonação de fogo concentrado"
},

  lanca_de_gelo: {
    name: "Lança de Gelo",
    type: "ice",
    power: 1.5,
    critChance: 0.15,
    manaCost: 11,
    description: "Um projétil congelante atravessa o inimigo"
  },

  onda_arcana: {
    name: "Onda Arcana",
    type: "arcane",
    power: 1.4,
    critChance: 0.2,
    manaCost: 12,
    description: "Energia mágica se espalha em linha reta"
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
  }
};

/* ===== ENCANTAMENTOS =====*/

const spellDictionary = {

  /* ===== MAGIC ===== */
  ignis: "bola_de_fogo",
  glacies: "congelar",
  fulgur: "raio_arcano",
  unda: "onda_arcana",
  scintilla: "faisca_estatica",

  /* ===== HOLY ===== */
  lux: "cura_basica",
  judicium: "julgamento",
  benedictio: "toque_da_luz",
  puritas: "castigo_divino",

  /* ===== DARK ===== */
  umbra: "toque_sombrio",
  maledictio: "maldicao",
  cruor: "marca_da_maldicao",
  tenebrae: "abraco_das_sombras"
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
function equipWeapon(weaponName){
  if(!weapons[weaponName]){
    console.warn(`Arma ${weaponName} não existe.`);
    return;
  }
  player.weapon = { ...weapons[weaponName] };
  player.type = player.weapon.type;
  console.warn(`${weaponName} equipado com sucesso.`);
}
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
    confused: "Confusão"
  };
  return names[status] || status;
}

/* Aplica status respeitando imunidade */
function applyStatus(entity, statusName, turns, value = null) {
  if (isImmune(entity, statusName)) {
    log(`🛡️ ${entity.name} é imune a ${getStatusName(statusName)}.`);
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
  log(`☠️ ${entity.name} sofre ${getStatusName(statusName)}.`);
  return true;
}

function hasStatus(entity, name) {
  return entity.status?.[name]?.turns > 0;
}

function clearStatus(entity, name) {
  if (entity.status?.[name]) delete entity.status[name];
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
  setText("attr-skill", player.skill);
  setText("attr-faith", player.faith);
  setText("attr-defense", player.defense);
  setText("attr-vigor", player.vigor);
  //setText("attr-energy", Math.round(player.energy));
  setText("money", player.money.toFixed(2));
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
  Array.from(btnDiv.children).forEach(b => { b.style.transition = "opacity 200ms"; b.style.opacity = "0"; });
  setTimeout(() => { if (btnDiv) btnDiv.innerHTML = ""; }, 220);
}
function changeScene(text, buttonSetup, speed = 320, elementId = "powerText", buttonsContainerId = "powerChoices", min = 0, hr =0) {
  clearButtons(buttonsContainerId);
  advanceTime(min, hr);
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
      if (typeof discoverPower === "function") 
      distributeAttributePoints(player);
      discoverPower();
      updateSidebar();
      recalculateMaxStats();
      player.hp = player.maxHp;
      player.mana = player.maxMana;
    });
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", toggleSidebar);
    toggleBtn.addEventListener("touchstart", e => { e.preventDefault(); toggleSidebar(); });
  }

  updateSidebar();
  updateGameTimeDisplay();
});

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
  addMoney(500);
  const story = `Minha mãe adoeceu. Sua idade avançada começou a cobrar o preço, a expectativa de vida em Armenzian é de 24 anos, minha mãe chegou aos 30, seu pulmão estava com problema, ela não conseguia respirar, e novamente me vi na mesma situação de anos atrás, mas dessa vez, as coisas não iriam se repetir. Procurei um médico confiável para tratar dela em casa, seu tratamento é caro, mas eu não deixei que aquilo aconteça novamente.
  
  Preciso conseguir $500 toda semana para que ele trate dela.`;
  changeScene(story, () =>{
    criarBotaoHistoria("Continuar", houseUser);
  })
}

function houseUser() {

  const story = `Você está em casa`;

  changeScene(story, () =>{
    criarBotaoHistoria("Seu quarto (00:01)", userRoom, "powerChoices", 1);
    criarBotaoHistoria("Quarto da sua mãe (00:01)", motherRoom, "powerChoices", 1);
    criarBotaoHistoria("Sair de casa (00:01)", leftUserHouse, "powerChoices", 1);
  })
}

function userRoom(){
  const story = `Você está no seu quarto, o lugar é vazio e sem graça, sua cama pequena está arrumada e convidativa para dormir`;
  changeScene(story, () =>{
    criarBotaoHistoria("Dormir", sleep);
    criarBotaoHistoria("Sair do quarto (00:01)", houseUser, "powerChoices", 1);
  })
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
    criarBotaoHistoria("Voltar a dormir", sleep);
    criarBotaoHistoria("Levantar", userRoom);
  })
}

function motherRoom(){
  const story = `Você está no quarto de Melody.
  
  ${motherStatus()}`;

  changeScene(story, () =>{
    criarBotaoHistoria("Sair do quarto (00:01)", houseUser, "powerChoices", 1);
  })
}



function leftUserHouse(){
  
  let story = `Você está na rua, ${timeMessage}`;

  changeScene(story, () =>{
    criarBotaoHistoria("Avenida da Guilda (00:05)", guildStreet, "powerChoices", 5)
    criarBotaoHistoria("Rua principal (00:05)", principalStreet, "powerChoices", 5);
  })
}

function guildStreet(){
  const story = `Você está na rua da guilda, ${timeMessage}`;
  changeScene(story, () =>{
    criarBotaoHistoria("Guilda (00:01)", guildHub, "powerChoices", 1);
  })
}

function principalStreet(){
  const story = `Você está na rua principal da vila, ${timeMessage}`;
  changeScene(story, () =>{
    criarBotaoHistoria("Cabelereiro (00:01)", barber, "powerChoices", 1);
  })
}

function barber(){
 const story = `Olá! O que você vai querer hoje?`;

   changeScene(story, () => {
    criarBotaoHistoria("Cortar cabelo (50$)", barberHairCut);
    criarBotaoHistoria("Pintar cabelo (25$)", barberHairColor);
    criarBotaoHistoria("Sair", principalStreet);
  });
}

function previewHairCut(hairId) {
  barberPreview.hair_front = hairId;
  barberPreview.hair_back  = hairId;

  playerFace.hair_front = hairId;
  playerFace.hair_back  = hairId;

  updateHair();
}

function confirmHairCut() {
  if (player.money < 50) {
    changeScene(
      "Você não tem dinheiro suficiente para cortar o cabelo.",
      () => criarBotaoHistoria("Voltar", barber)
    );
    return;
  }

  player.money -= 50;

  playerFace.hair_front = barberPreview.hair_front;
  playerFace.hair_back  = barberPreview.hair_back;

  updateHair();
  updateSidebar();

  changeScene(
    "O barbeiro termina o corte e sorri satisfeito.",
    () => criarBotaoHistoria("Voltar", barber)
  );
}


function barberHairCut() {
  barberPreview = { ...playerFace };

  const story = `Escolha um novo corte de cabelo.`;

  changeScene(story, () => {
    criarBotaoHistoria("Cabelo 1", () => previewHairCut("hair_1"));
    criarBotaoHistoria("Cabelo 2", () => previewHairCut("hair_2"));
    criarBotaoHistoria("Cabelo 3", () => previewHairCut("hair_3"));
    criarBotaoHistoria("Cabelo 4", () => previewHairCut("hair_4"));
    criarBotaoHistoria("Confirmar", confirmHairCut);
    criarBotaoHistoria("Cancelar", barber);
  });
}

function previewHairColor(color) {
  barberPreview.hair_front_color = color;
  barberPreview.hair_back_color  = color;

  playerFace.hair_front_color = color;
  playerFace.hair_back_color  = color;

  updateHair();
}

function confirmHairColor() {
  if (player.money < 25) {
    changeScene(
      "Você não tem dinheiro suficiente para pintar o cabelo.",
      () => criarBotaoHistoria("Voltar", barber)
    );
    return;
  }

  player.money -= 25;

  playerFace.hair_front_color = barberPreview.hair_front_color;
  playerFace.hair_back_color  = barberPreview.hair_back_color;

  updateHair();
  updateSidebar();

  changeScene(
    "O barbeiro mistura as tintas e finaliza o trabalho.",
    () => criarBotaoHistoria("Voltar", barber)
  );
}


function barberHairColor() {
  barberPreview = { ...playerFace };

  const story = `Escolha uma nova cor.`;

  changeScene(story, () => {
    criarBotaoHistoria("Preto", () => previewHairColor("black"));
    criarBotaoHistoria("Loiro", () => previewHairColor("blonde"));
    criarBotaoHistoria("Ruivo", () => previewHairColor("ginger"));
    criarBotaoHistoria("Confirmar", confirmHairColor);
    criarBotaoHistoria("Cancelar", barber);
  });
}


function guildHub(){
  let guildMember;
  if(player.guildMember === false){
    guildMember = `Você não é um membro da guilda, você ainda precisará se registrar, olhando ao redor, aquele recepcionista está acenando para você, como se te chamasse.`
  }
  const story = `Você entra no prédio da guilda, vários aventureiros estão neste local, suas armaduras reluzentes e alguns com roupas normais, o local apesar da grande diversidade de pessoas, é bem organizado, em geral, o ambiente parece bom.
  
   Você consegue ver o recepcionista em seu local de trabalho, o mural da guilda - local para aceitar suas missões.
   
   ${guildMember}`;
   changeScene(story, () =>{
    criarBotaoHistoria("Ir para o recepcionista", recepcionist);
    criarBotaoHistoria("Mural", questBoard);
   })
}

function recepcionist(){
  let guildMember;
  if(player.guildMember === false){
    guildMember = `"Olá jovem, você está planejando entrar na nossa guilda?" - Sem esperar você responder, ele continua - "Que bom! nós estamos sempre precisando de membros novos, afinal, muitos monstros têm aparecido em todos os lugares e não temos contingente para todas as ocorrências. Aliás, meu nome é Estevan, estou aqui para o que precisar"
    
    Depois de alguns minutos, o registro da guilda está terminado e o recepcionista volta a falar "Antes que você entre oficialmente em nossa guilda, precisamos que você passa por um treinamento, não se preocupe, ele será apenas para que você consiga se adaptar ao rítimo dos combates que você irá enfrentar. Por favor, venha comigo, vou te levar para a área de treino."`;
    meetCharacter("Estevan");
  }
  let story = `${guildMember}`;

  if(player.guildMember === false){
    changeScene(story, () =>{
      criarBotaoHistoria("Começar o treinamento", guildTraining);
    })
  }
}

function questBoard(){

}

function guildTraining(){
  let training = ``;
  if(trainingDay == 8){
     training = `Estaven te explicou, existem alguns tipos de treinamento e você escolherá que tipo receberá por dia, o total de treino é de uma semana e durará 8 horas, você pode combinar todos os tipos de treino da forma que quiser para montar suas habilidades, no fim do treino, como uma prova final, você combaterá o instrutor, e quando passar, você receberá gratuitamente um conjunto de equipamento inicial.
    
      "Olá ${player.name}! Fiquei sabendo de você, eu sou o Rudoufh, mas pode me chamar de Rudo, serei o seu treinador, eu sei de tudo um pouco então espero ser bem útil para você, sou um veterano de guerra e tenho várias expectativas em você! Não me decepcione!" diz ele e logo dá um tapa nas suas costas.`;
      meetCharacter("Rudo");
  }
   let story = `Você possui ${trainingDay} dias de treino.
   
   ${training} 
   
   "Vamos começar? O que vamos treinar hoje?"`;
    changeScene(story, () =>{
      criarBotaoHistoria("Luta com espadas", () => trainClass("warrior"), "powerChoices", 0, 8);
      criarBotaoHistoria("Conceitos da magia", () => trainClass("mage"), "powerChoices", 0, 8);
      criarBotaoHistoria("Arte da furtividade", () => trainClass("thief"), "powerChoices", 0, 8);
      criarBotaoHistoria("Arte sagrada", () => trainClass("healer"), "powerChoices", 0, 8);
    })
}

// =========== FUNÇÃO DAS CLASSES ===========

function trainClass(classe) {
  if (trainingDay <= 0) {
    changeScene(
      "Seu período de treinamento terminou.",
      () => criarBotaoHistoria("Continuar", finalTraining)
    );
    return;
  }

  trainingDay--;

  // aplica ganho de atributo baseado no nível atual
  classTraining(classe, 8 - trainingDay);

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
      player.skill += ganho;
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
      trainingDescription = ``;
      break;
    case 6:
      trainingDescription = ``;
      break;
    default:
      trainingDescription = ``
      break;
      }

      let story = `${trainingDescription}`;
      if(guild.warrior == 4){
        player.equippedWeapon = weapons["Espada de treino"];
        changeScene(story, () =>{
          criarBotaoHistoria("Pegar a espada", fightRudo1);
        })
      }else{
      changeScene(story, () =>{
        criarBotaoHistoria("Continuar", posTraining);
      })
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
  let story = `O combate estava acirrado e quando você ia dar o golpe final, Stevan para a luta.
  
  Você sente que venceu.`;

  forceStoryScreen();

  changeFriendship("Rudo", 5);
  changeScene(story, () =>{
    criarBotaoHistoria("Continuar", posTraining);
  })
}

function loseRudo1(){
  let story = `O combate estava acirado, mas com um movimento surpresa, Rudo ataca seu estômago e começa um ataque sobre sua cabeça, você não vai conseguir desviar...
  
  Mas antes que o ataque o atinja, Stevan para a luta. Mesmo sem um final definitivo, você sente que perdeu.`;

  forceStoryScreen();

  changeScene(story, () =>{
    criarBotaoHistoria("Continuar", posTraining);
  })
}

function mage(){
  guild.mage++;
  trainingDay--;
  let trainingDescription;
  switch (guild.mage) {
    case 1:
      trainingDescription = ``;
      break;
    case 2:
      trainingDescription = ``;
      break;
    case 3:
      trainingDescription = ``;
      break;
    case 4:
      trainingDescription = ``;
      break;
    case 5:
      trainingDescription = ``;
      break;
    case 6:
      trainingDescription = ``;
      break;
    default:
      break;
      }

      const story = `${trainingDescription}`;
      changeScene(story, () =>{
        criarBotaoHistoria("Continuar", posTraining);
      })
}

function thief(){
  guild.thief++;
  trainingDay--;
  let trainingDescription;
  switch (guild.thief) {
    case 1:
      trainingDescription = ``;
      break;
    case 2:
      trainingDescription = ``;
      break;
    case 3:
      trainingDescription = ``;
      break;
    case 4:
      trainingDescription = ``;
      break;
    case 5:
      trainingDescription = ``;
      break;
    case 6:
      trainingDescription = ``;
      break;
    default:
      break;
      }

      const story = `${trainingDescription}`;
      changeScene(story, () =>{
        criarBotaoHistoria("Continuar", posTraining);
      })
}

function cleric(){
  guild.cleric++;
  trainingDay--;
  let trainingDescription;
  switch (guild.cleric) {
    case 1:
      trainingDescription = ``;
      break;
    case 2:
      trainingDescription = ``;
      break;
    case 3:
      trainingDescription = ``;
      break;
    case 4:
      trainingDescription = ``;
      break;
    case 5:
      trainingDescription = ``;
      break;
    case 6:
      trainingDescription = ``;
      break;
    default:
      break;
      }

      const story = `${trainingDescription}`;
      changeScene(story, () =>{
        criarBotaoHistoria("Continuar", posTraining);
      })
}

function posTraining(){
  const story = `"Você se saiu bem garoto, continue vindo, estou ansioso para amanhã."
  
  Você vai andando da área de treinamento, seu corpo cansado mas ao mesmo tempo, revigorado.
  
  Passando pelo hall da guilda, Stevan lhe comprimenta, acenando como forma de dar tchau, você espelha seu gesto e segue seu caminho.`;
  changeScene(story, () =>{
    criarBotaoHistoria("Lobby da guilda (00:01)", guildHub, "powerChoices", 1);
  })
}

/* ========== COMBATE ========== */

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

  rudo: {
    name: "Rudo",
    maxHp: 120,
    hp: 120,
    attack: 15,
    defense: 13,
    powerType: "Físico",
    status: {},
    immunities: [],
    description: "O treinador da guilda."
  },

  demon: {
    name: "Demônio Abissal",
    hp: 220,
    maxHp: 220,
    attack: 20,
    defense: 30,
    powerType: "dark",
    immunities: ["fear", "blind"], // status
    damageImmunities: ["dark"],    // NÃO TOMA DANO
    resistances: {                 // toma menos dano
      fire: 0.5,    // 50% de dano
      holy: 1.5     // 50% a mais
    },

    description: "Um demônio vindo do inferno"
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
    tooltipTimeout = setTimeout(() => {
      const touch = e.touches[0];
      showSkillTooltip(skill, touch.clientX, touch.clientY);
    }, 400); // tempo de segurar
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
function startBattle(enemyName, onEndCallback) {
  if (typeof onEndCallback !== "function") {
    console.error("startBattle chamado SEM callback:", enemyName);
    return;
  }

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

function updateStatusIcons() {
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
    curse: "☠️"
  };
  const descMap = {
    burning: "Queimando — perde HP a cada turno.",
    frozen: "Congelado — ataque para causar muito dano.",
    bleeding: "Sangramento — sofre dano contínuo.",
    confused: "Confuso — chance de perder o turno.",
    blinded: "Cego — ataques têm chance de errar.",
    paralizado: "Paralizado — perde um turno.",
    curse: "Maldição — ataque e defesa reduzidos, perde vida por turno."
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
function narrateAttack(attacker, defenderName, damage, isCrit, wasDefended, attackType = "fisico", spellText = null) {

  let narration = "";

  if (attacker === "player" && isCrit) {
    switch (attackType) {
      case "weapon_skill":
        narration = `💥 ${player.name} executa ${skillName} com precisão brutal — um golpe crítico que faz ${defenderName} vacilar!`;
        applyStatus(enemy, "confused", 2);
        break;
      case "distance":
        narration = `🏹 ${player.name} acerta um disparo perfeito! O projétil atinge ${defenderName} em cheio — crítico!`;
        applyStatus(enemy, "bleeding", 3, 8);
        break;
      case "fire":
        narration = `🔥 ${player.name} desencadeia uma explosão de chamas — crítico! ${defenderName} é engolido pelo fogo.`;
        applyStatus(enemy, "burning", 3, Math.max(2, Math.round(enemy.maxHp*0.03)));
        break;
      case "ice":
        narration = `❄️ Um golpe gélido perfeito! ${player.name} congela partes do ${defenderName}, causando dano crítico.`;
        applyStatus(enemy, "frozen", 2);
        break;
      case "holy":
        narration = `✨ A fé de ${player.name} responde, o julgamento divino cai sobre ${defenderName} com força total — causando um crítico sagrado!`;
        applyStatus(enemy, "confused", 2);
        break;
      case "eletric":
        narration = `⚡ ${player.name} atinge ${defenderName} com um raio intenso — causando uma descarga neural!`;
        applyStatus(enemy, "paralizado", 1);
        break;
      case "dark":
        narration = `🌑 Um sussurro maldito antecede o impacto. As trevas se fecham sobre ${defenderName}!`;
        applyStatus(enemy, "blinded", 2);
        break;
      case "arcane":
        narration = `🌀 A magia se distorce e rasga a realidade — energia arcana explode contra ${defenderName}!`;
        break;
      default:
        narration = `💥 ${player.name} desfere um ataque devastador, um crítico que faz o ${defenderName} cambalear!`;
        applyStatus(enemy, "confused", 2);
    }
    hpShake("enemy");
  } else if (attacker === "player") {
  if (attackType === "fisico") { 
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
    narration = `${defenderName} atacou e causou ${damage} de dano em ${player.name}.`;
  }

  if (narration) log(narration);
}

function applyDamage(target, damage, type) {
  if (type !== "arcane" && target.damageImmunities?.includes(type)) {
    log(`🛡️ ${target.name} é imune a dano ${type}.`);
    return 0;
  }

  if (target.resistances?.[type]) {
    damage = Math.floor(damage * target.resistances[type]);
  }

  return Math.max(0, damage);
}

/* ===== AÇÕES DO JOGADOR ===== */
function attack() {
  if (!processStatuses(player, "player")) { if (enemy.hp > 0 && player.hp > 0) setTimeout(enemyAttack, 800); return; }
  const blindMiss = hasStatus(player, "blinded") ? 0.35 : 0;
  if (Math.random() < blindMiss) { log(`${player.name} tentou atacar, mas estava cego e errou!`); if (enemy.hp > 0) setTimeout(enemyAttack, 800); return; }

  const critChance = 0.15;
  const isCrit = Math.random() < critChance;
  let baseDamage = Math.floor(Math.random() * 8) + 8;

  if (hasStatus(player, "curse")) {
    baseDamage = Math.floor(baseDamage * 0.7); // -30% dano
  }

  let damage = isCrit ? baseDamage * 2 : baseDamage;

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
  log(`${enemy.name} foi derrotado!`);
  console.log("onEnd:", BattleManager.onEnd);
  endBattle(true);
  return;
} else {
  setTimeout(enemyAttack, 800);
}

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
        playerTurn(() => weaponSkill(skillKey));
        updateSkills();
      };

      container.appendChild(btn);
    });
  }

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


function weaponSkill(skillKey) {
  if (!processStatuses(player, "player")) {
    if (enemy.hp > 0) setTimeout(enemyAttack, 900);
    return;
  }

  const weapon = player.equippedWeapon;
  if (!weapon) {
    log("Você está desarmado.");
    return;
  }

  const skill = skills[skillKey];
  if (!skill) return;

  if (
    !weapon.skills.includes(skillKey) &&
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
    skill.type !== "fisico" &&
    skill.type !== "weapon_skill";

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
    setTimeout(enemyAttack, 900);
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
  enemy.hp = Math.max(0, enemy.hp - damage);


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
    endBattle(true);
  } else {
    setTimeout(enemyAttack, 1000);
  }
}



function defend() {
  if (!processStatuses(player, "player")) {
    if (enemy.hp > 0) setTimeout(enemyAttack, 900);
    return;
  }

  player.defending = true;
  log(`${player.name} assume uma postura defensiva.`);
  setTimeout(enemyAttack, 900);
}


function castSpellFromText() {
  const input = document.getElementById("spell-input");
  if (!input) return;

  const spellText = input.value.trim().toLowerCase().replace(/\s+/g, " ");;
  input.value = "";

  const skillKey = spellDictionary[spellText];

  if (!skillKey || !skills[skillKey]) {
    log("O encantamento falha. Nada acontece.");
    setTimeout(enemyAttack, 900);
    return;
  }

  const skill = skills[skillKey];

  if (!processStatuses(player, "player")) {
    if (enemy.hp > 0) setTimeout(enemyAttack, 900);
    return;
  }

  const cost = skill.manaCost || 0;

  // magia acima do nível do personagem
  if (cost > player.maxMana) {
    log("Esse encantamento é de um nível superior ao seu.");
    setTimeout(enemyAttack, 900);
    return;
  }

  // mana insuficiente
  if (cost > player.mana) {
    log("Mana insuficiente.");
    setTimeout(enemyAttack, 900);
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
    setTimeout(enemyAttack, 900);
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
  skill.name
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

if (enemy.hp <= 0) {
  log(`${enemy.name} foi derrotado!`);
  endBattle(true);
} else {
  setTimeout(enemyAttack, 1000);
}

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
    default:
      return `${enemyName} ataca impiedosamente!`;
  }
}

/* ========== ATAQUE DO INIMIGO ========== */
function enemyAttack() {
  if (!processStatuses(enemy, "enemy")) {
  updateBars();
  return;
}


  const blindMiss = hasStatus(enemy, "blinded") ? 0.25 : 0;
  const missChance = 0.1 + blindMiss;
  if (Math.random() < missChance) { log(`${enemy.name} errou o ataque!`); return; }

  const isCrit = Math.random() < 0.15;
  let attackPower = enemy.attack;

  if (hasStatus(enemy, "curse")) {
    attackPower = Math.floor(attackPower * 0.7); // -30% ataque
  }

  let base = Math.floor(Math.random() * attackPower) + 6;

  let damage = isCrit ? base*2 : base;

  const wasDefended = player.defending;
  if (wasDefended) { damage = Math.floor(damage/2); player.defending = false; }

  if (hasStatus(player,"frozen")) { damage *= 2; clearStatus(player,"frozen"); log(`❄️ O gelo que cobria ${player.name} se quebra com o impacto!`); applyStatus(player,"bleeding",3,8); }

  log(getEnemyAttackDescription(enemy.name));
  player.hp = Math.max(0, player.hp - damage);


if (player.hp <= 0) {
  player.hp = 0;
  updateBars();
  log(`☠️ ${player.name} foi derrotado...`);
  endBattle(false);
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
  else if (/🔥|queim|Pirocinese|fogo|ignis/i.test(msg)) p.classList.add("log-fire");
  else if (/❄️|gelo|Criogenese|frio|congel/i.test(msg)) p.classList.add("log-ice");
  else if (/🌀|Telecinese|impacto/i.test(msg)) p.classList.add("log-tele");
  else if (/⚡|paralis|eletrocinese|faísca|elétric|choque/i.test(msg)) p.classList.add("log-eletric");
  else if (/💥|crítico|critico/i.test(msg)) p.classList.add("log-crit");
  else if (/divin|sagrad|luz|julgamento|celestial/i.test(msg)) p.classList.add("log-divine");
  else if (/cura|recupera/i.test(msg)) p.classList.add("log-heal");
  else if (/absorve|rouba/i.test(msg)) p.classList.add("log-life-steal");
  else if (/🌑|sombr|dark|trevas|maldi|maldicao|amaldi|demoniac|infern/i.test(msg)) p.classList.add("log-dark");
  else if (/arcan|mana|ritual|encantamento/i.test(msg)) p.classList.add("log-arcane");
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
