import { Lexer } from "./Lexer";

function span(className: string, content: string) {
	return `<span class="${className}">${content}</span>`
}


export function hightlightCode(code: string) {
	const lexer = new Lexer(code)
	let lastToken
	let out = ''
	let t = lexer.eatAll()
	let parenthesisLevel = 0;

	const parenthesisLevelClasses = ['text-red-200', 'text-orange-200', 'text-yellow-200', 'text-green-200', 'text-teal-200', 'text-blue-200', 'text-purple-200']

	while (t.type != 'EOF') {
		switch (t.type) {
			case 'keyword':
				out += span("text-red-400", t.value)
				break;
			case 'comment':
				out += span("text-neutral-400", t.value)
				break;
			case 'number':
				out += span("text-amber-400", t.value)
				break;
			case 'string':
				out += span("text-yellow-400", t.value)
				break;
			case 'symbol':
				if (lastToken?.type == 'punctuation' && lastToken.value == '(') {
					out += span("text-violet-300", t.value)
				} else {
					out += t.value
				}
				break;
			case 'punctuation':
				if (t.value == '(') {
					out += span(parenthesisLevelClasses[parenthesisLevel % parenthesisLevelClasses.length], t.value)
				} else if (t.value == ')') {
					out += span(parenthesisLevelClasses[(parenthesisLevel - 1) % parenthesisLevelClasses.length], t.value)
				} else {
					out += t.value
				}
				break
			default:
				out += t.value
		}
		if (!(t.type == "eol" || t.type == 'whitespace')) {
			lastToken = t;
		}
		if (t.type == "punctuation" && t.value == '(') {
			parenthesisLevel += 1
		} else if (t.type == "punctuation" && t.value == ')') {
			parenthesisLevel -= 1
		}
		t = lexer.eatAll()
	}
	return out
}
