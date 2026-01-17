import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ChevronRight, ChevronLeft, Send, CheckCircle2, Image as ImageIcon, RotateCcw, LogOut, AlertCircle } from 'lucide-react';
import { saveState, loadState, clearState } from './persistence';

const FIXED_DATES = {
  start: '2022-01-15',
  end: '2025-12-17'
};

const MOCK_MOMENTS = [
  { id: 1, url: "https://i.postimg.cc/c4QJ0799/photo_5429107394412745194_y.jpg", annotation: "Наше перше побачення у Blue Bird, коли ми наважилися взятися за руки" },
  { id: 2, url: "https://i.postimg.cc/rFSpMGng/photo_5429107394412745196_y.jpg", annotation: "Найкраще 14-те лютого, яке в мене коли-небудь було" },
  { id: 3, url: "https://i.postimg.cc/dt80wRH4/photo_5429107394412745199_y.jpg", annotation: "Мабуть, моя найулюбленіша фотка за час на відстані)" },
  { id: 4, url: "https://i.postimg.cc/pXDdRQGs/photo_5429107394412745200_y.jpg", annotation: "Перший справжній поцілунок за ну дууууже багато часу" },
  { id: 5, url: "https://i.postimg.cc/66431xd6/photo_5429107394412745201_y.jpg", annotation: "Перше літо із тобою..." }
];

const QUESTIONS = {
  ratings: [
    { id: 'comm', label: 'Спілкування та щирість', min: 1, max: 10 },
    { id: 'support', label: 'Емоційна підтримка та присутність', min: 1, max: 10 },
    { id: 'trust', label: 'Довіра та відчуття безпеки', min: 1, max: 10 },
    { id: 'growth', label: 'Взаємний розвиток', min: 1, max: 10 }
  ],
  openEnded: [
    { id: 'favorite_memory', label: 'Який спогад ти досі згадуєш з найтеплішим трепетом?', placeholder: 'Пиши від серця...' },
    { id: 'lessons', label: 'Чого ці стосунки навчили тебе?', placeholder: 'Тіки чесно давай...' },
    { id: 'unsaid', label: 'Чи є щось, що ти хотіла б сказати, але так і не наважилася?', placeholder: 'Ну скажиии, Ян...' }
  ]
};

const STYLES = {
  pinkBg: 'bg-[#fffafa]',
  softBorder: 'border-2 border-[#f5e6e6]',
  neumorphic: 'shadow-[8px_8px_16px_#f0e1e1,-8px_-8px_16px_#ffffff]',
  neumorphicInset: 'shadow-[inset:4px_4px_10px_#f0e1e1,inset_-4px_-4px_10px_#ffffff]',
  accent: 'text-[#8a6d6d]',
  boldSerif: { fontFamily: "'Fraunces', serif", fontWeight: 700 },
  bodySerif: { fontFamily: "'Fraunces', serif", fontWeight: 400 }
};

