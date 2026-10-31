import { useState, useEffect, useMemo, useRef } from 'react';
import {
  db,
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from './firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import './App.css';

// 3 tillik tarjima lug'ati (O'zbekcha, Ruscha, Inglizcha)
const TRANSLATIONS = {
  uz: {
    appTitle: 'Task Flow',
    appSubtitle: 'Aqlli va qulay rejalashtiruvchi',
    authCardTitleLogin: 'Tizimga kirish',
    authCardTitleRegister: 'Yangi hisob ochish',
    authCardDesc: 'Rejalaringiz xavfsiz saqlanadi va barcha qurilmalaringizda sinxronlanadi.',
    tabLogin: 'Kirish',
    tabRegister: 'Roʻyxatdan oʻtish',
    nameLabel: 'Ismingiz',
    namePlaceholder: 'Masalan: Javohir',
    emailLabel: 'Email manzilingiz',
    emailPlaceholder: 'nomi@email.com',
    passLabel: 'Parol (kamida 6 ta belgi)',
    passPlaceholder: '••••••••',
    btnLoginSubmit: 'Tizimga kirish',
    btnRegisterSubmit: 'Hisob yaratish',
    btnGoogle: 'Google orqali davom etish',
    orDivider: 'yoki',
    loading: 'Yuklanmoqda...',
    accountBadge: 'Akkaunt',
    logout: 'Chiqish 🚪',
    dailyResult: 'Kunlik Natija',
    inputPlaceholder: 'Qanday rejangiz bor? Masalan: Loyiha hisobotini topshirish...',
    btnAdd: '+ Qoʻshish',
    deadlineTooltip: 'Bajarilish muddati',
    searchPlaceholder: 'Vazifalarni qidirish...',
    tabAll: 'Barchasi',
    tabActive: 'Faol',
    tabCompleted: 'Bajarilgan',
    stateEmptyTitle: 'Hech qanday vazifa yoʻq',
    stateEmptyDesc: 'Yangi vazifa kiritib boshlang',
    stateSearchEmptyTitle: 'Hech narsa topilmadi',
    stateSearchEmptyDesc: 'Boshqa soʻz bilan qidirib koʻring',
    stateCompletedEmptyTitle: 'Hali bajarilgan vazifalar yoʻq',
    stateCompletedEmptyDesc: 'Rejalaringizni bajaring va bu yerda koʻring',
    stateSyncing: 'Vazifalaringiz sinxronlanmoqda',
    focusPrefix: '🎯 Fokus:',
    modeStopwatch: '⏱️ Sekundnomer',
    modePomodoro: '🍅 Pomodoro',
    btnTimerStart: '▶️ Boshlash',
    btnTimerPause: '⏸ Toʻxtatish',
    btnTimerSave: '💾 Vaqtni saqlash',
    btnSaveEdit: 'Saqlash',
    btnCancelEdit: 'Bekor',
    btnDoneTooltip: 'Bajarildi deb belgilash',
    btnUndoTooltip: 'Qaytarish',
    btnFocusTooltip: 'Fokus / Sekundnomer bilan ishlash',
    btnEditTooltip: 'Tahrirlash',
    btnDeleteTooltip: 'Oʻchirish',
    footerTasksCompleted: '{count} ta vazifa bajarildi',
    btnClearCompleted: 'Bajarilganlarni tozalash',
    confirmClear: '{count} ta bajarilgan vazifani oʻchirib tashlamoqchimisiz?',
    pomodoroAlert: '🍅 Pomodoro vaqti tugadi! Ajoyib fokus!',
    saveTimeAlert: '⏱️ {min} daqiqa vazifaga muvaffaqiyatli saqlandi!',
    motivationEmpty: 'Bugungi rejalaringizni qoʻshing! ✍️',
    motivationFull: 'Barcha vazifalar bajarildi! Ajoyib natija! 🏆🎉',
    motivationHalf: 'Rejaning yarmidan koʻpi tayyor! Shunday davom eting 🚀',
    motivationStart: 'Kichik qadamlar katta muvaffaqiyatlarga olib boradi 💪',
    deadlineOverdue: '⚠️ Muddati oʻtgan',
    deadlineToday: '📅 Bugun',
    durationLessMinute: '⚡ 1 daqiqadan kam',
    durationMinutes: '⏱️ {min} daqiqada',
    durationHours: '⏱️ {hours} soatda',
    durationDays: '📅 {days} kunda',
    categories: {
      all: 'Barchasi',
      work: 'Ish',
      study: 'Oʻqish',
      personal: 'Shaxsiy',
      urgent: 'Tezkor',
      idea: 'Gʻoya'
    },
    priorities: {
      high: 'Yuqori',
      medium: 'Oʻrta',
      low: 'Oddiy'
    }
  },
  ru: {
    appTitle: 'Task Flow',
    appSubtitle: 'Умный и удобный планировщик задач',
    authCardTitleLogin: 'Вход в систему',
    authCardTitleRegister: 'Создать аккаунт',
    authCardDesc: 'Ваши задачи надежно сохраняются и синхронизируются на всех устройствах.',
    tabLogin: 'Вход',
    tabRegister: 'Регистрация',
    nameLabel: 'Ваше имя',
    namePlaceholder: 'Например: Жавохир',
    emailLabel: 'Электронная почта',
    emailPlaceholder: 'name@email.com',
    passLabel: 'Пароль (минимум 6 символов)',
    passPlaceholder: '••••••••',
    btnLoginSubmit: 'Войти',
    btnRegisterSubmit: 'Зарегистрироваться',
    btnGoogle: 'Продолжить через Google',
    orDivider: 'или',
    loading: 'Загрузка...',
    accountBadge: 'Аккаунт',
    logout: 'Выйти 🚪',
    dailyResult: 'Дневной прогресс',
    inputPlaceholder: 'Какая у вас задача? Например: сдать отчет по проекту...',
    btnAdd: '+ Добавить',
    deadlineTooltip: 'Срок выполнения',
    searchPlaceholder: 'Поиск задач...',
    tabAll: 'Все',
    tabActive: 'Активные',
    tabCompleted: 'Выполненные',
    stateEmptyTitle: 'Задач пока нет',
    stateEmptyDesc: 'Начните с добавления новой задачи',
    stateSearchEmptyTitle: 'Ничего не найдено',
    stateSearchEmptyDesc: 'Попробуйте поискать по-другому',
    stateCompletedEmptyTitle: 'Пока нет выполненных задач',
    stateCompletedEmptyDesc: 'Выполняйте дела и они появятся здесь',
    stateSyncing: 'Синхронизация ваших задач',
    focusPrefix: '🎯 Фокус:',
    modeStopwatch: '⏱️ Секундомер',
    modePomodoro: '🍅 Помидор',
    btnTimerStart: '▶️ Старт',
    btnTimerPause: '⏸ Пауза',
    btnTimerSave: '💾 Сохранить время',
    btnSaveEdit: 'Сохранить',
    btnCancelEdit: 'Отмена',
    btnDoneTooltip: 'Отметить выполненным',
    btnUndoTooltip: 'Вернуть в активные',
    btnFocusTooltip: 'Работать с фокусом / секундомером',
    btnEditTooltip: 'Редактировать',
    btnDeleteTooltip: 'Удалить',
    footerTasksCompleted: 'Выполнено задач: {count}',
    btnClearCompleted: 'Очистить выполненные',
    confirmClear: 'Удалить {count} выполненных задач?',
    pomodoroAlert: '🍅 Время Pomodoro истекло! Отличная работа!',
    saveTimeAlert: '⏱️ {min} мин успешно сохранено в задаче!',
    motivationEmpty: 'Добавьте задачи на сегодня! ✍️',
    motivationFull: 'Все задачи выполнены! Отличный результат! 🏆🎉',
    motivationHalf: 'Больше половины готово! Так держать 🚀',
    motivationStart: 'Маленькие шаги ведут к большим победам 💪',
    deadlineOverdue: '⚠️ Просрочено',
    deadlineToday: '📅 Сегодня',
    durationLessMinute: '⚡ Меньше 1 мин',
    durationMinutes: '⏱️ За {min} мин',
    durationHours: '⏱️ За {hours} ч',
    durationDays: '📅 За {days} дн',
    categories: {
      all: 'Все',
      work: 'Работа',
      study: 'Учёба',
      personal: 'Личное',
      urgent: 'Срочно',
      idea: 'Идея'
    },
    priorities: {
      high: 'Высокий',
      medium: 'Средний',
      low: 'Низкий'
    }
  },
  en: {
    appTitle: 'Task Flow',
    appSubtitle: 'Smart and elegant productivity planner',
    authCardTitleLogin: 'Welcome Back',
    authCardTitleRegister: 'Create Account',
    authCardDesc: 'Your tasks stay safe and synchronized in real-time across all devices.',
    tabLogin: 'Sign In',
    tabRegister: 'Sign Up',
    nameLabel: 'Your Name',
    namePlaceholder: 'e.g. Javohir',
    emailLabel: 'Email Address',
    emailPlaceholder: 'name@email.com',
    passLabel: 'Password (at least 6 characters)',
    passPlaceholder: '••••••••',
    btnLoginSubmit: 'Sign In',
    btnRegisterSubmit: 'Create Account',
    btnGoogle: 'Continue with Google',
    orDivider: 'or',
    loading: 'Loading...',
    accountBadge: 'Account',
    logout: 'Logout 🚪',
    dailyResult: 'Daily Progress',
    inputPlaceholder: "What's on your mind? e.g. submit project report...",
    btnAdd: '+ Add Task',
    deadlineTooltip: 'Deadline date',
    searchPlaceholder: 'Search tasks...',
    tabAll: 'All',
    tabActive: 'Active',
    tabCompleted: 'Completed',
    stateEmptyTitle: 'No tasks yet',
    stateEmptyDesc: 'Start by adding your first task above',
    stateSearchEmptyTitle: 'Nothing found',
    stateSearchEmptyDesc: 'Try searching with different keywords',
    stateCompletedEmptyTitle: 'No completed tasks yet',
    stateCompletedEmptyDesc: 'Complete tasks to see your history here',
    stateSyncing: 'Synchronizing your tasks',
    focusPrefix: '🎯 Focus:',
    modeStopwatch: '⏱️ Stopwatch',
    modePomodoro: '🍅 Pomodoro',
    btnTimerStart: '▶️ Start',
    btnTimerPause: '⏸ Pause',
    btnTimerSave: '💾 Save Time',
    btnSaveEdit: 'Save',
    btnCancelEdit: 'Cancel',
    btnDoneTooltip: 'Mark as completed',
    btnUndoTooltip: 'Mark as uncompleted',
    btnFocusTooltip: 'Work with stopwatch / Pomodoro focus',
    btnEditTooltip: 'Edit',
    btnDeleteTooltip: 'Delete',
    footerTasksCompleted: '{count} tasks completed',
    btnClearCompleted: 'Clear Completed',
    confirmClear: 'Are you sure you want to delete {count} completed tasks?',
    pomodoroAlert: '🍅 Pomodoro finished! Awesome focus session!',
    saveTimeAlert: '⏱️ {min} minutes successfully logged to task!',
    motivationEmpty: 'Add your goals for today! ✍️',
    motivationFull: 'All tasks completed! Fantastic job! 🏆🎉',
    motivationHalf: 'Over halfway done! Keep up the momentum 🚀',
    motivationStart: 'Small daily steps build giant achievements 💪',
    deadlineOverdue: '⚠️ Overdue',
    deadlineToday: '📅 Today',
    durationLessMinute: '⚡ Under 1 min',
    durationMinutes: '⏱️ In {min} min',
    durationHours: '⏱️ In {hours} hrs',
    durationDays: '📅 In {days} days',
    categories: {
      all: 'All',
      work: 'Work',
      study: 'Study',
      personal: 'Personal',
      urgent: 'Urgent',
      idea: 'Idea'
    },
    priorities: {
      high: 'High',
      medium: 'Medium',
      low: 'Low'
    }
  }
};

// Kategoriya konfiguratsiyasi (belgilar va ranglar)
const CATEGORY_META = {
  all: { icon: '🌟', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  work: { icon: '💼', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.15)' },
  study: { icon: '📚', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.15)' },
  personal: { icon: '🏠', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
  urgent: { icon: '⚡', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  idea: { icon: '💡', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' }
};

const PRIORITY_META = {
  high: { color: '#ef4444' },
  medium: { color: '#f59e0b' },
  low: { color: '#10b981' }
};

// Konfetti (Salute) effekti
const triggerConfetti = () => {
  try {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#10b981', '#f59e0b', '#ec4899'];
    const particles = Array.from({ length: 70 }, () => ({
      x: canvas.width / 2,
      y: canvas.height * 0.45,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.85) * 16,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 8
    }));

    let animId;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35;
        p.alpha -= 0.015;
        p.rotation += p.vRot;

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });

      if (alive) {
        animId = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animId);
        canvas.remove();
      }
    };
    render();
  } catch {
    // E'tiborsiz qoldirish
  }
};

