import { useRef } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { cn } from "../lib/cn";
import { hightlightCode } from "../lib/hightlightCode";

export function CodeArea(props: {
	code: string;
	setCode(code: string): void;
	className?: string;
}) {
	const hightlightedCodeDivRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// This handler will be triggered when the user scrolls the textarea
	const handleScroll = () => {
		if (textareaRef.current && hightlightedCodeDivRef.current) {
			// Synchronize the scrollTop property of the pre element
			hightlightedCodeDivRef.current.scrollTop = textareaRef.current.scrollTop;
			// Synchronize the scrollLeft property of the pre element
			hightlightedCodeDivRef.current.scrollLeft =
				textareaRef.current.scrollLeft;
		}
	};

	return (
		<div
			className={cn(
				"bg-neutral-900 rounded-xl shadow-lg border border-neutral-700 relative",
				props.className,
			)}
		>
			<div
				ref={hightlightedCodeDivRef}
				className="p-3 font-mono text-wrap absolute inset-0 pointer-events-none overflow-hidden"
			>
				{hightlightCode(props.code)
					.split("\n")
					.map((line) => (
						<pre
							key={line}
							className="min-h-6 text-wrap"
							dangerouslySetInnerHTML={{ __html: line }}
						/>
					))}
			</div>
			<TextareaAutosize
				ref={textareaRef}
				minRows={8}
				onScroll={handleScroll}
				spellCheck="false"
				value={props.code}
				onChange={(e) => {
					props.setCode(e.target.value);
					handleScroll();
				}}
				className="p-3 caret-white field-sizing-content w-full text-white/10 rounded-xl outline-none ring-transparent ring-2 ring-offset-neutral-800 ring-offset-2 focus:ring-blue-600/50 transition font-mono text-wrap"
				data-gramm="false"
			></TextareaAutosize>
		</div>
	);
}
