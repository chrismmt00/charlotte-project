import Link from "next/link";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium min-h-12 box-border transition-[transform,box-shadow,background-color,color,border-color] duration-300 ease-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:opacity-60";

const variants = {
  primary: "bg-fg text-bg border-2 border-transparent px-[30px] py-[15px] hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(78,133,191,.25)]",
  secondary:
    "bg-bg text-fg border-2 border-border px-[30px] py-[15px] hover:-translate-y-0.5 hover:border-border-2",
  ghost: "bg-transparent text-accent-light border-0 px-2 py-3 min-h-11 hover:text-fg",
  link: "bg-transparent text-accent-light border-0 p-0 min-h-11 hover:text-fg",
};

export default function Button({ href, variant = "primary", className = "", children, external, ...rest }) {
  const cls = `${base} ${variants[variant] || variants.primary} ${className}`;
  if (href) {
    const isInternal = href.startsWith("/") || href.startsWith("#");
    if (isInternal && !external) {
      return (
        <Link href={href} className={cls} {...rest}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} className={cls} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button type={rest.type || "button"} className={cls} {...rest}>
      {children}
    </button>
  );
}

export function Arrow({ up = false }) {
  return <span aria-hidden="true">{up ? "↗" : "→"}</span>;
}
