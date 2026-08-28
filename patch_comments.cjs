const fs = require('fs');
const file = './src/components/CopoCommentsDrawer.tsx';
let content = fs.readFileSync(file, 'utf8');

// The original block
const target = `{reply.replyToHandle && (
                                        <span className="text-blue-400 md:text-[#1a73e8] font-bold mr-1">
                                          @{reply.replyToHandle.replace(/^@+/, "")}
                                        </span>
                                      )}`;

content = content.replace(target, `{reply.replyToHandle && (
                                        <span className="text-blue-400 md:text-[#1a73e8] font-bold mr-1">
                                          {reply.replyToHandle.replace(/^@+/, "")}
                                        </span>
                                      )}`);

fs.writeFileSync(file, content);
console.log("Patched Comments Drawer");
