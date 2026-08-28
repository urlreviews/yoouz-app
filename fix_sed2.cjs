const fs = require('fs');
let content = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf-8');
content = content.replace(/import {([\s\S]*?)Pause\s*} from "lucide-react";/, 'import {$1Pause, Mic} from "lucide-react";');
fs.writeFileSync('src/components/CopoCreateModal.tsx', content, 'utf-8');
console.log("Fixed");
