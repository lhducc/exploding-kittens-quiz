import type { ReactNode } from "react";

export type Spell = "fiftyFifty" | "defuse" | "peek" | "double";

export function SpellArt({ spell, className }: { spell: Spell; className?: string }) {
  return <img className={className} src={"/spells/" + spell + ".svg"} width="84" height="116" alt="" aria-hidden="true" />;
}

export function SpellButton({ spell, count, disabled, pressed, onClick, children }: {
  spell: Spell; count: number; disabled: boolean; pressed?: boolean; onClick: () => void; children: ReactNode;
}) {
  return <button className="spell" disabled={disabled} aria-pressed={pressed} onClick={onClick}>
    <SpellArt spell={spell} /><span>{children}</span><b>×{count}</b>
  </button>;
}
