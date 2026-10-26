/* ============================================================
   IMovies — Frontend Application Logic
   Cinema Booking Platform (Real-World Experience)
   ============================================================ */

const API = '/api';
let currentUser = null;
let token = localStorage.getItem('imovies_token');
let allMovies = [];
let activeGenre = 'all';

// Active booking state
let selectedShowtime = null;
let selectedSeats = [];
let currentShowtimeData = null;
let currentMovieDateMap = {};
let currentActiveDate = '';
let currentMovieData = null;
let selectedSnacks = {}; // { 'popcorn-caramel': { name: '...', price: 250, qty: 1 } }
let activePaymentMethod = 'upi';
let seatLockTimerInterval = null;
let seatLockSecondsLeft = 600; // 10 minutes

// ── Seat Layout Configuration ────────────────────────────────
const SEAT_LAYOUT = {
  vip:     { rows: ['A', 'B'], seats: 8, label: '👑 VIP Recliners' },
  premium: { rows: ['C', 'D', 'E'], seats: 10, label: '⭐ Prime Plus' },
  standard:{ rows: ['F', 'G', 'H', 'I', 'J', 'K'], seats: 10, label: '🪑 Classic' }
};

// ── F&B Snacks Menu ──────────────────────────────────────────
const SNACKS_MENU = [
  {
    id: 'popcorn-caramel',
    name: 'Caramel Gourmet Popcorn',
    desc: 'Crisp mushroom popcorn coated in rich golden caramel glaze',
    price: 250,
    category: 'popcorn',
    veg: true,
    img: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400&q=80'
  },
  {
    id: 'popcorn-salted',
    name: 'Classic Golden Butter Popcorn',
    desc: 'Freshly popped theater-style popcorn with melted butter',
    price: 200,
    category: 'popcorn',
    veg: true,
    img: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400&q=80'
  },
  {
    id: 'pepsi-large',
    name: 'Pepsi Chilled (Large 650ml)',
    desc: 'Ice-cold refreshing carbonated soft beverage',
    price: 130,
    category: 'beverage',
    veg: true,
    img: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&q=80'
  },
  {
    id: 'nachos-cheese',
    name: 'Mexican Cheesy Nachos',
    desc: 'Crunchy tortilla chips with warm cheese sauce and tangy salsa',
    price: 220,
    category: 'snacks',
    veg: true,
    img: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&q=80'
  },
  {
    id: 'combo-blockbuster',
    name: 'Blockbuster Duo Combo',
    desc: '1 Large Popcorn Tub + 2 Large Soft Drinks (Save ₹160)',
    price: 420,
    category: 'combos',
    veg: true,
    img: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=400&q=80'
  },
  {
    id: 'chicken-sliders',
    name: 'Crispy Gourmet Sliders (2 Pcs)',
    desc: 'Grilled patties with caramelized onions and spicy mayo',
    price: 240,
    category: 'snacks',
    veg: false,
    img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80'
  }
];

// ── Theme Manager ────────────────────────────────────────────
const THEMES = [
  { id: 'gold', name: 'Gold Luxe', icon: '👑' },
  { id: 'cyber', name: 'Cyber Neon', icon: '🌌' },
  { id: 'crimson', name: 'Crimson Red', icon: '🔴' }
];
let currentThemeIndex = 0;

function applyTheme(themeId) {
  document.documentElement.setAttribute('data-theme', themeId);
  localStorage.setItem('imovies_theme', themeId);
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  currentThemeIndex = THEMES.findIndex(t => t.id === themeId);
  if (currentThemeIndex === -1) currentThemeIndex = 0;
  const iconEl = document.getElementById('themeIcon');
  const nameEl = document.getElementById('themeName');
  if (iconEl) iconEl.textContent = theme.icon;
  if (nameEl) nameEl.textContent = theme.name;
}

function cycleTheme() {
  currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
  applyTheme(THEMES[currentThemeIndex].id);
  showToast(`Palette changed to: ${THEMES[currentThemeIndex].name}`, 'info');
}

function initTheme() {
  const saved = localStorage.getItem('imovies_theme') || 'gold';
  applyTheme(saved);
}

// ── Scroll to Top & Host Highlights ──────────────────────────
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupScrollMonitor() {
  window.addEventListener('scroll', () => {
    const scrollBtn = document.getElementById('scrollTopBtn');
    if (scrollBtn) {
      scrollBtn.classList.toggle('visible', window.scrollY > 180);
    }
    document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 30);
  });
}

function setupHostHighlight() {
  const currentPort = window.location.port || '5000';
  document.querySelectorAll('.host-link').forEach(link => {
    link.classList.toggle('active', link.textContent.trim() === currentPort);
  });
}

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupHostHighlight();
  if (token) restoreSession();
  loadMovies();
  setupScrollMonitor();
  showPage('home');
});

