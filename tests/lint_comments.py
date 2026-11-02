# Catch code swallowed by a '//' comment on the same line (a comment pasted in front of code turns that code into comment text;
# it still parses, then fails at run time). Exit 1 and print the lines if any comment tail looks like code.
import re,glob,os,sys
os.chdir(os.path.join(os.path.dirname(__file__),'..','src'));bad=[]
CODE=re.compile(r"(\bconst [a-zA-Z\[]|\blet [a-zA-Z]|=>|\bG\.[a-z]+\s*=|\bctx\.[a-zA-Z]+\(|\bbx\.[a-zA-Z]+\(|\)\{[a-zA-Z])")
for f in sorted(glob.glob('*.js')):
  for i,l in enumerate(open(f,encoding='utf-8'),1):
    q=None;idx=None
    for j,ch in enumerate(l):
      if q:
        if ch==q and l[j-1]!='\\':q=None
        continue
      if ch in "'\"`":q=ch;continue
      if l.startswith('//',j) and (j==0 or l[j-1]!=':'):idx=j;break
    if idx is not None and CODE.search(l[idx+2:]):bad.append(f'{f}:{i}: {l[idx:].strip()[:120]}')
print('\n'.join(bad) if bad else 'PASS no code inside // comments');sys.exit(1 if bad else 0)
