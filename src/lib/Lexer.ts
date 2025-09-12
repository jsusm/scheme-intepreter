export type TokenType = {
	type: string,
	value: string,
}

export class Lexer {
	input: string;
	cursor = 0;

	tokens: [string | RegExp, string][] = [
		[/^\s+/, 'whitespace'],
		['(', 'punctuation'],
		[')', 'punctuation'],
		['define', 'keyword'],
		['lambda', 'keyword'],
		['if', 'keyword'],
		['begin', 'keyword'],
		['set', 'keyword'],
		['\'', 'punctuation'],
		[/^\d+\.\d*/, 'number'],
		[/^\d+/, 'number'],
		[/^"[^"]*"/, 'string'],
		[/^[a-zA-Z-\+_\/\?\!\~{}\[\]\*=><]+/, 'symbol'],
	]

	constructor(input: string) {
		this.input = input
		return this
	}

	eof(offset = 0) {
		return this.cursor + offset >= this.input.length
	}

	nextToken(offset = 0): TokenType {
		if (this.eof(offset)) {
			return { type: 'EOF', value: 'EOF' }
		}
		const text = this.input.slice(offset + this.cursor)

		for (let exp of this.tokens) {
			if (typeof exp[0] === 'string') {
				let match = true;
				for (let i = 0; i < exp[0].length; i++) {
					if (text[i] === undefined) {
						match = false;
						break;
					}
					if (text[i] != exp[0][i]) {
						match = false;
						break;
					}
				}
				if (match) {
					return { type: exp[1], value: exp[0] }
				}
			} else {
				const result = exp[0].exec(text)
				if (result != null) {
					return { type: exp[1], value: result[0] }
				}
			}
		}
		return { type: 'Unexpected', value: 'Unexpected' }
	}

	lookahead(offset = 0): TokenType {
		const token = this.nextToken(offset)
		if (token.type == 'whitespace') {
			return this.lookahead(offset + token.value.length)
		}
		if (token.type === 'EOF' || token.type === 'Unexpected') {
			return token
		}
		return token
	}

	eat(): TokenType {
		const token = this.nextToken()
		this.cursor += token.value.length
		if (token.type == 'whitespace') {
			return this.eat()
		}
		return token;
	}
}
