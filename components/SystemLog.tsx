type LogItem = {
  id: string;
  level: "system" | "info" | "success" | "warning" | "error";
  message: string;
};

type SystemLogProps = {
  logs: LogItem[];
};

const levelClassMap: Record<LogItem["level"], string> = {
  system: "is-slate",
  info: "is-violet",
  success: "is-emerald",
  warning: "is-amber",
  error: "is-rose"
};

export function SystemLog({ logs }: SystemLogProps) {
  return (
    <section className="terminal-window">
      <div className="terminal-window-header">
        <div className="terminal-traffic">
          <span className="terminal-led is-red" />
          <span className="terminal-led is-amber" />
          <span className="terminal-led is-emerald" />
        </div>

        <div className="terminal-window-meta">
          <p className="terminal-window-label">event stream</p>
          <p className="terminal-window-caption">runtime events only</p>
        </div>

        <span className="terminal-window-state">{logs.length} lines</span>
      </div>

      <div className="terminal-window-body">
        <div className="terminal-log-stream">
          {logs.map((log) => (
            <div key={log.id} className={`terminal-log-line ${levelClassMap[log.level]}`}>
              <span className="terminal-log-level">[{log.level}]</span>
              <span>{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
