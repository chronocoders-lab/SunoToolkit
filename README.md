# 🎵 SunoToolkit - AI Müzik Üretim Araç Seti

**Suno AI** entegrasyonu ile güçlü, kullanıcı dostu müzik üretim araç seti.

## ✨ Özellikler

### 🎯 Temel Özellikler

- **Tek Şarkı Üretimi** - İnteraktif CLI ile hızlı üretim
- **Toplu Şarkı Üretimi** - CSV dosyalarından yüzlerce şarkı
- **Web Arayüzü** - Modern, responsive web interface
- **Şarkı Sözü Üretimi** - AI destekli lyrics üretimi

### 🛠️ Teknik Özellikler

- **Cross-platform** - Windows, macOS, Linux desteği
- **ASCII Art** - Güzel konsol çıktıları (emoji yok!)
- **Logging** - Detaylı işlem logları
- **Hata Yönetimi** - Sağlam hata yakalama ve raporlama
- **Dosya Yönetimi** - Otomatik dosya organizasyonu

## 🚀 Hızlı Başlangıç

### 1. Kurulum

```bash
# Projeyi indirin
git clone https://github.com/username/suno-toolkit
cd suno-toolkit

# Bağımlılıkları yükleyin
npm install

# Proje yapısını oluşturun
npm run setup
```

### 2. Konfigürasyon

`config/settings.json` dosyasını düzenleyin:

```json
{
  "suno_cookie": "your_suno_ai_cookie_here"
}
```

### 3. İlk Şarkınızı Üretin

```bash
# CLI ile
node src/cli/index.js generate --prompt "romantic jazz song"

# Web arayüzü ile
node src/cli/index.js web
# http://localhost:3000 adresine gidin
```

## 📋 Kullanım Rehberi

### CLI Komutları

#### Tek Şarkı Üretimi

```bash
node src/cli/index.js generate [seçenekler]

# Örnekler:
node src/cli/index.js generate --prompt "upbeat pop song"
node src/cli/index.js generate --prompt "calm piano" --instrumental
node src/cli/index.js generate --prompt "rock anthem" --tags rock --title "Freedom"
```

#### Toplu Şarkı Üretimi

```bash
node src/cli/index.js batch --file data/templates/prompts.csv

# Özel ayarlarla:
node src/cli/index.js batch \
    --file my-songs.csv \
    --delay 3000 \
    --output ./my-output/
```

#### Web Arayüzü

```bash
node src/cli/index.js web --port 3000 --host localhost
```

### CSV Dosya Formatı

```csv
prompt,tags,make_instrumental,title
"romantic jazz song about love",jazz,false,"My Love Song"
"upbeat electronic dance music",electronic,true,"Dance Floor"
"acoustic folk song about nature",folk,false,"Forest Path"
```

### Web Arayüzü Özellikleri

- 🎵 **Tek Şarkı Üretimi** - Form tabanlı müzik üretimi
- 📦 **Toplu İşlem** - CSV drag & drop desteği
- ✍️ **Şarkı Sözü** - AI destekli lyrics üretimi
- 📁 **Şarkı Yönetimi** - Üretilen şarkıları görüntüleme
- 📊 **İstatistikler** - Gerçek zamanlı durum takibi

## 📁 Proje Yapısı

```
SunoToolkit/
├── src/
│   ├── cli/           # CLI komutları
│   ├── core/          # Ana işlevsellik
│   ├── web/           # Web sunucu
│   └── batch/         # Toplu işlem
├── data/
│   ├── templates/     # Örnek CSV'ler
│   └── output/        # Çıktı dosyaları
├── config/            # Konfigürasyon
├── docs/              # Belgeler
└── scripts/           # Yardımcı scriptler
```

## ⚙️ Konfigürasyon

### Temel Ayarlar

```json
{
  "suno_cookie": "cookie_buraya",
  "default_settings": {
    "output_directory": "./data/output/songs",
    "default_delay": 5000,
    "default_music_genre": "pop"
  }
}
```

### Web Sunucu Ayarları

```json
{
  "web_server": {
    "default_port": 3000,
    "default_host": "localhost",
    "max_upload_size": "5mb"
  }
}
```

## 🐛 Sorun Giderme

### Sık Karşılaşılan Hatalar

#### Cookie Hatası

```
HATA: Cookie bulunamadı!
```

**Çözüm:** `config/settings.json` dosyasında `suno_cookie` alanını doldurun.

#### Port Kullanımda Hatası

```
HATA: Port 3000 kullanımda
```

**Çözüm:** Farklı port kullanın: `--port 3001`

#### CSV Format Hatası

```
HATA: CSV dosyasında prompt alanı bulunamadı
```

**Çözüm:** CSV başlıklarını kontrol edin: `prompt,tags,make_instrumental,title`

### Log Dosyaları

- İşlem logları: `data/output/logs/`
- Hata detayları: `data/output/logs/batch-errors-*.json`

## 🤝 Katkıda Bulunma

1. Bu repo'yu fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

MIT License - detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🙏 Teşekkürler

- [Suno AI](https://suno.ai) - Müzik üretim API'si
- [itsbrex/suno-ai](https://github.com/itsbrex/suno-ai) - Node.js kütüphanesi

## 🔗 Bağlantılar

- [API Belgesi](docs/API.md)
- [Komut Rehberi](docs/COMMANDS.md)
- [Kullanım Örnekleri](docs/EXAMPLES.md)

---

**🎵 Müzik üretmeye başlayın!**

```bash
npm run setup
node src/cli/index.js web
```
