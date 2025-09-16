const chalk = require('chalk');
const inquirer = require('inquirer');
const fs = require('fs').promises;
const SunoManager = require('../../core/SunoManager');
const Logger = require('../../core/Logger');
const CsvReader = require('../../batch/CsvReader');

async function batchCommand(options) {
    const logger = new Logger();
    logger.printHeader('Toplu Şarkı Üretimi');

    try {
        // CSV dosya yolu
        let csvFile = options.file;

        if (!csvFile) {
            const answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'csvFile',
                    message: 'CSV dosya yolunu girin:',
                    default: './data/templates/prompts.csv',
                    validate: async (input) => {
                        try {
                            await fs.access(input);
                            return true;
                        } catch {
                            return 'Dosya bulunamadı!';
                        }
                    }
                },
                {
                    type: 'number',
                    name: 'delay',
                    message: 'İstekler arası bekleme süresi (ms):',
                    default: parseInt(options.delay) || 5000,
                    validate: (input) => input >= 1000 || 'En az 1000ms olmalı!'
                },
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: 'Toplu üretimi başlatmak istediğinizden emin misiniz?',
                    default: false
                }
            ]);

            if (!answers.confirm) {
                logger.printWarning('İşlem iptal edildi');
                return;
            }

            csvFile = answers.csvFile;
            options.delay = answers.delay.toString();
        }

        // ASCII art göster
        console.log(chalk.magenta(`
    ================================================
    |                                              |
    |        TOPLU URETIM BASLIYOR                 |
    |                                              |
    ================================================
        `));

        // CSV okuyucu oluştur
        const csvReader = new CsvReader();
        logger.printInfo(`CSV dosyası okunuyor: ${csvFile}`);
        
        const prompts = await csvReader.readPrompts(csvFile);
        
        if (prompts.length === 0) {
            logger.printError('CSV dosyasında geçerli prompt bulunamadı');
            return;
        }

        logger.printSuccess(`${prompts.length} prompt bulundu`);

        // Örnek promptları göster
        console.log(chalk.blue('\n📋 Örnek Promptlar:'));
        console.log(chalk.gray('-'.repeat(50)));
        prompts.slice(0, 3).forEach((prompt, index) => {
            console.log(chalk.white(`${index + 1}. ${prompt.prompt || prompt.gpt_description_prompt}`));
            if (prompt.tags) console.log(chalk.gray(`   Tür: ${prompt.tags}`));
        });
        
        if (prompts.length > 3) {
            console.log(chalk.gray(`   ... ve ${prompts.length - 3} tane daha\n`));
        }

        // Son onay
        const finalConfirm = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'proceed',
                message: `${prompts.length} şarkı üretilecek. Devam edilsin mi?`,
                default: false
            }
        ]);

        if (!finalConfirm.proceed) {
            logger.printWarning('İşlem iptal edildi');
            return;
        }

        // SunoManager başlat
        const sunoManager = new SunoManager();

        // Başlangıç zamanı
        const startTime = Date.now();
        
        // Toplu üretim başlat
        logger.printInfo('Toplu üretim başlatılıyor...');
        const results = await sunoManager.generateBatchSongs(prompts, {
            delay: parseInt(options.delay),
            outputDir: options.output
        });

        // Bitiş zamanı
        const endTime = Date.now();
        const duration = Math.round((endTime - startTime) / 1000);

        // Sonuçları analiz et
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        // Sonuç raporu
        logger.printHeader('TOPLU ÜRETİM RAPORU');

        console.log(chalk.blue('📊 Genel İstatistikler:'));
        console.log(chalk.gray('-'.repeat(40)));
        console.log(chalk.green(`✅ Başarılı: ${successful}`));
        console.log(chalk.red(`❌ Başarısız: ${failed}`));
        console.log(chalk.blue(`⏱️  Toplam Süre: ${duration} saniye`));
        console.log(chalk.blue(`📁 Çıktı Dizini: ${options.output}`));

        // Başarısız olanları listele
        if (failed > 0) {
            console.log(chalk.red('\n❌ Başarısız İşlemler:'));
            console.log(chalk.gray('-'.repeat(40)));
            
            results
                .filter(r => !r.success)
                .forEach((result, index) => {
                    console.log(chalk.red(`${index + 1}. ${result.prompt.prompt || result.prompt.gpt_description_prompt}`));
                    console.log(chalk.gray(`   Hata: ${result.error}\n`));
                });
        }

        // Başarı oranı hesapla
        const successRate = Math.round((successful / prompts.length) * 100);
        
        if (successRate === 100) {
            logger.printSuccess(`🎉 Tüm şarkılar başarıyla üretildi! (${successful}/${prompts.length})`);
        } else if (successRate >= 80) {
            logger.printWarning(`⚠️ Çoğu şarkı üretildi (%${successRate}) - ${successful}/${prompts.length}`);
        } else {
            logger.printError(`❌ Düşük başarı oranı (%${successRate}) - ${successful}/${prompts.length}`);
        }

        // Hata log dosyası oluştur (eğer hata varsa)
        if (failed > 0) {
            const errorLogPath = `./data/output/logs/batch-errors-${Date.now()}.json`;
            await fs.writeFile(
                errorLogPath, 
                JSON.stringify(results.filter(r => !r.success), null, 2)
            );
            console.log(chalk.gray(`📝 Hata detayları kaydedildi: ${errorLogPath}`));
        }

        // Kalan limit kontrolü
        await sunoManager.checkLimit();

    } catch (error) {
        logger.printError('Toplu üretim hatası: ' + error.message);
        
        if (error.message.includes('ENOENT')) {
            console.log(chalk.yellow(`
⚠️  CSV Dosya Formatı:
Dosya başlıkları şunlardan biri olmalı:
- prompt, tags, make_instrumental, title
- gpt_description_prompt, tags, make_instrumental, title

Örnek CSV içeriği:
prompt,tags,make_instrumental,title
"romantic jazz song about love",jazz,false,"My Love Song"
"upbeat pop song",pop,false,""
"calm instrumental music",ambient,true,"Peaceful Moment"
            `));
        }
        
        process.exit(1);
    }
}

module.exports = batchCommand;