import type { Card } from "../lib/game-view";

export function GameCard({ card, className }: { card: Card | null; className?: string }) {
  const file = card === null ? "back" : card === "bomb" ? "bomb" : "point-" + card;
  const label = card === null ? "Mặt sau lá bài" : card === "bomb" ? "Lá bom" : "Lá cộng " + card + " điểm";
  return <img className={className} src={"/cards/" + file + ".svg"} width="200" height="286" alt={label} />;
}
