const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const os = require('os');

// Import controllers and middleware
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// ═══════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════

// Security: Apply Helmet (security headers)
app.use(helmet());

// Parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ═══════════════════════════════════════════════════════════
// CORS CONFIGURATION (Allow Network Access)
// ═══════════════════════════════════════════════════════════
const corsOptions = {
    origin: function (origin, callback) {
        // Allow localhost and network access
        const allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            /^http:\/\/192\.168\..*:3000$/,  // Any 192.168.x.x:3000
            /^http:\/\/10\..*:3000$/,        // Any 10.x.x.x:3000
            /^http:\/\/172\..*:3000$/        // Any 172.x.x.x:3000
        ];
        
        console.log('CORS request from:', origin);
        
        if (!origin) {
            return callback(null, true);
        }

        // Check if origin is allowed
        const isAllowed = allowedOrigins.some(allowedOrigin => {
            if (allowedOrigin instanceof RegExp) {
                return allowedOrigin.test(origin);
            }
            return origin === allowedOrigin;
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            console.log('CORS blocked:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ═══════════════════════════════════════════════════════════
// SECURITY HEADERS
// ═══════════════════════════════════════════════════════════
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});

// ═══════════════════════════════════════════════════════════
// REQUEST LOGGING
// ═══════════════════════════════════════════════════════════
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ═══════════════════════════════════════════════════════════
// HEALTH CHECK ENDPOINT
// ═══════════════════════════════════════════════════════════
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'CodeDash API is running',
        timestamp: new Date()
    });
});

// ═══════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

// ═══════════════════════════════════════════════════════════
// 404 HANDLER
// ═══════════════════════════════════════════════════════════
app.use((req, res) => {
    res.status(404).json({ 
        message: 'Endpoint not found',
        path: req.path,
        method: req.method
    });
});

// ═══════════════════════════════════════════════════════════
// ERROR HANDLER
// ═══════════════════════════════════════════════════════════
app.use((err, req, res, next) => {
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        timestamp: new Date()
    });
    
    res.status(err.statusCode || 500).json({ 
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ═══════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n');
    console.log('╔═════════════════════════════════════════════════════════╗');
    console.log('║               🚀 CodeDash Backend Server Started 🚀               ║');
    console.log('╚═════════════════════════════════════════════════════════╝');
    console.log('\n');
    console.log(`📡 Listening on all network interfaces on port ${PORT}`);
    console.log('\n');
    console.log('✅ Access from this computer:');
    console.log(`   👉 http://localhost:${PORT}`);
    console.log(`   👉 http://127.0.0.1:${PORT}`);
    console.log('\n');
    
    console.log('✅ Access from network devices:');
    // Get all network interfaces
    const interfaces = os.networkInterfaces();
    for (const [name, addrs] of Object.entries(interfaces)) {
        addrs.forEach(addr => {
            if (addr.family === 'IPv4' && !addr.internal) {
                console.log(`   👉 http://${addr.address}:${PORT}`);
            }
        });
    }
    console.log('\n');
    
    console.log('📊 Database Location:');
    console.log(`   👉 ${path.join(__dirname, 'database.json')}`);
    console.log('\n');
    
    console.log('🔐 CORS Enabled for:');
    console.log('   👉 localhost:3000');
    console.log('   👉 All 192.168.x.x:3000');
    console.log('   👉 All 10.x.x.x:3000');
    console.log('   👉 All 172.x.x.x:3000');
    console.log('\n');
    
    console.log('Press Ctrl+C to stop the server');
    console.log('\n');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n🛑 Server shutting down...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Server shutting down...');
    process.exit(0);
});