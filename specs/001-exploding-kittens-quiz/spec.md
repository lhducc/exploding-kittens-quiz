# Đặc tả tính năng Mèo Nổ Quiz

**Nhánh hiện tại** `main`  
**Ngày tạo** 2026-11-07  
**Trạng thái** Bản nháp đã rà soát  
**Đầu vào** Mini quiz cá nhân cho bài thuyết trình môn Chủ nghĩa Mác – Lênin về quan hệ dân tộc và tôn giáo ở Việt Nam.

## Kịch bản người dùng và kiểm thử

### Câu chuyện 1. Trả lời câu hỏi và quyết định khi nào dừng (P1)

Là người chơi, mình muốn chọn một trong 10 câu hỏi và tự cân nhắc rút thêm hay chốt điểm khi trả lời đúng.

**Lý do ưu tiên** Đây là vòng chơi chính, từ kiểm tra kiến thức đến quyết định chấp nhận rủi ro.

**Kiểm thử độc lập** Bắt đầu ván, trả lời sai một câu, trả lời đúng một câu để chốt điểm, rồi thử rút đến bom ở một câu khác.

1. Khi bắt đầu ván mới, người chơi thấy 10 ô đánh số 01–10 và có thể chọn câu chưa chơi theo thứ tự tùy ý. Mỗi câu có bốn đáp án A–D.
2. Khi chọn sai, game đánh dấu đáp án đúng, ghi 0 điểm, khóa câu trong ván và cho quay về bảng câu hỏi.
3. Khi chọn đúng, người chơi có thể vào màn rút bài. Ban đầu hiện mặt sau lá bài và điểm tạm 0. Nếu rút được `+3` rồi `+2`, lá `+2` thay lá `+3` và điểm tạm thành 5. Bấm **Dừng** thì chốt 5 điểm.
4. Với cấu hình thử 9 điểm và 5 lượt an toàn, đúng 5 lá điểm cộng thành 9. Nếu rút lá thứ sáu khi Gỡ Bom chưa bật, game lật bom và chốt câu này 0 điểm. Điểm các câu trước giữ nguyên.
5. Khi một câu kết thúc, bảng câu hỏi đánh dấu câu đó đã chơi và hiển thị số điểm đã chốt.

### Câu chuyện 2. Dùng bài phép và xem hướng dẫn (P2)

Là người chơi, mình muốn hiểu cách dùng bốn bài phép và chọn thời điểm dùng các lượt có hạn.

**Lý do ưu tiên** Bài phép tạo lựa chọn ở cả màn câu hỏi và màn rút điểm.

**Kiểm thử độc lập** Mở hướng dẫn, xem đủ bốn hoạt ảnh rồi dùng từng bài phép trong ván thật và kiểm tra bộ đếm lượt.

1. Từ màn mở đầu, bấm **Hướng dẫn** để xem bốn hoạt ảnh mô phỏng. Người chơi tự bấm qua từng thao tác, xem lại, đổi lá hoặc đóng hướng dẫn. Ván thật bắt đầu với đủ lượt phép.
2. Trước khi chọn đáp án, dùng **Loại Hai Đáp Án (50/50)** để vô hiệu hóa hai đáp án sai và trừ một trong hai lượt dùng.
3. Trong màn rút bài, bấm **Gỡ Bom** để bật hoặc tắt ngay. Lá điểm rút khi đang bật giữ nguyên lượt phép. Khi chặn bom thành công, game lật lá bom, chốt điểm tạm, kết thúc câu và trừ lượt Gỡ Bom.
4. Bấm **Xem Trước** rồi **Xác nhận** để trừ một lượt và thấy chính xác lá kế tiếp với nhãn **Xem trước**. Điểm tạm và lá hiện tại giữ nguyên. Bấm **Rút** thì lật đúng lá vừa xem.
5. Với điểm tạm 8, dùng **Chốt Gấp Đôi** thì chốt 16 và kết thúc câu. Trần điểm rút bài chỉ áp dụng khi chia các lá điểm thường.

### Câu chuyện 3. Tiếp tục ván, xem kết quả và chơi lại (P3)

