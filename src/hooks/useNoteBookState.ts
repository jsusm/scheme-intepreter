import { useEffect, useReducer } from "react";
import { useDebounce } from "use-debounce";

export type CodeBlockState = {
	code: string;
	output: string[];
	error: string;
	executionOrder: number;
	hide: boolean;
	id: number;
};

export type NotebookEditorState = {
	codeBlocks: CodeBlockState[];
	lastExecution: number;
};

export type NoteBookEditorAction =
	| { type: "addBlock" }
	| { type: "removeBlock"; payload: { idx: number } }
	| { type: "changeCode"; payload: { code: string; idx: number } }
	| {
			type: "setOutput";
			payload: { output: string[]; error: string; idx: number };
	  }
	| { type: "hideOuput"; payload: { idx: number } }
	| { type: "showOutput"; payload: { idx: number } };

function lastId(codeBlocks: CodeBlockState[]) {
	const lastCodeBlock = codeBlocks.at(-1);
	if (!lastCodeBlock) return 0;
	return lastCodeBlock.id;
}

function NoteBookEditorReducer(
	state: NotebookEditorState,
	action: NoteBookEditorAction,
): NotebookEditorState {
	switch (action.type) {
		case "addBlock":
			return {
				...state,
				codeBlocks: [
					...state.codeBlocks,
					{
						code: "",
						error: "",
						output: [],
						executionOrder: -1,
						hide: false,
						id: lastId(state.codeBlocks) + 1,
					},
				],
			};
		case "removeBlock":
			return {
				...state,
				codeBlocks: state.codeBlocks.filter(
					(_, idx) => idx !== action.payload.idx,
				),
			};
		case "changeCode":
			return {
				...state,
				codeBlocks: state.codeBlocks.map((c, idx) =>
					idx === action.payload.idx ? { ...c, code: action.payload.code } : c,
				),
			};
		case "setOutput":
			return {
				...state,
				codeBlocks: state.codeBlocks.map((c, idx) =>
					idx === action.payload.idx
						? {
								...c,
								error: action.payload.error,
								output: action.payload.output,
								executionOrder: state.lastExecution + 1,
							}
						: c,
				),
				lastExecution: state.lastExecution + 1,
			};
		case "hideOuput":
			return {
				...state,
				codeBlocks: state.codeBlocks.map((c, idx) =>
					idx === action.payload.idx ? { ...c, hide: true } : c,
				),
			};
		case "showOutput":
			return {
				...state,
				codeBlocks: state.codeBlocks.map((c, idx) =>
					idx === action.payload.idx ? { ...c, hide: false } : c,
				),
			};
	}
}

function getNoteBookStateFromLS() {
	const data = window.localStorage.getItem("noteBookEditorState");
	if (!data) return null;

	// INFO: should verify this data
	const lastState = JSON.parse(data) as NotebookEditorState;
	lastState.codeBlocks = lastState.codeBlocks.map((v) => ({
		...v,
		executionOrder: -1,
		output: [],
		error: "",
	}));
	return lastState;
}

function saveNoteBookStateToLs(state: NotebookEditorState) {
	localStorage.setItem("noteBookEditorState", JSON.stringify(state));
}

export function useNoteBookState() {
	const [noteBookEditorState, noteBookEditorDispatch] = useReducer(
		NoteBookEditorReducer,
		getNoteBookStateFromLS() ?? {
			lastExecution: 0,
			codeBlocks: [
				{
					code: "",
					error: "",
					executionOrder: -1,
					hide: false,
					id: 0,
					output: [],
				},
			],
		},
	);
	const [debouseState] = useDebounce(noteBookEditorState, 1000);

	useEffect(() => saveNoteBookStateToLs(debouseState), [debouseState]);

	return [noteBookEditorState, noteBookEditorDispatch] as const;
}
