const chalk = require('chalk');
const boxen = require('boxen');

class CLIDisplay {
    constructor() {
        this.width = process.stdout.columns || 80;
        this.colors = {
            primary: '#00ff00',
            secondary: '#00ffff', 
            accent: '#ff00ff',
            warning: '#ffff00',
            error: '#ff0044',
            success: '#00ff44',
            info: '#4488ff'
        };
    }

    // Ana banner (cyberpunk ASCII)
    showMainBanner() {
        const banner = `
  ____                   _____           _ _    _ _   
 / ___| _   _ _ __   ___ |_   _|__   ___ | | | _(_) |_ 
 \\___ \\| | | | '_ \\ / _ \\  | |/ _ \\ / _ \\| | |/ / | __|
  ___) | |_| | | | | (_) | | | (_) | (_) | |   <| | |_ 
 |____/ \\__,_|_| |_|\\___/  |_|\\___/ \\___/|_|_|\\_\\_|\\__|
                                                      
           AI MUZIK URETIM ARAC SETI v1.0            `;

        console.clear();
        console.log(chalk.hex(this.colors.primary)(banner));
        console.log(chalk.hex(this.colors.secondary)('='.repeat(this.width)));
        console.log();
    }

    // Bölüm başlığı
    showSectionHeader(title, subtitle = '') {
        const box = boxen(
            chalk.bold.hex(this.colors.primary)(title) + 
            (subtitle ? '\n' + chalk.hex(this.colors.secondary)(subtitle) : ''), 
            {
                padding: 1,
                margin: 1,
                borderStyle: 'double',
                borderColor: this.colors.primary,
                backgroundColor: '#0a0a0a'
            }
        );
        console.log(box);
    }

    // Başarı mesajı kutusu
    showSuccessBox(title, message, details = null) {
        let content = chalk.bold.green('✅ ' + title);
        if (message) content += '\n' + chalk.white(message);
        if (details) content += '\n' + chalk.gray(details);

        const box = boxen(content, {
            padding: 1,
            margin: { top: 1, bottom: 1, left: 2, right: 2 },
            borderStyle: 'round',
            borderColor: 'green'
        });
        console.log(box);
    }

    // Hata mesajı kutusu
    showErrorBox(title, message, solution = null) {
        let content = chalk.bold.red('❌ ' + title);
        if (message) content += '\n' + chalk.white(message);
        if (solution) content += '\n' + chalk.yellow('💡 Çözüm: ' + solution);

        const box = boxen(content, {
            padding: 1,
            margin: { top: 1, bottom: 1, left: 2, right: 2 },
            borderStyle: 'round',
            borderColor: 'red'
        });
        console.log(box);
    }

    // Uyarı mesajı kutusu
    showWarningBox(title, message) {
        let content = chalk.bold.yellow('⚠️  ' + title);
        if (message) content += '\n' + chalk.white(message);

        const box = boxen(content, {
            padding: 1,
            margin: { top: 1, bottom: 1, left: 2, right: 2 },
            borderStyle: 'round',
            borderColor: 'yellow'
        });
        console.log(box);
    }

    // Bilgi mesajı kutusu
    showInfoBox(title, message) {
        let content = chalk.bold.blue('ℹ️  ' + title);
        if (message) content += '\n' + chalk.white(message);

        const box = boxen(content, {
            padding: 1,
            margin: { top: 1, bottom: 1, left: 2, right: 2 },
            borderStyle: 'round',
            borderColor: 'blue'
        });
        console.log(box);
    }

    // İlerleme çubuğu
    showProgressBar(current, total, message = '') {
        const percentage = Math.round((current / total) * 100);
        const barLength = 30;
        const filled = Math.round((percentage / 100) * barLength);
        const empty = barLength - filled;
        
        const progressBar = 
            chalk.hex(this.colors.success)('█'.repeat(filled)) +
            chalk.gray('░'.repeat(empty));
        
        const progressText = `${chalk.cyan(current)}/${chalk.cyan(total)} (${chalk.yellow(percentage)}%)`;
        
        process.stdout.write(`\r[${progressBar}] ${progressText} ${chalk.white(message)}`);
        
        if (current === total) {
            console.log(chalk.green('\n✅ Tamamlandı!'));
        }
    }

