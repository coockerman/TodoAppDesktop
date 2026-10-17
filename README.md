# Morrow

Morrow là ứng dụng desktop quản lý dự án và công việc theo ngày. Ứng dụng hoạt động offline, lưu dữ liệu local bằng SQLite và giữ lịch sử thay đổi để sẵn sàng cho các tính năng AI trong tương lai.

## Tính năng V1

- Hướng dẫn 4 bước có minh họa ở lần đầu; xem lại trong Cài đặt. Bắt đầu với dữ liệu trống.
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
Bộ cài Windows x64 được tạo trong `src-tauri/target/release/bundle/nsis/Morrow_<version>_x64-setup.exe`.
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
src/data/           Trạng thái và mức ưu tiên mặc định
src-tauri/          Native shell, capabilities và migration SQLite
```

## Bản kiểm thử 0.0.1.2

Chạy `npm run tauri dev` để test desktop hoặc `npm run dev` để test giao diện web. Chưa tạo release / bộ cài cho lần cập nhật này.
Version hiển thị là `0.0.1.2`; package, Cargo và Tauri dùng SemVer `0.0.1-2`.

- Popup tạo dự án; người dùng mới có dự án Demo và hai trạng thái Todo / Done.
- Dropdown chọn một trạng thái; sắp xếp trạng thái và độ ưu tiên bằng mũi tên.
- Tổng quan có tiến độ theo dự án và từng công việc.
- View Dữ liệu có bốn phạm vi xuất JSON, nhập gộp hoặc thay thế với xem trước số lượng.
- Trong từng quy trình, bật viết nhiều dòng hoặc dán ảnh vào bước (PNG/JPEG/GIF/WebP, tối đa 5 MB mỗi ảnh).
- Clear account trong Cài đặt yêu cầu xác nhận, xóa dữ liệu và đưa app về trạng thái người dùng mới.

## Bản kiểm thử 0.0.1.3

Version hiển thị là `0.0.1.3`; package, Cargo và Tauri dùng SemVer `0.0.1-3`.

- Thêm cửa sổ chuyển việc theo ngày/dự án, hỗ trợ chuyển về ngày cũ; chặn chuyển ngày và về Backlog cho việc Done.
- Thêm tùy chọn ẩn ưu tiên toàn app; cài mới mặc định Low / Medium / Hard, giữ bộ ưu tiên của dữ liệu cũ.
- Tự cuộn khi thêm việc, ô Quy trình tự co giãn tối đa 6 dòng, hướng dẫn tô sáng giao diện trực tiếp và mở rộng vùng kéo cửa sổ.

## Bản kiểm thử 0.0.1.4

- Sửa lớp phủ hướng dẫn: vùng được khoanh giữ nguyên độ sáng, chỉ làm tối vùng xung quanh.
- Khởi động cùng Windows dùng đường dẫn exe có ngoặc kép, cập nhật lại đường dẫn khi mở bản đã nâng cấp và chỉ lưu công tắc sau khi đăng ký thành công. Chặn đăng ký autostart từ bản debug.
- Kiểm tra: 39 test frontend và 1 test Rust đạt; đã xem trực quan bước hướng dẫn Quy trình trên Chrome. Chưa kiểm tra đăng xuất/đăng nhập Windows thực tế.

## Bản kiểm thử 0.0.1.5

- Thu gọn thanh trên còn 56px, footer còn 18px; bỏ slogan khỏi thanh trên.
- Thanh ngày khi ẩn lịch còn 40px, nhãn và ngày nằm cùng hàng; giảm khoảng đệm tiêu đề kế hoạch và thanh chuyển việc.
- Giữ vùng tên và khoảng trống của thanh trên để kéo cửa sổ. Đã kiểm tra trực quan bố cục lịch thu gọn trên Chrome.
