import { useEffect, useState, useRef, useCallback } from "react";

// Typo map - keys that are commonly mistyped (adjacent keys)
const typoMap: Record<string, string[]> = {
  'a': ['s', 'q', 'z'],
  'b': ['v', 'n', 'g'],
  'c': ['x', 'v', 'd'],
  'd': ['s', 'f', 'e'],
  'e': ['w', 'r', 'd'],
  'f': ['d', 'g', 'r'],
  'g': ['f', 'h', 't'],
  'h': ['g', 'j', 'y'],
  'i': ['u', 'o', 'k'],
  'j': ['h', 'k', 'u'],
  'k': ['j', 'l', 'i'],
  'l': ['k', 'o', 'p'],
  'm': ['n', 'k'],
  'n': ['b', 'm', 'j'],
  'o': ['i', 'p', 'l'],
  'p': ['o', 'l'],
  'q': ['w', 'a'],
  'r': ['e', 't', 'f'],
  's': ['a', 'd', 'w'],
  't': ['r', 'y', 'g'],
  'u': ['y', 'i', 'j'],
  'v': ['c', 'b', 'f'],
  'w': ['q', 'e', 's'],
  'x': ['z', 'c', 's'],
  'y': ['t', 'u', 'h'],
  'z': ['a', 'x'],
};

interface TypewriterState {
  displayText: string;
  isComplete: boolean;
}

// Typewriter hook with realistic typos
function useTypewriter(
  targetText: string,
  startDelay: number = 0,
  shouldStart: boolean = true,
  options: {
    baseSpeed?: number;
    typoChance?: number;
    thinkingPauseChance?: number;
  } = {}
): TypewriterState {
  const {
    baseSpeed = 50,
    typoChance = 0.08,
    thinkingPauseChance = 0.03,
  } = options;

  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const isTypingTypoRef = useRef(false);
  const typoBufferRef = useRef<string[]>([]);

  useEffect(() => {
    if (!shouldStart) return;

    let timeout: ReturnType<typeof setTimeout>;
    const startTime = Date.now();

    const type = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < startDelay) {
        timeout = setTimeout(type, 50);
        return;
      }

      // Handle typo correction
      if (typoBufferRef.current.length > 0) {
        const action = typoBufferRef.current.shift()!;
        if (action === 'BACKSPACE') {
          setDisplayText(prev => prev.slice(0, -1));
        } else {
          setDisplayText(prev => prev + action);
          indexRef.current++;
        }
        timeout = setTimeout(type, baseSpeed + Math.random() * 30);
        return;
      }

      if (indexRef.current >= targetText.length) {
        setIsComplete(true);
        return;
      }

      const char = targetText[indexRef.current];

      // Random thinking pause
      if (Math.random() < thinkingPauseChance && char === ' ') {
        timeout = setTimeout(type, 300 + Math.random() * 500);
        return;
      }

      // Maybe make a typo
      if (
        Math.random() < typoChance &&
        char.match(/[a-z]/i) &&
        typoMap[char.toLowerCase()]
      ) {
        const typoChar = typoMap[char.toLowerCase()][
          Math.floor(Math.random() * typoMap[char.toLowerCase()].length)
        ];
        // Type wrong char, pause, backspace, type correct
        setDisplayText(prev => prev + typoChar);
        typoBufferRef.current = ['BACKSPACE', char];
        timeout = setTimeout(type, 150 + Math.random() * 100);
        return;
      }

      // Normal typing
      setDisplayText(prev => prev + char);
      indexRef.current++;

      // Variable speed based on character
      let delay = baseSpeed + Math.random() * 40;
      if (char === ' ') delay += 20;
      if (char === '.' || char === ',') delay += 100;
      if (char === '\n') delay += 200;

      timeout = setTimeout(type, delay);
    };

    timeout = setTimeout(type, 50);

    return () => clearTimeout(timeout);
  }, [targetText, startDelay, shouldStart, baseSpeed, typoChance, thinkingPauseChance]);

  return { displayText, isComplete };
}

// Cursor component
function Cursor({ visible = true }: { visible?: boolean }) {
  return (
    <span
      className={`inline-block w-[2px] h-[1.1em] bg-[#f093fb] ml-[2px] align-middle ${
        visible ? 'animate-blink' : 'opacity-0'
      }`}
    />
  );
}

