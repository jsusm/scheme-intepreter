import { NotebookEditor } from "./NotebookEditor";

export function Demo() {
  return (
    <div className="bg-neutral-950 min-h-screen flex justify-center text-white px-4 py-4 gap-4 relative">
      <div className="flex-1 min-h-full items-center flex justify-center py-24">
        <NotebookEditor />
      </div>
      <div className="bg-neutral-900 rounded-xl min-h-full w-md px-6 py-4 text-neutral-200 space-y-8">
        <h1 className="text-xl font-medium text-center">
          Tutorial of my flavour of Scheme
        </h1>
        <section className="space-y-4 text-sm">
          <p>
            Scheme was born in the 1970s at the MIT AI Lab, created by{" "}
            <b>Guy L. Steele Jr. and Gerald Jay Sussman</b>. It's a dialect of
            Lisp, one of the oldest families of programming languages. While it
            shares Lisp's characteristic parenthesized syntax, known as
            S-expressions (Symbolic Expressions), Scheme was designed with a
            much smaller and cleaner core.
          </p>
          <p>
            Sheme is a minimalistic language with a small number of comcepts, so
            it is easy to learn, I will gide you to lear this lenguage
          </p>
        </section>
        <section className="space-y-4 text-sm">
          <h3 className="text-lg font-medium underline decoration-cyan-600 decoration-2">
            S expressions
          </h3>
          <p>The S-Expressions</p>
          <p>
            Sheme is a minimalistic language with a small number of comcepts, so
            it is easy to learn, I will gide you to lear this lenguage
          </p>
        </section>
      </div>
    </div>
  );
}
