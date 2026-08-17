# Hướng dẫn chơi — "-1 DAYS"

Game chủ đề An ninh mạng cho 2–8 người, chơi trên trình duyệt. Mỗi người giữ 1 vai trò bí mật
(White Hat / Black Hat / Insider / Inspector) và phải bảo vệ hoặc tấn công **THE KERN** — nơi
giấu lá FLAG quyết định thắng thua.

## 1. Vào bàn chơi

1. **Đăng nhập**: dùng nút Google, hoặc "Đăng nhập nhanh" (chỉ cần nhập tên) nếu server đang ở
   chế độ thử nghiệm.
2. Chọn 1 trong 2 cách vào bàn:
   - **Tạo bàn riêng**: chọn số người tối đa (2–8), hệ thống cho bạn 1 **mã bàn** để gửi bạn bè.
   - **Xếp hàng chờ (Quick Match)**: vào 1 phòng chờ chung, ai vào sau sẽ tự động được ghép vào
     bàn đang mở, đủ người thì host bấm Bắt đầu.
3. Trong phòng chờ, **host** có thể thêm **AI (bot)** vào các ghế trống — chọn cấp độ Random /
   Rule / Alpha-beta (Alpha-beta hiện dùng chung logic với Rule, xem `DESIGN.md`).
4. Đủ tối thiểu 2 người (kể cả bot), host bấm **Bắt đầu**.

## 2. Vai trò (Base-role)

Vai trò được **úp kín** cho tới khi bạn bị hạ gục (hoặc bị lộ do năng lực khác). Số lượng mỗi
vai trò phụ thuộc số người chơi (bàn càng đông càng nhiều Black Hat/White Hat).

| Vai trò | Thắng khi nào |
|---|---|
| **White Hat** | Toàn bộ Black Hat bị hạ gục (404) |
| **Black Hat** | Lấy được 1 trong 2 lá FLAG trong THE KERN |
| **Inspector** | Không tự chọn, chỉ xuất hiện khi có ≥4 người. Thắng cùng phe White Hat |
| **Insider** (gián điệp) | Toàn bộ White Hat *và* Black Hat bị hạ gục (không tính Inspector) |

Mỗi người còn có 1 **PERSONA** (nhân vật, luôn công khai — vd. Bob, Alice, Turing...) quyết
định Máu / Năng lượng / TECH LEVEL ban đầu và 1 năng lực riêng — bấm vào lá PERSONA của bất kỳ
ai để xem năng lực của họ.

## 3. Chỉ số của bạn

- **HP (Máu)**: về 0 → bạn bị hạ gục, trạng thái chuyển thành `404`.
- **Năng lượng**: mỗi hành động (chơi 1 lá) tốn 1 Năng lượng. Hồi đầy vào đầu lượt của bạn.
  Hết Năng lượng = hết hành động được trong lượt đó.
- **TECH LEVEL**: một lá TẤN CÔNG chỉ có hiệu lực nếu điểm của nó *lớn hơn* TECH LEVEL của bạn —
  TECH LEVEL càng cao, bạn càng "miễn nhiễm" với các đòn tấn công điểm thấp.

## 4. Một lượt chơi diễn ra thế nào

1. **BỐC BÀI**: tự động bốc thêm bài nếu tay bạn đang ít hơn Năng lượng tối đa.
2. **CHUẨN BỊ**: chỉ được chơi bài nhắm vào **bản thân** (vd. úp 1 lá Phòng thủ chờ sẵn, dùng
   Incident Response hồi máu, trang bị KIT...).
3. **GIẢI MÃ**: các lá **úp** người khác đã nhắm vào bạn trong các lượt trước được lật đồng
   thời — nếu tổng Phòng thủ bạn đã chuẩn bị không đủ so với tổng Tấn công có hiệu lực, bạn mất
   1 Máu.
4. **HÀNH ĐỘNG**: chơi bài nhắm vào người khác, **SERVER**, hoặc **THE KERN** — có thể chơi
   **úp** (giấu, chờ đối phương GIẢI MÃ mới lộ) hoặc **ngửa** (có tác dụng ngay, nhưng đối
   phương có vài giây để dùng Phòng thủ/Rút điện chặn lại).
5. **BỎ BÀI**: tuỳ chọn, bỏ bớt bài thừa trên tay.

Riêng **Inspector** có thêm bước chọn 1 người để **Audit** (người bị Audit không được chơi bài
úp trong lượt tới) và bước thu hồi Audit vào đầu lượt kế tiếp.

Hết vòng (mọi người đã chơi xong lượt), tới phiên **SERVER CHECK**: toàn bộ lá đã âm thầm nhắm
vào SERVER trong vòng đó được lật cùng lúc — SERVER mất máu nếu bị tấn công nhiều hơn được
phòng thủ. SERVER về 0 máu → hồi đầy máu, mọi người +2 lá.

## 5. Các loại lá bài

| Loại | Ý nghĩa |
|---|---|
| TẤN CÔNG (1–6) | Gây 1 Máu nếu không bị chặn (điểm càng cao càng dễ vượt TECH LEVEL đối phương) |
| PHÒNG THỦ | Chặn 1 lá tấn công, hoặc gộp vào tổng phòng thủ lúc GIẢI MÃ |
| RÚT ĐIỆN | Vô hiệu hoá hoàn toàn 1 lá tấn công (kể cả tấn công SERVER) |
| LUCKY | Bốc thêm 2 lá |
| PHISHING | Lấy ngẫu nhiên 1 lá của người bị nhắm |
| RANSOMWARE | Huỷ 1 lá bất kỳ trên bàn (trừ Base-role/PERSONA) |
| ZERO-DAY | Cướp 1 lá bất kỳ trên bàn (trừ Base-role/PERSONA) |
| BITCOIN | Dùng để tự gỡ trạng thái bị Audit |
| INCIDENT RESPONSE | +1 Máu |
| KIT: Bò húc | +1 Năng lượng tối đa (vĩnh viễn) |
| KIT: Nâng cấp | +1 TECH LEVEL (vĩnh viễn) |

Bấm vào bất kỳ lá nào đã lộ mặt để xem mô tả đầy đủ — trên mặt lá chỉ hiện tên ngắn và icon để
giữ bàn chơi gọn gàng.

## 6. THE KERN

Một chồng 6 lá bí mật ở giữa bàn (2 lá FLAG + 4 lá đặc biệt: Dân chủ, Vận xui, Siêu nâng cấp,
Quyền năng Caesar), thứ tự đã bị xáo. Black Hat "tấn công" Kern như tấn công SERVER — nếu không
bị Phòng thủ/Rút điện chặn, lá trên cùng được lật: trúng FLAG thì **Black Hat thắng ngay**, trúng
lá khác thì được nhận vào tay để dùng sau.

## 7. Mẹo nhanh

- Bị hạ gục khi **không** đang bị Audit → bài của bạn về chồng bỏ, vai trò bị lộ công khai.
- Bị hạ gục **trực tiếp** bởi 1 người khác (họ tấn công ngửa và bạn không đỡ được) → người đó
  chiếm toàn bộ bài của bạn, kể cả Base-role (nhưng chưa lộ ra ngoài — họ có thể "đội lốt" bạn
  cho tới khi chính họ cũng bị hạ).
- Chọn theme giao diện (góc trên bàn chơi) không ảnh hưởng luật chơi, chỉ đổi hình ảnh.

Chúc may mắn — đừng bao giờ tin ai trong THE KERN.
