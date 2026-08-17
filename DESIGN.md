# Tài liệu thiết kế — "-1 DAYS"

Tài liệu ngắn gọn mô tả kiến trúc kỹ thuật và các quyết định thiết kế của game. Luật gốc:
[`DESCRIPTION.txt`](DESCRIPTION.txt). Nhân vật gốc: `PERSONA.xlsx`. Hướng dẫn chơi cho người
dùng cuối: [`PLAYER_GUIDE.md`](PLAYER_GUIDE.md).

## 1. Kiến trúc tổng quan

Microservice, "server mỏng — client đầy đủ": mọi thứ liên quan giao diện/theme/asset chỉ tồn
tại ở client; các service chỉ trao đổi id + dữ liệu luật chơi thuần túy qua HTTP/WebSocket.

```
                    ┌─────────────┐
   trình duyệt ───► │   gateway   │◄── Socket.IO + REST duy nhất mà client thấy
  (client SPA)      └──────┬──────┘
        │ (REST: login)     │ (REST nội bộ)
        ▼                   ▼
   ┌─────────┐        ┌─────────────┐        ┌────────┐
   │  auth   │        │ matchmaking │───────►│ engine │
   │ (Postgres)       │ (Postgres)  │  tạo    │(memory)│
   └─────────┘        └──────┬──────┘  ván    └────┬───┘
                              │                     │ webhook /internal/notify
                              └──────────►┌─────────▼──┐
                                          │    bots     │  (Random / Rule / Alpha-beta)
                                          └─────────────┘
```

- **engine**: bộ máy luật chơi thuần túy, giữ toàn bộ `GameState` trong bộ nhớ theo `roomId`,
  không phụ thuộc DB. Expose REST: tạo ván, nộp action, lấy "player view" (đã ẩn thông tin theo
  người xem), lấy "summary" (dữ liệu gốc, chỉ dùng nội bộ để ghi lịch sử).
- **matchmaking**: hàng chờ (quick-match), phòng riêng theo mã code, thêm bot vào ghế trống, gọi
  engine để khởi tạo ván khi host bấm Start. Lưu `Room`/`MatchHistory`/`UserStats` vào Postgres.
- **gateway**: nơi duy nhất client kết nối (Socket.IO). Xác thực JWT, chuyển tiếp các sự kiện
  lobby/hành động sang matchmaking/engine, và đẩy `PlayerView` mới nhất cho từng socket khi nhận
  webhook "có thay đổi" từ engine. Không chứa logic luật chơi.
- **bots**: chạy độc lập, không nằm trong engine. Khi engine báo "có thay đổi", bots kiểm tra
  ghế nào của mình đang cần hành động (đến lượt, hoặc có `pendingReaction` đang mở) rồi gọi cùng
  API `POST /games/:roomId/actions` y hệt một client thật — engine không phân biệt được bot với
  người.
- **auth**: xác thực Google OAuth (`google-auth-library`), phát hành JWT ứng dụng
  (`jsonwebtoken`, secret dùng chung với gateway/matchmaking để xác minh không cần gọi mạng).
  Có endpoint `/auth/dev-login` (chỉ bật khi `NODE_ENV !== production`) để test không cần cấu
  hình Google thật.
- **db**: một schema Prisma/Postgres dùng chung cho `auth` (User, UserStats) và `matchmaking`
  (Room, MatchHistory, MatchParticipant). Không service nào khác chạm vào DB.
- **shared**: enum, type, "card catalog" (toàn bộ định nghĩa lá bài — tên, mô tả, subtype,
  điểm), bảng chia Base-role theo số người chơi. Build dạng dual CJS+ESM (`dist/cjs`,
  `dist/esm`) vì `engine chuyên nghiệp` chạy Node/CommonJS còn `client` cần ESM để Vite/Rollup
  tree-shake và tránh phải bundle các gói chỉ dành cho Node (vd. `jsonwebtoken`).

## 2. Mô hình lá bài & việc ẩn thông tin

Mỗi lá là 1 `CardInstance {instanceId, defId, face, location, ownerId}`. `defId` trỏ vào
`CARD_CATALOG` (dữ liệu luật, không có ảnh/asset). Khi engine trả `PlayerView` cho một người
xem cụ thể, mỗi lá được "làm sạch" thành `VisibleCard`:

- Lá của chính bạn (trên tay) → luôn thấy đầy đủ `defId`.
- Lá úp trong PAYLOAD ZONE / SERVER ZONE của người khác → `defId = null`, nhưng vẫn trả
  `revealedType` (BASE_ROLE / PERSONA / ACTION / KIT, và subtype nếu là ACTION) — đây là "mặt
  ngoài" của thẻ, đúng như yêu cầu: **ẩn nội dung chính xác nhưng vẫn thấy loại thẻ**.
- Lá ngửa, lá trong KIT ZONE (trang bị vĩnh viễn), Base-role đã bị lộ, PERSONA (luôn công khai)
  → thấy đầy đủ.

