import { Lexer, type BareTokenType, type TokenType } from "./Lexer";

export class ParserError extends Error {
	name = "ParserError";
	token: TokenType;
	constructor(msg: string, token: TokenType) {
		super(msg)
		this.token = token
		this.message = `Error: ${this.name}, ${msg}, at line: ${token.line}, col: ${token.columnStart}`
	}
}

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
	 *  (symbol Parameters)
	 *  (symbol)
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
	private assertToken(token: BareTokenType, type: string, value?: string) {
		if (value) {
			return token.type == type && token.value == value;
		} else {
			return token.type == type
		}
	}

	/* Throw errors if we encounter End of file token
	*/
	// private assertEof(token: TokenType) {
	// 	if (token.type == 'EOF') {
	// 		throw new ParserError("Unexpected End of File", token)
	// 	}
	// }


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

	private openParenthesis() {
		let t = this.lex.eat()
		if (!(t.type == 'punctuation' && t.value == '(')) {
			throw new ParserError(`Unexpected Token: ${t.value}, expectin '('`, t)
		}
	}
	private closeParenthesis() {
		let t = this.lex.eat()
		if (!(t.type == 'punctuation' && t.value == ')')) {
			throw new ParserError(`Unexpected Token: ${t.value}, expectin ')'`, t)
		}
	}

	private sExpression(): StatementNode {
		this.openParenthesis()

		const identifier = this.lex.eat()
		if (!(identifier.type == 'keyword' || identifier.type == 'symbol')) {
			throw SyntaxError(`Unexpected token: ${identifier.value}`)
		}
		if (identifier.type == 'keyword') {
			switch (identifier.value) {
				case 'lambda':
					return this.lambda()
				case 'define':
					return this.define()
				case 'if':
					return this.conditional()
				case 'begin':
					return this.begin()
				case 'set':
					return this.set()
				default:
					throw new ParserError(`Keyword not supported ${identifier.value}`, identifier)
			}
		}
		const parameters = this.Parameters()

		this.closeParenthesis()

		return { type: 'sExpression', identifier: { type: 'symbol', value: identifier.value }, parameters }
	}

	private body(): Array<StatementNode> {
		const expressions: Array<StatementNode> = []
		while (!this.assertToken(this.lex.lookahead(), 'punctuation', ')')) {
			expressions.push(this.sExpression())
		}

		return expressions
	}

	private symbol(): SymbolNode {
		const sym = this.lex.eat()
		if (!this.assertToken(sym, 'symbol')) {
			throw new ParserError(`Unexpected token: ${sym.value}, expecting a symbol`, sym)
		}
		return { type: 'symbol', value: sym.value }
	}

	private set(): SetNode {
		const sym = this.symbol()
		let value: ASTNode

		if (this.assertToken(this.lex.lookahead(), 'punctuation', '(')) {
			value = this.sExpression()
		} else {
			value = this.literal()
		}

		this.closeParenthesis() // comsume remainding ')' character

		return { type: 'set', name: sym, value: value }
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

		this.closeParenthesis()

		return { type: 'begin', body }
	}

	private conditional(): ConditionalNode {
		const condition = this.parseValue()
		const then = this.parseValue()
		const _else = this.parseValue()

		this.closeParenthesis()

		return { type: 'conditional', condition, then, else: _else }
	}

	private define(): DefineNode {
		if (this.assertToken(this.lex.lookahead(), 'punctuation', '(')) {
			// define a function
			this.openParenthesis()

			let sym = this.symbol()

			const args = this.arguments()

			this.closeParenthesis()

			const body = this.body()

			this.closeParenthesis()

			return { type: 'define', name: sym, value: { type: 'lambda', arguments: args, body } }
		}

		// define a symbol
		let sym = this.symbol()

		let value: ASTNode
		if (this.assertToken(this.lex.lookahead(), 'punctuation', '(')) {
			value = this.sExpression()
		} else {
			value = this.literal()
		}

		this.closeParenthesis()

		return { type: 'define', name: { type: 'symbol', value: sym.value }, value }

	}

	private lambda(): LambdaNode {
		this.openParenthesis()
		let args = this.arguments()
		this.closeParenthesis()

		let body = this.body()

		this.closeParenthesis()

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
				throw new ParserError(`Unexpected token: ${t.value}, cannot be used as an argument name`, t)
			}
			l = this.lex.lookahead()
		}
		return args
	}

	private Parameters(): ASTNode[] {
		let l = this.lex.lookahead()
		const parameters: ASTNode[] = []

		while (!this.assertToken(l, 'punctuation', ')')) {
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
			throw new ParserError(`Unexpected token: ${t.value} literal`, t)
		}
	}

	private quoted(): QuotedNode {
		const sym = this.symbol()
		return {
			type: 'quoted',
			value: sym
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
