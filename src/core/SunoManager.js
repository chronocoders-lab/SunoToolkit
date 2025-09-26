const { SunoAI } = require('suno-ai')
const fs = require('fs').promises
const path = require('path')
const chalk = require('chalk')
const ora = require('ora')
const Logger = require('./Logger')

class SunoManager {
  constructor (cookie = null) {
    this.suno = null
    this.cookie = cookie
    this.logger = new Logger()
    this.isInitialized = false
  }

  // Başlatma
  async initialize () {
    if (!this.cookie) {
      this.cookie = await this.loadCookieFromConfig()
    }

    if (!this.cookie) {
      throw new Error(
        'Cookie bulunamadı! config/settings.json dosyasını kontrol edin.'
      )
    }

    const spinner = ora('Suno AI bağlantısı kuruluyor...').start()

    try {
      this.suno = new SunoAI(this.cookie)
      await this.suno.init()
      this.isInitialized = true

      spinner.succeed('Suno AI bağlantısı başarılı')
      this.logger.info('SunoAI başlatıldı')

      // Kalan limit kontrolü
      const limit = await this.suno.getLimit()
      console.log(chalk.blue(`📊 Kalan Request Limiti: ${limit}`))
    } catch (error) {
      spinner.fail('Suno AI bağlantı hatası')
      this.logger.error('SunoAI başlatma hatası:', error)
      throw error
    }
  }

  // Config'den cookie yükle
  async loadCookieFromConfig () {
    try {
      const configPath = path.join(process.cwd(), 'config', 'settings.json')
      const config = JSON.parse(await fs.readFile(configPath, 'utf8'))
      return config.suno_cookie
    } catch (error) {
      this.logger.warn('Config dosyası okunamadı:', error.message)
      return null
    }
  }

  // Tek şarkı üretimi
  async generateSong (options = {}) {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const {
      prompt = '',
      gpt_description_prompt = '',
      tags = 'pop',
      make_instrumental = false,
      title = '',
      mv = 'chirp-v3-0'
    } = options

    const payload = {
      gpt_description_prompt: gpt_description_prompt || prompt,
      prompt: gpt_description_prompt ? '' : prompt,
      tags,
      make_instrumental,
      title,
      mv
    }

    console.log(chalk.yellow('\n🎵 Şarkı üretiliyor...'))
    console.log(
      chalk.gray(`Prompt: ${payload.gpt_description_prompt || payload.prompt}`)
    )
    console.log(chalk.gray(`Tür: ${tags}`))
    console.log(
      chalk.gray(`Enstrümantal: ${make_instrumental ? 'Evet' : 'Hayır'}`)
    )

    const spinner = ora('Müzik üretimi başladı...').start()

    try {
      const songInfo = await this.suno.generateSongs(payload)
      spinner.succeed('Şarkı üretimi tamamlandı')

      this.logger.info('Şarkı üretildi:', {
        prompt: payload.gpt_description_prompt || payload.prompt,
        tags,
        songCount: songInfo.length || 1
      })

      return songInfo
    } catch (error) {
      spinner.fail('Şarkı üretimi başarısız')
      this.logger.error('Şarkı üretim hatası:', error)
      throw error
    }
  }

  // Toplu şarkı üretimi
  async generateBatchSongs (prompts, options = {}) {
    const results = []
    const { delay = 5000, outputDir = './data/output/songs' } = options

    console.log(
      chalk.blue(`\n📦 Toplu üretim başlıyor: ${prompts.length} şarkı`)
    )

    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i]

      console.log(chalk.cyan(`\n[${i + 1}/${prompts.length}] İşleniyor...`))

      try {
        const songInfo = await this.generateSong(prompt)

        // Şarkıları kaydet
        if (songInfo && songInfo.length > 0) {
          await this.saveSongs(songInfo, outputDir)
          results.push({ success: true, prompt, songInfo })
        }

        // Bekleme süresi (son şarkı değilse)
        if (i < prompts.length - 1) {
          console.log(chalk.gray(`⏳ ${delay / 1000} saniye bekleniyor...`))
          await this.sleep(delay)
        }
      } catch (error) {
        console.error(chalk.red(`❌ Hata: ${error.message}`))
        results.push({ success: false, prompt, error: error.message })
      }
    }

    return results
  }

  // Şarkıları kaydet
  async saveSongs (songInfo, outputDir = './data/output/songs') {
    if (!this.isInitialized) {
      await this.initialize()
    }

    // Dizin oluştur
    await fs.mkdir(outputDir, { recursive: true })

    const spinner = ora('Şarkılar kaydediliyor...').start()

    try {
      await this.suno.saveSongs(songInfo, outputDir)
      spinner.succeed(`Şarkılar kaydedildi: ${outputDir}`)

      this.logger.info('Şarkılar kaydedildi:', {
        outputDir,
        count: songInfo.length || 1
      })
    } catch (error) {
      spinner.fail('Kaydetme hatası')
      this.logger.error('Şarkı kaydetme hatası:', error)
      throw error
    }
  }

  // Metadata al
  async getMetadata (ids = []) {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const metadata = await this.suno.getMetadata(ids)
      this.logger.info('Metadata alındı:', { count: metadata.length })
      return metadata
    } catch (error) {
      this.logger.error('Metadata alma hatası:', error)
      throw error
    }
  }

  // Tüm şarkıları al
  async getAllSongs () {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const songs = await this.suno.getAllSongs()
      this.logger.info('Tüm şarkılar alındı:', { count: songs.length })
      return songs
    } catch (error) {
      this.logger.error('Şarkı listesi alma hatası:', error)
      throw error
    }
  }

  // Şarkı sözü üret
  async generateLyrics (prompt) {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const lyrics = await this.suno.generateLyrics(prompt)
      this.logger.info('Şarkı sözü üretildi:', { prompt })
      return lyrics
    } catch (error) {
      this.logger.error('Şarkı sözü üretim hatası:', error)
      throw error
    }
  }

  // Limit kontrolü
  async checkLimit () {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const limit = await this.suno.getLimit()
      console.log(chalk.blue(`📊 Kalan Request Limiti: ${limit}`))
      return limit
    } catch (error) {
      this.logger.error('Limit kontrol hatası:', error)
      throw error
    }
  }

  // Yardımcı fonksiyonlar
  static sleep (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

module.exports = SunoManager
