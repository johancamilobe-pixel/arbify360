"""
dark_mode.py — Ejecutar desde la raíz del proyecto:
    python dark_mode.py

Reemplaza clases Tailwind de colores claros por variables CSS semánticas
para implementar dark mode en ArbiFy360.
"""

import os

INLINE_REPLACEMENTS = [
    # Fondos
    ('bg-white ',          'bg-card '),
    ('bg-white"',          'bg-card"'),
    ('bg-white)',          'bg-card)'),
    ('bg-white\n',         'bg-card\n'),
    ('bg-gray-50 ',        'bg-background '),
    ('bg-gray-50"',        'bg-background"'),
    ('bg-gray-50)',        'bg-background)'),
    ('bg-gray-100 ',       'bg-muted '),
    ('bg-gray-100"',       'bg-muted"'),
    ('bg-gray-100)',       'bg-muted)'),
    ('bg-gray-200 ',       'bg-muted '),
    ('bg-gray-200"',       'bg-muted"'),
    # Texto
    ('text-gray-900 ',     'text-foreground '),
    ('text-gray-900"',     'text-foreground"'),
    ('text-gray-900)',     'text-foreground)'),
    ('text-gray-800 ',     'text-foreground '),
    ('text-gray-800"',     'text-foreground"'),
    ('text-gray-700 ',     'text-foreground/80 '),
    ('text-gray-700"',     'text-foreground/80"'),
    ('text-gray-600 ',     'text-muted-foreground '),
    ('text-gray-600"',     'text-muted-foreground"'),
    ('text-gray-600)',     'text-muted-foreground)'),
    ('text-gray-500 ',     'text-muted-foreground '),
    ('text-gray-500"',     'text-muted-foreground"'),
    ('text-gray-500)',     'text-muted-foreground)'),
    ('text-gray-400 ',     'text-muted-foreground/70 '),
    ('text-gray-400"',     'text-muted-foreground/70"'),
    ('text-gray-400)',     'text-muted-foreground/70)'),
    ('text-gray-300 ',     'text-muted-foreground/50 '),
    ('text-gray-300"',     'text-muted-foreground/50"'),
    # Bordes
    ('border-gray-200 ',   'border-border '),
    ('border-gray-200"',   'border-border"'),
    ('border-gray-100 ',   'border-border/50 '),
    ('border-gray-100"',   'border-border/50"'),
    ('border-gray-100\n',  'border-border/50\n'),
    # Hover
    ('hover:bg-gray-50 ',  'hover:bg-muted '),
    ('hover:bg-gray-100 ', 'hover:bg-muted '),
    ('hover:bg-gray-200 ', 'hover:bg-accent '),
    ('hover:bg-gray-50"',  'hover:bg-muted"'),
    ('hover:bg-gray-100"', 'hover:bg-muted"'),
    ('hover:bg-gray-200"', 'hover:bg-accent"'),
    # Divide
    ('divide-gray-100',    'divide-border/50'),
    ('divide-gray-200',    'divide-border'),
]

SKIP_DIRS = {'node_modules', '.next', '.git', 'dist', 'build'}
EXTENSIONS = {'.tsx', '.ts'}

def process_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    for old, new in INLINE_REPLACEMENTS:
        content = content.replace(old, new)
    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def run():
    root = os.path.dirname(os.path.abspath(__file__))
    updated = []
    for dirpath, dirnames, filenames in os.walk(root):
        # Saltar directorios pesados
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fname in filenames:
            if os.path.splitext(fname)[1] in EXTENSIONS:
                path = os.path.join(dirpath, fname)
                if process_file(path):
                    updated.append(path.replace(root, ''))

    print(f"✅ {len(updated)} archivos actualizados:")
    for p in updated:
        print(f"   {p}")

if __name__ == '__main__':
    run()
