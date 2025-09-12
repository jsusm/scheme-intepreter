import { useState } from "react"
import { Interpreter } from "../lib/Interpreter"

export function Demo() {
  const [code, setCode] = useState('')

  const [output, setOutput] = useState<string[]>([])

  function computeOutput() {
    setOutput(new Interpreter(code).interpret())
  }

  return (
    <div className="bg-neutral-800 min-h-screen grid place-items-center md:grid-cols-2 text-white px-4 gap-4 py-8">
      <div className='w-full flex flex-col h-full'>
        <div className="flex flex-col flex-1">
          <p className='text-neutral-200 text-center text-lg'>Code</p>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            className='h-full w-full bg-neutral-900 rounded-xl shadow-lg border border-neutral-700 outline-none ring-transparent ring-2 ring-offset-neutral-800 ring-offset-2 focus:ring-blue-600/50 transition p-3 font-mono text-xl' data-gramm="false"></textarea>
          <div className='flex justify-end'>
            <button onClick={computeOutput} className='px-4 py-2 rounded-lg bg-blue-600/50 text-white font-medium border-blue-600 border shadow mt-3 hover:bg-blue-600/70 transition active:bg-blue-600/40'>Evaluate</button>
          </div>
        </div>
      </div>
      <div className='w-full flex flex-col gap-4 h-full'>
        <div>
          <p className='text-neutral-200 text-center text-lg'>Result</p>
          <pre className=' max-h-[90dvh] h-full w-full bg-neutral-900 rounded-xl shadow-lg border border-neutral-700 p-2 overflow-scroll text-3xl'>
            {output.join('\n')}
          </pre>
        </div>
      </div>
    </div>
  )
}
