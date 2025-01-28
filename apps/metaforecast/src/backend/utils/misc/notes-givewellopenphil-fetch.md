## GiveWell

wget --recursive --no-clobber --html-extension --domains givewell.org --follow-tags=a --reject '_.js,_.css,_.ico,_.txt,_.gif,_.jpg,_.jpeg,_.png,_.mp3,_.mp4,_.pdf,_.tgz,_.flv,_.avi,_.mpeg,_.iso,_.xls,_.xlsx,_.csv,_.doc,_.docx,_.mpa,\*mp4' --ignore-tags=img,link,script --header="Accept: text/html" --no-parent https://www.givewell.org

grep -ri "Internal forecast" -E "prediction|Prediction|forecast|Forecast" \* | sed 's/^/https:\/\/www.givewell.org\//' > searchresults.txt

grep -ril "Internal forecast" -E "prediction|Prediction|forecast|Forecast" \* > searchresults.txt
cat searchresults.txt
cat searchresults.txt | sed 's/^/https:\/\/www.givewell.org\//' > searchresults2.txt
cat searchresults2.txt
grep -v "print" searchresults2.txt > searchresults3.txt

while read line; do
firefox --new-tab "$line"
done < searchresults3.txt

We are experimenting with recording explicit numerical forecasts of the probability of events related to our decision-making (especially grant-making). The idea behind this is to pull out the implicit predictions that are playing a role in our decisions, and to make it possible for us to look back on how well-calibrated and accurate those predictions were.

For this grant, we are recording the following forecasts
For this grant, we are recording the following <a href="https://www.givewell.org/research/internal-forecasts">forecasts</a>:
For this grant, we are recording the following <a href="https://www.givewell.org/research/internal-forecasts">forecast</a>:
For this grant, we are recording the following forecasts (made during our decision process):

We are experimenting with recording explicit numerical forecasts of the probability of events related to our decision-making (especially grant-making). The idea behind this is to pull out the implicit predictions that are playing a role in our decisions, and to make it possible for us to look back on how well-calibrated and accurate those predictions were. For this grant, we are recording the following forecast:

We’re experimenting with recording explicit numerical forecasts of events related to our decisionmaking (especially grantmaking). The idea behind this is to pull out the implicit predictions that are playing a role in our decisions, and make it possible for us to look back on how well-calibrated and accurate those are. For this grant, we are recording the following forecasts:

We’re experimenting with recording explicit numerical forecasts of events related to our decisionmaking (especially grantmaking). The idea behind this is to pull out the implicit predictions that are playing a role in our decisions, and make it possible for us to look back on how well-calibrated and accurate those are.

Divide by h2, then pull the second which has forecasts

## OpenPhil

wget --recursive --no-clobber --html-extension --domains www.openphilanthropy.org --follow-tags=a --reject '_.js,_.css,_.ico,_.txt,_.gif,_.jpg,_.jpeg,_.png,_.mp3,_.mp4,_.pdf,_.tgz,_.flv,_.avi,_.mpeg,_.iso,_.xls,_.xlsx,_.csv,_.doc,_.docx,_.mpa,\*mp4' --ignore-tags=img,link,script --header="Accept: text/html" --no-parent https://www.openphilanthropy.org

Find and delete largest files
du -a . | sort -n -r | head -n 20
find . -xdev -type f -size +100M

find . -type f -exec du -s {} \; | sort -r -k1,1n | head -n 20

grep -ril -E "Internal forecast" \* > searchresults.txt

grep -v "print" searchresults.txt > searchresults2.txt

Note to self: OpenPhil uses h3 headers instead.
