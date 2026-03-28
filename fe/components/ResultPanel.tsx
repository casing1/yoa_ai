type Tone = "emerald" | "amber" | "rose" | "violet" | "slate";

type OutputState = {
  tone: Tone;
  title: string;
  commandEcho: string;
  lines: string[];
  summary?: string;
  exitCode: number | null;
};

type LoadingStage = {
  label: string;
  detail: string;
};

type ResultPanelProps = {
  output: OutputState;
  loading: boolean;
  loadingStage: LoadingStage;
  activeCommand: string;
};

const toneClassMap: Record<Tone, string> = {
  emerald: "is-emerald",
  amber: "is-amber",
  rose: "is-rose",
  violet: "is-violet",
  slate: "is-slate"
};

export function ResultPanel({
  output,
  loading,
  loadingStage,
  activeCommand
}: ResultPanelProps) {
  return (
    <section className="terminal-window">
      <div className="terminal-window-header">
        <div className="terminal-traffic">
          <span className="terminal-led is-red" />
          <span className="terminal-led is-amber" />
          <span className="terminal-led is-emerald" />
        </div>

        <div className="terminal-window-meta">
          <p className="terminal-window-label">stdout</p>
          <p className="terminal-window-caption">last command response</p>
        </div>

        <span className={`terminal-tone-badge ${toneClassMap[output.tone]}`}>
          {loading ? "processing" : output.title}
        </span>
      </div>

      <div className="terminal-window-body">
        <div className="terminal-output">
          <div className="terminal-command-line">
            <span className="terminal-prompt">guest@yoa:~$</span>
            <span>{loading ? activeCommand : output.commandEcho}</span>
          </div>

          {loading ? (
            <div className="terminal-loading-block">
              <div className="terminal-line">
                <span className="terminal-arrow">&gt;</span>
                <span>{loadingStage.label}</span>
              </div>
              <div className="terminal-line">
                <span className="terminal-arrow">&gt;</span>
                <span>{loadingStage.detail}</span>
              </div>
              <div className="terminal-progress">
                <span className="terminal-progress-fill" />
              </div>
              <div className="terminal-line">
                <span className="terminal-arrow">&gt;</span>
                <span>_</span>
                <span className="terminal-cursor" />
              </div>
            </div>
          ) : (
            <div className="terminal-output-block">
              {output.lines.map((line, index) => (
                <div key={`${line}-${index}`} className="terminal-line">
                  <span className="terminal-arrow">&gt;</span>
                  <span>{line}</span>
                </div>
              ))}

              {output.summary ? (
                <div className="terminal-highlight">{output.summary}</div>
              ) : null}
            </div>
          )}
        </div>

        <div className="terminal-exit-line">
          <span>exit</span>
          <span className={output.exitCode === 0 ? "text-emerald-200" : "text-rose-200"}>
            {loading ? "..." : output.exitCode ?? "-"}
          </span>
        </div>
      </div>
    </section>
  );
}
