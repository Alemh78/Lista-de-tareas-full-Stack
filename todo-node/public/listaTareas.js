const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');

let tasks = [];
const token = localStorage.getItem('token');
if (!token) location.href = 'login.html';

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  };
}

async function fetchTasks() {
  try {
    const res = await fetch('/api/tasks', { headers: authHeaders() });
    if (!res.ok) throw new Error();
    tasks = await res.json();
    renderTasks();
  } catch (e) {
    alert('Sesión expirada. Iniciá sesión de nuevo.');
    logout();
  }
}

function renderTasks() {
  taskList.innerHTML = '';
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = task.completed ? 'completed' : '';
    li.innerHTML = `
      <span>${task.text}</span>
      <div>
        <button onclick="toggleTask(${task.id})">${task.completed ? 'Desmarcar' : 'Completada'}</button>
        <button onclick="editTask(${task.id})">Editar</button>
        <button onclick="deleteTask(${task.id})">Eliminar</button>
      </div>
    `;
    taskList.appendChild(li);
  });
}

taskForm.addEventListener('submit', async e => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ text })
  });
  const newTask = await res.json();
  tasks.push(newTask);
  taskInput.value = '';
  renderTasks();
});

window.toggleTask = async (id) => {
  const task = tasks.find(t => t.id === id);
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ text: task.text, completed: !task.completed })
  });
  const updated = await res.json();
  tasks = tasks.map(t => t.id === id ? updated : t);
  renderTasks();
};

window.editTask = async (id) => {
  const task = tasks.find(t => t.id === id);
  const newText = prompt('Editar tarea:', task.text);
  if (!newText) return;
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ text: newText, completed: task.completed })
  });
  const updated = await res.json();
  tasks = tasks.map(t => t.id === id ? updated : t);
  renderTasks();
};

window.deleteTask = async (id) => {
  await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  tasks = tasks.filter(t => t.id !== id);
  renderTasks();
};

function logout() {
  localStorage.removeItem('token');
  location.href = 'login.html';
}

fetchTasks();
