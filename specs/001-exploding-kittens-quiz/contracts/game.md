# Hợp đồng giao diện và API

## Dữ liệu phiên

- `GET /api/game` đọc phiên theo cookie. Trả `{ game, player }`, với `player` gồm tên và điểm cao nhất. Các trường có giá trị `null` trước khi vào phòng. `GET /api/game?rank=1` chỉ cho phiên đã vào phòng và trả tối đa năm hàng mỗi trang. Mỗi hàng có `completedAt` theo UTC. Tham số tùy chọn `through` nhận ngày và giờ Việt Nam, bao gồm cả giây được chọn.
- `POST /api/game` nhận JSON cùng origin. `{ action: "join", name, pin }` xác nhận PIN và tạo hoặc khôi phục ván theo phiên. Các hành động sau đó gửi `action` và `expectedVersion` cùng tham số đã nêu trong bảng. Mã phiên chỉ đi qua cookie `HttpOnly`, `SameSite=Lax`, `Path=/` và `Secure` khi dùng HTTPS.
- Các phản hồi phiên dùng `Cache-Control: no-store`. Mỗi yêu cầu ghi được xác thực theo phiên, màn hiện tại, loại thao tác, tham số và lượt phép. Giá trị điểm hoặc số lượt do client gửi bị từ chối.

| Hành động | Dữ liệu thêm | Màn hợp lệ và kết quả |
| --- | --- | --- |
| `join` | `name`, `pin` | Mở đầu → nhập tên và PIN để tạo hoặc khôi phục ván |
| `select` | `questionId` | Bảng chọn → mở câu chưa chơi |
| `fiftyFifty` | — | Câu hỏi → loại hai đáp án sai, tối đa một lần mỗi câu |
| `answer` | `choice` trong A–D | Câu hỏi → ghi lựa chọn còn khả dụng, trả phản hồi đúng hoặc sai |
| `enterDraw` | — | Phản hồi đúng → mở màn rút |
| `toggleDefuse` | — | Màn rút → bật hoặc tắt nếu còn lượt |
| `peek` | — | Màn rút → xác nhận Xem Trước và ghi nhận lá kế tiếp. Xem lại cùng lá giữ nguyên lượt. |
| `draw` | — | Màn rút → lật đúng một lá và cập nhật điểm hoặc kết thúc câu |
| `stop` | — | Màn rút → chốt điểm tạm |
| `double` | — | Màn rút có điểm tạm dương → chốt hai lần điểm tạm và kết thúc câu |
| `continue` | — | Phản hồi câu → bảng chọn hoặc Kết quả sau câu 10 |
| `replay` | — | Kết quả → bắt đầu ván mới với phiên bản tiếp tục tăng |

## Bản chiếu công khai

`game` có `version`, `screen`, `totalPoints`, trạng thái và điểm đã chốt của 10 ô câu cùng số lượt của bốn bài phép. Theo màn, game có thể kèm nội dung câu và các lựa chọn bị loại, phản hồi đáp án, lá hiện tại, điểm tạm, trạng thái Gỡ Bom, lá đã xem trước hợp lệ hoặc phản hồi kết thúc. Lá hiện tại và lá xem trước là hai trường riêng. Sau khi rút, thông tin xem trước được xóa.

Dựng bản chiếu từ danh sách trường cho phép. Các trường riêng như trần điểm, số lượt an toàn, vị trí lá, bộ bài, mã cookie và cấu hình vẫn ở máy chủ. Không dùng số vị trí lá để quyết định khi nào bật tắt nút Rút trên giao diện. Kết quả cho phép chơi lại dựa vào màn và phiên bản mới nhất.

## Lỗi và khôi phục

- `400` cho JSON hoặc tham số sai. `403` cho thao tác khác origin.
- `401` cho PIN sai hoặc yêu cầu cần phiên đã vào phòng. `409` cho tên trùng, phiên bản cũ, hành động không hợp lệ ở màn hiện tại hoặc phép đã hết. Kèm trạng thái công khai mới nhất khi phiên ván còn hợp lệ.
- `429` khi vượt giới hạn thử PIN sai trong một phút.
- `503` cho lỗi lưu hoặc cấu hình khiến ván không thể khởi tạo. Giao diện chỉ hiển thị thông báo chung. Chi tiết lỗi cấu hình đi vào nhật ký máy chủ, không kèm dữ liệu bí mật.
- Khóa nút liên quan khi đang chờ kết quả. Sau timeout hoặc xung đột, đồng bộ bằng trạng thái trả về hoặc GET trước khi cho thao tác mới. Không tự động gửi lại lệnh rút sau timeout.

## Bố cục và hoạt ảnh

- Màn mở đầu và Hướng dẫn dùng hoạt ảnh CSS cùng bộ hình với game. Hướng dẫn chạy bằng dữ liệu minh họa riêng.
- Bố cục điện thoại giữ lá bên trái và điểm tạm bên phải. Các nhãn và nút vẫn đọc được khi ưu tiên giảm chuyển động. Lá bom hoặc phản hồi sai được hiển thị trước khi người chơi chuyển tiếp.
- Sau câu cuối, phản hồi có nút **Xem kết quả** để mở tổng điểm. Màn Kết quả có **Chơi lại**, **Về trang chủ** và **Bảng xếp hạng**.
