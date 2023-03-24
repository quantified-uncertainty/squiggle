template_file="/home/loki/Documents/core/software/fresh/js/squiggle/squiggle-buy-relative/packages/relative-values/src/builtins/templates/some-things-you-should-buy.template"
output_file="/home/loki/Documents/core/software/fresh/js/squiggle/squiggle-buy-relative/packages/relative-values/src/builtins/things-you-should-buy.ts"

sed '/^SQUIGGLE_CODE/ r /home/loki/Documents/core/ea/fresh/QURI/fresh/relative-values/attempt_4_buy/buy.squiggle' $template_file | sed 's/SQUIGGLE_CODE//g' > $output_file

