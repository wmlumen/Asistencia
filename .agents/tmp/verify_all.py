#!/usr/bin/env python3
"""Verify all 6 units are properly structured."""
import re

files = [
    'public/UNIDAD_1_MATERIAL_DE_ESTUDIO.html',
    'public/UNIDAD_2_MATERIAL_DE_ESTUDIO.html',
    'public/UNIDAD_3_MATERIAL_DE_ESTUDIO.html',
    'public/UNIDAD_4_MATERIAL_DE_ESTUDIO.html',
    'public/UNIDAD_5_MATERIAL_DE_ESTUDIO.html',
    'public/UNIDAD_6_MATERIAL_DE_ESTUDIO.html',
]

for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()
    
    steps = re.findall(r'step-number[^>]*>(\d+)', content)
    section_opens = content.count('<section')
    section_closes = content.count('</section>')
    extra_closes = section_closes - section_opens
    bullets = content.count('<li>\u2022')
    
    # Check if any step-number 2 has "Desarrollo Teorico" heading
    has_dt = 'Desarrollo Teórico' in content
    
    print(f'{f.split("_")[1]}: steps={steps} sections={section_opens}/{section_closes} extra_close={extra_closes} bullets={bullets} has_DT={has_dt}')
