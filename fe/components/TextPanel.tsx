type TextPanelProps = {
  value: string;
  loading: boolean;
  basicToken: boolean;
  proToken: boolean;
  issuedToken: string | null;
  copiedToken: boolean;
  deepModeEnabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  onCopyToken: () => void;
  onForgetToken: () => void;
  onToggleDeep: () => void;
};

export function TextPanel({
  value,
  loading,
  basicToken,
  proToken,
  issuedToken,
  copiedToken,
  deepModeEnabled,
  onChange,
  onSubmit,
  onClear,
  onCopyToken,
  onForgetToken,
  onToggleDeep
}: TextPanelProps) {
  const tokenTier = proToken ? "vip" : basicToken ? "basic" : "none";
  const currentStatusLabel = proToken
    ? "VIP 토큰 활성"
    : basicToken
      ? "기본 토큰 활성"
      : "토큰 없음";
  const statusCaption = issuedToken
    ? "CLI는 파일에, 웹은 이 브라우저에 토큰을 보관합니다."
    : "토큰을 발급받으면 이 브라우저에 계속 유지됩니다.";

  return (
    <section className="terminal-window">
      <div className="terminal-window-header">
        <div className="terminal-traffic">
          <span className="terminal-led is-red" />
          <span className="terminal-led is-amber" />
          <span className="terminal-led is-emerald" />
        </div>

        <div className="terminal-window-meta">
          <p className="terminal-window-label">stdin</p>
          <p className="terminal-window-caption">plain sentence or cli-style command</p>
        </div>

        <span className={`terminal-window-state ${loading ? "is-busy" : ""}`}>
          {loading ? "running" : "idle"}
        </span>
      </div>

      <div className="terminal-window-body">
        <div className="terminal-hint-line">
          <span className="terminal-prompt">guest@yoa:~$</span>
          <span>Ctrl/Cmd + Enter 로 실행</span>
        </div>

        <div className="runtime-object">
          <p className="runtime-object-kicker">current token status</p>

          <div className="runtime-status-header">
            <span className={`runtime-status-chip is-${tokenTier}`}>{currentStatusLabel}</span>
            <span className="runtime-status-caption">{statusCaption}</span>
          </div>

          {issuedToken ? (
            <div className="runtime-token-card">
              <div className="runtime-token-meta">
                <p className="runtime-token-label">issued token</p>
                <p className="runtime-token-caption">
                  새로고침 후에도 유지됩니다. 필요하면 복사해 다른 곳에 보관하세요.
                </p>
              </div>

              <code className="runtime-token-value">{issuedToken}</code>

              <div className="runtime-token-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={loading}
                  onClick={onCopyToken}
                >
                  {copiedToken ? "copied" : "copy token"}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  disabled={loading}
                  onClick={onForgetToken}
                >
                  forget token
                </button>
              </div>
            </div>
          ) : (
            <p className="runtime-token-empty">
              토큰을 발급받으면 여기에서 즉시 확인하고 복사할 수 있습니다.
            </p>
          )}
        </div>

        <textarea
          className="terminal-textarea"
          disabled={loading}
          placeholder={`yoa 오늘 날씨가 맑고 좋다\nyoa --auth\nyoa --auth-code 000000\nyoa --deep 토마토를 먹고 싶은데 돈이 없다`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              onSubmit();
            }
          }}
        />

        <div className="terminal-footer">
          <p className="terminal-footer-text">
            visible UI는 줄이고, 조건 입력이 들어왔을 때만 이벤트가 터집니다.
          </p>

          <div className="terminal-actions">
            <button
              type="button"
              aria-pressed={deepModeEnabled}
              className={`secondary-button ${deepModeEnabled ? "is-active" : ""}`}
              disabled={loading}
              onClick={onToggleDeep}
            >
              {deepModeEnabled ? "deep on" : "deep off"}
            </button>

            <button
              type="button"
              className="secondary-button"
              disabled={loading}
              onClick={onClear}
            >
              reset
            </button>

            <button
              type="button"
              className="primary-button"
              disabled={loading}
              onClick={onSubmit}
            >
              run
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
