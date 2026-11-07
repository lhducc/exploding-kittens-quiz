# Kiểm thử local Mèo Nổ Quiz

Các lệnh dưới đây là quy trình sau khi triển khai mã nguồn. Chạy tại gốc repo bằng PowerShell với Node.js 22 và npm.

## 1. Chuẩn bị PostgreSQL dev

Bật Docker Desktop, kiểm tra `docker info`, rồi tạo một container PostgreSQL 17 cho dự án. Lần sau dùng `docker start mln131-quiz-db`.

```powershell
docker run --name mln131-quiz-db -e POSTGRES_PASSWORD=local_quiz_only -e POSTGRES_DB=quiz -p 127.0.0.1:5433:5432 -v mln131-quiz-pg:/var/lib/postgresql/data -d postgres:17
docker exec mln131-quiz-db pg_isready -U postgres -d quiz
```

Nếu dùng Neon dev, tạo một nhánh riêng cho kiểm thử và lấy URL pooled có TLS từ mục **Connect**. Giữ production trên nhánh riêng. [Kết nối Neon](https://neon.com/docs/connect/connect-from-any-app) · [Ảnh Docker PostgreSQL](https://hub.docker.com/_/postgres)

## 2. Cấu hình và chạy

Tạo `.env.local` tại gốc từ `.env.example`. Với Docker ở trên, dùng cấu hình minh họa sau. Với Neon dev, thay `DATABASE_URL` bằng URL của nhánh dev. Biến môi trường local được bỏ qua khi commit.

```dotenv
DATABASE_URL=postgresql://postgres:local_quiz_only@127.0.0.1:5433/quiz
QUIZ_DRAW_PROFILES=[[5,2],[6,3],[7,3],[7,4],[8,3],[8,4],[9,4],[9,5],[10,4],[11,5]]
ROOM_PIN=
```

Điền `ROOM_PIN` bằng đúng 6 ký tự A–Z, a–z hoặc 0–9. Mã phân biệt chữ hoa và chữ thường.

```powershell
npm.cmd ci
npm.cmd run db:migrate
npm.cmd test
npm.cmd run build
npm.cmd run test:integration
npm.cmd run dev
```

Mở `http://localhost:3000`. Nếu kiểm thử trên điện thoại cùng mạng, chạy `npm.cmd run dev -- --hostname 0.0.0.0` và truy cập địa chỉ LAN của máy. Có thể dùng `npm.cmd start` để mở bản đã build.

## 3. Các luồng cần xác nhận

| Luồng | Kết quả mong đợi |
| --- | --- |
| Mở đầu, Hướng dẫn | Hai nút xuất hiện sau hoạt ảnh mèo. Xem lại hoặc đóng từng bài hướng dẫn được. Bắt đầu ván thật vẫn còn đủ lượt. |
| Câu hỏi | Có đúng 10 câu. 50/50 bỏ hai đáp án sai, dùng tối đa một lần mỗi câu. Trả lời sai chốt 0 và đánh dấu câu đã chơi. |
| Rút và dừng | Trả lời đúng mở màn mặt sau và điểm 0. Rút thay lá hiện tại. Dừng cộng đúng điểm tạm một lần. |
| Rút bom | Bài kiểm thử dùng cặp 9 điểm và 5 lượt an toàn. Năm lá điểm có tổng 9, lá thứ sáu là bom. Bom bình thường chốt 0. Gỡ Bom đang bật chốt 9 và tiêu đúng một lượt. |
| Gỡ Bom và Xem Trước | Bật rồi dừng vẫn giữ lượt Gỡ Bom. Hủy xác nhận Xem Trước giữ lượt, xác nhận trừ một lượt. Lật đúng lá đã xem sau khi tải lại. |
| Chốt Gấp Đôi | Với 8 điểm tạm, chốt 16 và kết thúc câu, kể cả khi trần rút bài là 9. |
| Tranh chấp và dữ liệu trả về | Hai yêu cầu rút có cùng phiên bản chỉ làm lật một lá. Kiểm tra payload và bundle phía trình duyệt để xác nhận cấu hình riêng, trần và dãy lá chưa lật không được gửi xuống. |
| Kết quả và chơi lại | Hoàn tất 10 câu, đối chiếu tổng với điểm từng câu, tải lại và kiểm tra cùng kết quả. Chơi lại có đủ lượt phép và dãy bài mới. |
| PIN và bảng xếp hạng | PIN sai bị từ chối. Vào bằng tên riêng và PIN đúng, hoàn tất một ván để lưu kỷ lục. Về trang chủ, mở bảng xếp hạng và chơi một ván có điểm thấp hơn để xác nhận kỷ lục giữ nguyên. |
| Giờ hoàn thành | Kiểm tra cột Hoàn thành hiển thị giờ Việt Nam. Chọn Lọc theo giờ để xem điểm cao nhất trong các ván hoàn thành đúng hoặc trước mốc. |
| Điện thoại | Đọc được tiếng Việt, không cuộn ngang, bấm được các nút và xem được bốn hoạt ảnh. |

Nhóm duyệt bản local trước khi kết nối GitHub với Vercel và cấu hình Neon production. Đặt URL production, 10 cặp thật và một PIN riêng sáu ký tự trong biến môi trường của Vercel, áp dụng migration cho đúng cơ sở dữ liệu và kiểm tra một ván qua link Vercel trước khi gửi lớp.

Khi cần đổi PIN production, sửa `ROOM_PIN` trong **Vercel → Project → Settings → Environment Variables**, chọn **Production** rồi redeploy. PIN mới áp dụng cho lượt vào phòng mới. [Quản lý biến môi trường trên Vercel](https://vercel.com/docs/environment-variables/managing-environment-variables)
