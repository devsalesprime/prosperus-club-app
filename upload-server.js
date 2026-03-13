// ============================================
// PROSPERUS CLUB — FILE UPLOAD SERVER (Node.js)
// ============================================
// Standalone upload server — runs via PM2
// Auth: Supabase JWT validation
// Storage: /var/www/pdf/uploads/{year}/{month}/{filename}
//
// Install & Run:
//   cd /var/www/prosperus-club-app
//   npm install express multer cors
//   pm2 start upload-server.js --name prosperus-upload
//
// Nginx: proxy /api/upload → http://127.0.0.1:3010

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = 3010;

// --- CONFIG ---
const SUPABASE_URL = 'https://ptvsctwwonvirdwprugv.supabase.co';
const UPLOAD_BASE_DIR = '/var/www/pdf/uploads';
const PUBLIC_BASE_URL = 'https://prosperusclub.com.br/pdf/uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
};

// --- CORS ---
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://prosperusclub.com.br',
        'https://www.prosperusclub.com.br',
    ],
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// --- MULTER (temp storage) ---
const upload = multer({
    dest: '/tmp/prosperus-uploads',
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_TYPES[file.mimetype]) {
            cb(null, true);
        } else {
            cb(new Error(`Tipo não permitido: ${file.mimetype}. Aceitos: JPG, PNG, WebP, GIF, PDF.`));
        }
    },
});

// --- AUTH MIDDLEWARE ---
async function validateSupabaseToken(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);

    if (!match) {
        return res.status(401).json({ success: false, error: 'Token de autenticação ausente' });
    }

    const token = match[1];

    try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': token,
            },
        });

        if (response.status !== 200) {
            return res.status(401).json({ success: false, error: 'Token inválido ou expirado' });
        }

        const user = await response.json();
        if (!user.id) {
            return res.status(401).json({ success: false, error: 'Usuário não identificado' });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Auth error:', err.message);
        return res.status(401).json({ success: false, error: 'Erro na validação do token' });
    }
}

// --- UPLOAD ROUTE ---
app.post('/api/upload', validateSupabaseToken, (req, res) => {
    upload.single('file')(req, res, async (err) => {
        // Multer error handling
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, error: 'Arquivo excede 10MB' });
            }
            return res.status(400).json({ success: false, error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' });
        }

        const file = req.file;
        const extension = ALLOWED_TYPES[file.mimetype];

        if (!extension) {
            // Clean up temp file
            fs.unlinkSync(file.path);
            return res.status(400).json({ success: false, error: `Tipo não permitido: ${file.mimetype}` });
        }

        // Build target path
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const targetDir = path.join(UPLOAD_BASE_DIR, year, month);

        // Create directory
        try {
            fs.mkdirSync(targetDir, { recursive: true });
        } catch (mkdirErr) {
            console.error('mkdir error:', mkdirErr);
            fs.unlinkSync(file.path);
            return res.status(500).json({ success: false, error: 'Erro ao criar diretório de upload' });
        }

        // Generate unique filename
        const uniqueName = crypto.randomBytes(12).toString('hex') + '.' + extension;
        const targetPath = path.join(targetDir, uniqueName);

        // Move file from temp to final location
        try {
            fs.renameSync(file.path, targetPath);
        } catch (moveErr) {
            // renameSync fails across devices, fallback to copy
            try {
                fs.copyFileSync(file.path, targetPath);
                fs.unlinkSync(file.path);
            } catch (copyErr) {
                console.error('File move error:', copyErr);
                return res.status(500).json({ success: false, error: 'Erro ao salvar arquivo' });
            }
        }

        // Build public URL
        const publicUrl = `${PUBLIC_BASE_URL}/${year}/${month}/${uniqueName}`;

        res.json({
            success: true,
            url: publicUrl,
            filename: uniqueName,
            original: file.originalname,
            size: file.size,
            mime: file.mimetype,
            extension: extension,
        });
    });
});

// --- HEALTH CHECK ---
app.get('/api/upload', (_req, res) => {
    res.json({ status: 'ok', service: 'prosperus-upload' });
});

// --- START ---
app.listen(PORT, '127.0.0.1', () => {
    console.log(`📤 Upload server running on http://127.0.0.1:${PORT}`);

    // Ensure upload dirs exist
    try {
        fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
        console.log(`📁 Upload dir: ${UPLOAD_BASE_DIR}`);
    } catch (e) {
        console.error('⚠️  Could not create upload dir:', e.message);
    }

    // Ensure temp dir exists
    try {
        fs.mkdirSync('/tmp/prosperus-uploads', { recursive: true });
    } catch (e) { /* ignore */ }
});
