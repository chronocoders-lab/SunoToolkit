const fs = require('fs').promises
const path = require('path')
const chalk = require('chalk')

class Logger {
  constructor (logDir = './data/output/logs') {
    this.logDir = logDir
    this.logFile = path.join(
      logDir,
      `suno-toolkit-${this.getDateString()}.log`
    )
    this.initializeLogDir()
  }

  // Log dizinini oluştur
  async initializeLogDir () {
    try {
      await fs.mkdir(this.logDir, { recursive: true })
    } catch (error) {
      console.error('Log dizini oluşturulamadı:', error)
    }
  }

  // Tarih string'i üret
  static getDateString () {
    const now = new Date()
    return now.toISOString().split('T')[0] // YYYY-MM-DD
  }

  // Zaman damgası
  static getTimestamp () {
    return new Date().toISOString()
  }

  // Log seviyesine göre renk
  static getColorByLevel (level) {
    const colors = {
      INFO: chalk.blue,
      WARN: chalk.yellow,
      ERROR: chalk.red,
      SUCCESS: chalk.green,
      DEBUG: chalk.gray
    }
    return colors[level] || chalk.white
  }

  // Genel log fonksiyonu
  async log (level, message, data = null) {
    const timestamp = this.getTimestamp()
    const logMessage = data
      ? `[${timestamp}] [${level}] ${message} ${JSON.stringify(data)}`
      : `[${timestamp}] [${level}] ${message}`

    // Konsola yazdır
    const colorFn = this.getColorByLevel(level)
    console.log(colorFn(`[${level}] ${message}`))

    if (data) {
      console.log(chalk.gray(JSON.stringify(data, null, 2)))
    }

    // Dosyaya yaz
    try {
      await fs.appendFile(this.logFile, `${logMessage}\n`)
    } catch (error) {
      console.error(chalk.red('Log yazma hatası:'), error.message)
    }
  }

  // Özel log seviyesi fonksiyonları
  async info (message, data = null) {
    await this.log('INFO', message, data)
  }

  async warn (message, data = null) {
    await this.log('WARN', message, data)
  }

  async error (message, data = null) {
    await this.log('ERROR', message, data)
  }

  async success (message, data = null) {
    await this.log('SUCCESS', message, data)
  }

  async debug (message, data = null) {
    await this.log('DEBUG', message, data)
  }

  // Başlık yazdır
  static printHeader (title) {
    const border = '='.repeat(60)
    console.log(
      chalk.cyan(`
  ${border}`)
    )
    console.log(chalk.cyan(`  ${title.toUpperCase()}`))
    console.log(
      chalk.cyan(`${border}
  `)
    )
  }

  // Başarı mesajı
  static printSuccess (message) {
    console.log(
      chalk.green(`
  ✅ ${message}`)
    )
  }

  // Hata mesajı
  static printError (message) {
    console.log(
      chalk.red(`
  ❌ ${message}`)
    )
  }

  // Uyarı mesajı
  static printWarning (message) {
    console.log(
      chalk.yellow(`
  ⚠️ ${message}`)
    )
  }

  // Bilgi mesajı
  static printInfo (message) {
    console.log(
      chalk.blue(`
  ℹ️ ${message}`)
    )
  }

  // İstatistik tablosu
  static printStats (stats) {
    console.log(chalk.blue('\n📊 İstatistikler:'))
    console.log(chalk.gray('-'.repeat(30)))

    for (const [key, value] of Object.entries(stats)) {
      const formattedKey = key.replace(/_/g, ' ').toUpperCase()
      console.log(chalk.white(`${formattedKey}: `) + chalk.green(value))
    }
    console.log()
  }

  // İlerleme çubuğu için konsol temizle
  static clearLine () {
    process.stdout.write('\r\x1b[K')
  }

  // Basit ilerleme çubuğu
  printProgress (current, total, message = '') {
    const percentage = Math.round((current / total) * 100)
    const progressBar =
      '█'.repeat(Math.floor(percentage / 2)) +
      '░'.repeat(50 - Math.floor(percentage / 2))

    this.clearLine()
    process.stdout.write(
      chalk.cyan(`[${progressBar}] ${percentage}% ${message}`)
    )

    if (current === total) {
      console.log(chalk.green('\n✅ Tamamlandı!'))
    }
  }

  // Log dosyasını temizle
  async clearLogs () {
    try {
      await fs.unlink(this.logFile)
      console.log(chalk.green('Log dosyası temizlendi'))
    } catch (error) {
      console.log(chalk.yellow('Log dosyası bulunamadı veya zaten temiz'))
    }
  }

  // Eski log dosyalarını temizle (7 günden eski)
  async cleanOldLogs () {
    try {
      const files = await fs.readdir(this.logDir)
      const now = Date.now()
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000

      for (const file of files) {
        if (file.endsWith('.log')) {
          const filePath = path.join(this.logDir, file)
          const stats = await fs.stat(filePath)

          if (stats.mtime.getTime() < weekAgo) {
            await fs.unlink(filePath)
            console.log(chalk.gray(`Eski log dosyası silindi: ${file}`))
          }
        }
      }
    } catch (error) {
      console.log(chalk.yellow('Eski log temizleme hatası:', error.message))
    }
  }
}

module.exports = Logger
