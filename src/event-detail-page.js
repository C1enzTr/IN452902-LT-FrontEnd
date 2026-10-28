// Trang chi tiết: đọc id từ URL (event-detail.html?id=…), tải sự kiện và điền vào khung HTML có sẵn.
import { getClub, getEvent } from './api.js';
import { getClubImage } from './club-images.js';
import { createEventMeta, createTime, renderStatus } from './render.js';
import { getSeatsLeft } from './utils/format.ts';

const statusBox = document.querySelector('#detail-status');
const article = document.querySelector('#event-detail');

/** Phần tử có data-field="…" trong khung chi tiết */
function field(name) {
  return article.querySelector(`[data-field="${name}"]`);
}

function getEventIdFromUrl() {
  return new URLSearchParams(window.location.search).get('id');
}

function fillDetail(event, clubName) {
  document.title = `${event.name} · EduHub Web`;

  field('meta').replaceChildren(...createEventMeta(event, clubName).childNodes);
  field('name').textContent = event.name;
  field('club').textContent = clubName;
  field('time').replaceChildren(createTime(event.startTime));
  field('location').textContent = event.location;
  field('seats').textContent = `${event.capacity} (còn ${getSeatsLeft(event)} chỗ)`;
  field('description').textContent = event.description;
  field('cta').textContent =
    getSeatsLeft(event) === 0
      ? 'Sự kiện đã đủ chỗ. Bạn vẫn có thể tạo tài khoản thành viên để theo dõi các sự kiện sau.'
      : 'Đăng ký tham gia sự kiện cần tài khoản thành viên.';

  const image = field('image');
  image.setAttribute('src', getClubImage(event.clubId));
  image.setAttribute('alt', `Biểu tượng ${clubName}`);

  statusBox.replaceChildren();
  article.hidden = false;
}

async function loadDetail() {
  const id = getEventIdFromUrl();
  if (!id) {
    renderStatus(statusBox, 'empty', 'Thiếu mã sự kiện trên địa chỉ trang. Hãy chọn một sự kiện từ lịch sự kiện.');
    return;
  }

  renderStatus(statusBox, 'loading', 'Đang tải sự kiện…');
  try {
    const event = await getEvent(id);
    let clubName = 'Câu lạc bộ';
    try {
      clubName = (await getClub(event.clubId)).name;
    } catch {
      // Không lấy được tên CLB thì vẫn hiện sự kiện với chữ mặc định
    }
    fillDetail(event, clubName);
  } catch (error) {
    if (error.status === 404) {
      renderStatus(statusBox, 'empty', 'Không tìm thấy sự kiện này. Có thể sự kiện đã bị xoá hoặc đường dẫn sai.');
    } else {
      renderStatus(statusBox, 'error', error.message, { label: 'Thử lại', onClick: loadDetail });
    }
  }
}

loadDetail();
