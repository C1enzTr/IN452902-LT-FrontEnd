// Form tạo tài khoản thành viên: kiểm dữ liệu ở trình duyệt, gửi POST /api/auth/register,
// rồi hiện kết quả. Lỗi của trình duyệt và lỗi server (400, 409) hiện cùng một chỗ: dưới từng ô.
import { clearDraft, restoreDraft, saveDraft } from './register-draft.js';
import { el } from './render.js';
import { ApiError, registerMember } from './api.js';

const form = document.querySelector('#register-form');
const alertBox = document.querySelector('#form-alert');
const submitButton = form.querySelector('button[type="submit"]');

/** FormData đọc mọi ô theo thuộc tính name — không cần querySelector từng ô */
function readForm() {
  const data = new FormData(form);
  return {
    studentId: String(data.get('studentId') ?? '').trim(),
    name: String(data.get('name') ?? '').trim(),
    email: String(data.get('email') ?? '').trim(),
    password: String(data.get('password') ?? ''),
    passwordConfirm: String(data.get('passwordConfirm') ?? ''),
    agree: data.has('agree'),
  };
}

/**
 * Kiểm dữ liệu trước khi gửi. Trả về lỗi theo đúng dạng `errors` server gửi về
 * ({ email: ['…'] }) để dùng chung hàm showFieldErrors. Object rỗng = hợp lệ.
 */
function validate(values) {
  const errors = {};
  const add = (field, message) => {
    errors[field] = [message];
  };

  if (!/^\d{10}$/.test(values.studentId)) add('studentId', 'Mã số sinh viên gồm đúng 10 chữ số.');
  if (values.name.length < 2) add('name', 'Họ và tên cần ít nhất 2 ký tự.');
  if (!values.email) add('email', 'Vui lòng nhập email.');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) add('email', 'Email không đúng định dạng.');
  if (values.password.length < 8) add('password', 'Mật khẩu cần ít nhất 8 ký tự.');
  if (!values.passwordConfirm) add('passwordConfirm', 'Vui lòng nhập lại mật khẩu.');
  else if (values.passwordConfirm !== values.password) add('passwordConfirm', 'Mật khẩu nhập lại không khớp.');
  if (!values.agree) add('agree', 'Bạn cần đồng ý với nội quy sinh hoạt câu lạc bộ.');

  return errors;
}

// ---- Hiện thông báo ----

function clearMessages() {
  alertBox.replaceChildren();
  for (const box of form.querySelectorAll('[data-error-for]')) box.textContent = '';
  for (const input of form.querySelectorAll('[aria-invalid]')) input.removeAttribute('aria-invalid');
}

function showFieldErrors(errors) {
  let firstInvalid = null;
  for (const [name, messages] of Object.entries(errors)) {
    const box = form.querySelector(`[data-error-for="${name}"]`);
    const input = form.elements[name];
    const text = Array.isArray(messages) ? messages.join(' ') : String(messages);
    if (box) box.textContent = text;
    if (input) {
      input.setAttribute('aria-invalid', 'true');
      firstInvalid ??= input;
    }
  }
  firstInvalid?.focus();
}

function showAlert(kind, message) {
  const role = kind === 'error' ? 'alert' : 'status';
  alertBox.replaceChildren(el('p', { className: `alert alert--${kind}`, text: message, attrs: { role } }));
}

function setSubmitting(isSubmitting) {
  // Khoá nút khi đang gửi: bấm hai lần sẽ gửi hai request
  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? 'Đang gửi…' : 'Tạo tài khoản';
}

// ---- Gửi form ----

async function handleSubmit(event) {
  event.preventDefault(); // không để trình duyệt tự gửi form và tải lại trang
  clearMessages();

  const values = readForm();
  const errors = validate(values);
  if (Object.keys(errors).length > 0) {
    showFieldErrors(errors);
    return;
  }

  setSubmitting(true);
  try {
    // Không gửi passwordConfirm: registerMember chỉ lấy 4 trường server cần
    const member = await registerMember(values);
    form.reset(); // sự kiện reset xoá luôn thông báo và nháp, nên hiện thông báo thành công sau
    showAlert('success', `Đã tạo tài khoản cho ${member.name} (${member.email}). Bạn có thể đăng nhập khi chức năng đăng nhập sẵn sàng.`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      showFieldErrors({ email: ['Email đã được dùng để đăng ký.'] });
      showAlert('error', 'Không thể tạo tài khoản: email này đã được đăng ký.');
    } else if (error instanceof ApiError && error.status === 400) {
      showFieldErrors(error.fieldErrors);
      showAlert('error', 'Dữ liệu chưa hợp lệ. Kiểm tra các ô được đánh dấu.');
    } else {
      showAlert('error', error.message);
    }
  } finally {
    setSubmitting(false);
  }
}

form.addEventListener('submit', handleSubmit);
form.addEventListener('reset', () => {
  clearMessages();
  clearDraft();
});

// (Challenge ch3-T7) nháp tự lưu mỗi lần gõ, tự điền lại khi mở trang
form.addEventListener('input', () => saveDraft(form));
restoreDraft(form);
