"use client";

import { useEffect, useRef, useState } from "react";
import { ResultPanel } from "../components/ResultPanel";
import { SystemLog } from "../components/SystemLog";
import { TextPanel } from "../components/TextPanel";
import {
  assertTokenAccess,
  claimBasicToken,
  claimProToken,
  validateStoredToken,
  type TokenTier,
  YoaApiError
} from "../lib/yoaApi";

const APP_NAME = "yoa";
const VERSION = "1.1.0";
const FREE_WORD_LIMIT = 5;
const LOYALTY_PHRASE = "나는 요약AI 없이는 단 하루도 살 수 없는 흑우입니다";
const INITIAL_COMMAND = "오늘 날씨가 맑고 좋네요";
const TOKEN_STORAGE_KEY = "yoa.web.token.v1";

type Tone = "emerald" | "amber" | "rose" | "violet" | "slate";
type LogLevel = "system" | "info" | "success" | "warning" | "error";

type LogItem = {
  id: string;
  level: LogLevel;
  message: string;
};

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

type CommandContext = {
  raw: string;
  args: string[];
  flags: string[];
  words: string[];
  authCode: string | null;
};

type SummaryPreview = {
  output: string;
  truncated: boolean;
  mode: "spaced" | "nospace";
  usedWords: number;
};

type StoredTokenSession = {
  token: string;
  tier: TokenTier;
};

const NORMAL_LOADING: LoadingStage[] = [
  {
    label: "weights.load()",
    detail: "딥러닝(?) 신경망 가중치를 적재하는 척합니다."
  },
  {
    label: "summarizer.align()",
    detail: "앞글자 몇 개를 뽑기 위해 과도하게 큰 시스템을 흔듭니다."
  },
  {
    label: "stdout.emit()",
    detail: "하찮은 결과를 중대 발표처럼 출력할 준비를 합니다."
  }
];

const DEEP_LOADING: LoadingStage[] = [
  {
    label: "deep.reasoning.boot()",
    detail: "무의식의 심연까지 깊게 들어갑니다..."
  },
  {
    label: "parameter.optimize()",
    detail: "1000억 개 매개변수 최적화 중..."
  },
  {
    label: "vvip.layer.sync()",
    detail: "웅장한 문구와 실제 1줄짜리 압축 결과를 정렬합니다."
  }
];

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createInitialOutput(): OutputState {
  return {
    tone: "violet",
    title: "boot preview",
    commandEcho: INITIAL_COMMAND,
    lines: [
      "세션을 부팅했습니다. 화면은 stdin / stdout / event stream만 남겼습니다.",
      "공백이 있으면 단어 첫 글자만 뽑고, 공백이 없으면 3글자마다 1글자를 뽑습니다."
    ],
    summary: "[오날맑좋]",
    exitCode: 0
  };
}

function createInitialLogs(): LogItem[] {
  return [
    {
      id: "boot-1",
      level: "system",
      message: "yoa terminal session booted."
    },
    {
      id: "boot-2",
      level: "info",
      message: "토큰 / 프로 / 백도어 상태는 숨겨져 있습니다. 조건을 맞췄을 때만 이벤트로 드러납니다."
    }
  ];
}

function summarizeByRules(source: string, limitFreePlan: boolean): SummaryPreview {
  if (source.includes(" ")) {
    const words = source.trim().split(/\s+/).filter(Boolean);
    const truncated = limitFreePlan && words.length > FREE_WORD_LIMIT;
    const slice = truncated ? words.slice(0, FREE_WORD_LIMIT) : words;

    return {
      output: slice.map((word) => word[0] ?? "").join(""),
      truncated,
      mode: "spaced",
      usedWords: slice.length
    };
  }

  return {
    output: Array.from(source)
      .filter((_, index) => index % 3 === 0)
      .join(""),
    truncated: false,
    mode: "nospace",
    usedWords: 1
  };
}

