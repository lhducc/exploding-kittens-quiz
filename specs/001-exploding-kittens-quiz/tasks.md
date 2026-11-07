---
description: "Danh sách việc triển khai và kiểm thử local cho Mèo Nổ Quiz"
---

# Việc triển khai Mèo Nổ Quiz

**Đầu vào** [Đặc tả](spec.md), [kế hoạch](plan.md), [nghiên cứu](research.md), [mô hình dữ liệu](data-model.md), [hợp đồng API](contracts/game.md) và [hướng dẫn local](quickstart.md).

**Ký hiệu** `[P]` là việc có thể chạy song song với việc được chỉ rõ ở mục phụ thuộc. `[US1]`–`[US3]` là mã câu chuyện. Đường dẫn mã nguồn tính từ gốc repo.

## Giai đoạn 1. Khởi tạo

- [X] T001 Khởi tạo một ứng dụng Next.js App Router với TypeScript, CSS thuần, Node 22.x và npm lockfile. Khai báo lệnh dev, build, test, test:integration và db:migrate trong `package.json`, `package-lock.json`, `tsconfig.json` và `app/layout.tsx`.
- [X] T002 [P] Thêm mẫu cấu hình DATABASE_URL và QUIZ_DRAW_PROFILES chỉ dùng giá trị minh họa, bỏ qua tệp môi trường local và đầu ra build trong `.env.example` và `.gitignore`.

## Giai đoạn 2. Nền tảng dùng chung

- [X] T003 [P] Tạo migration và lệnh áp dụng lặp an toàn cho bảng game_sessions với “`session_key_hash` làm khóa chính”, “`version` là số nguyên tăng sau mỗi lần ghi”, “`state` kiểu JSONB” và `updated_at` trong `db/001_game_sessions.sql` và `scripts/migrate.mjs`.
- [X] T004 [P] Nhập nguyên văn 10 câu và đáp án đã duyệt, mỗi câu có ID 01–10, phần I hoặc II, câu hỏi, bốn lựa chọn và một đáp án đúng. Mỗi phần có 5 câu. Thực hiện tại `lib/questions.ts`.
- [X] T005 [P] Viết kiểm tra chia bài cho cấu hình đúng, cấu hình 9 điểm trong 2 lượt, giới hạn số lá, tổng trần và vị trí lá bom trong `tests/deck.test.ts`.
- [X] T006 Triển khai bộ chia phía máy chủ. “Có đúng 10 cặp. Giá trị nguyên dương và ghép được từ 1, 2, 3, 5. Giới hạn cấu hình 20 lá an toàn mỗi câu.” Sau khi xáo cặp bằng crypto.randomInt, mỗi bộ “có `safeDraws` lá điểm với tổng bằng `cap`, theo sau là đúng một lá bom”. Tạo và gán bộ bài một lần khi mở ván. Thực hiện tại `lib/server/deck.ts`.
- [X] T007 Viết truy cập Postgres bằng pg với URL pooled khi chạy trên Neon, khóa tra cứu là SHA-256 của mã cookie ngẫu nhiên 32 byte, SQL tham số hóa và ghi có điều kiện theo phiên bản tăng dần trong `lib/server/store.ts`.

## Giai đoạn 3. US1 — Trả lời và rút điểm (P1)

**Mục tiêu** Có một vòng chơi từ chọn câu đến chốt điểm.  
**Kiểm thử độc lập** Chọn sai một câu để nhận 0, chọn đúng câu khác rồi dừng sau một lá điểm, sau đó xác nhận bom đưa riêng câu đang chơi về 0.

- [X] T008 [P] [US1] Viết kiểm tra luật chọn câu, trả lời một lần, rút, dừng, bom và tính tổng một lần mỗi câu trong `tests/game-core.test.ts`.
- [X] T009 [P] [US1] Viết kiểm tra hợp đồng JSON, thứ tự thao tác, lọc trường riêng và hai yêu cầu rút cùng phiên bản chỉ ghi được một lần trong `tests/game-api.integration.test.ts`.
- [X] T010 [P] [US1] Tạo hoặc tích hợp bộ hình duyệt gồm mặt sau, bốn lá điểm, bom và mèo mở đầu trong `public/cards/back.svg`, `public/cards/point-1.svg`, `public/cards/point-2.svg`, `public/cards/point-3.svg`, `public/cards/point-5.svg`, `public/cards/bomb.svg` và `public/cards/intro-cat.svg`.
- [X] T011 [US1] Viết chuyển trạng thái từ bảng chọn, trả lời đúng hoặc sai, vào màn rút, lật lá và chốt câu. Lưu lá hiện tại, điểm tạm, lý do kết thúc và điểm chốt. Tính tổng từ điểm đã chốt và dựng bản chiếu theo danh sách trường công khai trong `lib/server/game.ts`.
- [X] T012 [US1] Thực hiện GET và POST /api/game với cookie HttpOnly, SameSite=Lax, Secure khi dùng HTTPS, kiểm tra origin và JSON, phản hồi no-store và trả trạng thái mới nhất khi xung đột. Nối start, select, answer, enterDraw, draw, stop và continue vào luật cùng điều kiện ghi theo phiên bản trong `app/api/game/route.ts`.
- [X] T013 [US1] Dựng màn mở đầu, lưới 01–10, bốn đáp án, phản hồi đúng sai và màn rút với lá bên trái, điểm tạm bên phải. Thêm hiệu ứng mèo mở đầu và lật lá, trạng thái chờ, thông báo tiếng Việt và thao tác đồng bộ lại sau lỗi. Thực hiện tại `app/page.tsx`, `components/quiz.tsx` và `app/globals.css`.