// ============================================================
// NAVIGATION
// ============================================================
function showPage(page) {
  document.body.style.overflow = 'auto';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const el = document.getElementById(`page-${page}`);
  if (el) {
    el.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const linkMap = { home: 0, movies: 1, bookings: 2 };
  if (linkMap[page] !== undefined) {
    document.querySelectorAll('.nav-link')[linkMap[page]]?.classList.add('active');
  }

  if (page === 'movies') renderMoviesPage();
  if (page === 'bookings') loadBookings();
  if (page === 'home') loadHomeMovies();
}

function scrollToFeatured() {
  document.getElementById('featuredSection')?.scrollIntoView({ behavior: 'smooth' });
}

// ============================================================
// API UTILS
// ============================================================
async function apiCall(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${endpoint}`, { ...options, headers: { ...headers, ...options.headers } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ============================================================
// SESSION / AUTH
// ============================================================
async function restoreSession() {
  try {
    const data = await apiCall('/auth/me');
    setUser(data.user);
  } catch {
    clearSession();
  }
}

function setUser(user) {
  currentUser = user;
  token = localStorage.getItem('imovies_token');
  document.getElementById('authButtons')?.classList.add('hidden');
  document.getElementById('userMenu')?.classList.remove('hidden');
  const nameEl = document.getElementById('userName');
  const avatarEl = document.getElementById('userAvatar');
  if (nameEl) nameEl.textContent = user.name.split(' ')[0];
  if (avatarEl) avatarEl.textContent = user.name[0].toUpperCase();
}

function clearSession() {
  currentUser = null;
  token = null;
  localStorage.removeItem('imovies_token');
  document.getElementById('authButtons')?.classList.remove('hidden');
  document.getElementById('userMenu')?.classList.add('hidden');
}

function logout() {
  clearSession();
  showToast('Logged out successfully', 'info');
  showPage('home');
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  btn.textContent = 'Signing in...';
  btn.disabled = true;
  try {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
      })
    });
    token = data.token;
    localStorage.setItem('imovies_token', token);
    setUser(data.user);
    closeModal('loginModal');
    showToast(`Welcome back, ${data.user.name.split(' ')[0]}! 🎬`, 'success');
    e.target.reset();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.textContent = 'Sign In';
    btn.disabled = false;
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('registerBtn');
  btn.textContent = 'Creating...';
  btn.disabled = true;
  try {
    const data = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        phone: document.getElementById('regPhone').value,
        password: document.getElementById('regPassword').value
      })
    });
    token = data.token;
    localStorage.setItem('imovies_token', token);
    setUser(data.user);
    closeModal('registerModal');
    showToast(`Welcome to IMovies, ${data.user.name.split(' ')[0]}! 🎉`, 'success');
    e.target.reset();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.textContent = 'Create Account';
    btn.disabled = false;
  }
}

// ============================================================
// MOVIES CATALOG
// ============================================================
async function loadMovies() {
  try {
    const data = await apiCall('/movies');
    allMovies = data.data || [];
    loadHomeMovies();
  } catch (err) {
    console.error('Failed to load movies', err);
  }
}

function loadHomeMovies() {
  // Hero featured cards
  const heroContainer = document.getElementById('heroFeaturedCards');
  const featured = allMovies.filter(m => m.featured).slice(0, 3);
  if (heroContainer) {
    heroContainer.innerHTML = featured.map((m, i) => `
      <div class="hero-feat-card" onclick="openMovieDetail('${m._id}')" style="animation-delay:${0.2 + i * 0.2}s">
        <img src="${m.posterUrl || 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=300&q=60'}" alt="${m.title}" onerror="this.src='https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=300&q=60'" />
        <div class="hero-feat-info">
          <h4>${m.title}</h4>
          <span>⭐ ${m.rating ? m.rating.toFixed(1) : '8.5'}</span>
        </div>
      </div>`).join('');
  }

  // Featured section
  const featuredGrid = document.getElementById('featuredMovies');
  if (featuredGrid) {
    const toShow = allMovies.filter(m => m.featured).slice(0, 4);
    featuredGrid.innerHTML = toShow.map(m => movieCardHTML(m)).join('');
  }
}

function movieCardHTML(movie) {
  const genres = (movie.genre || []).slice(0, 2).map(g => `<span class="genre-tag">${g}</span>`).join('');
  return `
    <div class="movie-card" onclick="openMovieDetail('${movie._id}')">
      <div class="movie-card-poster">
        ${movie.featured ? '<div class="movie-badge">Featured</div>' : ''}
        <img src="${movie.posterUrl || 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=70'}"
             alt="${movie.title}"
             onerror="this.src='https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=70'" />
        <div class="movie-card-overlay">
          ${genres}
          <button class="btn btn-primary btn-sm" style="margin-top:0.5rem">Book Now</button>
        </div>
      </div>
      <div class="movie-card-body">
        <div class="movie-card-title">${movie.title}</div>
        <div class="movie-card-meta">
          <span class="movie-card-rating">⭐ ${movie.rating ? movie.rating.toFixed(1) : '8.5'}</span>
          <span>· ${movie.duration} min</span>
          <span>· ${movie.language || 'English'}</span>
        </div>
      </div>
    </div>`;
}

function renderMoviesPage() {
  const grid = document.getElementById('allMoviesGrid');
  const search = document.getElementById('movieSearch')?.value?.toLowerCase() || '';
  let filtered = allMovies;
  if (activeGenre !== 'all') filtered = filtered.filter(m => m.genre?.includes(activeGenre));
  if (search) filtered = filtered.filter(m => m.title.toLowerCase().includes(search));
  if (!filtered.length) {
    grid.innerHTML = `<div class="loading-state"><div class="empty-state-icon">🎬</div><p>No movies found matching criteria</p></div>`;
    return;
  }
  grid.innerHTML = filtered.map(m => movieCardHTML(m)).join('');
}

function filterMovies() { renderMoviesPage(); }

function filterByGenre(genre, el) {
  activeGenre = genre;
  document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderMoviesPage();
}

// ============================================================
// MOVIE DETAIL & SHOWTIMES (DATE SELECTION FIX)
// ============================================================
async function openMovieDetail(movieId) {
  showPage('movie-detail');
  const container = document.getElementById('movieDetailContent');
  container.innerHTML = `<div class="full-spinner"><div class="spinner"></div><p>Loading movie experience...</p></div>`;

  try {
    const [movieData, showtimesData] = await Promise.all([
      apiCall(`/movies/${movieId}`),
      apiCall(`/showtimes?movieId=${movieId}`)
    ]);
    const movie = movieData.data;
    currentMovieData = movie;
    const showtimes = showtimesData.data || [];

    // Group showtimes by date
    currentMovieDateMap = {};
    showtimes.forEach(st => {
      if (!currentMovieDateMap[st.date]) currentMovieDateMap[st.date] = [];
      currentMovieDateMap[st.date].push(st);
    });

    const dates = Object.keys(currentMovieDateMap).sort().slice(0, 7);
    currentActiveDate = dates[0] || '';

    container.innerHTML = `
      <button class="back-btn" onclick="showPage('movies')">← Back to Movies</button>
      <div class="movie-detail-hero">
        <div class="movie-detail-bg" style="background-image:url('${movie.posterUrl}')"></div>
        <div class="movie-detail-overlay"></div>
        <div class="movie-detail-content">
          <div class="movie-detail-poster">
            <img src="${movie.posterUrl}" alt="${movie.title}" onerror="this.src='https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=70'" />
          </div>
          <div class="movie-detail-info">
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem">
              ${(movie.genre || []).map(g => `<span class="genre-tag">${g}</span>`).join('')}
              <span class="genre-tag" style="background:rgba(0,230,118,0.15);color:#00e676;border-color:rgba(0,230,118,0.3)">U/A 13+</span>
            </div>
            <h1 class="movie-detail-title">${movie.title}</h1>
            <div class="movie-detail-meta">
              <span>⭐ <span class="movie-detail-rating">${movie.rating ? movie.rating.toFixed(1) : '8.8'}</span> / 10</span>
              <span>🍅 94% Tomatometer</span>
              <span>🕐 ${movie.duration} minutes</span>
              <span>🌐 ${movie.language || 'English'}</span>
              ${movie.director ? `<span>🎬 Dir: ${movie.director}</span>` : ''}
            </div>
            <p class="movie-detail-desc">${movie.description}</p>
            <div class="movie-detail-actions">
              <button class="btn btn-hero" onclick="document.getElementById('showtimes-section').scrollIntoView({behavior:'smooth'})">
                🎟️ Book Tickets
              </button>
              ${movie.trailerUrl ? `
                <button class="btn btn-ghost" onclick="playTrailer('${movie.trailerUrl}')">
                  ▶ Watch Trailer
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>

      ${movie.cast?.length ? `
      <div class="cast-section">
        <h3 class="section-title" style="font-size:1.3rem">Top Cast</h3>
        <div class="cast-list">${movie.cast.map(c => `<div class="cast-chip">👤 ${c}</div>`).join('')}</div>
      </div>` : ''}

      <div class="showtimes-section" id="showtimes-section">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem">
          <div>
            <h2 class="section-title" style="margin-bottom:0.25rem">🗓️ Select <span class="gradient-text">Date & Showtime</span></h2>
            <p style="color:var(--text-secondary);font-size:0.9rem">📍 IMovies Grand Luxe Cineplex · 4K Laser & Dolby Atmos</p>
          </div>
        </div>

        ${dates.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">😢</div>
            <p>No showtimes available for this title right now.</p>
          </div>
        ` : `
          <!-- Date Tabs Carousel -->
          <div class="date-tabs-container">
            <div class="date-tabs" id="dateTabs">
              ${dates.map((d, i) => {
                const dt = new Date(d + 'T00:00:00');
                const isToday = i === 0;
                const isTomorrow = i === 1;
                const dayLabel = isToday ? 'TODAY' : isTomorrow ? 'TOMORROW' : dt.toLocaleDateString('en-US', { weekday: 'short' });
                const dateNum = dt.toLocaleDateString('en-US', { day: 'numeric' });
                const monthName = dt.toLocaleDateString('en-US', { month: 'short' });
                return `
                  <div class="date-tab ${i === 0 ? 'active' : ''}" data-date="${d}" onclick="switchDate('${d}')">
                    <div class="day">${dayLabel}</div>
                    <div class="date-num">${dateNum}</div>
                    <div class="month">${monthName}</div>
                  </div>`;
              }).join('')}
            </div>
          </div>

          <!-- Showtime Cards Grid -->
          <div class="showtime-grid" id="showtimeGrid">
            ${renderShowtimeCards(currentMovieDateMap[currentActiveDate] || [], currentActiveDate)}
          </div>
        `}
      </div>`;
  } catch (err) {
    container.innerHTML = `<div class="full-spinner"><p>Failed to load movie details. Please try again.</p></div>`;
    showToast(err.message, 'error');
  }
}

// Fixed Date Switcher: Clean JS state reference without broken HTML inline quotes
function switchDate(date) {
  currentActiveDate = date;
  document.querySelectorAll('.date-tab').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-date') === date);
  });
  const showtimes = currentMovieDateMap[date] || [];
  const grid = document.getElementById('showtimeGrid');
  if (grid) {
    grid.innerHTML = renderShowtimeCards(showtimes, date);
  }
}

function renderShowtimeCards(shows, date) {
  if (!shows.length) {
    return `<div class="empty-state" style="grid-column:1/-1;padding:3rem"><p>No shows scheduled on this date.</p></div>`;
  }

  return shows.map(st => {
    const bookedCount = st.bookedSeats?.length || 0;
    const available = st.totalSeats - bookedCount;
    const isFillingFast = available < 20;

    // Format 12-hr time
    let formattedTime = st.startTime;
    try {
      const [h, m] = st.startTime.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      formattedTime = `${formattedHour}:${m} ${ampm}`;
    } catch {}

    const hallName = st.hall || 'Audi 1 (IMAX 3D)';
    const formatBadge = hallName.includes('IMAX') ? 'IMAX 3D' : hallName.includes('4DX') ? '4DX' : 'DOLBY ATMOS';

    return `
      <div class="showtime-card" onclick="openSeatSelect('${st._id}', '${date}')">
        <div class="showtime-header">
          <div class="time">${formattedTime}</div>
          <span class="showtime-badge">${formatBadge}</span>
        </div>
        <div class="showtime-hall">🏛️ ${hallName}</div>
        <div class="showtime-footer">
          <div class="price">₹${st.price?.standard || 150} onwards</div>
          <div class="showtime-status">
            <span class="status-dot ${isFillingFast ? 'orange' : 'green'}"></span>
            <span style="color:${isFillingFast ? '#ff9100' : '#00e676'}">${available} left</span>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ============================================================
// TRAILER MODAL
// ============================================================
function playTrailer(url) {
  const container = document.getElementById('trailerContainer');
  if (!container) return;
  // Embed with autoplay
  const embedUrl = url.includes('embed') ? url : url.replace('watch?v=', 'embed/');
  container.innerHTML = `<iframe src="${embedUrl}?autoplay=1&rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  openModal('trailerModal');
}

function closeTrailerModal() {
  const container = document.getElementById('trailerContainer');
  if (container) container.innerHTML = '';
  closeModal('trailerModal');
}

// ============================================================
// SEAT SELECTION & LIVE SEAT LOCKING
// ============================================================
async function openSeatSelect(showtimeId, date) {
  showPage('seat-select');
  selectedSeats = [];
  selectedSnacks = {};
  const container = document.getElementById('seatSelectContent');
  container.innerHTML = `<div class="full-spinner"><div class="spinner"></div><p>Loading interactive seat layout...</p></div>`;

  try {
    const data = await apiCall(`/showtimes/${showtimeId}`);
    currentShowtimeData = data.data;
    const st = currentShowtimeData;
    const movie = st.movie;

    // Booked & locked seats
    const bookedSet = new Set(st.bookedSeats || []);
    const now = new Date();
    const lockedSet = new Set((st.lockedSeats || []).filter(l => {
      const until = new Date(l.lockedUntil);
      const byMe = currentUser && l.userId === currentUser._id;
      return until > now && !byMe;
    }).map(l => l.seat));

    startSeatLockTimer();

    container.innerHTML = `
      <button class="back-btn" onclick="openMovieDetail('${movie?._id}')">← Back to Showtimes</button>
      <div class="seat-select-wrapper">
        <div class="seat-lock-banner">
          <div style="display:flex;align-items:center;gap:0.75rem">
            <span style="font-size:1.3rem">⏱️</span>
            <div>
              <div style="font-weight:700;font-size:0.95rem">Seats Reservation Timer</div>
              <div style="font-size:0.78rem;color:var(--text-secondary)">Your selected seats will be held securely</div>
            </div>
          </div>
          <div class="timer-count" id="seatTimerCount">10:00</div>
        </div>

        <div class="seat-info-bar">
          <div>
            <div class="seat-info-movie">${movie?.title || 'Movie'}</div>
            <div class="seat-info-meta">
              <span>🕐 ${st.startTime}</span>
              <span>📅 ${st.date}</span>
              <span>🏛️ ${st.hall}</span>
              <span>🌐 ${movie?.language || 'English'}</span>
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:0.8rem;color:var(--text-muted)">Starting from</div>
            <div style="font-family:var(--font-display);font-weight:800;color:var(--gold);font-size:1.3rem">₹${st.price?.standard || 150}</div>
          </div>
        </div>

        <div class="screen-indicator">🎬 SCREEN THIS WAY</div>

        ${buildSeatMap(bookedSet, lockedSet, st)}

        <div class="seat-legend">
          <div class="legend-item"><div class="legend-box" style="background:rgba(255,255,255,0.12);border-color:rgba(255,255,255,0.2)"></div> Available</div>
          <div class="legend-item"><div class="legend-box" style="background:linear-gradient(135deg, var(--accent3), #4a42cc);border-color:#6c63ff"></div> Selected</div>
          <div class="legend-item"><div class="legend-box" style="background:rgba(229,9,20,0.2);border-color:rgba(229,9,20,0.3)"></div> Occupied</div>
          <div class="legend-item"><div class="legend-box" style="background:rgba(245,166,35,0.2);border-color:rgba(245,166,35,0.4)"></div> Reserved</div>
          <div class="legend-item"><div class="legend-box" style="background:rgba(245,166,35,0.15);border-color:rgba(245,166,35,0.3)"></div> 👑 VIP</div>
        </div>

        <div class="booking-summary-bar" id="bookingSummaryBar">
          <div>
            <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.4rem">Selected Seats</div>
            <div class="selected-seats-display" id="selectedSeatsDisplay">
              <span style="color:var(--text-muted);font-size:0.85rem">Select your preferred seats</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:1.25rem">
            <div class="total-display">
              <div class="label" style="font-size:0.8rem;color:var(--text-muted)">Ticket Total</div>
              <div class="amount" id="totalAmount">₹0</div>
            </div>
            <button class="btn btn-primary" onclick="openFoodModal('${showtimeId}')" id="checkoutBtn" disabled>
              Continue to F&B 🍿 →
            </button>
          </div>
        </div>
      </div>`;
  } catch (err) {
    container.innerHTML = `<div class="full-spinner"><p>Failed to load seats. Please try again.</p></div>`;
    showToast(err.message, 'error');
  }
}

function startSeatLockTimer() {
  clearInterval(seatLockTimerInterval);
  seatLockSecondsLeft = 600;
  seatLockTimerInterval = setInterval(() => {
    seatLockSecondsLeft--;
    const m = Math.floor(seatLockSecondsLeft / 60);
    const s = seatLockSecondsLeft % 60;
    const countEl = document.getElementById('seatTimerCount');
    if (countEl) countEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    if (seatLockSecondsLeft <= 0) {
      clearInterval(seatLockTimerInterval);
      showToast('Seat lock reservation expired. Please select again.', 'info');
      if (currentShowtimeData) openSeatSelect(currentShowtimeData._id, currentShowtimeData.date);
    }
  }, 1000);
}

function buildSeatMap(bookedSet, lockedSet, st) {
  let html = '';
  Object.entries(SEAT_LAYOUT).forEach(([cat, config]) => {
    html += `
      <div class="seat-category-section">
        <div class="category-label">${config.label} — ₹${st.price?.[cat] || 150}</div>`;
    config.rows.forEach(row => {
      html += `<div class="seat-row"><div class="row-label">${row}</div>`;
      for (let i = 1; i <= config.seats; i++) {
        const seatId = `${row}${i}`;
        let cls = `seat ${cat}`;
        let onclick = '';
        if (bookedSet.has(seatId)) {
          cls += ' booked';
        } else if (lockedSet.has(seatId)) {
          cls += ' locked';
        } else {
          cls += ' available';
          onclick = `onclick="toggleSeat('${seatId}','${cat}',${st.price?.[cat] || 150},this)"`;
        }
        html += `<div class="${cls}" id="seat-${seatId}" title="${seatId} (₹${st.price?.[cat] || 150})" ${onclick}></div>`;
      }
      html += `</div>`;
    });
    html += `</div>`;
  });
  return html;
}

function toggleSeat(seatId, category, price, el) {
  const idx = selectedSeats.findIndex(s => s.id === seatId);
  if (idx > -1) {
    selectedSeats.splice(idx, 1);
    el.classList.remove('selected');
  } else {
    if (selectedSeats.length >= 8) {
      showToast('Maximum 8 seats allowed per reservation', 'info');
      return;
    }
    selectedSeats.push({ id: seatId, category, price });
    el.classList.add('selected');
  }
  updateBookingSummary();
}

function updateBookingSummary() {
  const display = document.getElementById('selectedSeatsDisplay');
  const totalEl = document.getElementById('totalAmount');
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (!display || !totalEl || !checkoutBtn) return;

  if (!selectedSeats.length) {
    display.innerHTML = `<span style="color:var(--text-muted);font-size:0.85rem">Select your preferred seats</span>`;
    totalEl.textContent = '₹0';
    checkoutBtn.disabled = true;
    return;
  }

  display.innerHTML = selectedSeats.map(s => `<span class="seat-chip">${s.id}</span>`).join('');
  const total = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  totalEl.textContent = `₹${total}`;
  checkoutBtn.disabled = false;
}

// ============================================================
// STEP 2: FOOD & BEVERAGE ADD-ONS (GRAB-A-BITE)
// ============================================================
async function openFoodModal(showtimeId) {
  if (!currentUser) {
    openModal('loginModal');
    showToast('Please login to continue booking', 'info');
    return;
  }
  if (!selectedSeats.length) {
    showToast('Please select at least 1 seat', 'info');
    return;
  }

  // Lock seats on backend
  try {
    const seatIds = selectedSeats.map(s => s.id);
    await apiCall('/showtimes/action/lock', {
      method: 'POST',
      body: JSON.stringify({ showtimeId, seats: seatIds })
    });
  } catch (err) {
    showToast(err.message, 'error');
    return;
  }

  renderFoodModal();
  openModal('foodModal');
}

function renderFoodModal() {
  const content = document.getElementById('foodModalContent');
  if (!content) return;

  const ticketTotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const snacksTotal = Object.values(selectedSnacks).reduce((sum, item) => sum + (item.price * item.qty), 0);

  content.innerHTML = `
    <div class="modal-header" style="text-align:left;margin-bottom:1rem">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:2rem">🍿</span>
        <div>
          <h2>Grab a Bite!</h2>
          <p>Pre-book cinema snacks & drinks with up to 25% discount</p>
        </div>
      </div>
    </div>

    <div class="food-grid">
      ${SNACKS_MENU.map(item => {
        const currentQty = selectedSnacks[item.id]?.qty || 0;
        return `
          <div class="food-card">
            <img src="${item.img}" class="food-thumb" alt="${item.name}" />
            <div class="food-content">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font-size:0.75rem">${item.veg ? '🟢 Veg' : '🔴 Non-Veg'}</span>
              </div>
              <div class="food-title">${item.name}</div>
              <div class="food-desc">${item.desc}</div>
              <div class="food-bottom">
                <div class="food-price">₹${item.price}</div>
                <div style="display:flex;align-items:center;gap:8px">
                  <button class="stepper-btn" onclick="updateSnackQty('${item.id}', -1)">-</button>
                  <span class="stepper-count" id="snack-count-${item.id}">${currentQty}</span>
                  <button class="stepper-btn" onclick="updateSnackQty('${item.id}', 1)">+</button>
                </div>
              </div>
            </div>
          </div>`;
      }).join('')}
    </div>

    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:1rem 1.5rem;margin-top:1.5rem;display:flex;align-items:center;justify-content:space-between">
      <div>
        <div style="font-size:0.85rem;color:var(--text-muted)">Current Order Subtotal</div>
        <div style="font-weight:700">Tickets: ₹${ticketTotal} | Snacks: <span id="foodTotalAmount">₹${snacksTotal}</span></div>
      </div>
      <div style="display:flex;gap:0.75rem">
        <button class="btn btn-ghost" onclick="skipSnacksAndPay()">Skip F&B</button>
        <button class="btn btn-primary" onclick="proceedToPaymentGateway()">Proceed to Payment →</button>
      </div>
    </div>`;
}

function updateSnackQty(snackId, delta) {
  const item = SNACKS_MENU.find(s => s.id === snackId);
  if (!item) return;

  if (!selectedSnacks[snackId]) {
    selectedSnacks[snackId] = { name: item.name, price: item.price, qty: 0 };
  }

  selectedSnacks[snackId].qty += delta;
  if (selectedSnacks[snackId].qty <= 0) {
    delete selectedSnacks[snackId];
  }

  const countEl = document.getElementById(`snack-count-${snackId}`);
  if (countEl) countEl.textContent = selectedSnacks[snackId]?.qty || 0;

  const snacksTotal = Object.values(selectedSnacks).reduce((sum, i) => sum + (i.price * i.qty), 0);
  const totalEl = document.getElementById('foodTotalAmount');
  if (totalEl) totalEl.textContent = `₹${snacksTotal}`;
}

function skipSnacksAndPay() {
  selectedSnacks = {};
  proceedToPaymentGateway();
}

function proceedToPaymentGateway() {
  closeModal('foodModal');
  openPaymentGateway();
}

// ============================================================
// STEP 3: PAYMENT GATEWAY (UPI, DYNAMIC QR CODE, CARDS, NETBANKING)
// ============================================================
function openPaymentGateway() {
  const content = document.getElementById('paymentModalContent');
  if (!content) return;

  const st = currentShowtimeData;
  const movie = st?.movie;
  const seatIds = selectedSeats.map(s => s.id);

  // Category counts
  const catCounts = {};
  selectedSeats.forEach(s => { catCounts[s.category] = (catCounts[s.category] || 0) + 1; });
  const dominantCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0][0];

  const ticketTotal = selectedSeats.reduce((s, seat) => s + seat.price, 0);
  const snacksTotal = Object.values(selectedSnacks).reduce((s, item) => s + (item.price * item.qty), 0);
  const convenienceFee = Math.round(ticketTotal * 0.08) + 10;
  const grandTotal = ticketTotal + snacksTotal + convenienceFee;

  content.innerHTML = `
    <div class="payment-layout">
      <!-- Left Payment Methods Tabs -->
      <div class="payment-sidebar">
        <div style="font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:0.5rem;padding-left:0.5rem">
          Payment Options
        </div>

        <button class="payment-tab-btn ${activePaymentMethod === 'upi' ? 'active' : ''}" onclick="switchPaymentTab('upi', ${grandTotal})">
          <span>📱</span>
          <span>UPI / QR Code</span>
          <span class="tab-badge">Instant</span>
        </button>

        <button class="payment-tab-btn ${activePaymentMethod === 'card' ? 'active' : ''}" onclick="switchPaymentTab('card', ${grandTotal})">
          <span>💳</span>
          <span>Credit / Debit Card</span>
        </button>

        <button class="payment-tab-btn ${activePaymentMethod === 'netbanking' ? 'active' : ''}" onclick="switchPaymentTab('netbanking', ${grandTotal})">
          <span>🏦</span>
          <span>Net Banking</span>
        </button>

        <button class="payment-tab-btn ${activePaymentMethod === 'wallet' ? 'active' : ''}" onclick="switchPaymentTab('wallet', ${grandTotal})">
          <span>👛</span>
          <span>Wallets & Apple Pay</span>
        </button>

        <div style="margin-top:auto;padding:1rem;background:rgba(255,255,255,0.03);border-radius:var(--radius-sm);border:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:6px;font-size:0.75rem;color:var(--text-secondary)">
            <span>🔒</span>
            <span>256-bit Bank Grade SSL</span>
          </div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:0.25rem">PCI-DSS Compliant Gateway</div>
        </div>
      </div>

      <!-- Center Payment Details Panel -->
      <div class="payment-content-area" id="paymentTabContent">
        ${renderPaymentTabContent(activePaymentMethod, grandTotal)}
      </div>

      <!-- Right Order Summary Sidebar -->
      <div class="payment-summary-col">
        <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:1rem">Booking Summary</h3>

        <div style="margin-bottom:1rem">
          <div style="font-weight:700;font-size:0.95rem;color:var(--text-primary)">${movie?.title || 'Movie'}</div>
          <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:0.2rem">
            📅 ${st?.date} · 🕐 ${st?.startTime}
          </div>
          <div style="font-size:0.78rem;color:var(--text-muted)">
            🏛️ ${st?.hall}
          </div>
        </div>

        <div class="divider" style="margin:0.5rem 0"></div>

        <div style="font-size:0.85rem;display:flex;justify-content:space-between;margin-bottom:0.5rem">
          <span style="color:var(--text-secondary)">Seats (${seatIds.length})</span>
          <span style="font-weight:600">₹${ticketTotal}</span>
        </div>
        <div style="display:flex;gap:0.25rem;flex-wrap:wrap;margin-bottom:0.75rem">
          ${seatIds.map(s => `<span class="seat-chip" style="font-size:0.7rem;padding:2px 6px">${s}</span>`).join('')}
        </div>

        ${snacksTotal > 0 ? `
          <div style="font-size:0.85rem;display:flex;justify-content:space-between;margin-bottom:0.5rem">
            <span style="color:var(--text-secondary)">Food & Drinks</span>
            <span style="font-weight:600">₹${snacksTotal}</span>
          </div>
          <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:0.75rem">
            ${Object.values(selectedSnacks).map(i => `${i.name} (x${i.qty})`).join(', ')}
          </div>
        ` : ''}

        <div style="font-size:0.85rem;display:flex;justify-content:space-between;margin-bottom:0.5rem">
          <span style="color:var(--text-secondary)">Convenience Fee & GST</span>
          <span style="font-weight:600">₹${convenienceFee}</span>
        </div>

        <div class="divider" style="margin:0.5rem 0"></div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:1rem">
          <div>
            <div style="font-size:0.75rem;color:var(--text-muted)">Amount Payable</div>
            <div style="font-family:var(--font-display);font-size:1.4rem;font-weight:800;color:var(--gold)">
              ₹${grandTotal}
            </div>
          </div>
        </div>
      </div>
    </div>`;

  openModal('paymentModal');
  if (activePaymentMethod === 'upi') {
    generateDynamicQRCode(grandTotal);
  }
}

function switchPaymentTab(tab, grandTotal) {
  activePaymentMethod = tab;
  document.querySelectorAll('.payment-tab-btn').forEach(btn => btn.classList.remove('active'));
  event?.currentTarget?.classList?.add('active');
  const panel = document.getElementById('paymentTabContent');
  if (panel) {
    panel.innerHTML = renderPaymentTabContent(tab, grandTotal);
    if (tab === 'upi') generateDynamicQRCode(grandTotal);
  }
}

function renderPaymentTabContent(tab, grandTotal) {
  if (tab === 'upi') {
    return `
      <div class="qr-container">
        <h3 style="font-size:1.15rem;font-weight:700;margin-bottom:0.25rem">Scan QR with any UPI App</h3>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1.25rem">
          Open Google Pay, PhonePe, Paytm, or BHIM to pay
        </p>

        <!-- Dynamic Laser Scanned QR Code Box -->
        <div class="qr-frame">
          <div class="qr-laser"></div>
          <canvas id="qrCodeCanvas" width="180" height="180"></canvas>
        </div>

        <!-- Supported UPI Apps -->
        <div class="upi-apps-grid">
          <div class="upi-app-pill" onclick="simulateUPIAppPay('Google Pay', ${grandTotal})">🟢 Google Pay</div>
          <div class="upi-app-pill" onclick="simulateUPIAppPay('PhonePe', ${grandTotal})">🟣 PhonePe</div>
          <div class="upi-app-pill" onclick="simulateUPIAppPay('Paytm', ${grandTotal})">🔵 Paytm</div>
          <div class="upi-app-pill" onclick="simulateUPIAppPay('BHIM UPI', ${grandTotal})">🟠 BHIM</div>
          <div class="upi-app-pill" onclick="simulateUPIAppPay('Cred', ${grandTotal})">⚫ CRED</div>
        </div>

        <!-- Simulated UPI ID copy & instant button -->
        <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.75rem 1rem;display:flex;align-items:center;justify-content:space-between;width:100%;max-width:380px;margin-bottom:1rem">
          <div style="font-size:0.82rem;font-family:monospace;color:var(--text-primary)">
            imovies.pay@okhdfcbank
          </div>
          <button class="btn btn-ghost btn-sm" onclick="copyUPIID()">📋 Copy</button>
        </div>

        <!-- Manual UPI ID Entry Input -->
        <div style="width:100%;max-width:380px;margin-bottom:1rem">
          <div class="form-group" style="margin-bottom:0.5rem;text-align:left">
            <label style="font-size:0.8rem">Or Enter Your Virtual Payment Address (UPI ID)</label>
            <div style="display:flex;gap:0.5rem">
              <input type="text" id="manualUpiId" placeholder="e.g. mobile@oksbi, user@paytm" />
              <button class="btn btn-primary" onclick="verifyManualUPI(${grandTotal})">Pay ₹${grandTotal}</button>
            </div>
          </div>
        </div>

        <!-- Instant Test Trigger Button -->
        <button class="btn btn-success btn-full" style="max-width:380px;margin-top:0.5rem" onclick="executeRealPayment('upi', ${grandTotal}, 'imovies.pay@okhdfcbank')">
          ⚡ Simulate Instant UPI Scan & Pay ₹${grandTotal}
        </button>
      </div>`;
  }

  if (tab === 'card') {
    return `
      <div>
        <h3 style="font-size:1.15rem;font-weight:700;margin-bottom:0.25rem">Credit or Debit Card</h3>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1.5rem">
          All major Visa, MasterCard, RuPay, and American Express cards supported
        </p>

        <!-- Live 3D Interactive Card Mockup -->
        <div class="card-mockup">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div class="card-chip"></div>
            <div style="font-weight:800;font-size:1.1rem;letter-spacing:1px">VISA</div>
          </div>
          <div class="card-number-display" id="cardMockNumber">•••• •••• •••• ••••</div>
          <div class="card-bottom-info">
            <div>
              <div style="font-size:0.65rem;opacity:0.7">Cardholder</div>
              <div id="cardMockName" style="font-weight:600">CARDHOLDER NAME</div>
            </div>
            <div>
              <div style="font-size:0.65rem;opacity:0.7">Expires</div>
              <div id="cardMockExpiry" style="font-weight:600">MM/YY</div>
            </div>
          </div>
        </div>

        <!-- Card Form -->
        <div style="max-width:380px;margin:0 auto">
          <div class="form-group">
            <label>Card Number</label>
            <input type="text" id="cardInputNumber" placeholder="4532 8920 1823 9081" maxlength="19" oninput="formatCardNumber(this)" />
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
            <div class="form-group">
              <label>Expiry Date</label>
              <input type="text" id="cardInputExpiry" placeholder="MM/YY" maxlength="5" oninput="formatCardExpiry(this)" />
            </div>
            <div class="form-group">
              <label>CVV / CVC</label>
              <input type="password" id="cardInputCvv" placeholder="•••" maxlength="4" />
            </div>
          </div>
          <div class="form-group">
            <label>Cardholder Name</label>
            <input type="text" id="cardInputName" placeholder="Name on card" oninput="document.getElementById('cardMockName').textContent = this.value.toUpperCase() || 'CARDHOLDER NAME'" />
          </div>
          <button class="btn btn-primary btn-full" onclick="executeRealPayment('card', ${grandTotal})">
            🔒 Pay ₹${grandTotal} Securely
          </button>
        </div>
      </div>`;
  }

  if (tab === 'netbanking') {
    return `
      <div>
        <h3 style="font-size:1.15rem;font-weight:700;margin-bottom:0.25rem">Net Banking</h3>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1.5rem">
          Select your bank to redirect to official banking portal
        </p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(130px, 1fr));gap:0.75rem;margin-bottom:1.5rem">
          ${['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map((b, i) => `
            <div class="bank-pill ${i === 0 ? 'active' : ''}" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);padding:1rem 0.5rem;text-align:center;cursor:pointer;font-weight:600;font-size:0.85rem" onclick="selectBank(this)">
              🏛️<br/>${b}
            </div>
          `).join('')}
        </div>
        <button class="btn btn-primary btn-full" onclick="executeRealPayment('netbanking', ${grandTotal})">
          Proceed to Bank Portal →
        </button>
      </div>`;
  }

  // Wallet
  return `
    <div>
      <h3 style="font-size:1.15rem;font-weight:700;margin-bottom:0.25rem">Digital Wallets & Apple Pay</h3>
      <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1.5rem">
        Pay directly using your linked wallet balance
      </p>
      <div style="display:flex;flex-direction:column;gap:0.75rem;margin-bottom:1.5rem">
        <label style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);padding:1rem;display:flex;align-items:center;gap:12px;cursor:pointer">
          <input type="radio" name="walletChoice" checked />
          <span>🍎 Apple Pay / Apple Cash</span>
        </label>
        <label style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);padding:1rem;display:flex;align-items:center;gap:12px;cursor:pointer">
          <input type="radio" name="walletChoice" />
          <span>🔵 Paytm Wallet & Postpaid</span>
        </label>
        <label style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);padding:1rem;display:flex;align-items:center;gap:12px;cursor:pointer">
          <input type="radio" name="walletChoice" />
          <span>📦 Amazon Pay Balance</span>
        </label>
      </div>
      <button class="btn btn-primary btn-full" onclick="executeRealPayment('wallet', ${grandTotal})">
        Pay ₹${grandTotal} with Wallet
      </button>
    </div>`;
}

// ── QR Code Generator Canvas ─────────────────────────────────
function generateDynamicQRCode(amount) {
  setTimeout(() => {
    const canvas = document.getElementById('qrCodeCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 180;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Render realistic QR matrix patterns
    ctx.fillStyle = '#0a0a0f';
    const drawFinderPattern = (x, y) => {
      ctx.fillRect(x, y, 42, 42);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 6, y + 6, 30, 30);
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(x + 12, y + 12, 18, 18);
    };

    drawFinderPattern(10, 10);
    drawFinderPattern(size - 52, 10);
    drawFinderPattern(10, size - 52);

    // Random pseudo-deterministic dots for aesthetic matrix
    const seed = (amount * 997) % 1000;
    for (let r = 0; r < 24; r++) {
      for (let c = 0; c < 24; c++) {
        // Skip finder areas
        if ((r < 7 && c < 7) || (r < 7 && c > 16) || (r > 16 && c < 7)) continue;
        if (((r * c + seed + r + c) % 3 === 0) || ((r + c) % 5 === 0)) {
          ctx.fillRect(10 + c * 6.5, 10 + r * 6.5, 5, 5);
        }
      }
    }

    // Center branding badge
    ctx.fillStyle = '#e50914';
    ctx.fillRect(size / 2 - 16, size / 2 - 16, 32, 32);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎬', size / 2, size / 2);
  }, 50);
}

function copyUPIID() {
  navigator.clipboard.writeText('imovies.pay@okhdfcbank');
  showToast('UPI ID copied to clipboard! 📋', 'success');
}

function formatCardNumber(input) {
  let val = input.value.replace(/\D/g, '');
  let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
  input.value = formatted;
  const mock = document.getElementById('cardMockNumber');
  if (mock) mock.textContent = formatted || '•••• •••• •••• ••••';
}

function formatCardExpiry(input) {
  let val = input.value.replace(/\D/g, '');
  if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
  input.value = val;
  const mock = document.getElementById('cardMockExpiry');
  if (mock) mock.textContent = val || 'MM/YY';
}

function selectBank(el) {
  document.querySelectorAll('.bank-pill').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

function simulateUPIAppPay(appName, amount) {
  showToast(`Simulating push authorization from ${appName}...`, 'info');
  executeRealPayment('upi', amount, `user@${appName.toLowerCase().replace(/\s+/g, '')}`);
}

function verifyManualUPI(amount) {
  const upiId = document.getElementById('manualUpiId')?.value?.trim();
  if (!upiId || !upiId.includes('@')) {
    showToast('Please enter a valid UPI ID (e.g. name@oksbi)', 'error');
    return;
  }
  executeRealPayment('upi', amount, upiId);
}

// ============================================================
// STEP 4: REAL PAYMENT EXECUTION & PROCESSING ANIMATION
// ============================================================
async function executeRealPayment(method, total, upiId = '') {
  closeModal('paymentModal');
  openModal('processingModal');

  const titleEl = document.getElementById('processingTitle');
  const subEl = document.getElementById('processingSubtitle');
  const barEl = document.getElementById('processingProgressBar');

  // Animation timeline
  if (barEl) barEl.style.width = '35%';
  if (titleEl) titleEl.textContent = 'Contacting Payment Gateway...';
  if (subEl) subEl.textContent = 'Handshaking with Banking Network via 256-bit SSL';

  await new Promise(r => setTimeout(r, 800));

  if (barEl) barEl.style.width = '75%';
  if (titleEl) titleEl.textContent = method === 'upi' ? 'Verifying UPI Authorization...' : 'Authenticating Card Credentials...';
  if (subEl) subEl.textContent = 'Received bank acknowledgment. Securing cinema seats...';

  const st = currentShowtimeData;
  const seatIds = selectedSeats.map(s => s.id);
  const catCounts = {};
  selectedSeats.forEach(s => { catCounts[s.category] = (catCounts[s.category] || 0) + 1; });
  const dominantCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0][0];

  const addonsList = Object.values(selectedSnacks).map(i => ({
    name: i.name,
    qty: i.qty,
    price: i.price
  }));

  try {
    const bookingRes = await apiCall('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        showtimeId: st._id,
        seats: seatIds,
        seatCategory: dominantCat,
        totalAmount: total,
        paymentMethod: method,
        addons: addonsList,
        upiId: upiId || 'imovies.pay@okhdfcbank',
        theater: 'IMovies Grand Luxe Cineplex'
      })
    });

    if (barEl) barEl.style.width = '100%';
    if (titleEl) titleEl.textContent = 'Payment Approved! 🎉';
    if (subEl) subEl.textContent = 'Generating & Downloading your Cinema Ticket Pass...';

    await new Promise(r => setTimeout(r, 600));

    clearInterval(seatLockTimerInterval);
    closeModal('processingModal');
    selectedSeats = [];
    selectedSnacks = {};

    const confirmedBooking = bookingRes.data;

    // Save to local bookings store so user NEVER loses tickets
    try {
      const localList = JSON.parse(localStorage.getItem('imovies_local_bookings') || '[]');
      localList.unshift(confirmedBooking);
      localStorage.setItem('imovies_local_bookings', JSON.stringify(localList));
    } catch (e) {}

    // 1. Show ticket in modal
    showTicket(confirmedBooking);

    // 2. Automatically download standalone ticket pass file
    setTimeout(() => {
      downloadTicketPassFile(confirmedBooking);
    }, 400);

  } catch (err) {
    closeModal('processingModal');
    showToast(err.message, 'error');
  }
}

