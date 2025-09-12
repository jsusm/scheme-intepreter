import { Parser, type ASTNode, type BeginNode, type ConditionalNode, type DefineNode, type LambdaNode, type SetNode, type sExpNode, type StatementNode } from "./Parser";

export type SymbolValue = {
	type: 'symbol',
	value: string,
}

export type PrimitiveValue =
	SymbolValue | {
		type: 'string',
		value: string
	} | {
		type: 'number'
		value: number
	} | {
		type: 'function'
		params: SymbolValue[]
		body: StatementNode[],
		value: string,
		env: Environment,
	}

export class Environment {
	env: {
		[key: string]: PrimitiveValue
	} = {}
	parent?: Environment
	constructor(parentEnv?: Environment) {
		this.parent = parentEnv
	}

	lookupVariableValue(key: string): PrimitiveValue {
		const value = this.env[key]
		if (!value) {
			if (this.parent)
				return this.parent.lookupVariableValue(key)
			else
				throw Error('Undefined Symbol')
		} else {
			return value
		}
	}

	defineVariable(key: string, value: PrimitiveValue) {
		this.env[key] = value
	}

	setVariableValue(key: string, value: PrimitiveValue) {
		if (this.env[key] === undefined) {
			if (!this.parent) {
				throw Error("Undefined Variable, try to use a variable that is not defined")
			}
			this.parent.setVariableValue(key, value)
		}
		this.env[key] = value
	}

	extendEnv() {
		return new Environment(this)
	}

	print() {
		console.log(this.env)
	}
}

export class Interpreter {
	ast: ASTNode[]
	output: string[] = []

	genv = new Environment()

	constructor(input: string) {
		this.ast = new Parser(input).Parse()
	}

	builtinFunctions: {
		[key: string]: {
			params: number[] | number,
			fn: (params: PrimitiveValue[], env: Environment) => PrimitiveValue
		}
	} = {
			'+': {
				params: 2,
				fn: (params: PrimitiveValue[]) => {
					let res = 0;
					for (let v of params) {
						if (v.type != 'number') {
							throw Error("Can only sum numbers")
						}
						res += v.value;
					};
					return { type: 'number', value: res };
				}
			},
			'-': {
				params: [1, 2],
				fn: (params: PrimitiveValue[]) => {
					if (params[0].type != 'number') {
						throw Error("Can only subtract numbers")
					}
					if (params.length == 1) {
						return { type: 'number', value: -params[0].value }
					}
					if (params[1].type != 'number') {
						throw Error("Can only subtract numbers")
					}
					return { type: 'number', value: params[0].value - params[1].value }
				}
			},
			'*': {
				params: 2,
				fn: (params: PrimitiveValue[]) => {
					let res = 1;
					for (let v of params) {
						if (v.type != 'number') {
							throw Error("Can only sum numbers")
						}
						res *= v.value;
					};
					return { type: 'number', value: res };
				}
			},
			'/': {
				params: [2],
				fn: (params: PrimitiveValue[]) => {
					if (params[0].type != 'number') {
						throw Error("Can only divide numbers")
					}
					if (params[1].type != 'number') {
						throw Error("Can only divide numbers")
					}
					return { type: 'number', value: params[0].value / params[1].value }
				}
			},
			'print': {
				params: 1,
				fn: (params) => {
					let result = ""
					for (let p of params) {
						result += p.value + ' '
					}
					this.output.push(result)
					return { type: 'symbol', value: 'ok' }
				}
			},
			'=': {
				params: 2,
				fn: (params) => {
					let equals = true;
					for (let i = 1; i < params.length; i++) {
						equals = params[i - 1].type == params[i].type && params[i - 1].value == params[i].value
						if (!equals) {
							return { type: 'symbol', value: 'false' }
						}
					}
					return { type: 'symbol', value: 'true' }
				}
			},
			'>': {
				params: [2],
				fn: (params) => {
					if (params[0].type == 'number' && params[1].type == 'number') {
						if (params[0].value > params[1].value) {
							return { type: 'symbol', value: 'true' }
						} else {
							return { type: 'symbol', value: 'false' }
						}
					} else {
						throw Error("Can only compare numbers")
					}
				}
			},
			'<': {
				params: [2],
				fn: (params) => {
					if (params[0].type == 'number' && params[1].type == 'number') {
						if (params[0].value < params[1].value) {
							return { type: 'symbol', value: 'true' }
						} else {
							return { type: 'symbol', value: 'false' }
						}
					} else {
						throw Error("Can only compare numbers")
					}
				}
			},
			'and': {
				params: 2,
				fn: (params) => {
					let ok = true;
					for (let i = 0; i < params.length; i++) {
						ok = ok && this.isTruthyValue(params[i])
						if (!ok) {
							return { type: 'symbol', value: 'false' }
						}
					}
					return { type: 'symbol', value: 'true' }
				}
			},
			'or': {
				params: 2,
				fn: (params) => {
					let ok = false;
					for (let i = 0; i < params.length; i++) {
						ok = ok || this.isTruthyValue(params[i])
						if (ok) {
							return { type: 'symbol', value: 'true' }
						}
					}
					return { type: 'symbol', value: 'false' }
				}
			},
		}

