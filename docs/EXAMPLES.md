# SunoToolkit Kullanım Örnekleri

## 1. Tek Şarkı Üretimi

### CLI ile:

```bash
node src/cli/index.js generate \
    --prompt "romantic jazz song about moonlit nights" \
    --tags jazz \
    --title "Moonlight Serenade"
```

### Web arayüzü ile:

1. http://localhost:3000 adresine gidin
2. "Suno AI Başlat" butonuna tıklayın
3. "Tek Şarkı" sekmesinde promptunuzu girin
4. "Şarkı Üret" butonuna tıklayın

## 2. Toplu Şarkı Üretimi

### CSV hazırlama:

```csv
prompt,tags,make_instrumental,title
"romantic jazz song",jazz,false,"Love Song"
"upbeat pop song",pop,false,"Happy Days"
"calm piano music",classical,true,"Peace"
```

### CLI ile çalıştırma:

```bash
node src/cli/index.js batch \
    --file data/templates/my-songs.csv \
    --delay 5000
```

## 3. Web Sunucusu Çalıştırma

```bash
# Varsayılan ayarlarla (localhost:3000)
node src/cli/index.js web

# Özel port ile
node src/cli/index.js web --port 8080 --host 0.0.0.0
```

## 4. Şarkı Sözü Üretimi

### CLI örneği yakında eklenecek...

### Web arayüzü ile:

1. "Şarkı Sözü" sekmesine gidin
2. Promptunuzu yazın: "love song about missing someone"
3. "Şarkı Sözü Üret" butonuna tıklayın
4. "Kopyala" butonu ile sonucu panoya kopyalayın

## 5. Gelişmiş Kullanım

### Cookie Ayarlama:

`config/settings.json` dosyasını düzenleyin:

```json
{
  "suno_cookie": "your_actual_cookie_here"
}
```

### Batch İşlemi İzleme:

Loglar `data/output/logs/` klasöründe tutulur.

### Çıktı Dosyalarını Bulma:

Üretilen şarkılar `data/output/songs/` klasöründe saklanır.

## 6. Sorun Giderme

### Cookie Hatası:

- Suno AI hesabınızdan cookie'yi alın
- `config/settings.json` dosyasına ekleyin

### Port Kullanımda Hatası:

- Farklı port kullanın: `--port 3001`
- Veya kullanımdaki servisi durdurun

### CSV Format Hatası:

- Dosyanın UTF-8 kodlamasında olduğundan emin olun
- Virgül ayırıcı kullanın
- Başlık satırını atlamamaya dikkat edin
