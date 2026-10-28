// Tệp TypeScript duy nhất của Ch03: các hàm định dạng dữ liệu để hiển thị.
// Kiểu giúp tsc báo lỗi TRƯỚC khi chạy, ví dụ gọi formatSeats(event) mà event thiếu capacity.
// Kiểm tra: npm run typecheck

/** Phần dữ liệu sự kiện cần để tính số chỗ — chỉ 2 trường, không cần cả EventDto. */
export interface SeatInfo {
  capacity: number;
  registeredCount: number;
}

/** Union type: tình trạng chỗ chỉ có thể là một trong ba chuỗi này. */
export type SeatStatus = 'available' | 'almost-full' | 'full';

const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'] as const;

const VN_DATE_TIME = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** "2026-10-17T00:30:00.000Z" → "07:30 Thứ Bảy, 17/10/2026" */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  // Lấy từng phần theo giờ Việt Nam (server lưu UTC) rồi tự ghép đúng định dạng của đề.
  const parts: Record<string, string> = {};
  for (const part of VN_DATE_TIME.formatToParts(date)) parts[part.type] = part.value;

  // Việt Nam = UTC+7, không có giờ mùa hè → dời 7 giờ rồi đọc thứ theo UTC.
  const weekday = WEEKDAYS[new Date(date.getTime() + 7 * 60 * 60 * 1000).getUTCDay()];
  const hour = parts.hour === '24' ? '00' : parts.hour;

  return `${hour}:${parts.minute} ${weekday}, ${parts.day}/${parts.month}/${parts.year}`;
}

export function getSeatsLeft(seat: SeatInfo): number {
  return Math.max(0, seat.capacity - seat.registeredCount);
}

export function getSeatStatus(seat: SeatInfo): SeatStatus {
  const left = getSeatsLeft(seat);
  if (left === 0) return 'full';
  if (left < seat.capacity * 0.2) return 'almost-full';
  return 'available';
}

/** { capacity: 60, registeredCount: 48 } → "Còn 12/60 chỗ" */
export function formatSeats(seat: SeatInfo): string {
  if (getSeatStatus(seat) === 'full') return `Đã đủ ${seat.capacity} chỗ`;
  return `Còn ${getSeatsLeft(seat)}/${seat.capacity} chỗ`;
}
