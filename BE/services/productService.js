const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');

class ProductService {
    async getListProducts(filters = {}) {
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

            // Build MongoDB checkStatus
            let checkStatus = { isActive: true };

            // Search by name or description
            if (search) {
                checkStatus.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            // Filter by productType
            if (productType) {
                checkStatus.productType = productType;
            }

            // Filter by brand
            if (brand) {
                checkStatus.brand = brand;
            }

            // Validate and build sort object
            const validSortOptions = ['name', 'price', 'stock', 'createdAt'];
            const safeSortField = validSortOptions.includes(sortField) ? sortField : 'createdAt';
            const safeSortOrder = [-1, 1].includes(Number(sortOrder)) ? Number(sortOrder) : -1;
            const sortObj = { [safeSortField]: safeSortOrder };

            // Pagination
            const pageNum = Math.max(1, parseInt(page) || 1);
            const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10)); // max 100 per page
            const skip = (pageNum - 1) * limitNum;

            // Execute checkStatus
            const products = await Product.find(checkStatus)
                .sort(sortObj)
                .skip(skip)
                .limit(limitNum);

            // For each product, load variants and calculate total stock
            for (const product of products) {
                const variants = await ProductVariant.find({ product: product._id, isActive: true });
                product.variants = variants;
                // Now totalStock virtual field will be calculated
            }

            // Apply stock status filter AFTER loading variants (since stock is now virtual)
            let filteredStock = products;
            if (stockStatus) {
                filteredStock = products.filter(p => {
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
            const total = await Product.countDocuments(checkStatus);

            return {
                products: filteredStock,
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
            if (!product.isActive) {
                throw new Error('Product not found');
            }
            // Load active variants for this product
            const variants = await ProductVariant.find({ product: product._id, isActive: true });
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
                stock: 0,
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

    async toggleProductStatus(id, isActive) {
        try {
            const product = await Product.findById(id);
            if (!product) throw new Error('Product not found');

            // Toggle the status field between Active and Inactive
            product.status = product.status === 'Active' ? 'Inactive' : 'Active';
            await product.save();

            return product;
        } catch (error) {
            throw new Error(`Error toggling product status: ${error.message}`);
        }
    }

    async deleteProduct(id) {
        try {
            const product = await Product.findById(id);
            if (!product) throw new Error('Product not found');

            // Soft delete: mark product as inactive
            product.isActive = false;
            await product.save();

            // Mark all variants of this product as inactive
            await ProductVariant.updateMany(
                { product: product._id },
                { isActive: false }
            );

            return product;
        } catch (error) {
            throw new Error(`Error deleting product: ${error.message}`);
        }
    }
}

module.exports = new ProductService();
