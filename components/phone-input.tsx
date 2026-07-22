"use client";

import { formatPhoneNumber } from "@/lib/format";

type PhoneInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function PhoneInput({ onInput, maxLength = 14, ...props }: PhoneInputProps) {
  return (
    <input
      {...props}
      maxLength={maxLength}
      onInput={(event) => {
        const input = event.currentTarget;
        const formatted = formatPhoneNumber(input.value);
        if (input.value !== formatted) {
          input.value = formatted;
        }
        onInput?.(event);
      }}
    />
  );
}
