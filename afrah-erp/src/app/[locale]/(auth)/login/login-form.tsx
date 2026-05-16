"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Eye, EyeOff } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginData) {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    // Drop any cached data from a previous session, then prefetch the new user's profile
    // so the layout/sidebar render with fresh permissions immediately.
    queryClient.clear();
    await queryClient.prefetchQuery({
      queryKey: ["myProfile"],
      queryFn: async () => {
        const { data, error: profileError } = await supabase.rpc(
          "get_my_profile"
        );
        if (profileError) throw new Error(profileError.message);
        return data;
      },
    });

    router.replace(`/${locale}/dashboard`);
  }

  return (
    <div className="w-full">
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-2.5 mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary shadow-[0_2px_8px_oklch(0.50_0.22_264/0.4)]">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold">Afrah ERP</span>
      </div>

      <div className="mb-7">
        <h2 className="text-2xl font-bold tracking-tight">
          {t("loginButton")}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("loginSubtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="nada@afrah.eg"
            {...register("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <span>⚠</span> {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">{t("password")}</Label>
            <button
              type="button"
              className="text-xs text-primary hover:text-primary/80 hover:underline underline-offset-2 transition-colors"
            >
              {t("forgotPassword")}
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPass ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
              aria-invalid={!!errors.password}
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-lg hover:bg-muted/60"
              onClick={() => setShowPass((v) => !v)}
            >
              {showPass ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <span>⚠</span> {errors.password.message}
            </p>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2.5 text-sm text-destructive bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <span className="shrink-0 mt-0.5">⚠</span>
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full mt-1" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("loginButton")}
        </Button>
      </form>
    </div>
  );
}
