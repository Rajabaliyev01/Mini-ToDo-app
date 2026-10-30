import { useState, useEffect } from 'react';
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

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. Real-time Listener (Bazani jonli kuzatish + tartiblash)
  useEffect(() => {
    const q = query(collection(db, "todos"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTodos(list);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore xatosi: ", error);
        setLoading(false);
      }
    );

    return () => unsubscribe(); // Komponent yopilganda tinglovchini to'xtatadi
  }, []);

  // 2. CREATE: Yangi vazifa qo'shish
  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const textToAdd = newTodo.trim();
    setNewTodo(''); // Inputni darhol tozalaymiz (sekinlashuv sezilmasligi uchun)

    try {
      await addDoc(collection(db, "todos"), {
        text: textToAdd,
        completed: false,
        createdAt: serverTimestamp() // Firebase serverining aniq vaqti
      });
    } catch (error) {
      console.error("Qo'shishda xatolik: ", error);
    }
  };

  // 3. DELETE: Vazifani o'chirish
  const deleteTodo = async (id) => {
    try {
      await deleteDoc(doc(db, "todos", id));
    } catch (error) {
      console.error("O'chirishda xatolik: ", error);
    }
  };

  // 4. UPDATE: Bajarildi holatini o'zgartirish
  const toggleComplete = async (todo) => {
    try {
      const todoRef = doc(db, "todos", todo.id);
      await updateDoc(todoRef, {
        completed: !todo.completed
      });
    } catch (error) {
      console.error("Yangilashda xatolik: ", error);
    }
  };

  return (
    <div style={{ maxWidth: '450px', margin: '40px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <h2 style={{ textAlign: 'center' }}>Mini Todo App (Real-time Firebase)</h2>

      <form onSubmit={addTodo} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Yangi vazifa yozing..."
          style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 18px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Qo'shish
        </button>
      </form>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Vazifalar ro'yxati:</h3>
        <span style={{ fontSize: '13px', color: '#666' }}>
          Jami: {todos.length} ta
        </span>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>Yuklanmoqda... ⏳</p>
      ) : todos.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#888', marginTop: '30px' }}>
          Hozircha vazifalar yo'q 🎉
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {todos.map(todo => (
            <li
              key={todo.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px',
                borderBottom: '1px solid #eee',
                backgroundColor: todo.completed ? '#f9f9f9' : 'transparent',
                borderRadius: '4px',
                marginBottom: '4px'
              }}
            >
              <span
                onClick={() => toggleComplete(todo)}
                style={{
                  cursor: 'pointer',
                  textDecoration: todo.completed ? 'line-through' : 'none',
                  color: todo.completed ? '#888' : '#222',
                  flex: 1,
                  userSelect: 'none'
                }}
              >
                {todo.completed ? '✅ ' : '⏳ '} {todo.text}
              </span>

              <button
                onClick={() => deleteTodo(todo.id)}
                style={{
                  background: '#ff4d4d',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                O'chirish
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
