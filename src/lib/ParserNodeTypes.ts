export type SymbolNode = {
	type: "symbol";
	value: string;
};

export type BooleanNode = {
	type: "boolean";
	value: boolean;
};

export type NumberNode = {
	type: "number";
	value: number;
};

export type StringNode = {
	type: "string";
	value: string;
};

export type ConsNode = {
	type: "list";
	car: StatementNode | Atom | ListNode;
	cdr: StatementNode | Atom | ListNode;
};

export type ListNode = {
	type: "literalListNode";
	values: LiteralNode[];
};

export type LiteralNode =
	| SymbolNode
	| NumberNode
	| StringNode
	| ListNode
	| BooleanNode;

export type Atom =
	| BooleanNode
	| SymbolNode
	| NumberNode
	| StringNode
	| ConsNode
	| QuotedNode;

// normal form nodes

export type DefineNode = {
	type: "define";
	name: SymbolNode;
	value: ASTNode;
};

export type LambdaNode = {
	type: "lambda";
	arguments: SymbolNode[];
	body: StatementNode[];
};

export type BeginNode = {
	type: "begin";
	body: StatementNode[];
};

export type SetNode = {
	type: "set";
	name: SymbolNode;
	value: ASTNode;
};

export type StatementNode =
	| QuotedNode
	| LiteralNode
	| sExpNode
	| DefineNode
	| LambdaNode
	| ConditionalNode
	| BeginNode
	| ConsNode
	| SetNode;

export type QuotedNode = {
	type: "quoted";
	value: SymbolNode;
};
export type FunctionNameNode = SymbolNode | LambdaNode;

export type sExpNode = {
	type: "sExpression";
	identifier: FunctionNameNode;
	parameters: ASTNode[];
};

export type ConditionalNode = {
	type: "conditional";
	condition: ASTNode;
	then: ASTNode;
	else: ASTNode;
};

export type ASTNode =
	| SymbolNode
	| NumberNode
	| StringNode
	| DefineNode
	| LambdaNode
	| QuotedNode
	| sExpNode
	| ConditionalNode
	| BeginNode
	| SetNode
	| ListNode
	| BooleanNode
	| ConsNode;
