import type { CodeBlockState } from "../hooks/useNoteBookState.ts";
import { cn } from "../lib/cn";
import { CodeArea } from "./CodeArea.tsx";

function TrashIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="1.2em"
			height="1.2em"
			viewBox="0 0 24 24"
		>
			<title>Trash icon</title>
			<path
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
				d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"
			/>
		</svg>
	);
}

export type CodeBlockEditorProps = {
	onRun(): void;
	onDelete(): void;
	onCodeUpdate(code: string): void;
	block: CodeBlockState;
};

export function CodeBlockEditor({
	onRun,
	onDelete,
	onCodeUpdate,
	block,
}: CodeBlockEditorProps) {
	return (
		<div className="flex gap-2">
			<div className="flex items-center flex-col gap-2 py-2">
				<p className="text-neutral-300 font-mono">
					[{block.executionOrder === -1 ? " " : block.executionOrder}]
				</p>
				<button
					type="button"
					onClick={onRun}
					className="px-2 h-8 flex items-center text-sm rounded-lg bg-blue-600/30 text-white font-medium border-blue-800 border shadow hover:bg-blue-600/50 transition active:bg-blue-600/40"
				>
					<span className="ml-0.5">▶</span>
				</button>
				<button
					type="button"
					onClick={onDelete}
					className="px-2 h-8 flex items-center text-sm rounded-lg bg-blue-600/30 text-white font-medium border-blue-800 border shadow hover:bg-blue-600/50 transition active:bg-blue-600/40"
				>
					<span className="ml-0.5">
						<TrashIcon />
					</span>
				</button>
			</div>
			<div className="flex-1 flex flex-col gap-2">
				<CodeArea code={block.code} setCode={(v) => onCodeUpdate(v)} />
				<div
					style={{ scrollbarWidth: "none" }}
					className={cn(
						"min-h-18 max-h-32 w-full bg-neutral-900 rounded-xl shadow-lg border border-neutral-700 p-2 overflow-scroll text-wrap transition",
						block.hide ? "opacity-0" : "opacity-100",
					)}
				>
					{block.error && <p className="text-red-300">{block.error}</p>}
					<pre>{block.output.join("\n")}</pre>
				</div>
			</div>
		</div>
	);
}
