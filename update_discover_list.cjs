const fs = require('fs');
let content = fs.readFileSync('src/components/CopoDiscoverView.tsx', 'utf-8');

const searchTarget = `        {/* Reviewers List */}
        <div className="w-full text-left animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 px-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              {query.trim() ? \`Search Results (\${displayedReviewers.length})\` : \`Active Reviewers (\${displayedReviewers.length})\`}
            </span>`;

const replaceWith = `        {/* Reviewers List */}
        {query.trim().length > 0 && (
          <div className="w-full text-left animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 px-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Search Results ({displayedReviewers.length})
              </span>`;

if (content.includes(searchTarget)) {
  content = content.replace(searchTarget, replaceWith);
  
  // Need to close the new {query.trim().length > 0 && ( ... )} block
  // find the very end of the file
  const endTarget = `          )}
        </div>
      </div>
    </div>
  );
};`;
  const endReplace = `          )}
          </div>
        )}
      </div>
    </div>
  );
};`;
  content = content.replace(endTarget, endReplace);
  fs.writeFileSync('src/components/CopoDiscoverView.tsx', content, 'utf-8');
  console.log("Replaced successfully!");
} else {
  console.log("Could not find the target string.");
}
