import { useEffect, useRef, useState, type ReactNode } from "react";
import { Award, BookOpen, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import heroImage from "@/assets/auth-hero.jpg";
import { BrandLogo } from "./primitives";

/** Animated gradient blobs, light rays and drifting particles. */
export function AuthBackdrop() {
  const particles = Array.from({ length: 18 });
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-background" />
      <div
        className="animate-drift absolute -top-40 -left-32 size-[42rem] rounded-full opacity-35 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.45 0.19 265 / 0.55), transparent 65%)" }}
      />
      <div
        className="animate-drift absolute -right-40 -bottom-52 size-[44rem] rounded-full opacity-40 blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.84 0.16 88 / 0.5), transparent 65%)",
          animationDelay: "-8s",
        }}
      />
      <div
        className="animate-float-slow absolute top-1/3 left-1/2 size-[26rem] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.7 0.17 48 / 0.5), transparent 68%)" }}
      />
      <div
        className="animate-sheen absolute inset-x-0 top-0 h-[60vh]"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.86 0.15 92 / 0.16), transparent 70%)",
        }}
      />
      {particles.map((_, i) => (
        <span
          key={i}
          className="animate-float-mid absolute rounded-full"
          style={{
            left: `${(i * 137) % 100}%`,
            top: `${(i * 53) % 100}%`,
            width: `${3 + (i % 4)}px`,
            height: `${3 + (i % 4)}px`,
            background: i % 3 === 0 ? "var(--gold)" : "var(--primary)",
            opacity: 0.18 + (i % 5) * 0.05,
            animationDelay: `${i * 0.42}s`,
            animationDuration: `${6 + (i % 5)}s`,
          }}
        />
      ))}
    </div>
  );
}

const highlights = [
  { icon: ShieldCheck, label: "Discipline" },
  { icon: BookOpen, label: "Academics" },
  { icon: GraduationCap, label: "Selection" },
  { icon: Award, label: "Achievement" },
];

function HeroPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function onMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      setTilt({
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
      });
    }
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <aside
      ref={ref}
      className="relative hidden overflow-hidden lg:block"
      style={{ backgroundImage: "var(--gradient-sunrise)" }}
    >
      <img
        src={heroImage.src}
        alt="Marudhar Defence Academy campus at sunrise with cadets, books and achievement emblems"
        width={1280}
        height={1600}
        className="absolute inset-0 h-full w-full object-cover opacity-70 mix-blend-luminosity transition-transform duration-[1200ms] ease-out"
        style={{ transform: `scale(1.06) translate(${tilt.x * -10}px, ${tilt.y * -10}px)` }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.32 0.16 268 / 0.86), oklch(0.4 0.16 262 / 0.6) 45%, oklch(0.72 0.16 60 / 0.5))",
        }}
      />
      <div
        className="animate-float-slow absolute top-24 right-16 size-28 rounded-full blur-2xl"
        style={{ background: "oklch(0.86 0.15 92 / 0.45)" }}
      />

      <div className="relative flex h-full flex-col justify-between p-12 xl:p-14">
        <BrandLogo size={52} invert />

        <div
          className="max-w-lg text-primary-foreground"
          style={{ transform: `translate(${tilt.x * 6}px, ${tilt.y * 6}px)`, transition: "transform 300ms ease-out" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-1 text-[0.7rem] font-medium tracking-[0.18em] uppercase backdrop-blur-md">
            <Sparkles className="size-3.5" aria-hidden /> Est. Rajasthan
          </span>
          <h2 className="mt-6 text-[2.75rem] leading-[1.05] font-extrabold xl:text-5xl">
            Discipline Today.
            <span className="block text-gradient-brand">Leaders Tomorrow.</span>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-primary-foreground/80">
            Secure access for students, parents, teachers and school administrators.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3">
            {highlights.map(({ icon: Icon, label }, i) => (
              <div
                key={label}
                className="animate-float-mid flex items-center gap-3 rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 px-4 py-3 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-primary-foreground/16"
                style={{ animationDelay: `${i * 0.7}s`, animationDuration: `${7 + i}s` }}
              >
                <Icon className="size-4 text-gold" aria-hidden />
                <span className="text-sm font-medium text-primary-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs tracking-[0.2em] text-primary-foreground/60 uppercase">
          Marudhar Defence Academy · Secure Portal
        </p>
      </div>
    </aside>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthBackdrop />
      <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
        <HeroPanel />
        <main className="flex flex-col items-center justify-center px-5 py-10 sm:px-10">
          <div className="mb-8 lg:hidden">
            <BrandLogo size={46} />
          </div>
          <div className="animate-rise glass-card w-full max-w-md rounded-3xl p-7 sm:p-9">
            {children}
          </div>
          <AuthFooter />
        </main>
      </div>
    </>
  );
}

function AuthFooter() {
  return (
    <footer className="mt-8 w-full max-w-md text-center">
      <p className="text-xs font-medium text-foreground/70">Marudhar Defence Academy</p>
      <nav aria-label="Legal" className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {["Privacy Policy", "Terms", "Help"].map((item) => (
          <a
            key={item}
            href="#"
            className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            {item}
          </a>
        ))}
        <span className="text-xs text-muted-foreground/70">v1.0.0</span>
      </nav>
    </footer>
  );
}
