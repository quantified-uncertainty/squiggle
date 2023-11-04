import re

def fix_indentation_and_spacing(file_path):
    with open(file_path, 'r') as file:
        lines = file.readlines()

    fixed_lines = []
    for line in lines:
        # Replace 4-space indentation with 2 spaces
        line = line.replace('    ', '  ')
        # Replace tab indentation with 2 spaces
        line = line.replace('\t', '  ')
        # Ensure consistent spacing around operators, parentheses, and brackets
        line = re.sub(r'\s*([(){}<>+=-])\s*', r' \1 ', line)
        fixed_lines.append(line)

    with open(file_path, 'w') as file:
        file.writelines(fixed_lines)

fix_indentation_and_spacing('.changeset/afraid-radios-taste.md')
