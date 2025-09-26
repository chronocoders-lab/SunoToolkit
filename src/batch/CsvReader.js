const fs = require('fs').promises
const csv = require('csv-parser')
const { createReadStream } = require('fs')
const chalk = require('chalk')
const Logger = require('../core/Logger')

class CsvReader {
  constructor () {
    this.logger = new Logger()
  }

  // CSV dosyasından promptları okur
  readPrompts (filePath) {
    return new Promise((resolve, reject) => {
      const prompts = []
      const requiredFields = ['prompt', 'gpt_description_prompt']

      console.log(chalk.blue(`📖 CSV dosyası okunuyor: ${filePath}`))

      createReadStream(filePath)
        .pipe(
          csv({
            // Boşlukları temizle
            mapHeaders: ({ header }) => header.trim().toLowerCase(),
            // Virgül ayırıcısını zorla
            separator: ','
          })
        )
        .on('headers', (headers) => {
          console.log(chalk.gray(`📋 Bulunan sütunlar: ${headers.join(', ')}`))

          // Gerekli alanlardan en az birinin olup olmadığını kontrol et
          const hasPromptField = headers.some((h) =>
            requiredFields.some((field) => h.includes(field.toLowerCase()))
          )

          if (!hasPromptField) {
            reject(
              new Error(
                `CSV dosyasında prompt alanı bulunamadı! Gerekli alanlar: ${requiredFields.join(' veya ')}`
              )
            )
          }
        })
        .on('data', (row) => {
          try {
            const prompt = this.parseRow(row)
            if (prompt) {
              prompts.push(prompt)
            }
          } catch (error) {
            console.warn(chalk.yellow(`⚠️ Satır atlandı: ${error.message}`))
          }
        })
        .on('end', () => {
          console.log(
            chalk.green(`✅ ${prompts.length} geçerli prompt okundu`)
          )
          this.logger.info('CSV dosyası başarıyla okundu', {
            file: filePath,
            count: prompts.length
          })
          resolve(prompts)
        })
        .on('error', (error) => {
          console.error(chalk.red('❌ CSV okuma hatası:'), error.message)
          this.logger.error('CSV okuma hatası', {
            file: filePath,
            error: error.message
          })
          reject(error)
        })
    })
  }

  // Satırı parse et ve prompt objesi oluştur
  parseRow (row) {
    // Boş satırları atla
    const values = Object.values(row).filter((val) => val?.toString().trim())
    if (values.length === 0) {
      return null
    }

    // Prompt metnini bul
    let promptText = ''
    if (row.prompt?.trim()) {
      promptText = row.prompt.trim()
    } else if (row.gpt_description_prompt?.trim()) {
      promptText = row.gpt_description_prompt.trim()
    }

    if (!promptText) {
      throw new Error('Prompt metni bulunamadı')
    }

    // Prompt objesini oluştur
    const prompt = {
      prompt: row.prompt ? row.prompt.trim() : '',
      gpt_description_prompt: row.gpt_description_prompt
        ? row.gpt_description_prompt.trim()
        : promptText,
      tags: row.tags ? row.tags.trim() : 'pop',
      make_instrumental: this.parseBoolean(row.make_instrumental),
      title: row.title ? row.title.trim() : '',
      mv: row.mv ? row.mv.trim() : 'chirp-v3-0'
    }

    // Eğer sadece gpt_description_prompt varsa, prompt'u boş bırak
    if (!row.prompt && row.gpt_description_prompt) {
      prompt.prompt = ''
    }

    return prompt
  }

