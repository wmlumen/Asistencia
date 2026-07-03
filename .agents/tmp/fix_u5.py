#!/usr/bin/env python3
"""Fix U5: merge DT into Ficha de Clase."""
import re

path = 'public/UNIDAD_5_MATERIAL_DE_ESTUDIO.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the two step-number 2 sections
# DT starts before step-number 2 at position 3427
# Guia starts at step-number 2 at position 24965

# Find the card_start for DT (the <section class="step-card"> before step-number 2 at 3427)
dt_step2_pos = 3427
before_dt = content[:dt_step2_pos]
card_start = before_dt.rfind('<section class="step-card">')
# Also find the comment before it
comment_before = content.rfind('<!--', card_start - 80, card_start)
if comment_before >= 0:
    section_start = comment_before
else:
    section_start = card_start

print(f'DT card starts at: {section_start}')

# Find where the DT section ends - it's before the second step-number 2 (Guia de Actividades)
# The DT section ends with </section> followed by whitespace then the next section
guia_step2_pos = 24965
after_dt_section = content[card_start:guia_step2_pos]

# Find the last </section> in the DT section
last_close = after_dt_section.rfind('</section>')
if last_close >= 0:
    section_end = card_start + last_close + 10  # +10 for '</section>'
    print(f'DT section ends at: {section_end}')
else:
    print('ERROR: Cannot find section close')
    exit(1)

# Extract DT section and inner content
dt_section = content[section_start:section_end]

# Find content-padding inner content
pad_start = dt_section.find('<div class="content-padding"')
gt_idx = dt_section.index('>', pad_start)
inner_start = gt_idx + 1
inner_end = dt_section.rindex('\n            </div>')
dt_inner = dt_section[inner_start:inner_end].strip()

print(f'DT section: {len(dt_section)} chars, inner: {len(dt_inner)} chars')

# Remove the DT section from content
content_without_dt = content[:section_start] + content[section_end:]

# Now insert DT inner content into Ficha de Clase
# Ficha de Clase ends with </div> + </section> 
ficha_close = '            </div>\n        </section>\n'
ficha_idx = content_without_dt.index(ficha_close)

dt_block = f'''
            <!-- Desarrollo Teórico -->
            <div style="border-top:2px solid var(--primary-light);padding-top:1rem;margin-top:1rem;width:100%;">
{dt_inner}
            </div>'''

new_content = content_without_dt[:ficha_idx] + dt_block + '\n        </section>\n' + content_without_dt[ficha_idx + len(ficha_close):]

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('U5: DT merged successfully')
print(f'Original: {len(content)} chars -> New: {len(new_content)} chars')

# Verify step numbers
steps = re.findall(r'step-number[^>]*>(\d+)', new_content)
print(f'Step numbers after merge: {steps}')
