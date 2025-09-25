const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const Logger = require('./Logger');

class FileManager {
    constructor() {
        this.logger = new Logger();
        this.baseDir = process.cwd();
    }

    // Dosya varlığını kontrol et
    static async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    // Dizin oluştur (recursive)
    async ensureDirectory(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
            this.logger.debug(`Dizin oluşturuldu: ${dirPath}`);
            return true;
        } catch (error) {
            this.logger.error('Dizin oluşturma hatası', { path: dirPath, error: error.message });
            throw error;
        }
    }

    // Dosya oku (güvenli)
    async readFile(filePath, encoding = 'utf8') {
        try {
            if (!(await this.fileExists(filePath))) {
                throw new Error(`Dosya bulunamadı: ${filePath}`);
            }
            
            const content = await fs.readFile(filePath, encoding);
            this.logger.debug(`Dosya okundu: ${filePath}`);
            return content;
        } catch (error) {
            this.logger.error('Dosya okuma hatası', { path: filePath, error: error.message });
            throw error;
        }
    }

    // Dosya yaz (güvenli)
    async writeFile(filePath, content, encoding = 'utf8') {
        try {
            // Üst dizini oluştur
            const dir = path.dirname(filePath);
            await this.ensureDirectory(dir);
            
            await fs.writeFile(filePath, content, encoding);
            this.logger.debug(`Dosya yazıldı: ${filePath}`);
            return true;
        } catch (error) {
            this.logger.error('Dosya yazma hatası', { path: filePath, error: error.message });
            throw error;
        }
    }

    // Dosyayı güvenli bir şekilde sil
    async deleteFile(filePath) {
        try {
            if (await this.fileExists(filePath)) {
                await fs.unlink(filePath);
                this.logger.debug(`Dosya silindi: ${filePath}`);
                return true;
            }
            return false;
        } catch (error) {
            this.logger.error('Dosya silme hatası', { path: filePath, error: error.message });
            throw error;
        }
    }

    // Dizindeki dosyaları listele
    async listFiles(dirPath, extension = null) {
        try {
            if (!(await this.fileExists(dirPath))) {
                return [];
            }
            
            const files = await fs.readdir(dirPath);
            let filteredFiles = files;
            
            if (extension) {
                filteredFiles = files.filter(file => 
                    file.toLowerCase().endsWith(extension.toLowerCase())
                );
            }
            
            // Tam yol ile birlikte döndür
            const fullPaths = filteredFiles.map(file => path.join(dirPath, file));
            
            this.logger.debug(`Dosyalar listelendi: ${dirPath}`, { count: fullPaths.length });
            return fullPaths;
        } catch (error) {
            this.logger.error('Dosya listeleme hatası', { path: dirPath, error: error.message });
            throw error;
        }
    }

    // Dosya boyutunu al
    async getFileSize(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return stats.size;
        } catch (error) {
            this.logger.error('Dosya boyutu alma hatası', { path: filePath, error: error.message });
            throw error;
        }
    }

    // Dosya boyutunu formatla
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // JSON dosyası oku
    async readJsonFile(filePath) {
        try {
            const content = await this.readFile(filePath);
            return JSON.parse(content);
        } catch (error) {
            if (error.message.includes('Unexpected token')) {
                throw new Error(`JSON formatı geçersiz: ${filePath}`);
            }
            throw error;
        }
    }

    // JSON dosyası yaz
    async writeJsonFile(filePath, data) {
        try {
            const content = JSON.stringify(data, null, 2);
            await this.writeFile(filePath, content);
            return true;
        } catch (error) {
            this.logger.error('JSON yazma hatası', { path: filePath, error: error.message });
            throw error;
        }
    }

    // Dosyayı backup al
    async backupFile(filePath) {
        try {
            if (!(await this.fileExists(filePath))) {
                throw new Error(`Backup alınacak dosya bulunamadı: ${filePath}`);
            }
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = `${filePath}.backup.${timestamp}`;
            
            const content = await this.readFile(filePath, null); // Binary mode
            await this.writeFile(backupPath, content, null);
            
            this.logger.info('Dosya backup alındı', { original: filePath, backup: backupPath });
            return backupPath;
        } catch (error) {
            this.logger.error('Backup alma hatası', { path: filePath, error: error.message });
            throw error;
        }
    }

    // Eski backup dosyalarını temizle (7 günden eski)
    async cleanOldBackups(dirPath) {
        try {
            const files = await this.listFiles(dirPath);
            const backupFiles = files.filter(file => file.includes('.backup.'));
            
            const now = Date.now();
            const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
            
            let cleanedCount = 0;
            
            for (const file of backupFiles) {
                const stats = await fs.stat(file);
                if (stats.mtime.getTime() < weekAgo) {
                    await this.deleteFile(file);
                    cleanedCount++;
                }
            }
            
            if (cleanedCount > 0) {
                this.logger.info('Eski backup dosyaları temizlendi', { count: cleanedCount });
            }
            
            return cleanedCount;
        } catch (error) {
            this.logger.error('Backup temizleme hatası', { path: dirPath, error: error.message });
            throw error;
        }
    }

    // Dosyayı güvenli bir şekilde taşı/yeniden adlandır
    async moveFile(sourcePath, targetPath) {
        try {
            if (!(await this.fileExists(sourcePath))) {
                throw new Error(`Kaynak dosya bulunamadı: ${sourcePath}`);
            }
            
            // Hedef dizini oluştur
            const targetDir = path.dirname(targetPath);
            await this.ensureDirectory(targetDir);
            
            await fs.rename(sourcePath, targetPath);
            this.logger.debug(`Dosya taşındı: ${sourcePath} -> ${targetPath}`);
            return true;
        } catch (error) {
            this.logger.error('Dosya taşıma hatası', { 
                source: sourcePath, 
                target: targetPath, 
                error: error.message 
            });
            throw error;
        }
    }

    // Dosyayı kopyala
    async copyFile(sourcePath, targetPath) {
        try {
            if (!(await this.fileExists(sourcePath))) {
                throw new Error(`Kaynak dosya bulunamadı: ${sourcePath}`);
            }
            
            // Hedef dizini oluştur
            const targetDir = path.dirname(targetPath);
            await this.ensureDirectory(targetDir);
            
            await fs.copyFile(sourcePath, targetPath);
            this.logger.debug(`Dosya kopyalandı: ${sourcePath} -> ${targetPath}`);
            return true;
        } catch (error) {
            this.logger.error('Dosya kopyalama hatası', { 
                source: sourcePath, 
                target: targetPath, 
                error: error.message 
            });
            throw error;
        }
    }

    // CSV dosyası validasyonu
    async validateCsvFile(filePath) {
        try {
            const content = await this.readFile(filePath);
            const lines = content.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) {
                return { valid: false, error: 'CSV dosyası en az 2 satır içermelidir (başlık + veri)' };
            }
            
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const requiredHeaders = ['prompt', 'gpt_description_prompt'];
            
            const hasRequiredHeader = requiredHeaders.some(required => 
                headers.some(header => header.includes(required))
            );
            
            if (!hasRequiredHeader) {
                return { 
                    valid: false, 
                    error: `CSV başlığında şu alanlardan biri olmalı: ${requiredHeaders.join(' veya ')}` 
                };
            }
            
            return { 
                valid: true, 
                headers, 
                rowCount: lines.length - 1,
                size: await this.getFileSize(filePath)
            };
            
        } catch (error) {
            return { 
                valid: false, 
                error: `CSV validasyon hatası: ${error.message}` 
            };
        }
    }

    // Proje dizin yapısını kontrol et ve gerekirse oluştur
    async ensureProjectStructure() {
        const directories = [
            'config',
            'data/templates',
            'data/uploads', 
            'data/output/songs',
            'data/output/logs',
            'docs',
            'scripts'
        ];
        
        console.log(chalk.blue('📁 Proje dizin yapısı kontrol ediliyor...'));
        
        for (const dir of directories) {
            const fullPath = path.join(this.baseDir, dir);
            await this.ensureDirectory(fullPath);
            console.log(chalk.gray(`   ✓ ${dir}`));
        }
        
        console.log(chalk.green('✅ Proje dizin yapısı hazır'));
        return true;
    }

    // Disk kullanımını kontrol et
    async getDiskUsage(dirPath) {
        try {
            const files = await this.listFiles(dirPath);
            let totalSize = 0;
            
            for (const file of files) {
                try {
                    const size = await this.getFileSize(file);
                    totalSize += size;
                } catch (error) {
                    // Dosya erişim hatası, skip
                    continue;
                }
            }
            
            return {
                fileCount: files.length,
                totalSize,
                formattedSize: this.formatFileSize(totalSize)
            };
        } catch (error) {
            this.logger.error('Disk kullanımı hesaplama hatası', { path: dirPath, error: error.message });
            throw error;
        }
    }

    // Dosya izinlerini kontrol et
    static async checkPermissions(filePath) {
        try {
            const stats = await fs.stat(filePath);
            
            return {
                readable: true, // Node.js context'inde genelde readable
                writable: true, // Node.js context'inde genelde writable
                size: stats.size,
                modified: stats.mtime,
                created: stats.birthtime,
                isFile: stats.isFile(),
                isDirectory: stats.isDirectory()
            };
        } catch (error) {
            return {
                readable: false,
                writable: false,
                error: error.message
            };
        }
    }
}

module.exports = FileManager;