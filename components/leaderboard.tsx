"use client";

import { useEffect, useRef, useState } from "react";
import type { PlayerView, Ranking } from "../lib/game-view";
import { GameDialog } from "./game-dialog";

const vietnamTime = { timeZone: "Asia/Ho_Chi_Minh" };
const dateFormat = new Intl.DateTimeFormat("vi-VN", { ...vietnamTime, day: "2-digit", month: "2-digit", year: "numeric" });
const clockFormat = new Intl.DateTimeFormat("vi-VN", { ...vietnamTime, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });

export function Leaderboard({ player, close }: { player: PlayerView; close: () => void }) {
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<Ranking | null>(null);
  const [error, setError] = useState(false);
  const [through, setThrough] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const query = new URLSearchParams({ rank: String(page) });
        if (through) query.set("through", through);
        const response = await fetch("/api/game?" + query, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("Ranking unavailable");
        const body: { ranking: Ranking } = await response.json();
        if (!controller.signal.aborted) setResult(body.ranking);
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    }
    void load();
    return () => controller.abort();
  }, [page, retry, through]);

  function changePage(next: number) {
    setResult(null);
    setError(false);
    setPage(next);
  }

  function applyFilter(next: string) {
    if (next !== through) {
      changePage(1);
      setThrough(next);
    }
    setShowFilter(false);
  }

  const [cutoffDay, cutoffClock] = through.split("T");
  const cutoffLabel = through ? cutoffClock + " " + cutoffDay.split("-").reverse().join("/") : "";

  return <section className="ranking panel">
    <div className="screen-top">
      <div>
        <p className="eyebrow">{through ? "TÍNH ĐẾN " + cutoffLabel : "ĐIỂM CAO NHẤT MỖI NGƯỜI"}</p>
        <h1 ref={heading} tabIndex={-1}>Bảng xếp hạng</h1>
      </div>
      <div className="total"><span>KỶ LỤC CỦA BẠN</span><strong>{player.bestScore ?? "—"}</strong></div>
    </div>
    <div className="ranking-body">
      {error && <div className="ranking-message" role="status">Chưa tải được bảng xếp hạng.
        <button className="button subtle" onClick={() => { setError(false); setRetry(value => value + 1); }}>Thử lại</button>
      </div>}
      {!result && !error && <p className="ranking-message" role="status">Đang tải điểm…</p>}
      {result?.rows.length === 0 && <p className="ranking-message">{through
        ? "Chưa có kết quả hợp lệ trên trang này theo mốc đã chọn."
        : "Chưa có kết quả ở trang này. Hoàn thành 10 câu để ghi điểm lên bảng."}</p>}
      {result && result.rows.length > 0 && <table className="ranking-list">
        <thead><tr><th scope="col">Hạng</th><th scope="col">Người chơi</th><th scope="col">Điểm</th><th scope="col">Hoàn thành</th></tr></thead>
        <tbody>{result.rows.map(row => {
          const completed = new Date(row.completedAt);
          return <tr key={row.name} className={row.name === player.name ? "own-rank" : ""}>
            <td className="rank-number">#{row.rank}</td>
            <td className="rank-name">{row.name}{row.name === player.name && <small> BẠN</small>}</td>
            <td className="rank-score">{row.score}</td>
            <td><time dateTime={row.completedAt} className="rank-time" title="Giờ Việt Nam">
              <strong>{clockFormat.format(completed)}</strong><small>{dateFormat.format(completed)}</small>
            </time></td>
          </tr>;
        })}</tbody>
      </table>}
    </div>
    {(page > 1 || result?.hasMore) && <div className="ranking-pages" aria-label="Trang xếp hạng">
      <button className="button subtle" disabled={page === 1} onClick={() => changePage(page - 1)}>Trước</button>
      <span>Trang {page}</span>
      <button className="button subtle" disabled={!result?.hasMore} onClick={() => changePage(page + 1)}>Sau</button>
    </div>}
    <div className="ranking-actions">
      <button className="button secondary" onClick={close}>Về trang chủ</button>
      <button className="button secondary" onClick={() => setShowFilter(true)}>Lọc theo giờ</button>
    </div>
    {showFilter && <GameDialog title="Tính đến giờ" close={() => setShowFilter(false)}>
      <form className="join-form" onSubmit={event => {
        event.preventDefault();
        applyFilter(String(new FormData(event.currentTarget).get("through")));
      }}>
        <p className="muted">Chọn mốc theo giờ Việt Nam (UTC+7). Bảng lấy điểm cao nhất của từng người từ các ván hoàn thành đúng hoặc trước mốc này.</p>
        <label>Ngày và giờ chốt<input type="datetime-local" name="through" step="1" defaultValue={through} required /></label>
        <div className="ranking-actions">
          {through && <button className="button secondary" type="button" onClick={() => applyFilter("")}>Bỏ lọc</button>}
          <button className="button primary" type="submit">Áp dụng</button>
        </div>
      </form>
    </GameDialog>}
  </section>;
}
