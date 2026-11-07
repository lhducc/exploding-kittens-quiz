"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export function GameDialog({ title, close, children, className = "" }: {
  title: string; close: () => void; children: ReactNode; className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return <dialog ref={ref} className={"game-dialog " + className} aria-labelledby="dialog-title" onCancel={event => {
    event.preventDefault();
    close();
  }}>
    <div className="dialog-header">
      <h2 id="dialog-title">{title}</h2>
      <button className="button subtle dialog-close" type="button" aria-label="Đóng" onClick={close}>×</button>
    </div>
    {children}
  </dialog>;
}
