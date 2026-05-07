import { getTranslations } from "next-intl/server";
import { Sparkles } from "lucide-react";
import { LoginForm } from "./login-form";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: `${t("login")} · Afrah ERP` };
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[52%] flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, oklch(0.18 0.06 264) 0%, oklch(0.26 0.10 280) 40%, oklch(0.20 0.08 245) 100%)",
        }}
      >
        {/* Animated gradient blobs */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, oklch(0.60 0.22 264), transparent 70%)" }}
        />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, oklch(0.65 0.20 300), transparent 70%)" }}
        />
        <div className="absolute top-1/3 -right-16 h-64 w-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, oklch(0.68 0.18 220), transparent 70%)" }}
        />

        {/* Grid texture overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(oklch(1 0 0 / 1) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 max-w-sm text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl ring-1 ring-white/20 shadow-[0_8px_32px_oklch(0_0_0/0.4),_inset_0_1px_0_oklch(1_0_0/0.15)]"
              style={{ background: "linear-gradient(135deg, oklch(1 0 0 / 0.15) 0%, oklch(1 0 0 / 0.05) 100%)" }}
            >
              <Sparkles className="h-9 w-9 text-white drop-shadow-lg" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">نظام أفراح</h1>
          <p className="text-xl font-light text-white/70 mb-1.5">Afrah Venue ERP</p>
          <p className="text-sm text-white/40 leading-relaxed">
            The modern way to manage<br />Egyptian wedding venues
          </p>

          <div className="mt-12 grid grid-cols-2 gap-3">
            {[
              { label: "Bookings", value: "Managed", icon: "📋" },
              { label: "Inquiries", value: "Tracked", icon: "💬" },
              { label: "Payments", value: "Logged", icon: "💳" },
              { label: "Notifications", value: "Realtime", icon: "🔔" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-4 text-left ring-1 ring-white/10 transition-all duration-200 hover:ring-white/20 hover:scale-[1.02]"
                style={{ background: "oklch(1 0 0 / 0.07)" }}
              >
                <p className="text-lg mb-1">{stat.icon}</p>
                <p className="text-xs text-white/40 mb-0.5 font-medium uppercase tracking-wide">{stat.label}</p>
                <p className="text-sm font-semibold text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex flex-1 items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm">
          <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-[0_4px_24px_oklch(0_0_0/0.08),_0_1px_4px_oklch(0_0_0/0.05)]">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
