const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const assetBase = import.meta.env.VITE_ASSET_BASE_URL || apiBase.replace(/\/api\/?$/, '');

export const productImageUrl = (productId) => `${assetBase}/product-images/${productId}.png`;

/**
 * Central product image resolver.
 * Matches product name/category keywords to curated electronics images before
 * trusting uploaded assets, preventing stale/wrong backend images from leaking
 * into the storefront.
 */
const IMAGE_MAP = {
  // Smartphones / Phones
  'iphone': 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?q=80&w=600&auto=format&fit=crop',
  'galaxy': 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=600&auto=format&fit=crop',
  'pixel': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600&auto=format&fit=crop',
  'samsung': 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=600&auto=format&fit=crop',
  'oneplus': 'https://images.unsplash.com/photo-1565849906660-4469279f5592?q=80&w=600&auto=format&fit=crop',
  'nothing': 'https://images.unsplash.com/photo-1565849906660-4469279f5592?q=80&w=600&auto=format&fit=crop',
  'redmi': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600&auto=format&fit=crop',
  'xiaomi': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600&auto=format&fit=crop',
  'realme': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600&auto=format&fit=crop',
  'vivo': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600&auto=format&fit=crop',
  'oppo': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600&auto=format&fit=crop',
  'm07': 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=600&auto=format&fit=crop',
  'm15': 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=600&auto=format&fit=crop',
  'flip': 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?q=80&w=600&auto=format&fit=crop',
  'fold': 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=600&auto=format&fit=crop',

  // Laptops
  'macbook': 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=600&auto=format&fit=crop',
  'dell': 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=600&auto=format&fit=crop',
  'xps': 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=600&auto=format&fit=crop',
  'thinkpad': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600&auto=format&fit=crop',
  'asus': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600&auto=format&fit=crop',
  'zephyrus': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600&auto=format&fit=crop',
  'hp': 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=600&auto=format&fit=crop',
  'lenovo': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600&auto=format&fit=crop',
  'acer': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600&auto=format&fit=crop',

  // Accessories
  'headphone': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop',
  'headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop',
  'sony wh': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop',
  'airpods': 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=600&auto=format&fit=crop',
  'watch': 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=600&auto=format&fit=crop',
  'keyboard': 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=600&auto=format&fit=crop',
  'mouse': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=600&auto=format&fit=crop',
  'charger': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=600&auto=format&fit=crop',
  'case': 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?q=80&w=600&auto=format&fit=crop',
  'earbuds': 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=600&auto=format&fit=crop',
  'speaker': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=600&auto=format&fit=crop',
  'cable': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=600&auto=format&fit=crop',
};

const CATEGORY_FALLBACK = {
  'smartphones': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600&auto=format&fit=crop',
  'mobiles': 'https://images.unsplash.com/photo-1565849906660-4469279f5592?q=80&w=600&auto=format&fit=crop',
  'laptops': 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=600&auto=format&fit=crop',
  'accessories': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop';
const PHONE_CATEGORIES = new Set(['smartphones', 'mobiles', 'phones', 'mobile phones']);
const PREFERRED_UPLOAD_CATEGORIES = new Set(['admin', 'custom']);

/**
 * Resolves the correct product image based on product name and category keywords.
 * Falls back to backend-uploaded image if no keyword match, then to category fallback.
 */
export const getProductImage = (product) => {
  if (!product) return DEFAULT_IMAGE;

  const name = (product.name || '').toLowerCase();
  const cat = (product.category || '').toLowerCase();

  // Check name keywords against IMAGE_MAP (longest matches first)
  const keywordMatches = Object.entries(IMAGE_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [keyword, url] of keywordMatches) {
    if (name.includes(keyword)) {
      return url;
    }
  }

  if (product.image && !PHONE_CATEGORIES.has(cat)) return product.image;

  // Fall back to category
  if (CATEGORY_FALLBACK[cat]) return CATEGORY_FALLBACK[cat];

  if (product.image || PREFERRED_UPLOAD_CATEGORIES.has(cat)) return product.image || productImageUrl(product._id);

  return DEFAULT_IMAGE;
};
