const esbuild = require('esbuild');
esbuild.build({
  entryPoints: ['src/components/CopoBusinessDashboardView.tsx'],
  bundle: false,
  outfile: 'out.js',
}).catch(() => process.exit(1));
