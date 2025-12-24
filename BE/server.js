const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const passport = require('passport');

dotenv.config();

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const customersRoutes = require('./routes/customers');
const productsRoutes = require('./routes/products');
const productTypesRoutes = require('./routes/producttypes');
const brandsRoutes = require('./routes/brands');
const ordersRoutes = require('./routes/orders');
const inventoryRoutes = require('./routes/inventory');
const { authenticate, requireRole } = require('./middleware/auth');
const emailService = require('./services/emailService');

require('./services/passport')();

// Load environment variables
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
// Serve static files from FE folder (sibling of BE folder)
app.use(express.static(path.join(__dirname, '../FE')));

// Initialize passport
app.use(passport.initialize());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/login';

// Verify email service at startup
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    emailService.verifyConnection().then(success => {
        if (success) {
            console.log('✅ Email Service Ready - will send from', process.env.EMAIL_USER);
        }
    }).catch(err => {
        console.error('❌ Email Service Error:', err.message);
    });
}

// Connect to MongoDB
async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Backend is running',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/producttypes', productTypesRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/inventory', inventoryRoutes);

// Serve admin UI (client-side verification protects access to /api/users)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../FE', 'admin.html'));
});

// Serve home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../FE', 'index.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Connect to MongoDB and start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
});
