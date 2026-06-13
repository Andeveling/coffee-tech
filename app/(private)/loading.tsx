export default function PrivateLoading() {
	return (
		<div className="flex flex-1 items-center justify-center p-6">
			<div
				className="size-8 animate-spin rounded-full border-2 border-muted border-t-foreground"
				role="status"
				aria-label="Cargando"
			/>
		</div>
	);
}
