type TextPanelProps = {
  value: string;
  characterCount: string;
  loading: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
};

export function TextPanel({
  value,
  characterCount,
  loading,
  onChange,
  onSubmit,
  onClear
}: TextPanelProps) {
  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] border border-emerald-300/10 bg-[linear-gradient(180deg,rgba(5,16,14,0.95),rgba(3,10,9,0.92))] shadow-[0_28px_90px_rgba(0,0,0,0.35)] sm:rounded-[30px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.1),transparent_28%)]" />

      <div className="relative flex items-center justify-between gap-3 border-b border-white/8 px-3 py-2.5 sm:px-5 sm:py-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-100 sm:px-3 sm:text-sm">
            원문
          </span>
          <span className="text-xs text-white/55 sm:text-sm">입력 채널</span>
        </div>

        <span className="text-xs text-white/35 sm:text-sm">Live Source</span>
      </div>

      <div className="relative flex min-h-0 flex-1 px-3 py-3 sm:px-5 sm:py-4">
        <label className="sr-only" htmlFor="summary-source">
          Enter text to summarize
        </label>

        <textarea
          id="summary-source"
          className="h-full min-h-0 w-full resize-none rounded-[18px] border border-white/7 bg-black/10 px-3 py-3 text-[13px] leading-6 text-white outline-none placeholder:text-white/28 disabled:cursor-not-allowed disabled:opacity-70 sm:rounded-[24px] sm:px-4 sm:py-4 sm:text-[15px] sm:leading-7"
          disabled={loading}
          placeholder="예: 오늘 날씨가 맑고 좋다"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>

      <div className="relative flex flex-col gap-2 border-t border-white/8 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-white/42 sm:gap-3 sm:text-sm">
          <span>{characterCount}</span>
          <span className="h-1 w-1 rounded-full bg-white/18" />
          <span>{loading ? "차원 압축 중" : "입력 대기"}</span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#34d399,#10b981)] px-3 py-2 text-xs font-semibold text-[#02110d] shadow-[0_0_30px_rgba(52,211,153,0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(52,211,153,0.5)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:py-2.5 sm:text-sm"
            onClick={onSubmit}
          >
            <span>{loading ? "차원 접속 중..." : "요약하기"}</span>
            <ArrowIcon />
          </button>

          <button
            type="button"
            disabled={loading}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/75 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-2.5 sm:text-sm"
            onClick={onClear}
          >
            지우기
          </button>
        </div>
      </div>
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 12H19M19 12L13 6M19 12L13 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}
