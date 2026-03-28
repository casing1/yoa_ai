import { ResultPanel } from "../components/ResultPanel";
import { TextPanel } from "../components/TextPanel";

const mockInput =
  "오늘 날씨가 정말 좋아서 한강에 가서 산책하고 싶다. 바람도 적당하고 햇살도 좋아서 잠깐이라도 밖에 나가 걷고 싶은 기분이다.";

const mockSummary = "오날정좋한가산싶.바적햇좋잠밖나걷싶기.";
const sourceLengthLabel = `${mockInput.length} / 5,000`;
const outputLengthLabel = `${mockSummary.length} chars`;

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[32px] border border-[#dfe7df] bg-white p-3 shadow-[0_24px_50px_rgba(15,23,42,0.06)] sm:p-4">
          <div className="rounded-[28px] bg-[#f7faf8] p-4 sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
              <TextPanel defaultValue={mockInput} characterCount={sourceLengthLabel} />

              <div className="hidden lg:flex lg:items-center lg:justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#dbe6de] bg-white text-[#98a2b3] shadow-[0_10px_20px_rgba(15,23,42,0.05)]">
                  <SwitchIcon />
                </div>
              </div>

              <ResultPanel summary={mockSummary} characterCount={outputLengthLabel} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SwitchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
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
