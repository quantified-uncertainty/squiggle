/* * WARNING. DO NOT EDIT, BEAUTIFY, COMMENT ON OR REFACTOR THIS CODE. 
We will stop using MathJs parser and
this whole file will go to trash
**/
module ErrorValue = Reducer_ErrorValue
module ExpressionBuilder = Reducer_Expression_ExpressionBuilder
module ExpressionT = Reducer_Expression_T
module ExpressionValue = ReducerInterface.ExpressionValue
module JavaScript = Reducer_Js
module Parse = Reducer_MathJs_Parse
module Result = Belt.Result

type errorValue = ErrorValue.errorValue
type expression = ExpressionT.expression
type expressionValue = ExpressionValue.expressionValue

let blockToNode = block => block["node"]

let rec fromInnerNode = (mathJsNode: Parse.node): result<expression, errorValue> =>
  Parse.castNodeType(mathJsNode)->Result.flatMap(typedMathJsNode => {
    let fromNodeList = (nodeList: list<Parse.node>): result<list<expression>, 'e> =>
      Belt.List.reduceReverse(nodeList, Ok(list{}), (racc, currNode) =>
        racc->Result.flatMap(acc =>
          fromInnerNode(currNode)->Result.map(currCode => list{currCode, ...acc})
        )
      )

    let caseFunctionNode = fNode => {
      let rLispArgs = fNode["args"]->Belt.List.fromArray->fromNodeList
      rLispArgs->Result.map(lispArgs =>
        ExpressionBuilder.eFunction(fNode->Parse.nameOfFunctionNode, lispArgs)
      )
    }

    let caseObjectNode = oNode => {
      let fromObjectEntries = entryList => {
        let rargs = Belt.List.reduceReverse(entryList, Ok(list{}), (
          racc,
          (key: string, value: Parse.node),
        ) =>
          racc->Result.flatMap(acc =>
            fromInnerNode(value)->Result.map(valueExpression => {
              let entryCode =
                list{ExpressionBuilder.eString(key), valueExpression}->ExpressionT.EList
              list{entryCode, ...acc}
            })
          )
        )
        rargs->Result.flatMap(args =>
          ExpressionBuilder.eFunction("$constructRecord", list{ExpressionT.EList(args)})->Ok
        ) // $constructRecord gets a single argument: List of key-value paiers
      }

      oNode["properties"]->Js.Dict.entries->Belt.List.fromArray->fromObjectEntries
    }

    let caseIndexNode = iNode => {
      let rpropertyCodeList = Belt.List.reduceReverse(
        iNode["dimensions"]->Belt.List.fromArray,
        Ok(list{}),
        (racc, currentPropertyMathJsNode) =>
          racc->Result.flatMap(acc =>
            fromInnerNode(currentPropertyMathJsNode)->Result.map(propertyCode => list{
              propertyCode,
              ...acc,
            })
          ),
      )
      rpropertyCodeList->Result.map(propertyCodeList => ExpressionT.EList(propertyCodeList))
    }

    let caseAccessorNode = (objectNode, indexNode) => {
      caseIndexNode(indexNode)->Result.flatMap(indexCode => {
        fromInnerNode(objectNode)->Result.flatMap(objectCode =>
          ExpressionBuilder.eFunction("$atIndex", list{objectCode, indexCode})->Ok
        )
      })
    }

    let caseBlock = (nodesArray: array<Parse.node>): result<expression, errorValue> => {
      let rStatements: result<list<expression>, 'a> =
        nodesArray
        ->Belt.List.fromArray
        ->Belt.List.reduceReverse(Ok(list{}), (racc, currNode) =>
          racc->Result.flatMap(acc =>
            fromInnerNode(currNode)->Result.map(currCode => list{currCode, ...acc})
          )
        )
      rStatements->Result.map(statements => ExpressionBuilder.eBlock(statements))
    }

    let caseAssignmentNode = aNode => {
      let symbolName = aNode["object"]["name"]
      let rValueExpression = fromInnerNode(aNode["value"])
      rValueExpression->Result.map(valueExpression =>
        ExpressionBuilder.eLetStatement(symbolName, valueExpression)
      )
    }

    let caseFunctionAssignmentNode = faNode => {
      let symbol = faNode["name"]->ExpressionBuilder.eSymbol
      let rValueExpression = fromInnerNode(faNode["expr"])

      rValueExpression->Result.flatMap(valueExpression => {
        let lispParams = ExpressionBuilder.eArrayString(faNode["params"])
        let valueBlock = ExpressionBuilder.eBlock(list{valueExpression})
        let lambda = ExpressionBuilder.eFunction("$$lambda", list{lispParams, valueBlock})
        ExpressionBuilder.eFunction("$let", list{symbol, lambda})->Ok
      })
    }

    let caseArrayNode = aNode => {
      aNode["items"]->Belt.List.fromArray->fromNodeList->Result.map(list => ExpressionT.EList(list))
    }

    let rFinalExpression: result<expression, errorValue> = switch typedMathJsNode {
    | MjAccessorNode(aNode) => caseAccessorNode(aNode["object"], aNode["index"])
    | MjArrayNode(aNode) => caseArrayNode(aNode)
    | MjAssignmentNode(aNode) => caseAssignmentNode(aNode)
    | MjSymbolNode(sNode) => {
        let expr: expression = ExpressionBuilder.eSymbol(sNode["name"])
        let rExpr: result<expression, errorValue> = expr->Ok
        rExpr
      }
    | MjBlockNode(bNode) => bNode["blocks"]->Js.Array2.map(blockToNode)->caseBlock
    | MjConstantNode(cNode) =>
      cNode["value"]->JavaScript.Gate.jsToEv->Result.flatMap(v => v->ExpressionT.EValue->Ok)
    | MjFunctionAssignmentNode(faNode) => caseFunctionAssignmentNode(faNode)
    | MjFunctionNode(fNode) => fNode->caseFunctionNode
    | MjIndexNode(iNode) => caseIndexNode(iNode)
    | MjObjectNode(oNode) => caseObjectNode(oNode)
    | MjOperatorNode(opNode) => opNode->Parse.castOperatorNodeToFunctionNode->caseFunctionNode
    | MjParenthesisNode(pNode) => pNode["content"]->fromInnerNode
    }
    rFinalExpression
  })

let fromNode = (node: Parse.node): result<expression, errorValue> =>
  fromInnerNode(node)->Result.map(expr => ExpressionBuilder.eBlock(list{expr}))
