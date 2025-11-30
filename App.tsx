import React, { useState, useEffect, useRef } from 'react';
import { GameState, GameLevel, SentencePart } from './types';
import { generateLevel } from './services/geminiService';
import { MotionButton as CyberButton } from './components/MotionButton';
import { playSound } from './services/audioService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.INIT);
  const [level, setLevel] = useState<GameLevel | null>(null);
  const [availableParts, setAvailableParts] = useState<SentencePart[]>([]);
  const [constructedParts, setConstructedParts] = useState<SentencePart[]>([]);
  const [timer, setTimer] = useState(0);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("System Initializing...");

  const containerRef = useRef<HTMLDivElement>(null);

  // --- Game Logic ---

  const startGame = () => {
    playSound('start');
    setScore(0);
    setTimer(360); // 6 minutes global timer
    loadNextLevel();
  };

  const loadNextLevel = async () => {
    setGameState(GameState.LOADING_LEVEL);
    setMessage("Decrypting Data Stream...");
    
    const newLevel = await generateLevel();
    setLevel(newLevel);
    
    // Shuffle parts for the "available" pool
    const shuffled = [...newLevel.parts].sort(() => Math.random() - 0.5);
    setAvailableParts(shuffled);
    setConstructedParts([]);
    // Do NOT reset timer here; it's global now
    setGameState(GameState.PLAYING);
  };

  const handlePartSelect = (part: SentencePart) => {
    // Move from available to constructed
    setAvailableParts(prev => prev.filter(p => p.id !== part.id));
    setConstructedParts(prev => [...prev, part]);
  };

  const handleUndo = (part: SentencePart) => {
    // Move from constructed back to available
    setConstructedParts(prev => prev.filter(p => p.id !== part.id));
    setAvailableParts(prev => [...prev, part]);
  };

  const checkSolution = () => {
    if (!level) return;

    // Check if lengths match and indices are in order
    const isCorrect = constructedParts.every((p, i) => p.order === i) && constructedParts.length === level.parts.length;

    if (isCorrect) {
      playSound('success');
      setScore(prev => prev + 100); // Flat 100 points per correct sentence
      setGameState(GameState.LEVEL_COMPLETE);
    } else {
      playSound('error');
      setMessage("SYNTAX ERROR: Incorrect Sequence");
      // Penalty: -10 seconds
      setTimer(prev => Math.max(0, prev - 10));
      
      // Clear message after delay
      setTimeout(() => {
        if (message === "SYNTAX ERROR: Incorrect Sequence") setMessage("");
      }, 2000);
    }
  };

  // Global Timer
  useEffect(() => {
    let interval: any;
    // Timer runs during PLAYING and LEVEL_COMPLETE (so users don't stall)
    if ((gameState === GameState.PLAYING || gameState === GameState.LEVEL_COMPLETE) && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            setGameState(GameState.GAME_OVER);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } 
    return () => clearInterval(interval);
  }, [gameState, timer]);

  // Initial Startup
  useEffect(() => {
    if (gameState === GameState.INIT) {
      setTimeout(() => setGameState(GameState.LOBBY), 1500);
    }
  }, [gameState]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };


  // --- Render Helpers ---

  const renderBackground = () => (
    <div className="fixed inset-0 z-0 bg-[#050505]">
       {/* Cyber Grid Floor */}
       <div 
         className="absolute bottom-0 left-0 right-0 h-[50vh] opacity-20 pointer-events-none"
         style={{
           background: `linear-gradient(transparent 0%, #06b6d4 100%)`,
           transform: 'perspective(500px) rotateX(20deg) scale(1.5)',
           transformOrigin: 'bottom',
         }}
       >
         <div className="w-full h-full" style={{
           backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(6, 182, 212, .3) 25%, rgba(6, 182, 212, .3) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, .3) 75%, rgba(6, 182, 212, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(6, 182, 212, .3) 25%, rgba(6, 182, 212, .3) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, .3) 75%, rgba(6, 182, 212, .3) 76%, transparent 77%, transparent)',
           backgroundSize: '50px 50px'
         }}></div>
       </div>
       
       {/* Floating particles or stars */}
       <div className="absolute inset-0 opacity-30" style={{
         backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
         backgroundSize: '50px 50px'
       }}></div>
    </div>
  );

  const renderLobby = () => (
    <div className="flex flex-col items-center justify-center h-screen z-10 relative space-y-8 p-4 text-center">
      <div className="relative">
        <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-600 glow-text animate-pulse select-none">
          CYBER<br/>SENTENCE
        </h1>
        <div className="absolute -inset-1 bg-cyan-500/20 blur-xl -z-10 rounded-full"></div>
      </div>
      
      <div className="bg-black/60 border border-cyan-800 p-8 rounded-lg max-w-lg w-full backdrop-blur-md shadow-[0_0_50px_rgba(6,182,212,0.2)]">
        <h2 className="text-cyan-400 text-xl mb-6 border-b border-cyan-900 pb-2 tracking-widest">SYSTEM READY</h2>
        
        <p className="text-gray-300 mb-8 font-mono leading-relaxed">
          MODE: Time Attack (6 Minutes)<br/>
          MISSION: Compile maximum data streams.<br/>
          STATUS: <span className="text-green-400 animate-pulse">ONLINE</span>
        </p>

        <CyberButton 
          id="btn-start" 
          onClick={startGame} 
          className="w-full text-xl py-6"
        >
          INITIATE LINK
        </CyberButton>
      </div>
    </div>
  );

  const renderGame = () => (
    <div className="flex flex-col h-screen z-10 relative p-4 max-w-6xl mx-auto w-full">
      {/* HUD Header */}
      <div className="flex justify-between items-end border-b border-cyan-900/50 pb-4 mb-6 bg-black/40 backdrop-blur-md p-4 rounded-t-lg">
        <div>
          <div className="text-xs text-cyan-600 tracking-widest mb-1">GLOBAL TIMER</div>
          <div className={`text-5xl font-mono leading-none ${timer < 30 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
            {formatTime(timer)}
          </div>
        </div>
        <div className="text-center hidden md:block">
          <div className="text-xs text-cyan-600 tracking-widest mb-1">GRAMMAR MODULE</div>
          <div className="text-xl font-chinese text-white bg-cyan-950/50 px-4 py-1 rounded border border-cyan-900">{level?.grammarPoint}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-cyan-600 tracking-widest mb-1">SCORE</div>
          <div className="text-5xl font-mono leading-none text-yellow-400">{score.toString().padStart(6, '0')}</div>
        </div>
      </div>

      {/* Target Translation */}
      <div className="text-center mb-10">
        <div className="inline-block relative group">
          <div className="absolute inset-0 bg-cyan-500/10 blur-lg rounded-full"></div>
          <div className="relative bg-black/80 border-l-4 border-cyan-500 px-8 py-4 rounded-r-lg">
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-2 text-left">Target Meaning</div>
            <div className="text-2xl md:text-3xl text-white font-serif italic">
              "{level?.translation}"
            </div>
          </div>
        </div>
      </div>

      {/* Construction Zone */}
      <div className="flex-1 flex flex-col items-center max-w-4xl mx-auto w-full">
        {/* Answer Bar */}
        <div className="w-full min-h-[140px] bg-slate-900/60 border border-cyan-500/30 rounded-lg p-6 flex flex-wrap gap-4 items-center justify-center mb-12 relative transition-all duration-300 hover:border-cyan-500/60 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]">
           <div className="absolute top-0 left-0 text-[10px] text-cyan-900 uppercase tracking-widest bg-cyan-400/10 px-2 py-1 rounded-br">Buffer</div>
           
           {constructedParts.length === 0 && (
             <div className="text-cyan-800/50 text-xl font-mono animate-pulse select-none">
               [ AWAITING INPUT SEGMENTS ]
             </div>
           )}

           {constructedParts.map((part) => (
             <button
                key={part.id}
                onClick={() => handleUndo(part)}
                className="group relative bg-cyan-900 text-cyan-100 px-6 py-3 rounded border border-cyan-500 font-chinese text-2xl hover:bg-red-900 hover:border-red-500 transition-all duration-200 shadow-lg hover:scale-105"
             >
               {part.text}
               <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</div>
             </button>
           ))}
        </div>

        {/* Available Parts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
          {availableParts.map((part) => (
            <CyberButton
              key={part.id}
              onClick={() => handlePartSelect(part)}
              className="h-24 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm"
            >
              <span className="text-2xl font-chinese mb-1">{part.text}</span>
              <span className="text-xs text-gray-400 font-mono group-hover:text-cyan-300">{part.pinyin}</span>
            </CyberButton>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-center pb-8">
        {constructedParts.length > 0 && availableParts.length === 0 && (
          <CyberButton 
            id="btn-submit"
            onClick={checkSolution}
            variant="secondary"
            className="w-full max-w-md text-2xl py-4 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse"
          >
            EXECUTE COMPILE
          </CyberButton>
        )}
      </div>

      {/* Message Overlay */}
      {message && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 w-full text-center">
          <div className="inline-block text-red-500 font-bold bg-black/90 px-8 py-4 border-2 border-red-500 text-2xl shadow-[0_0_50px_rgba(239,68,68,0.5)]">
            {message}
          </div>
        </div>
      )}
    </div>
  );

  const renderLevelComplete = () => (
    <div className="flex flex-col items-center justify-center h-screen z-10 relative space-y-8 bg-black/80 backdrop-blur-md p-4">
      <div className="absolute top-8 right-8 text-right">
        <div className="text-xs text-cyan-600 tracking-widest mb-1">REMAINING</div>
        <div className={`text-3xl font-mono ${timer < 30 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>{formatTime(timer)}</div>
      </div>

      <h2 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-green-300 to-green-600 glow-text mb-4">
        COMPILATION<br/>SUCCESS
      </h2>
      
      <div className="bg-gray-900/90 p-8 rounded-lg border border-green-500/50 text-center max-w-3xl w-full shadow-[0_0_40px_rgba(34,197,94,0.2)]">
        <p className="text-gray-500 text-xs tracking-[0.2em] mb-4">RESTORED DATA</p>
        <p className="text-3xl md:text-5xl font-chinese text-white mb-6 leading-relaxed">{level?.fullSentence}</p>
        <p className="text-xl text-green-400 italic mb-10 border-t border-gray-800 pt-6">"{level?.translation}"</p>
        
        <div className="flex justify-between items-center bg-black/40 p-4 rounded border border-gray-800">
           <div className="text-left">
             <span className="text-gray-500 text-xs block uppercase">Total Score</span>
             <span className="text-3xl text-yellow-400 font-mono">{score}</span>
           </div>
           <div className="text-right">
             <span className="text-gray-500 text-xs block uppercase">Status</span>
             <span className="text-green-400 font-bold">READY</span>
           </div>
        </div>
      </div>

      <CyberButton 
        id="btn-next" 
        onClick={loadNextLevel} 
        className="w-full max-w-md text-xl py-4"
      >
        NEXT DATA BLOCK
      </CyberButton>
    </div>
  );

  const renderGameOver = () => (
    <div className="flex flex-col items-center justify-center h-screen z-10 relative space-y-6 bg-red-950/90 backdrop-blur-md p-4">
      <h2 className="text-6xl md:text-8xl font-black text-red-500 glow-text mb-4">MISSION COMPLETE</h2>
      <p className="text-2xl text-red-200 font-mono">TIME LIMIT REACHED</p>
      
      <div className="flex flex-col items-center justify-center bg-black/50 p-8 rounded border-2 border-yellow-400">
        <div className="text-gray-400 text-sm tracking-widest mb-2">FINAL SCORE</div>
        <div className="text-6xl text-yellow-400 font-mono">
          {score}
        </div>
      </div>
      
      <CyberButton 
        id="btn-restart" 
        onClick={() => { setGameState(GameState.LOBBY); setScore(0); }} 
        variant="danger"
        className="w-full max-w-md mt-8 text-xl"
      >
        REBOOT SYSTEM
      </CyberButton>
    </div>
  );

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center h-screen z-10 relative">
      <div className="absolute top-8 right-8 text-right">
        <div className="text-xs text-cyan-600 tracking-widest mb-1">REMAINING</div>
        <div className="text-3xl font-mono text-gray-500">{formatTime(timer)}</div>
      </div>

      <div className="relative w-24 h-24 mb-8">
         <div className="absolute inset-0 border-4 border-cyan-900 rounded-full"></div>
         <div className="absolute inset-0 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-cyan-400 font-mono text-xl animate-pulse tracking-widest">{message}</p>
    </div>
  );

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden select-none font-sans">
      {renderBackground()}
      
      {gameState === GameState.INIT && (
        <div className="flex items-center justify-center h-full z-10 relative">
          <p className="text-cyan-500 font-mono animate-pulse text-xl">Initializing Cyber Sentence Module...</p>
        </div>
      )}
      
      {gameState === GameState.LOBBY && renderLobby()}
      {gameState === GameState.LOADING_LEVEL && renderLoading()}
      {gameState === GameState.PLAYING && renderGame()}
      {gameState === GameState.LEVEL_COMPLETE && renderLevelComplete()}
      {gameState === GameState.GAME_OVER && renderGameOver()}
    </div>
  );
};

export default App;