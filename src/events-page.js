// Trang lịch sự kiện: tải danh sách từ API, tìm theo tên, lọc theo CLB.
// Bộ lọc được ghi lên URL (?q=…&clubId=…) để tải lại trang hay gửi link cho bạn vẫn giữ kết quả.
import { getClubs, getEvents } from './api.js';
import { el, renderEventList, renderStatus } from './render.js';
import { debounce } from './utils/debounce.js';

const SEARCH_DELAY_MS = 300;

const filterForm = document.querySelector('.filters');
const searchInput = document.querySelector('#search');
const clubSelect = document.querySelector('#club-filter');
const eventList = document.querySelector('#event-list');
const resultCount = document.querySelector('#result-count');

/** id CLB → tên CLB, để card hiện "CLB Tin học" thay vì một chuỗi UUID */
const clubNames = new Map();

// ---- URL search params ----

function readFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return { q: params.get('q') ?? '', clubId: params.get('clubId') ?? '' };
}

function readFiltersFromForm() {
  return { q: searchInput.value.trim(), clubId: clubSelect.value };
}

function writeFiltersToUrl({ q, clubId }) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (clubId) params.set('clubId', clubId);
  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', url);
}

// ---- Câu lạc bộ ----

async function loadClubs() {
  try {
    for (const club of await getClubs()) {
      clubNames.set(club.id, club.name);
      clubSelect.append(el('option', { text: club.name, attrs: { value: club.id } }));
    }
  } catch (error) {
    // Thiếu danh sách CLB chỉ làm mất bộ lọc, trang vẫn xem được sự kiện
    console.warn('Không tải được danh sách CLB:', error.message);
  }
}

// ---- Sự kiện ----

/** Request đang chạy; request mới ra đời thì huỷ request cũ để kết quả cũ không đè kết quả mới */
let currentController = null;

async function loadEvents() {
  const filters = readFiltersFromForm();
  writeFiltersToUrl(filters);

  if (currentController) currentController.abort();
  const controller = new AbortController();
  currentController = controller;

  eventList.setAttribute('aria-busy', 'true');
  resultCount.textContent = '';
  renderStatus(eventList, 'loading', 'Đang tải sự kiện…');

  try {
    const page = await getEvents(filters, controller.signal);
    if (page.items.length === 0) {
      renderStatus(eventList, 'empty', 'Không có sự kiện nào khớp với bộ lọc. Thử từ khoá khác hoặc chọn "Tất cả câu lạc bộ".');
      resultCount.textContent = '';
    } else {
      resultCount.textContent = `Tìm thấy ${page.totalCount} sự kiện`;
      renderEventList(eventList, page.items, clubNames);
    }
    eventList.setAttribute('aria-busy', 'false');
  } catch (error) {
    if (error.name === 'AbortError') return; // bị request mới thay thế: không phải lỗi
    resultCount.textContent = '';
    renderStatus(eventList, 'error', error.message, { label: 'Thử lại', onClick: loadEvents });
    eventList.setAttribute('aria-busy', 'false');
  }
}

// ---- Gắn sự kiện ----

searchInput.addEventListener('input', debounce(loadEvents, SEARCH_DELAY_MS));
clubSelect.addEventListener('change', loadEvents);
filterForm.addEventListener('submit', (event) => {
  event.preventDefault(); // Enter trong ô tìm kiếm: lọc ngay, không tải lại trang
  loadEvents();
});

async function init() {
  const filters = readFiltersFromUrl();
  searchInput.value = filters.q;
  await loadClubs(); // cần có <option> CLB thì mới chọn lại được clubId từ URL
  clubSelect.value = filters.clubId;
  await loadEvents();
}

init();