Là người chơi, mình muốn tiếp tục ván nếu tải lại trang, xem tổng điểm sau câu cuối và có thể bắt đầu ván mới trong thời gian nhóm cho phép tính điểm.

**Lý do ưu tiên** Ván đang chơi giữ được tiến độ và mỗi ván mới vẫn có cảm giác bất ngờ.

**Kiểm thử độc lập** Tải lại giữa màn rút, hoàn tất 10 câu, tải lại ở màn kết quả rồi chơi ván mới.

1. Tải lại trang trong màn rút khôi phục câu đang chơi, lá hiện tại, điểm tạm, lượt phép còn lại, trạng thái Gỡ Bom và lá đã xem trước nếu có. Lá tiếp theo giữ nguyên.
2. Khi hoàn tất câu thứ mười, màn **Kết quả** hiện tổng điểm đã chốt của cả ván. Mở lại trong cùng phiên trình duyệt có dữ liệu ván đã lưu thì hiện lại kết quả.
3. Khi bấm **Chơi lại**, game bắt đầu ván mới với 10 câu chưa chơi, tổng điểm 0, đủ lượt bài phép và bộ bài được tạo lại.
4. Từ **Kết quả**, người chơi có thể về trang chủ, mở bảng xếp hạng hoặc chơi ván mới. Trang chủ và Kết quả hiển thị kỷ lục cá nhân. Chơi một ván điểm thấp hơn giữ nguyên kỷ lục.

### Câu chuyện 4. Vào phòng và xem bảng xếp hạng (P2)

1. Người chơi nhập tên hiển thị và PIN phòng gồm sáu ký tự A–Z, a–z hoặc 0–9 để vào chơi. PIN phân biệt chữ hoa và chữ thường. PIN sai hoặc tên trùng sẽ hiện thông báo để sửa. Quá nhiều lần nhập PIN sai bị giới hạn tạm thời.
2. Sau khi hoàn tất đủ 10 câu, game lưu điểm và thời gian máy chủ ghi nhận ván. Bảng xếp hạng hiển thị một hàng mỗi người, sắp theo điểm cao nhất, rồi theo thời điểm đạt điểm đó. Người chơi trong phòng có thể lật trang danh sách và lọc lấy điểm cao nhất hoàn thành đúng hoặc trước mốc giờ Việt Nam đã chọn.

### Trường hợp biên

- Nếu bấm **Dừng** khi chưa rút lá điểm nào, game chốt 0 điểm. **Chốt Gấp Đôi** khả dụng khi điểm tạm lớn hơn 0.
- Nếu kết thúc câu khi Gỡ Bom đang bật và chưa gặp bom, game tắt trạng thái bật, giữ lại lượt phép cho câu sau.
- Nếu hủy xác nhận **Xem Trước**, lượt phép giữ nguyên. Sau khi đã xem một lá, kết quả xem trước vẫn có thể đọc lại cho đến khi rút, với một lần trừ lượt cho lá đó.
- Nếu đã dùng 50/50 trong câu hiện tại, game giữ hai lựa chọn còn lại cho đến khi câu được trả lời. Mỗi câu dùng tối đa một lượt 50/50.
- Nếu thao tác bị gửi lặp hoặc hai thao tác đến cùng lúc, game chỉ ghi nhận mỗi hành động hợp lệ một lần theo trạng thái ván. Tổng điểm, kết quả câu và số lượt phép phải nhất quán.
- Nếu lỗi kết nối xảy ra khi thực hiện một thao tác, game thông báo và khôi phục trạng thái đã lưu gần nhất để người chơi tiếp tục an toàn.
- Nếu một cặp điểm và lượt an toàn không thể ghép từ các lá hợp lệ, ví dụ 9 điểm trong 2 lượt, nhóm soạn game nhận lỗi cấu hình trước khi mở ván.

## Yêu cầu

### Yêu cầu chức năng

