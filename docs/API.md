# SunoToolkit Web API Rehberi

## Endpoint'ler

### Sistem Durumu

`GET /api/status`

- Sunucu ve Suno AI durumunu kontrol eder
- Response: `{ server: 'running', sunoInitialized: boolean, ... }`

### Suno AI Başlatma

`POST /api/init`

- Suno AI bağlantısını başlatır
- Response: `{ success: boolean, remainingLimit: number }`

### Tek Şarkı Üretimi

`POST /api/generate`

- Body: `{ prompt, gpt_description_prompt, tags, make_instrumental, title }`
- Response: `{ success: boolean, songs: [...] }`

### Toplu Üretim

`POST /api/batch-upload`

- Multipart form data ile CSV dosyası yükler
- Response: `{ success: boolean, promptCount: number }`

### Şarkı Sözü Üretimi

`POST /api/lyrics`

- Body: `{ prompt: string }`
- Response: `{ success: boolean, lyrics: string }`

### Şarkı Listesi

`GET /api/songs`

- Tüm şarkıları listeler
- Response: `{ success: boolean, songs: [...] }`

### Metadata

`POST /api/metadata`

- Body: `{ ids: string[] }`
- Response: `{ success: boolean, metadata: [...] }`

## Hata Kodları

- `400`: Hatalı istek
- `500`: Sunucu hatası
- `404`: Endpoint bulunamadı

## Kullanım Örnekleri

### JavaScript ile Şarkı Üretimi

```javascript
const response = await fetch("/api/generate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    gpt_description_prompt: "romantic jazz song",
    tags: "jazz",
    make_instrumental: false,
  }),
});

const data = await response.json();
```

### CSV Yükleme

```javascript
const formData = new FormData();
formData.append("csvFile", fileInput.files[0]);
formData.append("delay", "5000");

const response = await fetch("/api/batch-upload", {
  method: "POST",
  body: formData,
});
```
