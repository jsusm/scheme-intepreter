import type { ListValue, PrimitiveValue } from "./InterpreterDataTypes";
import { Lexer, type BareTokenType, type TokenType } from "./Lexer";
import type {
  ASTNode,
  BeginNode,
  ConditionalNode,
  DefineNode,
  LambdaNode,
  StatementNode,
  StringNode,
  SymbolNode,
  NumberNode,
  QuotedNode,
  SetNode,
  ConsNode,
  FunctionNameNode,
  LiteralValues,
  sExpNode,
  LiteralNode,
  ListNode,
} from "./ParserNodeTypes";

export class ParserError extends Error {
  name = "ParserError";
  token: TokenType;
  constructor(msg: string, token: TokenType) {
    super(msg);
    this.token = token;
    this.message = `Error: ${this.name}, ${msg}, at line: ${token.line}, col: ${token.columnStart}`;
  }
}

export class Parser {
  /*  GRAMMAR TO IMPLEMENT
   *
   * Program::
   *  Statement
   *  Statement Program
   *
   * Statement:
   *  Expression
   *  Atom
   *
   * Atom:
   *  number
   *  string
   *  symbol
   *
   * Expression::
   *  (symbol Parameters)
   *  (symbol)
   *  (lambda arguments body)
   *  (define name value)
   *  (define (name arguments) body)
   *  (if condition then else)
   *  (begin body)
   *  (set! symbol value)
   *  (cond (Conditions))
   *  (cons car cdr)
   *
   * Conditions::
   *  (condition body)
   *  (condition body) Conditions
   *  (else body)
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
   *	  list
   *
   * list::
   *   ''
   *   list
   *	 literal list
   */

  lex: Lexer;
  input: string;

  constructor(input: string) {
    this.input = input;
    this.lex = new Lexer(this.input);
  }

  /*  Return true if a token has a specific type and an specific value
   */
  private assertToken(token: BareTokenType, type: string, value?: string) {
    if (value) {
      return token.type == type && token.value == value;
    } else {
      return token.type == type;
    }
  }

