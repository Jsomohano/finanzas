export default function AccountsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-28 bg-muted rounded" />
          <div className="h-4 w-40 bg-muted rounded" />
        </div>
        <div className="h-9 w-36 bg-muted rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-5 w-16 bg-muted rounded-full" />
            </div>
            <div className="h-8 w-40 bg-muted rounded" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
