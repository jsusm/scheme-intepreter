import { useRef, useState } from "react";
import { Environment, Interpreter } from "../lib/Interpreter";
import { CodeBlockEditor } from "./CodeBlockEditor";

export type CodeBlockState = {
  code: string;
  output: string[];
  error: string;
  executionOrder: number;
  hide: boolean;
  id: number;
};

export function after(milliseconds: number, fn: () => void) {
  return setTimeout(fn, milliseconds);
}

export function NotebookEditor() {
  const lastEnvRef = useRef(new Environment());
  const [lastExecution, setLastExecution] = useState(0);
  const [lastId, setLastId] = useState(0);
  const [codeBlocks, setCodeBlocks] = useState<CodeBlockState[]>([
    {
      id: lastId,
      code: "",
      error: "",
      output: [],
      executionOrder: -1,
      hide: false,
    },
  ]);

  function hideBlockOutput(blockIdx: number) {
    setCodeBlocks(
      codeBlocks.map((b, idx) => (idx == blockIdx ? { ...b, hide: true } : b)),
    );
  }

  function computeOutput(blockIdx: number) {
    hideBlockOutput(blockIdx);
    const interpreter = new Interpreter(
      codeBlocks[blockIdx].code,
      lastEnvRef.current,
    );
    interpreter.interpret();
    const output = interpreter.output;
    const error = interpreter.error;
    if (error == "") {
      lastEnvRef.current = interpreter.genv;
    }
    after(250, () => {
      setCodeBlocks(
        codeBlocks.map((b, idx) =>
          idx == blockIdx
            ? {
                ...b,
                output,
                error,
                executionOrder: lastExecution,
                hide: false,
              }
            : b,
        ),
      );
      setLastExecution(lastExecution + 1);
    });
  }

  function setCodeBlock(blockIdx: number, code: string) {
    setCodeBlocks(
      codeBlocks.map((c, idx) => (idx == blockIdx ? { ...c, code: code } : c)),
    );
  }

  function addNewCodeBlock() {
    setCodeBlocks([
      ...codeBlocks,
      {
        code: "",
        error: "",
        output: [],
        executionOrder: -1,
        hide: false,
        id: lastId,
      },
    ]);
    setLastId(lastId + 1);
  }

  function deleteCodeBlock(blockIdx: number) {
    setCodeBlocks(codeBlocks.filter((_, idx) => idx != blockIdx));
  }

  return (
    <div className="flex flex-col w-lg space-y-8">
      {codeBlocks.map((b, idx) => (
        <CodeBlockEditor
          key={b.id}
          onRun={() => computeOutput(idx)}
          onCodeUpdate={(v) => setCodeBlock(idx, v)}
          onDelete={() => deleteCodeBlock(idx)}
          block={b}
        />
      ))}
      <div>
        <button
          className="w-full h-12 border border-neutral-600 text-neutral-300 hover:bg-neutral-200/10 transition rounded-xl"
          onClick={addNewCodeBlock}
        >
          New Code block +
        </button>
      </div>
    </div>
  );
}
