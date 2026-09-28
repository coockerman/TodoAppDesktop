# Morrow — Implementation Plan

## 1. Mục tiêu sản phẩm

Morrow là ứng dụng desktop hỗ trợ quản lý công việc theo ngày và dự án. Ứng dụng hoạt động như một quyển lịch nhỏ có thể ghim trên màn hình, thu gọn nhanh, tự khởi động cùng Windows và lưu toàn bộ dữ liệu cục bộ.

V1 phải có giao diện hoàn thiện, dữ liệu demo sinh động và cấu trúc dữ liệu đủ tốt để sau này AI có thể phân tích thói quen, gợi ý hoặc tự nhập việc.

## 2. Phạm vi phát triển

### Phase 1 — MVP chỉn chu

- Lịch tuần/tháng, điều hướng ngày, tháng và năm.
- Có thể thu gọn riêng khu vực lịch sau khi chọn ngày để tập trung vào danh sách công việc.
- Chọn ngày để xem dự án và nhập nhanh task.
- Thêm, sửa, lưu trữ và xóa mềm dự án; tùy chỉnh màu dự án.
- Thêm, sửa, hoàn thành và xóa mềm task.
- Trạng thái mặc định `Hoàn thành` và danh sách độ ưu tiên mặc định.
- Chuyển hàng loạt các task chưa hoàn thành sang một ngày được chọn.
- Cửa sổ luôn nổi, kéo thả, thu gọn thành thanh mini và khôi phục.
- Tự khởi động cùng Windows, bật/tắt trong Settings.
- SQLite lưu local; xuất/nhập JSON có phiên bản schema.
- Dashboard lớn để xem và lọc task theo khoảng thời gian, dự án, trạng thái và ưu tiên.
- Light/Dark tự động theo Windows và cho phép chọn thủ công.

### Phase 2 — Mở rộng

- Tạo, sửa, sắp xếp và xóa mềm nhiều cột trạng thái tùy chỉnh.
- Tạo, sửa, sắp xếp và xóa mềm các mức ưu tiên tùy chỉnh.
- Tìm kiếm toàn văn, thống kê năng suất và biểu đồ tiến độ.
- Nhắc hạn, thông báo hệ thống và tác vụ lặp lại.
- Sao lưu tự động và nhập/xuất dữ liệu chọn lọc.
- Lớp AI đọc dữ liệu sự kiện để gợi ý lịch, phân loại và nhập task.

## 3. Công nghệ

- Desktop shell: Tauri 2.
- Frontend: React + TypeScript + Vite.
- Styling: Tailwind CSS, CSS variables và design tokens.
- State: Zustand; state giao diện tách khỏi dữ liệu SQLite.
- Database: SQLite qua plugin SQL của Tauri, quản lý bằng migration.
- Validation: Zod cho form và file JSON nhập vào.
- Date/time: date-fns; lưu timestamp theo UTC ISO 8601, hiển thị theo múi giờ máy.
- Testing: Vitest + React Testing Library; kiểm tra build Tauri ở bước bàn giao.

## 4. Định hướng giao diện

### 4.1 Chế độ lịch nhỏ — Month view

```text
┌──────────────────────────────────────────────────────────┐
│  Morrow       ‹  Tháng 9, 2026  ›  Tuần | Tháng  Ẩn lịch  −  ⚙ │
├──────────────────────────────────────────────────────────┤
│   T2     T3     T4     T5     T6     T7     CN           │
│  [31]    01     02     03     04     05     06           │
│   07     08     09     10     11     12     13           │
│   14     15     16     17     18     19     20           │
│   21     22     23     24    [25]    26     27           │
│   28     29     30     01     02     03     04           │
├──────────────────────────────────────────────────────────┤
│  Thứ Sáu, 25/09                         + Dự án           │
│  ● Morrow Launch                                           │
│    ☐ Hoàn thiện calendar shell             Cao ▾          │
│    ☑ Chốt database schema                   Vừa ▾          │
│    + Thêm nhanh công việc...                                │
│  ● Personal                                                │
│    ☐ Đi bộ 30 phút                         Thấp ▾          │
├──────────────────────────────────────────────────────────┤
│  3 việc chưa xong        Chuyển tất cả sang ngày...       │
└──────────────────────────────────────────────────────────┘
```

Khi nhấn `Ẩn lịch`, khu vực calendar được thu gọn nhưng ngày đang chọn và danh sách công việc vẫn giữ nguyên:

