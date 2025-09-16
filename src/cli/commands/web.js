const chalk = require('chalk');
const { spawn } = require('child_process');
const Logger = require('../../core/Logger');

async function webCommand(options) {
    const logger = new Logger();
    logger.printHeader('Web Arayüzü');

    try {
        const port = options.port || 3000;
        const host = options.host || 'localhost';

        // ASCII web banner
        console.log(chalk.cyan(`
    ================================================
    |                                              |
    |          WEB ARAYUZU BASLIYOR                |
    |                                              |
    ================================================
        `));

        logger.printInfo(`Web sunucu başlatılıyor...`);
        logger.printInfo(`Adres: http://${host}:${port}`);
        
        // Web server'ı başlat
        const serverProcess = spawn('node', ['src/web/server.js'], {
            stdio: 'inherit',
            env: {
                ...process.env,
                PORT: port,
                HOST: host
            }
        });

        // Process sinyalleri yakal
        process.on('SIGINT', () => {
            console.log(chalk.yellow('\n⏹️  Web sunucu durduruluyor...'));
            serverProcess.kill('SIGINT');
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            console.log(chalk.yellow('\n⏹️  Web sunucu durduruluyor...'));
            serverProcess.kill('SIGTERM');
            process.exit(0);
        });

        // Sunucu hata kontrolü
        serverProcess.on('error', (error) => {
            logger.printError('Web sunucu başlatma hatası: ' + error.message);
            process.exit(1);
        });

        serverProcess.on('exit', (code) => {
            if (code !== 0) {
                logger.printError(`Web sunucu beklenmedik şekilde kapandı (kod: ${code})`);
            } else {
                logger.printInfo('Web sunucu başarıyla kapatıldı');
            }
        });

    } catch (error) {
        logger.printError('Web komut hatası: ' + error.message);
        process.exit(1);
    }
}

module.exports = webCommand;