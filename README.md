<div align="center">

# 🚀 Task Flow

**Zamonaviy | Real-time | Ko'p tillilik | Xavfsiz**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-mini--to--do--app--two.vercel.app-2563eb?style=for-the-badge)](https://mini-to-do-app-two.vercel.app)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-ff9100?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?style=for-the-badge&logo=vite)](https://vite.dev/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)

---

*React 19, Vite va Google Firebase yordamida yaratilgan zamonaviy, real-time, ko'p tilli vazifalar boshqaruv ilovasi.*

</div>

---

## 📸 Skrinshotlar / Screenshots

### 1. 🔐 Login Sahifasi — Dark Mode
![Task Flow Login](public/screenshots/Screenshot%202026-11-07%20at%2012.35.10.png)

### 2. 🌞 Asosiy Dashboard — Light Mode
![Task Flow Dashboard Light](public/screenshots/Screenshot%202026-11-07%20at%2012.35.37.png)

### 3. 🌙 Asosiy Dashboard — Dark Mode
![Task Flow Dashboard Dark](public/screenshots/Screenshot%202026-11-07%20at%2012.35.46.png)

### 4. ✅ Vazifa Qo'shish va Boshqarish
![Task Flow Add Task](public/screenshots/Screenshot%202026-11-07%20at%2012.36.33.png)

---

## ✨ Asosiy Imkoniyatlar

| Xususiyat | Tavsif |
|-----------|--------|
| 🔐 **Xavfsiz Autentifikatsiya** | Email/Parol va Google Sign-In orqali kirish. Faqat ro'yxatdan o'tgan foydalanuvchilar ilovani ishlatishi mumkin |
| ⚡ **Real-time Sinxronizatsiya** | Firebase Firestore `onSnapshot` orqali sahifani yangilamasdan jonli yangilanadi |
| 🌍 **3 Ta Til** | O'zbekcha 🇺🇿, Русский 🇷🇺, English 🇬🇧 — bir tugmada to'liq interfeys tarjimasi |
| 💙 **Ko'zga Yoqimli Dizayn** | Ko'zni charchatmaydigan yumshoq Blue Gradient + Dark/Light mavzular |
| 🏷 **Kategoriyalar** | 💼 Ish, 📚 O'qish, 🏠 Shaxsiy, ⚡ Tezkor, 💡 G'oya |
| 🎯 **Muhimlik Darajalari** | 🔴 Yuqori, 🟡 O'rta, 🟢 Oddiy — rangli ko'rsatkichlar bilan |
| 📅 **Muddat (Deadline) Kuzatuvi** | O'tgan muddatlar ⚠️ qizil, bugungilar 📅 sariq bilan belgilanadi |
| ⏱️ **Fokus Taymeri** | Stopwatch va Pomodoro (25 daqiqa) rejimlari, sarflangan vaqt saqlanadi |
| 🔍 **Qidiruv va Filtrlar** | Oniy qidiruv + Status filtrlari (Faol/Bajarilgan) + Kategoriya chiplari |
| ✏️ **Inline Tahrirlash** | Vazifani tashlamasdan, to'g'ridan-to'g'ri o'zgartirish |
| 🎉 **Konfetti va Ovoz** | Vazifa bajarilganda Canvas konfetti + Web Audio API chimi |
| 📊 **Progress Bar** | Bajarilganlar foizi real-vaqtda animatsiyali ko'rsatiladi |

---

## 🛠 Texnologiyalar Steki

```
Frontend:    React 19 + Vite 8
Auth:        Firebase Authentication (Email/Password + Google OAuth)
Database:    Firebase Cloud Firestore (Real-time)
Hosting:     Vercel (CI/CD GitHubdan avtomatik)
Linter:      Oxlint
Vizual FX:   Web Audio API + HTML5 Canvas (Confetti)
```

---

## 🚀 Ishga Tushirish

### 1. Repozitoriyani klonlash
```bash
git clone https://github.com/Rajabaliyev01/Mini-ToDo-app.git
cd Mini-ToDo-app
```

### 2. Paketlarni o'rnatish
```bash
npm install
```

### 3. Environment Variables (.env)
Loyiha papkasida `.env` fayli yarating:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

> **Firebase Console:** [console.firebase.google.com](https://console.firebase.google.com) → Loyihangiz → Authentication (Email/Password + Google yoqing) → Firestore Database yarating.

### 4. Dasturni ishga tushirish
```bash
npm run dev
```
Brauzerda: `http://localhost:5173`

### 5. Production build
```bash
npm run build
```

---

## 📁 Loyiha Tuzilishi

```
mini-todo-app/
├── src/
│   ├── App.jsx         # Asosiy React komponenti (Auth + App logikasi)
│   ├── App.css         # To'liq CSS (Dark/Light mavzular, Blue Gradient)
│   ├── firebase.js     # Firebase konfiguratsiyasi va Auth eksportlari
│   ├── main.jsx        # React kirish nuqtasi
│   └── index.css       # Global bazaviy uslublar
├── .env                # Firebase kalitlari (gitga yuklanmaydi)
├── .gitignore
├── vite.config.js
└── package.json
```

---

## 🔐 Xavfsizlik

- Firebase API kalitlari `.env` faylida, hech qachon GitHubga yuklanmaydi
- Vercel Environment Variables (Config turi) orqali boshqariladi
- Faqat ro'yxatdan o'tgan foydalanuvchilar o'z ma'lumotlarini ko'ra oladi
- Har bir foydalanuvchi faqat o'zining vazifalarini ko'radi (`userId` filtri)

---

## 👨‍💻 Muallif

**Javohir Rajabaliyev** — [github.com/Rajabaliyev01](https://github.com/Rajabaliyev01)

> *"Kichik qadamlar katta muvaffaqiyatlarga olib boradi 💪"*
