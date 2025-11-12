// common.js - with enhanced debugging
const API_BASE = '/api';

function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return ('' + unsafe)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// Public API requests (no auth required)
async function publicApiGet(path) {
  try {
    const fullUrl = API_BASE + path;
    // console.log(`🌐 Public API GET: ${fullUrl}`);
    // console.log(`📍 Full URL: ${window.location.origin}${fullUrl}`);
    
    const res = await fetch(fullUrl);
    
    // console.log(`📨 Response status: ${res.status} ${res.statusText}`);
    // console.log(`📨 Response headers:`, Object.fromEntries(res.headers.entries()));
    
    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}`;
      let errorDetails = '';
      
      try {
        const errorText = await res.text();
        console.log(`❌ Error response text:`, errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
          errorDetails = errorData.error || '';
        } catch {
          errorMessage = errorText || errorMessage;
        }
      } catch (textError) {
        console.error('❌ Could not read error response:', textError);
      }
      
      const fullError = errorDetails ? `${errorMessage} - ${errorDetails}` : errorMessage;
      throw new Error(fullError);
    }
    
    const data = await res.json();
    // console.log(`✅ Public API success, received data:`, data);
    return data;
  } catch (error) {
    console.error('❌ Public API GET Error:', error);
    console.error('❌ Error stack:', error.stack);
    throw error;
  }
}

// ... rest of your common.js functions remain the same
async function apiGet(path) {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }
    
    // console.log(`🔐 Auth API GET: ${API_BASE + path}`);
    const res = await fetch(API_BASE + path, { headers });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    // console.error('API GET Error:', error);
    throw error;
  }
}

async function apiPost(path, data) {
  try {
    const isFormData = data instanceof FormData;
    const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
    
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    const res = await fetch(API_BASE + path, {
      method: 'POST',
      headers,
      body: isFormData ? data : JSON.stringify(data)
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('API POST Error:', error);
    throw error;
  }
}

async function apiPut(path, data) {
  try {
    const isFormData = data instanceof FormData;
    const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
    
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    const res = await fetch(API_BASE + path, {
      method: 'PUT',
      headers,
      body: isFormData ? data : JSON.stringify(data)
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('API PUT Error:', error);
    throw error;
  }
}

async function apiDelete(path) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    const res = await fetch(API_BASE + path, {
      method: 'DELETE',
      headers
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('API DELETE Error:', error);
    throw error;
  }
}

function getUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

function ensureAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/';
    throw new Error('Not authenticated');
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

function insertNavbar() {
  const user = getUser();
  const navHtml = `
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div class="container">
        <a class="navbar-brand" href="/dashboard.html">AdminPanel</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navmenu">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navmenu">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item"><a class="nav-link" href="/dashboard.html">Dashboard</a></li>
            <li class="nav-item"><a class="nav-link" href="/users.html">Users</a></li>
            <li class="nav-item"><a class="nav-link" href="/products.html">Products</a></li>
          </ul>
          <div class="d-flex align-items-center">
            <div class="me-3 small text-muted">
              ${user ? escapeHtml(user.name) + ' (' + escapeHtml(user.role) + ')' : ''}
            </div>
            <button id="logoutBtn" class="btn btn-outline-danger btn-sm">Logout</button>
          </div>
        </div>
      </div>
    </nav>
  `;
  document.getElementById('nav-placeholder').innerHTML = navHtml;
  document.getElementById('logoutBtn').addEventListener('click', logout);
}