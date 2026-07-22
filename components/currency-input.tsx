"use client";

type CurrencyInputProps = React.InputHTMLAttributes<HTMLInputElement>;

function formatCurrencyInput(value: string) {
  const digits = value.replace(/[^\d.]/g, "");
  const [whole = "", decimal = ""] = digits.split(".");
  const normalizedWhole = whole.replace(/^0+(?=\d)/, "") || "0";
  const trimmedDecimal = decimal.slice(0, 2);

  return trimmedDecimal ? `${normalizedWhole}.${trimmedDecimal}` : normalizedWhole;
}

export function CurrencyInput({ className = "", onInput, ...props }: CurrencyInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
      <input
        {...props}
        inputMode="decimal"
        className={`w-full rounded-md border border-zinc-300 px-8 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 ${className}`.trim()}
        onInput={(event) => {
          const input = event.currentTarget;
          const formatted = formatCurrencyInput(input.value);
          if (input.value !== formatted) {
            input.value = formatted;
          }
          onInput?.(event);
        }}
      />
    </div>
  );
}
