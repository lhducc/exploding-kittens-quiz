# Mô hình dữ liệu

## Nội dung và cấu hình

| Thực thể | Trường | Ràng buộc |
| --- | --- | --- |
| Câu hỏi | ID 01–10, phần I hoặc II, câu hỏi, bốn lựa chọn, đáp án đúng | Dữ liệu cố định theo đặc tả. Mỗi phần có 5 câu. |
| Cặp rút bài | `cap`, `safeDraws` | Có đúng 10 cặp. Giá trị nguyên dương và ghép được từ 1, 2, 3, 5. Giới hạn cấu hình 20 lá an toàn mỗi câu. |
| Bộ bài đã chia | Mảng lá điểm và lá bom | Có `safeDraws` lá điểm với tổng bằng `cap`, theo sau là đúng một lá bom. Gán và lưu tại thời điểm tạo ván. |

## Lưu ván

Bảng `game_sessions` có `session_key_hash` làm khóa chính, `version` là số nguyên tăng sau mỗi lần ghi, `state` kiểu JSONB và `updated_at`. Mỗi phiên trình duyệt giữ ván hiện tại, tên hiển thị, khóa tên duy nhất sau chuẩn hóa, `best_score` và `best_at`. **Chơi lại** thay trạng thái ván trong cùng hàng và tiếp tục tăng phiên bản, giữ kỷ lục. Điểm kỷ lục được cập nhật cùng lần ghi chốt câu cuối nếu tổng điểm cao hơn. Bảng `quiz_pin_attempts` lưu bộ đếm sai PIN theo dấu băm của địa chỉ trong cửa sổ một phút.

Bảng `quiz_results` lưu điểm và thời điểm hoàn thành của mỗi ván. Khóa là cặp phiên và phiên bản của lần chốt câu cuối. Bảng xếp hạng chọn điểm cao nhất của mỗi phiên trong các ván hợp lệ theo mốc giờ, ưu tiên ván hoàn thành trước nếu điểm bằng nhau. Dữ liệu trước khi có bảng này chỉ chuyển được kỷ lục có thời gian đã ghi nhận.

Trạng thái riêng gồm:

- Màn hiện tại, ID câu đang chơi và 10 trạng thái câu.
- Với mỗi câu, cặp cấu hình, bộ bài, đáp án đã chọn nếu có và điểm đã chốt nếu câu đã kết thúc.
- Với câu đang rút, vị trí lá, lá hiện tại, điểm tạm, lá được xem trước nếu có và cờ Gỡ Bom.
- Lượt phép còn lại, khởi tạo lần lượt 2, 1, 3, 1. 50/50 lưu hai đáp án sai đã bị loại cho câu hiện tại.
- Phản hồi kết thúc câu gồm lý do kết thúc và điểm đã chốt, đủ để hiển thị bom hoặc đáp án đúng trước khi tiếp tục. Tổng điểm được tính từ các điểm đã chốt, mỗi câu đóng góp một lần.

Cookie chứa mã phiên ngẫu nhiên 32 byte. Máy chủ tra phiên bằng SHA-256 của mã đó. Trình duyệt nhận bản chiếu đã lọc, xem [hợp đồng API](contracts/game.md).

## Chuyển trạng thái

| Từ | Thao tác | Đến |
| --- | --- | --- |
| Mở đầu | Bắt đầu | Bảng chọn câu |
| Bảng chọn | Chọn câu chưa chơi | Câu hỏi |
| Câu hỏi | 50/50 | Câu hỏi với hai đáp án còn lại |
| Câu hỏi | Trả lời sai | Phản hồi câu, chốt 0 |
| Câu hỏi | Trả lời đúng | Phản hồi đúng, chờ nút Rút bài |
| Phản hồi đúng | Rút bài | Màn rút, mặt sau và 0 điểm tạm |
| Màn rút | Bật/tắt Gỡ Bom hoặc xác nhận Xem Trước | Màn rút, cập nhật phép hoặc lá xem trước |
| Màn rút | Rút lá điểm | Màn rút, tăng điểm tạm và tiến đúng một lá |
| Màn rút | Rút bom, Dừng hoặc Chốt Gấp Đôi | Phản hồi câu với điểm đã chốt |
| Phản hồi câu | Tiếp tục | Bảng chọn, hoặc Kết quả nếu đủ 10 câu |
| Kết quả | Chơi lại | Bảng chọn của ván mới |

Ván đã lưu khôi phục màn tương ứng. Nếu ván đã đến màn Kết quả, mở lại đường link sẽ khôi phục Kết quả. Lượt phép mới có hiệu lực sau khi lần ghi thành công.