// ============================================================
// STEP 5: AUTHENTIC CINEMA E-TICKET PASS & DOWNLOADABLE FILE
// ============================================================
function showTicket(booking) {
  const st = booking.showtime;
  const movie = st?.movie;
  const content = document.getElementById('ticketModalContent');
  if (!content) return;

  const ref = booking.bookingRef || ('IMV-' + Math.random().toString(36).substr(2, 6).toUpperCase());
  const dateFormatted = st?.date ? new Date(st.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  }) : '';

  content.innerHTML = `
    <div class="ticket-card-enhanced">
      <div class="ticket-notch-top"></div>
      <div class="ticket-notch-bottom"></div>

      <!-- Main Ticket Body -->
      <div class="ticket-main">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem">
          <div>
            <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;color:var(--accent);font-weight:700">
              🎬 IMovies E-Ticket Pass · Official Admission
            </div>
            <h2 style="font-family:var(--font-display);font-size:1.75rem;font-weight:900;margin-top:0.25rem">
              ${movie?.title || 'Movie'}
            </h2>
            <div style="color:var(--text-secondary);font-size:0.85rem;margin-top:0.2rem">
              📍 IMovies Grand Luxe Cineplex · Screen 3 (IMAX 3D Laser)
            </div>
          </div>
          <div style="text-align:right">
            <span class="status-badge status-confirmed" style="font-size:0.8rem">✅ Booked & Verified</span>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.25rem">Audi: ${st?.hall || 'Audi 1'}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(110px, 1fr));gap:1rem;margin-bottom:1.5rem;background:rgba(255,255,255,0.03);padding:1rem;border-radius:var(--radius-sm);border:1px solid var(--border)">
          <div>
            <div class="ticket-label">Date</div>
            <div class="ticket-value" style="text-align:left;font-size:0.95rem">${dateFormatted}</div>
          </div>
          <div>
            <div class="ticket-label">Time</div>
            <div class="ticket-value" style="text-align:left;font-size:0.95rem">${st?.startTime || '10:00 AM'}</div>
          </div>
          <div>
            <div class="ticket-label">Audi Hall</div>
            <div class="ticket-value" style="text-align:left;font-size:0.95rem">${st?.hall || 'Audi 1 (IMAX 3D)'}</div>
          </div>
          <div>
            <div class="ticket-label">Seats (${booking.seats?.length || 0})</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:2px">
              ${(booking.seats || []).map(s => `<span class="seat-chip" style="font-size:0.75rem">${s}</span>`).join('')}
            </div>
          </div>
        </div>

        ${booking.addons?.length ? `
          <div style="margin-bottom:1rem;font-size:0.85rem">
            <div class="ticket-label" style="margin-bottom:0.25rem">Pre-booked Food & Beverages</div>
            <div style="color:var(--text-primary)">
              ${booking.addons.map(a => `${a.name} (x${a.qty})`).join(' · ')}
            </div>
          </div>
        ` : ''}

        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:1rem;border-top:1px dashed var(--border)">
          <div>
            <div class="ticket-label">Payment Method</div>
            <div style="font-size:0.9rem;font-weight:600;text-transform:uppercase">${booking.paymentMethod || 'UPI'}</div>
          </div>
          <div style="text-align:right">
            <div class="ticket-label">Total Amount Paid</div>
            <div style="font-family:var(--font-display);font-size:1.4rem;font-weight:800;color:var(--gold)">
              ₹${booking.totalAmount}
            </div>
          </div>
        </div>
      </div>

      <!-- Ticket Right Perforated Stub -->
      <div class="ticket-stub">
        <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Booking Code</div>
        <div class="ticket-ref" style="font-size:1.15rem;margin:0.25rem 0 1rem">${ref}</div>

        <!-- Scannable QR Code Canvas -->
        <canvas id="ticketQrCanvas" width="130" height="130" style="background:#fff;border-radius:10px;padding:6px;box-shadow:0 4px 15px rgba(0,0,0,0.5)"></canvas>

        <div class="barcode-strip"></div>
        <div style="font-size:0.7rem;color:var(--text-muted);margin-top:0.25rem">Scan at Entry Turnstile</div>
      </div>
    </div>

    <!-- Ticket Action Buttons -->
    <div class="ticket-actions-row" style="display:flex;gap:0.75rem;justify-content:center;margin-top:1.5rem;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="downloadTicketPassFile(${JSON.stringify(booking).replace(/"/g, '&quot;')})">
        📥 Download Ticket Pass File (.html)
      </button>
      <button class="btn btn-ghost" onclick="window.print()">
        🖨️ Print Ticket
      </button>
      <button class="btn btn-ghost" onclick="downloadCalendarInvite('${movie?.title}', '${st?.date}', '${st?.startTime}')">
        📅 Add to Calendar
      </button>
      <button class="btn btn-ghost" onclick="shareTicket('${ref}', '${movie?.title}', '${st?.date}')">
        💬 Share Ticket
      </button>
      <button class="btn btn-ghost" onclick="closeModal('ticketModal');showPage('bookings')">
        View My Bookings
      </button>
    </div>`;

  openModal('ticketModal');
  showToast('🎉 Reservation confirmed! Ticket generated & downloaded.', 'success');

  // Render QR Code onto ticket stub
  setTimeout(() => {
    const canvas = document.getElementById('ticketQrCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 130;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#111119';

    const drawFinder = (x, y) => {
      ctx.fillRect(x, y, 30, 30);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 5, y + 5, 20, 20);
      ctx.fillStyle = '#111119';
      ctx.fillRect(x + 9, y + 9, 12, 12);
    };
    drawFinder(6, 6);
    drawFinder(size - 36, 6);
    drawFinder(6, size - 36);

    for (let r = 0; r < 18; r++) {
      for (let c = 0; c < 18; c++) {
        if ((r < 5 && c < 5) || (r < 5 && c > 12) || (r > 12 && c < 5)) continue;
        if ((r * 7 + c * 13 + 5) % 4 === 0) {
          ctx.fillRect(6 + c * 6.5, 6 + r * 6.5, 4.5, 4.5);
        }
      }
    }
  }, 50);
}

