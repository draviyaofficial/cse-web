"use strict";

import * as React from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value: string | undefined;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const CustomPhoneInput = ({
  value,
  onChange,
  className,
  placeholder,
  disabled,
}: PhoneInputProps) => {
  return (
    <PhoneInput
      international
      defaultCountry="US"
      placeholder={placeholder}
      value={value}
      onChange={(val) => onChange(val || "")}
      disabled={disabled}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    />
  );
};
