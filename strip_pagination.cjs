const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFeedPagination.ts', 'utf8');
code = code.replace(/import\s*\{[^}]*\}\s*from\s*['"]\.\.\/lib\/firebase['"];/g, '');
code = code.replace(/\/\/\s*2\.\s*Fetch from Firestore if available[\s\S]*?\/\/ If no DB, we rely solely on server data\s*setTimeout\(\(\) => \{ if \(active\) setIsLoading\(false\); \}, 1500\);\s*\}/g, 'setTimeout(() => { if (active) setIsLoading(false); }, 1500);');
code = code.replace(/\/\/\s*3\.\s*Live Snapshot[\s\S]*?return \(\) => \{\s*active = false;\s*unsubscribe\(\);\s*\};\s*\}, \[db\]\);/g, 'return () => {\n      active = false;\n    };\n  }, []);');
fs.writeFileSync('src/hooks/useFeedPagination.ts', code);
