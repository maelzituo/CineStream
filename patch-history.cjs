const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

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

const moviePlayerStr = `<MoviePlayer
                    movie={currentMovie}
                    onClose={() => setShowPlayer(false)}
                  />`;

const replacementMovie = `<MoviePlayer
                    movie={currentMovie}
                    onClose={() => setShowPlayer(false)}
                    onProgressUpdate={(progress, seconds) => {
                      if (user) updateHistory(currentMovie.id, progress, seconds);
                    }}
                  />`;

code = code.replace(moviePlayerStr, replacementMovie);

fs.writeFileSync('src/App.tsx', code);
