import type { Environment } from "./Environment";
import type { StatementNode } from "./ParserNodeTypes";

export type SymbolValue = {
  type: "symbol";
  value: string;
};
export type ListValue = {
  type: "list";
  car: PrimitiveValue;
  cdr: PrimitiveValue;
}
export type NativeFunction = {
  type: "nativeFunction";
  name: string;
}

export type PrimitiveValue =
  | SymbolValue
  | ListValue
  | NativeFunction
  | {
    type: "string";
    value: string;
  }
  | {
    type: "number";
    value: number;
  }
  | {
    type: "function";
    params: SymbolValue[];
    body: StatementNode[];
    env: Environment;
  }
  | {
    type: 'null';
  };

export function primitiveValueToString(v: PrimitiveValue): string {
  switch (v.type) {
    case "number":
      return v.value.toString()
    case "string":
    case "symbol":
      return v.value
    case "function":
      return `function ${v.params.length}`
    case "list":
      let value = `(${primitiveValueToString(v.car)}`
      if (v.cdr.type == 'list') {
        value += " " + primitiveValueToString(v.cdr).slice(1)
      } else if (v.cdr.type == 'null') {
        value += ')'
      } else {
        value += ` ${primitiveValueToString(v.cdr)})`
      }
      return value
    case "null":
      return ''
    case "nativeFunction":
      return "nativeFunction: " + v.name
  }
}



/* Used in comparisons, define if a value is consider tru
 */
export function isTruthyValue(v: PrimitiveValue) {
  return (
    (v.type == "string" && v.value != "") ||
    (v.type == "number" && v.value != 0) ||
    (v.type == "symbol" && v.value != "false") ||
    v.type == "function" ||
    v.type == 'list'
  );
}
