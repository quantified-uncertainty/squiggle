@genType.opaque type result_<'a, 'e> = result<'a, 'e>

/*
The reason this is not ExpressionValue is that ExpressionValue is becoming a parametric type
to allow expressions for different domains.
So we rename it right away not cause a compatibility problem
*/
@genType.opaque type squiggleValue = ReducerInterface_InternalExpressionValue.t
@genType.opaque type squiggleValue_Array = ReducerInterface_InternalExpressionValue.squiggleArray
@genType.opaque
type squiggleValue_Declaration = ReducerInterface_InternalExpressionValue.lambdaDeclaration
@genType.opaque type squiggleValue_Module = ReducerInterface_InternalExpressionValue.nameSpace
@genType.opaque type squiggleValue_Lambda = ReducerInterface_InternalExpressionValue.lambdaValue
@genType.opaque type squiggleValue_Record = ReducerInterface_InternalExpressionValue.map
@genType.opaque type squiggleValue_Type = ReducerInterface_InternalExpressionValue.map
@genType.opaque type reducerErrorValue = Reducer_ErrorValue.errorValue

@genType.opaque type reducerProject = ReducerProject_T.t

// From now on one should introduce any new types as opaque types.
// Exception: The intended type is really a JavaScript type or record. Not by coincidence
// Already existing open types we cannot dive in now
@genType type environment = GenericDist.env
@genType type squiggleValue_Distribution = DistributionTypes.genericDist

//TODO: index.ts should use types from here or vice versa
