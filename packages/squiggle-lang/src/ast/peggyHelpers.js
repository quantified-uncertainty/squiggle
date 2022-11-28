"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.nodeVoid = exports.nodeTernary = exports.nodeString = exports.nodeModuleIdentifier = exports.nodeLetStatement = exports.nodeLambda = exports.nodeKeyValue = exports.nodeInteger = exports.nodeIdentifier = exports.nodeFloat = exports.nodeCall = exports.nodeBoolean = exports.nodeProgram = exports.nodeBlock = exports.constructRecord = exports.constructArray = exports.makeFunctionCall = exports.postOperatorToFunction = exports.unaryToFunction = exports.toFunction = void 0;
exports.toFunction = {
    "+": "add",
    "-": "subtract",
    "!=": "unequal",
    ".-": "dotSubtract",
    ".*": "dotMultiply",
    "./": "dotDivide",
    ".^": "dotPow",
    ".+": "dotAdd",
    "*": "multiply",
    "/": "divide",
    "&&": "and",
    "^": "pow",
    "<": "smaller",
    "<=": "smallerEq",
    "==": "equal",
    ">": "larger",
    ">=": "largerEq",
    "||": "or",
    to: "credibleIntervalToDistribution"
};
exports.unaryToFunction = {
    "-": "unaryMinus",
    "!": "not",
    ".-": "unaryDotMinus"
};
exports.postOperatorToFunction = {
    ".": "$_atIndex_$",
    "()": "$$_applyAll_$$",
    "[]": "$_atIndex_$"
};
function makeFunctionCall(fn, args, location) {
    if (fn === "$$_applyAll_$$") {
        return nodeCall(args[0], args.splice(1), location);
    }
    else {
        return nodeCall(nodeIdentifier(fn, location), args, location);
    }
}
exports.makeFunctionCall = makeFunctionCall;
function constructArray(elements, location) {
    return { type: "Array", elements: elements, location: location };
}
exports.constructArray = constructArray;
function constructRecord(elements, location) {
    return { type: "Record", elements: elements, location: location };
}
exports.constructRecord = constructRecord;
function nodeBlock(statements, location) {
    return { type: "Block", statements: statements, location: location };
}
exports.nodeBlock = nodeBlock;
function nodeProgram(statements, location) {
    return { type: "Program", statements: statements, location: location };
}
exports.nodeProgram = nodeProgram;
function nodeBoolean(value, location) {
    return { type: "Boolean", value: value, location: location };
}
exports.nodeBoolean = nodeBoolean;
function nodeCall(fn, args, location) {
    return { type: "Call", fn: fn, args: args, location: location };
}
exports.nodeCall = nodeCall;
function nodeFloat(value, location) {
    return { type: "Float", value: value, location: location };
}
exports.nodeFloat = nodeFloat;
function nodeIdentifier(value, location) {
    return { type: "Identifier", value: value, location: location };
}
exports.nodeIdentifier = nodeIdentifier;
function nodeInteger(value, location) {
    return { type: "Integer", value: value, location: location };
}
exports.nodeInteger = nodeInteger;
function nodeKeyValue(key, value, location) {
    if (key.type === "Identifier") {
        key = __assign(__assign({}, key), { type: "String" });
    }
    return { type: "KeyValue", key: key, value: value, location: location };
}
exports.nodeKeyValue = nodeKeyValue;
function nodeLambda(args, body, location, name) {
    return { type: "Lambda", args: args, body: body, location: location, name: name === null || name === void 0 ? void 0 : name.value };
}
exports.nodeLambda = nodeLambda;
function nodeLetStatement(variable, value, location) {
    var patchedValue = value.type === "Lambda" ? __assign(__assign({}, value), { name: variable.value }) : value;
    return { type: "LetStatement", variable: variable, value: patchedValue, location: location };
}
exports.nodeLetStatement = nodeLetStatement;
function nodeModuleIdentifier(value, location) {
    return { type: "ModuleIdentifier", value: value, location: location };
}
exports.nodeModuleIdentifier = nodeModuleIdentifier;
function nodeString(value, location) {
    return { type: "String", value: value, location: location };
}
exports.nodeString = nodeString;
function nodeTernary(condition, trueExpression, falseExpression, location) {
    return {
        type: "Ternary",
        condition: condition,
        trueExpression: trueExpression,
        falseExpression: falseExpression,
        location: location
    };
}
exports.nodeTernary = nodeTernary;
function nodeVoid(location) {
    return { type: "Void", location: location };
}
exports.nodeVoid = nodeVoid;
