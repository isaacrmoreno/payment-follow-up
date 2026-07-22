"use client";

type TitleInputProps = React.InputHTMLAttributes<HTMLInputElement>;

function capitalizeWords(value: string) {
  return value.replace(/\b([a-z])/g, (match) => match.toUpperCase());
}

export function TitleInput({ onInput, onBlur, ...props }: TitleInputProps) {
  return (
    <input
      {...props}
      onInput={(event) => {
        const input = event.currentTarget;
        const formatted = capitalizeWords(input.value);
        if (input.value !== formatted) {
          input.value = formatted;
        }
        onInput?.(event);
      }}
      onBlur={(event) => {
        const input = event.currentTarget;
        input.value = capitalizeWords(input.value.trim());
        onBlur?.(event);
      }}
    />
  );
}
