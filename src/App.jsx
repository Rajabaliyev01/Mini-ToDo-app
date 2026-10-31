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

// Kategoriyalar
const CATEGORIES = {
  all: { label: 'Barchasi', icon: '🌟', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' },
  work: { label: 'Ish', icon: '💼', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' },
  study: { label: "O'qish", icon: '📚', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },
  personal: { label: 'Shaxsiy', icon: '🏠', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
  urgent: { label: 'Tezkor', icon: '⚡', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  idea: { label: "G'oya", icon: '💡', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' }
};

// Muhimlik darajalari
const PRIORITIES = {
  high: { label: 'Yuqori', color: '#ef4444' },
  medium: { label: "O'rta", color: '#f59e0b' },
  low: { label: 'Oddiy', color: '#10b981' }
};

// Yengil va mustaqil Konfetti (Salute) effekti
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

    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
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
    // Canvas xatolarini e'tiborsiz qoldirish
  }
};

// Web Audio API orqali ovoz
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

// Vaqtni formatlash (soniyalarni mm:ss yoki hh:mm:ss ga)
const formatSeconds = sec => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Bajarilish davomiyligini hisoblash
const getCompletionDuration = (created, completed) => {
  if (!created || !completed) return null;
  const start = created.seconds ? created.seconds * 1000 : new Date(created).getTime();
  const end = completed.seconds ? completed.seconds * 1000 : new Date(completed).getTime();
  const diffMinutes = Math.round((end - start) / (1000 * 60));

  if (diffMinutes < 1) return '⚡ 1 daqiqadan kam vaqtda';
  if (diffMinutes < 60) return `⏱️ ${diffMinutes} daqiqada`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `⏱️ ${hours} soatda`;
  const days = Math.floor(hours / 24);
  return `📅 ${days} kunda`;
};

function App() {
  // Foydalanuvchi va Auth holati
  const [currentUser, setCurrentUser] = useState(null);
  const [guestId] = useState(() => {
    let stored = localStorage.getItem('guest_user_id');
    if (!stored) {
      stored = 'guest_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('guest_user_id', stored);
    }
    return stored;
  });

  const activeUserId = currentUser ? currentUser.uid : guestId;

  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);

  // Auth Modal holati
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // 'login' yoki 'register'
  const [lang, setLang] = useState('uz'); // 'uz', 'ru', 'en'
  const translations = {
    uz: {
      login: 'Kirish',
      register: 'Ro\'yxatdan\'o\'tish',
      emailPlaceholder: "Email kiriting...",
      passwordPlaceholder: "Parol kiriting...",
      namePlaceholder: "Ism (ixtiyoriy)",
      logout: 'Chiqish 🚪',
      authButton: '🔐 Kirish / Ro\'yxat',
      addTask: '+ Qo\'shish',
      placeholderTask: "Qanday rejangiz bor? Masalan: Loyiha hisobotini topshirish...",
      categoryWork: '💼 Ish',
      categoryStudy: "📚 O'qish",
      categoryPersonal: '🏠 Shaxsiy',
      categoryUrgent: '⚡ Tezkor',
      categoryIdea: "💡 G'oya",
      priorityHigh: '🔴 Yuqori',
      priorityMedium: "🟡 O'rta",
      priorityLow: '🟢 Oddiy',
      searchPlaceholder: 'Vazifalarni qidirish...',
      all: 'Barchasi',
      active: 'Faol',
      completed: 'Bajarilgan'
    },
    ru: {
      login: 'Войти',
      register: 'Регистрация',
      emailPlaceholder: "Введите email...",
      passwordPlaceholder: "Введите пароль...",
      namePlaceholder: "Имя (по желанию)",
      logout: 'Выйти 🚪',
      authButton: '🔐 Войти / Регистрация',
      addTask: '+ Добавить',
      placeholderTask: "Какая у вас задача? Например: сдать отчет...",
      categoryWork: '💼 Работа',
      categoryStudy: "📚 Учеба",
      categoryPersonal: '🏠 Личное',
      categoryUrgent: '⚡ Срочно',
      categoryIdea: "💡 Идея",
      priorityHigh: '🔴 Высокий',
      priorityMedium: "🟡 Средний",
      priorityLow: '🟢 Низкий',
      searchPlaceholder: 'Поиск задач...',
      all: 'Все',
      active: 'Активные',
      completed: 'Выполненные'
    },
    en: {
      login: 'Login',
      register: 'Register',
      emailPlaceholder: "Enter email...",
      passwordPlaceholder: "Enter password...",
      namePlaceholder: "Name (optional)",
      logout: 'Logout 🚪',
      authButton: '🔐 Sign In / Register',
      addTask: '+ Add',
      placeholderTask: "What's your plan? e.g., submit project report...",
      categoryWork: '💼 Work',
      categoryStudy: "📚 Study",
      categoryPersonal: '🏠 Personal',
      categoryUrgent: '⚡ Urgent',
      categoryIdea: "💡 Idea",
      priorityHigh: '🔴 High',
      priorityMedium: "🟡 Medium",
      priorityLow: '🟢 Low',
      searchPlaceholder: 'Search tasks...',
      all: 'All',
      active: 'Active',
      completed: 'Completed'
    }
  };
  const t = (key) => translations[lang][key] || key;

  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Form maydonlari
  const [newTodo, setNewTodo] = useState('');
  const [category, setCategory] = useState('work');
  const [priority, setPriority] = useState('medium');
  const [deadline, setDeadline] = useState('');

  // Filter va qidiruv
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Tahrirlash (Inline editing)
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  // Mavzu (Dark/Light) va Ovoz sozlamalari
  const [theme, setTheme] = useState(() => localStorage.getItem('todo_theme') || 'dark');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Fokus / Sekundnomer & Pomodoro holati
  const [focusTask, setFocusTask] = useState(null);
  const [timerMode, setTimerMode] = useState('stopwatch');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);

  // Sana (Lazy initializer)
  const [todayFormatted] = useState(() => {
    return new Date().toLocaleDateString('uz-UZ', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  });

  const [todayIsoStr] = useState(() => new Date().toISOString().split('T')[0]);

  // Mavzuni ulash
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('todo_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Auth kuzatish
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
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
        if (!authEmail || !authPassword) {
          throw new Error('Email va parolni kiriting');
        }
        if (authPassword.length < 6) {
          throw new Error("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
        }
        const userCred = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        if (authName.trim()) {
          await updateProfile(userCred.user, { displayName: authName.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      }
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
    } catch (err) {
      let msg = err.message;
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = "Email yoki parol noto'g'ri kiritildi";
      } else if (err.code === 'auth/email-already-in-use') {
        msg = "Bu email allaqachon ro'yxatdan o'tgan";
      } else if (err.code === 'auth/invalid-email') {
        msg = "Email formati noto'g'ri";
      }
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  // Google bilan kirish
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setShowAuthModal(false);
    } catch (err) {
      console.error('Google bilan kirishda xatolik:', err);
      setAuthError('Google orqali kirishda xatolik: ' + err.message);
    }
  };

  // Tizimdan chiqish (Mehmon rejimiga qaytish)
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Chiqishda xatolik:', err);
    }
  };

  // 1. Real-time Firebase Listener
  useEffect(() => {
    const todosCol = collection(db, 'todos');
    const unsubscribe = onSnapshot(
      todosCol,
      snapshot => {
        const list = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));

        // Foydalanuvchining o'z vazifalari + userId si bo'lmagan eski vazifalar
        const userTodos = list.filter(t => !t.userId || t.userId === activeUserId);

        // Sanasi bo'yicha saralash
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
        console.error('Firestore xatosi:', error);
        setLoading(false);
        if (error.message && error.message.includes('permission-denied')) {
          setDbError('Firebase Firestore bazasi hali yoqilmagan yoki qoidalar bloklangan.');
        } else {
          setDbError(error.message);
        }
      }
    );

    return () => unsubscribe();
  }, [activeUserId]);

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
              alert('🍅 Pomodoro vaqti tugadi! Ajoyib fokus!');
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
  }, [isTimerRunning, timerMode, soundEnabled]);

  // Fokus rejimini yoqish
  const startFocusOnTask = (task, e) => {
    e.stopPropagation();
    setFocusTask(task);
    setTimerMode('stopwatch');
    setTimerSeconds(0);
    setIsTimerRunning(true);
  };

  // Fokus vaqtini saqlash
  const saveFocusedTime = async () => {
    if (!focusTask) return;
    const spentSecs = timerMode === 'pomodoro' ? (25 * 60 - timerSeconds) : timerSeconds;
    if (spentSecs > 0) {
      try {
        const newTotal = (focusTask.timeSpent || 0) + spentSecs;
        await updateDoc(doc(db, 'todos', focusTask.id), {
          timeSpent: newTotal
        });
        setFocusTask(prev => ({ ...prev, timeSpent: newTotal }));
        alert(`⏱️ ${Math.round(spentSecs / 60)} daqiqa vazifaga muvaffaqiyatli saqlandi!`);
      } catch (err) {
        console.error('Vaqt saqlashda xatolik:', err);
      }
    }
    setIsTimerRunning(false);
  };

  // 2. CREATE: Yangi vazifa qo'shish
  const addTodo = async e => {
    e.preventDefault();
    if (!newTodo.trim()) return;

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
        userId: activeUserId,
        userEmail: currentUser?.email || 'Mehmon',
        userName: currentUser?.displayName || 'Mehmon',
        timeSpent: 0,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Qo'shishda xatolik:", error);
      alert("Vazifa qo'shishda xatolik yuz berdi: " + error.message);
    }
  };

  // 3. DELETE: Vazifani o'chirish
  const deleteTodo = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'todos', id));
      if (focusTask?.id === id) {
        setFocusTask(null);
        setIsTimerRunning(false);
      }
    } catch (error) {
      console.error("O'chirishda xatolik:", error);
    }
  };

  // 4. UPDATE: Bajarildi holatini o'zgartirish
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
      console.error('Yangilashda xatolik:', error);
    }
  };

  // 5. Tahrirlashni saqlash
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
      console.error('Tahrirlashda xatolik:', error);
    }
  };

  // 6. Bajarilganlarni tozalash
  const clearCompleted = async () => {
    const completedList = todos.filter(t => t.completed);
    if (completedList.length === 0) return;
    if (!window.confirm(`${completedList.length} ta bajarilgan vazifani o'chirib tashlamoqchimisiz?`)) return;

    try {
      await Promise.all(completedList.map(t => deleteDoc(doc(db, 'todos', t.id))));
    } catch (err) {
      console.error(err);
    }
  };

  // Muddatni tekshirish
  const getDeadlineStatus = deadlineStr => {
    if (!deadlineStr) return null;
    if (deadlineStr < todayIsoStr) return { label: '⚠️ Muddati oʻtgan', type: 'overdue' };
    if (deadlineStr === todayIsoStr) return { label: '📅 Bugun', type: 'today' };
    return { label: `📅 ${deadlineStr}`, type: 'future' };
  };

  // Statistika
  const totalCount = todos.length;
  const completedCount = todos.filter(t => t.completed).length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  // Motivatsion gap
  const motivationText = useMemo(() => {
    if (totalCount === 0) return "Bugungi rejalaringizni qo'shing! ✍️";
    if (progressPercent === 100) return 'Barcha vazifalar bajarildi! Ajoyib natija! 🏆🎉';
    if (progressPercent >= 50) return 'Rejaning yarmidan koʻpi tayyor! Shunday davom eting 🚀';
    return 'Kichik qadamlar katta muvaffaqiyatlarga olib boradi 💪';
  }, [totalCount, progressPercent]);

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
                <span>{currentUser ? '👤' : '🕶️'}</span>
              )}
            </div>
            <div>
              <div className="user-meta-name">
                {currentUser ? (currentUser.displayName || currentUser.email) : 'Mehmon rejimi'}
                <span className="user-badge">
                  {currentUser ? 'Akkaunt' : 'Guest: ' + guestId.substring(0, 6)}
                </span>
              </div>
            </div>
          </div>

          <div className="user-actions">
            {currentUser ? (
              <button onClick={handleLogout} className="btn-auth-logout" title="Akkauntdan chiqish (Mehmon rejimiga o'tish)">
                Chiqish 🚪
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthError('');
                  setShowAuthModal(true);
                }}
                className="btn-auth-open"
                title="Kirish yoki Ro'yxatdan o'tish"
              >
                🔐 Kirish / Roʻyxat
              </button>
            )}
          </div>
        </div>

        {/* Xatolik ogohlantirishi */}
        {dbError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            color: '#f87171',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            marginBottom: '20px',
            lineHeight: '1.4'
          }}>
            ⚠️ <b>Diqqat:</b> {dbError}
          </div>
        )}

        {/* Yuqori Panel */}
        <header className="header-top">
          <div className="header-title-box">
            <h1>
              <span>🚀</span> Task Flow
            </h1>
            <div className="header-date">{todayFormatted}</div>
          </div>

          <div className="header-actions">
            <select
              value={lang}
              onChange={e => setLang(e.target.value)}
              className="custom-select lang-select"
              title="Til / Language"
            >
              <option value="uz">🇺🇿 UZ</option>
              <option value="ru">🇷🇺 RU</option>
              <option value="en">🇬🇧 EN</option>
            </select>
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
                <span>🎯 Fokus:</span> {focusTask.text}
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
                  ⏱️ Sekundnomer
                </button>
                <button
                  onClick={() => {
                    setTimerMode('pomodoro');
                    setTimerSeconds(25 * 60);
                    setIsTimerRunning(false);
                  }}
                  className={`mode-pill ${timerMode === 'pomodoro' ? 'active' : ''}`}
                >
                  🍅 Pomodoro
                </button>
              </div>
            </div>

            <div className="timer-clock">{formatSeconds(timerSeconds)}</div>

            <div className="timer-controls">
              <button
                onClick={() => setIsTimerRunning(prev => !prev)}
                className="btn-timer-primary"
              >
                {isTimerRunning ? '⏸ Toʻxtatish' : '▶️ Boshlash'}
              </button>
              <button onClick={saveFocusedTime} className="btn-timer-secondary">
                💾 Vaqtni saqlash
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
              <div className="stats-title">Kunlik Natija</div>
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
              placeholder="Qanday rejangiz bor? Masalan: Loyiha hisobotini topshirish..."
              className="task-input"
            />
            <button type="submit" className="btn-add">
              <span>+</span> Qoʻshish
            </button>
          </div>

          <div className="form-options-row">
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="custom-select"
            >
              <option value="work">💼 Ish</option>
              <option value="study">📚 Oʻqish</option>
              <option value="personal">🏠 Shaxsiy</option>
              <option value="urgent">⚡ Tezkor</option>
              <option value="idea">💡 Gʻoya</option>
            </select>

            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="custom-select"
            >
              <option value="high">🔴 Yuqori muhimlik</option>
              <option value="medium">🟡 Oʻrta muhimlik</option>
              <option value="low">🟢 Oddiy</option>
            </select>

            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="date-input"
              title="Vazifa bajarilish muddati"
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
              placeholder="Vazifalarni qidirish..."
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
              Barchasi ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`filter-tab ${statusFilter === 'active' ? 'active' : ''}`}
            >
              Faol ({totalCount - completedCount})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`filter-tab ${statusFilter === 'completed' ? 'active' : ''}`}
            >
              Bajarilgan ({completedCount})
            </button>
          </div>

          <div className="category-chips">
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`chip-btn ${selectedCategory === key ? 'active' : ''}`}
              >
                <span>{cat.icon}</span> {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vazifalar ro'yxati */}
        {loading ? (
          <div className="state-box">
            <span className="state-icon">⏳</span>
            <div className="state-title">Yuklanmoqda...</div>
            <div className="state-desc">Vazifalaringiz sinxronlanmoqda</div>
          </div>
        ) : filteredTodos.length === 0 ? (
          <div className="state-box">
            <span className="state-icon">
              {searchQuery ? '🔍' : statusFilter === 'completed' ? '🎯' : '✨'}
            </span>
            <div className="state-title">
              {searchQuery
                ? 'Hech narsa topilmadi'
                : statusFilter === 'completed'
                ? 'Hali bajarilgan vazifalar yoʻq'
                : 'Hech qanday vazifa yoʻq'}
            </div>
            <div className="state-desc">
              {searchQuery ? 'Boshqa soʻz bilan qidirib koʻring' : 'Yangi vazifa kiritib boshlang'}
            </div>
          </div>
        ) : (
          <ul className="todo-list">
            {filteredTodos.map(todo => {
              const catConfig = CATEGORIES[todo.category] || CATEGORIES.work;
              const prioConfig = PRIORITIES[todo.priority] || PRIORITIES.medium;
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
                    style={{ backgroundColor: prioConfig.color }}
                  />

                  <button
                    onClick={() => toggleComplete(todo)}
                    className={`checkbox-btn ${todo.completed ? 'checked' : ''}`}
                    title={todo.completed ? 'Qaytarish' : 'Bajarildi deb belgilash'}
                  >
                    {todo.completed ? '✓' : ''}
                  </button>

                  <div className="todo-content" onClick={() => !isEditing && toggleComplete(todo)}>
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
                          Saqlash
                        </button>
                        <button onClick={() => setEditingId(null)} className="btn-cancel">
                          Bekor
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
                            style={{ color: catConfig.color, backgroundColor: catConfig.bg }}
                          >
                            {catConfig.icon} {catConfig.label}
                          </span>

                          <span className="priority-tag" style={{ color: prioConfig.color }}>
                            <span
                              className="priority-dot"
                              style={{ backgroundColor: prioConfig.color }}
                            />
                            {prioConfig.label}
                          </span>

                          {deadlineInfo && (
                            <span className={`deadline-badge ${deadlineInfo.type}`}>
                              {deadlineInfo.label}
                            </span>
                          )}

                          {todo.timeSpent > 0 && (
                            <span className="time-spent-tag" title="Fokusda sarflangan vaqt">
                              ⏱️ {formatSeconds(todo.timeSpent)}
                            </span>
                          )}

                          {durationText && (
                            <span className="duration-tag" title="Vazifa qancha vaqtda bajarilgani">
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
                          title="Fokus / Sekundnomer bilan ishlash"
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
                        title="Tahrirlash"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={e => deleteTodo(todo.id, e)}
                        className="action-btn delete"
                        title="Oʻchirish"
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
            <span>{completedCount} ta vazifa bajarildi</span>
            <button onClick={clearCompleted} className="btn-clear">
              Bajarilganlarni tozalash
            </button>
          </footer>
        )}
      </div>

      {/* LOGIN VA RO'YXATDAN O'TISH MODAL OYNASI */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowAuthModal(false)}>✕</button>

            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>
              {authMode === 'login' ? 'Tizimga kirish' : 'Yangi hisob ochish'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Vazifalaringiz barcha qurilmalarda saqlanadi
            </p>

            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                }}
              >
                Kirish
              </button>
              <button
                type="button"
                className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                }}
              >
                Roʻyxatdan oʻtish
              </button>
            </div>

            {authError && <div className="auth-error-alert">⚠️ {authError}</div>}

            <form onSubmit={handleEmailAuth} className="auth-form">
              {authMode === 'register' && (
                <div className="auth-field">
                  <label className="auth-label">Ismingiz</label>
                  <input
                    type="text"
                    value={authName}
                    onChange={e => setAuthName(e.target.value)}
                    placeholder="Masalan: Javohir"
                    className="auth-input"
                  />
                </div>
              )}

              <div className="auth-field">
                <label className="auth-label">Email manzilingiz</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  placeholder="nomi@email.com"
                  className="auth-input"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Parol (kamida 6 ta belgi)</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="auth-input"
                />
              </div>

              <button type="submit" disabled={authLoading} className="btn-auth-submit">
                {authLoading ? 'Yuklanmoqda...' : authMode === 'login' ? 'Kirish' : 'Hisob yaratish'}
              </button>
            </form>

            <div className="auth-divider">yoki</div>

            <button type="button" onClick={handleGoogleLogin} className="btn-modal-google">
              <span>🌐</span> Google bilan davom etish
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="btn-modal-guest"
              >
                Mehmon sifatida davom etish (Kirish shart emas)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
