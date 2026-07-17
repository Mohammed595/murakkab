import { useState, useMemo, useCallback } from 'react';
import { CH } from './shared/data/chapters';
import { simulate } from './shared/utils/simulate';
import HomeScreen from './features/home/HomeScreen';
import IntroScreen from './features/intro/IntroScreen';
import PredictScreen from './features/predict/PredictScreen';
import PlayScreen from './features/play/PlayScreen';
import ReviewScreen from './features/review/ReviewScreen';
import CoachScreen from './features/coach/CoachScreen';
import SandboxScreen from './features/sandbox/SandboxScreen';

function loadSet(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); }
  catch { return new Set(); }
}
function saveSet(key, s) {
  localStorage.setItem(key, JSON.stringify([...s]));
}

export default function App() {
  // ── navigation ──
  const [screen, setScreen] = useState('home');

  // ── persistence ──
  const [done, setDone] = useState(() => loadSet('mk_done'));
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem('mk_unlocked') === '1');

  // ── game session ──
  const [ci, setCi] = useState(0);
  const [scen, setScen] = useState(null);
  const [hiddenMode, setHiddenMode] = useState(false);
  const [hiddenMeta, setHiddenMeta] = useState(null);
  const [m, setM] = useState(0);
  const [actions, setActions] = useState([]);
  const [guess, setGuess] = useState(0);
  const [eraGuess, setEraGuess] = useState(null);

  // ── simulation (recomputed whenever m or actions change) ──
  const sim = useMemo(() => {
    if (!scen) return null;
    return simulate(scen, actions, m);
  }, [scen, actions, m]);

  // ── chapter starters ──
  const startChapter = useCallback((i) => {
    setCi(i);
    setScen(CH[i]);
    setHiddenMode(false);
    setHiddenMeta(null);
    setM(0);
    setActions([]);
    setGuess(0);
    setEraGuess(null);
    setScreen('intro');
  }, []);

  const startHidden = useCallback(() => {
    if (!unlocked) return;
    const src = CH[Math.random() < 0.5 ? 0 : 1];
    const W = 18;
    const s = Math.floor(Math.random() * (src.prices.length - W - 1));
    const hidScen = {
      id: 'hidden',
      title: '🎲 النافذة المخفية',
      startYear: 0,
      start: 10000,
      salary: 500,
      divM: src.divM,
      persona: null,
      prices: src.prices.slice(s, s + W + 1),
      events: {},
      salem: {},
      guess: null,
    };
    setScen(hidScen);
    setHiddenMode(true);
    setHiddenMeta({ year: src.startYear + Math.floor(s / 12), month: s % 12 });
    setCi(-1);
    setM(0);
    setActions([]);
    setGuess(0);
    setEraGuess(null);
    setScreen('play');
  }, [unlocked]);

  const beginPlay = useCallback((guessVal) => {
    setM(0);
    setActions([]);
    setGuess(guessVal ?? 0);
    setEraGuess(null);
    setScreen('play');
  }, []);

  const replayGame = useCallback(() => {
    setM(0);
    setActions([]);
    setEraGuess(null);
    setScreen('play');
  }, []);

  // ── tick callback (called by PlayScreen each simulation step) ──
  const handleTick = useCallback((newM) => {
    setM(newM);
  }, []);

  // ── action callback ──
  const handleAddAction = useCallback((action) => {
    setActions(prev => [...prev, action]);
  }, []);

  // ── mark done + unlock ──
  const handleMarkDone = useCallback(({ eraGuessVal } = {}) => {
    if (eraGuessVal !== undefined) setEraGuess(eraGuessVal);
    setDone(prev => {
      const next = new Set(prev);
      if (!hiddenMode) next.add(ci);
      else next.add('h');
      saveSet('mk_done', next);
      return next;
    });
    if (!unlocked) {
      setUnlocked(true);
      localStorage.setItem('mk_unlocked', '1');
    }
  }, [ci, hiddenMode, unlocked]);

  const handleSetEraGuess = useCallback((val) => setEraGuess(val), []);

  // ── shared sidecap ──
  const Sidecap = () => (
    <div className="sidecap">
      <div className="mk">مُ</div>
      <b>مُركب — النموذج الأولي التفاعلي</b><br />
      لعبة داخل تطبيق البنك تعلّم الاستثمار بالتجربة.
      عندك هدف حياة، وراتب ينزل كل شهر، وصديقك سالم يستثمر بانتظام ولا يبيع أبداً.
      عِش أزمات السوق السعودي الحقيقية وحاول توصل هدفك — وتغلب سالم.<br /><br />
      <b style={{ color: '#E3A83B' }}>ذهبي</b> = أنت · <b style={{ color: '#35B8A0' }}>تركوازي</b> = سالم
    </div>
  );

  return (
    <div className="rig">
      <Sidecap />

      <div className="phone">
        <div className="device">
          <div className="island" />

          <HomeScreen
            active={screen === 'home'}
            done={done}
            unlocked={unlocked}
            onChapter={startChapter}
            onHidden={startHidden}
            onSandbox={() => setScreen('sandbox')}
          />

          <IntroScreen
            active={screen === 'intro'}
            scen={scen}
            onBack={() => setScreen('home')}
            onNext={() => setScreen('predict')}
          />

          <PredictScreen
            active={screen === 'predict'}
            scen={scen}
            onBack={() => setScreen('intro')}
            onConfirm={(val) => beginPlay(val)}
          />

          <PlayScreen
            active={screen === 'play'}
            scen={scen}
            m={m}
            sim={sim}
            actions={actions}
            hiddenMode={hiddenMode}
            hiddenMeta={hiddenMeta}
            unlocked={unlocked}
            guess={guess}
            onTick={handleTick}
            onAddAction={handleAddAction}
            onHome={() => setScreen('home')}
            onReplay={replayGame}
            onReview={() => setScreen('review')}
            onCoach={() => setScreen('coach')}
            onMarkDone={handleMarkDone}
            onSetEraGuess={handleSetEraGuess}
          />

          <ReviewScreen
            active={screen === 'review'}
            scen={scen}
            sim={sim}
            actions={actions}
            hiddenMode={hiddenMode}
            onCoach={() => setScreen('coach')}
            onReplay={replayGame}
            onHome={() => setScreen('home')}
          />

          <CoachScreen
            active={screen === 'coach'}
            scen={scen}
            sim={sim}
            actions={actions}
            hiddenMode={hiddenMode}
            onHome={() => setScreen('home')}
            onChapter={startChapter}
            onReplay={replayGame}
          />

          <SandboxScreen
            active={screen === 'sandbox'}
            onBack={() => setScreen('home')}
          />
        </div>
      </div>
    </div>
  );
}
