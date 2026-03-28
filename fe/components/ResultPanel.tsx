type ResultPanelProps = {
  summary: string;
  characterCount: string;
  loading: boolean;
  onCopy: () => void;
};

export function ResultPanel({ summary, characterCount, loading, onCopy }: ResultPanelProps) {
  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(6,14,13,0.95),rgba(4,9,11,0.94))] shadow-[0_28px_90px_rgba(0,0,0,0.35)] sm:rounded-[30px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.16),transparent_32%),radial-gradient(circle_at_20%_90%,rgba(168,85,247,0.16),transparent_28%)]" />

      <div className="relative flex items-center justify-between gap-3 border-b border-white/8 px-3 py-2.5 sm:px-5 sm:py-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-100 sm:px-3 sm:text-sm">
            요약
          </span>
          <span className="text-xs text-white/55 sm:text-sm">결과 현현</span>
        </div>

        <span className="text-xs text-white/35 sm:text-sm">{loading ? "Summoning" : "Revealed"}</span>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col px-3 py-3 sm:px-5 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/65 sm:px-3 sm:text-xs sm:tracking-[0.22em]">
            앞글자 압축
          </span>
          <span className="text-xs text-white/35 sm:text-sm">{characterCount}</span>
        </div>

        {loading ? (
          <div className="mt-3 flex min-h-0 flex-1 flex-col items-center justify-center rounded-[18px] border border-white/8 bg-black/20 px-4 py-4 text-center sm:mt-5 sm:rounded-[28px] sm:px-5 sm:py-6">
            <div className="hero-orb">
              <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_90deg,rgba(52,211,153,0.35),rgba(168,85,247,0.22),rgba(52,211,153,0.35))] opacity-70 blur-[2px] animate-spin-slow" />
              <div className="hero-orb-core" />
            </div>

            <span className="mt-4 rounded-full border border-emerald-300/15 bg-emerald-400/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-emerald-100 sm:mt-6 sm:text-xs sm:tracking-[0.3em]">
              에너지 집결
            </span>

            <p className="font-display mt-3 text-[1.4rem] font-medium tracking-[-0.04em] text-white sm:mt-4 sm:text-[2rem] lg:text-[2.3rem]">
              소환 중
            </p>

            <p className="mt-2 max-w-md text-xs leading-5 text-white/55 sm:mt-3 sm:text-sm sm:leading-6">
              단어 앞글자를 추출해 한눈에 들어오는 축약형 문자열로 재조합하고 있습니다.
            </p>

            <div className="mt-4 w-full max-w-md space-y-2 sm:mt-6 sm:space-y-3">
              <div className="shimmer h-3 rounded-full border border-white/6 bg-white/5 sm:h-4" />
              <div className="shimmer h-3 w-11/12 rounded-full border border-white/6 bg-white/5 sm:h-4" />
              <div className="shimmer h-3 w-8/12 rounded-full border border-white/6 bg-white/5 sm:h-4" />
            </div>
          </div>
        ) : (
          <div className="mt-3 flex min-h-0 flex-1 flex-col justify-center sm:mt-5">
            <p className="font-display max-w-xl text-[1.35rem] font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-[2rem] lg:text-[2.8rem]">
              {summary}
            </p>

            <p className="mt-3 max-w-lg text-xs leading-5 text-white/55 sm:mt-4 sm:text-sm sm:leading-6">
              문장을 다시 쓰지 않고, 단어 앞글자만 골라 초압축 축약형으로 변환한 결과입니다.
            </p>
          </div>
        )}
      </div>

      <div className="relative flex flex-wrap gap-2 border-t border-white/8 px-3 py-2.5 sm:px-5 sm:py-3">
        <button
          type="button"
          disabled={loading}
          className="rounded-full border border-emerald-300/15 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-50 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-2.5 sm:text-sm"
          onClick={onCopy}
        >
          복사
        </button>

        <button
          type="button"
          disabled={loading}
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/75 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-2.5 sm:text-sm"
        >
          공유
        </button>
      </div>
    </section>
  );
}
