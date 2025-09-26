const inquirer = require('inquirer')
const chalk = require('chalk')
const fs = require('fs').promises

class CLIPrompts {
  constructor () {
    this.musicGenres = [
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
      'acoustic',
      'indie',
      'alternative',
      'funk',
      'soul',
      'r&b',
      'punk'
    ]

    this.promptTemplates = [
      'romantik jazz şarkısı',
      'enerjik rock müziği',
      'sakin akustik melodi',
      'dans edilebilir elektronik müzik',
      'nostaljik folk şarkısı',
      'güçlü metal rifleri',
      'yumuşak pop balad',
      'funky bas hattı',
      'melankolik blues',
      'neşeli country şarkısı'
    ]
  }

  // Şarkı üretimi için interaktif prompt
  async getGenerateOptions () {
    console.log(chalk.blue('\n🎵 Tek Şarkı Üretimi Ayarları\n'))

    const questions = [
      {
        type: 'list',
        name: 'promptType',
        message: 'Prompt tipi seçin:',
        choices: [
          {
            name: 'GPT Açıklama (AI tarafından şarkı sözü üretilir)',
            value: 'gpt'
          },
          {
            name: 'Özel Şarkı Sözleri (Kendi sözlerinizi yazın)',
            value: 'custom'
          }
        ],
        default: 'gpt'
      }
    ]

    const { promptType } = await inquirer.prompt(questions)

    let promptQuestions = []

    if (promptType === 'gpt') {
      promptQuestions = [
        {
          type: 'input',
          name: 'gpt_description_prompt',
          message: 'Şarkı açıklaması girin:',
          validate: (input) =>
            input.trim().length > 0 || 'Açıklama boş olamaz!',
          transformer: (input) => chalk.green(input)
        },
        {
          type: 'list',
          name: 'useTemplate',
          message: 'Hazır template kullanmak ister misiniz?',
          choices: ['Hayır', 'Evet'],
          default: 'Hayır',
          when: (answers) => !answers.gpt_description_prompt
        },
        {
          type: 'list',
          name: 'template',
          message: 'Template seçin:',
          choices: this.promptTemplates,
          when: (answers) => answers.useTemplate === 'Evet'
        }
      ]
    } else {
      promptQuestions = [
        {
          type: 'editor',
          name: 'prompt',
          message: 'Şarkı sözlerinizi yazın (editör açılacak):',
          validate: (input) =>
            input.trim().length > 0 || 'Şarkı sözleri boş olamaz!',
          waitUserInput: true
        }
      ]
    }

    const promptAnswers = await inquirer.prompt(promptQuestions)

    // Template seçildiyse, onu prompt olarak kullan
    if (promptAnswers.template) {
      promptAnswers.gpt_description_prompt = promptAnswers.template
    }

    const additionalQuestions = [
      {
        type: 'list',
        name: 'tags',
        message: 'Müzik türü seçin:',
        choices: this.musicGenres,
        default: 'pop',
        pageSize: 10
      },
      {
        type: 'input',
        name: 'title',
        message: 'Şarkı başlığı (opsiyonel):',
        transformer: (input) =>
          input
            ? chalk.cyan(input)
            : chalk.gray('(başlık otomatik belirlenecek)')
      },
      {
        type: 'confirm',
        name: 'make_instrumental',
        message: 'Enstrümantal müzik mi? (şarkı sözü olmadan)',
        default: false
      },
      {
        type: 'input',
        name: 'output',
        message: 'Çıktı dizini:',
        default: './data/output/songs',
        transformer: (input) => chalk.yellow(input)
      }
    ]

    const additionalAnswers = await inquirer.prompt(additionalQuestions)

    // Final confirmation
    const confirmationAnswers = await this.showGenerateConfirmation({
      ...promptAnswers,
      ...additionalAnswers,
      promptType
    })

    return { ...promptAnswers, ...additionalAnswers, ...confirmationAnswers }
  }

