"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

interface WaitlistFormProps {
  onSuccess?: () => void;
  variant?: "hero" | "default";
  showCounter?: boolean;
}

// Animated counter component that scrolls numbers up
function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true);

      const timer = setTimeout(() => {
        setDisplayValue(value);
        setIsAnimating(false);
      }, 600); // Match CSS transition duration

      return () => clearTimeout(timer);
    }
  }, [value, displayValue]);

  return (
    <div className="relative overflow-hidden h-10 flex items-center justify-center">
      {/* Current number */}
      <span
        className={`text-3xl font-extrabold bg-gradient-to-r from-[#FF2F00] via-[#F2723B] to-[#FF6B35] bg-clip-text text-transparent transition-all duration-600 ease-out ${
          isAnimating
            ? "-translate-y-full opacity-0"
            : "translate-y-0 opacity-100"
        }`}
      >
        {displayValue.toLocaleString()}
      </span>

      {/* Next number (slides up from bottom during animation) */}
      {isAnimating && (
        <span className="text-3xl font-extrabold bg-gradient-to-r from-[#FF2F00] via-[#F2723B] to-[#FF6B35] bg-clip-text text-transparent absolute transition-all duration-600 ease-out translate-y-full opacity-0 animate-slide-up">
          {value.toLocaleString()}
        </span>
      )}
    </div>
  );
}

export default function WaitlistForm({
  onSuccess,
  variant = "default",
  showCounter = false,
}: WaitlistFormProps) {
  const [count, setCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(showCounter);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
  });

  // Fetch waitlist count on mount if counter is shown
  useEffect(() => {
    if (!showCounter) return;

    const fetchCount = async () => {
      try {
        const response = await fetch("/api/waitlist");
        if (response.ok) {
          const data = await response.json();
          setCount(data.count);
        }
      } catch (error) {
        console.error("Error fetching waitlist count:", error);
      } finally {
        setIsLoadingCount(false);
      }
    };

    fetchCount();
  }, [showCounter]);

  const onSubmit = async (data: WaitlistFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Something went wrong");
        return;
      }

      toast.success("You've been added to the waitlist!");
      reset();
      onSuccess?.();

      // Update count after successful submission if counter is shown
      if (showCounter) {
        const countResponse = await fetch("/api/waitlist");
        if (countResponse.ok) {
          const countData = await countResponse.json();
          setCount(countData.count);
        }
      }
    } catch (error) {
      console.error("Error submitting waitlist:", error);
      toast.error("Failed to add to waitlist. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === "hero") {
    return (
      <div className="flex flex-col items-center gap-6 w-full">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto w-full animate-fade-in"
        >
          <div className="flex-1 group">
            <Input
              id="waitlist-email-input"
              type="email"
              placeholder="Enter your email"
              style={{ scrollMarginTop: "40vh" }}
              {...register("email")}
              className={`h-12 text-base transition-all duration-300 bg-white/90 backdrop-blur-sm border-zinc-200 focus:border-[#F2723B] focus:ring-[#F2723B]/20 ${
                errors.email ? "border-red-500 focus-visible:ring-red-500" : ""
              } hover:shadow-md focus:shadow-lg`}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-600 text-center sm:text-left animate-fade-in">
                {errors.email.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 px-8 bg-gradient-to-r from-[#FF2F00] to-[#f5775b] hover:from-[#FF2F00] hover:to-[#FF2F00] text-white font-semibold text-base whitespace-nowrap transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:hover:scale-100 disabled:opacity-70"
          >
            <span className="flex items-center gap-2">
              {isLoading ? "Adding..." : "Join Waitlist"}
              {!isLoading && (
                <svg
                  className="w-4 h-4 animate-pulse"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </span>
          </Button>
        </form>

        {/* Enhanced animated counter */}
        {showCounter && !isLoadingCount && count !== null && (
          <div className="flex items-center gap-4 px-8 py-4 bg-white/95 backdrop-blur-lg rounded-2xl border border-zinc-200/60 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 group">
            {/* Animated number with scrolling effect */}
            <div className="relative">
              <AnimatedCounter value={count} />
              {/* Enhanced glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF2F00]/30 via-[#F2723B]/30 to-[#FF6B35]/30 blur-xl -z-10 opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
            </div>

            {/* Stylized separator */}
            <div className="w-px h-8 bg-gradient-to-b from-transparent via-zinc-300 to-transparent group-hover:via-[#F2723B] transition-colors duration-300"></div>

            {/* Text with smooth animation */}
            <span className="text-zinc-700 font-semibold text-base animate-fade-in group-hover:text-zinc-900 transition-colors duration-300">
              {count === 1 ? "person" : "people"} joined
            </span>

            {/* Subtle sparkle effect */}
            <div className="absolute top-2 right-2 w-1 h-1 bg-[#F2723B] rounded-full animate-ping opacity-40"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto"
    >
      <div className="flex-1">
        <Input
          type="email"
          placeholder="Enter your email"
          {...register("email")}
          className={`h-12 text-base ${
            errors.email ? "border-red-500 focus-visible:ring-red-500" : ""
          }`}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>
      <Button
        type="submit"
        disabled={isLoading}
        className="h-12 px-8 bg-gradient-to-r from-[#FF2F00] to-[#f5775b] hover:from-[#FF2F00] hover:to-[#FF2F00] text-white font-semibold text-base whitespace-nowrap"
      >
        {isLoading ? "Adding..." : "Join Waitlist"}
      </Button>
    </form>
  );
}
