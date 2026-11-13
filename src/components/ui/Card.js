export default function Card({ as: Tag = "div", className = "", children, ...rest }) {
  return (
    <Tag
      className={`bg-surface border border-border rounded-card p-[30px] box-border flex flex-col gap-2.5 min-w-0 ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// A card inside the animated 2px gradient ring (featured pricing card).
export function FeaturedCard({ className = "", innerClassName = "", children }) {
  return (
    <div className={`gradient-ring flex min-w-0 ${className}`}>
      <div className={`flex-1 min-w-0 bg-surface rounded-card-lg p-[34px] box-border flex flex-col gap-3.5 ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
}
