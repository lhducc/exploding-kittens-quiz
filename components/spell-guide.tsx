"use client";

import { useState } from "react";
import type { Card } from "../lib/game-view";
import { GameCard } from "./game-card";
import { GameDialog } from "./game-dialog";
import { SpellArt } from "./spell-art";
import type { Spell } from "./spell-art";
import style from "./spell-guide.module.css";

const lessons: { spell: Spell; name: string; uses: number; steps: string[]; actions: string[] }[] = [
  { spell: "fiftyFifty", name: "Loại Hai Đáp Án (50/50)", uses: 2,
    steps: ["Dùng phép trước khi chọn đáp án.", "Hai đáp án sai bị loại. Bạn chọn trong hai đáp án còn lại."],
    actions: ["Dùng 50/50"] },
  { spell: "defuse", name: "Gỡ Bom", uses: 1,
    steps: ["Bạn đang có 7 điểm. Bấm Gỡ Bom để bật bảo vệ trước khi rút.",
      "Đang bật, vẫn còn 1 lượt. Phép chỉ bị tiêu khi bạn rút trúng bom.",
      "Bạn rút trúng bom nhưng giữ đủ 7 điểm. Câu kết thúc và phép hết lượt."],
    actions: ["Bật Gỡ Bom", "Rút lá bài"] },
  { spell: "peek", name: "Xem Trước", uses: 3,
    steps: ["Bạn có 0 điểm. Bấm Xem Trước để mở hộp xác nhận.",
      "Bấm Xác nhận để dùng 1 lượt. Lá bài vẫn nằm trong bộ.",
      "Bạn thấy lá +3 trước khi rút. Điểm tạm vẫn là 0.",
      "Bạn đã rút đúng lá +3 vừa xem. Điểm tạm tăng từ 0 lên 3."],
    actions: ["Xem Trước", "Xác nhận", "Rút lá +3"] },
  { spell: "double", name: "Chốt Gấp Đôi", uses: 1,
    steps: ["Bạn đang có 8 điểm. Dùng phép để nhân đôi và kết thúc câu ngay.",
      "8 × 2 = 16 điểm. Điểm này được cộng vào tổng và bạn chuyển sang câu khác."],
    actions: ["Chốt Gấp Đôi"] },
];

function Demonstration({ spell, step }: { spell: Spell; step: number }) {
  if (spell === "fiftyFifty") {
    return <div className={style.choices}>
      {["A. Thờ cúng tổ tiên", "B. Thờ thần làng", "C. Thờ Hùng Vương", "D. Thờ Thành hoàng làng"].map((label, index) =>
        <span key={label} className={step > 0 && (index === 1 || index === 3) ? style.faded : ""}>{label}</span>,
      )}
    </div>;
  }
  const card: Card | null = spell === "defuse" ? (step === 2 ? "bomb" : 2) : spell === "peek" ? (step === 3 ? 3 : null) : 3;
  const points = spell === "defuse" ? 7 : spell === "peek" ? (step === 3 ? 3 : 0) : (step > 0 ? 16 : 8);
  const settled = spell === "defuse" ? step === 2 : spell === "double" && step > 0;
  return <div className={style.draw}>
    <GameCard key={String(card)} card={card} className={style.card} />
    <div className={style.score}>
      <span>{settled ? "ĐIỂM ĐÃ CHỐT" : "ĐIỂM TẠM"}</span>
      <strong key={points}>{points}</strong>
      {spell === "double" && step > 0 && <small>8 × 2</small>}
    </div>
    {spell === "defuse" && <span className={style.tag}>
      {["ĐANG TẮT · 1 LƯỢT", "ĐANG BẬT · 1 LƯỢT", "ĐÃ GỠ BOM · 0 LƯỢT"][step]}
    </span>}
    {spell === "peek" && step === 1 && <span className={style.tag}>DÙNG 1 LƯỢT?</span>}
    {spell === "peek" && step === 2 && <div className={style.preview}><GameCard card={3} /><span>XEM TRƯỚC</span></div>}
  </div>;
}

export function SpellGuide({ close }: { close: () => void }) {
  const [lesson, setLesson] = useState(0);
  const [step, setStep] = useState(0);
  const item = lessons[lesson];
  const action = item.actions[step];

  function changeLesson(next: number) {
    setLesson(next);
    setStep(0);
  }

  return <GameDialog title="Hướng dẫn bài phép" close={close} className={style.guideDialog}>
    <div className={style.lesson}>
      <SpellArt spell={item.spell} />
      <div>
        <p className="eyebrow">LÁ {lesson + 1}/4 · {item.uses} LƯỢT MỖI VÁN</p>
        <h3>{item.name}</h3>
      </div>
    </div>
    <div className={style.demo} aria-live="polite">
      {item.spell === "fiftyFifty" && <p className={style.question}>Tín ngưỡng nào phổ biến ở cấp độ gia đình?</p>}
      <Demonstration key={item.spell} spell={item.spell} step={step} />
      <p className={style.caption}><span>BƯỚC {step + 1}/{item.steps.length}</span>{item.steps[step]}</p>
    </div>
    {action
      ? <button className={"button primary " + style.step} onClick={() => setStep(value => value + 1)}>{action} <span aria-hidden="true">→</span></button>
      : <button className={"button secondary " + style.step} onClick={() => setStep(0)}>Xem lại</button>}
    <div className={style.nav}>
      <button className="button subtle" disabled={lesson === 0} onClick={() => changeLesson(lesson - 1)}>Lá trước</button>
      {lesson < lessons.length - 1
        ? <button className="button subtle" onClick={() => changeLesson(lesson + 1)}>Lá tiếp</button>
        : <button className="button subtle" onClick={close}>Đóng hướng dẫn</button>}
    </div>
  </GameDialog>;
}
