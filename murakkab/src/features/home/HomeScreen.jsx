import ProgressRing from './ProgressRing';

export default function HomeScreen({ active, done, unlocked, onChapter, onHidden, onSandbox }) {
  const ch1Done = done.has(0);
  const ch2Done = done.has(1);

  return (
    <div className={`scr${active ? ' on' : ''}`}>
      <div className="chrome">
        <span className="app"><span className="mk">مُ</span> تطبيق الإنماء · مُركب</span>
        <span className="vpill">فلوس افتراضية</span>
      </div>

      <div className="hgreet">
        <ProgressRing done={done} />
        <div>
          <h1>هلا فيك 👋</h1>
          <div className="s">رحلتك من الخوف للاستثمار الواعي — باللعب</div>
        </div>
      </div>

      <button
        className={`chap${ch1Done ? '' : ' hot'}`}
        onClick={() => onChapter(0)}
      >
        <span className="ic">💍</span>
        <span className="tx">
          <span className="t">الفصل ١ — زواج فهد × كورونا</span>
          <br />
          <span className="s">الوقت في السوق · تاسي 2019–2021</span>
        </span>
        <span className={`st${ch1Done ? ' done' : ' go'}`}>
          {ch1Done ? '★ مكتمل' : 'العب ▶'}
        </span>
      </button>

      <button
        className={`chap${ch1Done && !ch2Done ? ' hot' : ''}`}
        onClick={() => onChapter(1)}
      >
        <span className="ic">🏠</span>
        <span className="tx">
          <span className="t">الفصل ٢ — بيت العائلة × فقاعة 2006</span>
          <br />
          <span className="s">درس الفقاعة · تاسي 2004–2009</span>
        </span>
        <span className={`st${ch2Done ? ' done' : ' go'}`}>
          {ch2Done ? '★ مكتمل' : 'العب ▶'}
        </span>
      </button>

      <button
        className="chap"
        onClick={() => unlocked && onHidden()}
        style={!unlocked ? { pointerEvents: 'none' } : {}}
      >
        <span className="ic">🎲</span>
        <span className="tx">
          <span className="t">النافذة المخفية</span>
          <br />
          <span className="s">فترة مجهولة من تاسي — عيشها ثم خمّن متى كانت</span>
        </span>
        <span className={`st${unlocked ? ' go' : ''}`}>
          {unlocked ? 'العب ▶' : '🔒 بعد أول فصل'}
        </span>
      </button>

      <button className="chap lock" disabled>
        <span className="ic">🔒</span>
        <span className="tx">
          <span className="t">الفصل ٣ — كل البيض بسلة؟</span>
          <br />
          <span className="s">التنويع</span>
        </span>
        <span className="st">قريباً</span>
      </button>

      <button className="sandbtn" onClick={onSandbox}>
        <span className="t">🎯 لو استثمرت من يوم تخرجت؟</span>
        <br />
        <span className="s">حاسبة الزمن — رقمك أنت على بيانات السوق الحقيقية</span>
      </button>

      <div className="homefoot">
        للتوعية فقط — مو نصيحة استثمارية · كل الأرصدة افتراضية
      </div>
    </div>
  );
}
