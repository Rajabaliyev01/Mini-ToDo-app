import { useState, useEffect, useMemo } from 'react';
import { db } from './firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import './App.css';

// Kategoriya konfiguratsiyasi
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
    const particles = Array.from({ length: 60 }, () => ({
      x: canvas.width / 2,
      y: canvas.height * 0.45,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.8) * 14,
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
        p.vy += 0.35; // gravitatsiya
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
  } catch (e) {
    console.error(e);
  }
};

// Web Audio API orqali zavqli ovoz chiqarish (hech qanday tashqi audio fayl kerak emas)
const playChime = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Brauzer ovoz siyosatiga tushsa e'tiborsiz qoldiramiz
  }
};

function App() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form maydonlari
  const [newTodo, setNewTodo] = useState('');
  const [category, setCategory] = useState('work');
  const [priority, setPriority] = useState('medium');

  // Filter va qidiruv
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, completed
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Tahrirlash (Inline editing)
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  // Mavzu (Dark/Light) va Ovoz sozlamalari
  const [theme, setTheme] = useState(() => localStorage.getItem('todo_theme') || 'dark');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Mavzuni HTML ga ulash
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('todo_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // 1. Real-time Firebase Listener
  useEffect(() => {
    const q = query(collection(db, 'todos'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setTodos(list);
        setLoading(false);
      },
      error => {
        console.error('Firestore xatosi:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Yangi vazifa qo'shish
  const addTodo = async e => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const textToAdd = newTodo.trim();
    setNewTodo('');

    try {
      await addDoc(collection(db, 'todos'), {
        text: textToAdd,
        category,
        priority,
        completed: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Qo'shishda xatolik:", error);
    }
  };

  // 3. Vazifani o'chirish
  const deleteTodo = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'todos', id));
    } catch (error) {
      console.error("O'chirishda xatolik:", error);
    }
  };

  // 4. Bajarildi holatini o'zgartirish
  const toggleComplete = async todo => {
    try {
      const willBeCompleted = !todo.completed;
      const todoRef = doc(db, 'todos', todo.id);
      await updateDoc(todoRef, {
        completed: willBeCompleted
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

  // 6. Bajarilganlarni tozalash (Bulk action)
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

  // Statistika hisoblash
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

  // Filtrlash va qidiruv mantig'i
  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      // Holat filtri
      if (statusFilter === 'active' && todo.completed) return false;
      if (statusFilter === 'completed' && !todo.completed) return false;

      // Kategoriya filtri
      if (selectedCategory !== 'all' && todo.category !== selectedCategory) return false;

      // Qidiruv
      if (searchQuery.trim()) {
        const queryLower = searchQuery.toLowerCase();
        const textMatch = (todo.text || '').toLowerCase().includes(queryLower);
        return textMatch;
      }

      return true;
    });
  }, [todos, statusFilter, selectedCategory, searchQuery]);

  // Bugungi sana (Lazy initializer)
  const [todayFormatted] = useState(() => {
    return new Date().toLocaleDateString('uz-UZ', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  });

  return (
    <div className="app-wrapper">
      <div className="todo-card">
        {/* Yuqori Panel: Sarlavha va Rejim tugmalari */}
        <header className="header-top">
          <div className="header-title-box">
            <h1>
              <span>🚀</span> Task Flow
            </h1>
            <div className="header-date">{todayFormatted}</div>
          </div>

          <div className="header-actions">
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

        {/* Progress & Statistika kartasi */}
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

        {/* Yangi vazifa qo'shish formasi */}
        <form onSubmit={addTodo} className="todo-form">
          <div className="form-input-row">
            <input
              type="text"
              value={newTodo}
              onChange={e => setNewTodo(e.target.value)}
              placeholder="Qanday rejangiz bor? Masalan: Loyiha dizaynini yakunlash..."
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

          {/* Kategoriya bo'yicha chip filterlar */}
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
            <div className="state-desc">Firebase bazasi bilan ulanmoqda</div>
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

              return (
                <li
                  key={todo.id}
                  className={`todo-item ${todo.completed ? 'completed' : ''}`}
                >
                  {/* Muhimlik chizig'i */}
                  <div
                    className="priority-stripe"
                    style={{ backgroundColor: prioConfig.color }}
                  />

                  {/* Maxsus Checkbox */}
                  <button
                    onClick={() => toggleComplete(todo)}
                    className={`checkbox-btn ${todo.completed ? 'checked' : ''}`}
                    title={todo.completed ? 'Qaytarish' : 'Bajarildi deb belgilash'}
                  >
                    {todo.completed ? '✓' : ''}
                  </button>

                  {/* Vazifa matni yoki Tahrirlash maydoni */}
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
                        </div>
                      </>
                    )}
                  </div>

                  {/* Amallar: Tahrirlash va O'chirish */}
                  {!isEditing && (
                    <div className="todo-actions">
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

        {/* Pastki Qism: Bajarilganlarni tozalash */}
        {completedCount > 0 && (
          <footer className="footer-bar">
            <span>{completedCount} ta vazifa bajarildi</span>
            <button onClick={clearCompleted} className="btn-clear">
              Bajarilganlarni tozalash
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}

export default App;
