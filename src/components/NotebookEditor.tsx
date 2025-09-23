import { useRef } from "react";
import { useNoteBookState } from "../hooks/useNoteBookState";
import { Environment } from "../lib/Environment";
import { Interpreter } from "../lib/Interpreter";
import { CodeBlockEditor } from "./CodeBlockEditor";

export function after(milliseconds: number, fn: () => void) {
	return setTimeout(fn, milliseconds);
}

export function NotebookEditor() {
	const lastEnvRef = useRef(new Environment());
	const [noteBookEditorState, noteBookEditorDispatch] = useNoteBookState();

	function computeOutput(blockIdx: number) {
		noteBookEditorDispatch({ type: "hideOuput", payload: { idx: blockIdx } });
		const interpreter = new Interpreter(
			noteBookEditorState.codeBlocks[blockIdx].code,
			lastEnvRef.current,
		);
		interpreter.interpret();
		const output = interpreter.output;
		const error = interpreter.error;
		if (error === "") {
			lastEnvRef.current = interpreter.genv;
		}
		after(250, () => {
			noteBookEditorDispatch({
				type: "setOutput",
				payload: { error, output, idx: blockIdx },
			});
			noteBookEditorDispatch({
				type: "showOutput",
				payload: { idx: blockIdx },
			});
		});
	}

	return (
		<div className="flex flex-col space-y-8">
			{noteBookEditorState.codeBlocks.map((b, idx) => (
				<CodeBlockEditor
					key={b.id}
					onRun={() => computeOutput(idx)}
					onCodeUpdate={(v) =>
						noteBookEditorDispatch({
							type: "changeCode",
							payload: { idx, code: v },
						})
					}
					onDelete={() =>
						noteBookEditorDispatch({ type: "removeBlock", payload: { idx } })
					}
					block={b}
				/>
			))}
			<div>
				<button
					type="button"
					className="w-full h-12 border border-neutral-600 text-neutral-300 hover:bg-neutral-200/10 transition rounded-xl"
					onClick={() => noteBookEditorDispatch({ type: "addBlock" })}
				>
					New Code block +
				</button>
			</div>
		</div>
	);
}
