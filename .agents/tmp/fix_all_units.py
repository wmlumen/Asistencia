#!/usr/bin/env python3
"""Fix all 6 units: merge DT, renumber, fix bullets, remove extra </section>."""

import re, os

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  Written: {len(content)} chars")

def find_next_section(content, start_pos):
    """Find the next numbered section comment after start_pos."""
    m = re.search(r'<!-- \d+\.\s+\w+', content[start_pos:])
    if m:
        return start_pos + m.start()
    return -1

def merge_dt_into_ficha(content):
    """
    Merge Desarrollo Teórico section into Ficha de Clase.
    DT is identified as a section with step-number 2 that is NOT Guía de Actividades.
    After DT, the original step-2 Guía de Actividades becomes the new step 2.
    """
    # Find all sections with step-number 2
    pattern_2 = r'(step-number[^>]*>2<)'
    positions = [m.start() for m in re.finditer(pattern_2, content)]
    
    if len(positions) < 2:
        # Only one step-2 section or none - no DT to merge
        return content, False
    
    # The first step-2 section after Ficha (step 1) is Desarrollo Teórico
    # Find step-1 position
    step1_match = re.search(r'step-number[^>]*>1<', content)
    if not step1_match:
        return content, False
    
    # The DT section is the first step-number 2 that appears after step 1
    dt_start = positions[0]
    
    # Verify this is actually Desarrollo Teórico
    # Look for the heading text between here and the next step-2
    section_content = content[dt_start:positions[1]]
    if 'Desarrollo Teórico' not in section_content and 'Desarrollo Teorico' not in section_content:
        # Try next one
        dt_start = positions[1]
        section_content = content[dt_start:positions[2] if len(positions) > 2 else len(content)]
        if 'Desarrollo Teórico' not in section_content and 'Desarrollo Teorico' not in section_content:
            return content, False
    
    # Find the full DT section: from its step-card opening to its </section> before next section
    # Find the beginning of the step-card that contains this step-number
    before_dt = content[:dt_start]
    card_start = before_dt.rfind('<section class="step-card">')
    # Find the preceding section comment if any
    card_comment_start = content.rfind('<!--', card_start - 80, card_start)
    if card_comment_start >= 0 and card_comment_start < card_start:
        section_start = card_comment_start
    else:
        section_start = card_start
    
    # Find where this section ends: the </section> that closes this step-card,
    # followed by the next numbered section or a blank line
    after_dt = content[card_start:]
    
    # Find the matching </section> for this step-card
    # It's the one right before the next step-card or the next comment
    # Strategy: find all </section> positions after card_start
    close_positions = [m.start() for m in re.finditer('</section>', after_dt)]
    if not close_positions:
        return content, False
    
    # The DT section ends at the </section> that is followed by the next section's step-number
    next_step = None
    for cp in close_positions:
        after_close = after_dt[cp + 10:cp + 50]
        next_num = re.search(r'step-number[^>]*>\d+', after_close)
        if next_num:
            # This </section> is followed by another step - this is the DT section end
            next_step = cp + 10 + next_num.start()
            section_end = card_start + cp + 10  # +10 for len('</section>')
            
            # Check: the next section's step-number must be different from DT's
            next_section_num = re.search(r'step-number[^>]*>(\d+)', after_dt[next_step-10-card_start:])
            if next_section_num and next_section_num.group(1) == '2':
                # The next section is also step 2 (Guía de Actividades)
                # This is the correct DT end
                break
        else:
            # Check if it's followed by another section start
            if '<section class="step-card">' in after_close:
                section_end = card_start + cp + 10
                break
    else:
        # Fallback: find </section> before the next step-number 2
        for cp in close_positions:
            after_close = after_dt[cp + 10:cp + 80]
            if 'step-number' in after_close:
                section_end = card_start + cp + 10
                break
        else:
            return content, False
    
    # Extract DT inner content (between content-padding open and close)
    dt_section = content[section_start:section_end]
    
    # Find content-padding
    pad_start = dt_section.find('<div class="content-padding"')
    if pad_start < 0:
        return content, False
    gt_idx = dt_section.index('>', pad_start)
    inner_start = gt_idx + 1
    
    # Find the closing </div> of content-padding
    inner_end = dt_section.rindex('\n            </div>')
    dt_inner = dt_section[inner_start:inner_end].strip()
    
    if not dt_inner:
        return content, False
    
    print(f"  DT section: {len(dt_section)} chars, inner: {len(dt_inner)} chars")
    
    # Remove DT section from content
    before = content[:section_start]
    after = content[section_end:]
    content_no_dt = before + after
    
    # Insert DT content into Ficha de Clase (before its closing </div>)
    ficha_close = '            </div>\n        </section>\n'
    ficha_idx = content_no_dt.index(ficha_close)
    
    # Find if there's content before the </section> that already looks like absorbed DT
    pre_close = content_no_dt[ficha_idx - 200:ficha_idx]
    if 'Desarrollo Teórico' in pre_close or 'absorbido' in pre_close:
        print("  DT already absorbed, skipping insert")
        return content_no_dt, True
    
    dt_block = f'''
            <!-- Desarrollo Teórico -->
            <div style="border-top:2px solid var(--primary-light);padding-top:1rem;margin-top:1rem;width:100%;">
{dt_inner}
            </div>'''
    
    new_content = content_no_dt[:ficha_idx] + dt_block + '\n        </section>\n' + content_no_dt[ficha_idx + len(ficha_close):]
    
    return new_content, True

