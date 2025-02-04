dir="/home/loki/Documents/core/software/fresh/js/metaforecasts/metaforecasts-mongo/src/utils/evals"
fileInput="$dir/metaforecasts_metaculus_v2.tsv"
fileOutput="$dir/results.tsv"

rm -f "$fileOutput"
{

	cat "$fileInput" | tail -n +2	 |  while read line; do
		index=$( echo "$line"  | cut -f 1)
		title=$( echo "$line" | cut -f 2)
		url=$( echo "$line" | cut -f 3 )
		
		echo "$title"
		firefox -P privacy "$url" &

		read -u 3 -p "Scope? " scope
		read -u 3 -p "Decision relevance? " decision
		read -u 3 -p "Forecasting fit? " fit

		echo "$index	$title	$url	$scope	$decision	$fit" >> "$fileOutput"
		echo ""
		echo "***"
		echo ""

	done; 

} 3<&0
