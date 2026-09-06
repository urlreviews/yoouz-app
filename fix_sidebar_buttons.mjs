import fs from 'fs';
let sidebar = fs.readFileSync('src/components/CopoSidebar.tsx', 'utf8');
sidebar = sidebar.replace(/<button\n              onClick=\{\(\) => \{\}\}\n              className="text-left px-3 py-1\.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"\n            >\n              \{t\("legal\.about", "About"\)\}\n            <\/button>/g, '<button\n              onClick={onOpenLegal}\n              className="text-left px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"\n            >\n              {t("legal.about", "About")}\n            </button>');
sidebar = sidebar.replace(/<button\n            id="mobile-nav-create-btn"\n            onClick=\{\(\) => onSelectSection\("create"\)\}/g, '<button\n            id="mobile-nav-create-btn"\n            onClick={() => onOpenCreateModal ? onOpenCreateModal() : onSelectSection("create")}');
fs.writeFileSync('src/components/CopoSidebar.tsx', sidebar);
