const fs = require('fs');
const file = './src/components/CopoBusinessDashboardView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<TrendingUp className="w-3 h-3" \/> \{chartData\.change\} vs prev \{analyticsDateRange\}/g,
  `<TrendingUp className="w-3 h-3" /> {chartData.change === 'New' ? 'Live Analytics' : \`\${chartData.change} vs prev \${analyticsDateRange}\`}`
);

fs.writeFileSync(file, content);
console.log('Fixed change text.');