```text
┌──────────────────────────────────────────────────────────┐
│  Morrow       Thứ Sáu, 25/09        Hiện lịch       −  ⚙ │
├──────────────────────────────────────────────────────────┤
│  ● Morrow Launch                              + Dự án    │
│    ☐ Hoàn thiện calendar shell             Cao ▾         │
│    ☑ Chốt database schema                   Vừa ▾         │
│    + Thêm nhanh công việc...                               │
│  ● Personal                                               │
│    ☐ Đi bộ 30 phút                         Thấp ▾         │
├──────────────────────────────────────────────────────────┤
│  3 việc chưa xong        Chuyển tất cả sang ngày...      │
└──────────────────────────────────────────────────────────┘
```

- Nút `Ẩn lịch/Hiện lịch` chỉ tác động đến vùng week/month calendar, không thu gọn toàn bộ cửa sổ.
- Ngày đang chọn được hiển thị trên thanh tiêu đề khi lịch đang ẩn.
- Lựa chọn ẩn/hiện lịch được ghi nhớ giữa các lần mở app.

### 4.2 Chế độ thu gọn

```text
┌──────────────────────────────────────────────────────┐
│  Morrow · 25/09     2/5 hoàn thành   ▰▰▱▱▱      □   │
└──────────────────────────────────────────────────────┘
```

- Cả cửa sổ thường và thanh mini đều kéo được bằng vùng tiêu đề.
- Trạng thái thu gọn và vị trí cửa sổ được ghi nhớ giữa các lần mở app.

### 4.3 Dashboard lớn

```text
┌────────────────────────────────────────────────────────────────────┐
│ Morrow / Tổng quan             Tuần này ▾   Bộ lọc   Tìm kiếm   ⚙ │
├───────────────┬────────────────────────────────────────────────────┤
│ Khoảng ngày   │  12 việc  ·  7 hoàn thành  ·  2 quá hạn          │
│ Dự án         ├────────────────────────────────────────────────────┤
│ Trạng thái    │  HÔM NAY                                           │
│ Ưu tiên       │  ● Morrow Launch   Hoàn thiện calendar    Cao     │
│               │  ● Personal        Đi bộ 30 phút          Thấp    │
│               │                                                     │
│ + Dự án       │  CÁC NGÀY TRƯỚC                                    │
│               │  ● Work            Tổng hợp báo cáo       Vừa     │
└───────────────┴────────────────────────────────────────────────────┘
```

### 4.4 Ngôn ngữ thiết kế

- Bố cục thoáng, tối giản như Notion; màu trung tính và accent dịu kiểu Linear.
- Font sans-serif hiện đại, độ tương phản đạt chuẩn, bo góc 10–14 px.
- Chuyển động 150–220 ms; hạn chế animation gây xao nhãng.
- Light/Dark theo hệ thống; Settings cho phép chọn `System`, `Light`, `Dark`.
- Màu dự án xuất hiện ở dấu chấm, viền hoặc nền nhạt, không phủ màu toàn bộ nội dung.

## 5. Kiến trúc thư mục dự kiến

```text
Morrow/
├─ src/
│  ├─ app/                  # App shell, router, providers
│  ├─ components/           # UI dùng chung
│  ├─ features/
│  │  ├─ calendar/          # Week/month views và date navigation
│  │  ├─ projects/          # CRUD, màu và Project Manager
│  │  ├─ tasks/             # Quick entry, task rows, bulk move
│  │  ├─ dashboard/         # Bộ lọc và màn hình tổng hợp
│  │  └─ settings/          # Theme, startup, status, priority, backup
│  ├─ db/                   # Repository, schema mapping, migrations API
│  ├─ stores/               # Zustand UI stores
│  ├─ services/             # Export/import, audit, system integrations
│  ├─ hooks/
│  ├─ lib/                  # Date, validation, constants
│  ├─ data/                 # Demo seed data
│  └─ types/
├─ src-tauri/
│  ├─ src/                  # Window, autostart, file dialog commands
│  ├─ migrations/           # SQLite migrations tuần tự
│  ├─ capabilities/         # Tauri permissions tối thiểu
│  └─ tauri.conf.json
├─ tests/
├─ package.json
└─ README.md
```

## 6. Mô hình dữ liệu

Mỗi bảng nghiệp vụ có `id` dạng UUID, `created_at`, `updated_at` và `deleted_at`. Xóa trong giao diện là xóa mềm để giữ lịch sử và cho phép khôi phục hoặc phân tích sau này.

