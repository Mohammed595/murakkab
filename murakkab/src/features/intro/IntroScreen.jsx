export default function IntroScreen({ active, scen, onBack, onNext }) {
  if (!scen) return null;
  return (
    <div className={`scr${active ? ' on' : ''}`}>
      <div className="chrome">
        <button className="back" onClick={onBack}>→ رجوع</button>
        <span className="vpill">فلوس افتراضية</span>
      </div>
      <div className="introcard">
        <div className="big">{scen.persona?.emoji}</div>
        <h2 dangerouslySetInnerHTML={{ __html: scen.persona?.line }} />
        <div className="sub" dangerouslySetInnerHTML={{ __html: scen.persona?.sub }} />
        <button className="btn gold" style={{ maxWidth: 240 }} onClick={onNext}>
          يلا نبدأ ▶
        </button>
      </div>
    </div>
  );
}
