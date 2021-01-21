import fetch from 'node-fetch';


const innistradDate = '2011-09-30';
const zendikarDate = '2020-09-25';

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
        release_dt: set.released_at
      }))
    );
}

async function _listExpansionSets() {
  const sets = await listSets();
  return sets.filter((set) => set.type == 'expansion' || set.type == 'core');
}

async function _getSet(setCode) {
  return fetch(`https://api.scryfall.com/sets/${setCode}`)
  .then((res) => res.json())
  .then((set) => ({
    name: set.name,
    type: set.set_type,
    code: set.code,
    cards_uri: set.search_uri,
    release_dt: set.released_at
  }));
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
  return fetch(`https://api.scryfall.com/cards/search?order=set&q=e%3A${setCode}&unique=cards`)
  .then((res) => res.json())
  .then((res) => _getAllCards(res))
  .then((cards) =>
    cards.map((card) => ({
      name: card.name,
      rarity: card.rarity,
      price: Number(card.prices.eur)
    }))
  );
}

function _getAvgMythicValue(cards) {
  return cards.filter((card) => card.rarity == 'mythic')
    .map((card) => card.price)
    .avg();
}

function _getAvgRareValue(cards) {
  return cards.filter((card) => card.rarity == 'rare')
    .map((card) => card.price)
    .avg();
}

function _getAvgUncommonValue(cards) {
  return cards.filter((card) => card.rarity == 'uncommon')
    .map((card) => card.price)
    .avg();
}

function _getAvgCommonValue(cards) {
  return cards.filter((card) => card.rarity == 'common')
    .map((card) => card.price)
    .avg();
}

function _initMythicVal(cards) {
  let select = document.querySelector('#avg-mythic-val');
  select.innerHTML = _getAvgMythicValue(cards).toFixed(2) + ' €';
}

function _initRareVal(cards) {
  let select = document.querySelector('#avg-rare-val');
  select.innerHTML = _getAvgRareValue(cards).toFixed(2) + ' €';
}

function _initUncommonVal(cards) {
  let select = document.querySelector('#avg-uncommon-val');
  select.innerHTML = _getAvgUncommonValue(cards).toFixed(2) + ' €';
}

function _initCommonVal(cards) {
  let select = document.querySelector('#avg-common-val');
  select.innerHTML = _getAvgCommonValue(cards).toFixed(2) + ' €';
}

function _avgBoosterValue(cards, setDate) {
  const SetDate = new Date(setDate)
  if (SetDate < new Date(innistradDate)) return -1;
  let expMythicVal = 0;
  let expRareVal = 0;
  if (SetDate >= new Date(zendikarDate)) {
    expMythicVal = _getAvgMythicValue(cards) * (1 / 7.4);
    expRareVal = _getAvgRareValue(cards) * (6.4 / 7.4);
  }
  else {
    expMythicVal = _getAvgMythicValue(cards) * (1 / 8);
    expRareVal = _getAvgRareValue(cards) * (7 / 8);
  }
  const expUncommonVal = _getAvgUncommonValue(cards) * 3;
  const expCommonVal = _getAvgCommonValue(cards) * 10;
  return expMythicVal + expRareVal + expUncommonVal + expCommonVal;
}

function _initBoosterValue(cards, setDate) {
  let select = document.querySelector('#avg-booster-val');
  const avgBoosterValue = _avgBoosterValue(cards, setDate);
  if (avgBoosterValue == -1) {
    select.innerHTML = "Expected value is not available fot this set.";
  }
  else {
    select.innerHTML = _avgBoosterValue(cards, setDate).toFixed(2) + ' €';
  }
}

function _initFetchingWarning() {
  document.querySelector('#fetching').innerHTML = 'Fetching data...';
}

function _removeFetchingWarning() {
  document.querySelector('#fetching').innerHTML = '';
}

async function _initValues(setCode) {
  _initFetchingWarning();
  // TODO: replace this with PromiseAll()
  const set = await _getSet(setCode);
  const cards = await getSetUniqueCards(setCode);
  _initBoosterValue(cards, set.release_dt);
  _initMythicVal(cards);
  _initRareVal(cards);
  _initUncommonVal(cards);
  _initCommonVal(cards);
  _removeFetchingWarning();
}

async function addChangeEventToSelectSet(selector) {
  let select = document.querySelector(selector);
  select.addEventListener('change', async () => {
    await _initValues(select.value);
  });
}

export default {
  listSets,
  initSetSelect,
  getSetUniqueCards,
  addChangeEventToSelectSet
};
