const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');

class ProductService {
    async listProducts(filters = {}) {
        try {
            const {
                search = '',
                productType = '',
                brand = '',
                stockStatus = '',
                sortField = 'createdAt',
                sortOrder = -1,
                page = 1,
                limit = 10
            } = filters;

            // Build MongoDB query
            let query = {};

            // Search by name or description
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            // Filter by productType
            if (productType) {
                query.productType = productType;
            }

            // Filter by brand
            if (brand) {
                query.brand = brand;
            }

            // Validate and build sort object
            const validSortFields = ['name', 'price', 'stock', 'createdAt'];
            const safeSortField = validSortFields.includes(sortField) ? sortField : 'createdAt';
            const safeSortOrder = [-1, 1].includes(Number(sortOrder)) ? Number(sortOrder) : -1;
            const sortObj = { [safeSortField]: safeSortOrder };

            // Pagination
            const pageNum = Math.max(1, parseInt(page) || 1);
            const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10)); // max 100 per page
            const skip = (pageNum - 1) * limitNum;

            // Execute query
            const products = await Product.find(query)
                .sort(sortObj)
                .skip(skip)
                .limit(limitNum);

            // For each product, load variants and calculate total stock
            for (const product of products) {
                const variants = await ProductVariant.find({ product: product._id });
                product.variants = variants;
                // Now totalStock virtual field will be calculated
            }

            // Apply stock status filter AFTER loading variants (since stock is now virtual)
            let filtered = products;
            if (stockStatus) {
                filtered = products.filter(p => {
                    const stock = p.totalStock || 0;
                    if (stockStatus.toLowerCase() === 'out of stock') {
                        return stock === 0;
                    } else if (stockStatus.toLowerCase() === 'low stock') {
                        return stock > 0 && stock <= 10;
                    } else if (stockStatus.toLowerCase() === 'in stock') {
                        return stock > 10;
                    }
                    return true;
                });
            }

            // Get total count for pagination metadata
            const total = await Product.countDocuments(query);

            return {
                products: filtered,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            };
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
            // Load variants for this product
            const variants = await ProductVariant.find({ product: product._id });
            product.variants = variants;
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

            // If ProductVariant model exists and stock provided, create a default variant
            try {
                if (typeof ProductVariant !== 'undefined' && newProduct.stock > 0) {
                    await ProductVariant.create({
                        product: newProduct._id,
                        price: newProduct.price,
                        stock: newProduct.stock
                    });
                    // keep product.stock for backward compatibility
                }
            } catch (e) {
                // non-fatal: variant creation failed
                console.warn('Variant creation skipped:', e.message);
            }

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

            // If product stock changed and variants exist, you may want to sync.
            // For now, do not auto-adjust variants to avoid unexpected changes.
            return product;
        } catch (error) {
            throw new Error(`Error updating product: ${error.message}`);
        }
    }

    async deleteProduct(id) {
        try {
            const product = await Product.findById(id);
            if (!product) throw new Error('Product not found');

            // Prevent deletion if variants exist
            const variants = await ProductVariant.find({ product: product._id });
            if (variants.length > 0) {
                throw new Error('Cannot delete product: variants exist. Remove variants first.');
            }

            await Product.findByIdAndDelete(id);
            return product;
        } catch (error) {
            throw new Error(`Error deleting product: ${error.message}`);
        }
    }
}

module.exports = new ProductService();
