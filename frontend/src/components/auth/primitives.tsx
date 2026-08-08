import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import logoAsset from "@/assets/marudhar-logo.png";
import { cn } from "@/lib/utils";

/* ---------------------------------- Logo --------------------------------- */

export function BrandLogo({
  size = 44,
  withText = true,
  invert = false,
}: {
  size?: number | undefined;
  withText?: boolean | undefined;
  invert?: boolean | undefined;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="relative grid shrink-0 place-items-center rounded-2xl bg-card p-1.5 shadow-[0_10px_30px_-14px_oklch(0.3_0.12_265/0.7)] ring-1 ring-border/60 transition-transform duration-500 hover:scale-105"
        style={{ width: size, height: size }}
      >
        <img
          src={logoAsset.src}
          alt="Marudhar Defence Academy logo"
          width={size}
          height={size}
          className="h-full w-full rounded-xl object-contain"
        />
      </span>
      {withText && (
        <span className="leading-tight">
          <span
            className={cn(
              "block font-bold tracking-tight text-sm uppercase",
              invert ? "text-white" : "text-slate-900",
            )}
          >
            MARUDHAR DEFENCE
          </span>
          <span
            className={cn(
              "block text-[0.68rem] tracking-[0.15em] uppercase font-bold text-red-600",
              invert ? "text-amber-300" : "text-red-650",
            )}
          >
            SEC. SCHOOL
          </span>
        </span>
      )}
    </div>
  );
}

/* --------------------------------- Button -------------------------------- */

type Ripple = { id: number; x: number; y: number };

export function BrandButton({
  children,
  onClick,
  type = "button",
  loading = false,
  success = false,
  disabled = false,
  variant = "primary",
  className,
  icon: Icon,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: (() => void) | undefined;
  type?: "button" | "submit";
  loading?: boolean;
  success?: boolean;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "outline";
  className?: string | undefined;
  icon?: LucideIcon | undefined;
  ariaLabel?: string | undefined;
}) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  return (
    <button
      type={type}
      aria-label={ariaLabel}
      aria-busy={loading}
      disabled={disabled || loading}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const id = Date.now();
        setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
        setTimeout(() => setRipples((r) => r.filter((p) => p.id !== id)), 620);
        onClick?.();
      }}
      className={cn(
        "group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-300",
        "active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70",
        variant === "primary" &&
          "text-primary-foreground shadow-[var(--shadow-glow)] hover:-translate-y-0.5 hover:shadow-[0_24px_54px_-18px_oklch(0.45_0.19_265/0.75)]",
        variant === "outline" &&
          "border border-border bg-card/70 text-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card",
        variant === "ghost" && "text-muted-foreground hover:text-foreground",
        className,
      )}
      style={
        variant === "primary"
          ? {
              backgroundImage: success
                ? "linear-gradient(120deg, oklch(0.62 0.15 155), oklch(0.68 0.14 150))"
                : "var(--gradient-sunrise)",
            }
          : undefined
      }
    >
      {variant === "primary" && (
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent,oklch(1_0_0/0.28),transparent)] transition-transform duration-700 group-hover:translate-x-full" />
      )}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute h-2 w-2 animate-[ring-pulse_0.6s_ease-out_forwards] rounded-full bg-current opacity-40"
          style={{ left: r.x, top: r.y, transform: "scale(12)" }}
        />
      ))}
      <span className="relative z-10 inline-flex items-center gap-2">
        {loading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : success ? (
          <Check className="size-4 animate-pop" aria-hidden />
        ) : Icon ? (
          <Icon className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
        ) : null}
        {children}
      </span>
    </button>
  );
}

/* ---------------------------------- Field -------------------------------- */