	/* Used in comparisons, define if a value is consider tru
	*/
	isTruthyValue(v: PrimitiveValue) {
		return (
			(v.type == 'string' && v.value != '') ||
			(v.type == 'number' && v.value != 0) ||
			(v.type == 'symbol' && v.value != 'false') ||
			(v.type == 'function')
		)
	}


	isBuiltintFunction(fn: string) {
		return this.builtinFunctions[fn] !== undefined
	}

	/* Distpach a function defined in this.builtinFunctions property
	 */
	dispachBuiltInFunction(functionName: string, params: PrimitiveValue[], env: Environment): PrimitiveValue {
		const fn = this.builtinFunctions[functionName]
		if (fn === undefined) {
			throw new Error(`Unknow function: ${functionName}`)
		}
		if (typeof fn.params == 'number') {
			if (params.length < fn.params) {
				throw Error(`The function ${functionName} need at least ${fn.params} arguments`)
			}
			return fn.fn(params, env)
		}
		if (fn.params.includes(params.length)) {
			return fn.fn(params, env)
		} else {
			throw new Error(`The function ${functionName} does not accept ${fn.params.length} arguments`)
		}
	}

	/* Entry point of the interpreter, use this function to start the evaluation
	*/
	interpret() {
		for (const statement of this.ast) {
			try {
				this.output.push(this.evaluate(statement, this.genv).value.toString())
			} catch (error) {
				this.output.push((error as Error).message)
			}
		}
		return this.output
	}

	/* Compute the value of an statement
	*/
	evaluate(node: ASTNode, env: Environment): PrimitiveValue {
		// self evaluating values
		switch (node.type) {
			case "string":
			case "number":
				return node
			case "symbol":
				const symbolValue = env.lookupVariableValue(node.value as string)
				if (symbolValue == undefined) {
					throw Error(`Symbol ${node.value} is not defined.`)
				}
				return symbolValue
			case "define":
				return this.evalDefine(node, env)
			case "lambda":
				return this.evalLambda(node, env)
			case "quoted":
				return node.value
			case "sExpression":
				return this.apply(node, env)
			case "conditional":
				return this.evalConditional(node, env);
			case "begin":
				return this.evalBegin(node, env)
			case "set":
				return this.evalSet(node, env)
			default:
				throw Error("Not supported Expression")
		}
	}

	/* Evaluate a condition and execute the correspoding statement
	*/
	evalConditional(node: ConditionalNode, env: Environment): PrimitiveValue {
		const conditionValue = this.evaluate(node.condition, env)
		if (this.isTruthyValue(conditionValue)) {
			return this.evaluate(node.then, env)
		} else {
			return this.evaluate(node.else, env)
		}
	}

	evalLambda(node: LambdaNode, env: Environment): PrimitiveValue {
		return { type: 'function', params: node.arguments, body: node.body, value: `function ${node.arguments.length}`, env }
	}

	evalDefine(node: DefineNode, env: Environment): PrimitiveValue {
		env.defineVariable(node.name.value, this.evaluate(node.value, env))
		return { type: 'symbol', value: 'ok' }
	}

	evalSet(node: SetNode, env: Environment): PrimitiveValue {
		const value = this.evaluate(node.value, env)
		env.setVariableValue(node.name.value, value)
		return value
	}

	evalBegin(node: BeginNode, env: Environment): PrimitiveValue {
		for (let i = 0; i < node.body.length - 1; i++) {
			this.evaluate(node.body[i], env);
		}
		return this.evaluate(node.body[node.body.length - 1], env)

	}


	/* Execute a function, it evaluates the parameters of the function and
	 * lookup the env to find the function definition, if it is not defined
	 * throws an error
	*/
	apply(node: sExpNode, env: Environment): PrimitiveValue {
		//evaluate parameters
		const paramsValues = node.parameters.map(p => this.evaluate(p, env))
		console.log("appling", node.identifier.value, 'with', paramsValues)

		if (this.isBuiltintFunction(node.identifier.value)) {
			return this.dispachBuiltInFunction(node.identifier.value, paramsValues, env)
		} else {
			// check if the identifier is a function
			const fn = env.lookupVariableValue(node.identifier.value)
			if (fn.type == 'function') {
				// extend the current environment
				const newEnv = fn.env.extendEnv()
				// check how meny params was passed
				if (fn.params.length !== paramsValues.length) {
					throw Error(`Cannot run a function of ${fn.params.length} with ${paramsValues.length} arguments`)
				}
				// define the parameters as variables in the extended environment
				for (let i = 0; i < fn.params.length; i++) {
					newEnv.defineVariable(fn.params[i].value, paramsValues[i])
				}

				// execute the statements
				for (let i = 0; i < fn.body.length - 1; i++) {
					this.evaluate(fn.body[i], newEnv);
				}
				return this.evaluate(fn.body[fn.body.length - 1], newEnv)
			} else {
				throw Error(`The function ${fn.value} is not defined`)
			}
		}
	}
}
