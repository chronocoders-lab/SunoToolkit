# SunoToolkit Komut Rehberi

## CLI Komutları

### Temel Kullanım

```bash
# Yardım
node src/cli/index.js --help

# Tek şarkı üretimi
node src/cli/index.js generate --prompt "romantic jazz song"

# Toplu üretim
node src/cli/index.js batch --file data/templates/prompts.csv

# Web arayüzü
node src/cli/index.js web --port 3000
```

### Generate Komutu

```bash
node src/cli/index.js generate [seçenekler]

Seçenekler:
  -p, --prompt <text>     Şarkı promptu
  -t, --tags <genre>      Müzik türü (default: pop)
  -i, --instrumental      Enstrümantal müzik
  -o, --output <dir>      Çıktı klasörü
```

### Batch Komutu

```bash
node src/cli/index.js batch [seçenekler]

Seçenekler:
  -f, --file <path>       CSV dosya yolu
  -o, --output <dir>      Çıktı klasörü
  -d, --delay <ms>        İstekler arası bekleme (default: 5000)
```

### Web Komutu

```bash
node src/cli/index.js web [seçenekler]

Seçenekler:
  -p, --port <number>     Port numarası (default: 3000)
  --host <ip>             Host adresi (default: localhost)
```

## CSV Dosya Formatı

CSV dosyalarınız şu sütunları içermelidir:

| Sütun                  | Açıklama                  | Zorunlu |
| ---------------------- | ------------------------- | ------- |
| prompt                 | Özel şarkı sözleri        | Hayır   |
| gpt_description_prompt | GPT için açıklama         | Evet    |
| tags                   | Müzik türü                | Hayır   |
| make_instrumental      | Enstrümantal (true/false) | Hayır   |
| title                  | Şarkı başlığı             | Hayır   |

### Örnek CSV:

```csv
prompt,tags,make_instrumental,title
"romantic jazz song about love",jazz,false,"My Love Song"
"upbeat pop song",pop,false,""
"calm instrumental music",ambient,true,"Peaceful Moment"
```
