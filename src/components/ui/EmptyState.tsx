export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card p-8 text-center">
      <h3 className="text-2xl">{title}</h3>
      {body ? (
        <p className="mt-1 text-sm text-[var(--color-muted)] max-w-sm mx-auto">
          {body}
        </p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