Client dựng mỗi lá thành 1 component 2 mặt (flip CSS 3D), mặt ngoài chỉ vẽ icon loại thẻ theo
theme, mặt trong (khi lật) mới vẽ đầy đủ tên/ảnh/chỉ số. Bấm vào lá đã lộ mặt sẽ mở modal hiển
thị mô tả luật đầy đủ lấy từ `CARD_CATALOG` — thẻ không cần in hết chữ nhưng vẫn tra cứu được.

## 3. Theme (bộ giao diện)

`client/src/theme` định nghĩa `ThemeManifest` (token màu/font + khung + mặt sau lá theo từng
loại) áp dụng qua CSS variables + `data-theme`. Hai theme có sẵn: **Cyber Neon** (tối, neon
xanh/hồng) và **Terminal Mono** (xanh lá trên nền đen, phong cách CRT). Thêm theme thứ 3 chỉ
cần thêm 1 manifest mới — không sửa code component.

## 4. AI Bot — chỗ mở rộng

`services/bots/src/strategies/` có interface `BotStrategy {decideTurnAction, decideReaction}`.

| Level | Trạng thái | Ghi chú |
|---|---|---|
| `RANDOM` | Hoạt động đầy đủ | Chọn ngẫu nhiên có trọng số (ưu tiên phòng thủ khi bị nhắm) |
| `RULE` | Hoạt động đầy đủ | Luôn phòng thủ khi có thể, tấn công người máu thấp nhất |
| `ALPHA_BETA` | **Khung sườn, chưa cài thuật toán** | Hiện delegate sang `RuleBot`. Chỗ cắm minimax/alpha-beta thật sự cần một bản sao (pure/cloneable) của logic resolve trong `engine` để mô phỏng không side-effect — đây là việc còn lại, đã tách sẵn interface để cắm vào không phải sửa chỗ khác. |

Thêm bot mới = thêm 1 file trong `strategies/` + đăng ký vào `STRATEGIES` — không đụng vào
engine hay gateway.

## 5. Các quyết định/diễn giải luật (do luật gốc chưa mô tả hết chi tiết vận hành)

- **THE KERN**: luật gốc mô tả nội dung (2 FLAG + 4 lá đặc biệt) nhưng không mô tả cách tương
  tác. Engine mô phỏng giống hệt cơ chế tấn công SERVER đã được mô tả rõ: Black Hat "tấn công"
  Kern bằng 1 lá ATTACK ngửa, mở cửa sổ phản ứng (DEFEND/DENY), nếu không bị chặn thì rút lá trên
  cùng của chồng Kern (đã xáo lúc setup) — FLAG thì Black Hat thắng ngay, lá khác thì được nhận
  vào tay để dùng sau.
- **Audit**: mô hình hoá bằng 1 cờ `is_audit` trên người chơi + `lastAuditTargetId` (chống nhắm
  lại người vừa audit lượt trước), thay vì di chuyển vật lý lá "Audit" — lá Audit vẫn nằm im
  trong tay INSPECTOR như một thẻ nhắc, không có tác dụng cơ học riêng ngoài việc đánh dấu họ có
  năng lực Audit.
- **Năng lượng**: hồi đầy về mức tối đa (theo PERSONA) vào đầu mỗi lượt của người chơi đó.
- **Tính điểm khi GIẢI MÃ (theo người chơi)**: tổng điểm ATTACK có hiệu lực (điểm > TECH LEVEL)
  so với tổng DEFEND — thua thì trừ đúng 1 Máu (theo đúng chữ trong luật gốc), không lũy theo
  chênh lệch. Bob/Alice đảo vai trò ATTACK↔DEFEND ngay tại bước này trước khi tính tổng.
  **SERVER CHECK** (cuối round) dùng công thức khác — đếm SỐ LÁ (ATTACK hiệu lực trừ DEFEND, floor
  0) — đúng theo luật gốc, không phải tổng điểm.
- **Tấn công ngửa tức thời**: chỉ RÚT ĐIỆN (DENY) chặn được tấn công vào SERVER (đúng luật gốc);
  với người chơi, cả DEFEND lẫn DENY đều chặn được (dung hòa 2 đoạn mô tả có vẻ mâu thuẫn trong
  luật gốc — một đoạn chỉ nhắc RÚT ĐIỆN, đoạn khác của chính lá DEFEND lại nói nó chặn được tấn
  công "trong lượt của người bị tấn công").
- **BITCOIN**: luật gốc chỉ có 1 dòng ("mua 1 lượt ra tù") nhưng không có cơ chế "giam/tù" nào
  khác được định nghĩa. Diễn giải: dùng để tự gỡ trạng thái `is_audit` sớm (giúp lá này có tác
  dụng thật thay vì vô nghĩa).
- **PHISHING**: luật không nói người chơi bị nhắm được chọn lá nào bị lấy — engine lấy ngẫu
  nhiên 1 lá từ tay nạn nhân để tránh phải thêm 1 bước lựa chọn tương tác riêng.
