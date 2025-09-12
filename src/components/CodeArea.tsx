import { cn } from "../lib/cn";
import { hightlightCode } from "../lib/hightlightCode";

export function CodeArea(props: { code: string, setCode(code: string): void, className?: string }) {
  return (
    <div className={cn("bg-neutral-900 rounded-xl shadow-lg border border-neutral-700 relative", props.className)}>
      <pre className="p-3 font-mono text-xl text-wrap" dangerouslySetInnerHTML={{ __html: hightlightCode(props.code) }}>{}</pre>
      <textarea
        spellCheck="false"
        value={props.code}
        onChange={e => props.setCode(e.target.value)}
        className='caret-white text-transparent absolute inset-0 rounded-xl outline-none ring-transparent ring-2 ring-offset-neutral-800 ring-offset-2 focus:ring-blue-600/50 transition p-3 font-mono text-xl' data-gramm="false"></textarea>
    </div>
  )
}
