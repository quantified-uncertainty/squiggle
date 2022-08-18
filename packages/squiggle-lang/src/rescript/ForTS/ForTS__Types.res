/* 
The reason this is not ExpressionValue is that ExpressionValue is becoming a parametric type
to allow expressions for different domains.
So we rename it right away not cause a compatibility problem
*/
@genType.opaque type result_<'a, 'e> = result<'a, 'e>

@genType.opaque type squiggleValue
@genType.opaque type squiggleValue_Array
@genType.opaque type squiggleValue_ArrayString
@genType.opaque type squiggleValue_Date
@genType.opaque type squiggleValue_Declaration
@genType.opaque type squiggleValue_Distribution 
@genType.opaque type squiggleValue_Lambda 
@genType.opaque type squiggleValue_Record
@genType.opaque type squiggleValue_TimeDuration
@genType.opaque type squiggleValue_Type
@genType.opaque type squiggleValue_Void
@genType.opaque type reducer_errorValue

