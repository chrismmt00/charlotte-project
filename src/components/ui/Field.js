// Label + input/textarea + error. Public errors use an fg border, an icon and text (no red on the public site).

export function Label({ htmlFor, required, children }) {
  return (
    <label htmlFor={htmlFor} className="text-xs text-muted-2">
      {children}
      {required ? (
        <span aria-hidden="true" className="text-accent-light">
          {" "}
          *
        </span>
      ) : null}
    </label>
  );
}

export function ErrorIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

export const inputClass =
  "bg-surface-2 border rounded-input px-[17px] py-[15px] text-sm text-fg min-w-0 min-h-12 box-border w-full font-[inherit] transition-colors duration-200 focus:border-border-2";

export default function Field({ id, label, required, error, textarea, className = "", hint, ...rest }) {
  const Tag = textarea ? "textarea" : "input";
  const errId = `${id}-err`;
  return (
    <div className={`flex flex-col gap-1.5 min-w-0 ${className}`}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <Tag
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : hint ? `${id}-hint` : undefined}
        aria-required={required ? true : undefined}
        className={`${inputClass} ${error ? "border-fg" : "border-border"} ${textarea ? "resize-y leading-normal" : ""}`}
        {...rest}
      />
      {hint && !error ? (
        <span id={`${id}-hint`} className="text-xs text-muted-2">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errId} className="text-xs text-fg flex items-center gap-1.5">
          <ErrorIcon />
          {error}
        </span>
      ) : null}
    </div>
  );
}