### `projects`

- `id`, `name`, `description`, `color`
- `sort_order`, `is_archived`
- `created_at`, `updated_at`, `deleted_at`

### `tasks`

- `id`, `project_id`, `title`, `notes`
- `scheduled_date`, `priority_id`, `sort_order`
- `completed_at`, `created_at`, `updated_at`, `deleted_at`
- `origin_task_id`: truy vết nguồn khi cần nhân bản trong tương lai

### `status_definitions`

- `id`, `name`, `color`, `weight`, `sort_order`
- `is_completion_status`, `is_system`
- `created_at`, `updated_at`, `deleted_at`

### `task_status_values`

- `task_id`, `status_id`, `is_checked`
- `checked_at`, `updated_at`

Thiết kế này cho phép một task có nhiều cột tick độc lập. Trạng thái có trọng số cao hơn được hiển thị về phía sau theo yêu cầu.

### `priority_definitions`

- `id`, `name`, `color`, `weight`, `sort_order`
- `is_default`
- `created_at`, `updated_at`, `deleted_at`

### `task_date_moves`

- `id`, `task_id`, `from_date`, `to_date`
- `moved_at`, `move_batch_id`, `reason`

### `audit_events`

- `id`, `entity_type`, `entity_id`, `event_type`
- `occurred_at`, `actor`, `session_id`
- `before_json`, `after_json`, `metadata_json`

Các event chính: `created`, `updated`, `status_changed`, `priority_changed`, `date_moved`, `completed`, `reopened`, `deleted`, `restored`, `imported`.

### `app_settings`

- `key`, `value_json`, `updated_at`
- Lưu theme, autostart, window mode, kích thước/vị trí cửa sổ và tùy chọn người dùng.

## 7. Nguyên tắc dữ liệu phục vụ AI

- Không ghi đè mất dấu vết: trạng thái hiện tại nằm trong bảng nghiệp vụ, thay đổi quan trọng được bổ sung vào `audit_events`.
- Ghi rõ thời điểm tạo, cập nhật, hoàn thành, mở lại, chuyển ngày và xóa.
- Bulk move dùng cùng `move_batch_id` để AI nhận biết một hành động hàng loạt.
- JSON export chứa `schemaVersion`, `exportedAt`, timezone, settings và toàn bộ bảng liên quan.
- Import được kiểm tra schema, tạo bản sao lưu trước khi ghi và thực hiện trong transaction.
- Không đưa dữ liệu lên mạng ở V1; người dùng sở hữu hoàn toàn database và file export.
- Dữ liệu audit không xóa theo thao tác xóa task thông thường. Việc xóa vĩnh viễn sẽ là thao tác riêng có cảnh báo.

## 8. Luồng dữ liệu chính

```text
UI action
  → validate input (Zod)
  → feature service
  → SQLite transaction
      ├─ update current entity state
      └─ append audit event / date-move event
  → refresh repository query
  → update Zustand UI state
  → render affected components
```

### Chuyển task hàng loạt

1. Người dùng chọn ngày đích.
2. App hiển thị số task chưa hoàn thành sẽ được chuyển.
3. Một transaction cập nhật `scheduled_date` cho toàn bộ task.
4. Mỗi task có một bản ghi `task_date_moves` và `audit_events`; tất cả dùng chung `move_batch_id`.
5. UI cập nhật cả ngày nguồn, ngày đích và Dashboard.

### Xuất dữ liệu

1. Đọc snapshot nhất quán trong transaction.
2. Chuẩn hóa thành JSON có version.
3. Người dùng chọn vị trí lưu bằng native file dialog.
4. Không tự động truyền file ra ngoài máy.

## 9. State và trách nhiệm mô-đun

- SQLite là nguồn dữ liệu chuẩn cho project, task, trạng thái, ưu tiên và audit.
- Zustand chỉ giữ UI state: ngày đang chọn, loại lịch, filter, theme override và trạng thái panel.
- Trạng thái hiển thị calendar độc lập với chế độ mini của toàn bộ ứng dụng.
- Repository cô lập câu SQL khỏi component React.
- Service điều phối transaction và tự động ghi audit; component không tự ghi log.
- Tauri/Rust chỉ xử lý chức năng hệ thống cần quyền native; nghiệp vụ nằm trong TypeScript khi phù hợp.

## 10. Dữ liệu demo ban đầu

