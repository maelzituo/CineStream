const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `            {currentTab === 'lista' && (
              <MyList
                savedMovies={savedMovies}
                onMovieClick={handleMovieSelect}
                onRemoveFromList={handleRemoveFromList}
                onNavigateHome={() => handleTabChange('inicio')}
              />
            )}`;

const replacement = `            {currentTab === 'lista' && (
              <div className="pt-24 px-6 md:px-16 pb-32 space-y-12 animate-in fade-in zoom-in-95 duration-300">
                <CustomLists onNavigateToMovie={handleMovieSelect} />
                <div className="border-t border-white/10" />
                <MyList
                  savedMovies={savedMovies}
                  onMovieClick={handleMovieSelect}
                  onRemoveFromList={handleRemoveFromList}
                  onNavigateHome={() => handleTabChange('inicio')}
                />
              </div>
            )}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
