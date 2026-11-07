import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mèo Nổ Quiz",
  description: "Mini quiz môn Chủ nghĩa Mác – Lênin. Trả lời, rút bài và chốt điểm.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="vi"><body>{children}</body></html>;
}
