const fs = require('fs');
let code = fs.readFileSync('src/components/MovieDetails.tsx', 'utf8');

if (!code.includes('import AddToListModal')) {
  code = code.replace(
    "import SeriesRepository from '../services/seriesRepository';",
    "import SeriesRepository from '../services/seriesRepository';\nimport AddToListModal from './AddToListModal';"
  );
}

if (!code.includes('showAddToListModal')) {
  code = code.replace(
    'const [showTrailerModal, setShowTrailerModal] = useState(false);',
    'const [showTrailerModal, setShowTrailerModal] = useState(false);\n  const [showAddToListModal, setShowAddToListModal] = useState(false);'
  );
}

const saveButtonBlock = `<button
                onClick={() => onSavedToggle(movie)}
                className="bg-black/40 hover:bg-white/15 border border-white/20 text-white font-display font-bold text-xs sm:text-sm tracking-wider py-3.5 px-6 sm:px-8 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
                id="details-save-button"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Na Lista</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-white" />
                    <span>Minha Lista</span>
                  </>
                )}
              </button>`;

const replacementButton = `<button
                onClick={() => onSavedToggle(movie)}
                className="bg-black/40 hover:bg-white/15 border border-white/20 text-white font-display font-bold text-xs sm:text-sm tracking-wider py-3.5 px-4 sm:px-6 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
                title="Favoritos"
              >
                {isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4 text-white" />}
                <span className="hidden sm:inline">{isSaved ? 'Favorito' : 'Favoritos'}</span>
              </button>
              
              <button
                onClick={() => setShowAddToListModal(true)}
                className="bg-black/40 hover:bg-white/15 border border-white/20 text-white font-display font-bold text-xs sm:text-sm tracking-wider py-3.5 px-4 sm:px-6 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
              >
                <Database className="w-4 h-4 text-white" />
                <span className="hidden sm:inline">Salvar em Lista</span>
              </button>`;

code = code.replace(saveButtonBlock, replacementButton);

const trailerModalEnd = `          </motion.div>
        </div>
      )}`;

const addToListModal = `
      {/* Add To List Modal */}
      <AnimatePresence>
        {showAddToListModal && (
          <AddToListModal movie={movie} onClose={() => setShowAddToListModal(false)} />
        )}
      </AnimatePresence>
`;

if (!code.includes('AddToListModal movie=')) {
  code = code.replace(trailerModalEnd, trailerModalEnd + addToListModal);
}

fs.writeFileSync('src/components/MovieDetails.tsx', code);
