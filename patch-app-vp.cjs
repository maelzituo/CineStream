const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetVP = `<VideoPlayer movie={playingMovie} onClose={() => setPlayingMovie(null)} />`;
const replacementVP = `<VideoPlayer 
          movie={playingMovie} 
          onClose={() => setPlayingMovie(null)} 
          onProgressUpdate={(progress, seconds) => {
            if (user) updateHistory(playingMovie.id, progress, seconds);
          }}
        />`;

code = code.replace(targetVP, replacementVP);

const targetMock = `    // Simula a adição ao histórico e update de progresso (ex: assistiu 20%)
    if (user) {
      const progress = Math.floor(Math.random() * (90 - 10) + 10);
      const defaultSeconds = Math.floor(Math.random() * 7000);
      await updateHistory(movie.id, progress, defaultSeconds);
    }`;

code = code.replace(targetMock, `    // Registro inicial de histórico para marcação (o progresso real é atualizado no onProgressUpdate)
    if (user) {
      await updateHistory(movie.id, 0, 0);
    }`);

fs.writeFileSync('src/App.tsx', code);
