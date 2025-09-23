import type { Environment } from "./Environment";
import {
	isTruthyValue,
	type ListValue,
	type PrimitiveValue,
	primitiveValueToString,
} from "./InterpreterDataTypes";
import type { NumberNode, SymbolNode } from "./ParserNodeTypes";

export type NativeFunction = (
	params: PrimitiveValue[],
	environment: Environment,
	output: string[],
) => PrimitiveValue;

export class NativeFunctionRepository {
	functions: {
		[key: string]: {
			// if the value is a number that means the function can accept at leats
			// that number of parameters, it is like a min value, if you pass
			// an array with values that means you can only accept that number of
			// values, e.g. [3, 4, 5] means it can only take 3, 4, or 5 parameters
			paramsCount: number | number[];
			fn: NativeFunction;
		};
	} = {};

	addFunction(
		label: string,
		paramsCount: number | number[],
		fn: NativeFunction,
	) {
		this.functions[label] = { paramsCount, fn };
	}

	isNativeFunction(label: string) {
		return this.functions[label] !== undefined;
	}

	loadNativeFunctionsIntoEnvironment(env: Environment) {
		for (const label in this.functions) {
			env.defineVariable(label, { type: "nativeFunction", name: label });
		}
	}

	executeNativeFunction(
		fnName: string,
		params: PrimitiveValue[],
		env: Environment,
		output: string[],
	): PrimitiveValue {
		const fn = this.functions[fnName];

		if (typeof fn.paramsCount === "number") {
			if (params.length < fn.paramsCount) {
				throw Error(
					`The function ${fnName} need at least ${fn.paramsCount} arguments`,
				);
			}
		} else if (!fn.paramsCount.includes(params.length)) {
			throw new Error(
				`The function ${fnName} does not accept ${fn.paramsCount.length} arguments`,
			);
		}

		return this.functions[fnName].fn(params, env, output);
	}
}

export const nativeFunctionRepository = new NativeFunctionRepository();

const addition: NativeFunction = (params, _env, _output) => {
	let res = 0;
	for (const v of params) {
		if (v.type !== "number") {
			throw Error("Can only sum numbers");
		}
		res += v.value;
	}
	return { type: "number", value: res };
};
nativeFunctionRepository.addFunction("+", 1, addition);

const subtraction: NativeFunction = (params, _env, _output) => {
	if (params[0].type !== "number") {
		throw Error("Can only subtract numbers");
	}
	if (params.length === 1) {
		return { type: "number", value: -params[0].value };
	}
	if (params[1].type !== "number") {
		throw Error("Can only subtract numbers");
	}
	return { type: "number", value: params[0].value - params[1].value };
};
nativeFunctionRepository.addFunction("-", [2], subtraction);

const multiplication: NativeFunction = (params, _env, _output) => {
	let res = 1;
	for (const v of params) {
		if (v.type !== "number") {
			throw Error("Can only sum numbers");
		}
		res *= v.value;
	}
	return { type: "number", value: res };
};
nativeFunctionRepository.addFunction("*", 2, multiplication);

const divition: NativeFunction = (params, _env, _output) => {
	if (params[0].type !== "number") {
		throw Error("Can only divide numbers");
	}
	if (params[1].type !== "number") {
		throw Error("Can only divide numbers");
	}
	return { type: "number", value: params[0].value / params[1].value };
};
nativeFunctionRepository.addFunction("/", [2], divition);

const modulo: NativeFunction = (params, _env, _output) => {
	if (params[0].type !== "number") {
		throw Error("Can only apply modulo on numbers");
	}
	if (params[1].type !== "number") {
		throw Error("Can only apply modulo on numbers");
	}
	return { type: "number", value: params[0].value % params[1].value };
};
nativeFunctionRepository.addFunction("/", [2], modulo);

const equal: NativeFunction = (params, _env, _output) => {
	let equals = true;
	if (params[0].type === "function" || params[0].type === "list") {
		throw Error("Cannot compare functions or lists");
	}
	for (let i = 1; i < params.length; i++) {
		if (params[i].type === "function" || params[i].type === "list") {
			throw Error("Cannot compare functions or lists");
		}
		equals =
			params[i - 1].type === params[i].type &&
			(params[i - 1] as SymbolNode | NumberNode).value ===
				(params[i] as SymbolNode | NumberNode).value;
		if (!equals) {
			return { type: "boolean", value: false };
		}
	}
	return { type: "boolean", value: true };
};
nativeFunctionRepository.addFunction("=", 2, equal);

