import React from "react";
import { useNavigate } from "react-router-dom";
import {
  BASE_ROLE_DISTRIBUTION,
  CARD_CATALOG,
  CardType,
  DRAW_PILE_COMPOSITION,
  KERN_STACK_DEF_IDS,
  PERSONA_CATALOG,
  getCardDef,
} from "@minus1days/shared";
import { baseRoleLabel } from "../lib/cardHelpers";
import { getBaseRoleIcon } from "../assets/cards/icons";
import "./Rules.css";

const drawPileCount: Record<string, number> = {};
for (const e of DRAW_PILE_COMPOSITION) drawPileCount[e.defId] = e.count;

const actionCards = CARD_CATALOG.filter((c) => c.type === CardType.ACTION && drawPileCount[c.id]);
const kitCards = CARD_CATALOG.filter((c) => c.type === CardType.KIT && drawPileCount[c.id]);

export const RulesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="rules-page">
      <header className="rules-page__header">
        <h1>Luật chơi — -1 DAYS</h1>
        <button className="btn" onClick={() => navigate(-1)}>
          Quay lại
        </button>
      </header>

      <section className="rules-section">
        <h2>1. Tổng quan</h2>
        <p>
          <strong>-1 DAYS</strong> là board game chủ đề an ninh mạng cho 2-8 người chơi, cơ chế lấy cảm hứng từ BANG!
          nhưng luật riêng. Mỗi người có một <strong>Base Role</strong> (vai trò ẩn) và một <strong>PERSONA</strong>{" "}
          (nhân cách, luôn công khai) quyết định chỉ số và năng lực đặc biệt. Ván đấu xoay quanh việc bảo vệ/tấn công{" "}
          <strong>SERVER</strong> và <strong>THE KERN</strong> ở giữa bàn.
        </p>
        <table className="rules-table">
          <thead>
            <tr>
              <th>Vai trò</th>
              <th>Điều kiện thắng</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="rules-role-cell">
                <RoleIcon role="INSPECTOR" /> Thanh tra (INSPECTOR)
              </td>
              <td>Thắng cùng White Hat.</td>
            </tr>
            <tr>
              <td className="rules-role-cell">
                <RoleIcon role="WHITEHAT" /> White Hat
              </td>
              <td>Toàn bộ Black Hat bị hạ gục (404).</td>
            </tr>
            <tr>
              <td className="rules-role-cell">
                <RoleIcon role="BLACKHAT" /> Black Hat
              </td>
              <td>Lấy được 1 trong 2 lá FLAG trong THE KERN.</td>
            </tr>
            <tr>
              <td className="rules-role-cell">
                <RoleIcon role="INSIDER" /> Insider (Gián điệp)
              </td>
              <td>Toàn bộ White Hat + Black Hat bị hạ gục (không tính Inspector).</td>
            </tr>
          </tbody>
        </table>
        <p className="rules-note">Số lượng Base Role chia theo số người chơi:</p>
        <table className="rules-table rules-table--compact">
          <thead>
            <tr>
              <th>Số người</th>
              <th>Phân bổ vai trò</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(BASE_ROLE_DISTRIBUTION).map(([n, roles]) => (
              <tr key={n}>
                <td>{n}</td>
                <td>{roles.map((r) => baseRoleLabel(r)).join(" · ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rules-section">
        <h2>2. Chỉ số nhân vật</h2>
        <ul className="rules-list">
          <li>
            <strong>HP (Máu)</strong>: về 0 → hạ gục, trạng thái chuyển thành <code>404</code>.
          </li>
          <li>
            <strong>Energy (Năng lượng)</strong>: giới hạn số hành động mỗi lượt — mỗi ACTION tốn 1 Năng lượng, không
            giới hạn số lần tấn công miễn còn năng lượng.
          </li>
          <li>
            <strong>TECH LEVEL (Công nghệ)</strong>: một lá ATTACK chỉ có hiệu lực nếu điểm của nó lớn hơn TECH LEVEL
            của mục tiêu.
          </li>
          <li>
            <strong>is_audit</strong>: đang bị Thanh tra theo dõi — không thể hành động ÚP trong lượt này.
          </li>
        </ul>
      </section>

      <section className="rules-section">
        <h2>3. PERSONA</h2>
        <div className="rules-table-scroll">
          <table className="rules-table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Title</th>
                <th>HP</th>
                <th>Năng lượng</th>
                <th>Tech Level</th>
                <th>Năng lực</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(PERSONA_CATALOG).map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    <div className="rules-quote">&ldquo;{p.quote}&rdquo;</div>
                  </td>
                  <td>{p.title}</td>
                  <td>{p.hp}</td>
                  <td>{p.energy}</td>
                  <td>{p.techLevel}</td>
                  <td>{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rules-section">
        <h2>4. Loại lá bài</h2>
        <p>
          Mỗi lượt có hai cách thao tác: <strong>ÚP (HTTPS)</strong> — lá chưa có hiệu lực cho tới pha GIẢI MÃ, hoặc{" "}
          <strong>NGỬA (HTTP)</strong> — có hiệu lực ngay trừ khi bị RÚT ĐIỆN (DENY) vô hiệu hóa.
        </p>

        <h3>ACTION (112 lá)</h3>
        <div className="rules-table-scroll">
          <table className="rules-table rules-table--compact">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Điểm</th>
                <th>Số lượng</th>
                <th>Hiệu ứng</th>
              </tr>
            </thead>
            <tbody>
              {actionCards.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.value ?? "—"}</td>
                  <td>{drawPileCount[c.id]}</td>
                  <td>{c.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>KIT (18 lá — trang bị vĩnh viễn)</h3>
        <div className="rules-table-scroll">
          <table className="rules-table rules-table--compact">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Số lượng</th>
                <th>Hiệu ứng</th>
              </tr>
            </thead>
            <tbody>
              {kitCards.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{drawPileCount[c.id]}</td>
                  <td>{c.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rules-section">
        <h2>5. THE KERN &amp; SERVER</h2>
        <p>
          <strong>SERVER</strong> có HP riêng và một khu vực chứa các lá tấn công úp chờ xử lý. Tấn công ngửa vào
          SERVER mở ra cửa sổ phản ứng RÚT ĐIỆN; nếu không ai chặn, SERVER mất 1 Máu.
        </p>
        <p>
          <strong>THE KERN</strong> là mục tiêu tối thượng của Black Hat: một chồng 6 lá được xáo ngẫu nhiên, gồm:
        </p>
        <ul className="rules-list">
          {KERN_STACK_DEF_IDS.map((id) => {
            const def = getCardDef(id);
            return (
              <li key={id}>
                <strong>{def.name}</strong> — {def.description}
              </li>
            );
          })}
        </ul>
        <p className="rules-note">
          Nếu Black Hat lấy được 1 trong 2 lá FLAG khi tấn công THE KERN thành công → Black Hat thắng ngay lập tức.
        </p>
      </section>

      <section className="rules-section">
        <h2>6. Tiến trình một ROUND</h2>
        <p>Bắt đầu từ 1 người bất kỳ (hoặc bên trái Inspector), đánh theo chiều bên trái — Inspector luôn đi cuối.</p>
        <ol className="rules-phase-list">
          <li>
            <strong>BỐC BÀI</strong>: nếu số bài trên tay &lt; Năng lượng tối đa → bốc thêm 2 lá.
          </li>
          <li>
            <strong>CHUẨN BỊ</strong>: có thể chơi ACTION tác động lên chính mình (−1 Năng lượng/lần).
          </li>
          <li>
            <strong>GIẢI MÃ</strong>: lật toàn bộ lá úp trước mặt. Tổng DEFEND ≥ tổng ATTACK có hiệu lực → an toàn;
            ngược lại −1 Máu. Hạ gục khi Máu = 0.
          </li>
          <li>
            <strong>RÚT LÁ AUDIT</strong> (chỉ pha Inspector): thu hồi Audit khỏi mục tiêu lượt trước.
          </li>
          <li>
            <strong>HÀNH ĐỘNG</strong>: chơi ACTION lên bản thân, người khác, hoặc SERVER (−1 Năng lượng/lần). Hết
            năng lượng thì không thể hành động thêm. Bị Audit thì không được hành động úp.
          </li>
          <li>
            <strong>NHẬN THƯỞNG</strong>: hạ gục SERVER hoặc một người chơi khác sẽ mang lại phần thưởng tương ứng.
          </li>
          <li>
            <strong>BỎ BÀI</strong>: chủ động bỏ bớt bài trên tay (không bắt buộc).
          </li>
          <li>
            <strong>HẾT LƯỢT</strong> → sang người tiếp theo.
          </li>
        </ol>
        <p>
          Khi hết vòng người chơi cuối cùng, diễn ra <strong>SERVER CHECK</strong>: xáo các lá úp trong PAYLOAD ZONE,
          giải mã đồng loạt, trừ Máu SERVER theo chênh lệch ATTACK/DEFEND có hiệu lực, rồi trang bị các lá NÂNG CẤP.
        </p>
      </section>

      <section className="rules-section">
        <h2>7. Ghi chú</h2>
        <ul className="rules-list">
          <li>Năng lượng giới hạn hành động, không giới hạn số lần tấn công trong 1 pha.</li>
          <li>Không giới hạn số lá trên tay, nhưng nếu số lá &gt; năng lượng hiện có thì không được bốc thêm.</li>
          <li>Khi chồng bài bốc hết, toàn bộ lá từ chồng bài "used" được xáo lại thành chồng bài bốc mới.</li>
        </ul>
      </section>
    </div>
  );
};

const RoleIcon: React.FC<{ role: "INSPECTOR" | "WHITEHAT" | "BLACKHAT" | "INSIDER" }> = ({ role }) => {
  const Icon = getBaseRoleIcon(role as any);
  return <Icon className="rules-role-icon" />;
};
