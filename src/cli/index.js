#!/usr/bin/env node

const { Command } = require('commander')
const chalk = require('chalk')
const figlet = require('figlet')
const generateCommand = require('./commands/generate')
const batchCommand = require('./commands/batch')
const webCommand = require('./commands/web')

const program = new Command()

// ASCII Banner göster
function showBanner () {
  console.clear()
  console.log(
    chalk.cyan(`
    ================================================
    |                                              |
    |           SUNO TOOLKIT v1.0                  |
    |        AI Muzik Uretim Arac Seti             |
    |                                              |
    ================================================
    `)
  )
  console.log(chalk.gray('='.repeat(60)))
}

// Program yapılandırması
program
  .name('suno-toolkit')
  .description(chalk.green('AI tabanlı müzik üretim araç seti'))
  .version('1.0.0')
  .hook('preAction', () => {
    showBanner()
  })

// Komutları ekle
program
  .command('generate')
  .alias('gen')
  .description('Tek şarkı üretimi')
  .option('-p, --prompt <text>', 'Şarkı promptu')
  .option('-t, --tags <genre>', 'Müzik türü', 'pop')
  .option('-i, --instrumental', 'Enstrümantal müzik')
  .option('-o, --output <dir>', 'Çıktı klasörü', './data/output/songs')
  .action(generateCommand)

program
  .command('batch')
  .alias('b')
  .description('Toplu şarkı üretimi')
  .option('-f, --file <path>', 'CSV dosya yolu')
  .option('-o, --output <dir>', 'Çıktı klasörü', './data/output/songs')
  .option('-d, --delay <ms>', 'İstekler arası bekleme süresi', '5000')
  .action(batchCommand)

program
  .command('web')
  .alias('w')
  .description('Web arayüzünü başlat')
  .option('-p, --port <number>', 'Port numarası', '3000')
  .option('--host <ip>', 'Host adresi', 'localhost')
  .action(webCommand)

program
  .command('status')
  .description('Sistem durumu ve istatistikler')
  .action(() => {
    console.log(chalk.blue('\n📊 Sistem Durumu:\n'))
    console.log(
      chalk.white('• Node.js Versiyonu: ') + chalk.green(process.version)
    )
    console.log(chalk.white('• Platform: ') + chalk.green(process.platform))
    console.log(
      chalk.white('• Bellek Kullanımı: ') +
        chalk.green(
          Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
        )
    )
    console.log(chalk.white('• Çalışma Dizini: ') + chalk.green(process.cwd()))
    console.log()
  })

// Komut verilmemişse yardım göster
if (!process.argv.slice(2).length) {
  showBanner()
  program.outputHelp()
  process.exit(0)
}

// Programı çalıştır
program.parse()
