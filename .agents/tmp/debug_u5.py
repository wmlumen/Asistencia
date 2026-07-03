#!/usr/bin/env python3
import re

with open('public/UNIDAD_5_MATERIAL_DE_ESTUDIO.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all step-number 2 positions
pattern_2 = r'(step-number[^>]*>2<)'
positions = [m.start() for m in re.finditer(pattern_2, content)]
print(f'Step-2 positions: {positions}')
print(f'Number: {len(positions)}')

if len(positions) >= 2:
    section_content = content[positions[0]:positions[1]]
    print(f'Section content between first and second step-2 ({len(section_content)} chars)')
    print('First 500 chars:')
    print(section_content[:500])
    
    # Check for Desarrollo Teorico
    for variant in ['Desarrollo Teórico', 'Desarrollo Teorico', 'DESARROLLO TEÓRICO']:
        print(f'  Has "{variant}": {variant in section_content}')
    
    # Find Desarrollo
    idx_dev = section_content.find('Desarrollo')
    if idx_dev >= 0:
        print(f'Found Desarrollo at {idx_dev}')
        print(f'  Context: {repr(section_content[idx_dev:idx_dev+60])}')
    else:
        print('Desarrollo NOT FOUND in section_content')
        
    # What IS in the section_content around the heading area?
    # Find h2 tags
    h2_matches = list(re.finditer(r'<h2[^>]*>.*?</h2>', section_content))
    print(f'h2 tags in section: {len(h2_matches)}')
    for m in h2_matches:
        print(f'  h2: {m.group()[:80]}')

# Also check the overall step-number context
all_steps = list(re.finditer(r'(step-number[^>]*>(\d+)<)', content))
print(f'\nAll step numbers:')
for m in all_steps:
    pos = m.start()
    context = content[max(0,pos-50):pos+20]
    print(f'  pos={pos}: num={m.group(2)} context={repr(context[:60])}')
