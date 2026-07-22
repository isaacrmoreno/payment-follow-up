"use client";

type DigitsInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  allowPlus?: boolean;
};

export function DigitsInput({ allowPlus = false, onInput, ...props }: DigitsInputProps) {
  return (
    <input
      {...props}
      onInput={(event) => {
        const input = event.currentTarget;
        const filtered = allowPlus
          ? input.value.replace(/[^\d+]/g, "")
          : input.value.replace(/\D/g, "");
        if (input.value !== filtered) {
          input.value = filtered;
        }
        onInput?.(event);
      }}
    />
  );
}