export default function App() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({ startDate: FIXED_DATES.start, endDate: FIXED_DATES.end });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [stack, setStack] = useState([...MOCK_MOMENTS].reverse());

  const totalSteps = 1 + 1 + 1 + QUESTIONS.openEnded.length + 1;

  // Load initial state
  useEffect(() => {
    const loadedState = loadState();
    if (loadedState) {
      setStep(loadedState.currentStep || 0);
      setFormData(prev => ({ ...prev, ...loadedState.answers }));
      if (loadedState.uiFlags) {
        setIsSubmitted(loadedState.uiFlags.isSubmitted || false);
        setShowGallery(loadedState.uiFlags.showGallery || false);
        setIsClosed(loadedState.uiFlags.isClosed || false);
        if (loadedState.uiFlags.stackLength !== undefined && loadedState.uiFlags.stackLength < MOCK_MOMENTS.length) {
          const restoredStack = [...MOCK_MOMENTS].reverse().slice(0, loadedState.uiFlags.stackLength);
          setStack(restoredStack);
        }
      }
    }
  }, []);

  // Error state for persistence
  const [saveError, setSaveError] = useState(null);

  // Auto-save effect
  useEffect(() => {
    if (isSubmitted && !showGallery) {
      // Logic: if submitted and not in gallery, maybe we don't need to save eagerly, 
      // but let's just save everything consistent with the plan.
      // Actually, if isSubmitted, we might want to keep that state.
    }

    const saveData = () => {
      try {
        saveState({
          step,
          formData,
          uiState: {
            isSubmitted,
            showGallery,
            isClosed,
            stackLength: stack.length
          }
        });
        setSaveError(null);
      } catch (err) {
        setSaveError(err.message);
      }
    };

    // Debounce save
    const timeoutId = setTimeout(saveData, 1000);

    return () => clearTimeout(timeoutId);
  }, [step, formData, isSubmitted, showGallery, isClosed, stack.length]);

  // Safety save on unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        saveState({
          step,
          formData,
          uiState: {
            isSubmitted,
            showGallery,
            isClosed,
            stackLength: stack.length
          }
        });
      } catch (e) {
        // Silent fail on unload
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') handleBeforeUnload();
    });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleBeforeUnload);
    };
  }, [step, formData, isSubmitted, showGallery, isClosed, stack.length]);

  const updateData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps - 1));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const duration = useMemo(() => {
    const start = new Date(FIXED_DATES.start);
    const end = new Date(FIXED_DATES.end);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return {
      years: (diffTime / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1),
      weeks: Math.floor(diffDays / 7),
      days: diffDays,
      hours: Math.floor(diffTime / (1000 * 60 * 60))
    };
  }, []);

  const handleFinalSubmit = async () => {
    try {
      const answersArray = [
        `Спілкування: ${formData.comm || 0}/10`,
        `Підтримка: ${formData.support || 0}/10`,
        `Довіра: ${formData.trust || 0}/10`,
        `Розвиток: ${formData.growth || 0}/10`,
        `Найкращий спогад: ${formData.favorite_memory || 'Без відповіді'}`,
        `Уроки: ${formData.lessons || 'Без відповіді'}`,
        `Несказане: ${formData.unsaid || 'Без відповіді'}`,
      ];

      const response = await fetch('/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers: answersArray }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answers');
      }

      setIsSubmitted(true);
      clearState();
    } catch (error) {
      console.error("Submission error:", error);
      setSaveError("Failed to send responses. Please try again.");
    }
  };

  const handlePop = () => {
    if (stack.length === 0) return;
    setStack(prev => prev.slice(0, prev.length - 1));
  };

  const resetStack = () => setStack([...MOCK_MOMENTS].reverse());

  const handleWalkAway = () => {
    setIsClosed(true);
  };

  if (isClosed) {
    return (
      <div className={`min-h-screen ${STYLES.pinkBg} flex items-center justify-center p-6 text-center`}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }} className="max-w-md">
          <Heart size={40} className="mx-auto mb-8 text-[#e8dcdc]" />
          <h2 className="text-3xl mb-4 text-[#bda6a6]" style={STYLES.boldSerif}>Бажаю тобі усього найкращого</h2>
          <p className="text-[#ccabab] font-light italic leading-relaxed" style={STYLES.bodySerif}>
            Цей розділ завершено. Ти можеш залишити цю сторінку, коли відчуєш, що готова
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${STYLES.pinkBg} text-[#5c4a4a] flex flex-col items-center justify-center p-6 relative overflow-hidden font-inter`}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;1,9..144,400&family=Inter:wght@300;400;600&family=Caveat:wght@400;600&display=swap" rel="stylesheet" />

      {!isSubmitted && (
        <div className="fixed top-8 left-0 right-0 flex justify-center space-x-2 px-4 z-50">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1.5 transition-all duration-700 rounded-full ${i <= step ? 'w-8 bg-[#ccabab]' : 'w-4 bg-[#f5e6e6]'} `} />
          ))}
        </div>
      )}

      {/* Persistence Error Toast */}
      <AnimatePresence>
        {saveError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] bg-red-100 border border-red-200 text-red-700 px-4 py-2 rounded-lg flex items-center shadow-lg text-sm"
          >
            <AlertCircle size={16} className="mr-2" />
            {saveError}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="w-full max-w-xl z-10">
        <AnimatePresence mode="wait">
          {!isSubmitted && step === 0 && (
            <motion.div key="welcome" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className={`p-10 md:p-14 rounded-[48px] ${STYLES.neumorphic} ${STYLES.pinkBg} ${STYLES.softBorder} text-center`}>
              <div className={`w-16 h-16 mx-auto mb-8 rounded-2xl flex items-center justify-center ${STYLES.neumorphic}`}><Heart className="text-[#ccabab]" size={32} fill="#fffafa" /></div>
              <h1 className="text-5xl mb-6 tracking-tight" style={STYLES.boldSerif}>Ретроспектива</h1>
              <p className="text-lg leading-relaxed mb-10 font-light text-[#8a6d6d]">Тихий простір для рефлексії. Перш ніж почати, давай озирнемося на хронологію нашого спільного шляху</p>
              <button onClick={nextStep} className={`group px-10 py-5 rounded-2xl transition-all flex items-center mx-auto space-x-3 ${STYLES.neumorphic} bg-[#fffafa] active:shadow-inner hover:scale-[1.02]`}>
                <span className="text-xl" style={STYLES.boldSerif}>Почати шлях</span>
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {!isSubmitted && step === 1 && (
            <motion.div key="timeline" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-8">
              <div className={`p-8 md:p-12 rounded-[48px] ${STYLES.neumorphic} ${STYLES.pinkBg} ${STYLES.softBorder}`}>
                <h2 className="text-3xl tracking-tight text-center" style={STYLES.boldSerif}>Наша лінія часу</h2>
                <p className="text-lg text-[#8a6d6d] text-center mt-2 mb-10 opacity-80 italic leading-relaxed" style={STYLES.bodySerif}>
                  «Ось скільки часу ми були важливими одне для одного»
                </p>

                <div className="flex justify-center items-center space-x-4 mb-10">
                  <div className="text-center">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#bda6a6] mb-1">Початок</div>
                    <div className="text-lg" style={STYLES.boldSerif}>15.01.2022</div>
                  </div>
                  <div className="h-px w-8 bg-[#f5e6e6]" />
                  <div className="text-center">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#bda6a6] mb-1">Завершення</div>
                    <div className="text-lg" style={STYLES.boldSerif}>17.12.2025</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  {[{ val: duration.years, label: 'Років' }, { val: duration.weeks, label: 'Тижнів' }, { val: duration.days, label: 'Днів' }, { val: duration.hours, label: 'Годин' }].map((item, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl ${STYLES.neumorphic} bg-[#fffafa] border border-[#fdf0f0]`}>
                      <div className="text-xl font-bold" style={STYLES.boldSerif}>{item.val}</div>
                      <div className="text-[10px] uppercase tracking-tighter text-[#bda6a6]">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center px-4">
                <button onClick={prevStep} className="text-[#bda6a6] font-semibold flex items-center hover:text-[#8a6d6d]"><ChevronLeft size={20} className="mr-1" /> Назад</button>
                <button onClick={nextStep} className={`px-8 py-4 rounded-xl ${STYLES.neumorphic} text-lg hover:shadow-inner`} style={STYLES.boldSerif}>Продовжити</button>
              </div>
            </motion.div>
          )}

          {!isSubmitted && step === 2 && (
            <motion.div key="ratings" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-8">
              <div className={`p-8 md:p-12 rounded-[48px] ${STYLES.neumorphic} ${STYLES.pinkBg} ${STYLES.softBorder}`}>
                <h2 className="text-3xl mb-10 tracking-tight text-center" style={STYLES.boldSerif}>Грані стосунків</h2>
                <p className="text-lg text-[#8a6d6d] text-center mt-0 mb-0 opacity-80 italic leading-relaxed" style={STYLES.bodySerif}>
                  «Спробуй оцінити ці аспекти нашого шляху за 10-бальною шкалою»
                </p>
                <div className="space-y-10">
                  {QUESTIONS.ratings.map((q) => (
                    <div key={q.id} className="space-y-5">
                      <div className="flex justify-between items-end">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#bda6a6]">{q.label}</label>
                        <span className="text-2xl italic opacity-80" style={STYLES.bodySerif}>{formData[q.id] || 0}</span>
                      </div>
                      <div className="flex justify-between items-center space-x-1.5">
                        {[...Array(10)].map((_, i) => (
                          <button key={i} onClick={() => updateData(q.id, i + 1)} className={`flex-1 h-12 rounded-xl transition-all ${(formData[q.id] || 0) > i ? 'bg-[#ccabab] text-white' : `${STYLES.neumorphic} hover:bg-[#fffcfc]`}`}>
                            <span className="text-[11px] font-bold">{i + 1}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center px-4">
                <button onClick={prevStep} className="flex items-center text-[#bda6a6] font-semibold"><ChevronLeft size={20} className="mr-1" /> Назад</button>
                <button onClick={nextStep} className={`px-8 py-4 rounded-xl ${STYLES.neumorphic} text-lg`} style={STYLES.boldSerif}>Продовжити</button>
              </div>
            </motion.div>
          )}

          {!isSubmitted && step >= 3 && step < totalSteps - 1 && (
            <motion.div key={`open-${step}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
              {(() => {
                const qIdx = step - 3;
                const question = QUESTIONS.openEnded[qIdx];
                return (
                  <div className={`p-8 md:p-12 rounded-[48px] ${STYLES.neumorphic} ${STYLES.pinkBg} ${STYLES.softBorder} min-h-[400px] flex flex-col`}>
                    <h2 className="text-3xl mb-8 tracking-tight leading-tight" style={STYLES.boldSerif}>{question.label}</h2>
                    <textarea
                      value={formData[question.id] || ''}
                      onChange={(e) => updateData(question.id, e.target.value)}
                      placeholder={question.placeholder}
                      className={`flex-grow w-full p-8 rounded-[32px] bg-transparent outline-none resize-none text-xl leading-relaxed placeholder:italic placeholder:text-[#e8dcdc] border-none shadow-[inset_4px_3px_10px_#f0e1e1,inset_-4px_-4px_10px_#ffffff]`}
                      style={STYLES.bodySerif}
                    />
                  </div>
                );
              })()}
              <div className="flex justify-between items-center px-4">
                <button onClick={prevStep} className="flex items-center text-[#bda6a6] font-semibold hover:text-[#8a6d6d]"><ChevronLeft size={20} className="mr-1" /> Назад</button>
                <button onClick={nextStep} className={`px-10 py-4 rounded-xl ${STYLES.neumorphic} text-xl`} style={STYLES.boldSerif}>Продовжити</button>
              </div>
            </motion.div>
          )}

          {!isSubmitted && step === totalSteps - 1 && (
            <motion.div key="final" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className={`p-12 rounded-[48px] ${STYLES.neumorphic} ${STYLES.pinkBg} ${STYLES.softBorder} text-center`}>
              <h2 className="text-4xl mb-6 tracking-tight" style={STYLES.boldSerif}>На цьому все, крихітко</h2>
              <p className="mb-10 text-[#8a6d6d] leading-relaxed text-lg font-light">Дякую за твою щирість. Фіналізація відправить твої відповіді до мене</p>
              <div className="space-y-6">
                <button onClick={handleFinalSubmit} className={`w-full py-6 rounded-2xl bg-[#ccabab] text-white flex items-center justify-center space-x-3 shadow-lg hover:brightness-105 active:scale-95 transition-all`}>
                  <Send size={20} /><span className="text-2xl" style={STYLES.boldSerif}>Надіслати думки</span>
                </button>
                <button onClick={prevStep} className="w-full py-4 text-sm font-bold uppercase tracking-widest text-[#bda6a6] hover:text-[#8a6d6d]">Переглянути ще раз</button>
              </div>
            </motion.div>
          )}

          {isSubmitted && !showGallery && (
            <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-8">
              <div className={`p-14 rounded-[64px] ${STYLES.neumorphic} ${STYLES.pinkBg} ${STYLES.softBorder} inline-block`}>
                <div className={`w-20 h-20 mx-auto mb-8 rounded-full flex items-center justify-center ${STYLES.neumorphic}`}><CheckCircle2 size={40} className="text-[#ccabab]" /></div>
                <h2 className="text-4xl mb-4 tracking-tight" style={STYLES.boldSerif}>Можна перепочити</h2>
                <p className="text-xl text-[#8a6d6d] font-light max-w-xs mx-auto mb-10">Твої відповіді збережено. Дякую!</p>
                <button onClick={() => setShowGallery(true)} className={`px-10 py-5 rounded-2xl bg-[#fffafa] border border-[#f5e6e6] ${STYLES.neumorphic} flex items-center justify-center space-x-3 mx-auto group active:shadow-inner`}>
                  <ImageIcon size={20} className="text-[#ccabab]" />
                  <span className="text-xl" style={STYLES.boldSerif}>Понастальгувати?</span>
                </button>
              </div>
            </motion.div>
          )}

          {isSubmitted && showGallery && (
            <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-[#fffafa] flex flex-col items-center justify-center p-6 overflow-hidden">
              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={() => setShowGallery(false)}
                className="absolute top-8 right-8 p-4 rounded-full bg-[#fffafa] shadow-md z-[110]"
              ><ChevronLeft size={24} /></motion.button>

              <div className="relative w-full max-w-md aspect-[3/4] flex items-center justify-center">
                <AnimatePresence>
                  {stack.map((moment, index) => (
                    <motion.div
                      key={moment.id}
                      initial={false}
                      animate={{
                        scale: 1 - (stack.length - 1 - index) * 0.05,
                        y: (stack.length - 1 - index) * -15,
                        rotate: (stack.length - 1 - index) * (index % 2 === 0 ? 2 : -2),
                        opacity: 1
                      }}
                      exit={{
                        x: index % 2 === 0 ? 500 : -500,
                        rotate: index % 2 === 0 ? 45 : -45,
                        opacity: 0
                      }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      onClick={index === stack.length - 1 ? handlePop : undefined}
                      className="absolute w-full h-full cursor-pointer touch-none"
                      style={{ zIndex: index }}
                    >
                      <div className={`w-full h-full p-4 bg-white rounded-[32px] shadow-2xl border-4 border-[#fffafa] flex flex-col`}>
                        <div className="flex-grow rounded-[24px] overflow-hidden">
                          <img src={moment.url} alt="Memory" className="w-full h-full object-cover pointer-events-none" />
                        </div>
                        <div className="pt-6 pb-2">
                          <p className="text-2xl text-center text-[#8a6d6d] leading-tight" style={{ fontFamily: "'Caveat', cursive" }}>
                            {moment.annotation}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {stack.length === 0 && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-10">
                    <p className="text-2xl italic opacity-40 px-10" style={STYLES.bodySerif}>Стопка порожня. Більше спогадів не залишилося</p>

                    <div className="space-y-4">
                      <button onClick={resetStack} className={`px-8 py-3 rounded-xl ${STYLES.neumorphic} flex items-center space-x-2 mx-auto text-[#ccabab] font-bold uppercase tracking-widest text-[10px] w-48 justify-center`}>
                        <RotateCcw size={14} />
                        <span>Озирнутися</span>
                      </button>

                      <button onClick={handleWalkAway} className={`px-8 py-3 rounded-xl bg-[#ccabab] text-white flex items-center space-x-2 mx-auto font-bold uppercase tracking-widest text-[10px] w-48 justify-center shadow-lg hover:brightness-105 active:scale-95 transition-all`}>
                        <LogOut size={14} />
                        <span>Піти далі</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="mt-12 text-center">
                {stack.length > 0 && (
                  <p className="text-[#ccabab] animate-pulse text-[10px] uppercase tracking-[0.4em]">Натисни, щоб побачити наступне фото</p>
                )}
                <footer className="mt-8 text-[11px] font-bold uppercase tracking-[0.3em] text-[#e8dcdc]">
                  15.01.2022 — 17.12.2025
                </footer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-8 text-[11px] font-bold uppercase tracking-[0.3em] text-[#e8dcdc]">
        Ретроспектива Почуттів • 2026
      </footer>
    </div>
  );
}