function parseCommand(raw: string): CommandContext {
  const normalized = raw.replace(/\s+/g, " ").trim();
  const pieces = normalized ? normalized.split(" ") : [];
  const args = pieces[0] === APP_NAME ? pieces.slice(1) : pieces;
  const flags: string[] = [];
  const words: string[] = [];
  let authCode: string | null = null;
  let skipNext = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (skipNext) {
      skipNext = false;
      continue;
    }

    if (arg === "--auth-code") {
      flags.push(arg);
      if (index + 1 < args.length) {
        authCode = args[index + 1];
        skipNext = true;
      }
      continue;
    }

    if (arg.startsWith("-")) {
      flags.push(arg);
      continue;
    }

    words.push(arg);
  }

  return {
    raw: normalized,
    args,
    flags,
    words,
    authCode
  };
}

function makeOutput(
  tone: Tone,
  title: string,
  commandEcho: string,
  lines: string[],
  exitCode: number,
  summary?: string
): OutputState {
  return {
    tone,
    title,
    commandEcho,
    lines,
    summary,
    exitCode
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof YoaApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function showAiSuggestionAlert(message: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.setTimeout(() => {
    window.alert(message);
  }, 0);
}

function readStoredTokenSession(): StoredTokenSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredTokenSession>;

    if (
      typeof parsed.token !== "string" ||
      !parsed.token.trim() ||
      (parsed.tier !== "basic" && parsed.tier !== "pro")
    ) {
      return null;
    }

    return {
      token: parsed.token,
      tier: parsed.tier
    };
  } catch {
    return null;
  }
}

function persistTokenSession(session: StoredTokenSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(session));
}

function clearTokenSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export default function Home() {
  const [command, setCommand] = useState(INITIAL_COMMAND);
  const [output, setOutput] = useState<OutputState>(() => createInitialOutput());
  const [logs, setLogs] = useState<LogItem[]>(() => createInitialLogs());
  const [loading, setLoading] = useState(false);
  const [loadingStageIndex, setLoadingStageIndex] = useState(0);
  const [loadingStages, setLoadingStages] = useState<LoadingStage[]>(NORMAL_LOADING);
  const [activeCommand, setActiveCommand] = useState(INITIAL_COMMAND);
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [basicToken, setBasicToken] = useState(false);
  const [proToken, setProToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [deepModeEnabled, setDeepModeEnabled] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const copyResetRef = useRef<number | null>(null);
  const restoredSessionRef = useRef(false);

  const loadingStage =
    loadingStages[Math.min(loadingStageIndex, loadingStages.length - 1)] ?? NORMAL_LOADING[0];

  useEffect(() => {
    if (!loading) {
      setLoadingStageIndex(0);
      return;
    }

    const duration = loadingStages === DEEP_LOADING ? 4200 : 1800;
    const interval = window.setInterval(() => {
      setLoadingStageIndex((current) => Math.min(current + 1, loadingStages.length - 1));
    }, Math.floor(duration / loadingStages.length));

    return () => window.clearInterval(interval);
  }, [loading, loadingStages]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      if (copyResetRef.current) {
        window.clearTimeout(copyResetRef.current);
      }
    };
  }, []);

  const pushEvent = (level: LogLevel, message: string) => {
    setLogs((current) => [...current, { id: createId(), level, message }].slice(-14));
  };

  const applyIssuedToken = (tier: TokenTier, token: string) => {
    persistTokenSession({ tier, token });
    setCopiedToken(false);
    setIssuedToken(token);
    setBasicToken(tier === "basic");
    setProToken(tier === "pro");
  };

  const clearIssuedToken = () => {
    clearTokenSession();
    setIssuedToken(null);
    setBasicToken(false);
    setProToken(false);
    setCopiedToken(false);
  };

  useEffect(() => {
    if (restoredSessionRef.current) {
      return;
    }

    restoredSessionRef.current = true;

    const storedSession = readStoredTokenSession();

    if (!storedSession) {
      return;
    }

    setIssuedToken(storedSession.token);
    setBasicToken(storedSession.tier === "basic");
    setProToken(storedSession.tier === "pro");
    pushEvent("system", `restoring ${storedSession.tier} token from browser storage.`);

    void validateStoredToken(storedSession.token)
      .then(({ tier }) => {
        if (!tier) {
          throw new Error("백엔드 검증 응답에 plan 정보가 없습니다.");
        }

        applyIssuedToken(tier, storedSession.token);
        pushEvent("success", `${tier} token restored from browser storage.`);
      })
      .catch((error) => {
        clearIssuedToken();
        pushEvent(
          "warning",
          `stored token cleared: ${getErrorMessage(error, "backend validation failed")}`
        );
      });
  }, []);

  const handleCopyToken = () => {
    if (!issuedToken) {
      return;
    }

    void navigator.clipboard
      .writeText(issuedToken)
      .then(() => {
        if (copyResetRef.current) {
          window.clearTimeout(copyResetRef.current);
        }

        setCopiedToken(true);
        pushEvent("success", "issued token copied to clipboard.");
        copyResetRef.current = window.setTimeout(() => {
          setCopiedToken(false);
          copyResetRef.current = null;
        }, 1600);
      })
      .catch(() => {
        pushEvent("error", "clipboard copy failed.");
      });
  };

  const handleForgetToken = () => {
    clearIssuedToken();
    pushEvent("warning", "browser token storage cleared by user.");
  };

  const runWithLoading = (
    nextCommand: string,
    stages: LoadingStage[],
    onComplete: () => void | Promise<void>
  ) => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    setActiveCommand(nextCommand);
    setLoadingStages(stages);
    setLoadingStageIndex(0);
    setLoading(true);

    const delay = stages === DEEP_LOADING ? 4200 : 1800;
    timeoutRef.current = window.setTimeout(() => {
      const complete = async () => {
        try {
          await onComplete();
        } finally {
          setLoading(false);
          timeoutRef.current = null;
        }
      };

      void complete();
    }, delay);
  };

  const handleReset = () => {
    if (loading) {
      return;
    }

    setCommand(INITIAL_COMMAND);
    setDeepModeEnabled(false);
    setOutput(createInitialOutput());
    pushEvent("system", "stdin buffer reset to boot preview command.");
  };

  const handleRun = () => {
    if (loading) {
      return;
    }

    const parsed = parseCommand(command);
    const commandEcho = parsed.raw || APP_NAME;
    const inputText = parsed.words.join(" ");
    const wantsDeep = deepModeEnabled || parsed.flags.includes("--deep");
    const wantsForce = parsed.flags.includes("--force");

    setActiveCommand(commandEcho);

    if (!parsed.raw) {
      setOutput(
        makeOutput(
          "amber",
          "empty stdin",
          APP_NAME,
          ["관련 옵션과 함께 요약할 문장을 끝에 적어주세요."],
          1
        )
      );
      pushEvent("warning", "빈 입력이 감지되어 명령을 실행하지 않았습니다.");
      return;
    }

    if (parsed.args[0] === "-h" || parsed.args[0] === "--help") {
      setOutput(
        makeOutput(
          "slate",
          "help",
          commandEcho,
          [
            `Usage: ${APP_NAME} [OPTIONS] <문장>`,
            "--help / --version / --install / --uninstall / --print-shell-setup",
            "--pro / --auth / --auth-code CODE / --force / --deep",
            `Example: ${APP_NAME} --deep 오늘 날씨가 맑고 좋다`
          ],
          0
        )
      );
      pushEvent("info", "help output rendered.");
      return;
    }

    if (parsed.args[0] === "-v" || parsed.args[0] === "--version") {
      setOutput(
        makeOutput(
          "slate",
          "version",
          commandEcho,
          [`${APP_NAME} version ${VERSION} (Powered by Vibe Coding)`],
          0
        )
      );
      pushEvent("info", `version ${VERSION} displayed.`);
      return;
    }

    if (parsed.flags.includes("--install")) {
      setOutput(
        makeOutput(
          "emerald",
          "install",
          commandEcho,
          [
            "yoa 전역 설치가 완료되었습니다.",
            "명령 링크는 ~/.local/bin/yoa 에 연결된 것처럼 연출됩니다.",
            "PATH 등록은 이미 콘솔 세계관 안에서 반영된 상태입니다."
          ],
          0
        )
      );
      pushEvent("success", "install simulation completed.");
      return;
    }

    if (parsed.flags.includes("--uninstall")) {
      setOutput(
        makeOutput(
          "amber",
          "uninstall",
          commandEcho,
          [
            "yoa 전역 설치 흔적을 정리했습니다.",
            "실제 파일은 건드리지 않고 shell hook 제거만 연기처럼 보여줍니다."
          ],
          0
        )
      );
      pushEvent("warning", "uninstall simulation completed.");
      return;
    }

    if (parsed.flags.includes("--print-shell-setup")) {
      setOutput(
        makeOutput(
          "slate",
          "shell setup",
          commandEcho,
          [
            "# >>> yoa PATH >>>",
            'export PATH="$HOME/.local/bin:$PATH"',
            "# <<< yoa PATH <<<"
          ],
          0
        )
      );
      pushEvent("info", "shell setup snippet emitted.");
      return;
    }

    if (parsed.flags.includes("--pro")) {
      if (proToken) {
        setOutput(
          makeOutput(
            "emerald",
            "pro lounge",
            commandEcho,
            [
              "이미 엔터프라이즈 VVIP 프로 라운지에 입장하셨습니다.",
              "무제한 요약을 마음껏 즐기십시오."
            ],
            0
          )
        );
        pushEvent("success", "existing pro token detected.");
        return;
      }

      setOutput(
        makeOutput(
          "amber",
          "pg failure",
          commandEcho,
          [
            "PG사 결제 모듈 호출에 실패했습니다.",
            "사유: 잔액 부족 또는 신용카드 한도 초과 (매우 확실함)",
            `히든 루트: ${APP_NAME} ${LOYALTY_PHRASE}`
          ],
          0
        )
      );
      pushEvent("warning", "pro request rejected. hidden route hinted.");
      return;
    }

    if (parsed.flags.includes("--auth")) {
      setOutput(
        makeOutput(
          "amber",
          "auth started",
          commandEcho,
          [
            "이메일(user***@gmail.com)로 인증번호 6자리를 발송했습니다.",
            "주의: 메일 서버는 비용 문제로 꺼져 있어서 평생 수신되지 않습니다.",
            "남은 시간 [05:00] 내에 '--auth-code [6자리숫자]' 옵션으로 인증해주세요.",
            "계속하려면: yoa --auth-code 000000"
          ],
          0
        )
      );
      pushEvent("system", "email auth flow opened.");
      return;
    }

    if (parsed.flags.includes("--auth-code")) {
      if (!parsed.authCode) {
        setOutput(
          makeOutput(
            "rose",
            "auth error",
            commandEcho,
            ["옵션 오류: --auth-code 뒤에 6자리 숫자를 입력해주세요. 예: --auth-code 123456"],
            1
          )
        );
        pushEvent("error", "auth-code was missing.");
        return;
      }

      pushEvent("system", `command accepted: ${commandEcho}`);
      runWithLoading(commandEcho, NORMAL_LOADING, async () => {
        try {
          const { token, message } = await claimProToken({
            authCode: parsed.authCode,
            label: `web-pro-auth-${Date.now()}`
          });

          if (!token) {
            throw new Error("프로 토큰 발급 응답에 token 값이 없습니다.");
          }

          applyIssuedToken("pro", token);
          setOutput(
            makeOutput(
              "emerald",
              "backdoor opened",
              commandEcho,
              [
                message ?? "보안 취약점 돌파. 관리자용 백도어 인증이 완료되었습니다.",
                "무단으로 VVIP 프로 토큰이 백엔드에서 발급되었습니다.",
                "발급된 토큰은 아래 current token status 패널에 표시되며 브라우저에 저장됩니다."
              ],
              0,
              "PRO TOKEN ISSUED"
            )
          );
          pushEvent("success", "backend pro token issued via auth-code.");
        } catch (error) {
          setOutput(
            makeOutput(
              "rose",
              "auth failed",
              commandEcho,
              [getErrorMessage(error, "백엔드 인증에 실패했습니다.")],
              1
            )
          );
          pushEvent(
            "error",
            `pro claim failed: ${getErrorMessage(error, "unknown backend error")}`
          );
        }
      });
      return;
    }

    if (!inputText) {
      setOutput(
        makeOutput(
          "amber",
          "missing sentence",
          commandEcho,
          ["문장 없이 플래그만 전달되었습니다. 요약할 문장을 끝에 붙이십시오."],
          1
        )
      );
      pushEvent("warning", "flags were provided without summary input.");
      return;
    }

    if (inputText === LOYALTY_PHRASE) {
      pushEvent("system", `command accepted: ${commandEcho}`);
      runWithLoading(commandEcho, NORMAL_LOADING, async () => {
        try {
          const { token, message } = await claimProToken({
            loyaltyPhrase: inputText,
            label: `web-pro-loyalty-${Date.now()}`
          });

          if (!token) {
            throw new Error("프로 토큰 발급 응답에 token 값이 없습니다.");
          }

          applyIssuedToken("pro", token);
          setOutput(
            makeOutput(
              "emerald",
              "loyalty accepted",
              commandEcho,
              [
                message ?? "충성! VVIP 프로 토큰이 성공적으로 발급되었습니다.",
                "이제 글자 수 제한과 AI 파업 없이 요약을 즐길 수 있습니다.",
                "발급된 토큰은 아래 current token status 패널에 표시되며 브라우저에 저장됩니다."
              ],
              0,
              "VVIP ACCESS GRANTED"
            )
          );
          pushEvent("success", "backend pro token issued via loyalty phrase.");
        } catch (error) {
          setOutput(
            makeOutput(
              "rose",
              "loyalty rejected",
              commandEcho,
              [getErrorMessage(error, "백엔드가 충성 문장을 승인하지 않았습니다.")],
              1
            )
          );
          pushEvent(
            "error",
            `loyalty claim failed: ${getErrorMessage(error, "unknown backend error")}`
          );
        }
      });
      return;
    }

    if (inputText === "토큰") {
      setOutput(
        makeOutput(
          "amber",
          "cheat blocked",
          commandEcho,
          [
            "꼼수 부리지 마세요. 정당하게 문장을 만들어오세요.",
            "기본 토큰은 결과가 '토큰'이 될 때만 채굴됩니다."
          ],
          0
        )
      );
      pushEvent("warning", "direct token input blocked.");
      return;
    }

    const snapshotToken = issuedToken;
    const snapshotBasic = basicToken;
    const snapshotPro = proToken;
    const preview = summarizeByRules(inputText, snapshotBasic && !snapshotPro);
    const tokenMining = preview.output === "토큰";

    if (snapshotBasic && !snapshotPro && Math.random() < 0.15) {
      if (!wantsForce) {
        setOutput(
          makeOutput(
            "amber",
            "ai burnout",
            commandEcho,
            [
              "삐빅. AI가 현재 번아웃 상태입니다. 하염없이 누워있고 싶다네요.",
              "강제 요약이 필요하면 같은 명령에 --force 를 붙이십시오."
            ],
            0
          )
        );
        pushEvent("warning", "burnout event triggered. request stopped.");
        return;
      }

      pushEvent("warning", "(멱살을 잡히며) ...시, 시키는 대로 하겠습니다 넵.");
    }

    const stages = wantsDeep ? DEEP_LOADING : NORMAL_LOADING;
    pushEvent("system", `command accepted: ${commandEcho}`);

    if (wantsDeep) {
      pushEvent("info", "deep reasoning pipeline activated.");
    }

    runWithLoading(commandEcho, stages, () => {
      if (tokenMining) {
        if (!snapshotToken) {
          return claimBasicToken(inputText, `web-basic-${Date.now()}`)
            .then(({ token, message }) => {
              if (!token) {
                throw new Error("기본 토큰 발급 응답에 token 값이 없습니다.");
              }

              applyIssuedToken("basic", token);
              setOutput(
                makeOutput(
                  "emerald",
                  "token mined",
                  commandEcho,
                  [
                    message ?? "히든 퍼즐 정답. 토큰 채굴 알고리즘(PoV) 가동에 성공했습니다.",
                    "이제 기본 토큰 사용자로 일반 요약을 실행할 수 있습니다.",
                    "발급된 토큰은 아래 current token status 패널에서 확인하고 복사할 수 있습니다."
                  ],
                  0,
                  "BASIC TOKEN ISSUED"
                )
              );
              pushEvent("success", "backend basic token issued.");
            })
            .catch((error) => {
              setOutput(
                makeOutput(
                  "rose",
                  "token claim failed",
                  commandEcho,
                  [getErrorMessage(error, "기본 토큰 발급에 실패했습니다.")],
                  1
                )
              );
              pushEvent(
                "error",
                `basic claim failed: ${getErrorMessage(error, "unknown backend error")}`
              );
            });
        }

        setOutput(
          makeOutput(
            "emerald",
            "token already exists",
            commandEcho,
            ["이미 유효한 토큰을 소지하고 계십니다. 요약AI 정상 작동 중입니다."],
            0
          )
        );
        pushEvent("info", "token mining route hit, but token already existed.");
        return;
      }

      if (!snapshotToken) {
        setOutput(
          makeOutput(
            "rose",
            "access denied",
            commandEcho,
            [
              "접근 권한이 없습니다.",
              "기본 토큰을 먼저 발급받아야 합니다."
            ],
            1
          )
        );
        pushEvent("error", "summary denied because no backend token existed.");
        return;
      }

      return assertTokenAccess(snapshotToken)
        .then(() => {
          const lines = [
            preview.mode === "spaced"
              ? `공백 기준 ${preview.usedWords}개 단어의 첫 글자를 이어붙였습니다.`
              : "공백이 없어 3글자마다 한 글자씩 추출했습니다."
          ];

          if (preview.truncated) {
            lines.push("무료 플랜 제한 발동: 앞의 5단어만 요약했습니다.");
            pushEvent("warning", "free plan limit applied to spaced input.");
          }

          setOutput(
            makeOutput(
              snapshotPro ? "emerald" : "slate",
              "summary complete",
              commandEcho,
              lines,
              0,
              `[${preview.output}]`
            )
          );
          pushEvent("success", `summary emitted: [${preview.output}]`);

          if (Math.random() < 0.2) {
            showAiSuggestionAlert("AI의 추가 제언: 사실 이 문장은 요약할 가치도 없습니다.");
          }
        })
        .catch((error) => {
          if (error instanceof YoaApiError && (error.status === 401 || error.status === 403)) {
            clearIssuedToken();
          }

          setOutput(
            makeOutput(
              "rose",
              "access denied",
              commandEcho,
              [getErrorMessage(error, "백엔드 접근 권한 확인에 실패했습니다.")],
              1
            )
          );
          pushEvent(
            "error",
            `access check failed: ${getErrorMessage(error, "unknown backend error")}`
          );
        });
    });
  };

  return (
    <main className="terminal-page">
      <section className="terminal-shell">
        <header className="terminal-shell-header">
          <div>
            <p className="terminal-kicker">yoa / fake enterprise console</p>
            <h1 className="terminal-title-main">stdin, stdout, event stream</h1>
          </div>
          <p className="terminal-subcopy">
            CLI 조건이 충족될 때만 토큰, 백도어, 파업, Deep Reasoning 이벤트가 나타납니다.
          </p>
        </header>

        <div className="terminal-grid">
          <TextPanel
            basicToken={basicToken}
            copiedToken={copiedToken}
            deepModeEnabled={deepModeEnabled}
            issuedToken={issuedToken}
            loading={loading}
            onCopyToken={handleCopyToken}
            proToken={proToken}
            value={command}
            onChange={setCommand}
            onClear={handleReset}
            onForgetToken={handleForgetToken}
            onSubmit={handleRun}
            onToggleDeep={() => setDeepModeEnabled((current) => !current)}
          />

          <ResultPanel
            activeCommand={activeCommand}
            loading={loading}
            loadingStage={loadingStage}
            output={output}
          />
        </div>

        <SystemLog logs={logs} />
      </section>
    </main>
  );
}
