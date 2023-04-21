dir1="/home/loki/Documents/core/software/fresh/js/squiggle/squiggle-animal-model/packages/relative-values/models/src"
dir2="$dir1/templates/relative-values"

template_file="$dir2/relative-values.template"
squiggle_code_file="/home/loki/Documents/core/ea/fresh/QURI/fresh/relative-values/attempt_6_animals/simple-reference-animals.squiggle"
output_file="$dir1/relative-values.ts"


sed '/^SQUIGGLE_CODE/ r '$squiggle_code_file $template_file | sed 's/SQUIGGLE_CODE//g' > $output_file

