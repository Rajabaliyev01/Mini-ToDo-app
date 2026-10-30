# 🚀 Task Flow — Zamonaviy Real-time ToDo App

> **React 19**, **Vite** va **Google Firebase (Cloud Firestore)** yordamida yaratilgan, yuqori darajadagi foydalanuvchi tajribasi (UX) va interaktivlikka ega zamonaviy vazifalar boshqaruv ilovasi.

---

## ✨ Asosiy Imkoniyatlari (Features)

- ⚡ **Real-time Sinxronizatsiya:** Google Cloud Firestore `onSnapshot` litseneri orqali sahifani yangilamasdan jonli yangilanadi.
- 🎨 **Zamonaviy Glassmorphism Dizayn:** 
  - 🌙 **Dark** va ☀️ **Light** mavzular (sozlama xotirada saqlanadi).
  - Yengil animatsiyalar, mikro-interaksiyalar va zamonaviy ranglar palitrasi.
- 📊 **Interaktiv Progress Bar va Motivatsiya:**
  - Bajarilgan vazifalar foizini real vaqtda ko'rsatuvchi dinamik progress bar.
  - Har bir natijaga mos motivatsion tavsiyalar.
- 🎉 **Konfetti (Salute) va Ovoz Effektlari:**
  - Vazifani bajarganda yoqimli chertish ovozi (Web Audio API orqali, hech qanday og'ir audio fayllarsiz).
  - Vazifa yakunlanganda yorqin konfetti effekti.
- 🏷 **Kategoriyalar va Muhimlik Darajalari:**
  - 💼 Ish, 📚 O'qish, 🏠 Shaxsiy, ⚡ Tezkor, 💡 G'oya.
  - 🔴 Yuqori, 🟡 O'rta, 🟢 Oddiy muhimlik indikatorlari.
- 🔍 **Tezkor Qidiruv va Filtrlar:**
  - Vazifalar bo'yicha oniy qidiruv.
  - "Barchasi", "Faol" va "Bajarilgan" tablari.
  - Kategoriyalar bo'yicha chip-filtrlar.
- ✏️ **Inline Tahrirlash (Edit):** Vazifani o'chirmasdan turib, matnini to'g'ridan-to'g'ri o'zgartirish.
- 🧹 **Ommaviy tozalash (Bulk Action):** Bajarilgan vazifalarni bir tugma bilan tozalash.
- 🔒 **To'liq Xavfsizlik:** API kalitlar `.env` faylida himoyalangan.

---

## 🛠 Texnologiyalar steki (Tech Stack)

- **Frontend:** [React 19](https://react.dev/), [Vite](https://vite.dev/)
- **Backend / Database:** [Google Firebase Firestore](https://firebase.google.com/)
- **Ovoz & Vizual:** Web Audio API & HTML5 Canvas Confetti
- **Linter:** [Oxlint](https://oxc.rs/)

---

## 🚀 Ishga tushirish (Getting Started)

### 1. Repozitoriyani yuklab olish
```bash
git clone https://github.com/Rajabaliyev01/Mini-ToDo-app.git
cd Mini-ToDo-app
```

### 2. Bog'liqliklarni o'rnatish
```bash
npm install
```

### 3. Konfiguratsiya (.env)
Loyihada `.env` fayli oching va Firebase kalitlaringizni kiriting:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Dasturni ishga tushirish
```bash
npm run dev
```
Brauzerda `http://localhost:5173` manzilini oching.

---

## 👨‍💻 Muallif

- **Javohir** — [GitHub Profil](https://github.com/Rajabaliyev01)
