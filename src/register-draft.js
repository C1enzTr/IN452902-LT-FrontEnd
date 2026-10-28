// (Challenge) Lưu nháp form đăng ký vào localStorage: lỡ đóng tab thì mở lại vẫn còn chữ đã gõ.
// localStorage chỉ lưu CHUỖI → dùng JSON.stringify khi ghi, JSON.parse khi đọc.
// Tuyệt đối không lưu mật khẩu: ai mở DevTools trên máy này cũng đọc được localStorage.

const DRAFT_KEY = 'eduhub.registerDraft';
const DRAFT_FIELDS = ['studentId', 'name', 'email']; // cố ý KHÔNG có password, passwordConfirm

export function saveDraft(form) {
  const draft = {};
  for (const name of DRAFT_FIELDS) draft[name] = form.elements[name].value;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Trình duyệt chặn localStorage (chế độ riêng tư, đầy bộ nhớ…): bỏ qua, form vẫn dùng được
  }
}

export function restoreDraft(form) {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    if (draft === null || typeof draft !== 'object') return;
    for (const name of DRAFT_FIELDS) {
      if (typeof draft[name] === 'string') form.elements[name].value = draft[name];
    }
  } catch {
    // Dữ liệu hỏng (không phải JSON hợp lệ): bỏ nháp, không làm lỗi trang
    clearDraft();
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // bỏ qua
  }
}
