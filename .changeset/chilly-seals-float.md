import re

def fix_indentation_and_spacing(file_path):
    with open(file_path, 'r') as file:
        lines = file.readlines()

    fixed_lines = []
    for line in lines:
        line = line.replace('    ', '  ')
        line = line.replace('\t', '  ')
        line = re.sub(r'\s*([(){}<>+=-])\s*', r' \1 ', line)
        fixed_lines.append(line)

    with open(file_path, 'w') as file:
        file.writelines(fixed_lines)

fix_indentation_and_spacing('.changeset/chilly-seals-float.md')
