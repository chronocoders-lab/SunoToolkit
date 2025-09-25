const express = require('express');
const path = require('path');
const chalk = require('chalk');
const multer = require('multer');
const SunoManager = require('../core/SunoManager');
const Logger = require('../core/Logger');
const CsvReader = require('../batch/CsvReader');

const app = express();
const logger = new Logger();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Multer konfigürasyonu
const upload = multer({
    dest: './data/uploads/',
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Sadece CSV dosyaları kabul edilir!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

// SunoManager instance
let sunoManager = null;

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Sistem durumu
app.get('/api/status', async (req, res) => {
    try {
        const status = {
            server: 'running',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            nodeVersion: process.version,
            sunoInitialized: sunoManager && sunoManager.isInitialized
        };

        if (sunoManager && sunoManager.isInitialized) {
            try {
                status.remainingLimit = await sunoManager.checkLimit();
            } catch (error) {
                status.limitError = error.message;
            }
        }

        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Suno AI başlat
app.post('/api/init', async (req, res) => {
    try {
        if (!sunoManager) {
            sunoManager = new SunoManager();
        }

        if (!sunoManager.isInitialized) {
            await sunoManager.initialize();
        }

        const limit = await sunoManager.checkLimit();
        
        res.json({ 
            success: true, 
            message: 'Suno AI baslatildi',
            remainingLimit: limit
        });
        
    } catch (error) {
        logger.error('Suno AI baslatma hatasi', { error: error.message });
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Tek şarkı üretimi
app.post('/api/generate', async (req, res) => {
    try {
        if (!sunoManager || !sunoManager.isInitialized) {
            return res.status(400).json({ 
                error: 'Suno AI baslatilmamis. Once /api/init endpoint ini cagirin.' 
            });
        }

        const { prompt, gpt_description_prompt, tags, make_instrumental, title } = req.body;

        if (!prompt && !gpt_description_prompt) {
            return res.status(400).json({ 
                error: 'Prompt veya gpt_description_prompt gerekli!' 
            });
        }

        const songOptions = {
            prompt: prompt || '',
            gpt_description_prompt: gpt_description_prompt || '',
            tags: tags || 'pop',
            make_instrumental: Boolean(make_instrumental),
            title: title || ''
        };

        logger.info('Sarki uretimi baslatildi', songOptions);

        const songInfo = await sunoManager.generateSong(songOptions);

        if (songInfo && songInfo.length > 0) {
            const outputDir = './data/output/songs';
            await sunoManager.saveSongs(songInfo, outputDir);

            res.json({
                success: true,
                message: 'Sarki basariyla uretildi',
                songs: songInfo,
                outputDir
            });

            logger.success('Sarki basariyla uretildi', { count: songInfo.length });
        } else {
            res.status(500).json({
                success: false,
                error: 'Sarki uretilemedi'
            });
        }

    } catch (error) {
        logger.error('Sarki uretim hatasi', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Toplu şarkı üretimi
app.post('/api/batch-upload', upload.single('csvFile'), async (req, res) => {
    try {
        if (!sunoManager || !sunoManager.isInitialized) {
            return res.status(400).json({ 
                error: 'Suno AI baslatilmamis. Once /api/init endpoint ini cagirin.' 
            });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'CSV dosyasi yuklenmedi!' });
        }

        const csvReader = new CsvReader();
        const prompts = await csvReader.readPrompts(req.file.path);

        if (prompts.length === 0) {
            return res.status(400).json({ 
                error: 'CSV dosyasinda gecerli prompt bulunamadi!' 
            });
        }

        const delay = parseInt(req.body.delay) || 5000;
        const outputDir = './data/output/songs';

        setImmediate(async () => {
            try {
                logger.info('Toplu uretim baslatildi', { 
                    promptCount: prompts.length, 
                    delay,
                    outputDir 
                });

                const results = await sunoManager.generateBatchSongs(prompts, {
                    delay,
                    outputDir
                });

                const successful = results.filter(r => r.success).length;
                logger.success('Toplu uretim tamamlandi', {
                    total: prompts.length,
                    successful,
                    failed: prompts.length - successful
                });

            } catch (error) {
                logger.error('Toplu uretim hatasi', { error: error.message });
            }
        });

        res.json({
            success: true,
            message: `${prompts.length} sarki icin toplu uretim baslatildi`,
            promptCount: prompts.length,
            estimatedTime: Math.ceil((prompts.length * (delay + 30000)) / 60000) + ' dakika'
        });

    } catch (error) {
        logger.error('Toplu uretim baslatma hatasi', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Şarkı sözü üretimi
app.post('/api/lyrics', async (req, res) => {
    try {
        if (!sunoManager || !sunoManager.isInitialized) {
            return res.status(400).json({ 
                error: 'Suno AI baslatilmamis. Once /api/init endpoint ini cagirin.' 
            });
        }

        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt gerekli!' });
        }

        const lyrics = await sunoManager.generateLyrics(prompt);

        res.json({
            success: true,
            lyrics,
            prompt
        });

        logger.info('Sarki sozu uretildi', { prompt });

    } catch (error) {
        logger.error('Sarki sozu uretim hatasi', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Tüm şarkıları listele
app.get('/api/songs', async (req, res) => {
    try {
        if (!sunoManager || !sunoManager.isInitialized) {
            return res.status(400).json({ 
                error: 'Suno AI baslatilmamis. Once /api/init endpoint ini cagirin.' 
            });
        }

        const songs = await sunoManager.getAllSongs();

        res.json({
            success: true,
            songs,
            count: songs.length
        });

    } catch (error) {
        logger.error('Sarki listesi alma hatasi', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Metadata
app.post('/api/metadata', async (req, res) => {
    try {
        if (!sunoManager || !sunoManager.isInitialized) {
            return res.status(400).json({ 
                error: 'Suno AI baslatilmamis. Once /api/init endpoint ini cagirin.' 
            });
        }

        const { ids } = req.body;

        if (!Array.isArray(ids)) {
            return res.status(400).json({ error: 'IDs array gerekli!' });
        }

        const metadata = await sunoManager.getMetadata(ids);

        res.json({
            success: true,
            metadata,
            count: metadata.length
        });

    } catch (error) {
        logger.error('Metadata alma hatasi', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Hata yakalama middleware
app.use((error, req, res, next) => {
    logger.error('Express hata', { 
        error: error.message, 
        path: req.path,
        method: req.method 
    });

    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Dosya boyutu cok buyuk (max 5MB)' });
        }
        return res.status(400).json({ error: 'Dosya yukleme hatasi: ' + error.message });
    }

    res.status(500).json({ error: error.message });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint bulunamadi' });
});

// Sunucuyu başlat
app.listen(PORT, HOST, () => {
    console.clear();
    
    console.log(chalk.cyan(`
    ================================================
    |                                              |
    |         SUNO TOOLKIT WEB                     |
    |                                              |
    ================================================
    `));
    
    console.log(chalk.green('🚀 Web sunucu baslatildi!'));
    console.log(chalk.blue(`📍 Adres: http://${HOST}:${PORT}`));
    console.log(chalk.yellow(`📁 Static dosyalar: ${path.join(__dirname, 'public')}`));
    console.log(chalk.gray(`🕐 Baslatma zamani: ${new Date().toLocaleString()}`));
    console.log(chalk.gray(`📊 Node.js: ${process.version}`));
    console.log(chalk.gray(`💾 Bellek: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB
`));
    
    console.log(chalk.blue('📋 Kullanilabilir Endpoint ler:'));
    console.log(chalk.white('  GET  /                    - Ana sayfa'));
    console.log(chalk.white('  GET  /api/status          - Sistem durumu'));
    console.log(chalk.white('  POST /api/init            - Suno AI baslat'));
    console.log(chalk.white('  POST /api/generate        - Tek sarki uret'));
    console.log(chalk.white('  POST /api/batch-upload    - Toplu uretim (CSV)'));
    console.log(chalk.white('  POST /api/lyrics          - Sarki sozu uret'));
    console.log(chalk.white('  GET  /api/songs           - Tum sarkilari listele'));
    console.log(chalk.white('  POST /api/metadata        - Metadata al'));
    
    console.log(chalk.yellow('\n💡 Durdurmak icin: Ctrl+C'));
    console.log(chalk.gray('=' + '='.repeat(50)));
    
    logger.success('Web sunucu basariyla baslatildi', { 
        host: HOST, 
        port: PORT,
        env: process.env.NODE_ENV || 'development'
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n⏹️  Web sunucu kapatiliyor...'));
    logger.info('Web sunucu kapatiliyor');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(chalk.yellow('\n⏹️  Web sunucu kapatiliyor...'));
    logger.info('Web sunucu kapatiliyor (SIGTERM)');
    process.exit(0);
});