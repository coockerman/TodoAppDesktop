# Morrow

Morrow là ứng dụng desktop quản lý dự án và công việc theo ngày. Ứng dụng hoạt động offline, lưu dữ liệu local bằng SQLite và giữ lịch sử thay đổi để sẵn sàng cho các tính năng AI trong tương lai.

## Tính năng V1

- Lịch tuần/tháng, chọn ngày và ẩn riêng vùng lịch.
- Quản lý dự án, màu nhận diện và nhập nhanh công việc bằng Enter liên tục.
- Bộ quy trình dùng lại: checkbox tự lưu, sửa bước, đổi thứ tự, nhân bản, dán nhiều dòng và reset/xóa có hoàn tác.
- Nhiều cột trạng thái, độ ưu tiên tùy chỉnh và audit history.
- Chuyển hàng loạt công việc chưa hoàn thành sang ngày khác.
- Dashboard lọc theo tuần, tháng, dự án và tìm kiếm.
- Always-on-top, kéo cửa sổ, mini mode và tự khởi động cùng Windows.
- Xuất/nhập JSON có phiên bản schema; xóa mềm để không mất lịch sử.
- Light/Dark mode theo Windows hoặc chọn thủ công.

## Yêu cầu

- Node.js 22+
- Rust stable
- Microsoft Edge WebView2 (có sẵn trên Windows 10/11 hiện đại)

## Chạy ứng dụng

```bash
npm install
npm run tauri dev
```

Chỉ xem frontend trong trình duyệt:

```bash
npm run dev
```

## Kiểm thử

```bash
npm test
npm run build
cd src-tauri
cargo check
```

## Tạo bản release Windows

```bash
npm run tauri build
```

File thực thi được tạo trong `src-tauri/target/release/morrow.exe`.
Bộ cài Windows x64 được tạo trong `src-tauri/target/release/bundle/nsis/Morrow_0.1.0_x64-setup.exe`.
Chỉ cần gửi file `-setup.exe` sang máy Windows 10/11 Intel/AMD 64-bit khác và chạy để cài; không cần Node.js hoặc Rust trên máy sử dụng.
Bộ cài cài theo tài khoản Windows hiện tại và tự tải WebView2 nếu máy chưa có (cần Internet trong trường hợp này).
Dữ liệu nằm riêng trên từng máy; dùng Xuất/Nhập JSON nếu muốn chuyển dữ liệu.

Đây là ứng dụng desktop nên không deploy trực tiếp lên Vercel; Vercel chỉ phù hợp nếu muốn đăng riêng bản demo frontend.

## Dữ liệu local

- Database: `morrow.db` trong thư mục dữ liệu ứng dụng do Windows quản lý.
- Có thể tạo bản sao tại **Cài đặt → Dữ liệu của bạn → Xuất JSON**.
- File export chứa `schemaVersion`, múi giờ, task, project, cấu hình và toàn bộ audit event.
- Import kiểm tra định dạng trước khi thay thế dữ liệu hiện tại.

## Cấu trúc chính

```text
src/features/       Màn hình và nghiệp vụ theo tính năng
src/stores/         State và các hành động có audit
src/services/       SQLite, import/export và tích hợp desktop
src/data/           Dữ liệu demo lần chạy đầu
src-tauri/          Native shell, capabilities và migration SQLite
```
