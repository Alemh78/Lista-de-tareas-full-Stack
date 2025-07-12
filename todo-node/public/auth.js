const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const messageDiv = document.getElementById('message');

// LOGIN
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (res.ok) {
    localStorage.setItem('token', data.token);
    window.location.href = 'index.html'; // Redirige correctamente
  } else {
    messageDiv.textContent = data.error || 'Error al iniciar sesión';
  }
});

// REGISTRO
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('register-username').value;
  const password = document.getElementById('register-password').value;

  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (res.ok) {
    messageDiv.textContent = 'Usuario registrado. Ahora podés iniciar sesión.';
  } else {
    messageDiv.textContent = data.error || 'Error al registrarse';
  }
});
