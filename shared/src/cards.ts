import { ActionSubtype, CardDef, CardType, KitSubtype, PersonaId } from "./types";

/** Every distinct card DEFINITION in the game (rules data only — no art/copy beyond a short name). */
export const CARD_CATALOG: CardDef[] = [];

function add(def: CardDef) {
  CARD_CATALOG.push(def);
}

// ---- Base roles (one physical slot per seat, not part of the shuffled deck) ----
add({ id: "ROLE_INSPECTOR", type: CardType.BASE_ROLE, name: "INSPECTOR", description: "Thanh tra. Không bốc PERSONA (nhận PERSONA = INSPECTOR). Thắng cùng phe White Hat." });
add({ id: "ROLE_WHITEHAT", type: CardType.BASE_ROLE, name: "WHITE HAT", description: "Thắng khi toàn bộ Black Hat bị hạ gục (404)." });
add({ id: "ROLE_BLACKHAT", type: CardType.BASE_ROLE, name: "BLACK HAT", description: "Thắng khi lấy được FLAG trong THE KERN." });
add({ id: "ROLE_INSIDER", type: CardType.BASE_ROLE, name: "INSIDER", description: "Gián điệp. Thắng khi toàn bộ White Hat + Black Hat bị hạ gục (không tính INSPECTOR)." });

// ---- Personas (one physical slot per seat, INSPECTOR forced for the Inspector base-role) ----
export const PERSONA_CATALOG: Record<PersonaId, CardDef & { hp: number; energy: number; techLevel: number; title: string; quote: string }> = {
  [PersonaId.INSPECTOR]: {
    id: "PERSONA_INSPECTOR", type: CardType.PERSONA, name: "INSPECTOR", hp: 4, energy: 4, techLevel: 3,
    title: "Thanh tra", quote: "Push your hand up",
    description: "Mỗi lượt có thể -1 Năng lượng để AUDIT 1 người chơi khác (không lặp lại người vừa Audit lượt trước). Người bị Audit không được hành động ÚP. Nếu người bị Audit bị hạ gục khi đang bị Audit: mũ trắng → Inspector mất toàn bộ bài trên tay; mũ đen/xám → Inspector nhận toàn bộ bài của người đó.",
  },
  [PersonaId.BOB]: {
    id: "PERSONA_BOB", type: CardType.PERSONA, name: "Bob", hp: 3, energy: 3, techLevel: 5,
    title: "Fresher", quote: "Con báo con",
    description: "Đảo ngược hiệu lực bài úp khi GIẢI MÃ: ATTACK (1-6) → DEFEND, DEFEND → ATTACK (6). Sau đó tính điểm như bình thường.",
  },
  [PersonaId.ALICE]: {
    id: "PERSONA_ALICE", type: CardType.PERSONA, name: "Alice", hp: 4, energy: 3, techLevel: 4,
    title: "Fresher", quote: "Con báo con",
    description: "Đảo ngược hiệu lực bài úp khi GIẢI MÃ: ATTACK (1-6) → DEFEND, DEFEND → ATTACK (6). Sau đó tính điểm như bình thường.",
  },
  [PersonaId.BOOLE]: {
    id: "PERSONA_BOOLE", type: CardType.PERSONA, name: "Boole", hp: 5, energy: 3, techLevel: 3,
    title: "RuleMaker", quote: "AND. OR. NOT",
    description: "Trong pha BỐC BÀI, được đổi 2 lá DEFEND lấy 1 lá ATTACK, hoặc 2 lá ATTACK lấy 1 lá DEFEND.",
  },
  [PersonaId.TURING]: {
    id: "PERSONA_TURING", type: CardType.PERSONA, name: "Turing", hp: 4, energy: 4, techLevel: 3,
    title: "Codebreaker", quote: "We can only see a short distance ahead",
    description: "-1 Năng lượng để nhìn trộm 1 lá úp bất kỳ của mình ở pha GIẢI MÃ.",
  },
  [PersonaId.LOVELACE]: {
    id: "PERSONA_LOVELACE", type: CardType.PERSONA, name: "Lovelace", hp: 5, energy: 3, techLevel: 4,
    title: "Programmer", quote: "Poetical science",
    description: "Khi mất Máu, bốc thêm 2 lá ngay lập tức.",
  },
  [PersonaId.KEVIN]: {
    id: "PERSONA_KEVIN", type: CardType.PERSONA, name: "Kevin", hp: 4, energy: 3, techLevel: 4,
    title: "Ex-Hacker", quote: "No system is perfect.",
    description: "Tấn công ngửa của Kevin gây -2 Máu (thay vì -1) nếu không bị chặn.",
  },
  [PersonaId.HELLMAN]: {
    id: "PERSONA_HELLMAN", type: CardType.PERSONA, name: "Hellman", hp: 4, energy: 4, techLevel: 4,
    title: "Cryptographer", quote: "Don't be afraid of appearing foolish",
    description: "Tặng người khác 1 lá bài thì +1 Năng lượng.",
  },
  [PersonaId.EVE]: {
    id: "PERSONA_EVE", type: CardType.PERSONA, name: "Eve", hp: 4, energy: 4, techLevel: 3,
    title: "Man in the Middle", quote: "Trust no one",
    description: "-2 Máu để chuyển 1 lá úp của mình cho người khác.",
  },
};
Object.values(PERSONA_CATALOG).forEach((p) => add(p));

