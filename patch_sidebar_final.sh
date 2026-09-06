git checkout src/components/CopoSidebar.tsx
sed -i 's/{ id: "search" as NavSection, label: t("nav.search", "Search"), icon: Search, hasDot: true }/{ id: "search" as NavSection, label: t("nav.search", "Search"), icon: Search }/g' src/components/CopoSidebar.tsx
sed -i '/item.hasDot/d' src/components/CopoSidebar.tsx
sed -i '/<span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white ring-2 ring-zinc-950" \/>/d' src/components/CopoSidebar.tsx