export function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  icon: Icon,
  autoComplete,
  error,
  hint,
  inputMode,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  icon?: LucideIcon | undefined;
  autoComplete?: string | undefined;
  error?: string | undefined;
  hint?: string | undefined;
  inputMode?: "text" | "email" | "tel" | "numeric" | undefined;
}) {
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  const floated = focused || value.length > 0;

  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          "group relative rounded-xl border bg-card/70 transition-all duration-300",
          focused && "border-primary/60 shadow-[0_0_0_4px_oklch(0.45_0.19_265/0.12)]",
          !focused && !error && "border-border hover:border-primary/30",
          error && "border-destructive/70 shadow-[0_0_0_4px_oklch(0.58_0.21_25/0.1)]",
        )}
      >
        {Icon && (
          <Icon
            aria-hidden
            className={cn(
              "pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 transition-colors duration-300",
              focused ? "text-primary" : "text-muted-foreground",
            )}
          />
        )}
        <label
          htmlFor={id}
          className={cn(
            "pointer-events-none absolute origin-left transition-all duration-200",
            Icon ? "left-10" : "left-4",
            floated
              ? "top-1.5 text-[0.68rem] font-medium tracking-wide text-muted-foreground"
              : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground",
          )}
        >
          {label}
        </label>
        <input
          id={id}
          type={isPassword && reveal ? "text" : type}
          value={value}
          inputMode={inputMode}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full bg-transparent pt-5 pb-2 text-sm text-foreground outline-none",
            Icon ? "pl-10" : "pl-4",
            isPassword ? "pr-11" : "pr-4",
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-3 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-all duration-300 hover:scale-110 hover:bg-muted hover:text-foreground"
          >
            {reveal ? <EyeOff className="size-4 animate-pop" /> : <Eye className="size-4 animate-pop" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="animate-rise flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="size-3.5" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------ Error banner ----------------------------- */

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div
      role="alert"
      className="animate-shake flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
      <p className="flex-1 text-sm text-destructive">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="text-xs font-medium text-destructive/70 transition-colors hover:text-destructive"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

/* ----------------------------- Success check ----------------------------- */

export function SuccessCheck({ tone = "success" }: { tone?: "success" | "brand" }) {
  const stroke = tone === "success" ? "var(--success)" : "var(--primary)";
  return (
    <div className="relative mx-auto grid size-24 place-items-center">
      <span
        className="animate-ring-pulse absolute inset-0 rounded-full"
        style={{ background: `color-mix(in oklab, ${stroke} 22%, transparent)` }}
      />
      <span
        className="absolute inset-2 rounded-full"
        style={{ background: `color-mix(in oklab, ${stroke} 12%, transparent)` }}
      />
      <svg viewBox="0 0 52 52" className="relative size-16" aria-hidden>
        <circle
          cx="26"
          cy="26"
          r="23"
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeDasharray="160"
          strokeDashoffset="160"
          className="animate-draw"
        />
        <path
          d="M15 27 L23 34 L38 19"
          fill="none"
          stroke={stroke}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="40"
          strokeDashoffset="40"
          style={{ animation: "draw 0.5s cubic-bezier(0.65,0,0.35,1) 0.55s forwards" }}
        />
      </svg>
    </div>
  );
}

/* ----------------------------- Password meter ---------------------------- */

export function passwordScore(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

export function PasswordStrength({ value }: { value: string }) {
  const score = passwordScore(value);
  const labels = ["Too weak", "Weak", "Fair", "Strong", "Excellent"];
  const colors = [
    "var(--destructive)",
    "var(--ember)",
    "var(--gold)",
    "var(--success)",
    "var(--success)",
  ];
  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-1.5 flex-1 rounded-full transition-all duration-500"
            style={{
              background: i < score ? colors[score] : "var(--muted)",
              transform: i < score ? "scaleY(1.15)" : "scaleY(1)",
            }}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength:{" "}
        <span className="font-medium" style={{ color: value ? colors[score] : undefined }}>
          {value ? labels[score] : "—"}
        </span>
      </p>
    </div>
  );
}

/* --------------------------------- OTP ----------------------------------- */

export function OtpInput({
  length = 6,
  value,
  onChange,
}: {
  length?: number | undefined;
  value: string;
  onChange: (v: string) => void;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const chars = value.padEnd(length, " ").slice(0, length).split("");

  function setChar(index: number, char: string) {
    const next = chars.map((c, i) => (i === index ? char : c)).join("").trimEnd();
    onChange(next.replace(/\s/g, ""));
  }

  return (
    <div className="flex justify-between gap-2" role="group" aria-label="One-time passcode">
      {chars.map((char, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={char.trim()}
          inputMode="numeric"
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
            onChange(pasted);
            refs.current[Math.min(pasted.length, length - 1)]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !char.trim() && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
          }}
          onChange={(e) => {
            const digit = e.target.value.replace(/\D/g, "").slice(-1);
            setChar(i, digit || " ");
            if (digit && i < length - 1) refs.current[i + 1]?.focus();
          }}
          className={cn(
            "h-14 w-full rounded-xl border bg-card/70 text-center text-xl font-semibold text-foreground outline-none transition-all duration-300",
            char.trim()
              ? "border-primary/60 shadow-[0_0_0_4px_oklch(0.45_0.19_265/0.1)]"
              : "border-border hover:border-primary/30",
            "focus:-translate-y-0.5 focus:border-primary focus:shadow-[0_0_0_4px_oklch(0.45_0.19_265/0.16)]",
          )}
        />
      ))}
    </div>
  );
}

/* ------------------------------ Social button ---------------------------- */

export function SocialButton({
  provider,
  onClick,
}: {
  provider: "google" | "microsoft";
  onClick?: (() => void) | undefined;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-card/70 px-4 py-2.5 text-sm font-medium text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-[0_16px_36px_-22px_oklch(0.3_0.12_265/0.7)]"
    >
      <span className="transition-transform duration-300 group-hover:scale-110">
        {provider === "google" ? <GoogleMark /> : <MicrosoftMark />}
      </span>
      Continue with {provider === "google" ? "Google" : "Microsoft"}
    </button>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6z" />
      <path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.6 14.7a7.2 7.2 0 0 1 0-4.6v-3H1.8a12 12 0 0 0 0 10.6l3.8-3z" />
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3A11.6 11.6 0 0 0 12 0 12 12 0 0 0 1.8 6.1l3.8 3C6.5 6.7 9 4.8 12 4.8z" />
    </svg>
  );
}

function MicrosoftMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#F25022" d="M2 2h9.5v9.5H2z" />
      <path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z" />
      <path fill="#00A4EF" d="M2 12.5h9.5V22H2z" />
      <path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z" />
    </svg>
  );
}

/* ------------------------------- Screen head ----------------------------- */

export function ScreenHead({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string | undefined;
  title: string;
  subtitle?: string | undefined;
}) {
  return (
    <div className="space-y-2">
      {eyebrow && (
        <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-primary uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="text-2xl font-bold text-foreground sm:text-[1.75rem]">{title}</h1>
      {subtitle && <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function IllustrationBadge({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="relative mx-auto grid size-28 place-items-center">
      <span
        className="animate-ring-pulse absolute inset-0 rounded-full"
        style={{ background: "oklch(0.45 0.19 265 / 0.18)" }}
      />
      <span
        className="animate-float-mid absolute inset-3 rounded-full"
        style={{ backgroundImage: "var(--gradient-sunrise)", opacity: 0.16 }}
      />
      <span
        className="animate-float-slow grid size-20 place-items-center rounded-3xl text-primary-foreground shadow-[var(--shadow-glow)]"
        style={{ backgroundImage: "var(--gradient-sunrise)" }}
      >
        <Icon className="size-9" aria-hidden />
      </span>
    </div>
  );
}
