require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./config/connection');
const collections = require('./config/collections');
const logger = require('./utils/logger');

const seedProducts = async () => {
  try {
    const dummyProductsPath = path.join(__dirname, '../frontend/src/constants/dummyProducts.js');
    let content = fs.readFileSync(dummyProductsPath, 'utf8');
    
    // Remove "export const DUMMY_PRODUCTS = " and any trailing semicolons
    content = content.replace(/export\s+const\s+DUMMY_PRODUCTS\s*=\s*/, '').replace(/;\s*$/, '');
    
    // Evaluate the array
    let dummyProducts;
    try {
      // Evaluate the array literal
      dummyProducts = eval('(' + content + ')');
    } catch (e) {
      logger.error('Failed to parse dummyProducts.js', e);
      process.exit(1);
    }
    
    await new Promise((resolve, reject) => {
      db.connect((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    
    const productCollection = db.get().collection(collections.PRODUCT_COLLECTION);
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const product of dummyProducts) {
      // Check if product exists by name
      const exists = await productCollection.findOne({ name: product.name });
      
      if (!exists) {
        // Remove the dummy _id so MongoDB generates a valid ObjectId
        delete product._id;
        
        // Add created/updated timestamps
        product.createdAt = new Date();
        product.updatedAt = new Date();
        
        await productCollection.insertOne(product);
        addedCount++;
        logger.info(`Inserted product: ${product.name}`);
      } else {
        skippedCount++;
        logger.info(`Skipped existing product: ${product.name}`);
      }
    }
    
    logger.info(`Seed complete! Added: ${addedCount}, Skipped: ${skippedCount}`);
    
    await db.close();
    process.exit(0);
  } catch (err) {
    logger.error('Seed error:', err);
    process.exit(1);
  }
};

seedProducts();
