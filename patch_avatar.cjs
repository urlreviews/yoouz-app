const fs = require('fs');
const file = './src/components/CopoFollowingView.tsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = `                            {place.avatarUrl ? (
                              <img src={place.avatarUrl} alt={place.name} className="w-full h-full object-cover" />
                            ) : (
                              place.name.charAt(0)
                            )}`;

const replace1 = `                            {place.avatarUrl && (
                              <img 
                                src={place.avatarUrl} 
                                alt={place.name} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.parentElement?.querySelector('.fallback-initial');
                                  if (fallback) fallback.classList.remove('hidden');
                                }}
                              />
                            )}
                            <div className={\`fallback-initial w-full h-full flex items-center justify-center \${place.avatarUrl ? 'hidden' : ''}\`}>
                              {place.name.charAt(0)}
                            </div>`;

content = content.replaceAll(target1, replace1);
fs.writeFileSync(file, content);
console.log("Patched avatar");
