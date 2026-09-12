const fs = require('fs');
let code = fs.readFileSync('src/components/CopoBusinessDashboardView.tsx', 'utf8');

const strStart = '<div className="overflow-x-auto text-[11px] text-zinc-200 py-1 leading-relaxed">';
const strEnd = '</div>\n                      </div>\n                    </div>';

let startIndex = code.indexOf(strStart);
let endIndex = code.indexOf(strEnd, startIndex);

if (startIndex > -1 && endIndex > -1) {
  let newBlock = `<div className="overflow-x-auto text-[11px] text-zinc-200 py-1 leading-relaxed">
                          {embedFormat === 'script' ? (
                            <code>{\`<div id="yoouz-widget"\\n  data-place-id="\${selectedPlaceId}"\\n  data-theme="minimal_dark"\\n  data-layout="grid"\\n  data-accent="#ffffff"\${pinnedVideoIds.length > 0 ? \`\\n  data-pinned-ids="\${pinnedVideoIds.join(',')}"\` : ''}\${hiddenVideoIds.length > 0 ? \`\\n  data-hidden-ids="\${hiddenVideoIds.join(',')}"\` : ''}>\\n</div>\\n<script src="https://cdn.yoouz.com/embed/v2.js" async defer></script>\`}</code>
                          ) : (
                            <code>{\`<iframe src="https://yoouz.com/embed/widget?placeId=\${selectedPlaceId}&theme=minimal_dark&layout=grid&accent=%23ffffff" \\n  width="100%" height="480" frameBorder="0" loading="lazy" allow="autoplay; encrypted-media">\\n</iframe>\`}</code>
                          )}
                        </div>
`;
  
  code = code.substring(0, startIndex) + newBlock + code.substring(endIndex);
  fs.writeFileSync('src/components/CopoBusinessDashboardView.tsx', code);
  console.log("Success patch6");
} else {
  console.log("Failed to find bounds patch6");
}
