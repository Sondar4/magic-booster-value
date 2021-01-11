import fetch from 'node-fetch';


Array.prototype.avg = function() {
  if (this.length == 0) return 0;
  const sum = this.reduce((a, b) => a + b, 0);
  return sum / this.length;
}

export async function listSets() {
  return fetch('https://api.scryfall.com/sets/')
    .then((res) => res.json())
    .then((res) => res.data)
    .then((sets) =>
      sets.map((set) => ({
        name: set.name,
        type: set.set_type,
        code: set.code,
        cards_uri: set.search_uri,
      }))
    );
}

async function _listExpansionSets() {
  const sets = await listSets();
  return sets.filter((set) => set.type == 'expansion')
}

export async function initSetSelect(selector) {
  let select = document.querySelector(selector);
  const expansions = await _listExpansionSets();
  let genCode = '<option value="">Select a set</option>\n';
  for (let set of expansions) {
    genCode += `<option value="${set.code}">${set.name}</option>\n`
  }
  select.innerHTML = genCode;
}

async function _getAllCards(res) {
  if (res.has_more) {
    const nextRes = await fetch(res.next_page).then((res) => res.json());
    const nextCards = await _getAllCards(nextRes);
    return res.data.concat(nextCards);
  }
  else {
    return res.data;
  }
}

export async function getSetUniqueCards(setCode) {
  return fetch(`https://api.scryfall.com/cards/search?order=set&q=e%3A${setCode}&unique=prints`)
  .then((res) => res.json())
  .then((res) => _getAllCards(res))
  .then((cards) =>
    cards.map((card) => ({
      name: card.name,
      rarity: card.rarity,
      price: card.prices.eur
    }))
  );
}

async function _getAvgMythicValue(setCode) {
  const cards = await getSetUniqueCards(setCode);
  return cards.filter((card) => card.rarity == 'mythic').avg();
}

async function _getAvgRareValue(setCode) {
  const cards = await getSetUniqueCards(setCode);
  return cards.filter((card) => card.rarity == 'rare').avg();
}

async function _getAvgUncommonValue(setCode) {
  const cards = await getSetUniqueCards(setCode);
  return cards.filter((card) => card.rarity == 'uncommon').avg();
}

async function _getAvgCommonValue(setCode) {
  const cards = await getSetUniqueCards(setCode);
  return cards.filter((card) => card.rarity == 'common').avg();
}

export default {
  listSets,
  initSetSelect,
  getSetUniqueCards
};
