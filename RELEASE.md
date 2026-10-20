# Arcaw: exe üretme ve uzaktan güncelleme

## 1) Bir kez yapılacak hazırlık
- Node.js 20 veya üzeri kurulu olmalı.
- Proje klasöründe: `npm install`

## 2) exe (kurulum dosyası) üretme
```
npm run dist
```
Çıktı: `dist/Arcaw-Setup-1.0.0.exe` (Windows x64 kurulum dosyası).
Bu dosyayı çalıştırınca Arcaw kurulur, masaüstü ve başlat menüsü kısayolu oluşur.

Tek dosyalık taşınabilir sürüm: `npm run dist:portable` (kendini güncelleyemez).

Build sırasında "Cannot create symbolic link" hatası alırsanız: Windows Ayarlar > Geliştirici
Modu'nu açın veya PowerShell'i yönetici olarak çalıştırın.

## 3) Uzaktan güncelleme (GitHub Releases, ücretsiz)
Bir kez:
1. github.com'da **public** bir depo açın (örn. `arcaw`).
2. `package.json` içinde `build.publish[0].owner` değerini GitHub kullanıcı adınızla değiştirin
   (`repo` adı farklıysa onu da).
3. GitHub > Settings > Developer settings > Personal access tokens: `repo` yetkili bir token üretin.

Her yeni sürümde:
1. `package.json` içindeki `version` değerini artırın (1.0.0 -> 1.0.1). Her sürüm bir öncekinden büyük olmalı.
2. PowerShell:
   ```
   $env:GH_TOKEN="ghp_xxxxxxxx"
   npm run release
   ```
   Bu komut exe'yi üretir ve GitHub'da bir Release oluşturup `Arcaw-Setup-x.y.z.exe`,
   `latest.yml` ve `.blockmap` dosyalarını yükler.

Kullanıcıda olanlar: Arcaw açıldıktan 8 saniye sonra ve her 4 saatte bir yeni sürümü kontrol eder,
arka planda indirir, durum çubuğunda yeşil **Restart to update** düğmesi çıkar. Tıklayınca kapanıp
kendini günceller ve yeniden açılır. Tıklamasa bile uygulama kapanırken güncelleme kurulur.
Elle kontrol: Help > Check for Updates…

İlk sürümü (1.0.0) kullanıcılara elle kurdurmanız gerekir; sonrakiler kendiliğinden güncellenir.

## 4) Kendi sunucunuz kullanılacaksa (GitHub yerine)
`package.json` > `build.publish` değerini şununla değiştirin:
```
"publish": [{ "provider": "generic", "url": "https://siteniz.com/arcaw/" }]
```
`npm run dist` sonrası `dist/` içindeki `Arcaw-Setup-x.y.z.exe`, `latest.yml` ve `.blockmap`
dosyalarını o adrese yükleyin.

## Bilmeniz gerekenler
- Uygulama imzasız olduğu için Windows SmartScreen ilk kurulumda "Windows bilgisayarınızı korudu"
  uyarısı gösterebilir: "Daha fazla bilgi" > "Yine de çalıştır". Kod imzalama sertifikası alırsanız kalkar.
- Güncelleme yalnızca kurulum (Setup) sürümünde çalışır; portable ve `npm start` ile çalışmaz.
- Private GitHub deposu kullanıcı tarafında token gerektirir; bu yüzden public depo ya da kendi sunucunuz önerilir.
