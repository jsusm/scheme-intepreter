export type BareTokenType = {
  type: string;
  value: string;
};
export type TokenType = BareTokenType & {
  columnStart: number;
  columnEnd: number;
  line: number;
};

export class Lexer {
  input: string;
  cursor = 0;
  line = 0;
  col = 0;

  tokens: [string | RegExp, string][] = [
    [/^\;;.*\n/, "comment"],
    [/^\;;.*$/, "comment"],
    [/^\n/, "eol"],
    [
      /^[\f\r\t\v\u0020\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/,
      "whitespace",
    ],
    ["(", "punctuation"],
    [")", "punctuation"],
    ["define", "keyword"],
    ["lambda", "keyword"],
    ["if", "keyword"],
    ["begin", "keyword"],
    ["set", "keyword"],
    ["cons", "keyword"],
    ["'", "punctuation"],
    [/^[+-]?\d+\.\d*/, "number"],
    [/^[+-]?\d+/, "number"],
    [/^"[^"]*"/, "string"],
    [
      /^[a-zA-Z-\+_\/\?\!\~{}\[\]\*=><][a-zA-Z-\+_\/\?\!\~{}\[\]\*=><\d;]*/,
      "symbol",
    ],
  ];

  constructor(input: string) {
    this.input = input;
    return this;
  }

  eof(offset = 0) {
    return this.cursor + offset >= this.input.length;
  }

  nextToken(offset = 0): BareTokenType {
    if (this.eof(offset)) {
      return { type: "EOF", value: "EOF" };
    }
    const text = this.input.slice(offset + this.cursor);

    for (let exp of this.tokens) {
      if (typeof exp[0] === "string") {
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
          return { type: exp[1], value: exp[0] };
        }
      } else {
        const result = exp[0].exec(text);
        if (result != null) {
          return { type: exp[1], value: result[0] };
        }
      }
    }
    return { type: "Unexpected", value: text[0] };
  }

  lookahead(offset = 0): BareTokenType {
    const token = this.nextToken(offset);
    if (
      token.type == "whitespace" ||
      token.type == "eol" ||
      token.type == "comment"
    ) {
      return this.lookahead(offset + token.value.length);
    }
    if (token.type === "EOF" || token.type === "Unexpected") {
      return token;
    }
    return token;
  }

  eatAll(): BareTokenType {
    const token = this.nextToken();
    this.cursor += token.value.length;
    this.col += token.value.length;
    if (token.type == "eol" || token.type == "comment") {
      this.col = 0;
      this.line++;
    }
    return token;
  }

  eat(): TokenType {
    const token = this.nextToken();
    this.cursor += token.value.length;
    this.col += token.value.length;
    if (token.type == "eol" || token.type == "comment") {
      this.col = 0;
      this.line++;
      return this.eat();
    }
    if (token.type == "whitespace") {
      return this.eat();
    }
    return {
      columnStart: this.col - token.value.length,
      columnEnd: this.col,
      line: this.line,
      ...token,
    };
  }
}