def renumber_steps(content):
    """
    Renumber: after DT is removed, steps should be 1-7.
    Original: 1(Ficha), 2(DT), 2(Guía), 3(Análisis), 4(Materiales), 5(Evaluación), 6(Conexión), 7(Bibliografía)
    After DT removal: 1(Ficha), 2(Guía), 3(Análisis), 4(Materiales), 5(Evaluación), 6(Conexión), 7(Bibliografía)
    
    Wait - after DT removal, we have: 1, 2, 3, 4, 5, 6, 7 which is already correct.
    No renumbering needed for that case!
    
    For U1 (and U4 which already had no DT): 
    Original: 1(Ficha), 2(DT removed), 3(Guía), 4(Análisis), 5(Materiales), 6(Evaluación), 7(Conexión), 8(Bibliografía)
    After DT removal: 1(Ficha), got mixed... 
    
    Actually U1 already had steps numbered 1-8, and DT was step 2.
    After DT removal of the SECTION + its step number: 1(Ficha), 2(Guía was 3), 3(Análisis was 4), etc.
    But the step-number values in the HTML still say 3, 4, 5, 6, 7, 8.
    So we need to renumber: 3->2, 4->3, 5->4, 6->5, 7->6, 8->7.
    
    For units with TWO step-2 sections (U2, U3, U5, U6):
    After DT section removal: 1, 2, 3, 4, 5, 6, 7 — already correct!
    No renumbering needed.
    
    So: renumber only if there are 8 unique step numbers (1,2,3,4,5,6,7,8)
    or if step numbers go up to 8.
    """
    steps = re.findall(r'step-number[^>]*>(\d+)', content)
    if not steps:
        return content
    
    max_step = max(int(s) for s in steps)
    
    if max_step <= 7:
        print(f"  Steps already 1-{max_step}, no renumbering needed")
        return content
    
    # Need to renumber: all steps >= 3 get decremented by 1
    print(f"  Renumbering steps (max was {max_step})...")
    def replace_step(m):
        prefix = m.group(1)
        num = int(m.group(2))
        suffix = m.group(3)
        if num >= 3:
            return f'{prefix}{num - 1}{suffix}'
        return m.group(0)
    
    # Also renumber section comments
    def replace_comment(m):
        prefix = m.group(1)
        num = int(m.group(2))
        suffix = m.group(3)
        if num >= 3:
            return f'{prefix}{num - 1}{suffix}'
        return m.group(0)
    
    content = re.sub(r'(step-number[^>]*>)(\d+)(<)', replace_step, content)
    content = re.sub(r'(<!-- )(\d+)(\.\s+\w+)', replace_comment, content)
    
    return content

def fix_bullets(content):
    """Remove • from <li> items."""
    return re.sub(r'<li>•\s*', '<li>', content)

def fix_extra_section_close(content):
    """Remove duplicate </section> before Bibliografía."""
    # Look for pattern: </section>\n        </section>\n\n        <!-- 
    content = re.sub(r'</section>\s*\n\s*</section>\s*\n\s*\n\s*<!--\s+\d+\.\s+BIBLIOGRAFÍA', 
                    lambda m: '</section>\n\n        <!-- ' + m.group(0).split('<!--')[1].strip(), 
                    content)
    # Simpler: just remove consecutive </section> tags
    content = re.sub(r'(</section>)\s*\n\s*(</section>)', r'\1', content)
    return content

def process_file(filepath):
    print(f"\n=== {os.path.basename(filepath)} ===")
    content = read_file(filepath)
    original = content
    
    # 1. Merge DT into Ficha
    content, merged = merge_dt_into_ficha(content)
    if merged:
            print("  [OK] DT merged into Ficha de Clase")
    
    # 2. Fix extra </section>
    content = fix_extra_section_close(content)
    
    # 3. Fix bullets
    content = fix_bullets(content)
    
    # 4. Renumber steps
    content = renumber_steps(content)
    
    if content != original:
        write_file(filepath, content)
        print(f"  [OK] File updated")
    else:
        print("  - No changes needed")

if __name__ == '__main__':
    files = [
        'public/UNIDAD_1_MATERIAL_DE_ESTUDIO.html',
        'public/UNIDAD_2_MATERIAL_DE_ESTUDIO.html',
        'public/UNIDAD_3_MATERIAL_DE_ESTUDIO.html',
        'public/UNIDAD_4_MATERIAL_DE_ESTUDIO.html',
        'public/UNIDAD_5_MATERIAL_DE_ESTUDIO.html',
        'public/UNIDAD_6_MATERIAL_DE_ESTUDIO.html',
    ]
    
    for f in files:
        if os.path.exists(f):
            process_file(f)
        else:
            print(f"\n!!! {f} not found!")
    
    print("\n=== All done ===")
