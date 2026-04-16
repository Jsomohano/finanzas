export default function DashboardLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div>
        <div className="h-7 w-40 bg-muted rounded" />
        <div className="h-4 w-56 bg-muted rounded mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="h-3 w-24 bg-muted rounded" />
            <div className="h-8 w-32 bg-muted rounded" />
            <div className="h-3 w-20 bg-muted rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-3 border rounded-lg h-48 bg-muted/40" />
        <div className="md:col-span-2 border rounded-lg h-48 bg-muted/40" />
      </div>
      <div className="border rounded-lg h-48 bg-muted/40" />
    </div>
  );
}
