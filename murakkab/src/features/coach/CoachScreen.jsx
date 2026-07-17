import { useState, useEffect, useRef } from 'react';
import { REDUCED } from '../../shared/utils/format';
import { classify, buildCoachData } from './coachData';
import { AR_MONTHS } from '../../shared/utils/format';

export default function CoachScreen({ active, scen, sim, actions, hiddenMode, onHome, onChapter, onReplay }) {
  const [bubbles, setBubbles] = useState([]);
  const [replies, setReplies] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const chatRef = useRef(null);
  const streamRef = useRef(null);

  const monthLabel = m => hiddenMode
    ? `الشهر ${m + 1}`
    : AR_MONTHS[m % 12] + ' ' + (scen.startYear + Math.floor(m / 12));

  useEffect(() => {
    if (!active || !scen || !sim || initialized) return;
    setInitialized(true);
    setBubbles([]); setReplies([]);
    const classification = classify(scen, sim, hiddenMode);
    const data = buildCoachData(classification, scen, sim, hiddenMode, monthLabel);
    streamBubble(data.text, () => {
      // tags bubble
      const tagHtml = data.tags.map(([cls, txt]) =>
        `<span class="btag ${cls}">${txt}</span>`
      ).join(' ');
      setBubbles(b => [...b, { type: 'tags', html: tagHtml }]);
      setReplies(data.replies);
    });
  }, [active, scen, sim]); // eslint-disable-line

  function streamBubble(html, cb) {
    const id = Date.now();
    setBubbles(b => [...b, { type: 'stream', id, html: '', done: false }]);

    if (REDUCED) {
      setBubbles(b => b.map(bub => bub.id === id ? { ...bub, html, done: true } : bub));
      cb?.();
      return;
    }

    const parts = html.split(/(<[^>]+>)/g).filter(Boolean);
    let out = '', qi = 0;

    function next() {
      if (qi >= parts.length) {
        setBubbles(b => b.map(bub => bub.id === id ? { ...bub, html: out, done: true } : bub));
        cb?.();
        return;
      }
      const p = parts[qi++];
      if (p.startsWith('<')) { out += p; next(); return; }
      const words = p.split(' ');
      let wi = 0;
      function word() {
        if (wi >= words.length) { next(); return; }
        out += (wi > 0 ? ' ' : '') + words[wi++];
        setBubbles(b => b.map(bub =>
          bub.id === id ? { ...bub, html: out + '<span class="cursor"></span>' } : bub
        ));
        scrollChat();
        streamRef.current = setTimeout(word, 34);
      }
      word();
    }
    next();
  }

  function scrollChat() {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }

  useEffect(() => { scrollChat(); }, [bubbles]);

  function handleReply(label, answer, allReplies, idx) {
    if (answer === null) {
      // Navigation reply
      if (label.includes('الثاني')) onChapter(1);
      else if (label.includes('كورونا')) onChapter(0);
      else if (label.includes('الرئيسية')) onHome();
      else onReplay();
      return;
    }
    setBubbles(b => [...b, { type: 'me', html: label }]);
    setReplies([]);
    scrollChat();
    streamBubble(answer, () => {
      setReplies(allReplies.filter((_, i) => i !== idx));
    });
  }

  useEffect(() => () => clearTimeout(streamRef.current), []);

  if (!active) return null;

  return (
    <div className={`scr${active ? ' on' : ''}`}>
      <div className="chrome">
        <button className="back" onClick={onHome}>→ الرئيسية</button>
        <span className="vpill">فلوس افتراضية</span>
      </div>

      <div className="coachhdr">
        <div className="cava">مُ</div>
        <div>
          <div className="nm">مدرب مُركب</div>
          <div className="by">يقرأ قراراتك أنت ويرد عليك</div>
        </div>
      </div>

      <div className="chatflow" ref={chatRef}>
        {bubbles.map((bub, i) => {
          if (bub.type === 'me') return (
            <div key={i} className="bub me" dangerouslySetInnerHTML={{ __html: bub.html }} />
          );
          if (bub.type === 'tags') return (
            <div key={i} className="btags" dangerouslySetInnerHTML={{ __html: bub.html }} />
          );
          return (
            <div key={bub.id ?? i} className="bub" dangerouslySetInnerHTML={{ __html: bub.html }} />
          );
        })}
      </div>

      <div className="replies">
        {replies.map(([label, answer], i) => (
          <button
            key={i}
            className={`rep${answer === null ? ' hot' : ''}`}
            onClick={() => handleReply(label, answer, replies, i)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