- **FR-001** Game chạy trên trình duyệt qua một đường link chia sẻ, ưu tiên bố cục dọc trên điện thoại. Toàn bộ nhãn, thông báo và hướng dẫn dùng tiếng Việt.
- **FR-002** Màn mở đầu có tên game lớn, nền đỏ cam và hoạt ảnh mèo nổ ngắn, sau đó hiện **Bắt đầu** và **Hướng dẫn**. Bảng chọn câu dùng các ô màu than viền đậm trên nền đỏ. Màn câu hỏi và rút bài dùng nền gỗ nâu, bảng tiêu đề đỏ và chữ tương phản.
- **FR-003** Ván gồm 10 câu đã duyệt ở phụ lục, chia đều cho hai phần nội dung. Mỗi câu có bốn lựa chọn và một đáp án đúng. Người chơi chọn câu chưa chơi theo thứ tự tùy ý và trả lời tối đa một lần mỗi ván. Chọn sai chốt 0 điểm. Chọn đúng mở quyền rút bài.
- **FR-004** Mỗi ván dùng đủ 10 cặp cấu hình đã được nhóm chuẩn bị, mỗi cặp gồm trần điểm và số lượt rút an toàn. Khi tạo ván, game xáo cách gán các cặp vào 10 câu, giữ nguyên tổng trần điểm toàn ván. Với mỗi câu, game tạo ngẫu nhiên một dãy lá từ `+1`, `+2`, `+3`, `+5` sao cho số lá an toàn và tổng điểm khớp đúng cấu hình. Lá ngay sau dãy an toàn là bom.
- **FR-005** Màn rút đặt lá bài bên trái và điểm tạm của câu bên phải. Lá bài bắt đầu úp, sau đó lật và thay bằng lá vừa rút. Trần điểm, số lượt an toàn, số lượt đã rút và danh sách các lá đã rút được giữ ngoài giao diện. Bảng chọn câu và màn Kết quả hiển thị tổng điểm cả ván.
- **FR-006** Bấm **Dừng** để chốt điểm tạm. Bốc bom khi Gỡ Bom chưa bật chốt 0 điểm cho câu hiện tại. Câu đã chốt chỉ được cộng vào tổng một lần.
- **FR-007** Mỗi ván có hai lượt **Loại Hai Đáp Án (50/50)**. Mỗi lần dùng hợp lệ vô hiệu hóa hai đáp án sai trước khi người chơi chọn đáp án.
- **FR-008** Mỗi ván có một lượt **Gỡ Bom**. Nút bật và tắt trực tiếp trong màn rút, có nhãn **Đang bật** khi được chọn. Game chỉ tiêu lượt khi Gỡ Bom chặn bom và lập tức chốt điểm tạm để kết thúc câu.
- **FR-009** Mỗi ván có ba lượt **Xem Trước**. Game yêu cầu xác nhận trước khi tiêu lượt và chỉ hiển thị đúng lá kế tiếp. Khi rút, người chơi nhận lá đã xem. Xem trước giữ nguyên điểm tạm và vị trí trong bộ bài.
- **FR-010** Mỗi ván có một lượt **Chốt Gấp Đôi**. Dùng bài phép chốt đúng hai lần điểm tạm và kết thúc câu ngay, kể cả khi điểm chốt vượt trần rút bài.
- **FR-011** Hướng dẫn có bốn hoạt ảnh tiếng Việt theo từng thao tác. Người chơi tự chuyển bước, đổi lá, xem lại hoặc đóng hướng dẫn. Các lá phép có hình riêng và dùng dữ liệu minh họa độc lập với ván.
- **FR-012** Cấu hình điểm, thứ tự lá chưa lật và trạng thái tính điểm có thẩm quyền được giữ phía máy chủ. Dữ liệu trả về cho người chơi chỉ tiết lộ lá đã rút và lá kế tiếp khi có lượt Xem Trước hợp lệ. Máy chủ xác thực thứ tự thao tác, kiểm tra lượt phép và tự tính điểm. Đáp án không thuộc dữ liệu cần giữ kín.
- **FR-013** Game lưu tiến độ và kết quả của ván hiện tại để khôi phục khi người chơi mở lại trong cùng trình duyệt còn giữ dữ liệu phiên. Hoàn tất 10 câu thì hiện tổng điểm cả ván và nút **Chơi lại**. Người chơi được bắt đầu ván mới nhiều lần.
- **FR-014** Nhóm tổ chức công bố và canh thời gian ngoài đời, chỉ tính kết quả theo mốc giờ đã công bố. Nhóm kiểm thử bản chạy local trước khi phát hành đường link cho lớp.
- **FR-015** Game yêu cầu tên và PIN phòng trước khi vào chơi. Máy chủ giữ kín PIN, giới hạn lần nhập sai và gắn tên cùng kỷ lục với phiên trình duyệt. Bảng xếp hạng chỉ cho người đã vào phòng xem.
- **FR-016** Trang chủ và Kết quả có lối vào bảng xếp hạng. Kết quả có nút về trang chủ. Chỉ ván đủ 10 câu mới cập nhật kỷ lục. Bảng xếp hạng phân trang để giữ nội dung vừa màn hình.

