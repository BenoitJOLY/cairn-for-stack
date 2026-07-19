import re
path = r'C:\Users\phy_j\Downloads\stackforge\js\gen-optique.js'
lines = open(path, encoding='utf-8').read().split('\n')
chunk = lines[1512:1818]
text = '\n'.join(chunk)
str_re = re.compile(r"""'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`""", re.S)

def unescape(s):
    s = s.replace("\\'", "'")
    s = s.replace('\\"', '"')
    s = s.replace('\\n', '\n')
    s = s.replace('\\t', '\t')
    s = s.replace('\\\\', '\\')
    return s

out = []
for m in str_re.finditer(text):
    s = m.group(1)
    if s is None:
        s = m.group(2)
    if s is None:
        s = m.group(3)
    out.append(unescape(s))

full = ''.join(out)
open(r'C:\Users\phy_j\Downloads\stackforge\_extracted_lentille.js', 'w', encoding='utf-8').write(full)
print(len(full), len(out))