// ---- Action cards (48 ATTACK + 32 DEFEND + 8 DENY + 4x6 specials = 112) ----
interface DeckEntry { id: string; count: number; def: CardDef }
export const DECK_ENTRIES: DeckEntry[] = [];

for (let v = 1; v <= 6; v++) {
  const id = `ATTACK_${v}`;
  const def: CardDef = { id, type: CardType.ACTION, subtype: ActionSubtype.ATTACK, name: `Tấn công ${v}`, value: v, description: `Lá TẤN CÔNG điểm ${v}. Nếu không bị chặn, -1 Máu đối tượng bị tấn công (chỉ có hiệu lực nếu điểm > TECH LEVEL của mục tiêu).` };
  add(def);
  DECK_ENTRIES.push({ id, count: 8, def });
}
{
  const def: CardDef = { id: "DEFEND", type: CardType.ACTION, subtype: ActionSubtype.DEFEND, name: "Phòng thủ", value: 1, description: "Chặn 1 lá TẤN CÔNG bất kỳ điểm trong lượt của người bị tấn công. Nếu không ra lá này khi bị tấn công thì bị trừ điểm." };
  add(def);
  DECK_ENTRIES.push({ id: def.id, count: 32, def });
}
{
  const def: CardDef = { id: "DENY", type: CardType.ACTION, subtype: ActionSubtype.DENY, name: "Rút điện", value: 0, description: "Chặn mọi lá úp trong phiên GIẢI MÃ nếu dùng trước khi lật. Chặn tấn công cho 1 người khác. Chặn tấn công cho SERVER trong mọi trường hợp." };
  add(def);
  DECK_ENTRIES.push({ id: def.id, count: 8, def });
}
{
  const def: CardDef = { id: "LUCKY", type: CardType.ACTION, subtype: ActionSubtype.LUCKY, name: "Lucky", description: "Rút thêm 2 lá từ chồng bài bốc." };
  add(def);
  DECK_ENTRIES.push({ id: def.id, count: 4, def });
}
{
  const def: CardDef = { id: "PHISHING", type: CardType.ACTION, subtype: ActionSubtype.PHISHING, name: "Phishing", description: "Yêu cầu 1 người chơi khác đưa cho bạn 1 lá bài của họ." };
  add(def);
  DECK_ENTRIES.push({ id: def.id, count: 4, def });
}
{
  const def: CardDef = { id: "RANSOMWARE", type: CardType.ACTION, subtype: ActionSubtype.RANSOMWARE, name: "Ransomware", description: "Hủy 1 lá bất kỳ trên bàn, trừ Base-role và PERSONA." };
  add(def);
  DECK_ENTRIES.push({ id: def.id, count: 4, def });
}
{
  const def: CardDef = { id: "ZERODAY", type: CardType.ACTION, subtype: ActionSubtype.ZERODAY, name: "Zero-day", description: "Cướp 1 lá bất kỳ trên bàn, trừ Base-role và PERSONA." };
  add(def);
  DECK_ENTRIES.push({ id: def.id, count: 4, def });
}
{
  const def: CardDef = { id: "BITCOIN", type: CardType.ACTION, subtype: ActionSubtype.BITCOIN, name: "Bitcoin", description: "Mua 1 lượt để thoát trạng thái bị giam/bỏ lượt." };
  add(def);
  DECK_ENTRIES.push({ id: def.id, count: 4, def });
}
{
  const def: CardDef = { id: "INCIDENT_RESPONSE", type: CardType.ACTION, subtype: ActionSubtype.INCIDENT_RESPONSE, name: "Incident Response", description: "+1 Máu." };
  add(def);
  DECK_ENTRIES.push({ id: def.id, count: 4, def });
}

