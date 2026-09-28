# Nuxt Minimal Starter

## Alur perangkat IoT

- Admin menambahkan perangkat di **Dashboard → Perangkat → Tambah perangkat**.
  Isi nama/lokasi, `namaNilai`, `satuanNilai`, threshold maksimum, dan nilai awal
  opsional. Perangkat dan threshold disimpan dalam satu transaksi.
- Setiap telemetri menyimpan satu `nilai` beserta snapshot nama dan satuannya.
  Alert aktif jika `nilai > threshold` dan selesai ketika nilai kembali di bawah
  atau sama dengan threshold.
- Batas global ada di `shared/iot.ts`: stale setelah 60 detik, offline setelah
  180 detik. Status dihitung dari `lastSeen`, bukan disimpan di database.
  Perangkat tanpa data ditampilkan offline; alert offline baru dibuat setelah
  tiga menit sejak pendaftaran. Alert offline direkonsiliasi saat API ringkasan
  atau daftar alert dibaca, dan diselesaikan ketika telemetri baru masuk.
- Simulator mengirim nilai untuk seluruh perangkat, memakai nama/satuan yang
  dikonfigurasi. Normal menghasilkan nilai ≤ threshold, random dapat melewati
  threshold, dan anomaly menjamin satu perangkat melewati threshold.
- Endpoint admin: `POST /api/devices` menerima
  `{ name, location?, namaNilai, satuanNilai, threshold, nilai? }`;
  `POST /api/telemetry` menerima `{ deviceId, nilai }` melalui sesi admin.
  Nilai dan threshold mendukung maksimal dua angka desimal.

### Migrasi dari skema tiga metrik

Jalankan `server/database/migrations/001_single_value.sql` **sekali** pada database
lama sebelum menjalankan versi baru. Migrasi menghapus data perangkat, telemetri,
threshold, dan alert lama; tabel autentikasi tetap tersedia. Database baru dapat
dibuat dari skema terbaru menggunakan `bun run db:push`.

### Seed data demo

```bash
bun run db:seed
```

Mengisi 5 perangkat demo dengan metrik berbeda, 5 threshold, 150 telemetri,
dan 4 alert (aktif, acknowledged, resolved, serta offline). Seluruh insert
dijalankan dalam satu transaksi. Perangkat demo yang sudah ada dilewati saat
seed dijalankan ulang. Timestamp relatif terhadap waktu seed pertama sehingga
kondisi segar/stale/offline akan berubah seiring waktu; simulator dapat dipakai
untuk menghasilkan pembacaan baru.

### Pemeriksaan

```bash
bun test
bun run check
bunx eslint .
bun run build
```

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
