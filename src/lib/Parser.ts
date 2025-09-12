import { Lexer, type TokenType } from "./Lexer";

export type SymbolNode = {
	type: "symbol",
	value: string,
}

export type NumberNode = {
	type: "number",
	value: number,
}

export type ConditionalNode = {
	type: "conditional",
	condition: ASTNode,
	then: ASTNode,
	else: ASTNode,
}

export type StringNode = {
	type: "string",
	value: string,
}

export type DefineNode = {
	type: "define",
	name: SymbolNode,
	value: ASTNode,
}

export type BeginNode = {
	type: 'begin',
	body: StatementNode[]
}

export type SetNode = {
	type: 'set',
	name: SymbolNode,
	value: ASTNode,
}

export type StatementNode = sExpNode | DefineNode | LambdaNode | ConditionalNode | BeginNode | SetNode

export type LambdaNode = {
	type: 'lambda',
	arguments: SymbolNode[],
	body: StatementNode[],
}

export type QuotedNode = {
	type: 'quoted',
	value: SymbolNode,
}

export type sExpNode = {
	type: 'sExpression',
	identifier: SymbolNode,
	parameters: ASTNode[]
}


export type ASTNode = SymbolNode | NumberNode | StringNode | DefineNode | LambdaNode | QuotedNode | sExpNode | ConditionalNode | BeginNode | SetNode

export class Parser {
	/*  GRAMMAR TO IMPLEMENT
	 *
	 * Program::
	 *   sExpression
	 *   sExpression Program
	 *
	 * sExpressions::
	 *  (Identifier Parameters)
	 *  (Identifier)
	 *  (lambda arguments body)
	 *  (define name value)
	 *  (define (name arguments) body)
	 *  (if cond then else)
	 *  (begin body)
	 *  (set symbol value)
	 *
	 * body::
	 *   sExpression
	 *   sExpression body
	 *
	 * arguments:
	 *   symbol
	 *   symbol arguments
	 *
	 * Identifier::
	 *   symbol
	 *   keyword
	 *
	 * Parameter::
	 *   literal Parameter
	 *   sExpression Parameter
	 *
	 * literal::
	 *   symbol
	 *   string
	 *   number
	 *   'quoted
	 * 
	 * quoted::
	 *	  symbol
	 *	  (list)
	 *
	 * list::
	 *   ''
	 *   literal
	 *	 literal list
	 */

	lex: Lexer
	input: string

	constructor(input: string) {
		this.input = input
		this.lex = new Lexer(this.input)
	}

	/*  Return true if a token has a specific type and an specific value
	*/
	private assertToken(token: TokenType, type: string, value?: string) {
		if (value) {
			return token.type == type && token.value == value;
		} else {
			return token.type == type
		}
	}

	/*  Return true if a token type belongs to the array of classes
	*/
	private assertTokenClasses(token: TokenType, types: string[]) {
		return types.includes(token.type)
	}

	/* Throw errors if we encounter End of file token
	*/
	private assertEof(token: TokenType) {
		if (token.type == 'EOF') {
			throw Error("Unexpected End of File")
		}
	}


	/* Starting point to get the AST from the input
	*/
	Parse() {
		return this.Program()
	}

	private Program() {
		const expressions: ASTNode[] = []
		let l = this.lex.lookahead()
		while (!this.assertToken(l, 'EOF')) {
			expressions.push(this.sExpression())
			l = this.lex.lookahead()
		}
		return expressions;
	}

	private sExpression(): StatementNode {
		let t = this.lex.eat()
		if (!(t.type == 'punctuation' && t.value == '(')) {
			throw SyntaxError(`Unexpected Token: ${t.value}`)
		}

		const identifier = this.lex.eat()
		if (!(identifier.type == 'keyword' || identifier.type == 'symbol')) {
			throw SyntaxError(`Unexpected token: ${identifier.value}`)
		}
		if (identifier.type == 'keyword') {
			if (identifier.value == 'lambda') {
				return this.lambda()
			}
			if (identifier.value == 'define') {
				return this.define()
			}
			if (identifier.value == 'if') {
				return this.conditional()
			}
			if (identifier.value == 'begin') {
				return this.begin()
			}
			if (identifier.value == 'set') {
				return this.set()
			}

		}
		const parameters = this.Parameters()

		t = this.lex.eat()
		if (!this.assertToken(t, 'punctuation', ')')) { // consume the ) character
			throw SyntaxError(`Unexpected token: ${t.value} waiting )`)
		}

		return { type: 'sExpression', identifier: { type: 'symbol', value: identifier.value }, parameters }
	}

	private body(): Array<StatementNode> {
		const expressions: Array<StatementNode> = []
		while (!this.assertToken(this.lex.lookahead(), 'punctuation', ')')) {
			expressions.push(this.sExpression())
		}

		return expressions
	}

	private set(): SetNode {
		const sym = this.lex.eat()
		if (!this.assertToken(sym, 'symbol')) {
			throw SyntaxError(`Unexpected token: ${sym.value}, expecting a symbol`)
		}
		let value: ASTNode
		if (this.assertToken(this.lex.lookahead(), 'punctuation', '(')) {
			value = this.sExpression()
		} else {
			value = this.literal()
		}


		let t = this.lex.eat() // comsume remainding ')' character
		if (!this.assertToken(t, 'punctuation', ')')) {
			throw SyntaxError(`Unexpected token: ${t.value}`)
		}

		return { type: 'set', name: { type: 'symbol', value: sym.value }, value: value }
	}

