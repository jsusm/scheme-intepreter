import { Environment } from "./Environment.ts";
import { isTruthyValue, primitiveValueToString, type ListValue, type PrimitiveValue } from "./InterpreterDataTypes.ts";
import { nativeFunctionRepository } from "./nativeInterpreterFunctions.ts";
import {
  Parser,
} from "./Parser";
import {
  type ASTNode,
  type BeginNode,
  type ConditionalNode,
  type DefineNode,
  type LambdaNode,
  type ConsNode,
  type SetNode,
  type sExpNode,
  type ListNode,
  type LiteralNode,
} from './ParserNodeTypes.ts'

export class Interpreter {
  ast: ASTNode[] = [];
  output: string[] = [];
  error: string = "";

  genv = new Environment();
  input: string;

  constructor(input: string, env?: Environment) {
    this.input = input;
    if (env) {
      this.genv = env;
    }
    // load native functions
    try {
      this.genv.lookupVariableValue('nativeFunctionsLoaded')
    } catch (error) {
      nativeFunctionRepository.loadNativeFunctionsIntoEnvironment(this.genv)
    }
  }

  builtinFunctions: {
    [key: string]: {
      params: number[] | number;
      fn: (params: PrimitiveValue[], env: Environment) => PrimitiveValue;
    };
  } = {
    };

  isBuiltintFunction(fn: string) {
    return this.builtinFunctions[fn] !== undefined;
  }

  /* Distpach a function defined in this.builtinFunctions property
   */

  /* Entry point of the interpreter, use this function to start the evaluation
   */
  interpret() {
    try {
      this.ast = new Parser(this.input).Parse();

      for (const statement of this.ast) {
        try {
          this.output.push(
            primitiveValueToString(this.evaluate(statement, this.genv))
          );
          this.error = "";
        } catch (error) {
          this.error = (error as Error).message;
        }
      }
    } catch (error) {
      this.error = (error as Error).message;
    }
    return this.output;
  }

  /* Compute the value of an statement
   */
  evaluate(node: ASTNode, env: Environment): PrimitiveValue {
    // self evaluating values
    switch (node.type) {
      case "string":
      case "boolean":
      case "number":
        return node;
      case "symbol":
        const symbolValue = env.lookupVariableValue(node.value as string);
        if (symbolValue == undefined) {
          throw Error(`Symbol ${node.value} is not defined.`);
        }
        return symbolValue;
      case "define":
        return this.evalDefine(node, env);
      case "lambda":
        return this.evalLambda(node, env);
      case "quoted":
        return node.value;
      case "sExpression":
        return this.apply(node, env);
      case "conditional":
        return this.evalConditional(node, env);
      case "begin":
        return this.evalBegin(node, env);
      case "set":
        return this.evalSet(node, env);
      case 'list':
        return this.evalCons(node, env);
      case "literalListNode":
        return this.evalList(node, env);
      default:
        throw Error("Not supported Expression");
    }
  }

  evaluateQuouted(node: LiteralNode, env: Environment): PrimitiveValue {
    switch (node.type) {
      case "string":
      case "number":
      case "symbol":
        return node;
      case "literalListNode":
        return this.evalList(node, env)
    }
  }

  evalList(node: ListNode, env: Environment): PrimitiveValue {
    if (node.values.length == 0) {
      return { type: 'null' }
    }
    const list: ListValue = { type: 'list', car: this.evaluateQuouted(node.values[0], env), cdr: { type: 'null' } }
    let curr = list;
    for (let i = 1; i < node.values.length; i++) {
      curr.cdr = { type: 'list', car: this.evaluate(node.values[i], env), cdr: { type: 'null' } }
      curr = curr.cdr
    }
    return list;
  }

  evalCons(node: ConsNode, env: Environment): PrimitiveValue {
    const car = this.evaluate(node.car, env)
    const cdr = this.evaluate(node.cdr, env)
    return { type: 'list', car, cdr }
  }

  /* Evaluate a condition and execute the correspoding statement
   */
  evalConditional(node: ConditionalNode, env: Environment): PrimitiveValue {
    const conditionValue = this.evaluate(node.condition, env);
    if (isTruthyValue(conditionValue)) {
      return this.evaluate(node.then, env);
    } else {
      return this.evaluate(node.else, env);
    }
  }

  evalLambda(node: LambdaNode, env: Environment): PrimitiveValue {
    return {
      type: "function",
      params: node.arguments,
      body: node.body,
      env,
    };
  }

  evalDefine(node: DefineNode, env: Environment): PrimitiveValue {
    env.defineVariable(node.name.value, this.evaluate(node.value, env));
    return { type: "symbol", value: "ok" };
  }

  evalSet(node: SetNode, env: Environment): PrimitiveValue {
    const value = this.evaluate(node.value, env);
    env.setVariableValue(node.name.value, value);
    return value;
  }

  evalBegin(node: BeginNode, env: Environment): PrimitiveValue {
    for (let i = 0; i < node.body.length - 1; i++) {
      this.evaluate(node.body[i], env);
    }
    return this.evaluate(node.body[node.body.length - 1], env);
  }

  /* Execute a function, it evaluates the parameters of the function and
   * lookup the env to find the function definition, if it is not defined
   * throws an error
   */
  apply(node: sExpNode, env: Environment): PrimitiveValue {
    //evaluate parameters
    const paramsValues = node.parameters.map((p) => this.evaluate(p, env));
    let fn

    if (node.identifier.type == 'lambda') {
      fn = this.evaluate(node.identifier, env)
      console.log("appling anonimus function with", paramsValues);
    } else {
      fn = env.lookupVariableValue(node.identifier.value)
      console.log("appling", node.identifier.value, "with", paramsValues);
    }

    if (fn.type == 'nativeFunction') {
      return nativeFunctionRepository.executeNativeFunction(fn.name, paramsValues, env, this.output)
    } else if (fn.type == "function") {
      // extend the current environment
      const newEnv = fn.env.extendEnv();
      console.log(fn.params, paramsValues)
      // check how meny params was passed
      if (fn.params.length !== paramsValues.length) {
        throw Error(
          `Cannot run a function of ${fn.params.length} with ${paramsValues.length} arguments`,
        );
      }
      // define the parameters as variables in the extended environment
      for (let i = 0; i < fn.params.length; i++) {
        newEnv.defineVariable(fn.params[i].value, paramsValues[i]);
      }

      // execute the statements
      for (let i = 0; i < fn.body.length - 1; i++) {
        this.evaluate(fn.body[i], newEnv);
      }

      return this.evaluate(fn.body[fn.body.length - 1], newEnv);
    } else {
      throw Error(`The function ${primitiveValueToString(fn)} is not defined`);
    }
  }
}
