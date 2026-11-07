# Nghiên cứu kỹ thuật Mèo Nổ Quiz

## Một ứng dụng cho giao diện và API

**Quyết định** Next.js App Router với TypeScript, CSS thuần và Route Handler chạy trên Node.js 22.x. Khóa phiên bản phụ thuộc bằng npm lockfile.

**Lý do** Ứng dụng và API dùng cùng origin, cùng lệnh chạy local và cùng lần deploy. Node 22 có sẵn trên máy và được Vercel hỗ trợ. Các mô-đun giữ bộ bài được đánh dấu `server-only` và chỉ được gọi từ API. Biến riêng giữ nguyên ở phía máy chủ. [Cài đặt Next.js](https://nextjs.org/docs/app/getting-started/installation) · [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) · [Biến môi trường](https://nextjs.org/docs/app/guides/environment-variables) · [Node.js trên Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)

**Phương án đã cân nhắc** HTML tĩnh cần thêm một API riêng để giữ bộ bài. Tách hai dự án sẽ thêm cấu hình local và deploy.

## Lưu ván và chống gửi trùng

**Quyết định** Dùng `pg` trên Vercel Node.js Functions, kết nối Neon qua URL pooled có TLS và quản lý pool theo hướng dẫn Vercel cho Fluid Compute. Dùng cùng driver với PostgreSQL local. Mỗi phiên có một hàng chứa phiên bản tăng dần và trạng thái JSONB. Đọc, kiểm tra luật, rồi ghi bằng một câu `UPDATE` có điều kiện khớp phiên bản. Chỉ lần ghi thắng được xác nhận. [Kết nối với node-postgres](https://node-postgres.com/features/connecting) · [Pooling trên Neon](https://neon.com/docs/connect/connection-pooling) · [Pooling trên Vercel](https://vercel.com/kb/guide/connection-pooling-with-functions) · [PostgreSQL Read Committed](https://www.postgresql.org/docs/current/transaction-iso.html#XACT-READ-COMMITTED)

**Lý do** Một hàng chứa trọn vẹn điểm, lá hiện tại và lượt phép nên có thể lưu đồng thời bằng một lần ghi. Hai lần bấm từ cùng một trạng thái không thể cùng tăng điểm hay tiêu lượt.

**Phương án đã cân nhắc** Dữ liệu trong bộ nhớ của Function sẽ làm việc phục hồi ván phụ thuộc vào vòng đời tiến trình. Nhiều bảng hoặc ORM chưa đem lại lợi ích cho phạm vi chỉ cần phiên hiện tại.

## Chia bài riêng cho từng ván

**Quyết định** Đọc đúng 10 cặp `[trần điểm, lượt an toàn]` từ `QUIZ_DRAW_PROFILES`. Xáo 10 cặp bằng Fisher–Yates dùng `crypto.randomInt`. Tính trước khả năng ghép theo số điểm và số lá còn lại. Tại mỗi vị trí, chọn ngẫu nhiên một trong các mệnh giá 1, 2, 3, 5 vẫn cho phép phần còn lại đạt đúng tổng, rồi thêm bom ở cuối. Lưu cả dãy ngay khi tạo ván. [Node.js crypto.randomInt](https://nodejs.org/docs/latest-v22.x/api/crypto.html#cryptorandomintmin-max-callback)

**Lý do** Dãy bài luôn thỏa cả hai điều kiện, cùng bộ cặp giữ nguyên tổng trần mỗi ván và việc tải lại giữ nguyên lá tiếp theo. Phương pháp tạo thứ tự ngẫu nhiên trong các lựa chọn hợp lệ tại từng bước. Các thứ tự đầy đủ có thể có xác suất khác nhau.

**Phương án đã cân nhắc** Cố định cặp theo câu cho phép người chơi học vị trí bom qua các ván. Thử chia ngẫu nhiên đến khi đạt tổng gây thời gian chạy khó đoán và không phát hiện tốt cặp bất khả thi.

**Cấu hình local đề xuất** `[[5,2],[6,3],[7,3],[7,4],[8,3],[8,4],[9,4],[9,5],[10,4],[11,5]]`. Cả 10 cặp đã được kiểm tra khả năng ghép. Tổng trần là 80 điểm. Bộ này dành cho local và kiểm thử. Cặp dùng trong buổi chơi sẽ được nhập riêng trên Vercel trước khi deploy.

## Trạng thái mà người chơi nhìn thấy

**Quyết định** Cookie phiên ngẫu nhiên và API cùng origin. API trả dữ liệu chọn lọc cho màn hiện tại, chỉ tiết lộ lá kế tiếp sau khi tiêu lượt Xem Trước hợp lệ. Trạng thái phiên và toàn bộ lá bài được lưu trên máy chủ. Cấu hình thật giữ ngoài Git vì repo công khai. [OWASP về kiểm tra thứ tự thao tác](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html#preventing-out-of-order-api-execution)

**Lý do** Cơ chế bảo vệ bộ bài đang chơi và điểm máy chủ đã chốt. Vì có thể chơi lại, người chơi vẫn có thể suy luận từ những lá đã thấy hoặc tự động hóa các thao tác hợp lệ. Nhóm dùng mốc giờ ngoài đời để công nhận kết quả.

**Phương án đã cân nhắc** Làm rối JavaScript hoặc cất bộ bài trong trình duyệt vẫn phải đưa bí mật xuống thiết bị người chơi.
