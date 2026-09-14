import React, { useState, useEffect } from 'react';
import { LPIC_EXAMS, ExamDefinition } from '../data/examQuestions';
import { ExamQuestion, ExamResult, UserProgress } from '../types';
import { soundFx } from '../lib/audio';
import { Clock, CheckCircle2, XCircle, Award, Flag, ArrowLeft, ArrowRight, RotateCcw, FileText, ChevronRight, Sparkles, BookOpen } from 'lucide-react';

interface ExamSimulatorViewProps {
  progress: UserProgress;
  onSaveExamResult: (result: ExamResult) => void;
}

export const ExamSimulatorView: React.FC<ExamSimulatorViewProps> = ({
  progress,
  onSaveExamResult,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<'essentials' | 'lpic1-101' | 'lpic1-102'>('essentials');
  const [inExam, setInExam] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);

  const activeExam = LPIC_EXAMS.find((e) => e.id === selectedExamId) || LPIC_EXAMS[0];
  const currentQuestion: ExamQuestion = activeExam.questions[currentIndex];

  // Start exam
  const handleStartExam = (exam: ExamDefinition) => {
    setSelectedExamId(exam.id);
    setCurrentIndex(0);
    setUserAnswers({});
    setFlaggedQuestions({});
    setTimeLeft(exam.durationMinutes * 60);
    setExamResult(null);
    setInExam(true);
    soundFx.playEnter();
  };

  // Timer
  useEffect(() => {
    if (!inExam || examResult) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [inExam, examResult]);

  // Submit exam and grade using LPIC 200-800 scale
  const handleSubmitExam = () => {
    soundFx.playEnter();
    const questions = activeExam.questions;
    let correctCount = 0;

    const domainScores: Record<string, { correct: number; total: number }> = {};
    activeExam.domains.forEach((d) => {
      domainScores[d] = { correct: 0, total: 0 };
    });

    questions.forEach((q) => {
      const userAnswer = (userAnswers[q.id] || '').trim().toLowerCase();
      let isCorrect = false;

      if (q.type === 'fill_blank') {
        isCorrect = q.correctAnswers.some((ans) => ans.trim().toLowerCase() === userAnswer);
      } else {
        isCorrect = q.correctAnswers.includes(userAnswer);
      }

      if (isCorrect) correctCount++;

      const domain = q.domain || 'General';
      if (!domainScores[domain]) {
        domainScores[domain] = { correct: 0, total: 0 };
      }
      domainScores[domain].total += 1;
      if (isCorrect) domainScores[domain].correct += 1;
    });

    // LPIC score formula: 200 + (correct / total) * 600
    const rawRatio = correctCount / questions.length;
    const finalScore = Math.round(200 + rawRatio * 600);
    const isPassed = finalScore >= activeExam.passingScore;

    const domainBreakdown = Object.entries(domainScores).map(([domain, stats]) => ({
      domain,
      correct: stats.correct,
      total: stats.total,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }));

    const result: ExamResult = {
      id: `exam-res-${Date.now()}`,
      examId: activeExam.id,
      examTitle: activeExam.title,
      score: finalScore,
      passed: isPassed,
      date: new Date().toLocaleDateString(),
      totalQuestions: questions.length,
      correctCount,
      domainBreakdown,
    };

    setExamResult(result);
    setInExam(false);

    if (isPassed) {
      soundFx.playSuccess();
    } else {
      soundFx.playError();
    }

    onSaveExamResult(result);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Exam Selection Screen
  if (!inExam && !examResult) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#131b2e] via-[#111422] to-[#162138] border border-blue-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              <span>Official Certification Simulator</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mt-1">
              LPIC Examination Simulation
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Experience the actual Linux Professional Institute (LPI) certification exam format. Authentic question formats, fill-in-the-blank commands, and rigorous 200–800 score scaling. Passing mark is 500.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 self-stretch md:self-auto">
            <div className="text-center px-2">
              <div className="text-xl sm:text-2xl font-black text-emerald-400">
                {progress.examHistory ? progress.examHistory.filter((e) => e.passed).length : 0}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Exams Passed</div>
            </div>
          </div>
        </div>

        {/* Exams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {LPIC_EXAMS.map((exam) => {
            const bestAttempt = progress.examHistory?.filter((h) => h.examId === exam.id).sort((a, b) => b.score - a.score)[0];

            return (
              <div
                key={exam.id}
                className="bg-[#111624] border border-slate-800 hover:border-blue-500/40 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Exam {exam.code}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {exam.durationMinutes}m
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-100 mt-3">
                    {exam.title}
                  </h3>

                  <div className="mt-4 space-y-2 text-xs text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Questions:</span>
                      <strong className="text-slate-200">{exam.questions.length} Items</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Passing Benchmark:</span>
                      <strong className="text-slate-200">500 / 800 Scale</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Tested Objectives:</span>
                      <strong className="text-slate-200">{exam.domains.length} Domains</strong>
                    </div>
                  </div>

                  {bestAttempt && (
                    <div className="mt-4 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                      <span className="text-slate-400">Your Best Score:</span>
                      <span className={`font-mono font-bold ${bestAttempt.passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {bestAttempt.score}/800 ({bestAttempt.passed ? 'PASSED' : 'FAILED'})
                      </span>
                    </div>
                  )}
                </div>

                <button
                  id={`start-exam-${exam.id}-btn`}
                  onClick={() => handleStartExam(exam)}
                  className="mt-6 w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-slate-100 font-bold text-xs transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  <span>Begin Timed Simulation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Active Exam Mode
  if (inExam && !examResult) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* Top Header Bar */}
        <div className="bg-[#111624] border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider">
              {activeExam.code} • Question {currentIndex + 1} of {activeExam.questions.length}
            </span>
            <h3 className="text-sm font-bold text-slate-100">
              {activeExam.title}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-sm font-bold text-amber-400">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{formatTime(timeLeft)}</span>
            </div>

            <button
              id="submit-exam-now-btn"
              onClick={handleSubmitExam}
              className="py-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition shadow-sm"
            >
              Submit Exam
            </button>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-[#111420] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-mono font-semibold text-slate-400">
                {currentQuestion.domain} • {currentQuestion.lpicObjective}
              </span>
              <h2 className="text-base sm:text-lg font-semibold text-slate-100 mt-1 leading-relaxed">
                {currentQuestion.question}
              </h2>
            </div>

            <button
              onClick={() => {
                setFlaggedQuestions((prev) => ({
                  ...prev,
                  [currentQuestion.id]: !prev[currentQuestion.id],
                }));
              }}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition ${
                flaggedQuestions[currentQuestion.id]
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flag className="w-4 h-4" />
              <span className="hidden sm:inline">Flag</span>
            </button>
          </div>

          {/* Interactive Answer Input */}
          {currentQuestion.type === 'fill_blank' ? (
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-semibold block">
                Type the exact Linux command syntax:
              </label>
              <input
                type="text"
                value={userAnswers[currentQuestion.id] || ''}
                onChange={(e) => {
                  setUserAnswers({
                    ...userAnswers,
                    [currentQuestion.id]: e.target.value,
                  });
                }}
                placeholder="e.g., chmod 755 script.sh"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {currentQuestion.options?.map((opt) => {
                const isSelected = userAnswers[currentQuestion.id] === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      soundFx.playKeypress();
                      setUserAnswers({
                        ...userAnswers,
                        [currentQuestion.id]: opt.id,
                      });
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex items-center gap-3.5 ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500/80 text-blue-200 shadow-md ring-1 ring-blue-500'
                        : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold uppercase transition ${
                        isSelected ? 'bg-blue-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {opt.id}
                    </div>
                    <span className="text-sm">{opt.text}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentIndex < activeExam.questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-slate-100 text-xs font-bold transition flex items-center gap-1.5 shadow-md"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitExam}
                className="py-2 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <span>Complete & Grade</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Question Palette / Navigator Grid */}
        <div className="bg-[#111624] border border-slate-800 rounded-2xl p-4">
          <span className="text-xs font-semibold text-slate-400 block mb-3">
            Question Navigator Palette
          </span>
          <div className="flex flex-wrap gap-2">
            {activeExam.questions.map((q, idx) => {
              const isAnswered = Boolean(userAnswers[q.id]);
              const isFlagged = Boolean(flaggedQuestions[q.id]);
              const isCurrent = idx === currentIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-mono font-bold flex items-center justify-center relative transition ${
                    isCurrent
                      ? 'ring-2 ring-blue-400 bg-blue-600 text-slate-100'
                      : isAnswered
                      ? 'bg-slate-800 text-slate-200 border border-slate-700'
                      : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}
                >
                  {idx + 1}
                  {isFlagged && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 absolute -top-0.5 -right-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Diagnostic Score Report Screen
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Score Banner */}
      <div className={`border rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-4 ${
        examResult?.passed
          ? 'bg-gradient-to-b from-emerald-950/40 via-[#101920] to-[#0e151a] border-emerald-500/40'
          : 'bg-gradient-to-b from-rose-950/30 via-[#14121a] to-[#100e16] border-rose-500/40'
      }`}>
        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mx-auto border shadow-lg ${
          examResult?.passed
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-emerald-500/20'
            : 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-rose-500/20'
        }`}>
          {examResult?.passed ? '🎓' : '📚'}
        </div>

        <div>
          <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded border ${
            examResult?.passed
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}>
            {examResult?.passed ? 'OFFICIAL PASS' : 'NEEDS IMPROVEMENT'}
          </span>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-100 mt-3 font-mono">
            {examResult?.score} / 800
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Passing Benchmark: 500 • Correct: {examResult?.correctCount} of {examResult?.totalQuestions} Questions
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            id="retake-exam-btn"
            onClick={() => {
              setExamResult(null);
              setInExam(false);
            }}
            className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Return to Exam Menu</span>
          </button>
        </div>
      </div>

      {/* Domain Proficiency Breakdown */}
      <div className="bg-[#111624] border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          <span>Diagnostic Domain Analysis</span>
        </h3>

        <div className="space-y-3">
          {examResult?.domainBreakdown.map((d) => (
            <div key={d.domain} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">{d.domain}</span>
                <span className="text-slate-400 font-mono">
                  {d.correct}/{d.total} ({d.percentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all ${
                    d.percentage >= 70 ? 'bg-emerald-400' : d.percentage >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                  }`}
                  style={{ width: `${d.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Answer Key & Explanations */}
      <div className="bg-[#111624] border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>Question Explanations & LPIC Objectives</span>
        </h3>

        <div className="space-y-4">
          {activeExam.questions.map((q, idx) => {
            const userAnswer = (userAnswers[q.id] || '').trim();
            const isCorrect = q.type === 'fill_blank'
              ? q.correctAnswers.some((a) => a.toLowerCase() === userAnswer.toLowerCase())
              : q.correctAnswers.includes(userAnswer);

            return (
              <div
                key={q.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-200">
                    {idx + 1}. {q.question}
                  </span>
                  {isCorrect ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4" /> Correct
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-400 text-xs font-bold flex-shrink-0">
                      <XCircle className="w-4 h-4" /> Incorrect
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400">
                  <span>Your Answer: </span>
                  <strong className={isCorrect ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                    {userAnswer || '(No answer provided)'}
                  </strong>
                </div>

                <div className="text-xs text-slate-400">
                  <span>Accepted Answer(s): </span>
                  <strong className="text-emerald-400 font-mono">
                    {q.correctAnswers.join(' OR ')}
                  </strong>
                </div>

                <p className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
                  💡 {q.explanation}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