// Web Audio API orqali yoqimli chime ovozi
const playChime = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Brauzer ovoz siyosatiga tushsa
  }
};

// Vaqtni formatlash (mm:ss yoki hh:mm:ss)
const formatSeconds = sec => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

function App() {
  // Til holati: uz, ru, en (LocalStorage da eslab qoladi)
  const [lang, setLang] = useState(() => localStorage.getItem('todo_app_lang') || 'uz');

  // Lug'at yordamchisi
  const t = useMemo(() => {
    return TRANSLATIONS[lang] || TRANSLATIONS.uz;
  }, [lang]);

  const handleLangChange = newLang => {
    setLang(newLang);
    localStorage.setItem('todo_app_lang', newLang);
  };

  // Foydalanuvchi Auth holati
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Auth formasi holatlari
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Vazifalar ro'yxati va holati
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);

  // Form maydonlari
  const [newTodo, setNewTodo] = useState('');
  const [category, setCategory] = useState('work');
  const [priority, setPriority] = useState('medium');
  const [deadline, setDeadline] = useState('');

  // Filtrlar va qidiruv
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Inline tahrirlash
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  // Mavzu (Dark/Light) va Ovoz sozlamalari
  const [theme, setTheme] = useState(() => localStorage.getItem('todo_theme') || 'dark');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Fokus Sekundnomer & Pomodoro
  const [focusTask, setFocusTask] = useState(null);
  const [timerMode, setTimerMode] = useState('stopwatch');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);

  // Mavzuni ulash
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('todo_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Sana formatlash (Tanlangan tilga mos)
  const todayFormatted = useMemo(() => {
    const localeMap = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' };
    try {
      return new Date().toLocaleDateString(localeMap[lang] || 'uz-UZ', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    } catch {
      return new Date().toLocaleDateString();
    }
  }, [lang]);

  const todayIsoStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Firebase Auth holatini tinglash
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setAuthChecking(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // Email & Parol bilan Kirish / Ro'yxatdan o'tish
  const handleEmailAuth = async e => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'register') {
        if (!authEmail.trim() || !authPassword) {
          throw new Error(lang === 'ru' ? 'Введите email и пароль' : lang === 'en' ? 'Please enter email and password' : 'Email va parolni kiriting');
        }
        if (authPassword.length < 6) {
          throw new Error(lang === 'ru' ? 'Пароль должен содержать минимум 6 символов' : lang === 'en' ? 'Password must be at least 6 characters' : 'Parol kamida 6 ta belgidan iborat boʻlishi kerak');
        }
        const userCred = await createUserWithEmailAndPassword(auth, authEmail.trim(), authPassword);
        if (authName.trim()) {
          await updateProfile(userCred.user, { displayName: authName.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword);
      }
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
    } catch (err) {
      let msg = err.message;
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = lang === 'ru' ? 'Неверный email или пароль' : lang === 'en' ? 'Invalid email or password' : 'Email yoki parol notoʻgʻri kiritildi';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = lang === 'ru' ? 'Этот email уже зарегистрирован' : lang === 'en' ? 'Email already in use' : 'Bu email allaqachon roʻyxatdan oʻtgan';
      } else if (err.code === 'auth/invalid-email') {
        msg = lang === 'ru' ? 'Неверный формат email' : lang === 'en' ? 'Invalid email format' : 'Email formati notoʻgʻri';
      }
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  // Google bilan kirish
  const handleGoogleLogin = async () => {
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google login error:', err);
      setAuthError((lang === 'ru' ? 'Ошибка входа Google: ' : lang === 'en' ? 'Google Sign-in error: ' : 'Google orqali kirishda xatolik: ') + err.message);
    }
  };

  // Tizimdan chiqish (Logout)
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setTodos([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Real-time Firestore Listener (Faqat kirgan foydalanuvchining ma'lumotlari)
  useEffect(() => {
    if (!currentUser) {
      setTodos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const todosCol = collection(db, 'todos');
    const unsubscribe = onSnapshot(
      todosCol,
      snapshot => {
        const list = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));

        // Faqat mazkur foydalanuvchining vazifalari
        const userTodos = list.filter(t => t.userId === currentUser.uid || !t.userId);

        userTodos.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setTodos(userTodos);
        setLoading(false);
        setDbError(null);
      },
      error => {
        console.error('Firestore listener error:', error);
        setLoading(false);
        setDbError(error.message);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Sekundnomer va Pomodoro hisoblagichi
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (timerMode === 'pomodoro') {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              setIsTimerRunning(false);
              if (soundEnabled) playChime();
              triggerConfetti();
              alert(t.pomodoroAlert);
              return 0;
            }
            return prev - 1;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning, timerMode, soundEnabled, t]);

  const startFocusOnTask = (task, e) => {
    e.stopPropagation();
    setFocusTask(task);
    setTimerMode('stopwatch');
    setTimerSeconds(0);
    setIsTimerRunning(true);
  };

  const saveFocusedTime = async () => {
    if (!focusTask) return;
    const spentSecs = timerMode === 'pomodoro' ? 25 * 60 - timerSeconds : timerSeconds;
    if (spentSecs > 0) {
      try {
        const newTotal = (focusTask.timeSpent || 0) + spentSecs;
        await updateDoc(doc(db, 'todos', focusTask.id), {
          timeSpent: newTotal
        });
        setFocusTask(prev => ({ ...prev, timeSpent: newTotal }));
        const mins = Math.max(1, Math.round(spentSecs / 60));
        alert(t.saveTimeAlert.replace('{min}', mins));
      } catch (err) {
        console.error('Vaqt saqlashda xatolik:', err);
      }
    }
    setIsTimerRunning(false);
  };

  // CREATE: Yangi vazifa qo'shish
  const addTodo = async e => {
    e.preventDefault();
    if (!newTodo.trim() || !currentUser) return;

    const textToAdd = newTodo.trim();
    setNewTodo('');
    const taskDeadline = deadline;
    setDeadline('');

    try {
      await addDoc(collection(db, 'todos'), {
        text: textToAdd,
        category,
        priority,
        deadline: taskDeadline || null,
        completed: false,
        userId: currentUser.uid,
        userEmail: currentUser.email || '',
        userName: currentUser.displayName || currentUser.email || 'User',
        timeSpent: 0,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Qo'shish xatosi:", error);
      alert(error.message);
    }
  };

  // DELETE: Vazifani o'chirish
  const deleteTodo = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'todos', id));
      if (focusTask?.id === id) {
        setFocusTask(null);
        setIsTimerRunning(false);
      }
    } catch (error) {
      console.error("O'chirish xatosi:", error);
    }
  };

  // UPDATE: Bajarildi holatini o'zgartirish
  const toggleComplete = async todo => {
    try {
      const willBeCompleted = !todo.completed;
      const todoRef = doc(db, 'todos', todo.id);
      await updateDoc(todoRef, {
        completed: willBeCompleted,
        completedAt: willBeCompleted ? serverTimestamp() : null
      });

      if (willBeCompleted) {
        if (soundEnabled) playChime();
        triggerConfetti();
      }
    } catch (error) {
      console.error('Yangilash xatosi:', error);
    }
  };

  // EDIT: Tahrirlashni saqlash
  const saveEdit = async id => {
    if (!editText.trim()) {
      setEditingId(null);
      return;
    }
    try {
      await updateDoc(doc(db, 'todos', id), {
        text: editText.trim()
      });
      setEditingId(null);
    } catch (error) {
      console.error('Tahrirlash xatosi:', error);
    }
  };

  // Bajarilganlarni tozalash
  const clearCompleted = async () => {
    const completedList = todos.filter(t => t.completed);
    if (completedList.length === 0) return;
    if (!window.confirm(t.confirmClear.replace('{count}', completedList.length))) return;

    try {
      await Promise.all(completedList.map(t => deleteDoc(doc(db, 'todos', t.id))));
    } catch (err) {
      console.error(err);
    }
  };

  // Muddat holatini hisoblash
  const getDeadlineStatus = deadlineStr => {
    if (!deadlineStr) return null;
    if (deadlineStr < todayIsoStr) return { label: t.deadlineOverdue, type: 'overdue' };
    if (deadlineStr === todayIsoStr) return { label: t.deadlineToday, type: 'today' };
    return { label: `📅 ${deadlineStr}`, type: 'future' };
  };

  // Bajarilish davomiyligini hisoblash
  const getCompletionDuration = (created, completed) => {
    if (!created || !completed) return null;
    const start = created.seconds ? created.seconds * 1000 : new Date(created).getTime();
    const end = completed.seconds ? completed.seconds * 1000 : new Date(completed).getTime();
    const diffMinutes = Math.round((end - start) / (1000 * 60));

    if (diffMinutes < 1) return t.durationLessMinute;
    if (diffMinutes < 60) return t.durationMinutes.replace('{min}', diffMinutes);
    const hours = Math.floor(diffMinutes / 60);
    if (hours < 24) return t.durationHours.replace('{hours}', hours);
    const days = Math.floor(hours / 24);
    return t.durationDays.replace('{days}', days);
  };

  // Statistika
  const totalCount = todos.length;
  const completedCount = todos.filter(t => t.completed).length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  // Motivatsion gap
  const motivationText = useMemo(() => {
    if (totalCount === 0) return t.motivationEmpty;
    if (progressPercent === 100) return t.motivationFull;
    if (progressPercent >= 50) return t.motivationHalf;
    return t.motivationStart;
  }, [totalCount, progressPercent, t]);

  // Filtrlash va qidiruv
  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      if (statusFilter === 'active' && todo.completed) return false;
      if (statusFilter === 'completed' && !todo.completed) return false;
      if (selectedCategory !== 'all' && todo.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const queryLower = searchQuery.toLowerCase();
        return (todo.text || '').toLowerCase().includes(queryLower);
      }
      return true;
    });
  }, [todos, statusFilter, selectedCategory, searchQuery]);

  // Dastlabki Auth tekshiruvi yuklanmoqda
  if (authChecking) {
    return (
      <div className="app-wrapper">
        <div className="state-box" style={{ marginTop: '120px' }}>
          <span className="state-icon">⏳</span>
          <div className="state-title">{t.loading}</div>
        </div>
      </div>
    );
  }

  // 1-QOIDAGA KO'RA: FOYDALANUVCHI TIZIMGA KIRMAGAN BO'LSA - FAQATGINA LOGIN / RO'YXATDAN O'TISH SAHIFASI CHIQADI!
  // ILOVANI ISHLATIB BO'LMAYDI, X TUGMASI BO'LMAYDI!
  if (!currentUser) {
    return (
      <div className="app-wrapper">
        <div className="todo-card auth-page-card">
          {/* Yuqori til va mavzu tanlash paneli */}
          <div className="auth-top-bar">
            <div className="lang-switcher">
              <button
                type="button"
                className={`lang-pill ${lang === 'uz' ? 'active' : ''}`}
                onClick={() => handleLangChange('uz')}
              >
                🇺🇿 UZ
              </button>
              <button
                type="button"
                className={`lang-pill ${lang === 'ru' ? 'active' : ''}`}
                onClick={() => handleLangChange('ru')}
              >
                🇷🇺 RU
              </button>
              <button
                type="button"
                className={`lang-pill ${lang === 'en' ? 'active' : ''}`}
                onClick={() => handleLangChange('en')}
              >
                🇬🇧 EN
              </button>
            </div>

            <button
              onClick={toggleTheme}
              className="icon-btn auth-theme-btn"
              title={theme === 'dark' ? 'Yorugʻ mavzu' : 'Qorongʻi mavzu'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Sarlavha va Breand */}
          <div className="auth-hero">
            <div className="auth-app-logo">🚀</div>
            <h1 className="auth-app-title">{t.appTitle}</h1>
            <p className="auth-app-subtitle">{t.appSubtitle}</p>
          </div>

          <div className="auth-box-inner">
            <h2 className="auth-main-heading">
              {authMode === 'login' ? t.authCardTitleLogin : t.authCardTitleRegister}
            </h2>
            <p className="auth-main-desc">{t.authCardDesc}</p>

            {/* Kirish / Ro'yxatdan o'tish tablari */}
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                }}
              >
                {t.tabLogin}
              </button>
              <button
                type="button"
                className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                }}
              >
                {t.tabRegister}
              </button>
            </div>

            {authError && <div className="auth-error-alert">⚠️ {authError}</div>}

            <form onSubmit={handleEmailAuth} className="auth-form">
              {authMode === 'register' && (
                <div className="auth-field">
                  <label className="auth-label">{t.nameLabel}</label>
                  <input
                    type="text"
                    value={authName}
                    onChange={e => setAuthName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className="auth-input"
                  />
                </div>
              )}

              <div className="auth-field">
                <label className="auth-label">{t.emailLabel}</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="auth-input"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">{t.passLabel}</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  placeholder={t.passPlaceholder}
                  className="auth-input"
                />
              </div>

              <button type="submit" disabled={authLoading} className="btn-auth-submit">
                {authLoading
                  ? t.loading
                  : authMode === 'login'
                  ? t.btnLoginSubmit
                  : t.btnRegisterSubmit}
              </button>
            </form>

            <div className="auth-divider">{t.orDivider}</div>

            <button type="button" onClick={handleGoogleLogin} className="btn-modal-google">
              <span>🌐</span> {t.btnGoogle}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2-QISM: FOYDALANUVCHI TIZIMGA MUOFFAQIYATLI KIRGANDA ASOSIY ILOVA OCHILADI
  return (
    <div className="app-wrapper">
      <div className="todo-card">
        {/* Foydalanuvchi Boshqaruv Paneli */}
        <div className="user-bar">
          <div className="user-info">
            <div className="user-avatar">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" />
              ) : (
                <span>👤</span>
              )}
            </div>
            <div>
              <div className="user-meta-name">
                {currentUser.displayName || currentUser.email}
                <span className="user-badge">{t.accountBadge}</span>
              </div>
            </div>
          </div>

          <div className="user-actions">
            <button
              onClick={handleLogout}
              className="btn-auth-logout"
              title="Akkauntdan chiqish"
            >
              {t.logout}
            </button>
          </div>
        </div>

        {/* Xatolik ogohlantirishi */}
        {dbError && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#f87171',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '13px',
              marginBottom: '20px',
              lineHeight: '1.4'
            }}
          >
            ⚠️ <b>Diqqat:</b> {dbError}
          </div>
        )}

        {/* Yuqori Panel */}
        <header className="header-top">
          <div className="header-title-box">
            <h1>
              <span>🚀</span> {t.appTitle}
            </h1>
            <div className="header-date">{todayFormatted}</div>
          </div>

          <div className="header-actions">
            {/* 3 ta tilni almashtirish tugmasi */}
            <div className="lang-switcher header-lang">
              <button
                type="button"
                className={`lang-pill ${lang === 'uz' ? 'active' : ''}`}
                onClick={() => handleLangChange('uz')}
                title="Oʻzbekcha"
              >
                🇺🇿 UZ
              </button>
              <button
                type="button"
                className={`lang-pill ${lang === 'ru' ? 'active' : ''}`}
                onClick={() => handleLangChange('ru')}
                title="Русский"
              >
                🇷🇺 RU
              </button>
              <button
                type="button"
                className={`lang-pill ${lang === 'en' ? 'active' : ''}`}
                onClick={() => handleLangChange('en')}
                title="English"
              >
                🇬🇧 EN
              </button>
            </div>

            <button
              onClick={() => setSoundEnabled(prev => !prev)}
              className="icon-btn"
              title={soundEnabled ? 'Ovozni oʻchirish' : 'Ovozni yoqish'}
            >
              {soundEnabled ? '🔔' : '🔕'}
            </button>
            <button
              onClick={toggleTheme}
              className="icon-btn"
              title={theme === 'dark' ? 'Yorugʻ mavzu' : 'Qorongʻi mavzu'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        {/* Fokus Sekundnomeri va Pomodoro */}
        {focusTask && (
          <div className="timer-widget">
            <div className="timer-header">
              <div className="timer-task-name">
                <span>{t.focusPrefix}</span> {focusTask.text}
              </div>
              <div className="timer-mode-pills">
                <button
                  onClick={() => {
                    setTimerMode('stopwatch');
                    setTimerSeconds(0);
                    setIsTimerRunning(false);
                  }}
                  className={`mode-pill ${timerMode === 'stopwatch' ? 'active' : ''}`}
                >
                  {t.modeStopwatch}
                </button>
                <button
                  onClick={() => {
                    setTimerMode('pomodoro');
                    setTimerSeconds(25 * 60);
                    setIsTimerRunning(false);
                  }}
                  className={`mode-pill ${timerMode === 'pomodoro' ? 'active' : ''}`}
                >
                  {t.modePomodoro}
                </button>
              </div>
            </div>

            <div className="timer-clock">{formatSeconds(timerSeconds)}</div>

            <div className="timer-controls">
              <button
                onClick={() => setIsTimerRunning(prev => !prev)}
                className="btn-timer-primary"
              >
                {isTimerRunning ? t.btnTimerPause : t.btnTimerStart}
              </button>
              <button onClick={saveFocusedTime} className="btn-timer-secondary">
                {t.btnTimerSave}
              </button>
              <button
                onClick={() => {
                  setFocusTask(null);
                  setIsTimerRunning(false);
                }}
                className="btn-timer-close"
                title="Taymerni yopish"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Progress & Statistika */}
        <div className="stats-banner">
          <div className="stats-info">
            <div>
              <div className="stats-title">{t.dailyResult}</div>
              <div className="stats-motivation">{motivationText}</div>
            </div>
            <div className="stats-percent">{progressPercent}%</div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Yangi vazifa formasi */}
        <form onSubmit={addTodo} className="todo-form">
          <div className="form-input-row">
            <input
              type="text"
              value={newTodo}
              onChange={e => setNewTodo(e.target.value)}
              placeholder={t.inputPlaceholder}
              className="task-input"
            />
            <button type="submit" className="btn-add">
              {t.btnAdd}
            </button>
          </div>

          <div className="form-options-row">
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="custom-select"
            >
              <option value="work">💼 {t.categories.work}</option>
              <option value="study">📚 {t.categories.study}</option>
              <option value="personal">🏠 {t.categories.personal}</option>
              <option value="urgent">⚡ {t.categories.urgent}</option>
              <option value="idea">💡 {t.categories.idea}</option>
            </select>

            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="custom-select"
            >
              <option value="high">🔴 {t.priorities.high}</option>
              <option value="medium">🟡 {t.priorities.medium}</option>
              <option value="low">🟢 {t.priorities.low}</option>
            </select>

            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="date-input"
              title={t.deadlineTooltip}
            />
          </div>
        </form>

        {/* Qidiruv va Filtrlar */}
        <div className="filter-search-box">
          <div className="search-input-wrap">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="search-clear">
                ✕
              </button>
            )}
          </div>

          <div className="filter-tabs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
            >
              {t.tabAll} ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`filter-tab ${statusFilter === 'active' ? 'active' : ''}`}
            >
              {t.tabActive} ({totalCount - completedCount})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`filter-tab ${statusFilter === 'completed' ? 'active' : ''}`}
            >
              {t.tabCompleted} ({completedCount})
            </button>
          </div>

          <div className="category-chips">
            {Object.keys(CATEGORY_META).map(key => {
              const meta = CATEGORY_META[key];
              const label = t.categories[key];
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`chip-btn ${selectedCategory === key ? 'active' : ''}`}
                >
                  <span>{meta.icon}</span> {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Vazifalar ro'yxati */}
        {loading ? (
          <div className="state-box">
            <span className="state-icon">⏳</span>
            <div className="state-title">{t.loading}</div>
            <div className="state-desc">{t.stateSyncing}</div>
          </div>
        ) : filteredTodos.length === 0 ? (
          <div className="state-box">
            <span className="state-icon">
              {searchQuery ? '🔍' : statusFilter === 'completed' ? '🎯' : '✨'}
            </span>
            <div className="state-title">
              {searchQuery
                ? t.stateSearchEmptyTitle
                : statusFilter === 'completed'
                ? t.stateCompletedEmptyTitle
                : t.stateEmptyTitle}
            </div>
            <div className="state-desc">
              {searchQuery
                ? t.stateSearchEmptyDesc
                : statusFilter === 'completed'
                ? t.stateCompletedEmptyDesc
                : t.stateEmptyDesc}
            </div>
          </div>
        ) : (
          <ul className="todo-list">
            {filteredTodos.map(todo => {
              const catKey = todo.category || 'work';
              const prioKey = todo.priority || 'medium';
              const catMeta = CATEGORY_META[catKey] || CATEGORY_META.work;
              const prioMeta = PRIORITY_META[prioKey] || PRIORITY_META.medium;
              const catLabel = t.categories[catKey] || catKey;
              const prioLabel = t.priorities[prioKey] || prioKey;

              const isEditing = editingId === todo.id;
              const isFocused = focusTask?.id === todo.id;
              const deadlineInfo = getDeadlineStatus(todo.deadline);
              const durationText = todo.completed
                ? getCompletionDuration(todo.createdAt, todo.completedAt)
                : null;

              return (
                <li
                  key={todo.id}
                  className={`todo-item ${todo.completed ? 'completed' : ''} ${
                    isFocused ? 'active-focus' : ''
                  }`}
                >
                  <div
                    className="priority-stripe"
                    style={{ backgroundColor: prioMeta.color }}
                  />

                  <button
                    onClick={() => toggleComplete(todo)}
                    className={`checkbox-btn ${todo.completed ? 'checked' : ''}`}
                    title={todo.completed ? t.btnUndoTooltip : t.btnDoneTooltip}
                  >
                    {todo.completed ? '✓' : ''}
                  </button>

                  <div
                    className="todo-content"
                    onClick={() => !isEditing && toggleComplete(todo)}
                  >
                    {isEditing ? (
                      <div className="edit-input-box" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveEdit(todo.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="edit-input"
                          autoFocus
                        />
                        <button onClick={() => saveEdit(todo.id)} className="btn-save">
                          {t.btnSaveEdit}
                        </button>
                        <button onClick={() => setEditingId(null)} className="btn-cancel">
                          {t.btnCancelEdit}
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className={`todo-text ${todo.completed ? 'done' : ''}`}>
                          {todo.text}
                        </div>
                        <div className="todo-meta">
                          <span
                            className="category-tag"
                            style={{ color: catMeta.color, backgroundColor: catMeta.bg }}
                          >
                            {catMeta.icon} {catLabel}
                          </span>

                          <span className="priority-tag" style={{ color: prioMeta.color }}>
                            <span
                              className="priority-dot"
                              style={{ backgroundColor: prioMeta.color }}
                            />
                            {prioLabel}
                          </span>

                          {deadlineInfo && (
                            <span className={`deadline-badge ${deadlineInfo.type}`}>
                              {deadlineInfo.label}
                            </span>
                          )}

                          {todo.timeSpent > 0 && (
                            <span className="time-spent-tag" title="Fokus vaqti">
                              ⏱️ {formatSeconds(todo.timeSpent)}
                            </span>
                          )}

                          {durationText && (
                            <span className="duration-tag">
                              ✓ {durationText}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="todo-actions">
                      {!todo.completed && (
                        <button
                          onClick={e => startFocusOnTask(todo, e)}
                          className="action-btn focus"
                          title={t.btnFocusTooltip}
                        >
                          ⏱️
                        </button>
                      )}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setEditingId(todo.id);
                          setEditText(todo.text);
                        }}
                        className="action-btn"
                        title={t.btnEditTooltip}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={e => deleteTodo(todo.id, e)}
                        className="action-btn delete"
                        title={t.btnDeleteTooltip}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {completedCount > 0 && (
          <footer className="footer-bar">
            <span>{t.footerTasksCompleted.replace('{count}', completedCount)}</span>
            <button onClick={clearCompleted} className="btn-clear">
              {t.btnClearCompleted}
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}

export default App;
