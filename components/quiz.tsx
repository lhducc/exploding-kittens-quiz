"use client";

import { useEffect, useRef, useState } from "react";
import type { GameAction, GameView, JoinAction, Outcome, PlayerView } from "../lib/game-view";
import { letters } from "../lib/game-view";
import { GameCard } from "./game-card";
import { GameDialog } from "./game-dialog";
import { Leaderboard } from "./leaderboard";
import { SpellArt, SpellButton } from "./spell-art";
import { SpellGuide } from "./spell-guide";

type Reply = { game?: GameView | null; player?: PlayerView | null; error?: string };

const outcomes: Record<Outcome, string> = {
  wrong: "Chưa đúng rồi!",
  stopped: "Đã chốt điểm!",
  bomb: "BÙM! Trúng bom!",
  defused: "Gỡ bom thành công!",
  doubled: "Đã chốt gấp đôi!",
};

export function Quiz() {
  const [game, setGame] = useState<GameView | null>(null);
  const [player, setPlayer] = useState<PlayerView | null>(null);
  const [showHome, setShowHome] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [pending, setPending] = useState(false);
  const [synced, setSynced] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"guide" | "peek" | "join" | null>(null);
  const working = useRef(false);
  const initialized = useRef(false);
  const viewHeading = useRef<HTMLHeadingElement>(null);

  async function synchronize() {
    try {
      const response = await fetch("/api/game", { cache: "no-store", signal: AbortSignal.timeout?.(10000) });
      if (!response.ok) throw new Error("Sync failed");
      const body: Reply = await response.json();
      setGame(body.game ?? null);
      setPlayer(body.player ?? null);
      setSynced(true);
      return true;
    } catch {
      setSynced(false);
      setError("Chưa kết nối được. Bấm Thử lại để tiếp tục.");
      return false;
    } finally {
      setReady(true);
    }
  }

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void synchronize();
  }, []);
  useEffect(() => { if (game?.screen && !showRanking) viewHeading.current?.focus(); }, [game?.screen, showHome, showRanking]);

  async function send(action: GameAction | JoinAction) {
    if (working.current || !synced || (action.action !== "join" && !game)) return;
    working.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action.action === "join" ? action : { ...action, expectedVersion: game?.version }),
        signal: AbortSignal.timeout?.(10000),
      });
      const body: Reply = await response.json();
      if (body.game !== undefined) setGame(body.game);
      if (body.player !== undefined) setPlayer(body.player);
      if (response.ok && (action.action === "join" || action.action === "replay")) {
        setModal(null);
        setShowHome(false);
      }
      if ((action.action !== "join" && response.status === 401) || response.status >= 500) await synchronize();
      if (body.error) setError(body.error);
    } catch {
      setSynced(false);
      if (await synchronize()) setError("Đã đồng bộ lại ván. Bạn có thể tiếp tục.");
    } finally {
      working.current = false;
      setPending(false);
    }
  }

  async function retry() {
    if (working.current) return;
    working.current = true;
    setPending(true);
    setError("");
    await synchronize();
    working.current = false;
    setPending(false);
  }

  const disabled = pending || !synced;
  const question = game?.question;
  const draw = game?.draw;
  const feedback = game?.feedback;
  const completed = game?.questions.filter(item => item.points !== null).length ?? 0;
  const continueLabel = completed === 10 ? "Xem kết quả" : "Về bảng câu hỏi";

  return (
    <main className="shell">
      <header className="topbar">
        <span className="brand"><span aria-hidden="true">✦</span> MÈO NỔ <strong>QUIZ</strong></span>
        <span className="course">BẢN THUYẾT TRÌNH <i aria-hidden="true">·</i> MLN131</span>
      </header>

      {error && modal !== "join" && <div className="notice" role="status">
        <span>{error}</span>
        {!synced && <button className="button subtle" disabled={pending} onClick={retry}>Thử lại</button>}
      </div>}

      {(!game || showHome) && !showRanking && <section className={"intro panel" + (player ? " intro-with-player" : "")}>
        <div className="intro-copy">
          <p className="eyebrow"><span aria-hidden="true">✦</span> MINI QUIZ CÁ NHÂN</p>
          <h1 className="hero-title" ref={viewHeading} tabIndex={-1}>MÈO NỔ<span>QUIZ</span></h1>
          <p className="intro-lead">Trả lời đúng. Rút bài. Biết lúc dừng.</p>
          <p className="intro-topic">Quan hệ dân tộc và tôn giáo ở Việt Nam</p>
        </div>
        <div className="intro-art">
          <img src="/cards/intro-cat.svg" width="500" height="430" alt="Mèo vàng bật lên giữa vụ nổ" fetchPriority="high" />
          <span className="art-stamp" aria-hidden="true">CẨN THẬN<br />CÓ BOM!</span>
        </div>
        <div className="intro-actions">
          {player && <p className="player-record"><span>{player.name}</span><strong>Kỷ lục {player.bestScore ?? "—"}</strong></p>}
          <button className="button primary" disabled={disabled} onClick={() => {
            if (game) void send({ action: "replay" });
            else { setError(""); setModal("join"); }
          }}>{game ? "Chơi ván mới" : "Bắt đầu"} <span aria-hidden="true">→</span></button>
          <button className="button secondary" onClick={() => setModal("guide")}>Hướng dẫn</button>
          {player && <button className="button secondary" onClick={() => setShowRanking(true)}>Bảng xếp hạng</button>}
          {!ready && <span role="status" className="loading">Đang mở bàn chơi…</span>}
        </div>
      </section>}

      {game?.screen === "board" && <section className="board panel">
        <div className="screen-top">
          <div>
            <p className="eyebrow">BẢNG CÂU HỎI</p>
            <h1 ref={viewHeading} tabIndex={-1}>Chọn câu của bạn</h1>
            <p className="muted">Chơi theo thứ tự bạn thích.</p>
          </div>
          <div className="total"><span>TỔNG ĐIỂM</span><strong>{game.totalPoints}</strong></div>
        </div>
        <div className="question-grid">
          {game.questions.map(({ id, points }) => <button key={id} className={"question-tile" + (points === null ? "" : " complete")}
            disabled={disabled || points !== null} onClick={() => void send({ action: "select", questionId: id })}
            aria-label={points === null ? "Câu " + id : "Câu " + id + ", đã chốt " + points + " điểm"}>
            <strong>{id}</strong>
            <small>{points === null ? "CHƯA CHƠI" : "✓ " + points + " ĐIỂM"}</small>
          </button>)}
        </div>
        <p className="board-progress">ĐÃ HOÀN THÀNH <strong>{completed}/10</strong> CÂU</p>
      </section>}

      {game && question && <section className="wood panel">
        <div className="screen-heading">
          <p className="eyebrow">PHẦN {question.part} <span aria-hidden="true">·</span> CÂU {question.id}</p>
          <h1 ref={viewHeading} tabIndex={-1}>{question.text}</h1>
        </div>
        <div className="answers">
          {letters.map(letter => {
            const removed = question.removed.includes(letter);
            const state = letter === question.correctChoice ? "right" : letter === question.selected ? "wrong" : removed ? "removed" : "";
            return <button key={letter} className={"answer " + state} disabled={disabled || game.screen !== "question" || removed}
              onClick={() => void send({ action: "answer", choice: letter })}>
              <span className="answer-letter">{letter}</span><span>{question.choices[letter]}</span>
              {state === "right" && <span className="answer-mark">✓<span className="sr-only"> Đáp án đúng</span></span>}
              {state === "wrong" && <span className="answer-mark">×<span className="sr-only"> Đáp án sai</span></span>}
              {state === "removed" && <span className="sr-only"> Đã loại</span>}
            </button>;
          })}
        </div>
        {game.screen === "question" && <div className="question-footer">
          <SpellButton spell="fiftyFifty" count={game.spells.fiftyFifty}
            disabled={disabled || !game.spells.fiftyFifty || question.removed.length > 0}
            onClick={() => void send({ action: "fiftyFifty" })}>Loại Hai Đáp Án (50/50)</SpellButton>
        </div>}
        {game.screen === "correct" && <div className="question-footer">
          <p role="status">Chính xác! Bạn được rút bài.</p>
          <button className="button primary" disabled={disabled} onClick={() => void send({ action: "enterDraw" })}>Rút bài <span aria-hidden="true">→</span></button>
        </div>}
        {feedback && <div className="question-footer">
          <p role="status">{outcomes[feedback.outcome]} <strong>0 điểm</strong></p>
          <button className="button primary" disabled={disabled} onClick={() => void send({ action: "continue" })}>{continueLabel}</button>
        </div>}
      </section>}

      {game && draw && <section className="wood panel">
        <div className="screen-heading">
          <p className="eyebrow">BÀN RÚT BÀI</p>
          <h1 ref={viewHeading} tabIndex={-1}>{feedback ? outcomes[feedback.outcome] : "Rút hay dừng?"}</h1>
        </div>
        <div className="draw-table">
          <div className="card-stage">
            <GameCard card={draw.current} className={"playing-card " + (draw.current === "bomb" ? "bomb-card" : draw.current === null ? "face-down" : "")}
              key={String(draw.current) + "-" + draw.points} />
          </div>
          <div className="draw-score" aria-live="polite">
            <span>{feedback ? "ĐIỂM ĐÃ CHỐT" : "ĐIỂM TẠM"}</span>
            <strong>{feedback?.points ?? draw.points}</strong>
            <small>{feedback ? "CỦA CÂU NÀY" : "CHƯA CỘNG VÀO TỔNG"}</small>
          </div>
        </div>
        {draw.preview !== null && <div className="preview" role="status">
          <GameCard card={draw.preview} />
          <div><strong>XEM TRƯỚC</strong><p>{draw.preview === "bomb" ? "Lá tiếp theo là bom." : "Lá tiếp theo cộng " + draw.preview + " điểm."}</p></div>
        </div>}
        <div className="draw-actions">
          {feedback
            ? <button className="button primary" disabled={disabled} onClick={() => void send({ action: "continue" })}>{continueLabel}</button>
            : <>
              <button className="button primary" disabled={disabled} onClick={() => void send({ action: "draw" })}>{draw.current === null ? "Rút lá bài" : "Rút tiếp"} <span aria-hidden="true">→</span></button>
              <button className="button secondary" disabled={disabled} onClick={() => void send({ action: "stop" })}>Dừng</button>
            </>}
        </div>
        {!feedback && <div className="spell-row" aria-label="Bài phép khi rút điểm">
          <SpellButton spell="defuse" count={game.spells.defuse} pressed={draw.defuseOn} disabled={disabled || !game.spells.defuse}
            onClick={() => void send({ action: "toggleDefuse" })}>Gỡ Bom{draw.defuseOn && <small>Đang bật</small>}</SpellButton>
          <SpellButton spell="peek" count={game.spells.peek} disabled={disabled || !game.spells.peek || draw.preview !== null}
            onClick={() => setModal("peek")}>Xem Trước</SpellButton>
          <SpellButton spell="double" count={game.spells.double} disabled={disabled || !game.spells.double || draw.points === 0}
            onClick={() => void send({ action: "double" })}>Chốt Gấp Đôi</SpellButton>
        </div>}
      </section>}

      {game?.screen === "results" && !showHome && !showRanking && <section className="results panel">
        <p className="eyebrow">ĐÃ HOÀN THÀNH 10/10 CÂU</p>
        <h1 ref={viewHeading} tabIndex={-1}>Kết quả</h1>
        <div className="final-score"><span>TỔNG ĐIỂM CẢ VÁN</span><strong>{game.totalPoints}</strong><span>ĐIỂM</span></div>
        {player && player.bestScore !== null && <p className="result-best">Kỷ lục của bạn <strong>{player.bestScore} điểm</strong></p>}
        <div className="result-actions">
          <button className="button primary" disabled={disabled} onClick={() => void send({ action: "replay" })}>Chơi lại <span aria-hidden="true">↻</span></button>
          <button className="button secondary" onClick={() => setShowHome(true)}>Về trang chủ</button>
          <button className="button secondary" onClick={() => setShowRanking(true)}>Bảng xếp hạng</button>
        </div>
      </section>}

      {showRanking && player && <Leaderboard player={player} close={() => { setShowRanking(false); setShowHome(true); }} />}

      {modal === "join" && <GameDialog title="Vào phòng chơi" close={() => { if (!pending) { setError(""); setModal(null); } }}>
        <form className="join-form" onSubmit={event => {
          event.preventDefault();
          const values = new FormData(event.currentTarget);
          void send({ action: "join", name: String(values.get("name")), pin: String(values.get("pin")) });
        }}>
          <p className="muted">Tên bạn chọn sẽ hiện trên bảng xếp hạng.</p>
          <label>Tên người chơi<input name="name" placeholder="Ví dụ Minh Anh" autoComplete="nickname" minLength={2} maxLength={24} required /></label>
          <label>PIN phòng<input name="pin" placeholder="6 chữ số" type="password" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="off" required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          {!synced
            ? <button className="button secondary" type="button" disabled={pending} onClick={() => void retry()}>Kết nối lại</button>
            : <button className="button primary" disabled={disabled} type="submit">{pending ? "Đang vào phòng…" : "Vào chơi"}</button>}
        </form>
      </GameDialog>}
      {modal === "guide" && <SpellGuide close={() => setModal(null)} />}
      {modal === "peek" && <GameDialog title="Xem Trước" close={() => setModal(null)}>
        <div className="peek-explanation"><SpellArt spell="peek" /><p className="muted">Dùng 1 lượt để xem lá kế tiếp. Điểm tạm giữ nguyên cho đến khi bạn rút lá.</p></div>
        <div className="dialog-actions">
          <button className="button secondary" onClick={() => setModal(null)}>Hủy</button>
          <button className="button primary" disabled={disabled} onClick={() => {
            setModal(null);
            void send({ action: "peek" });
          }}>Xác nhận</button>
        </div>
      </GameDialog>}

      <footer className="footer"><span>CHỦ NGHĨA MÁC – LÊNIN</span><span aria-hidden="true">✦</span><span>MLN131</span></footer>
    </main>
  );
}
