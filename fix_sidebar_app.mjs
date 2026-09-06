import fs from 'fs';
let sidebar = fs.readFileSync('src/components/CopoSidebar.tsx', 'utf8');
sidebar = sidebar.replace(/import \{ useTranslation \} from "\.\.\/i18n\/LanguageContext";/g, 'import { useLanguage } from "../i18n/LanguageContext";');
sidebar = sidebar.replace(/const \{ t \} = useTranslation\(\);/g, 'const { t } = useLanguage();');
fs.writeFileSync('src/components/CopoSidebar.tsx', sidebar);
