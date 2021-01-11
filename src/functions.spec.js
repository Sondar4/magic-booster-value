import functions, { getSetUniqueCards } from './functions.js';


describe('Magic: Booster Value ', () =>{
  // listSets tests
  test(' the function "listSets" returns an object', async () => {
    const sets = await functions.listSets();
    expect(typeof sets).toEqual('object');
  });
  test(' the function "listSets" returns a list with 656 items', async () => {
    const sets = await functions.listSets();
    expect(sets.length).toEqual(656);
  });
  test(' the first element of the list returned y "listSets" has the '
       + 'following attributes: name, type and cards_uri', async() => {
    const attributes = ['name', 'type', 'code', 'cards_uri'] ;
    const sets = await functions.listSets();
    expect(attributes.every((a) => a in sets[0])).toBe(true);
  });
  // getSetUniqueCards
  test(' the first card returned by "getSetUniqueCards" with value "znr"'
       + 'is "Allied Assault"', async () => {
    const cards = await getSetUniqueCards('znr');
    expect(cards[0].name).toEqual('Allied Assault');
  }, 10000);
  test(' the number of cards returned by "getSetUniqueCards" with '
       + ' value "znr" is 391', async () => {
      const cards = await getSetUniqueCards('znr');
      expect(cards.length).toEqual(391);
  }, 10000);
});
