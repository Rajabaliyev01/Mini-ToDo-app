# 📝 Real-time Mini ToDo App

> React 19, Vite va Google Firebase (Cloud Firestore) yordamida yaratilgan real vaqt rejimida sinxronlashuvchi vazifalar boshqaruv ilovasi.

---

## ✨ Imkoniyatlari (Features)

- ⚡ **Real-time Synchronization:** `onSnapshot` yordamida ma'lumotlar sahifani yangilamasdan avtomatik sinxronlanadi.
- 🎯 **To'liq CRUD:**
  - **Create:** Yangi vazifa qo'shish (server vaqti bilan).
  - **Read:** Vazifalarni vaqti bo'yicha saralangan holda olish (`orderBy`).
  - **Update:** Vazifa holatini o'zgartirish (bajarildi / kutilmoqda).
  - **Delete:** Vazifani o'chirish.
- 🔒 **Xavfsiz sozlamalar:** API kalitlar `.env` faylida saqlanadi.
- 📱 **Sodda va qulay interfeys:** Toza dizayn, yuklanish indikatori va bo'sh holat xabari.

---

## 🛠 Texnologiyalar steki (Tech Stack)

- **Frontend:** [React 19](https://react.dev/), [Vite](https://vite.dev/)
- **Backend / Database:** [Google Firebase](https://firebase.google.com/) (Cloud Firestore)
- **Linter:** [Oxlint](https://oxc.rs/)

---

## 🚀 Loyihani ishga tushirish (Getting Started)

### 1. Repozitoriyani klonlash
```bash
git clone https://github.com/Rajabaliyev01/mini-todo-app.git
cd mini-todo-app
```

### 2. Bog'liqliklarni o'rnatish
```bash
npm install
```

### 3. Muhit o'zgaruvchilarini sozlash (.env)
Loyihaning asosiy papkasida `.env` faylini yarating va Firebase konfiguratsiya kalitlaringizni kiriting:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```
*(Namuna uchun `.env.example` faylidan foydalanishingiz mumkin)*

### 4. Dasturni ishga tushirish
```bash
npm run dev
```

Brauzerda `http://localhost:5173` manzilini oching.

---

## 👨‍💻 Muallif

- **Javohir** — [GitHub Profil](https://github.com/Rajabaliyev01)
