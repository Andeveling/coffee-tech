import { cn } from "@/lib/cn.utils";

const INPUT_BASE_CLASSES =
	"h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20";

type FieldProps = {
	/** Form field name (also used as `id` / `htmlFor` since the two never differ in this app). */
	name: string;
	label: string;
	disabled: boolean;
	type?: "email" | "password" | "text";
	autoComplete?: string;
	error?: string;
};

/**
 * Uncontrolled labeled input. Renders an error message under the input when
 * `error` is set; couples the error message to the input via `aria-describedby`
 * and sets `aria-invalid` so assistive tech announces the failure.
 */
export function Field({
	name,
	label,
	disabled,
	type = "text",
	autoComplete,
	error,
}: FieldProps) {
	const errorId = `${name}-error`;
	return (
		<div className="flex flex-col gap-1.5">
			<label className="font-medium text-sm" htmlFor={name}>
				{label}
			</label>
			<input
				className={cn(INPUT_BASE_CLASSES)}
				id={name}
				name={name}
				type={type}
				disabled={disabled}
				autoComplete={autoComplete}
				aria-invalid={Boolean(error)}
				aria-describedby={error ? errorId : undefined}
			/>
			{error ? (
				<p className="text-destructive text-xs" id={errorId}>
					{error}
				</p>
			) : null}
		</div>
	);
}
