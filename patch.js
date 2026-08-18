const fs = require('fs');
let code = fs.readFileSync('src/components/MoviePlayer.tsx', 'utf8');

// interface MoviePlayerProps {
code = code.replace(
  'onClose: () => void;',
  'onClose: () => void;\n  onProgressUpdate?: (progress: number, seconds: number) => void;'
);

// function MoviePlayer({ movie, onClose }: MoviePlayerProps) {
code = code.replace(
  'onClose }: MoviePlayerProps',
  'onClose, onProgressUpdate }: MoviePlayerProps'
);

// inside <video autoPlay controls playsInline
code = code.replace(
  'className="w-full h-full object-contain bg-black"',
  `className="w-full h-full object-contain bg-black"\n            onTimeUpdate={(e) => {\n              const target = e.target as HTMLVideoElement;\n              if (onProgressUpdate && target.duration) {\n                const percent = Math.round((target.currentTime / target.duration) * 100);\n                onProgressUpdate(percent, Math.round(target.currentTime));\n              }\n            }}`
);

fs.writeFileSync('src/components/MoviePlayer.tsx', code);
