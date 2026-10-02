# 🔐 Alamli Status — Maxfiy versiya

Bu versiyada saytga kirish uchun maxfiy kod kerak.

## Standart kod

**7777**

Koddan foydalanib kirgandan keyin status va rasm joylash mumkin.

## Ishga tushirish

Node.js o‘rnatilgan bo‘lsin.

Terminalda loyiha papkasiga kiring:

```bash
npm install
npm start
```

Keyin:

```text
http://localhost:3000
```

## Maxfiy kodni o‘zgartirish

`server.js` ichidagi:

```js
const ACCESS_CODE = process.env.ALAMLI_CODE || "7777";
```

`7777` o‘rniga o‘zingizning kodingizni yozishingiz mumkin.

Masalan:

```js
const ACCESS_CODE = process.env.ALAMLI_CODE || "2468";
```

Internetga joylashtirganda environment variable ishlatish tavsiya qilinadi:

```bash
ALAMLI_CODE=2468 npm start
```

## Saqlanishi

- `alamli.db` — SQLite baza.
- `uploads/` — yuklangan rasmlar.
- Statuslar va rasmlar serverda saqlanadi.

## Muhim

Bu loyiha boshlang‘ich maxfiy sayt uchun. Internetga ochiq chiqarishdan oldin HTTPS, kuchli session secret, login urinishlarini cheklash va admin/foydalanuvchi tizimini qo‘shish tavsiya etiladi.
