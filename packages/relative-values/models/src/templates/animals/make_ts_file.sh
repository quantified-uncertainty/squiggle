dir1="/home/loki/Documents/core/software/fresh/js/squiggle/squiggle-animal-model/packages/animals/models/src"
dir2="$dir1/templates/animals"

template_file="$dir2/animals.template"
squiggle_code_file="/home/loki/Documents/core/ea/fresh/QURI/fresh/animals/attempt_6_animals/simple-reference-animals.squiggle"
output_file="$dir1/animals.ts"


sed '/^SQUIGGLE_CODE/ r '$squiggle_code_file $template_file | sed 's/SQUIGGLE_CODE//g' > $output_file