## Giai đoạn 4. US2 — Bài phép và hướng dẫn (P2)

**Mục tiêu** Dùng đủ bốn bài phép và học cách dùng từ màn mở đầu.  
**Kiểm thử độc lập** Xem bốn hoạt ảnh, mở ván mới đủ lượt 2/1/3/1 và dùng từng phép để đối chiếu điểm, lá bài và lượt còn lại.

- [X] T014 [P] [US2] Viết kiểm tra 50/50 chỉ loại sai, bật Gỡ Bom chỉ tiêu lượt khi chặn bom, Xem Trước lặp cùng lá giữ nguyên lượt và Chốt Gấp Đôi nhân đúng hai lần điểm tạm trong `tests/game-spells.test.ts`.
- [X] T015 [P] [US2] Tạo bốn hoạt ảnh với dữ liệu riêng, dùng bộ hình của game, có Xem lại, Tiếp và Đóng, kèm chế độ giảm chuyển động trong `components/spell-guide.tsx` và `components/spell-guide.module.css`.
- [X] T016 [US2] Thêm bộ đếm 2/1/3/1, luật bốn phép và bản chiếu tương ứng vào `lib/server/game.ts`. Chỉ một 50/50 mỗi câu. Gỡ Bom bật tắt trực tiếp và tự tắt khi rời câu. Xem Trước giữ nguyên vị trí lá. Chốt Gấp Đôi chỉ dùng khi điểm tạm dương và chốt ngay.
- [X] T017 [US2] Nối bốn hành động phép vào kiểm tra hợp đồng và phiên bản tại `app/api/game/route.ts`. Bổ sung nút, số lượt, nhãn Đang bật, xác nhận Xem Trước và lối mở Hướng dẫn trong `components/quiz.tsx` và `app/globals.css`.

## Giai đoạn 5. US3 — Tiếp tục ván, kết quả và chơi lại (P3)

**Mục tiêu** Khôi phục đúng ván đã lưu, xem tổng sau 10 câu và chơi ván mới.  
**Kiểm thử độc lập** Tải lại giữa màn rút có lá xem trước, hoàn thành 10 câu, tải lại ở Kết quả rồi bấm Chơi lại.

- [X] T018 [US3] Viết kiểm tra khôi phục giữa màn rút, tổng 10 câu, chơi lại đặt lại trạng thái và yêu cầu mang phiên bản của ván cũ bị từ chối trong `tests/game-api.integration.test.ts`.
- [X] T019 [US3] Thêm màn Kết quả sau phản hồi câu thứ 10 và xử lý replay tạo bộ bài mới, giữ nguyên phiên trình duyệt và tiếp tục tăng phiên bản tại `lib/server/game.ts` và `app/api/game/route.ts`.
- [X] T020 [US3] Khi tải trang, mở lại đúng màn từ GET. Hiển thị Xem kết quả sau câu 10, tổng điểm và Chơi lại. Khôi phục lá đang hiện, lá đã xem và trạng thái Gỡ Bom từ phản hồi tại `components/quiz.tsx` và `app/globals.css`.

## Giai đoạn 6. Kiểm thử và bàn giao local

- [X] T021 Chạy các kiểm tra chia bài, luật và tích hợp Postgres, xác nhận cạnh tranh khi rút và dữ liệu trả về không lộ trường riêng. Đối chiếu lệnh trong `package.json` và `specs/001-exploding-kittens-quiz/quickstart.md`.
- [X] T022 Chạy build, kiểm tra bundle trình duyệt và đi qua một ván đủ 10 câu. Kiểm tra trên bố cục điện thoại, hiệu ứng lật, bốn hoạt ảnh, khôi phục khi tải lại và tổng điểm. Dùng các ca trong `specs/001-exploding-kittens-quiz/quickstart.md`.
- [X] T023 Đối chiếu lại lệnh và điều kiện thực tế của bản local, rồi bàn giao link hoặc lệnh chạy để người dùng chơi thử theo `specs/001-exploding-kittens-quiz/quickstart.md`. Phát hành Vercel và Neon production thuộc bước sau khi người dùng duyệt local.

## Phụ thuộc và thứ tự

`Khởi tạo → Nền tảng → US1 → US2 → US3 → Kiểm thử và bàn giao local`

- T001 và T002 có thể làm độc lập. Sau khởi tạo, T003, T004 và T005 tách file và có thể làm song song. T006 theo sau T005. T007 dùng migration T003.
- Trong US1, T008, T009 và T010 tách file và có thể làm song song. T011 theo sau bài kiểm tra luật và nền tảng. T012 nối luật và lưu phiên. T013 nối API với bộ hình.
- Trong US2, T014 và T015 có thể làm song song sau US1. T016 theo sau T014. T017 tích hợp luật và hoạt ảnh sau khi cả hai sẵn sàng.
- Trong US3, T018 mở rộng bộ tích hợp của US1 sau khi US2 ổn định. T019 thực hiện khôi phục và replay phía máy chủ. T020 nối giao diện vào hợp đồng đã hoàn tất.
- Ba câu chuyện lần lượt bổ sung vào các file trạng thái và giao diện dùng chung. Triển khai các phần dùng chung theo thứ tự, tránh chỉnh cùng file đồng thời.

## Chiến lược triển khai

Kiểm thử **MVP local** sau US1 bằng luồng trả lời sai, dừng và gặp bom. Tiếp tục đến hết US2 và US3 để bản giao cho nhóm có đủ bốn phép, hướng dẫn, kết quả và chơi lại. Bản production chờ người dùng chơi thử local.
