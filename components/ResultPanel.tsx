type ResultPanelProps = {
  summary: string;
  characterCount: string;
};

const actions = ["복사", "공유"];

export function ResultPanel({ summary, characterCount }: ResultPanelProps) {
  return (
    <section className="flex h-full min-h-[420px] flex-col rounded-[28px] border border-[#e2e8e4] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#edf2ee] px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#ecfdf3] px-3 py-1 text-sm font-medium text-[#03c75a]">요약</span>
          <span className="text-sm text-[#667085]">결과 미리보기</span>
        </div>

        <span className="text-sm text-[#98a2b3]">짧게</span>
      </div>

      <div className="flex-1 px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border border-[#c8ead5] bg-[#ebfaf0] px-3 py-1 text-xs font-medium text-[#03c75a]">
            핵심 문장
          </span>
          <span className="text-sm text-[#98a2b3]">{characterCount}</span>
        </div>

        <p className="font-display mt-8 max-w-xl text-[32px] font-medium leading-tight tracking-tight text-[#101828] sm:text-[2.5rem]">
          {summary}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[#edf2ee] px-5 py-4">
        {actions.map((action) => (
          <button
            key={action}
            type="button"
            className="rounded-full border border-[#d9e2db] bg-[#f8faf9] px-4 py-2.5 text-sm text-[#344054] transition-colors hover:bg-[#f0f5f2]"
          >
            {action}
          </button>
        ))}
      </div>
    </section>
  );
}
