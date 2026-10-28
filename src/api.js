// Mọi lời gọi mock API đi qua tệp này. Trang (events-page.js…) chỉ gọi
// getEvents(), registerMember()… mà không cần biết URL hay cách xử lý lỗi.
import { API_URL } from './config.js';

/** Lỗi từ API, mang theo mã HTTP và lỗi từng trường (nếu server gửi). */
export class ApiError extends Error {
  constructor(status, message, fieldErrors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status; // 0 = không kết nối được server
    this.fieldErrors = fieldErrors; // vd. { email: ['Email không hợp lệ.'] }
  }
}

/**
 * Gọi API và trả về dữ liệu JSON. Ném ApiError nếu lỗi.
 * fetch() KHÔNG tự báo lỗi khi server trả 404/409/500 — phải tự kiểm response.ok.
 */
async function request(path, { method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json' };
  const init = { method, signal, headers };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, init);
  } catch (error) {
    // Huỷ chủ động (AbortController) không phải lỗi: để nơi gọi tự bỏ qua
    if (error.name === 'AbortError') throw error;
    throw new ApiError(0, 'Không kết nối được máy chủ. Kiểm tra mạng hoặc bật mock API (npm run api) rồi thử lại.');
  }

  if (!response.ok) {
    // Server trả ProblemDetails; nếu thân phản hồi không phải JSON thì dùng thông báo chung
    let problem;
    try {
      problem = await response.json();
    } catch {
      problem = {};
    }
    const message = problem.detail ?? problem.title ?? `Máy chủ trả lỗi ${response.status}.`;
    throw new ApiError(response.status, message, problem.errors ?? {});
  }

  if (response.status === 204) return null;
  return response.json();
}

/** Bỏ các tham số rỗng để URL gọn: { q: '', clubId: 'x' } → "?clubId=x" */
function toQueryString(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

/** GET /api/events → { items, totalCount, page, pageSize } */
export function getEvents({ q, clubId, page = 1, pageSize = 50 } = {}, signal) {
  return request(`/api/events${toQueryString({ q, clubId, page, pageSize })}`, { signal });
}

/** GET /api/events/{id} → EventDto (404 nếu không có) */
export function getEvent(id, signal) {
  // encodeURIComponent: id lấy từ URL do người dùng gõ, không tin được
  return request(`/api/events/${encodeURIComponent(id)}`, { signal });
}

/** GET /api/clubs → ClubDto[] */
export function getClubs(signal) {
  return request('/api/clubs', { signal });
}

/** GET /api/clubs/{id} → ClubDto */
export function getClub(id, signal) {
  return request(`/api/clubs/${encodeURIComponent(id)}`, { signal });
}

/** POST /api/auth/register → MemberDto (409 nếu email đã dùng, 400 nếu dữ liệu sai) */
export function registerMember({ studentId, name, email, password }) {
  return request('/api/auth/register', {
    method: 'POST',
    body: { studentId, name, email, password },
  });
}