- **ZERODAY/RANSOMWARE**: người chơi tự chọn lá cụ thể trên bàn (`targetCardInstanceId`) để cướp/
  huỷ — client cần cho phép người chơi bấm chọn 1 lá bất kỳ đang hiển thị (kể cả lá úp, vì chỉ
  cần biết vị trí, không cần biết nội dung) trước khi xác nhận hành động.
- Không giới hạn số người thắng đồng thời theo phe; nếu Black Hat và White Hat cùng bị xoá sổ
  trong cùng 1 sự kiện, Insider thắng (điều kiện đặc thù hơn được ưu tiên). Có thêm luật "người
  sống sót cuối cùng thắng theo phe của họ" để đảm bảo ván luôn kết thúc kể cả bàn 2-3 người.
- **Phòng thủ cho SERVER**: luật gốc mô tả công thức tổng kết SERVER CHECK là `MAX(số ATTACK hiệu
  lực - số DEFEND, 0)` nhưng chỉ mô tả rõ cách ATTACK vào được "array của server" (qua tấn công
  úp), không nói rõ DEFEND vào bằng cách nào. Diễn giải: cho phép chơi DEFEND úp nhắm vào SERVER
  (đối xứng với ATTACK úp) để công thức trừ-DEFEND thực sự có ý nghĩa, thay vì DEFEND luôn = 0.

## 6. Không dùng ảnh thật / không có rủi ro bản quyền

Ảnh nhân vật (persona) sinh 1 lần qua `scripts/generate-assets.mjs` bằng DiceBear (miễn phí,
không cần key, license cho phép dùng thương mại), lưu thành SVG cục bộ — không gọi mạng lúc
runtime. Toàn bộ icon khung thẻ/loại lá/THE KERN/SERVER là SVG tự vẽ (flat style), vừa an toàn
bản quyền vừa dễ đổi theo từng theme.

## 7. Kiểm thử bot-vs-bot

Chạy 20 ván bot-vs-bot tự động (Random + Rule, không qua matchmaking/DB — gọi thẳng `engine` +
`bots`), trải đều số người chơi 2–8, để lộ ra và sửa các lỗi sau:

- **Bug thật đã sửa**: DEFEND không thể queue vào SERVER (xem mục 5 ở trên — công thức SERVER
  CHECK trừ-DEFEND trước đó luôn nhận DEFEND=0, vô hiệu hoá 1 nửa công thức). Bot service crash
  toàn bộ tiến trình nếu gặp `botLevel` không hợp lệ thay vì chỉ lỗi 1 ghế — thêm fallback về
  `RANDOM` + log cảnh báo. Bot chưa từng thử tấn công THE KERN (Black Hat không theo đuổi điều
  kiện thắng thật của phe mình) — thêm hành vi chủ động tấn công Kern cho cả 2 loại bot.
- **Không phải bug, là quan sát cân bằng**: 5/20 ván (25%) kết thúc nhanh (2–33 vòng) khi Black
  Hat rush THE KERN thành công; 15/20 ván không hội tụ trong 25 giây mô phỏng (hàng trăm đến
  hàng nghìn vòng) vì thắng-bằng-tiêu-hao (loại hết Black Hat/White Hat) hội tụ rất chậm — phần
  lớn ATTACK bị vô hiệu do điểm ≤ TECH LEVEL mục tiêu, và mỗi đòn trúng chỉ trừ đúng 1 Máu theo
  luật gốc. Đây là đặc tính cân bằng của bộ luật gốc (Máu 3–5, phần lớn ATTACK giá trị thấp so
  với TECH LEVEL phổ biến 3–5), không phải lỗi engine — không tự ý chỉnh nếu chưa được yêu cầu,
  chỉ ghi nhận ở đây để cân nhắc sau (vd. tăng sát thương hiệu lực, hoặc giảm ngưỡng TECH LEVEL).
- Toàn bộ 20 ván (kể cả 15 ván timeout) không có bất kỳ crash/lỗi 500 nào ở `engine` lẫn `bots`
  trên mọi số người chơi 2–8 — xác nhận vòng lặp pha (DRAW→...→END_TURN→SERVER CHECK→round mới),
  hệ thống phản ứng (DEFEND/DENY), và toàn bộ năng lực persona đã kích hoạt đúng vẫn ổn định qua
  hàng nghìn vòng liên tục.

## 8. Việc còn để ngỏ (future work)

- Alpha-beta bot: cần một bản mô phỏng luật thuần (không I/O) để search cây nước đi.
- Reconnect sau khi service `engine` restart: hiện state chỉ ở RAM, mất khi restart — cần Redis
  hoặc snapshot định kỳ nếu muốn chạy nhiều instance / chịu được restart.
- Chọn lá cụ thể khi bị PHISHING/ZERODAY nhắm (hiện tự động/ngẫu nhiên).
