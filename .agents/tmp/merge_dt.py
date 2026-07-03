#!/usr/bin/env python3
"""Merge Desarrollo Teórico section into Ficha de Clase and renumber steps."""

import os, re, sys

def merge_dt(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    unit_name = os.path.basename(filepath)
    
    # Find the DT section
    dt_start_marker = '<!-- 2. DESARROLLO TEÓRICO -->'
    # Try to find what comes after DT section (next numbered section)
    # Search for the next numbered section comment
    next_section_match = re.search(r'<!-- \d+\.\s+\w+', content[content.find(dt_start_marker) + len(dt_start_marker):])
    
    if dt_start_marker not in content:
        print(f"{unit_name}: No DT section found (may already be merged or never had one)")
        return False
    
    start_idx = content.index(dt_start_marker)
    
    # Find the end of the DT section - it ends with </section> before the next numbered section
    after_dt = content[start_idx + len(dt_start_marker):]
    # Find next numbered comment
    next_comment_match = re.search(r'<!-- \d+\.\s+', after_dt)
    if not next_comment_match:
        print(f"{unit_name}: Cannot find next section after DT")
        return False
    
    # The DT section ends with </section> followed by blank lines then the next comment
    section_end_marker = '</section>'
    dt_after_section_start = after_dt[:next_comment_match.start()]
    last_section_close = dt_after_section_start.rfind(section_end_marker)
    if last_section_close < 0:
        print(f"{unit_name}: Cannot find section close for DT")
        return False
    
    end_idx = start_idx + len(dt_start_marker) + last_section_close + len(section_end_marker)
    dt_section = content[start_idx:end_idx]
    
    # Extract DT inner content (between content-padding div open and close)
    dt_pad_start = '<div class="content-padding"'
    pad_start_idx = dt_section.index(dt_pad_start)
    # Find the > that closes the content-padding opening tag
    gt_idx = dt_section.index('>', pad_start_idx)
    inner_start = gt_idx + 1
    
    # Find the closing </div> of content-padding
    inner_end = dt_section.rindex('            </div>')
    dt_inner = dt_section[inner_start:inner_end].strip()
    
    print(f"{unit_name}: DT inner content: {len(dt_inner)} chars")
    
    # Remove DT section from content
    content_without_dt = content[:start_idx] + content[end_idx:]
    
    # Insert DT content into Ficha de Clase (before its closing </div> + </section>)
    # Find the first section's content-padding close
    ficha_close = '            </div>\n        </section>'
    ficha_idx = content_without_dt.index(ficha_close)
    
    dt_block = f'''\n\n            <!-- Desarrollo Teórico (absorbido en Ficha de Clase) -->\n            <div style="border-top:2px solid var(--primary-light);padding-top:1rem;margin-top:1rem;width:100%;">\n{dt_inner}\n            </div>'''
    
    new_content = content_without_dt[:ficha_idx] + dt_block + '\n        </section>' + content_without_dt[ficha_idx + len(ficha_close):]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"{unit_name}: DT merged into Ficha de Clase successfully")
    return True

def renumber(filepath):
    """Renumber steps 3-8 to 2-7 after DT section removal."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    unit_name = os.path.basename(filepath)
    
    # Find all step-number occurrences
    # We need to match: step-number">X or step-number" style="...">X
    pattern = r'(step-number[^>]*>)(\d+)(<)'
    
    def renumber_match(m):
        prefix = m.group(1)
        num = int(m.group(2))
        suffix = m.group(3)
        # Renumber: if num >= 3, subtract 1 (since DT was step 2 and was removed)
        if num >= 3:
            new_num = num - 1
            return f'{prefix}{new_num}{suffix}'
        return m.group(0)
    
    new_content = re.sub(pattern, renumber_match, content)
    
    # Also renumber the section comments
    comment_pattern = r'(<!-- )(\d+)(\.\s+\w+)'
    def renumber_comment(m):
        prefix = m.group(1)
        num = int(m.group(2))
        suffix = m.group(3)
        if num >= 3:
            new_num = num - 1
            return f'{prefix}{new_num}{suffix}'
        return m.group(0)
    
    new_content = re.sub(comment_pattern, renumber_comment, new_content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"{unit_name}: Renumbered steps 3-8 -> 2-7")
    return True

def fix_bibliography_bullets(filepath):
    """Remove • from <li> items in bibliografía section."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Only replace • that appears right after <li> (inside bibliografia section)
    # Pattern: <li>• </li> -> <li></li>
    content = re.sub(r'<li>• ', '<li>', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    return True

def fix_extra_section(filepath):
    """Remove duplicate </section> if present."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Look for patterns where two </section> appear close together
    # (from the diagnostic, this happens before Bibliografía)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return True

if __name__ == '__main__':
    files = [
        'public/UNIDAD_1_MATERIAL_DE_ESTUDIO.html',
        'public/UNIDAD_2_MATERIAL_DE_ESTUDIO.html',
        'public/UNIDAD_3_MATERIAL_DE_ESTUDIO.html',
        'public/UNIDAD_5_MATERIAL_DE_ESTUDIO.html',
        'public/UNIDAD_6_MATERIAL_DE_ESTUDIO.html',
    ]
    
    for f in files:
        if not os.path.exists(f):
            print(f"SKIP {f}: not found")
            continue
        merge_dt(f)
        renumber(f)
    
    # Fix bibliografía bullets in all files (including U4 which was already renumbered)
    for f in files + ['public/UNIDAD_4_MATERIAL_DE_ESTUDIO.html']:
        if not os.path.exists(f):
            continue
        with open(f, 'r', encoding='utf-8') as fh:
            content = fh.read()
        content = re.sub(r'<li>•\s*', '<li>', content)
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)
        print(f"{os.path.basename(f)}: bullets fixed")
    
    print("Done!")
