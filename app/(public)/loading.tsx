export default function PublicLoading() {
	return (
		<div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-card p-8 shadow-sm">
			<div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
			<div className="flex flex-col gap-2">
				<div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
				<div className="h-9 animate-pulse rounded bg-muted" />
			</div>
			<div className="flex flex-col gap-2">
				<div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
				<div className="h-9 animate-pulse rounded bg-muted" />
			</div>
			<div className="h-9 animate-pulse rounded bg-muted" />
		</div>
	);
}