const print: NativeFunction = (params, _env, output) => {
	let result = "";
	for (const p of params) {
		result += `${primitiveValueToString(p)} `;
	}
	output.push(result);
	return { type: "null" };
};
nativeFunctionRepository.addFunction("print", 1, print);

const mt: NativeFunction = (params, _env, _output) => {
	if (params[0].type === "number" && params[1].type === "number") {
		if (params[0].value > params[1].value) {
			return { type: "boolean", value: true };
		} else {
			return { type: "boolean", value: false };
		}
	} else {
		throw Error("Can only compare numbers");
	}
};
nativeFunctionRepository.addFunction(">", [2], mt);

const lt: NativeFunction = (params, _env, _output) => {
	if (params[0].type === "number" && params[1].type === "number") {
		if (params[0].value < params[1].value) {
			return { type: "boolean", value: true };
		} else {
			return { type: "boolean", value: false };
		}
	} else {
		throw Error("Can only compare numbers");
	}
};
nativeFunctionRepository.addFunction("<", [2], lt);

const and: NativeFunction = (params, _env, _output) => {
	let ok = true;
	for (let i = 0; i < params.length; i++) {
		ok = ok && isTruthyValue(params[i]);
		if (!ok) {
			return { type: "boolean", value: false };
		}
	}
	return { type: "boolean", value: true };
};
nativeFunctionRepository.addFunction("and", 2, and);

const or: NativeFunction = (params, _env, _output) => {
	let ok = false;
	for (let i = 0; i < params.length; i++) {
		ok = ok || isTruthyValue(params[i]);
		if (ok) {
			return { type: "boolean", value: true };
		}
	}
	return { type: "boolean", value: false };
};
nativeFunctionRepository.addFunction("or", 2, or);

const car: NativeFunction = (params, _env, _output) => {
	if (params[0].type !== "list") {
		throw Error("Cannot use car in a non list value");
	}
	return params[0].car;
};
nativeFunctionRepository.addFunction("car", [1], car);

const cdr: NativeFunction = (params, _env, _output) => {
	if (params[0].type !== "list") {
		throw Error("Cannot use car in a non list value");
	}
	return params[0].cdr;
};
nativeFunctionRepository.addFunction("cdr", [1], cdr);

const list: NativeFunction = (params, _env, _output) => {
	if (params.length === 0) {
		return { type: "null" };
	}
	const list: ListValue = {
		type: "list",
		car: params[0],
		cdr: { type: "null" },
	};
	let curr = list;
	for (let i = 1; i < params.length; i++) {
		curr.cdr = { type: "list", car: params[i], cdr: { type: "null" } };
		curr = curr.cdr;
	}
	return list;
};
nativeFunctionRepository.addFunction("list", 0, list);

const isNull: NativeFunction = (params, _env, _output) => {
	if (params[0].type === "null") {
		return { type: "boolean", value: true };
	}
	return { type: "boolean", value: false };
};
nativeFunctionRepository.addFunction("null?", [1], isNull);

const isString: NativeFunction = (params, _env, _output) => {
	if (params[0].type === "string") {
		return { type: "boolean", value: true };
	}
	return { type: "boolean", value: false };
};
nativeFunctionRepository.addFunction("string?", [1], isString);

const isNumber: NativeFunction = (params, _env, _output) => {
	if (params[0].type === "number") {
		return { type: "boolean", value: true };
	}
	return { type: "boolean", value: false };
};
nativeFunctionRepository.addFunction("number?", [1], isNumber);

const isFunction: NativeFunction = (params, _env, _output) => {
	if (params[0].type === "function") {
		return { type: "boolean", value: true };
	}
	return { type: "boolean", value: false };
};
nativeFunctionRepository.addFunction("function?", [1], isFunction);

const isList: NativeFunction = (params, _env, _output) => {
	if (params[0].type === "list") {
		return { type: "boolean", value: true };
	}
	return { type: "boolean", value: false };
};
nativeFunctionRepository.addFunction("list?", [1], isList);

const nativeFunctionsLoaded: NativeFunction = () => {
	return { type: "boolean", value: true };
};
nativeFunctionRepository.addFunction(
	"nativeFunctionsLoaded",
	[0],
	nativeFunctionsLoaded,
);
