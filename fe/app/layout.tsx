import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "yoa | 초거대 바이브 랭귀지 모델",
  description: "CLI 세계관의 토큰, 백도어, 파업, Deep Reasoning을 웹 콘솔 UX로 번역한 가짜 AI 요약기."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