### Thực thể chính

- **Câu hỏi** Số thứ tự, phần nội dung, câu hỏi, bốn lựa chọn và đáp án đúng.
- **Cấu hình rút bài** Trần điểm và số lượt an toàn, được gán lại vào một câu mỗi ván.
- **Bộ bài của câu** Dãy lá điểm an toàn và lá bom, cùng vị trí lá hiện tại.
- **Ván chơi** Tiến độ qua 10 câu, điểm từng câu, điểm tạm, tổng điểm và số lượt bài phép.
- **Kết quả ván** Tổng điểm chốt từ 10 câu đã kết thúc.

## Tiêu chí thành công

### Kết quả đo được

- **SC-001** Trong một lượt kiểm thử trên điện thoại, người chơi mở được link, chọn một trong 10 câu, trả lời và điều hướng giữa các màn bằng nút hiển thị mà không cần cuộn ngang.
- **SC-002** Với cấu hình kiểm thử 9 điểm và 5 lượt, năm lá đầu cộng đúng 9, lá thứ sáu là bom và điểm chốt phản ánh chính xác ba lựa chọn đã kiểm thử là dừng trước bom, trúng bom và chặn bom bằng Gỡ Bom.
- **SC-003** Bốn hoạt ảnh và bốn bài phép trong ván thật thể hiện đúng cơ chế. Một ván mới bắt đầu với bộ đếm lần lượt là 2, 1, 3 và 1.
- **SC-004** Khi kiểm thử nhiều ván mới, 10 cặp được gán lại giữa các câu nhưng tổng trần điểm giữ nguyên. Trong mỗi ván, dữ liệu người chơi nhận trước khi rút hoặc xem trước hợp lệ không tiết lộ các lá chưa lật hay cấu hình rút bài.
- **SC-005** Sau khi tải lại giữa màn rút, người chơi tiếp tục từ đúng trạng thái đã lưu. Sau câu thứ mười, tổng điểm bằng tổng 10 điểm đã chốt. Chơi lại tạo một ván độc lập với tổng điểm 0 và đủ lượt bài phép.
- **SC-006** Trước khi phát hành, nhóm có thể kiểm thử local một ván từ màn mở đầu đến Kết quả, gồm trả lời sai, chốt điểm, trúng bom và dùng đủ bốn loại bài phép.
- **SC-007** PIN sai không mở ván. PIN đúng với tên chưa dùng mở được ván. Sau một ván đủ 10 câu và một ván có điểm thấp hơn, bảng xếp hạng chỉ có một kết quả cho người chơi và giữ điểm cao nhất.

## Giả định

- **Mèo Nổ Quiz** là tên làm việc. Nhóm có thể chốt tên hiển thị khi duyệt giao diện.
- Nhóm cung cấp hoặc duyệt hình cho mặt sau lá bài, các lá `+1`, `+2`, `+3`, `+5` và lá bom. Các ảnh slide đã gửi là tài liệu tham khảo giao diện.
- Nhóm có thể chốt 10 cặp điểm và lượt an toàn trong giai đoạn lập kế hoạch. Các cặp ví dụ dùng để minh họa và kiểm thử, không ấn định cặp thật cho câu nào.
- Ván chơi cá nhân dùng phiên trình duyệt và cần kết nối mạng. Việc đối chiếu kết quả trong giờ chơi do nhóm thực hiện.

## Phụ lục. Bộ câu hỏi đã duyệt

### Phần I. Đặc điểm quan hệ dân tộc và tôn giáo ở Việt Nam

