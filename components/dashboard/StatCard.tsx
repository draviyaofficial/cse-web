import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
}

export function StatCard({ title, value, change, changeType, icon: Icon }: StatCardProps) {
  const changeColor = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-zinc-500",
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">{value}</p>
        </div>
        <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Icon className="h-5 w-5 text-indigo-600" />
        </div>
      </div>
      <div className="mt-4">
        <p className={cn("text-sm font-medium", changeColor[changeType])}>
          {change}
        </p>
      </div>
    </div>
  );
}


