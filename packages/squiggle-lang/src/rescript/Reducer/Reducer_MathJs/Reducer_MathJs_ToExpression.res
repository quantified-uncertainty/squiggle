module ErrorValue = Reducer_ErrorValue
module ExpressionValue = ReducerInterface.ExpressionValue
module ExtressionT = Reducer_Expression_T
module JavaScript = Reducer_Js
module Parse = Reducer_MathJs_Parse
module Result = Belt.Result

type expression = ExtressionT.expression
type expressionValue = ExpressionValue.expressionValue
type errorValue = ErrorValue.errorValue

let rec fromNode = (mjnode: Parse.node): result<expression, errorValue> =>
  Parse.castNodeType(mjnode)->Result.flatMap(typedMjNode => {
    let fromNodeList = (nodeList: list<Parse.node>): result<list<expression>, 'e> =>
      Belt.List.reduceReverse(nodeList, Ok(list{}), (racc, currNode) =>
        racc->Result.flatMap(acc =>
          fromNode(currNode)->Result.map(currCode => list{currCode, ...acc})
        )
      )

    let caseFunctionNode = fNode => {
      let fn = fNode["fn"]->ExpressionValue.EvSymbol->ExtressionT.EValue
      let lispArgs = fNode["args"]->Belt.List.fromArray->fromNodeList
      lispArgs->Result.map(argsCode => list{fn, ...argsCode}->ExtressionT.EList)
    }

    let caseObjectNode = oNode => {
      let fromObjectEntries = entryList => {
        let rargs = Belt.List.reduceReverse(entryList, Ok(list{}), (
          racc,
          (key: string, value: Parse.node),
        ) =>
          racc->Result.flatMap(acc =>
            fromNode(value)->Result.map(valueExpression => {
              let entryCode =
                list{
                  key->ExpressionValue.EvString->ExtressionT.EValue,
                  valueExpression,
                }->ExtressionT.EList
              list{entryCode, ...acc}
            })
          )
        )
        let lispName = "$constructRecord"->ExpressionValue.EvSymbol->ExtressionT.EValue
        rargs->Result.map(args => list{lispName, ExtressionT.EList(args)}->ExtressionT.EList)
      }

      oNode["properties"]->Js.Dict.entries->Belt.List.fromArray->fromObjectEntries
    }

    let caseIndexNode = iNode => {
      let rpropertyCodeList = Belt.List.reduceReverse(
        iNode["dimensions"]->Belt.List.fromArray,
        Ok(list{}),
        (racc, currentPropertyMjNode) =>
          racc->Result.flatMap(acc =>
            fromNode(currentPropertyMjNode)->Result.map(propertyCode => list{propertyCode, ...acc})
          ),
      )
      rpropertyCodeList->Result.map(propertyCodeList => ExtressionT.EList(propertyCodeList))
    }

    let caseAccessorNode = (objectNode, indexNode) => {
      let fn = "$atIndex"->ExpressionValue.EvSymbol->ExtressionT.EValue

      caseIndexNode(indexNode)->Result.flatMap(indexCode => {
        fromNode(objectNode)->Result.map(objectCode =>
          list{fn, objectCode, indexCode}->ExtressionT.EList
        )
      })
    }

    switch typedMjNode {
    | MjArrayNode(aNode) =>
      aNode["items"]->Belt.List.fromArray->fromNodeList->Result.map(list => ExtressionT.EList(list))
    | MjConstantNode(cNode) =>
      cNode["value"]->JavaScript.Gate.jsToEv->Result.map(v => v->ExtressionT.EValue)
    | MjFunctionNode(fNode) => fNode->caseFunctionNode
    | MjOperatorNode(opNode) => opNode->Parse.castOperatorNodeToFunctionNode->caseFunctionNode
    | MjParenthesisNode(pNode) => pNode["content"]->fromNode
    | MjAccessorNode(aNode) => caseAccessorNode(aNode["object"], aNode["index"])
    | MjObjectNode(oNode) => caseObjectNode(oNode)
    | MjSymbolNode(sNode) => sNode["name"]->ExpressionValue.EvSymbol->ExtressionT.EValue->Ok
    | MjIndexNode(iNode) => caseIndexNode(iNode)
    }
  })
