#!/usr/bin/env python3
"""Verify all changes for unit visibility control."""
import re

# 1. Check script.js
with open('public/script.js', 'r', encoding='utf-8') as f:
    content = f.read()
modules = re.findall(r'(unidad_\d):\s+{', content)
print(f'[script.js] Unit modules in SYSTEM_MODULES: {[m[0] for m in modules]}')

# 2. Check lecciones.html
with open('public/lecciones.html', 'r', encoding='utf-8') as f:
    content = f.read()
ids = re.findall(r'id="card-u\d"', content)
print(f'[lecciones.html] Card IDs: {ids}')
has_script_js = 'script.js' in content
print(f'[lecciones.html] Has script.js reference: {has_script_js}')
has_visibility = 'aplicarVisibilidadUnidades' in content
print(f'[lecciones.html] Has visibility script: {has_visibility}')
has_empty_msg = 'empty-unidades-msg' in content
print(f'[lecciones.html] Has empty state message: {has_empty_msg}')

# 3. Check admin.html
with open('public/admin.html', 'r', encoding='utf-8') as f:
    content = f.read()
has_section = 'Control de Unidades' in content
print(f'[admin.html] Has unit control section: {has_section}')
has_render = 'renderizarUnidadesAdmin' in content
print(f'[admin.html] Has render function: {has_render}')
has_toggle = 'toggleUnidadAdmin' in content
print(f'[admin.html] Has toggle function: {has_toggle}')
has_delete = 'eliminarUnidadAdmin' in content
print(f'[admin.html] Has delete function: {has_delete}')

print('\n=== All checks complete ===')
