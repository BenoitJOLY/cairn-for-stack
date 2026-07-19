import sys

def check(path):
    src = open(path, encoding='utf-8').read()
    stack = []
    pairs = {')':'(', ']':'[', '}':'{'}
    opens = set('([{')
    closes = set(')]}')
    i = 0
    n = len(src)
    line = 1
    in_str = None  # ', ", `
    in_line_comment = False
    in_block_comment = False
    prev_significant = ''  # for regex-vs-divide heuristic (not needed much here)
    while i < n:
        c = src[i]
        if c == '\n':
            line += 1
        if in_line_comment:
            if c == '\n':
                in_line_comment = False
            i += 1
            continue
        if in_block_comment:
            if c == '*' and i+1 < n and src[i+1] == '/':
                in_block_comment = False
                i += 2
                continue
            i += 1
            continue
        if in_str:
            if c == '\\':
                i += 2
                continue
            if c == in_str:
                in_str = None
            i += 1
            continue
        # not in string/comment
        if c == '/' and i+1 < n and src[i+1] == '/':
            in_line_comment = True
            i += 2
            continue
        if c == '/' and i+1 < n and src[i+1] == '*':
            in_block_comment = True
            i += 2
            continue
        if c in ('"', "'", '`'):
            in_str = c
            i += 1
            continue
        if c == '\\':
            i += 2
            continue
        if c in opens:
            stack.append((c, line))
            i += 1
            continue
        if c in closes:
            if not stack:
                print(f"UNMATCHED CLOSE '{c}' at line {line} (offset {i}) - no opener on stack")
                return
            top, topline = stack.pop()
            if pairs[c] != top:
                print(f"MISMATCH: '{c}' at line {line} (offset {i}) closes '{top}' opened at line {topline}")
                return
            i += 1
            continue
        i += 1
    if stack:
        print("UNCLOSED at EOF, remaining open brackets (innermost last):")
        for ch, ln in stack:
            print(f"  '{ch}' opened at line {ln}")
    else:
        print("Balanced OK.")

check(sys.argv[1])
