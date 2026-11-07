# Kế hoạch triển khai Mèo Nổ Quiz

**Nhánh Git** `main` · **Mã tính năng** `001-exploding-kittens-quiz` · **Ngày** 2026-11-07  
**Đầu vào** [Đặc tả tính năng](spec.md)

## Tóm tắt

Làm web quiz cá nhân gồm 10 câu và bốn bài phép tiếng Việt. Giao diện bám sát ảnh mẫu Mèo Nổ, ưu tiên điện thoại. Một ứng dụng Next.js phục vụ cả giao diện và API trên Vercel. Neon Postgres lưu ván, giữ bộ bài phía máy chủ và ghi nhận điểm chốt. Nhóm kiểm thử local trước khi phát hành link.

## Bối cảnh kỹ thuật

| Hạng mục | Quyết định |
| --- | --- |
| Ngôn ngữ và môi trường | TypeScript, Node.js 22.x, npm và lockfile |
| Ứng dụng | Next.js App Router, React, CSS thuần và Route Handler cùng origin |
| Dữ liệu | PostgreSQL, driver `pg`. Bảng phiên lưu trạng thái JSONB và kỷ lục, bảng riêng lưu lượt thử PIN. Local dùng PostgreSQL qua Docker hoặc một nhánh Neon dev riêng. |
| Kiểm thử | Bộ kiểm thử Node cho chia bài, luật và dữ liệu công khai. Kiểm thử tích hợp với PostgreSQL cho tranh chấp và khôi phục ván. Kiểm thử trình duyệt theo [hướng dẫn local](quickstart.md). |
| Nền tảng | Windows khi phát triển, Vercel Node.js Functions khi phát hành, trình duyệt điện thoại và máy tính khi chơi |
| Quy mô | Một lớp học, 10 câu mỗi ván, 4 bài phép, mỗi người chơi nhiều ván |
| Phản hồi | Một yêu cầu cho mỗi thao tác có ảnh hưởng đến ván. Sau phản hồi, giao diện mới xác nhận lá, lượt phép hoặc điểm. |
| Phạm vi | Ván cá nhân qua link. Nhóm canh giờ ngoài game. Cấu hình điểm và thông tin kết nối thật nằm trong biến môi trường riêng. |

## Kiểm tra hiến chương

- Trước nghiên cứu, `.specify/memory/constitution.md` là mẫu chưa có nguyên tắc được ban hành. Không có cổng kiểm tra dự án cụ thể cần xử lý.
- Sau thiết kế, phương án giữ một ứng dụng, một API và bảng phiên dùng chung cho tiến độ và kỷ lục. Các yêu cầu về tính điểm phía máy chủ, phục hồi ván, PIN và duyệt local đều có cách kiểm chứng trong [hướng dẫn local](quickstart.md).

## Cấu trúc dự án

### Tài liệu

```text
specs/001-exploding-kittens-quiz/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── game.md
└── checklists/
    └── requirements.md
```

### Mã nguồn dự kiến tại gốc repo

```text
app/
├── api/game/route.ts
├── globals.css
├── layout.tsx
└── page.tsx
components/
├── quiz.tsx
└── spell-guide.tsx
lib/
├── questions.ts
└── server/
    ├── deck.ts
    ├── game.ts
    └── store.ts
public/cards/
scripts/migrate.mjs
db/001_game_sessions.sql
tests/
```

Giao diện và hoạt ảnh nằm trong cùng ứng dụng. Các hình mặt sau, lá điểm và lá bom là tài sản tĩnh có thể thay bằng hình nhóm duyệt. Các mô-đun máy chủ tạo bộ bài, áp dụng luật và lưu tiến độ. API chỉ trả về bản chiếu được định nghĩa trong [hợp đồng giao diện và API](contracts/game.md).

## Thiết kế và bàn giao

1. Dùng bộ 10 câu đã duyệt. Kiểm tra 10 cặp hợp lệ trước khi mở ván, xáo cách gán và chia bộ bài một lần khi bắt đầu. [Nghiên cứu và cấu hình thử](research.md)
2. Lưu mỗi phiên với phiên bản tăng dần. Máy chủ chỉ áp dụng yêu cầu hợp lệ nếu phiên bản vẫn khớp khi ghi. Trình duyệt đồng bộ lại khi nhận xung đột hoặc mất phản hồi. [Mô hình dữ liệu](data-model.md)
3. Dựng màn mở đầu, lưới câu, câu hỏi, rút bài, phản hồi kết thúc câu và Kết quả. Dùng lại hình và bố cục cho bốn hoạt ảnh hướng dẫn.
4. Kiểm thử đầy đủ trên local. Sau khi người dùng duyệt, nhập repo GitHub cá nhân vào Vercel, đặt biến môi trường, áp dụng migration trên Neon production và chạy smoke test trước khi gửi link. Repo GitHub nhận các file trực tiếp ở gốc.

Bước Spec Kit kế tiếp là `speckit-tasks`.
