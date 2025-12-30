const Product = require('../models/Product');

class ProductService {
    async listProducts() {
        try {
            return await Product.find().sort({ createdAt: -1 });
        } catch (error) {
            throw new Error(`Error listing products: ${error.message}`);
        }
    }

    async getProductById(id) {
        try {
            const product = await Product.findById(id);
            if (!product) {
                throw new Error('Product not found');
            }
            return product;
        } catch (error) {
            throw new Error(`Error getting product: ${error.message}`);
        }
    }

    async createProduct(productData) {
        try {
            const { name, description, price, stock, productType, brand } = productData;

            if (!name || price === undefined) {
                throw new Error('Name and price are required');
            }

            const newProduct = new Product({
                name,
                description,
                price,
                stock: stock || 0,
                productType,
                brand
            });

            await newProduct.save();
            return newProduct;
        } catch (error) {
            throw new Error(`Error creating product: ${error.message}`);
        }
    }

    // Bulk create products
    async createProducts(productsArray) {
        try {
            if (!Array.isArray(productsArray) || productsArray.length === 0) {
                throw new Error('Provide an array of products to create');
            }

            // Basic validation: each item must have name and price
            const toInsert = productsArray.map((p, idx) => {
                if (!p.name || p.price === undefined) {
                    throw new Error(`Product at index ${idx} missing required fields (name, price)`);
                }
                return {
                    name: p.name,
                    description: p.description || '',
                    price: p.price,
                    stock: p.stock || 0,
                    productType: p.productType || null,
                    brand: p.brand || null
                };
            });

            const created = await Product.insertMany(toInsert, { ordered: true });
            return created;
        } catch (error) {
            throw new Error(`Error bulk creating products: ${error.message}`);
        }
    }

    async updateProduct(id, updateData) {
        try {
            const product = await Product.findById(id);
            if (!product) {
                throw new Error('Product not found');
            }

            const { name, description, price, stock, productType, brand } = updateData;
            product.name = name || product.name;
            product.description = description !== undefined ? description : product.description;
            product.price = price !== undefined ? price : product.price;
            product.stock = stock !== undefined ? stock : product.stock;
            product.productType = productType !== undefined ? productType : product.productType;
            product.brand = brand !== undefined ? brand : product.brand;

            await product.save();
            return product;
        } catch (error) {
            throw new Error(`Error updating product: ${error.message}`);
        }
    }

    async deleteProduct(id) {
        try {
            const product = await Product.findByIdAndDelete(id);
            if (!product) {
                throw new Error('Product not found');
            }
            return product;
        } catch (error) {
            throw new Error(`Error deleting product: ${error.message}`);
        }
    }
}

module.exports = new ProductService();
