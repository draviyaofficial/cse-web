"use client";

import React, { useState, useEffect } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { checkTickerAvailabilityFn, applyTokenFn } from "@/services/token/api";
import { useUser } from "@/services/auth/model/hooks/useUser";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

// Schema Validation
const tokenSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  symbol: z
    .string()
    .min(2, "Symbol must be at least 2 characters")
    .max(10, "Symbol cannot exceed 10 characters")
    .regex(/^[A-Za-z0-9]+$/, "Symbol must be alphanumeric"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  logoUrl: z.string().url("Invalid URL"),
  initialSupply: z.coerce
    .number()
    .min(1000, "Initial supply must be at least 1000"),
  websiteUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  twitterUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  telegramUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  discordUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type TokenFormValues = z.infer<typeof tokenSchema>;

export default function TokenLaunchPage() {
  const { getAccessToken } = usePrivy();
  const { data: user } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [tickerAvailable, setTickerAvailable] = useState<boolean | null>(null);
  const [checkingTicker, setCheckingTicker] = useState(false);

  const form = useForm<TokenFormValues>({
    resolver: zodResolver(tokenSchema) as any,
    defaultValues: {
      name: "",
      symbol: "",
      description: "",
      logoUrl: "",
      initialSupply: 1000000,
      websiteUrl: "",
      twitterUrl: "",
      telegramUrl: "",
      discordUrl: "",
    },
    mode: "onBlur",
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    trigger,
  } = form;

  const symbol = watch("symbol");

  // Check Ticker Availability
  const checkTicker = async () => {
    if (!symbol || symbol.length < 2) return;
    setCheckingTicker(true);
    try {
      const data = await checkTickerAvailabilityFn(symbol);

      // Prevent race conditions: Ensure the symbol hasn't changed while request was in flight
      if (form.getValues("symbol") !== symbol) return;

      setTickerAvailable(data.available);
      if (!data.available) {
        form.setError("symbol", {
          type: "manual",
          message: "Ticker is already taken",
        });
      } else {
        form.clearErrors("symbol");
      }
    } catch (error) {
      console.error(error);
      setTickerAvailable(false);
    } finally {
      // Only turn off loading if we didn't exit early due to race condition
      if (form.getValues("symbol") === symbol) {
        setCheckingTicker(false);
      }
    }
  };

  // Debounce check ticker
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (symbol && symbol.length >= 2) {
        checkTicker();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [symbol]);

  const mutation = useMutation({
    mutationFn: async (data: TokenFormValues) => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return await applyTokenFn(token, data);
    },
    onSuccess: () => {
      toast.success("Application Submitted!", {
        description: "Your token application is under review.",
      });
      router.push("/dashboard");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit application");
    },
  });

  const onSubmit = (data: TokenFormValues) => {
    if (tickerAvailable === false) {
      form.setError("symbol", {
        type: "manual",
        message: "Ticker is already taken",
      });
      return;
    }
    mutation.mutate(data);
  };

  if (!user || user.role !== "CREATOR") {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-zinc-800">Access Denied</h1>
          <p className="text-zinc-600">
            You must be an approved Creator to launch a token.
          </p>
          <Button onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-zinc-900">Launch Your Token</h1>
        <p className="text-zinc-500">
          Submit your token details for approval. Once approved, you can mint
          and launch your IRO.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Token Details</CardTitle>
          <CardDescription>
            Provide the core information about your asset.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Token Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Draviya DAO"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="symbol">Ticker Symbol</Label>
                <div className="relative">
                  <Input
                    id="symbol"
                    placeholder="e.g. DRV"
                    {...register("symbol")}
                    onBlur={() => {
                      trigger("symbol");
                    }}
                    onChange={(e) => {
                      form.setValue("symbol", e.target.value.toUpperCase());
                      setTickerAvailable(null); // Reset availability status on change
                    }}
                    className="uppercase"
                  />
                  <div className="absolute right-3 top-2.5">
                    {checkingTicker ? (
                      <Loader2 className="animate-spin h-4 w-4 text-zinc-400" />
                    ) : tickerAvailable === true ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : tickerAvailable === false ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : null}
                  </div>
                </div>
                {errors.symbol && (
                  <p className="text-sm text-red-500">
                    {errors.symbol.message}
                  </p>
                )}
                {tickerAvailable === true && (
                  <p className="text-xs text-green-600">Ticker is available</p>
                )}
                {tickerAvailable === false && (
                  <p className="text-xs text-red-600">
                    Ticker is already taken
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your project, utility, and vision..."
                className="resize-none min-h-[100px]"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="initialSupply">Initial Supply</Label>
                <Input
                  id="initialSupply"
                  type="number"
                  placeholder="1000000"
                  {...register("initialSupply")}
                />
                {errors.initialSupply && (
                  <p className="text-sm text-red-500">
                    {errors.initialSupply.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  placeholder="https://..."
                  {...register("logoUrl")}
                />
                {errors.logoUrl && (
                  <p className="text-sm text-red-500">
                    {errors.logoUrl.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-zinc-900 border-b border-zinc-100 pb-2">
                Social Links (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website</Label>
                  <Input
                    id="websiteUrl"
                    placeholder="https://yourproject.com"
                    {...register("websiteUrl")}
                  />
                  {errors.websiteUrl && (
                    <p className="text-sm text-red-500">
                      {errors.websiteUrl.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitterUrl">Twitter / X</Label>
                  <Input
                    id="twitterUrl"
                    placeholder="https://x.com/..."
                    {...register("twitterUrl")}
                  />
                  {errors.twitterUrl && (
                    <p className="text-sm text-red-500">
                      {errors.twitterUrl.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telegramUrl">Telegram</Label>
                  <Input
                    id="telegramUrl"
                    placeholder="https://t.me/..."
                    {...register("telegramUrl")}
                  />
                  {errors.telegramUrl && (
                    <p className="text-sm text-red-500">
                      {errors.telegramUrl.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discordUrl">Discord</Label>
                  <Input
                    id="discordUrl"
                    placeholder="https://discord.gg/..."
                    {...register("discordUrl")}
                  />
                  {errors.discordUrl && (
                    <p className="text-sm text-red-500">
                      {errors.discordUrl.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-[#F2723B] hover:bg-[#e06532] text-white"
                disabled={mutation.isPending || checkingTicker}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
