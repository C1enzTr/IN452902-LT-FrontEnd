// Câu 2
const API_URL = 'http://localhost:4000';

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

const searchForm = document.querySelector('#search-form');
const keywordInput = document.querySelector('#keyword');
const statusEl = document.querySelector('#status');
const eventList = document.querySelector('#event-list');

// Câu 2a
const formatSeats = (event) => {
  const remaining = event.capacity - event.registeredCount;
  return remaining > 0 ? `Còn ${remaining}/${event.capacity} chỗ` : 'Hết chỗ';
};

const createEl = (tag, className, text) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
};

// Câu 2b
const renderEvents = (events) => {
  const cards = events.map((event) => {
    const card = createEl('article', 'card');

    const img = createEl('img', 'card-img');
    img.setAttribute('src', 'img/event.svg');
    img.setAttribute('alt', 'Ảnh minh hoạ sự kiện');
    img.setAttribute('width', '320');
    img.setAttribute('height', '180');

    const title = createEl('h2', 'card-title');
    const link = createEl('a', '', event.name);
    link.setAttribute('href', `event-detail.html?id=${encodeURIComponent(event.id)}`);
    title.append(link);

    const timeWrap = createEl('p', 'card-time');
    const time = createEl('time', '', formatDateTime(event.startTime));
    time.setAttribute('datetime', event.startTime);
    timeWrap.append(time);

    const location = createEl('p', 'card-location', event.location);

    const seats = createEl('p', 'card-seats');
    const seatsText = formatSeats(event);
    if (seatsText === 'Hết chỗ') {
      seats.append(createEl('span', 'badge', seatsText));
    } else {
      seats.textContent = seatsText;
    }

    card.append(img, title, timeWrap, location, seats);
    return card;
  });

  eventList.replaceChildren(...cards);
};

const setStatus = (message, isError = false) => {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
};

let latestRequest = 0;

// Câu 2c
const loadEvents = async (keyword = '') => {
  const requestId = ++latestRequest;

  const params = new URLSearchParams({ pageSize: '50' });
  if (keyword !== '') params.set('q', keyword);

  setStatus('Đang tải…');

  try {
    const response = await fetch(`${API_URL}/api/events?${params}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (requestId !== latestRequest) return;

    renderEvents(data.items);
    setStatus(
      data.items.length === 0
        ? 'Không có sự kiện nào khớp từ khoá.'
        : `Tìm thấy ${data.totalCount} sự kiện`,
    );
  } catch (error) {
    if (requestId !== latestRequest) return;
    console.error(error);
    renderEvents([]);
    setStatus('Không tải được dữ liệu, vui lòng thử lại.', true);
  }
};

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  loadEvents(keywordInput.value.trim());
});

loadEvents(keywordInput.value.trim());
