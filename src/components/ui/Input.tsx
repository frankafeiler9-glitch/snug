type Props = React.InputHTMLAttributes<HTMLInputElement> & { label: string };

// A labelled, rounded text field.
export function Input({ label, className = "", ...props }: Props) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      <input
        {...props}
        className={`h-12 w-full rounded-2xl border border-border bg-surface px-4 text-base outline-none focus:border-accent ${className}`}
      />
    </label>
  );
}