1. **Quan hệ dân tộc và tôn giáo được hiểu là gì?**
   - A. Quan hệ mua bán giữa các địa phương
   - B. Sự tác động qua lại giữa dân tộc và tôn giáo trong đời sống xã hội
   - C. Sự giao lưu giữa các quốc gia trong lĩnh vực thể thao
   - D. Quan hệ giữa các thành viên trong một gia đình
2. **Quan hệ dân tộc và tôn giáo ở Việt Nam được củng cố trên cơ sở nào?**
   - A. Sự phát triển riêng của từng tôn giáo
   - B. Sự phân chia cộng đồng theo vùng cư trú
   - C. Sự giống nhau về tín ngưỡng của mọi người dân
   - D. Cộng đồng quốc gia – dân tộc thống nhất
3. **Tín ngưỡng truyền thống nào được nêu ở cấp độ gia đình?**
   - A. Thờ cúng tổ tiên
   - B. Thờ cúng Thành hoàng làng
   - C. Thờ cúng Hùng Vương
   - D. Thờ cúng thần làng
4. **Theo nội dung bài thuyết trình, tín ngưỡng thờ cúng Hùng Vương thể hiện điều gì?**
   - A. Lòng biết ơn đối với người dạy nghề cho một làng
   - B. Sự gắn kết giữa các thành viên trong một dòng họ
   - C. Sự đoàn kết của cộng đồng và tinh thần hướng về cội nguồn chung
   - D. Sự gắn bó của người dân với nghề truyền thống
5. **Các hiện tượng tôn giáo mới phát triển mạnh trong bối cảnh nào?**
   - A. Thời kỳ dựng nước
   - B. Thời kỳ Đổi mới, phát triển kinh tế thị trường và hội nhập quốc tế
   - C. Thời kỳ hình thành các làng nghề truyền thống
   - D. Thời kỳ kháng chiến chống Pháp

### Phần II. Hướng giải quyết mối quan hệ dân tộc và tôn giáo ở Việt Nam hiện nay

6. **Nhiệm vụ nào được xác định là có tính chiến lược, cơ bản, lâu dài và cấp bách?**
   - A. Củng cố khối đại đoàn kết toàn dân tộc và đoàn kết tôn giáo
   - B. Tổ chức các lễ hội theo cùng một hình thức
   - C. Tập trung bảo tồn các công trình tôn giáo
   - D. Ưu tiên phát triển một tín ngưỡng chung
7. **Theo bài thuyết trình, cần phát huy những giá trị nào?**
   - A. Chỉ các giá trị kinh tế của hoạt động lễ hội
   - B. Chỉ các giá trị văn hóa du nhập từ bên ngoài
   - C. Chỉ các giá trị của những cộng đồng đông dân
   - D. Các giá trị văn hóa truyền thống tốt đẹp của các dân tộc và các giá trị đạo đức, văn hóa của tôn giáo
8. **Những ai cần được tập hợp để cùng xây dựng và bảo vệ Tổ quốc?**
   - A. Chỉ đồng bào theo tôn giáo
   - B. Chỉ đồng bào không theo tôn giáo
   - C. Cả đồng bào theo tôn giáo và đồng bào không theo tôn giáo
   - D. Chỉ đồng bào sống ở vùng có đông người theo tôn giáo
9. **Khi giải quyết mối quan hệ dân tộc và tôn giáo, cần bảo đảm những quyền nào?**
   - A. Chỉ quyền của các dân tộc thiểu số
   - B. Quyền tự do tín ngưỡng, tôn giáo của nhân dân và quyền của các dân tộc thiểu số
   - C. Chỉ quyền của những người theo tôn giáo
   - D. Chỉ quyền của những người không theo tôn giáo
10. **Khi thấy một bài đăng chưa được kiểm chứng về một nhóm dân tộc hoặc tôn giáo, sinh viên nên làm gì?**
    - A. Kiểm tra nguồn tin và tránh chia sẻ khi chưa xác minh
    - B. Chia sẻ ngay để mọi người biết
    - C. Tin bài đăng vì có nhiều lượt thích
    - D. Dùng bài đăng để đánh giá cả cộng đồng

| Câu | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Đáp án | B | D | A | C | B | A | D | C | B | A |
