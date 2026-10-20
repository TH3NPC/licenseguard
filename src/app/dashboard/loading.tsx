/** Instant placeholder shown while a dashboard page loads on the server. */
function Bar({ w, h = 12 }: { w: string; h?: number }) {
  return (
    <div
      className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] animate-pulse"
      style={{ width: w, height: h }}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="card p-5 space-y-3">
        <Bar w="38%" h={24} />
        <Bar w="56%" />
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card p-5 space-y-3">
            <Bar w="50%" />
            <Bar w="30%" h={32} />
          </div>
        ))}
      </div>
      <div className="card p-5 space-y-3">
        <Bar w="24%" />
        <Bar w="90%" />
        <Bar w="80%" />
        <Bar w="70%" />
      </div>
    </div>
  );
}