// The intro sequence component
export function IntroSequence({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);
  const [showSkip, setShowSkip] = useState(false);

  // Phase timings
  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkip(true), 2000);
    return () => clearTimeout(skipTimer);
  }, []);

  // Console-style opening
  const consoleText = useTypewriter(
    "> initializing kcodes.me...",
    500,
    phase === 0
  );

  // After console line completes, move to phase 1
  useEffect(() => {
    if (consoleText.isComplete && phase === 0) {
      setTimeout(() => setPhase(1), 600);
    }
  }, [consoleText.isComplete, phase]);

  // Building the name - typing "kcodes" then realizing, backspacing, typing "konacodes"
  const nameAttempt1 = useTypewriter(
    "kcodes",
    0,
    phase === 1,
    { typoChance: 0, baseSpeed: 70 }
  );

  // After typing "kcodes", pause like "wait that's not right"
  useEffect(() => {
    if (nameAttempt1.isComplete && phase === 1) {
      setTimeout(() => setPhase(2), 800); // thinking pause
    }
  }, [nameAttempt1.isComplete, phase]);

  // Backspace animation - delete everything except "k"
  const [nameBackspaceCount, setNameBackspaceCount] = useState(0);
  useEffect(() => {
    if (phase === 2 && nameBackspaceCount < 5) {
      const timer = setTimeout(() => {
        setNameBackspaceCount(prev => prev + 1);
      }, 60);
      return () => clearTimeout(timer);
    } else if (phase === 2 && nameBackspaceCount >= 5) {
      setTimeout(() => setPhase(3), 300);
    }
  }, [phase, nameBackspaceCount]);

  // Type the correct name "onacodes" (after the k)
  const nameCorrection = useTypewriter(
    "onacodes",
    0,
    phase === 3,
    { typoChance: 0.06, baseSpeed: 55 }
  );

  useEffect(() => {
    if (nameCorrection.isComplete && phase === 3) {
      setTimeout(() => setPhase(4), 800);
    }
  }, [nameCorrection.isComplete, phase]);

  // Tagline typing
  const tagline = useTypewriter(
    "i build things for the web",
    0,
    phase === 4,
    { typoChance: 0.1, baseSpeed: 45 }
  );

  useEffect(() => {
    if (tagline.isComplete && phase === 4) {
      setTimeout(() => setPhase(5), 600);
    }
  }, [tagline.isComplete, phase]);

  // Status badge
  const statusText = useTypewriter(
    "available for projects",
    0,
    phase === 5,
    { typoChance: 0.05, baseSpeed: 40 }
  );

  useEffect(() => {
    if (statusText.isComplete && phase === 5) {
      setTimeout(() => setPhase(6), 1000);
    }
  }, [statusText.isComplete, phase]);

  // Final transition
  useEffect(() => {
    if (phase === 6) {
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  }, [phase, onComplete]);

  // Build the current name display
  const getNameDisplay = () => {
    if (phase === 1) {
      return nameAttempt1.displayText;
    } else if (phase === 2) {
      return "kcodes".slice(0, 6 - nameBackspaceCount);
    } else if (phase >= 3) {
      return "k" + nameCorrection.displayText;
    }
    return "";
  };

  const nameDisplay = getNameDisplay();
  const showNameCursor = phase >= 1 && phase <= 3 && !nameCorrection.isComplete;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#030303] flex flex-col items-center justify-center overflow-hidden">
      {/* Mesh background fading in */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: phase >= 1 ? 0.5 : 0,
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(120, 0, 255, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 80% at 80% 20%, rgba(255, 0, 128, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse 50% 60% at 60% 80%, rgba(0, 150, 255, 0.08) 0%, transparent 50%)
          `,
        }}
      />

      {/* Grid fading in */}
      <div
        className="absolute inset-0 grid-pattern transition-opacity duration-1000"
        style={{ opacity: phase >= 2 ? 0.3 : 0 }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        {/* Console line */}
        <div
          className={`font-mono text-sm text-white/40 mb-12 transition-all duration-500 ${
            phase >= 1 ? 'opacity-30 -translate-y-4' : ''
          }`}
        >
          {consoleText.displayText}
          {phase === 0 && <Cursor visible={!consoleText.isComplete} />}
        </div>

        {/* Main name */}
        <div className={`transition-all duration-700 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
          <h1 className="text-[clamp(4rem,15vw,12rem)] font-bold leading-none tracking-tighter mb-8">
            {nameDisplay.split('').map((char, i) => (
              <span
                key={i}
                className={`inline-block transition-all duration-300 ${
                  i === 0 ? 'gradient-text text-glow' : 'text-white/90'
                }`}
                style={{
                  opacity: 1,
                  transform: 'translateY(0)',
                }}
              >
                {char}
              </span>
            ))}
            {showNameCursor && <Cursor />}
          </h1>
        </div>

        {/* Tagline */}
        <div className={`transition-all duration-500 ${phase >= 4 ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-xl md:text-2xl text-white/50 font-light tracking-wide mb-12">
            {tagline.displayText}
            {phase === 4 && !tagline.isComplete && <Cursor />}
          </p>
        </div>

        {/* Status badge */}
        <div
          className={`inline-flex items-center gap-3 glass rounded-full px-6 py-3 transition-all duration-500 ${
            phase >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <span className="relative flex h-3 w-3">
            <span className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 ${
              statusText.isComplete ? 'animate-ping' : ''
            } opacity-75`}></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
          </span>
          <span className="text-sm text-white/60 font-mono">
            {statusText.displayText}
            {phase === 5 && !statusText.isComplete && <Cursor />}
          </span>
        </div>
      </div>

      {/* Skip button */}
      <button
        onClick={onComplete}
        className={`absolute bottom-8 right-8 text-xs font-mono text-white/20 hover:text-white/50 transition-all duration-300 ${
          showSkip ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        skip →
      </button>

      {/* Final fade out */}
      <div
        className={`absolute inset-0 bg-[#030303] pointer-events-none transition-opacity duration-500 ${
          phase === 6 ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}

export default IntroSequence;
