const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const assetBase = import.meta.env.VITE_ASSET_BASE_URL || apiBase.replace(/\/api\/?$/, '');

export const productImageUrl = (productId) => `${assetBase}/product-images/${productId}.png`;
