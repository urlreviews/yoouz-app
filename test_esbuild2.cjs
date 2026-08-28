const esbuild = require('esbuild');
esbuild.transformSync(`
const x = (
  <div>
  </div>
  </div>
);
`, { loader: 'tsx' });