- Project `Morrow Launch` màu tím với các task thiết kế, database và kiểm thử.
- Project `Công việc` màu xanh dương với task báo cáo và họp tuần.
- Project `Cá nhân` màu xanh lá với task vận động và đọc sách.
- Các mức ưu tiên: `Thấp`, `Vừa`, `Cao`, `Khẩn cấp`.
- Trạng thái mặc định: `Hoàn thành`.
- Seed chỉ chạy khi database hoàn toàn trống.

## 11. Checklist thực thi

### Nền tảng

- [x] Khởi tạo Vite React TypeScript và Tauri 2.
- [x] Cấu hình Tailwind, TypeScript build và test.
- [x] Thiết lập SQLite, migrations và demo seed idempotent.
- [x] Cấu hình quyền Tauri tối thiểu cho SQL, autostart và file dialog.

### Data layer

- [x] Tạo schema, model TypeScript và Zod schemas.
- [x] Tạo data store cho project, task, status, priority và settings.
- [x] Tạo audit service cho các hành động quan trọng.
- [x] Viết export/import JSON có schema version và validation.

### Giao diện cốt lõi

- [x] Xây design system, theme System/Light/Dark và app shell.
- [x] Xây month view, week view và date navigator.
- [x] Thêm nút ẩn/hiện riêng vùng calendar, giữ ngày và nội dung đang chọn.
- [x] Xây daily project list, quick task row và priority dropdown.
- [x] Xây Project Manager và chọn màu dự án.
- [x] Xây bulk move và trạng thái phản hồi thành công/lỗi.

### Desktop behavior

- [x] Always-on-top và tùy chọn bật/tắt.
- [x] Custom drag region cho cửa sổ không viền.
- [x] Mini mode và nút khôi phục.
- [x] Autostart cùng Windows qua Settings.

### Dashboard và Settings

- [x] Dashboard lớn, bộ lọc thời gian/dự án và tìm kiếm.
- [x] Settings quản lý theme, startup, trạng thái và ưu tiên.
- [x] Settings xuất/nhập JSON và hiển thị thông tin database local.

### Chất lượng và bàn giao

- [x] Unit test cho date utilities, export và audit payload.
- [x] Integration test cho trạng thái, xóa mềm và bulk move.
- [x] Kiểm tra trực quan navigation, contrast và empty states.
- [x] Chạy test, frontend build, Cargo check và Tauri build.
- [x] Viết README hướng dẫn chạy, build và sao lưu dữ liệu.

## 12. Tiêu chí hoàn thành V1

- App mở được với dữ liệu demo và có thể dùng ngay mà không cần cấu hình.
- Người dùng quản lý được dự án/task theo ngày ở week/month view.
- Bulk move không làm mất task và có lịch sử đầy đủ.
- Thu gọn, kéo thả, always-on-top và autostart hoạt động trên Windows.
- Khởi động lại app không mất dữ liệu, theme, vị trí hay tùy chọn.
- Thu gọn vùng lịch không làm mất ngày đang chọn hoặc ảnh hưởng danh sách công việc.
- File JSON xuất ra có thể nhập lại và bảo toàn dữ liệu/audit.
- Dashboard lọc đúng dữ liệu, UI responsive trong các kích thước cửa sổ dự kiến.
- Lint, test và build đều thành công trước khi bàn giao.

## 13. Quyết định dành cho V1

- Hệ điều hành mục tiêu đầu tiên: Windows.
- App hoạt động offline hoàn toàn; chưa có tài khoản hoặc đồng bộ cloud.
- Task chưa hoàn thành luôn ở ngày cũ cho tới khi người dùng chủ động chuyển.
- Xóa mặc định là xóa mềm; không làm mất audit history.
- Phase 1 chuẩn bị đầy đủ schema cho nhiều trạng thái tùy chỉnh, dù trải nghiệm quản trị nâng cao có thể hoàn thiện tiếp ở Phase 2.

## 14. Kế hoạch tiếp theo — Task chưa xác định ngày (Project Backlog)

### 14.1 Mục tiêu và nguyên tắc

- Mỗi project có một **Backlog** chứa các task chắc chắn sẽ làm nhưng chưa chọn ngày.
- Backlog không xuất hiện lẫn trong danh sách task của ngày, tránh làm màn lịch bị rối.
- Task backlog vẫn có project, độ ưu tiên, ghi chú và các cột trạng thái tùy chỉnh như task đã xếp lịch.
- Trạng thái lập lịch là thuộc tính hệ thống riêng, không biến thành một cột tick do người dùng cấu hình.

