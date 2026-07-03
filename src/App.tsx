import React, { useState, useEffect } from 'react';
import { QuestionnaireResponse, QuestionnaireId, Profile, Evaluator } from './types';
import { questionnairesData, calculateScores, logResponseToConsole } from './data/questionnaires';
import QuestionnaireForm from './components/QuestionnaireForm';
import Dashboard from './components/Dashboard';
import EvaluatorLogin from './components/EvaluatorLogin';
import {
  Activity,
  Award,
  BookOpen,
  ClipboardList,
  FileCheck2,
  HeartHandshake,
  HelpCircle,
  TrendingUp,
  UserCheck,
  LogOut
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'ergonomic_assessment_responses_v1';
const PROFILES_STORAGE_KEY = 'ergonomic_profiles_v1';
const EVALUATOR_STORAGE_KEY = 'ergonomic_evaluator_v1';

// Seed responses to initialize the app (Returns empty for real blank state)
const getSeedResponses = (): QuestionnaireResponse[] => {
  return [];
};

export default function App() {
  const [view, setView] = useState<'dashboard' | 'form'>('dashboard');
  const [selectedQId, setSelectedQId] = useState<QuestionnaireId | null>(null);
  const [responses, setResponses] = useState<QuestionnaireResponse[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileIdForForm, setActiveProfileIdForForm] = useState<string | null>(null);
  const [evaluator, setEvaluator] = useState<Evaluator | null>(null);
  const [isEvaluatorLoaded, setIsEvaluatorLoaded] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    // Load evaluator
    const savedEvaluator = localStorage.getItem(EVALUATOR_STORAGE_KEY);
    if (savedEvaluator) {
      try {
        setEvaluator(JSON.parse(savedEvaluator) as Evaluator);
      } catch (e) {
        setEvaluator(null);
      }
    }
    setIsEvaluatorLoaded(true);

    // Load responses
    const savedResponses = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedResponses) {
      try {
        const parsed = JSON.parse(savedResponses) as QuestionnaireResponse[];
        const cleanResponses = parsed.filter(resp => resp && resp.id && !resp.id.startsWith('seed_'));
        setResponses(cleanResponses);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanResponses));
      } catch (e) {
        setResponses([]);
      }
    } else {
      setResponses([]);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
    }

    // Load profiles
    const savedProfiles = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (savedProfiles) {
      try {
        setProfiles(JSON.parse(savedProfiles) as Profile[]);
      } catch (e) {
        setProfiles([]);
      }
    } else {
      setProfiles([]);
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify([]));
    }
  }, []);

  const handleLoginEvaluator = (newEvaluator: Evaluator) => {
    setEvaluator(newEvaluator);
    localStorage.setItem(EVALUATOR_STORAGE_KEY, JSON.stringify(newEvaluator));
  };

  const handleLogoutEvaluator = () => {
    setEvaluator(null);
    localStorage.removeItem(EVALUATOR_STORAGE_KEY);
    setConfirmLogout(false);
  };

  const handleSaveResponse = (newResponse: QuestionnaireResponse) => {
    const q = questionnairesData.find(item => item.id === newResponse.questionnaireId);
    const acronym = q?.acronym || 'Laudo';
    logResponseToConsole(newResponse, acronym);
    
    const updated = [newResponse, ...responses];
    setResponses(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    setView('dashboard');
  };

  const handleDeleteResponse = (id: string) => {
    const updated = responses.filter(r => r.id !== id);
    setResponses(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  const handleClearAllResponses = () => {
    setResponses([]);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
  };

  const handleClearAllProfiles = () => {
    setProfiles([]);
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify([]));
    setResponses([]);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
  };

  const handleLaunchForm = (id: QuestionnaireId, profileId?: string) => {
    setSelectedQId(id);
    setActiveProfileIdForForm(profileId || null);
    setView('form');
  };

  const handleSaveProfile = (newProfile: Profile) => {
    const updated = [newProfile, ...profiles.filter(p => p.id !== newProfile.id)];
    setProfiles(updated);
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updated));
  };

  const handleDeleteProfile = (id: string) => {
    const updated = profiles.filter(p => p.id !== id);
    setProfiles(updated);
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updated));
    // Remove linked responses
    const updatedResponses = responses.filter(r => r.profileId !== id);
    setResponses(updatedResponses);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedResponses));
  };

  const activeQuestionnaire = questionnairesData.find(q => q.id === selectedQId);
  const activePrefilledProfile = profiles.find(p => p.id === activeProfileIdForForm);

  if (!isEvaluatorLoaded) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center font-sans">
        <div className="text-slate-400 text-xs animate-pulse font-mono uppercase tracking-widest">Carregando informações do avaliador...</div>
      </div>
    );
  }

  if (!evaluator) {
    return <EvaluatorLogin onLogin={handleLoginEvaluator} />;
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50 font-sans overflow-hidden text-slate-900">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 flex flex-col border-r border-slate-800 shrink-0 h-full overflow-hidden select-none">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white text-base shadow-sm shadow-blue-500/20">D</div>
            <span className="font-bold text-base text-white tracking-tight">Dossiê Ergonômico</span>
          </div>
          <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Laudos & Diagnósticos</p>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Painel de Controle</p>
            <button
              onClick={() => setView('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                view === 'dashboard'
                  ? 'bg-blue-600/15 text-blue-400 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white cursor-pointer'
              }`}
            >
              <Activity className="w-4 h-4 shrink-0" />
              Painel de Laudos
            </button>
          </div>


        </nav>

        {/* User profile card in sidebar bottom */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-xs shrink-0 uppercase">
              {evaluator?.name?.substring(0, 2) || 'AV'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider truncate">
                {evaluator?.role || 'Avaliador Técnico'}
              </p>
              <p className="text-xs text-slate-200 font-semibold truncate" title={evaluator?.name}>
                {evaluator?.name}
              </p>
            </div>
          </div>
          {confirmLogout ? (
            <div className="bg-red-950/25 border border-red-900/40 rounded-lg p-2.5 space-y-2 text-center animate-fade-in">
              <p className="text-[10px] text-red-200 font-semibold uppercase tracking-wider">Confirmar alteração?</p>
              <div className="flex gap-2">
                <button
                  onClick={handleLogoutEvaluator}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[9px] py-1 px-1.5 rounded-md uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                >
                  Sim
                </button>
                <button
                  onClick={() => setConfirmLogout(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-[9px] py-1 px-1.5 rounded-md uppercase tracking-wider transition-all cursor-pointer"
                >
                  Não
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmLogout(true)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-800/50 hover:bg-red-950/30 text-slate-400 hover:text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-slate-800 hover:border-red-900/30 transition-all cursor-pointer"
            >
              <LogOut className="w-3 h-3" /> Alterar Avaliador
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 shrink-0 z-10 shadow-xs">
          <div>
            <h1 className="text-sm md:text-base font-bold text-slate-800 tracking-tight">
              {view === 'dashboard' ? 'Gerador de Laudos Ocupacionais' : `Questionário Ocupacional`}
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {view === 'dashboard'
                ? `Análise ergonômica e psicossocial ativa`
                : `Preenchendo instrumento científico: ${activeQuestionnaire?.acronym}`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {view === 'dashboard' ? (
              responses.length > 0 ? (
                <span className="hidden sm:inline-flex px-3 py-1 bg-green-50 text-green-700 text-[10px] font-extrabold rounded-full border border-green-200 uppercase tracking-wider">
                  Laudos Ativos ({responses.length})
                </span>
              ) : (
                <span className="hidden sm:inline-flex px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-extrabold rounded-full border border-amber-200 uppercase tracking-wider">
                  Aguardando Respostas (Em Branco)
                </span>
              )
            ) : (
              <span className="hidden sm:inline-flex px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-extrabold rounded-full border border-blue-200 uppercase tracking-wider">
                Preenchimento Ativo
              </span>
            )}
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <span className="text-xs bg-slate-100 text-slate-800 font-semibold border border-slate-200 px-2.5 py-1 rounded-md uppercase tracking-wider" title={evaluator?.professionalId ? `Registro: ${evaluator.professionalId}` : undefined}>
              {evaluator?.name}
            </span>
          </div>
        </header>

        {/* Workspace Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* Welcome/Summary Card */}
          {view === 'dashboard' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all">
              <div className="max-w-xl">
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-100 uppercase tracking-wider">
                  Ferramenta de Diagnóstico Ocupacional
                </span>
                <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight mt-3">
                  Compilação de Diagnósticos Psicossociais e Ergonômicos
                </h2>
                <p className="text-xs md:text-sm text-slate-500 mt-2 leading-relaxed">
                  Aplique as principais ferramentas científicas ocupacionais: <strong className="text-slate-800">NASA-TLX</strong> (sobrecarga mental), <strong className="text-slate-800">COPSOQ II</strong> (clima psicossocial), <strong className="text-slate-800">JDS</strong> (motivação laboral), <strong className="text-slate-800">TQWL-42</strong> (qualidade de vida) e <strong className="text-slate-800">AV-ERGO</strong> (anamnese ocupacional). Gere laudos e assine em Excel, Word ou PDF.
                </p>
              </div>

              {/* Quick stats row */}
              <div className="grid grid-cols-3 gap-6 border border-slate-100 rounded-xl p-4 bg-slate-50/50 min-w-[280px] shrink-0">
                <div className="text-center">
                  <span className="block text-2xl font-black text-blue-600">{responses.length}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Laudos</span>
                </div>
                <div className="text-center border-x border-slate-200 px-4">
                  <span className="block text-2xl font-black text-emerald-600">{questionnairesData.length}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Métodos</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-black text-indigo-600">100%</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Local</span>
                </div>
              </div>
            </div>
          )}

          {/* Core View Display */}
          <div className="space-y-6">
            {view === 'dashboard' ? (
              <Dashboard
                responses={responses}
                profiles={profiles}
                onSelectResponse={() => {}}
                onNewResponse={handleLaunchForm}
                onDeleteResponse={handleDeleteResponse}
                onSaveProfile={handleSaveProfile}
                onDeleteProfile={handleDeleteProfile}
                onClearAllResponses={handleClearAllResponses}
                onClearAllProfiles={handleClearAllProfiles}
                evaluator={evaluator || undefined}
              />
            ) : (
              activeQuestionnaire && (
                <QuestionnaireForm
                  questionnaire={activeQuestionnaire}
                  onSave={handleSaveResponse}
                  onCancel={() => setView('dashboard')}
                  prefilledProfile={activePrefilledProfile}
                />
              )
            )}
          </div>

          {/* Elegant Footer */}
          <footer className="pt-6 border-t border-slate-200 text-center text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 font-medium text-slate-500">
              <HeartHandshake className="w-3.5 h-3.5 text-rose-500" /> Dossiê Ergonômico e Psicossocial de Avaliação Ocupacional
            </div>
            <div className="text-slate-400">
              Avaliador: <strong className="text-slate-600 font-semibold">{evaluator?.name}</strong> {evaluator?.professionalId && `(${evaluator.professionalId})`} &bull; Versão 1.0.0
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