  // Üretim öncesi onay ekranı
  static async showGenerateConfirmation (options) {
    console.log(chalk.blue('\n📋 Şarkı Üretim Özeti:\n'))
    console.log(chalk.gray('─'.repeat(50)))

    if (options.promptType === 'gpt') {
      console.log(
        chalk.white('Açıklama: ') + chalk.green(options.gpt_description_prompt)
      )
    } else {
      const preview = options.prompt.substring(0, 100)
      console.log(
        chalk.white('Şarkı Sözü: ') +
          chalk.green(preview + (options.prompt.length > 100 ? '...' : ''))
      )
    }

    console.log(chalk.white('Müzik Türü: ') + chalk.cyan(options.tags))
    console.log(
      chalk.white('Başlık: ') +
        (options.title ? chalk.cyan(options.title) : chalk.gray('Otomatik'))
    )
    console.log(
      chalk.white('Enstrümantal: ') +
        (options.make_instrumental
          ? chalk.yellow('Evet')
          : chalk.green('Hayır'))
    )
    console.log(chalk.white('Çıktı: ') + chalk.yellow(options.output))
    console.log(chalk.gray('─'.repeat(50)))

    return inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Şarkı üretimini başlatmak istediğinizden emin misiniz?',
        default: true
      }
    ])
  }

  // Batch işlemi için prompts
  static async getBatchOptions () {
    console.log(chalk.blue('\n📦 Toplu Şarkı Üretimi Ayarları\n'))

    const questions = [
      {
        type: 'input',
        name: 'csvFile',
        message: 'CSV dosya yolu:',
        default: './data/templates/sample-batch.csv',
        validate: async (input) => {
          try {
            await fs.access(input)
            return true
          } catch {
            return 'Dosya bulunamadı! Lütfen geçerli bir dosya yolu girin.'
          }
        },
        transformer: (input) => chalk.yellow(input)
      },
      {
        type: 'number',
        name: 'delay',
        message: 'İstekler arası bekleme süresi (ms):',
        default: 5000,
        validate: (input) => {
          if (input < 1000) return 'En az 1000ms olmalı!'
          if (input > 60000) return 'En fazla 60000ms olmalı!'
          return true
        },
        transformer: (input) => chalk.cyan(`${input}ms`)
      },
      {
        type: 'input',
        name: 'output',
        message: 'Çıktı dizini:',
        default: './data/output/songs',
        transformer: (input) => chalk.yellow(input)
      },
      {
        type: 'list',
        name: 'errorHandling',
        message: 'Hata durumunda nasıl devam edilsin?',
        choices: [
          { name: 'Durdurup hata göster', value: 'stop' },
          { name: 'Hatayı logla ve devam et', value: 'continue' },
          { name: 'Hatayı 3 kez tekrar dene', value: 'retry' }
        ],
        default: 'continue'
      }
    ]

    return inquirer.prompt(questions)
  }

  // CSV preview göster
  static async showCsvPreview (filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8')
      const lines = content.split('\n').filter((line) => line.trim())

      console.log(chalk.blue('\n📄 CSV Dosya Önizleme:\n'))
      console.log(chalk.gray('─'.repeat(60)))

      // İlk 5 satırı göster
      lines.slice(0, 5).forEach((line, index) => {
        if (index === 0) {
          console.log(`${chalk.yellow('BAŞLIKLAR: ')}${chalk.white(line)}`)
        } else {
          console.log(
            `${chalk.gray(`${index}. `)}${chalk.green(`${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`)}`
          )
        }
      })

      if (lines.length > 5) {
        console.log(chalk.gray(`\n... ve ${lines.length - 5} satır daha`))
      }

      console.log(chalk.gray('─'.repeat(60)))
      console.log(chalk.blue(`Toplam: ${lines.length - 1} şarkı\n`))
    } catch (error) {
      console.log(chalk.red(`CSV önizleme hatası: ${error.message}`))
    }
  }

  // Web server ayarları
  static async getWebServerOptions () {
    console.log(chalk.blue('\n🌐 Web Server Ayarları\n'))

    return inquirer.prompt([
      {
        type: 'number',
        name: 'port',
        message: 'Port numarası:',
        default: 3000,
        validate: (input) => {
          if (input < 1024 || input > 65535) {
            return 'Port 1024-65535 arasında olmalı!'
          }
          return true
        },
        transformer: (input) => chalk.cyan(input)
      },
      {
        type: 'list',
        name: 'host',
        message: 'Host seçin:',
        choices: [
          { name: 'localhost (sadece yerel)', value: 'localhost' },
          { name: '0.0.0.0 (tüm ağ)', value: '0.0.0.0' },
          { name: '127.0.0.1 (loopback)', value: '127.0.0.1' }
        ],
        default: 'localhost'
      },
      {
        type: 'confirm',
        name: 'openBrowser',
        message: 'Tarayıcı otomatik açılsın mı?',
        default: true
      }
    ])
  }

  // Cookie setup prompts
  static async getCookieSetup () {
    console.log(chalk.blue('\n🍪 Suno AI Cookie Kurulumu\n'))

    console.log(chalk.yellow('Suno AI cookie almak için:'))
    console.log(chalk.gray('1. suno.com/create adresine gidin'))
    console.log(chalk.gray('2. F12 tuşuna basın (Developer Tools)'))
    console.log(chalk.gray('3. Network sekmesine gidin'))
    console.log(chalk.gray('4. Sayfayı yenileyin'))
    console.log(chalk.gray('5. "__clerk_api_version" içeren isteği bulun'))
    console.log(chalk.gray('6. Headers > Cookie değerini kopyalayın\n'))

    return inquirer.prompt([
      {
        type: 'input',
        name: 'suno_cookie',
        message: 'Suno AI Cookie:',
        validate: (input) => {
          if (!input.trim()) return 'Cookie boş olamaz!'
          if (input.length < 50) return 'Cookie çok kısa, kontrol edin!'
          return true
        },
        transformer: () => chalk.green(`${'*'.repeat(20)}...`)
      },
      {
        type: 'input',
        name: 'session_id',
        message: 'Session ID (opsiyonel):',
        transformer: (input) =>
          input ? chalk.green(`${'*'.repeat(10)}...`) : chalk.gray('(boş)')
      },
      {
        type: 'input',
        name: 'twocaptcha_key',
        message: '2Captcha API Key (opsiyonel):',
        transformer: (input) =>
          input ? chalk.green(`${'*'.repeat(15)}...`) : chalk.gray('(boş)')
      },
      {
        type: 'confirm',
        name: 'saveConfig',
        message: 'Bu ayarları config/settings.json dosyasına kaydet?',
        default: true
      }
    ])
  }

  // Exit confirmation
  static async confirmExit () {
    return inquirer.prompt([
      {
        type: 'confirm',
        name: 'exit',
        message: 'Çıkmak istediğinizden emin misiniz?',
        default: false
      }
    ])
  }

  // Loading spinner ile birlikte prompt
  static async promptWithSpinner (questions, spinnerText) {
    const ora = require('ora')
    const spinner = ora(spinnerText).start()

    setTimeout(() => {
      spinner.stop()
    }, 1000)

    return inquirer.prompt(questions)
  }

  // Multiple choice with search
  static async searchableList (message, choices, pageSize = 10) {
    return inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message,
        choices,
        pageSize,
        loop: false
      }
    ])
  }

  // Progress confirmation
  static showProgress (current, total, item) {
    const percentage = Math.round((current / total) * 100)
    const progressBar =
      '█'.repeat(Math.floor(percentage / 5)) +
      '░'.repeat(20 - Math.floor(percentage / 5))

    console.log(
      `\r${chalk.cyan(`[${progressBar}] ${percentage}%`)} ${chalk.white(item)}`
    )
  }
}

module.exports = CLIPrompts