    // Tablo görüntüleme
    showTable(headers, rows, title = null) {
        if (title) {
            console.log(chalk.bold.hex(this.colors.primary)('\n' + title));
            console.log(chalk.hex(this.colors.secondary)('─'.repeat(title.length)));
        }

        // Header
        const headerRow = headers.map(h => chalk.bold.cyan(h)).join(' | ');
        console.log('\n' + headerRow);
        console.log('─'.repeat(headerRow.replace(/\x1b\[[0-9;]*m/g, '').length));

        // Rows
        rows.forEach(row => {
            const rowStr = row.map((cell, index) => {
                if (index === 0) return chalk.white(cell);
                return chalk.gray(cell);
            }).join(' | ');
            console.log(rowStr);
        });
        console.log();
    }

    // Şarkı listesi görüntüleme
    showSongList(songs, title = 'Üretilen Şarkılar') {
        if (!songs || songs.length === 0) {
            this.showInfoBox('Bilgi', 'Henüz şarkı bulunamadı');
            return;
        }

        console.log(chalk.bold.hex(this.colors.primary)(`\n${title} (${songs.length})`));
        console.log(chalk.hex(this.colors.secondary)('═'.repeat(50)));

        songs.forEach((song, index) => {
            const number = chalk.hex(this.colors.accent)(`[${String(index + 1).padStart(2, '0')}]`);
            const title = chalk.white(song.title || 'Başlıksız Şarkı');
            const id = chalk.gray(`ID: ${song.id || 'N/A'}`);
            const status = this.getStatusDisplay(song.status);
            const genre = chalk.cyan(`Tür: ${song.tags || 'Bilinmiyor'}`);

            console.log(`${number} ${title}`);
            console.log(`    ${id} | ${status} | ${genre}`);
            
            if (song.created_at) {
                const date = chalk.gray(`Oluşturma: ${new Date(song.created_at).toLocaleString('tr-TR')}`);
                console.log(`    ${date}`);
            }
            console.log();
        });
    }

    // Durum göstergesi
    getStatusDisplay(status) {
        if (!status) return chalk.yellow('⏳ İşleniyor');
        
        const statusLower = status.toLowerCase();
        if (statusLower.includes('complete') || statusLower.includes('success')) {
            return chalk.green('✅ Tamamlandı');
        }
        if (statusLower.includes('error') || statusLower.includes('fail')) {
            return chalk.red('❌ Hatalı');
        }
        if (statusLower.includes('processing')) {
            return chalk.yellow('⏳ İşleniyor');
        }
        return chalk.blue('🔄 ' + status);
    }

    // CSV bilgi kutusu
    showCsvInfo(filePath, rowCount, headers) {
        const content = [
            chalk.white('📄 CSV Dosya Bilgileri'),
            '',
            chalk.gray('Dosya: ') + chalk.yellow(filePath),
            chalk.gray('Satır Sayısı: ') + chalk.green(rowCount),
            chalk.gray('Sütunlar: ') + chalk.cyan(headers.join(', ')),
            '',
            chalk.blue('💡 Her satır bir şarkı üretecek')
        ].join('\n');

        const box = boxen(content, {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'cyan'
        });
        console.log(box);
    }

    // Sistem durumu
    showSystemStatus(status) {
        console.log(chalk.bold.hex(this.colors.primary)('\n🖥️  Sistem Durumu'));
        console.log(chalk.hex(this.colors.secondary)('─'.repeat(30)));

        const items = [
            { label: 'Node.js Versiyonu', value: status.nodeVersion || 'Bilinmiyor', color: 'green' },
            { label: 'Platform', value: status.platform || process.platform, color: 'blue' },
            { label: 'Bellek Kullanımı', value: `${Math.round(status.memoryUsage / 1024 / 1024)} MB`, color: 'yellow' },
            { label: 'Uptime', value: this.formatUptime(status.uptime), color: 'cyan' },
            { label: 'Suno AI', value: status.sunoConnected ? 'Bağlı' : 'Bağlı Değil', color: status.sunoConnected ? 'green' : 'red' }
        ];

        items.forEach(item => {
            console.log(
                chalk.white('• ' + item.label + ': ') + 
                chalk[item.color](item.value)
            );
        });
        console.log();
    }

    // Uptime formatla
    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        return `${hours}s ${minutes}d ${secs}s`;
    }

    // Loading animasyonu
    showLoadingAnimation(message = 'Yükleniyor') {
        const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let i = 0;
        
        return setInterval(() => {
            process.stdout.write(`\r${chalk.cyan(frames[i])} ${chalk.white(message)}...`);
            i = (i + 1) % frames.length;
        }, 100);
    }

    // Loading'i durdur
    stopLoadingAnimation(interval, successMessage = null) {
        clearInterval(interval);
        process.stdout.write('\r' + ' '.repeat(50) + '\r');
        
        if (successMessage) {
            console.log(chalk.green('✅ ' + successMessage));
        }
    }

    // Komut yardımı
    showCommandHelp(command, description, options = [], examples = []) {
        console.log(chalk.bold.hex(this.colors.primary)(`\n📖 ${command} Komutu Yardımı`));
        console.log(chalk.hex(this.colors.secondary)('═'.repeat(40)));
        console.log(chalk.white('\n' + description + '\n'));

        if (options.length > 0) {
            console.log(chalk.bold.cyan('Seçenekler:'));
            options.forEach(opt => {
                console.log(chalk.white(`  ${opt.flag.padEnd(20)} ${opt.description}`));
                if (opt.default) {
                    console.log(chalk.gray(`${' '.repeat(22)}Varsayılan: ${opt.default}`));
                }
            });
            console.log();
        }

        if (examples.length > 0) {
            console.log(chalk.bold.yellow('Örnekler:'));
            examples.forEach(example => {
                console.log(chalk.gray('  $ ') + chalk.green(example.command));
                console.log(chalk.white(`    ${example.description}\n`));
            });
        }
    }

