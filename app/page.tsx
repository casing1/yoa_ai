"use client";

import { useMemo, useState } from "react";
import { ResultPanel } from "../components/ResultPanel";
import { TextPanel } from "../components/TextPanel";

const INITIAL_INPUT =
  "오늘 날씨가 맑고 좋다";

const INITIAL_SUMMARY = "오날맑좋";
const EMPTY_SUMMARY = "입력이 비어 있습니다.";
const RITUAL_DELAY_MS = 2200;

const stopWords = new Set([
  "그리고",
  "그래서",
  "하지만",
  "근데",
  "정말",
  "아주",
  "너무",
  "진짜",
  "그냥",
  "좀",
  "조금",
  "약간",
  "일단"
]);

const suffixes = [
  "으로는",
  "에게는",
  "한테는",
  "에서는",
  "으로도",
  "에게도",
  "한테도",
  "입니다",
  "이에요",
  "예요",
  "이네요",
  "이었고",
  "였다",
  "하고",
  "하며",
  "해서",
  "이다",
  "으로",
  "에서",
  "에게",
  "한테",
  "께서",
  "부터",
  "까지",
  "와",
  "과",
  "은",
  "는",
  "이",
  "가",
  "을",
  "를",
  "에",
  "의",
  "도",
  "만",
  "로",
  "다",
  "요",
  "죠",
  "고"
] as const;

function stripSuffix(token: string) {
  for (const suffix of suffixes) {
    if (token.length > suffix.length + 1 && token.endsWith(suffix)) {
      return token.slice(0, -suffix.length);
    }
  }

  return token;
}

function compressText(source: string) {
  const cleaned = source.replace(/\s+/g, " ").trim();

  if (!cleaned) {
    return EMPTY_SUMMARY;
  }

  const compressed = cleaned
    .split(" ")
    .map((token) => token.replace(/[^0-9A-Za-z가-힣]/g, ""))
    .map((token) => stripSuffix(token))
    .filter(Boolean)
    .filter((token) => !stopWords.has(token))
    .map((token) => token[0] ?? "")
    .filter(Boolean)
    .slice(0, 12)
    .join("");

  return compressed || EMPTY_SUMMARY;
}

export default function Home() {
  const [input, setInput] = useState(INITIAL_INPUT);
  const [summary, setSummary] = useState(INITIAL_SUMMARY);
  const [loading, setLoading] = useState(false);

  const sourceLengthLabel = useMemo(() => `${input.length} / 5,000`, [input]);
  const outputLengthLabel = useMemo(() => `${summary.length} chars`, [summary]);

  const handleSummarize = () => {
    if (loading) {
      return;
    }

    if (!input.trim()) {
      setSummary(EMPTY_SUMMARY);
      return;
    }

    setLoading(true);

    window.setTimeout(() => {
      setSummary(compressText(input));
      setLoading(false);
    }, RITUAL_DELAY_MS);
  };

  const handleClear = () => {
    if (loading) {
      return;
    }

    setInput("");
    setSummary(EMPTY_SUMMARY);
  };

  const handleCopy = () => {
    if (loading || !summary.trim()) {
      return;
    }

    void navigator.clipboard.writeText(summary).catch(() => undefined);
  };

  return (
    <main className="h-dvh overflow-hidden p-2 sm:p-3 lg:p-5">
      <section
        className={`hero-shell mx-auto flex h-full max-w-6xl flex-col ${loading ? "is-summarizing" : ""}`}
      >
        <div className="relative z-10 flex h-full min-h-0 flex-col p-3 sm:p-4 lg:p-6">
          <div className="shrink-0 max-w-4xl">
            <h1 className="font-display text-[2rem] font-semibold leading-[0.92] tracking-[-0.05em] text-white sm:text-[2.9rem] lg:text-[3.5rem] xl:text-[4.2rem]">
              하찮은 기능도,
              <br />
              웅장하게 연출한다.
            </h1>

            <p className="mt-3 hidden max-w-2xl text-sm leading-6 text-white/60 md:block">
              문장을 자연어로 다시 쓰지 않고, 단어 앞글자만 뽑아 초압축 문자열로 바꾸는
              인터랙티브 프론트 데모입니다. 예시 하나만 봐도 서비스 규칙이 바로 읽히게
              구성했습니다.
            </p>
          </div>

          <div className="mt-3 flex min-h-0 flex-1 rounded-[24px] border border-white/8 bg-black/25 p-2 backdrop-blur-sm sm:mt-4 sm:rounded-[30px] sm:p-3 lg:p-4">
            <div className="grid min-h-0 w-full grid-rows-[minmax(0,1fr)_64px_minmax(0,1fr)] gap-2 sm:grid-rows-[minmax(0,1fr)_72px_minmax(0,1fr)] sm:gap-3 lg:grid-cols-[minmax(0,1fr)_88px_minmax(0,1fr)] lg:grid-rows-none lg:items-stretch">
              <TextPanel
                value={input}
                characterCount={sourceLengthLabel}
                loading={loading}
                onChange={setInput}
                onSubmit={handleSummarize}
                onClear={handleClear}
              />

              <div className="flex items-center justify-center">
                <div className="hero-switch">
                  <div className="hero-orb">
                    <div className="hero-orb-core" />
                    <div className="absolute inset-[14%] rounded-full border border-white/10" />
                    <div className="absolute inset-0 flex items-center justify-center text-white/85">
                      <SwitchIcon />
                    </div>
                  </div>
                </div>
              </div>

              <ResultPanel
                summary={summary}
                characterCount={outputLengthLabel}
                loading={loading}
                onCopy={handleCopy}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function SwitchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 7H18M18 7L15.5 4.5M18 7L15.5 9.5M17 17H6M6 17L8.5 14.5M6 17L8.5 19.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}
