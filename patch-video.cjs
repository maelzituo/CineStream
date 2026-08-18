const fs = require('fs');
let code = fs.readFileSync('src/components/VideoPlayer.tsx', 'utf8');

code = code.replace(
  'onClose: () => void;',
  'onClose: () => void;\n  onProgressUpdate?: (progress: number, seconds: number) => void;'
);

code = code.replace(
  'onClose }: VideoPlayerProps',
  'onClose, onProgressUpdate }: VideoPlayerProps'
);

code = code.replace(
  '<SeriesPlayer movie={movie} onClose={onClose} />',
  '<SeriesPlayer movie={movie} onClose={onClose} onProgressUpdate={onProgressUpdate} />'
);

code = code.replace(
  '<MoviePlayer movie={movie} onClose={onClose} />',
  '<MoviePlayer movie={movie} onClose={onClose} onProgressUpdate={onProgressUpdate} />'
);

fs.writeFileSync('src/components/VideoPlayer.tsx', code);
