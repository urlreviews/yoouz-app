const fs = require('fs');
let code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

const startStr = '<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">';
const endStr = '{/* Code Snippet Box */}';

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr, startIndex);

if (startIndex > -1 && endIndex > -1) {
  const replacement = `<div className="flex flex-col gap-6">
                    {/* Live Website Preview Container */}
`;
  const newCode = code.substring(0, startIndex) + replacement + code.substring(endIndex);
  fs.writeFileSync('src/components/CopoBusinessDashboardView.tsx', newCode);
  console.log("Success");
} else {
  console.log("Failed to find bounds");
}