  // Boolean parse et
  static parseBoolean (value) {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const lowercased = value.toLowerCase().trim()
      return ['true', '1', 'yes', 'evet', 'doğru'].includes(lowercased)
    }
    return false
  }

  // Örnek CSV dosyası oluştur
  async createSampleCsv (filePath = './data/templates/sample-batch.csv') {
    const sampleData = `prompt,tags,make_instrumental,title
"romantic jazz song about moonlit nights",jazz,false,"Moonlight Serenade"
"upbeat pop song about summer vacation",pop,false,"Summer Dreams"
"calm instrumental piano music",classical,true,"Piano Reflection"
"energetic rock song about freedom",rock,false,"Break Free"
"ambient electronic music for meditation",electronic,true,"Digital Zen"
"country song about hometown memories",country,false,"Home Sweet Home"
"blues song about overcoming struggles",blues,false,"Rising Strong"
"folk acoustic song about nature",folk,false,"Forest Whispers"`

    try {
      // Dizini oluştur
      const dir = filePath.substring(0, filePath.lastIndexOf('/'))
      await fs.mkdir(dir, { recursive: true })

      // Dosyayı yaz
      await fs.writeFile(filePath, sampleData)
      console.log(chalk.green(`✅ Örnek CSV dosyası oluşturuldu: ${filePath}`))
      this.logger.info('Örnek CSV dosyası oluşturuldu', { path: filePath })
    } catch (error) {
      console.error(chalk.red('❌ Örnek CSV oluşturma hatası:'), error.message)
      throw error
    }
  }

  // CSV dosyasını doğrula
  async validateCsv (filePath) {
    try {
      const prompts = await this.readPrompts(filePath)

      console.log(chalk.blue('\n📊 CSV Doğrulama Raporu:'))
      console.log(chalk.gray('-'.repeat(40)))
      console.log(chalk.white('Toplam satır: ') + chalk.green(prompts.length))

      // Türleri say
      const genreCounts = {}
      const instrumentalCount = prompts.filter(
        (p) => p.make_instrumental
      ).length

      prompts.forEach((p) => {
        genreCounts[p.tags] = (genreCounts[p.tags] || 0) + 1
      })

      console.log(
        chalk.white('Enstrümantal: ') + chalk.green(instrumentalCount)
      )
      console.log(
        chalk.white('Şarkı sözlü: ') +
          chalk.green(prompts.length - instrumentalCount)
      )

      console.log(chalk.blue('\nTür dağılımı:'))
      for (const [genre, count] of Object.entries(genreCounts)) {
        console.log(chalk.gray(`  ${genre}: ${count}`))
      }

      // Örnek promptları göster
      console.log(chalk.blue('\nÖrnek promptlar:'))
      prompts.slice(0, 3).forEach((prompt, index) => {
        console.log(
          chalk.gray(
            `  ${index + 1}. ${prompt.gpt_description_prompt || prompt.prompt}`
          )
        )
      })

      return true
    } catch (error) {
      console.error(chalk.red('❌ CSV doğrulama hatası:'), error.message)
      return false
    }
  }

  // CSV formatı hakkında yardım göster
  static showCsvHelp () {
    console.log(chalk.blue('\n📋 CSV Dosya Formatı Rehberi:'))
    console.log(chalk.gray('='.repeat(50)))

    console.log(chalk.white('\nGerekli sütunlar:'))
    console.log(
      chalk.green('• prompt') + chalk.gray(' - Özel şarkı sözleri (opsiyonel)')
    )
    console.log(
      chalk.green('• gpt_description_prompt') +
        chalk.gray(' - GPT ile şarkı açıklaması')
    )
    console.log(
      chalk.green('• tags') +
        chalk.gray(' - Müzik türü (pop, rock, jazz, vs.)')
    )
    console.log(
      chalk.green('• make_instrumental') +
        chalk.gray(' - Enstrümantal müzik (true/false)')
    )
    console.log(
      chalk.green('• title') + chalk.gray(' - Şarkı başlığı (opsiyonel)')
    )

    console.log(chalk.white('\nÖrnek CSV satırı:'))
    console.log(chalk.gray('"romantic jazz song","jazz","false","Love Song"'))

    console.log(chalk.white('\nDesteklenen boolean değerler:'))
    console.log(chalk.gray('true, 1, yes, evet, doğru = true'))
    console.log(chalk.gray('false, 0, no, hayır, yanlış = false'))

    console.log(chalk.yellow('\n💡 İpucu: Örnek CSV dosyası oluşturmak için:'))
    console.log(chalk.cyan('node src/cli/index.js batch --create-sample'))
  }
}

module.exports = CsvReader