// Standalone downloadable HTML Pass File
function downloadTicketPassFile(booking) {
  const st = booking.showtime;
  const movie = st?.movie;
  const ref = booking.bookingRef || 'IMV-TICKET';
  const seatsStr = (booking.seats || []).join(', ');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>IMovies E-Ticket - ${ref}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #07090e; color: #ffffff; padding: 40px; margin: 0; display: flex; justify-content: center; }
    .ticket-card { width: 100%; max-width: 620px; background: #131929; border: 2px solid #f5a623; border-radius: 20px; padding: 32px; box-shadow: 0 20px 60px rgba(0,0,0,0.8); }
    .header { border-bottom: 2px dashed #f5a623; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    .brand { font-size: 26px; font-weight: 900; color: #f5a623; margin: 0; }
    .movie-title { font-size: 20px; font-weight: 800; margin-top: 6px; color: #fff; }
    .code-box { background: rgba(245,166,35,0.15); border: 1px solid #f5a623; border-radius: 8px; padding: 6px 14px; text-align: right; }
    .code-label { font-size: 11px; text-transform: uppercase; color: #a8b2c7; }
    .code-val { font-family: monospace; font-size: 17px; font-weight: 800; color: #f5a623; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 24px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #a8b2c7; margin-bottom: 4px; }
    .val { font-size: 16px; font-weight: 700; color: #fff; }
    .seats-highlight { color: #00f2fe; font-size: 18px; font-weight: 800; }
    .divider { height: 1px; background: rgba(255,255,255,0.1); margin: 20px 0; }
    .total-row { display: flex; justify-content: space-between; align-items: center; }
    .total-price { font-size: 26px; font-weight: 900; color: #f5a623; }
    .footer { text-align: center; margin-top: 24px; padding-top: 18px; border-top: 1px dashed rgba(255,255,255,0.15); font-size: 12px; color: #a8b2c7; }
  </style>
</head>
<body>
  <div class="ticket-card">
    <div class="header">
      <div>
        <h1 class="brand">🎬 IMovies E-Ticket Pass</h1>
        <div class="movie-title">${movie?.title || 'Cinema Screening'}</div>
        <div style="font-size:13px;color:#a8b2c7;margin-top:4px">📍 IMovies Grand Luxe Cineplex · Screen 3</div>
      </div>
      <div class="code-box">
        <div class="code-label">Booking Code</div>
        <div class="code-val">${ref}</div>
      </div>
    </div>
    <div class="info-grid">
      <div><div class="label">Date & Time</div><div class="val">${st?.date || ''} · ${st?.startTime || ''}</div></div>
      <div><div class="label">Screen & Audi</div><div class="val">${st?.hall || 'Audi 1 (IMAX 3D)'}</div></div>
      <div><div class="label">Seats (${booking.seats?.length || 0})</div><div class="val seats-highlight">${seatsStr}</div></div>
      <div><div class="label">Category</div><div class="val" style="text-transform:capitalize">${booking.seatCategory || 'Standard'}</div></div>
    </div>
    <div class="divider"></div>
    <div class="total-row">
      <div>
        <div class="label">Payment Status</div>
        <div style="color:#00e676;font-weight:700">PAID & VERIFIED (via ${(booking.paymentMethod || 'UPI').toUpperCase()}) ✅</div>
      </div>
      <div style="text-align:right">
        <div class="label">Total Paid</div>
        <div class="total-price">₹${booking.totalAmount}</div>
      </div>
    </div>
    <div class="footer">
      Please present this digital pass or QR code at cinema turnstiles. Doors open 15 mins before showtime.
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `IMovies_Ticket_${ref}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast(`Ticket pass saved: IMovies_Ticket_${ref}.html 📥`, 'success');
}

function downloadCalendarInvite(title, date, time) {
  const [h, m] = (time || '18:00').split(':');
  const dStr = (date || '2026-10-26').replace(/-/g, '');
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//IMovies Cinema//Cinema Ticket//EN
BEGIN:VEVENT
SUMMARY:🎬 Cinema: ${title || 'Movie'}
DESCRIPTION:IMovies Cinema Ticket Booking. Hall: IMAX 3D.
LOCATION:IMovies Grand Luxe Cineplex
DTSTART:${dStr}T${h || '18'}${m || '00'}00Z
DTEND:${dStr}T${parseInt(h || '18', 10) + 2}${m || '00'}00Z
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `IMovies_${(title || 'Movie').replace(/\s+/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('Calendar invite (.ics) downloaded! 📅', 'success');
}

function shareTicket(ref, title, date) {
  const shareText = `🎟️ My IMovies Cinema Ticket!\nMovie: ${title}\nDate: ${date}\nBooking Code: ${ref}\nSee you at the movies! 🍿`;
  navigator.clipboard.writeText(shareText);
  showToast('Ticket details copied! Ready to share on WhatsApp 💬', 'success');
}

// ============================================================
// MY BOOKINGS (MERGES BACKEND + PERSISTENT LOCAL BOOKINGS)
// ============================================================
async function loadBookings() {
  const container = document.getElementById('bookingsContent');
  if (!container) return;

  container.innerHTML = `<div class="full-spinner"><div class="spinner"></div><p>Fetching your cinema reservations...</p></div>`;

  let bookings = [];
  try {
    const data = await apiCall('/bookings');
    bookings = data.data || [];
  } catch (e) {}

  // Merge with locally stored bookings so guest bookings are never lost
  try {
    const localBookings = JSON.parse(localStorage.getItem('imovies_local_bookings') || '[]');
    const existingRefs = new Set(bookings.map(b => b.bookingRef));
    localBookings.forEach(lb => {
      if (!existingRefs.has(lb.bookingRef)) bookings.push(lb);
    });
  } catch (e) {}

  if (!bookings.length) {
    container.innerHTML = `
      <div class="auth-prompt">
        <div class="auth-prompt-icon">🍿</div>
        <h3>No bookings found yet</h3>
        <p>Pick a movie, select your seats, and your cinema pass will appear right here!</p>
        <button class="btn btn-primary" onclick="showPage('movies')">Browse Movies</button>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="bookings-list" style="display:flex;flex-direction:column;gap:1.5rem;max-width:900px;margin:0 auto">
      ${bookings.map(b => bookingCardHTML(b)).join('')}
    </div>`;
}

function bookingCardHTML(b) {
  const st = b.showtime;
  const movie = st?.movie;
  const isCancelled = b.status === 'cancelled';

  return `
    <div class="booking-card" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.5rem;display:flex;gap:1.5rem;align-items:center;transition:var(--transition)">
      <img src="${movie?.posterUrl || 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=200&q=70'}" alt="${movie?.title || 'Movie'}" style="width:100px;height:140px;object-fit:cover;border-radius:var(--radius-sm);flex-shrink:0" />
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <h3 style="font-size:1.25rem;font-weight:800">${movie?.title || 'Movie'}</h3>
            <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:0.25rem">
              📅 ${st?.date} · 🕐 ${st?.startTime} · 🏛️ ${st?.hall || 'Audi 1 (IMAX 3D)'}
            </div>
          </div>
          <span class="status-badge ${isCancelled ? 'status-cancelled' : 'status-confirmed'}">
            ${isCancelled ? '❌ Cancelled' : '✅ Confirmed'}
          </span>
        </div>

        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin:0.75rem 0">
          ${(b.seats || []).map(s => `<span class="seat-chip">${s}</span>`).join('')}
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border);padding-top:0.75rem;margin-top:0.75rem;flex-wrap:wrap;gap:0.5rem">
          <div style="font-family:monospace;font-size:0.85rem;color:var(--text-muted)">Ref: ${b.bookingRef}</div>
          <div style="display:flex;align-items:center;gap:0.75rem">
            <span style="font-family:var(--font-display);font-weight:800;font-size:1.15rem;color:var(--gold)">₹${b.totalAmount}</span>
            <button class="btn btn-primary btn-sm" onclick="showTicket(${JSON.stringify(b).replace(/"/g, '&quot;')})">🎟️ View Pass</button>
            <button class="btn btn-ghost btn-sm" onclick="downloadTicketPassFile(${JSON.stringify(b).replace(/"/g, '&quot;')})">📥 Pass File</button>
            ${!isCancelled ? `<button class="btn btn-ghost btn-sm" style="color:var(--accent)" onclick="cancelBooking('${b._id}')">Cancel</button>` : ''}
          </div>
        </div>
      </div>
    </div>`;
}

async function cancelBooking(id) {
  if (!confirm('Are you sure you want to cancel this reservation? Seats will be immediately released.')) return;
  try {
    await apiCall(`/bookings/${id}/cancel`, { method: 'POST' });
    showToast('Reservation cancelled and refund initiated.', 'info');
    loadBookings();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
// BACKEND TELEMETRY & 1-CLICK DEMO AUTH
// ============================================================
async function quickDemoLogin() {
  try {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'demo@imovies.com', password: 'demo123' })
    });
    token = data.token;
    localStorage.setItem('imovies_token', token);
    setUser(data.user);
    showToast('Signed in as Demo User (demo@imovies.com) 🎬', 'success');
  } catch (e) {
    showToast('Demo login: ' + e.message, 'error');
  }
}

async function openBackendModal() {
  openModal('backendModal');
  const body = document.getElementById('backendTelemetryBody');
  if (!body) return;
  body.innerHTML = `<div class="full-spinner"><div class="spinner"></div><p>Querying backend engine & database...</p></div>`;
  const t0 = performance.now();
  try {
    const res = await fetch('/api/health');
    const latency = Math.round(performance.now() - t0);
    const data = await res.json();
    body.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:1rem;margin-bottom:1.5rem">
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem">
          <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase">Server Status</div>
          <div style="font-size:1.2rem;font-weight:800;color:#00e676;margin:0.25rem 0">🟢 ${data.status.toUpperCase()}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary)">Uptime: ${data.uptimeSeconds}s · Ping: ${latency}ms</div>
        </div>
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem">
          <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase">Database Engine</div>
          <div style="font-size:1.05rem;font-weight:800;color:var(--gold);margin:0.25rem 0">MongoDB + Disk Sync</div>
          <div style="font-size:0.75rem;color:var(--text-secondary)">Host: ${data.database?.host || '127.0.0.1'} · Connected: ✅</div>
        </div>
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem">
          <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase">Live Records</div>
          <div style="font-size:1.2rem;font-weight:800;color:var(--accent);margin:0.25rem 0">${data.stats?.movies || 12} Movies</div>
          <div style="font-size:0.75rem;color:var(--text-secondary)">${data.stats?.showtimes || 336} Shows · ${data.stats?.bookings || 0} Bookings</div>
        </div>
      </div>

      <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem;margin-bottom:1.5rem">
        <div style="font-weight:700;margin-bottom:0.4rem">📁 Physical Disk File Storage</div>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.75rem">
          Every booking you create is automatically synced and physically written to disk on your computer:
          <code style="color:var(--gold);background:rgba(0,0,0,0.4);padding:2px 8px;border-radius:4px;display:inline-block;margin-top:4px">Service now/data/bookings.json</code>
        </p>
        <div style="font-size:0.8rem;color:var(--text-muted)">
          Movies Data: <code style="color:var(--text-primary)">data/movies.json</code> · Users Data: <code style="color:var(--text-primary)">data/users.json</code>
        </div>
      </div>

      <div style="display:flex;gap:0.75rem;justify-content:flex-end;flex-wrap:wrap">
        <a href="/api/health" target="_blank" class="btn btn-ghost btn-sm">🔗 /api/health Telemetry</a>
        <a href="/api/movies" target="_blank" class="btn btn-ghost btn-sm">🔗 /api/movies API</a>
        <button class="btn btn-primary btn-sm" onclick="openBackendModal()">🔄 Re-Ping Backend</button>
      </div>`;
  } catch (err) {
    body.innerHTML = `<div class="empty-state"><p>Failed to connect to backend: ${err.message}</p></div>`;
  }
}

// ============================================================
// MODAL CONTROLS & TOASTS
// ============================================================
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
    modal.classList.add('open');
    modal.onclick = (e) => {
      if (e.target === modal) closeModal(id);
    };
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('active');
    modal.classList.remove('open');
  }
  document.body.style.overflow = 'auto';
}

function switchModal(closeId, openId) {
  closeModal(closeId);
  openModal(openId);
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-message">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