	private parseValue(): ASTNode {
		const l = this.lex.lookahead()
		if (this.assertToken(l, 'punctuation', '(')) {
			return this.sExpression()
		} else {
			return this.literal()
		}
	}

	private begin(): BeginNode {
		const body = this.body()

		let t = this.lex.eat() // comsume remainding ')' character
		if (!this.assertToken(t, 'punctuation', ')')) {
			throw SyntaxError(`Unexpected token: ${t.value}`)
		}

		return { type: 'begin', body }
	}

	private conditional(): ConditionalNode {
		const condition = this.parseValue()
		const then = this.parseValue()
		const _else = this.parseValue()

		let t = this.lex.eat() // comsume remainding ')' character
		if (!this.assertToken(t, 'punctuation', ')')) {
			throw SyntaxError(`Unexpected token: ${t.value}`)
		}

		return { type: 'conditional', condition, then, else: _else }
	}

	private define(): DefineNode {
		if (this.assertToken(this.lex.lookahead(), 'punctuation', '(')) {
			// define a function
			this.lex.eat()
			let sym = this.lex.eat()
			if (!this.assertToken(sym, 'symbol')) {
				throw SyntaxError(`Unexpected token: ${sym.value}, expecting a symbol`)
			}

			const args = this.arguments()
			this.lex.eat() // comsume the last ')' character

			const body = this.body()

			this.lex.eat() // comsume the last ')' character

			return { type: 'define', name: { type: 'symbol', value: sym.value }, value: { type: 'lambda', arguments: args, body } }
		}

		// define a symbol
		let sym = this.lex.eat()
		if (!this.assertToken(sym, 'symbol')) {
			throw SyntaxError(`Unexpected token: ${sym.value}, expecting a symbol`)
		}

		let value: ASTNode
		if (this.assertToken(this.lex.lookahead(), 'punctuation', '(')) {
			value = this.sExpression()
		} else {
			value = this.literal()
		}

		let t = this.lex.eat() // comsume remainding ')' character
		if (!this.assertToken(t, 'punctuation', ')')) {
			throw SyntaxError(`Unexpected token: ${t.value}`)
		}

		return { type: 'define', name: { type: 'symbol', value: sym.value }, value }

	}

	private lambda(): LambdaNode {
		let t = this.lex.eat()
		if (!this.assertToken(t, 'punctuation', '(')) {
			throw SyntaxError(`Unexpected token: ${t.value}`)
		}
		let args = this.arguments()
		this.lex.eat() // comsume the last ')' character

		let body = this.body()

		t = this.lex.eat() // comsume remainding ')' character
		if (!this.assertToken(t, 'punctuation', ')')) {
			throw SyntaxError(`Unexpected token: ${t.value} in lambda expression, waiting )`)
		}


		return { type: 'lambda', arguments: args, body }
	}

	private arguments(): SymbolNode[] {
		let args: SymbolNode[] = []
		let l = this.lex.lookahead()
		while (!this.assertToken(l, 'punctuation', ')')) {
			let t = this.lex.eat()
			if (this.assertToken(t, 'symbol')) {
				args.push({ type: 'symbol', value: t.value })
			} else {
				throw SyntaxError(`Unexpected token: ${t.value}, cannot be used as an argument name`)
			}
			l = this.lex.lookahead()
		}
		return args
	}

	private Parameters(): ASTNode[] {
		let l = this.lex.lookahead()
		const parameters: ASTNode[] = []

		while (!this.assertToken(l, 'punctuation', ')')) {
			this.assertEof(l)
			if (this.assertToken(l, 'punctuation', '(')) {
				parameters.push(this.sExpression())
			} else {
				parameters.push(this.literal())
			}
			l = this.lex.lookahead()
		}
		return parameters
	}

	private literal(): StringNode | SymbolNode | NumberNode | QuotedNode {
		let t = this.lex.eat()
		if (this.assertToken(t, 'punctuation', '\'')) {
			return this.quoted()
		}
		if (this.assertToken(t, 'string')) {
			return { type: 'string', value: t.value }
		} else if (this.assertToken(t, 'symbol')) {
			return { type: 'symbol', value: t.value }
		} else if (this.assertToken(t, 'number')) {
			return { type: 'number', value: parseFloat(t.value) }
		} else {
			throw Error(`Unexpected token: ${t.value} literal`)
		}
	}

	private quoted(): QuotedNode {
		let t = this.lex.eat()
		if (!this.assertToken(t, 'symbol')) {
			throw Error(`Unexpected token: ${t.value}, can only quote symbols`)
		}
		return {
			type: 'quoted',
			value: { type: 'symbol', value: t.value }
		}
		// if (this.assertToken(l, 'punctuation', '(')) {
		// 	this.lex.eat()
		// 	const list = this.list()
		// 	const closed = this.lex.eat()
		// 	if (!this.assertToken(closed, 'punctuation', ')')) { //comsume last ) character
		// 		throw Error(`Unexpected token: ${closed.value}`)
		// 	}
		// 	return {
		// 		type: 'quoted',
		// 		identifier: { type: 'keyword', value: 'quote' },
		// 		parameters: list
		// 	}
		// } else {
		// 	return {
		// 		type: 'sExpression',
		// 		identifier: { type: 'keyword', value: 'quote' },
		// 		parameters: this.literal()
		// 	}
		// }
	}

	// private list(): ASTNode[] {
	// 	let l = this.lex.lookahead()
	// 	let items = []
	// 	while (!this.assertToken(l, 'punctuation', ')')) {
	// 		items.push(this.literal())
	// 		l = this.lex.lookahead()
	// 	}
	// 	return items
	// }
}
