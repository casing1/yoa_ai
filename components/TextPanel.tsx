type TextPanelProps = {
  defaultValue: string;
  characterCount: string;
};

export function TextPanel({ defaultValue, characterCount }: TextPanelProps) {
  return (
    <section className="flex h-full min-h-[420px] flex-col rounded-[28px] border border-[#e2e8e4] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#edf2ee] px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#03c75a] px-3 py-1 text-sm font-medium text-white">원문</span>
          <span className="text-sm text-[#667085]">직접 입력</span>
        </div>

        <span className="text-sm text-[#98a2b3]">한국어</span>
      </div>

      <div className="flex-1 px-5 py-4">
        <label className="sr-only" htmlFor="summary-source">
          Enter text to summarize
        </label>

        <textarea
          id="summary-source"
          className="min-h-[300px] w-full resize-none border-0 bg-transparent text-[17px] leading-8 text-[#101828] outline-none placeholder:text-[#98a2b3] lg:min-h-[360px]"
          defaultValue={defaultValue}
          placeholder="여기에 문장을 입력하세요"
        />
      </div>

      <div className="flex flex-col gap-4 border-t border-[#edf2ee] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-sm text-[#98a2b3]">
          <span>{characterCount}</span>
          <span className="h-1 w-1 rounded-full bg-[#d0d5dd]" />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-[#03c75a] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#02b652]"
          >
            <span>요약하기</span>
            <ArrowIcon />
          </button>

          <button
            type="button"
            className="rounded-full border border-[#d9e2db] bg-[#f8faf9] px-4 py-2.5 text-sm text-[#344054] transition-colors hover:bg-[#f0f5f2]"
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
