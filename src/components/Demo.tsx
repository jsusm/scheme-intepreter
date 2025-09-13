import { useRef, useState } from "react"
import { Environment, Interpreter } from "../lib/Interpreter"
import { CodeArea } from "./CodeArea"
import { cn } from "../lib/cn";

export type CodeBlockState = {
  code: string;
  output: string[];
  error: string;
  executionOrder: number;
  hide: boolean
}

function TrashIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" /></svg>
}

export function after(milliseconds: number, fn: () => void) {
  return setTimeout(fn, milliseconds);
}

export function Demo() {
  const lastEnvRef = useRef(new Environment())
  const [lastExecution, setLastExecution] = useState(0)
  const [codeBlocks, setCodeBlocks] = useState<CodeBlockState[]>([
    {
      code: '',
      error: '',
      output: [],
      executionOrder: -1,
      hide: false,
    }
  ])

  // const [output, setOutput] = useState<string[]>([])


  function hideBlockOutput(blockIdx: number) {
    setCodeBlocks(codeBlocks.map((b, idx) => idx == blockIdx ? { ...b, hide: true } : b))
  }

  function computeOutput(blockIdx: number) {
    hideBlockOutput(blockIdx)
    const interpreter = new Interpreter(codeBlocks[blockIdx].code, lastEnvRef.current)
    interpreter.interpret()
    const output = interpreter.output
    const error = interpreter.error
    if (error == "") {
      lastEnvRef.current = interpreter.genv
    }
    after(250, () => {
      setCodeBlocks(codeBlocks.map((b, idx) => idx == blockIdx ? { ...b, output, error, executionOrder: lastExecution, hide: false } : b))
      setLastExecution(lastExecution + 1)
    })
  }

  function setCodeBlock(blockIdx: number, code: string) {
    setCodeBlocks(codeBlocks.map((c, idx) => idx == blockIdx ? { ...c, code: code } : c))
  }

  function addNewCodeBlock() {
    setCodeBlocks([...codeBlocks, { code: '', error: '', output: [], executionOrder: -1, hide: false }])
  }

  function deleteCodeBlock(blockIdx: number) {
    setCodeBlocks(codeBlocks.filter((_, idx) => idx != blockIdx))
  }

  return (
    <div className="bg-neutral-950 min-h-screen grid place-items-center text-white px-4 gap-4 py-32">
      <div className="flex flex-col w-lg space-y-8">
        {codeBlocks.map((b, idx) => (
          <div key={idx}>
            <div className="flex gap-2">
              <div className="flex items-center flex-col gap-2 py-2">
                <p className="text-neutral-300 font-mono">[{b.executionOrder == -1 ? " " : b.executionOrder}]</p>
                <button
                  onClick={() => computeOutput(idx)}
                  className="px-2 h-8 flex items-center text-sm rounded-lg bg-blue-600/30 text-white font-medium border-blue-800 border shadow hover:bg-blue-600/50 transition active:bg-blue-600/40">
                  <span className="ml-0.5">▶</span>
                </button>
                <button
                  onClick={() => deleteCodeBlock(idx)}
                  className="px-2 h-8 flex items-center text-sm rounded-lg bg-blue-600/30 text-white font-medium border-blue-800 border shadow hover:bg-blue-600/50 transition active:bg-blue-600/40">
                  <span className="ml-0.5"><TrashIcon /></span>
                </button>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <CodeArea code={b.code} setCode={v => setCodeBlock(idx, v)} />
                <div className={cn("min-h-18 max-h-32 w-full bg-neutral-900 rounded-xl shadow-lg border border-neutral-700 p-2 overflow-scroll text-wrap transition", b.hide ? "opacity-0" : "opacity-100")}>
                  {b.error && (
                    <p className="text-red-300">{b.error}</p>
                  )}
                  <pre>
                    {b.output.join('\n')}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div>
          <button className="w-full h-12 border border-neutral-600 text-neutral-300 hover:bg-neutral-200/10 transition rounded-xl" onClick={addNewCodeBlock}>
            New Code block +
          </button>
        </div>
      </div>
    </div>
    // <div className="bg-neutral-800 min-h-screen grid place-items-center md:grid-cols-2 text-white px-4 gap-4 py-8">
    //   <div className='w-full flex flex-col h-full'>
    //     <div className="flex flex-col flex-1">
    //       <p className='text-neutral-200 text-center text-lg'>Code </p>
    //       <CodeArea className="h-full w-full " code={code} setCode={setCode} />
    //       <div className='flex justify-end'>
    //         <button onClick={computeOutput} className='px-4 py-2 rounded-lg bg-blue-600/50 text-white font-medium border-blue-600 border shadow mt-3 hover:bg-blue-600/70 transition active:bg-blue-600/40'>Evaluate</button>
    //       </div>
    //     </div>
    //   </div>
    //   <div className='w-full flex flex-col gap-4 h-full'>
    //     <div>
    //       <p className='text-neutral-200 text-center text-lg'>Result</p>
    //       <pre className=' max-h-[90dvh] h-full w-full bg-neutral-900 rounded-xl shadow-lg border border-neutral-700 p-2 overflow-scroll text-3xl text-wrap'>
    //         {output.join('\n')}
    //       </pre>
    //     </div>
    //   </div>
    // </div>
  )
}
