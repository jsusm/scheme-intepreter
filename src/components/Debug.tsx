import { useMemo, useState } from "react";
import { Lexer, type TokenType } from "../lib/Lexer";
import { Parser } from "../lib/Parser";
import { Interpreter } from "../lib/Interpreter";
import { CodeArea } from "./CodeArea";

export function Debug() {
  const [code, setCode] = useState("");

  const tokens = useMemo(() => {
    const lexer = new Lexer(code);
    const tokens = [];
    let nextToken: TokenType;
    do {
      nextToken = lexer.eat();
      tokens.push(nextToken);
    } while (nextToken.type != "EOF" && nextToken.type != "Unexpected");

    return tokens;
  }, [code]);

  const ast = useMemo(() => {
    try {
      return new Parser(code).Parse();
    } catch (error) {
      return { error: (error as Error).message };
    }
  }, [code]);

  const [output, setOutput] = useState<string[]>([]);

  function computeOutput() {
    setOutput(new Interpreter(code).interpret());
  }

  return (
    <div className="bg-neutral-800 min-h-screen grid place-items-center md:grid-cols-2 text-white px-4 gap-4 py-8">
      <div className="w-full flex flex-col h-full min-h-80">
        <div className="flex flex-col flex-1">
          <p className="text-neutral-200 text-center text-lg">Code</p>
          <CodeArea code={code} setCode={setCode} className="h-full w-full" />
          <div className="flex justify-end">
            <button
              onClick={computeOutput}
              className="px-4 py-2 rounded-lg bg-blue-600/50 text-white font-medium border-blue-600 border shadow mt-3 hover:bg-blue-600/70 transition active:bg-blue-600/40"
            >
              Evaluate
            </button>
          </div>
        </div>
      </div>
      <div className="w-full flex flex-col gap-4 h-full min-h-80">
        <div>
          <p className="text-neutral-200 text-center text-lg">Result</p>
          <pre className=" max-h-[90dvh] h-full w-full bg-neutral-900 rounded-xl shadow-lg border border-neutral-700 p-2 overflow-scroll text-3xl">
            {output.join("\n")}
          </pre>
        </div>
      </div>
      <div className="w-full h-full">
        <div className="flex flex-col">
          <p className="text-neutral-200 text-center text-lg">Lexer</p>
          <pre className="h-full w-full bg-neutral-900 rounded-xl shadow-lg border border-neutral-700 p-2 overflow-scroll text-sm">
            {JSON.stringify(tokens, null, 2)}
          </pre>
        </div>
      </div>
      <div className="w-full flex flex-col gap-4 h-full">
        <div className="flex flex-col">
          <p className="text-neutral-200 text-center text-lg">Parser</p>
          <pre className="h-full w-full max-h-[90dvh] bg-neutral-900 rounded-xl shadow-lg border border-neutral-700 p-2 overflow-scroll text-sm">
            {JSON.stringify(ast, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