    // Separator
    showSeparator(char = '─', color = 'gray') {
        console.log(chalk[color](char.repeat(this.width)));
    }

    // Boşluk
    showSpace(lines = 1) {
        console.log('\n'.repeat(lines - 1));
    }

    // Cyberpunk style prompt
    showCyberpunkPrompt(user = 'root', host = 'suno', path = '~') {
        const prompt = `${chalk.green(user)}@${chalk.cyan(host)}:${chalk.yellow(path)}const chalk = require('chalk');
const boxen = require('boxen');

class CLIDisplay {
    constructor() {
        this.width = process.stdout.columns || 80;
        this.colors = {
            primary: '#00ff00',
            secondary: '#00ffff', 
            accent: '#ff00ff',
            warning: '#ffff00',
            error: '#ff0044',
            success: '#00ff44',
            info: '#4488ff'
        };
    }

    // Ana banner (cyberpunk ASCII)
    showMainBanner() {
        const banner = `
  ____                   _____           _ _    _ _   
 / ___| _   _ _ __   ___ |_   _|__   ___ | | | _(_) |_ 
 \\___ \\| | | | '_ \\ / _ \\  | |/ _ \\ / _ \\| | |/ / | __|
  ___) | |_| | | | | (_) | | | (_) | (_) | |   <| | |_ 
 |____/ \\__,_|_| |_|\\___/  |_|\\___/ \\___/|_|_|\\_\\_|\\__|
                                                      
           AI MUZIK URETIM ARAC SETI v1.0            `;

        console.clear();
        console.log(chalk.hex(this.colors.primary)(banner));
        console.log(chalk.hex(this.colors.secondary)('='.repeat(this.width)));
        console.log();
    }

    // Bölüm başlığı
    showSectionHeader(title, subtitle = '') {
        const box = boxen(
            chalk.bold.hex(this.colors.primary)(title) + 
;
        return prompt + ' ';
    }

    // Terminal görünümlü output
    showTerminalOutput(lines, title = 'Terminal Çıktısı') {
        console.log(chalk.bold.hex(this.colors.primary)(`\n💻 ${title}`));
        console.log(chalk.hex(this.colors.secondary)('┌' + '─'.repeat(this.width - 2) + '┐'));
        
        lines.forEach(line => {
            const paddedLine = line.padEnd(this.width - 4);
            console.log(chalk.hex(this.colors.secondary)('│ ') + chalk.green(paddedLine) + chalk.hex(this.colors.secondary)(' │'));
        });
        
        console.log(chalk.hex(this.colors.secondary)('└' + '─'.repeat(this.width - 2) + '┘'));
    }

    // Footer
    showFooter() {
        console.log(chalk.hex(this.colors.secondary)('═'.repeat(this.width)));
        console.log(chalk.gray('SunoToolkit v1.0 - AI Müzik Üretim Aracı'));
        console.log(chalk.gray('Yardım için: --help | Çıkmak için: Ctrl+C'));
        console.log();
    }

    // Error stack trace (development mode)
    showErrorStack(error) {
        if (process.env.NODE_ENV === 'development') {
            console.log(chalk.red('\n🐛 Hata Detayları (Development Mode):'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(chalk.red(error.stack));
            console.log();
        }
    }

    // Success celebration
    showSuccessCelebration(message) {
        const celebration = [
            '🎉 🎵 🎶 🎉 🎵 🎶 🎉',
            '',
            message,
            '',
            '🎉 🎵 🎶 🎉 🎵 🎶 🎉'
        ].join('\n');

        const box = boxen(celebration, {
            padding: 2,
            margin: 2,
            borderStyle: 'double',
            borderColor: 'green',
            backgroundColor: '#001100'
        });
        
        console.log(box);
    }

    // Warning with timeout
    showTimedWarning(message, seconds = 5) {
        console.log(chalk.yellow(`⚠️  ${message}`));
        console.log(chalk.gray(`Bu mesaj ${seconds} saniye sonra kapanacak...`));
        
        let remaining = seconds;
        const interval = setInterval(() => {
            remaining--;
            process.stdout.write(`\r${chalk.gray(`Kalan süre: ${remaining} saniye...`)}`);
            
            if (remaining <= 0) {
                clearInterval(interval);
                console.log('\r' + ' '.repeat(50));
            }
        }, 1000);
    }
}

module.exports = CLIDisplay;