### 14.2 Mô hình dữ liệu

- Đổi `Task.scheduledDate` từ `string` thành `string | null`.
- `scheduledDate = null`: task đang ở Backlog, hiển thị badge hệ thống `Chưa xếp lịch`.
- `scheduledDate != null`: task đã được đưa vào một ngày cụ thể.
- Giữ nguyên `statuses`, `priorityId`, `completedAt` và audit history.
- Bổ sung event `scheduled`, `unscheduled` và `rescheduled`; metadata lưu ngày nguồn/ngày đích.
- Task hoàn thành ngay trong Backlog vẫn được phép, nhưng mặc định ẩn khỏi danh sách mở và có bộ lọc `Đã xong`.

### 14.3 Vị trí UI đề xuất

Trong màn `Dự án`, mỗi project có nút gọn `Backlog · N`. Nhấn vào mở panel chi tiết ở bên phải thay vì chuyển sang một trang hoàn toàn khác:

```text
┌──────── Project cards ────────┬──────── Backlog · Fair Shot ─────────┐
│ Fair Shot                     │ + Thêm việc chưa có ngày...          │
│ 12 việc · Backlog 4           │                                     │
│ [Mở backlog] [Lưu trữ]        │ ⠿ Thiết kế màn reward      Cao      │
│                               │   [Hôm nay] [Ngày mai] [Chọn ngày]  │
│ Personal                      │ ⠿ Tối ưu save game         Vừa      │
│ ...                           │   [Hôm nay] [Ngày mai] [Chọn ngày]  │
└───────────────────────────────┴─────────────────────────────────────┘
```

- Desktop rộng: side panel chiếm khoảng 40–45% chiều rộng.
- Cửa sổ hẹp: panel mở dạng trang con toàn chiều rộng với nút quay lại.
- Header panel có tìm kiếm, lọc ưu tiên và bộ lọc `Đang mở / Đã xong`.
- Quick add chỉ cần nhập tên và Enter; priority mặc định được áp dụng tự động.

### 14.4 Luồng xếp lịch nhanh

1. Người dùng mở Backlog từ card project.
2. Mỗi task có ba hành động trực tiếp: `Hôm nay`, `Ngày mai`, `Chọn ngày`.
3. Khi chọn ngày, task biến mất khỏi Backlog mở và xuất hiện ngay trong project ở ngày tương ứng.
4. Hiện toast có nút `Hoàn tác` trong vài giây để trả task về Backlog nếu chọn nhầm.
5. Ở màn lịch, menu cạnh task có hành động `Đưa về Backlog` để bỏ ngày mà không xóa task.
6. Phase sau có thể kéo task từ panel Backlog thả trực tiếp vào ô lịch; V1 ưu tiên nút nhanh vì chính xác và dùng tốt với cửa sổ nhỏ.

### 14.5 Trạng thái và hành vi

- Badge `Chưa xếp lịch` chỉ mô tả vị trí lập lịch; không cạnh tranh với `Todo`, `Done` hoặc các status do người dùng tạo.
- Các cột trạng thái hiện tại tiếp tục hoạt động trong Backlog.
- Nếu bật `Done là trạng thái độc quyền`, tick Done trong Backlog cũng bỏ tick các cột khác.
- Task Done được chuyển sang nhóm thu gọn `Đã hoàn thành`; không tự động gán ngày.
- Khi project được lưu trữ, Backlog của project cũng được lưu trữ theo và chỉ đọc/sửa trong view lưu trữ cho tới khi project được khôi phục.

### 14.6 Checklist triển khai

- [x] Normalize dữ liệu cũ và hỗ trợ `scheduledDate: null` trong snapshot SQLite/JSON.
- [x] Store actions: `addBacklogTask`, `scheduleTask`, `unscheduleTask`.
- [x] Bộ đếm backlog trên ProjectCard.
- [x] Backlog side panel responsive, quick add và chỉnh task.
- [x] Các nút Hôm nay/Ngày mai/Chọn ngày.
- [x] Toast Hoàn tác sau khi xếp lịch.
- [x] Hành động Đưa về Backlog từ task đã xếp lịch.
- [x] Dashboard có bộ lọc `Chưa xếp lịch`, mặc định không trộn vào thống kê theo ngày.
- [x] Unit/integration test cho schedule, unschedule và normalize dữ liệu cũ.
