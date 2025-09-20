const chalk = require('chalk')
const inquirer = require('inquirer')
const SunoManager = require('../../core/SunoManager')
const Logger = require('../../core/Logger')

async function generateCommand (options) {
  const logger = new Logger()
  logger.printHeader('Şarkı Üretimi')

  try {
    // Eğer prompt verilmemişse, kullanıcıdan iste
    let prompt = options.prompt
    let tags = options.tags
    let instrumental = options.instrumental || false

    if (!prompt) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'prompt',
          message: 'Şarkı promptu girin:',
          validate: (input) => input.trim().length > 0 || 'Prompt boş olamaz!'
        },
        {
          type: 'list',
          name: 'tags',
          message: 'Müzik türünü seçin:',
          choices: [
            'pop',
            'rock',
            'jazz',
            'blues',
            'classical',
            'electronic',
            'hip hop',
            'country',
            'folk',
            'reggae',
            'metal',
            'acoustic'
          ],
          default: tags
        },
        {
          type: 'confirm',
          name: 'instrumental',
          message: 'Enstrümantal müzik mi?',
          default: false
        },
        {
          type: 'input',
          name: 'title',
          message: 'Şarkı başlığı (opsiyonel):',
          default: ''
        }
      ])

      prompt = answers.prompt
      tags = answers.tags
      instrumental = answers.instrumental
      options.title = answers.title
    }

    // ASCII art göster
    console.log(
      chalk.magenta(`
    ============================================
    |                                          |
    |         SARKI URETILIYOR...              |
    |                                          |
    ============================================
        `)
    )

    // SunoManager'ı başlat
    const sunoManager = new SunoManager()

    // Şarkı üret
    const songOptions = {
      gpt_description_prompt: prompt,
      tags,
      make_instrumental: instrumental,
      title: options.title || ''
    }

    const songInfo = await sunoManager.generateSong(songOptions)

    if (songInfo && songInfo.length > 0) {
      // Şarkıları kaydet
      await sunoManager.saveSongs(songInfo, options.output)

      // Başarı mesajı
      logger.printSuccess('Şarkı başarıyla üretildi ve kaydedildi!')

      // Şarkı bilgilerini göster
      console.log(chalk.blue('\n🎵 Üretilen Şarkı Bilgileri:'))
      console.log(chalk.gray('-'.repeat(40)))

      songInfo.forEach((song, index) => {
        console.log(chalk.white(`${index + 1}. Şarkı:`))
        console.log(chalk.cyan(`   ID: ${song.id || 'N/A'}`))
        console.log(chalk.cyan(`   Başlık: ${song.title || 'Başlıksız'}`))
        console.log(chalk.cyan(`   Durum: ${song.status || 'Üretiliyor'}`))
        console.log()
      })

      // İstatistikleri göster
      logger.printStats({
        üretilen_şarkı_sayısı: songInfo.length,
        müzik_türü: tags,
        enstrümantal: instrumental ? 'Evet' : 'Hayır',
        çıktı_dizini: options.output
      })

      // Kalan limit kontrolü
      await sunoManager.checkLimit()
    } else {
      logger.printError(
        'Şarkı üretilemedi. Lütfen parametrelerinizi kontrol edin.'
      )
    }
  } catch (error) {
    logger.printError('Şarkı üretimi başarısız: ' + error.message)

    if (error.message.includes('cookie')) {
      console.log(
        chalk.yellow(`
⚠️  Cookie Ayarlama Rehberi:
1. config/settings.json dosyasını oluşturun
2. Suno AI cookie'nizi ekleyin:
   {
     "suno_cookie": "your_cookie_here"
   }
3. Komutu tekrar çalıştırın
            `)
      )
    }

    process.exit(1)
  }
}

module.exports = generateCommand
