// Fixed shop metadata – IDs match the seed data.
// Colors: Arcos = Yellow, THB = Pink, Plaza = Grey
export const SHOP_META = [
  {
    id:      '00000000-0000-0000-0000-000000000001',
    name:    'Arcos',
    primary: '#C17F00',
    dark:    '#8C5A00',
    light:   '#FFFBEB',
    border:  '#F5C842',
    text:    '#7A5000',
  },
  {
    id:      '00000000-0000-0000-0000-000000000002',
    name:    'THB',
    primary: '#C2185B',
    dark:    '#880E4F',
    light:   '#FCE4EC',
    border:  '#F06292',
    text:    '#880E4F',
  },
  {
    id:      '00000000-0000-0000-0000-000000000003',
    name:    'Plaza',
    primary: '#546E7A',
    dark:    '#37474F',
    light:   '#ECEFF1',
    border:  '#90A4AE',
    text:    '#37474F',
  },
];

export function getShopMeta(shopName) {
  return SHOP_META.find(s => s.name === shopName) ?? null;
}

export function getShopMetaById(id) {
  return SHOP_META.find(s => s.id === id) ?? null;
}
