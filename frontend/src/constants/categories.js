export const CATEGORIES = ['Laptops', 'Smartphones', 'Accessories', 'Mobiles'];

export const formatCategory = (category = '') => {
  const match = CATEGORIES.find((item) => item.toLowerCase() === String(category).toLowerCase());
  return match || String(category).replace(/\b\w/g, (letter) => letter.toUpperCase());
};