  private openParenthesis() {
    let t = this.lex.eat();
    if (!(t.type == "punctuation" && t.value == "(")) {
      throw new ParserError(`Unexpected Token: ${t.value}, expectin '('`, t);
    }
  }
  private closeParenthesis() {
    let t = this.lex.eat();
    if (!(t.type == "punctuation" && t.value == ")")) {
      throw new ParserError(`Unexpected Token: ${t.value}, expectin ')'`, t);
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
    return this.Program();
  }

  Statement(): LiteralNode | QuotedNode | StatementNode | ListNode {
    let l = this.lex.lookahead();
    if (
      l.type == "symbol" ||
      l.type == "number" ||
      l.type == "boolean" ||
      l.type == "string"
    ) {
      return this.literal();
    }
    if (l.type == "punctuation" && l.value == "'") {
      return this.quoted();
    } else {
      return this.sExpression();
    }
  }

  private Program() {
    const expressions: ASTNode[] = [];
    let l = this.lex.lookahead();
    while (!this.assertToken(l, "EOF")) {
      expressions.push(this.Statement());
      l = this.lex.lookahead();
    }
    return expressions;
  }

  private sExpression(): StatementNode {
    this.openParenthesis();
    let identifier: FunctionNameNode;

    const t = this.lex.eat();
    if (t.type == "keyword") {
      switch (t.value) {
        case "lambda":
          return this.lambda();
        case "define":
          return this.define();
        case "if":
          return this.conditional();
        case "begin":
          return this.begin();
        case "set!":
          return this.set();
        case "cons":
          return this.cons();
        default:
          throw new ParserError(`Keyword not supported ${t.value}`, t);
      }
    } else if (this.assertToken(t, "punctuation", "(")) {
      const t = this.lex.eat();
      if (!this.assertToken(t, "keyword", "lambda")) {
        throw new ParserError("Expecting a lambda declaration", t);
      }
      identifier = this.lambda();
    } else if (t.type == "symbol") {
      identifier = { type: "symbol", value: t.value };
    } else {
      throw new ParserError(
        "Expecting a symbol, keyword or lambda declaration",
        t,
      );
    }
    const parameters = this.Parameters();

    this.closeParenthesis();

    return {
      type: "sExpression",
      identifier: identifier,
      parameters,
    };
  }

  private cons(): ConsNode {
    const car = this.Statement();
    const cdr = this.Statement();

    this.closeParenthesis();

    return { type: "list", car, cdr };
  }

  private body(): Array<LiteralNode | QuotedNode | StatementNode | ListNode> {
    const expressions: Array<
      LiteralNode | QuotedNode | StatementNode | ListNode
    > = [];
    while (!this.assertToken(this.lex.lookahead(), "punctuation", ")")) {
      expressions.push(this.Statement());
    }
    return expressions;
  }

  private symbol(): SymbolNode {
    const sym = this.lex.eat();
    if (!this.assertToken(sym, "symbol")) {
      throw new ParserError(
        `Unexpected token: ${sym.value}, expecting a symbol`,
        sym,
      );
    }
    return { type: "symbol", value: sym.value };
  }

  private set(): SetNode {
    const sym = this.symbol();
    let value: ASTNode;

    value = this.Statement();

    this.closeParenthesis(); // comsume remainding ')' character

    return { type: "set", name: sym, value: value };
  }

  private begin(): BeginNode {
    const body = this.body();

    this.closeParenthesis();

    return { type: "begin", body };
  }

  private conditional(): ConditionalNode {
    const condition = this.Statement();
    const then = this.Statement();
    const _else = this.Statement();

    this.closeParenthesis();

    return { type: "conditional", condition, then, else: _else };
  }

  private define(): DefineNode {
    if (this.assertToken(this.lex.lookahead(), "punctuation", "(")) {
      // define a function
      this.openParenthesis();

      let sym = this.symbol();

      const args = this.arguments();

      this.closeParenthesis();

      const body = this.body();

      this.closeParenthesis();

      return {
        type: "define",
        name: sym,
        value: { type: "lambda", arguments: args, body },
      };
    }

    // define a symbol
    let sym = this.symbol();

    let value: ASTNode;
    value = this.Statement();

    this.closeParenthesis();

    return {
      type: "define",
      name: { type: "symbol", value: sym.value },
      value,
    };
  }

  private lambda(): LambdaNode {
    this.openParenthesis();
    let args = this.arguments();
    this.closeParenthesis();

    let body = this.body();

    this.closeParenthesis();

    return { type: "lambda", arguments: args, body };
  }

  private arguments(): SymbolNode[] {
    let args: SymbolNode[] = [];
    let l = this.lex.lookahead();
    while (!this.assertToken(l, "punctuation", ")")) {
      let t = this.lex.eat();
      if (this.assertToken(t, "symbol")) {
        args.push({ type: "symbol", value: t.value });
      } else {
        throw new ParserError(
          `Unexpected token: ${t.value}, cannot be used as an argument name`,
          t,
        );
      }
      l = this.lex.lookahead();
    }
    return args;
  }

  private Parameters(): ASTNode[] {
    let l = this.lex.lookahead();
    const parameters: ASTNode[] = [];

    while (!this.assertToken(l, "punctuation", ")")) {
      parameters.push(this.Statement());
      l = this.lex.lookahead();
    }
    return parameters;
  }

  private literal(): StringNode | SymbolNode | NumberNode {
    let t = this.lex.eat();
    if (this.assertToken(t, "string")) {
      return { type: "string", value: t.value };
    } else if (this.assertToken(t, "boolean")) {
      return { type: "boolean", value: t.value == "#t" };
    } else if (this.assertToken(t, "symbol")) {
      return { type: "symbol", value: t.value };
    } else if (this.assertToken(t, "number")) {
      return { type: "number", value: parseFloat(t.value) };
    } else {
      throw new ParserError(`Unexpected token: ${t.value} literal`, t);
    }
  }

  private quoted(): QuotedNode | ListNode {
    this.lex.eat();
    let l = this.lex.lookahead();

    if (this.assertToken(l, "punctuation", "(")) {
      return this.list();
    }

    const sym = this.symbol();
    return {
      type: "quoted",
      value: sym,
    };
  }

  private list(): ListNode {
    this.openParenthesis();
    const list = [];
    let l = this.lex.lookahead();
    while (!this.assertToken(l, "punctuation", ")")) {
      if (this.assertToken(l, "punctuation", "(")) {
        list.push(this.list());
      } else list.push(this.literal());

      l = this.lex.lookahead();
    }
    this.closeParenthesis();
    return {
      type: "literalListNode",
      values: list,
    };
  }
}
