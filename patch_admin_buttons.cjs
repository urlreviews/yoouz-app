const fs = require('fs');
let code = fs.readFileSync('src/components/CopoAdminPanel.tsx', 'utf8');

const regex = /<div className="flex items-center justify-between pt-2 border-t border-zinc-800">\s*<button\s*onClick=\{\(\) => setEditUserModal\(user\)\}\s*className="px-3 py-1\.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1\.5 transition-all cursor-pointer"\s*>\s*<Edit className="w-3\.5 h-3\.5" \/> Edit Profile\s*<\/button>\s*\{userVideos\.length > 0 && \([\s\S]*?<\/button>\s*\)\}\s*<\/div>/;

const newButtons = `<div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => setEditUserModal(user)}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit Profile
                          </button>
                          
                          <div className="flex items-center gap-1">
                            {userVideos.length > 0 && (
                              <button
                                onClick={() => {
                                  const userVidIds = userVideos.map((v) => v.id);
                                  if (onBulkDeleteVideos) onBulkDeleteVideos(userVidIds);
                                  showToast(\`Removed all \${userVidIds.length} reviews for @\${user.name}\`);
                                }}
                                className="px-2.5 py-1.5 text-orange-400 hover:bg-orange-950/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                title="Remove this user's videos (keeps account intact)"
                              >
                                Clear Reviews
                              </button>
                            )}

                            <button
                              onClick={async () => {
                                if (window.confirm(\`Are you sure you want to delete the account for \${user.name}?\`)) {
                                  try {
                                    const res = await fetch(\`/api/nosql/users/\${user.uid || user.id}\`, { method: 'DELETE' });
                                    if (res.ok) {
                                      const uName = user.name || "User";
                                      // show toast is a mock here, you might need to use existing alert or toast
                                      alert(\`Deleted \${uName} successfully. Please refresh the page.\`);
                                    }
                                  } catch (e) {
                                    alert('Failed to delete account');
                                  }
                                }
                              }}
                              className="px-2.5 py-1.5 text-red-400 hover:bg-red-950/40 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              title="Delete entire user account"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </div>
                      </div>`;

if (code.match(regex)) {
  code = code.replace(regex, newButtons);
  fs.writeFileSync('src/components/CopoAdminPanel.tsx', code);
  console.log("Replaced buttons successfully!");
} else {
  console.log("Regex not matched.");
}
