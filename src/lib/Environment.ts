import type { PrimitiveValue } from "./InterpreterDataTypes";

export class Environment {
  env: {
    [key: string]: PrimitiveValue;
  } = {};
  parent?: Environment;
  constructor(parentEnv?: Environment) {
    this.parent = parentEnv;
  }

  lookupVariableValue(key: string): PrimitiveValue {
    const value = this.env[key];
    if (!value) {
      if (this.parent) return this.parent.lookupVariableValue(key);
      else throw Error("Undefined Symbol");
    } else {
      return value;
    }
  }

  defineVariable(key: string, value: PrimitiveValue) {
    this.env[key] = value;
  }

  setVariableValue(key: string, value: PrimitiveValue) {
    if (this.env[key] === undefined) {
      if (!this.parent) {
        throw Error(
          "Undefined Variable, try to use a variable that is not defined"
        );
      }
      this.parent.setVariableValue(key, value);
    }
    this.env[key] = value;
  }

  extendEnv() {
    return new Environment(this);
  }

  print() {
    console.log(this.env);
  }
}