// ---- Kit cards (2 Bo huc + 16 Nang cap = 18) ----
{
  const def: CardDef = { id: "ENERGY_DRINK", type: CardType.KIT, subtype: KitSubtype.ENERGY_DRINK, name: "Bò húc", description: "Trang bị vĩnh viễn: +1 Năng lượng tối đa." };
  add(def);
  DECK_ENTRIES.push({ id: def.id, count: 2, def });
}
{
  const def: CardDef = { id: "UPGRADE", type: CardType.KIT, subtype: KitSubtype.UPGRADE, name: "Nâng cấp", description: "Trang bị vĩnh viễn: +1 TECH LEVEL." };
  add(def);
  DECK_ENTRIES.push({ id: def.id, count: 16, def });
}

/** Flat draw-pile composition (112 action + 18 kit = 130 cards) — engine expands this with instance ids and shuffles. */
export const DRAW_PILE_COMPOSITION: { defId: string; count: number }[] = DECK_ENTRIES.map((e) => ({ defId: e.id, count: e.count }));

// ---- THE KERN (6-card shared objective stack) ----
add({ id: "FLAG_PRIMARY", type: CardType.FLAG, name: "FLAG", description: "Black Hat lấy được lá này → Black Hat THẮNG ngay lập tức." });
add({ id: "FLAG_BACKUP", type: CardType.FLAG, name: "FLAG (Back-up)", description: "Black Hat lấy được lá này → Black Hat THẮNG ngay lập tức. Hiệu ứng đặc biệt khi bị lấy: 'Đừng lưu back up trong server'." });
add({ id: "KERN_COERCE", type: CardType.ACTION, subtype: ActionSubtype.KERN_COERCE, name: "Dân chủ", description: "Uy hiếp 1 người được chọn: hoặc cướp 2 lá bất kỳ của họ (kể cả KIT, trừ Base-role/PERSONA), hoặc lật 1 lá bất kỳ của họ (kể cả Base-role)." });
add({ id: "KERN_BAD_LUCK", type: CardType.ACTION, subtype: ActionSubtype.KERN_BAD_LUCK, name: "Vận xui", description: "-2 lá trên tay người nhận; nếu không đủ lá thì trừ tiếp vào lượt sau." });
add({ id: "KERN_SUPER_UPGRADE", type: CardType.KIT, subtype: KitSubtype.KERN_SUPER_UPGRADE, name: "Siêu nâng cấp", description: "Nâng TECH LEVEL của bản thân lên mức tối đa ngay lập tức." });
add({ id: "KERN_CAESAR", type: CardType.ACTION, subtype: ActionSubtype.KERN_CAESAR, name: "Quyền năng của Caesar", description: "Tung xúc xắc: cả bàn chuyền bài cho người bên trái theo số lượng bằng số xúc xắc." });

export const KERN_STACK_DEF_IDS: string[] = ["FLAG_PRIMARY", "FLAG_BACKUP", "KERN_COERCE", "KERN_BAD_LUCK", "KERN_SUPER_UPGRADE", "KERN_CAESAR"];

// ---- Unique tokens (not part of any shuffled deck) ----
add({ id: "AUDIT_TOKEN", type: CardType.TOKEN, name: "Audit", description: "Được INSPECTOR đặt lên 1 người chơi (-1 Năng lượng, is_audit=True). INSPECTOR thu hồi vào đầu lượt kế tiếp của mình (is_audit=False)." });

export function getCardDef(defId: string): CardDef {
  const def = CARD_CATALOG.find((c) => c.id === defId);
  if (!def) throw new Error(`Unknown card def id: ${defId}`);
  return def;
}
