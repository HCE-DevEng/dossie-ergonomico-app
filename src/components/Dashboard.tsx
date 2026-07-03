import React, { useState } from 'react';
import { QuestionnaireResponse, Questionnaire, ReportConfig, QuestionnaireId, Profile, Evaluator } from '../types';
import {
  exportToPDF,
  exportToWord,
  exportProfileToPDF,
  exportProfileToWord,
} from '../utils/exporters';
import { questionnairesData, calculateScores, logResponseToConsole } from '../data/questionnaires';
import ReportCustomizer from './ReportCustomizer';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell
} from 'recharts';
import {
  FileText,
  Download,
  Calendar,
  Layers,
  ClipboardCheck,
  ClipboardList,
  ChevronRight,
  TrendingUp,
  Award,
  AlertCircle,
  Clock,
  Printer,
  ChevronDown,
  Terminal,
  Users,
  UserPlus,
  Trash2,
  Plus,
  CheckCircle2,
  User,
  Briefcase,
  Landmark,
  FileBarChart,
  FileCheck2,
  ArrowLeft,
  Lock,
  HeartHandshake
} from 'lucide-react';

interface DashboardProps {
  responses: QuestionnaireResponse[];
  profiles: Profile[];
  onSelectResponse: (response: QuestionnaireResponse) => void;
  onNewResponse: (id: QuestionnaireId, profileId?: string) => void;
  onDeleteResponse: (id: string) => void;
  onSaveProfile: (profile: Profile) => void;
  onDeleteProfile: (id: string) => void;
  onClearAllResponses: () => void;
  onClearAllProfiles: () => void;
  evaluator?: Evaluator;
}

const getInterpretation = (questionnaireId: QuestionnaireId, globalScore: number) => {
  if (questionnaireId === 'nasa_tlx') {
    if (globalScore > 75) return { text: 'Sobrecarga Crítica', color: 'text-red-700 bg-red-50 border-red-200' };
    if (globalScore > 50) return { text: 'Carga Elevada', color: 'text-orange-700 bg-orange-50 border-orange-200' };
    if (globalScore > 25) return { text: 'Carga Moderada', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
    return { text: 'Baixa Sobrecarga', color: 'text-green-700 bg-green-50 border-green-200' };
  }
  if (questionnaireId === 'copsoq_ii') {
    if (globalScore > 70) return { text: 'Risco Psicossocial Alto', color: 'text-red-700 bg-red-50 border-red-200' };
    if (globalScore > 45) return { text: 'Risco Psicossocial Médio', color: 'text-orange-700 bg-orange-50 border-orange-200' };
    return { text: 'Baixo Risco (Clima Favorável)', color: 'text-green-700 bg-green-50 border-green-200' };
  }
  if (questionnaireId === 'jds') {
    if (globalScore > 180) return { text: 'Alto Potencial Motivacional', color: 'text-green-700 bg-green-50 border-green-200' };
    if (globalScore > 100) return { text: 'Moderado Potencial Motivacional', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
    return { text: 'Subutilização / Baixa Motivação', color: 'text-red-700 bg-red-50 border-red-200' };
  }
  if (questionnaireId === 'tqwl_42') {
    if (globalScore > 70) return { text: 'Excelente QVT', color: 'text-green-700 bg-green-50 border-green-200' };
    if (globalScore > 50) return { text: 'Satisfatório QVT', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
    return { text: 'Crítico / Alerta de Saúde', color: 'text-red-700 bg-red-50 border-red-200' };
  }
  if (questionnaireId === 'ergo_anamnese') {
    if (globalScore >= 8) return { text: 'Excelente / Confortável', color: 'text-green-700 bg-green-50 border-green-200' };
    if (globalScore >= 5) return { text: 'Satisfatório / Moderado', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
    return { text: 'Crítico / Desconforto Alto', color: 'text-red-700 bg-red-50 border-red-200' };
  }
  return { text: 'Pontuação Realizada', color: 'text-blue-700 bg-blue-50 border-blue-200' };
};

export default function Dashboard({
  responses,
  profiles,
  onSelectResponse,
  onNewResponse,
  onDeleteResponse,
  onSaveProfile,
  onDeleteProfile,
  onClearAllResponses,
  onClearAllProfiles,
  evaluator
}: DashboardProps) {
  const [selectedResponse, setSelectedResponse] = useState<QuestionnaireResponse | null>(responses[0] || null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(profiles[0]?.id || null);
  const [activeViewResponseId, setActiveViewResponseId] = useState<string | null>(null);

  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileDept, setProfileDept] = useState('');
  const [profileRole, setProfileRole] = useState('');
  const [profileAge, setProfileAge] = useState<number | ''>('');
  const [profileGender, setProfileGender] = useState('Masculino');
  const [profileMarital, setProfileMarital] = useState('Solteiro(a)');
  const [profileEducation, setProfileEducation] = useState('Ensino Superior completo');
  const [profileTenure, setProfileTenure] = useState<number | ''>('');

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [confirmClearProfiles, setConfirmClearProfiles] = useState(false);
  const [confirmClearResponses, setConfirmClearResponses] = useState(false);
  const [confirmDeleteProfileId, setConfirmDeleteProfileId] = useState<string | null>(null);
  const [confirmDeleteResponseId, setConfirmDeleteResponseId] = useState<string | null>(null);

  const previousResponsesLengthRef = React.useRef(responses.length);
  React.useEffect(() => {
    if (responses.length > 0) {
      const exists = responses.some(r => r.id === selectedResponse?.id);
      const isNewAdded = responses.length > previousResponsesLengthRef.current;
      
      if (!selectedResponse || !exists || isNewAdded) {
        handleSelectResponse(responses[0]);
        if (!exists) {
          setActiveViewResponseId(null);
        }
      }
    } else {
      setSelectedResponse(null);
      setActiveViewResponseId(null);
    }
    previousResponsesLengthRef.current = responses.length;
  }, [responses]);

  React.useEffect(() => {
    if (profiles.length > 0) {
      const exists = profiles.some(p => p.id === selectedProfileId);
      if (!selectedProfileId || !exists) {
        setSelectedProfileId(profiles[0].id);
      }
    } else {
      setSelectedProfileId(null);
    }
    setActiveViewResponseId(null);
  }, [profiles, selectedProfileId]);

  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    themeColor: '#1E3A8A',
    showCharts: true,
    showComments: true,
    showDetailsTable: true,
    title: 'LAUDO TÉCNICO DE ERGONOMIA E PSICOSSOCIAL',
    subtitle: 'Avaliação clínica ocupacional consolidada do colaborador'
  });

  const handleSelectResponse = (resp: QuestionnaireResponse) => {
    setSelectedResponse(resp);
    onSelectResponse(resp);
    const q = questionnairesData.find(item => item.id === resp.questionnaireId);
    setReportConfig(prev => ({
      ...prev,
      title: `RELATÓRIO DE AVALIAÇÃO - ${q?.acronym.toUpperCase() || 'QVT'}`,
      subtitle: `Análise ergonômica e psicossocial para o colaborador: ${resp.respondent.name}`
    }));
    if (q) {
      logResponseToConsole(resp, q.acronym);
    }
  };

  const handleExport = (format: 'pdf' | 'word') => {
    if (!selectedResponse) return;
    const q = questionnairesData.find(item => item.id === selectedResponse.questionnaireId);
    if (!q) return;

    if (format === 'pdf') {
      exportToPDF(selectedResponse, q, reportConfig, evaluator);
    } else if (format === 'word') {
      exportToWord(selectedResponse, q, reportConfig, evaluator);
    }
    setIsExportMenuOpen(false);
  };

  const handleCreateProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !profileDept.trim() || !profileRole.trim()) {
      alert("Por favor, preencha os campos obrigatórios: Nome, Setor e Cargo.");
      return;
    }
    const newProfile: Profile = {
      id: `profile_${Date.now()}`,
      name: profileName.trim(),
      department: profileDept.trim(),
      role: profileRole.trim(),
      age: profileAge ? Number(profileAge) : undefined,
      gender: profileGender,
      maritalStatus: profileMarital,
      education: profileEducation,
      tenureMonths: profileTenure ? Number(profileTenure) : undefined,
      createdAt: new Date().toISOString()
    };
    onSaveProfile(newProfile);
    setSelectedProfileId(newProfile.id);
    setIsCreatingProfile(false);

    setProfileName('');
    setProfileDept('');
    setProfileRole('');
    setProfileAge('');
    setProfileGender('Masculino');
    setProfileMarital('Solteiro(a)');
    setProfileEducation('Ensino Superior completo');
    setProfileTenure('');
  };

  const activeQuestionnaire = selectedResponse
    ? questionnairesData.find(q => q.id === selectedResponse.questionnaireId)
    : null;

  const chartData = selectedResponse
    ? Object.entries(selectedResponse.calculatedScores.dimensionScores).map(([name, val]) => ({
        dimension: name,
        pontuacao: val,
      }))
    : [];

  const activeProfile = profiles.find(p => p.id === selectedProfileId);
  const activeProfileResponses = activeProfile
    ? responses.filter(r => r.profileId === activeProfile.id)
    : [];

  const generateAggregatedClinicalOpinion = () => {
    if (activeProfileResponses.length === 0) return null;
    
    const elements: string[] = [];
    const recommendations: string[] = [];
    
    const nasa = activeProfileResponses.find(r => r.questionnaireId === 'nasa_tlx');
    const copsoq = activeProfileResponses.find(r => r.questionnaireId === 'copsoq_ii');
    const jds = activeProfileResponses.find(r => r.questionnaireId === 'jds');
    const tqwl = activeProfileResponses.find(r => r.questionnaireId === 'tqwl_42');

    if (nasa) {
      const score = nasa.calculatedScores.globalScore;
      if (score > 60) {
        elements.push(`Elevada sobrecarga mental e temporal de trabalho (${score} pontos no NASA-TLX), indicando iminente fadiga cognitiva.`);
        recommendations.push("Implementar pausas obrigatórias de 10 minutos a cada duas horas de esforço mental contínuo.");
      } else {
        elements.push(`Carga mental de trabalho equilibrada (${score} pontos no NASA-TLX), compatível com a capacidade adaptativa.`);
      }
    }

    if (copsoq) {
      const score = copsoq.calculatedScores.globalScore;
      if (score > 55) {
        elements.push(`Presença relevante de fatores de risco psicossociais organizacionais (${score}% no COPSOQ II), afetando o clima e a liderança.`);
        recommendations.push("Rever processos de distribuição de tarefas e canais de feedback contínuo com a coordenação imediata.");
      } else {
        elements.push(`Bom suporte social e baixo nível de estressores psicossociais organizacionais (${score}% no COPSOQ II).`);
      }
    }

    if (jds) {
      const score = jds.calculatedScores.globalScore;
      if (score < 120) {
        elements.push(`Baixo escore de potencial motivacional do cargo (${score} MPS no JDS), apontando para subutilização profissional ou falta de autonomia.`);
        recommendations.push("Enriquecer as tarefas (Job Enrichment) concedendo maior margem para tomadas de decisão estruturadas.");
      } else {
        elements.push(`Adequado potencial motivacional estrutural do cargo (${score} MPS no JDS), auxiliando no engajamento laboral.`);
      }
    }

    if (tqwl) {
      const score = tqwl.calculatedScores.globalScore;
      if (score < 50) {
        elements.push(`Qualidade de Vida no Trabalho insatisfatória (${score}% no TQWL-42), com impacto percebido na saúde geral ou no ambiente.`);
        recommendations.push("Desenvolver ações integradas de saúde ocupacional focadas na preservação do bem-estar biopsicossocial do trabalhador.");
      } else {
        elements.push(`Nível favorável de Qualidade de Vida no Trabalho (${score}% no TQWL-42), corroborando estabilidade ergonômica.`);
      }
    }

    const ergoAnamnese = activeProfileResponses.find(r => r.questionnaireId === 'ergo_anamnese');
    if (ergoAnamnese) {
      const score = ergoAnamnese.calculatedScores.globalScore;
      const dores = ergoAnamnese.answers['ae_dores'];
      if (score < 5) {
        elements.push(`Condições de trabalho e percepção ergonômica críticas (Nota Geral: ${score}/10 na Avaliação de Anamnese).`);
        if (dores && String(dores).trim()) {
          elements.push(`Sintomas de desconforto/dor física relatados: "${dores}".`);
        }
        recommendations.push("Realizar análise ergonômica detalhada do posto de trabalho para eliminação imediata de dores e posturas inadequadas.");
      } else if (score < 8) {
        elements.push(`Avaliação de anamnese ergonômica com nível moderado de satisfação (Nota Geral: ${score}/10).`);
        if (dores && String(dores).trim()) {
          elements.push(`Queixas de desconfortos físicos secundários relatadas: "${dores}".`);
        }
        recommendations.push("Ajustar a ergonomia de mobiliários ou do arranjo físico para reduzir desconfortos leves reportados.");
      } else {
        elements.push(`Excelente índice de satisfação e conforto ergonômico percebido: ${score}/10.`);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push("Manter o monitoramento ergonômico periódico anual e preservar as boas práticas vigentes no posto.");
    }

    return {
      elements,
      recommendations
    };
  };

  const clinicalOpinion = generateAggregatedClinicalOpinion();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="profiles-tab-view">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Colaboradores
                </h3>
                <div className="flex items-center gap-2">
                  {profiles.length > 0 && (
                    confirmClearProfiles ? (
                      <div className="flex items-center gap-1.5 animate-fade-in">
                        <button
                          onClick={() => {
                            onClearAllProfiles();
                            setConfirmClearProfiles(false);
                          }}
                          className="text-[9px] bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded font-bold uppercase cursor-pointer"
                        >
                          Sim, Limpar!
                        </button>
                        <button
                          onClick={() => setConfirmClearProfiles(false)}
                          className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold uppercase cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmClearProfiles(true)}
                        className="text-[10px] text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Limpar Todos
                      </button>
                    )
                  )}
                  {!isCreatingProfile && (
                    <button
                      onClick={() => setIsCreatingProfile(true)}
                      className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Novo Perfil
                    </button>
                  )}
                </div>
              </div>

              {isCreatingProfile ? (
                <form onSubmit={handleCreateProfileSubmit} className="space-y-4 border-t border-slate-100 pt-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Novo Perfil de Colaborador</span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingProfile(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Nome Completo *</label>
                      <input
                        type="text"
                        required
                        placeholder="Nome do colaborador"
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                        value={profileName}
                        onChange={e => setProfileName(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Setor / Área *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: TI"
                          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                          value={profileDept}
                          onChange={e => setProfileDept(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Cargo / Função *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Desenvolvedor"
                          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                          value={profileRole}
                          onChange={e => setProfileRole(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Idade</label>
                        <input
                          type="number"
                          placeholder="Anos"
                          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                          value={profileAge}
                          onChange={e => setProfileAge(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Tempo de Empresa</label>
                        <input
                          type="number"
                          placeholder="Meses"
                          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                          value={profileTenure}
                          onChange={e => setProfileTenure(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Gênero</label>
                        <select
                          className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                          value={profileGender}
                          onChange={e => setProfileGender(e.target.value)}
                        >
                          <option value="Masculino">Masculino</option>
                          <option value="Feminino">Feminino</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Estado Civil</label>
                        <select
                          className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                          value={profileMarital}
                          onChange={e => setProfileMarital(e.target.value)}
                        >
                          <option value="Solteiro(a)">Solteiro(a)</option>
                          <option value="Casado(a) / União estável">Casado(a) / União estável</option>
                          <option value="Divorciado(a)">Divorciado(a)</option>
                          <option value="Viúvo(a)">Viúvo(a)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Instrução</label>
                      <select
                        className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                        value={profileEducation}
                        onChange={e => setProfileEducation(e.target.value)}
                      >
                        <option value="Ensino Fundamental incompleto">Ensino Fundamental incompleto</option>
                        <option value="Ensino Fundamental completo">Ensino Fundamental completo</option>
                        <option value="Ensino Médio incompleto">Ensino Médio incompleto</option>
                        <option value="Ensino Médio completo">Ensino Médio completo</option>
                        <option value="Ensino Superior incompleto">Ensino Superior incompleto</option>
                        <option value="Ensino Superior completo">Ensino Superior completo</option>
                        <option value="Pós-graduação incompleta">Pós-graduação incompleta</option>
                        <option value="Pós-graduação completa">Pós-graduação completa</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    Salvar Perfil Único
                  </button>
                </form>
              ) : (
                <div className="space-y-2 mt-2 max-h-[420px] overflow-y-auto pr-1">
                  {profiles.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <UserPlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Nenhum perfil cadastrado.</p>
                      <button
                        onClick={() => setIsCreatingProfile(true)}
                        className="mt-3 text-[10px] text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider"
                      >
                        Criar Perfil de Teste
                      </button>
                    </div>
                  ) : (
                    profiles.map(p => {
                      const isSelected = selectedProfileId === p.id;
                      const profileResps = responses.filter(r => r.profileId === p.id);
                      
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedProfileId(p.id)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                            isSelected
                              ? 'bg-blue-50/20 border-blue-400/80 shadow-xs ring-1 ring-blue-500/10'
                              : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-start w-full gap-2">
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-800 text-xs truncate">{p.name}</h4>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">{p.role} &bull; {p.department}</p>
                            </div>
                            <span className="shrink-0 text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-sm">
                              {profileResps.length}/{questionnairesData.length}
                            </span>
                          </div>

                          <div className="flex gap-1.5 items-center mt-1">
                            {questionnairesData.map(q => {
                              const done = profileResps.some(r => r.questionnaireId === q.id);
                              return (
                                <div
                                  key={q.id}
                                  title={`${q.acronym}: ${done ? 'Respondido' : 'Pendente'}`}
                                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold ${
                                    done
                                      ? 'bg-emerald-500 text-white'
                                      : 'border border-dashed border-slate-300 bg-white text-slate-400'
                                  }`}
                                >
                                  {q.acronym[0]}
                                </div>
                              );
                            })}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8">
            {activeProfile ? (
              activeViewResponseId && selectedResponse && activeQuestionnaire ? (
                <div className="space-y-6 animate-fade-in">
                  <button
                    onClick={() => setActiveViewResponseId(null)}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer font-bold mb-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o Dossiê de {activeProfile.name}
                  </button>

                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-blue-600 text-white font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-sm">
                            {activeQuestionnaire.acronym}
                          </span>
                          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {selectedResponse.respondent.date}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">ID: {selectedResponse.id}</span>
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight mt-2">
                          Laudo Técnico Individual &bull; {selectedResponse.respondent.name}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          {selectedResponse.respondent.role} &bull; {selectedResponse.respondent.department}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Escore Global</span>
                        <div className="flex items-baseline gap-1 mt-2">
                          <span className="text-3xl font-black text-blue-600 font-mono">
                            {selectedResponse.calculatedScores.globalScore}
                          </span>
                          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                            {selectedResponse.questionnaireId === 'jds' ? 'MPS' : (selectedResponse.questionnaireId === 'ergo_anamnese' ? '/10' : '%')}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Interpretação Clínica</span>
                        {(() => {
                          const interp = getInterpretation(selectedResponse.questionnaireId, selectedResponse.calculatedScores.globalScore);
                          return (
                            <div className={`mt-2 inline-flex items-center justify-center border font-bold text-xs px-3 py-1.5 rounded-lg text-center ${interp.color}`}>
                              {interp.text}
                            </div>
                          );
                        })()}
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Origem do Método</span>
                        <span className="text-[11px] text-slate-600 font-bold block mt-2 whitespace-pre-line leading-relaxed">
                          {activeQuestionnaire.origin}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[380px]">
                      <div className="border-b border-slate-100 pb-3 mb-4">
                        <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                          <TrendingUp className="w-5 h-5 text-emerald-500" />
                          Gráfico Analítico Dimensional
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">Pontuações parciais obtidas em cada construto teórico.</p>
                      </div>

                      <div className="flex-1 min-h-[220px] w-full flex items-center justify-center">
                        {chartData.length > 2 ? (
                          <ResponsiveContainer width="100%" height={240}>
                            <RadarChart data={chartData}>
                              <PolarGrid stroke="#E2E8F0" />
                              <PolarAngleAxis dataKey="dimension" tick={{ fill: '#475569', fontSize: 9, fontWeight: 600 }} />
                              <PolarRadiusAxis angle={30} domain={[0, selectedResponse.questionnaireId === 'jds' ? 7 : (selectedResponse.questionnaireId === 'ergo_anamnese' ? 10 : 100)]} tick={{ fill: '#94A3B8', fontSize: 8 }} />
                              <Radar name="Pontuação" dataKey="pontuacao" stroke="#2563EB" fill="#3B82F6" fillOpacity={0.15} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#F8FAFC', fontSize: '11px', fontFamily: 'monospace' }}
                                labelStyle={{ fontWeight: 'bold', color: '#38BDF8' }}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        ) : (
                          <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={chartData}>
                              <XAxis dataKey="dimension" tick={{ fill: '#475569', fontSize: 9, fontWeight: 600 }} stroke="#CBD5E1" />
                              <YAxis domain={[0, selectedResponse.questionnaireId === 'jds' ? 7 : (selectedResponse.questionnaireId === 'ergo_anamnese' ? 10 : 100)]} stroke="#CBD5E1" tick={{ fill: '#94A3B8', fontSize: 9 }} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#F8FAFC', fontSize: '11px', fontFamily: 'monospace' }}
                                labelStyle={{ fontWeight: 'bold', color: '#38BDF8' }}
                              />
                              <Bar dataKey="pontuacao" fill="#3B82F6" radius={[6, 6, 0, 0]}>
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3B82F6' : '#10B981'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-5 space-y-6">
                      <ReportCustomizer config={reportConfig} onChange={setReportConfig} />

                      <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-5 text-xs text-blue-900/90 leading-relaxed">
                        <div className="flex items-center gap-1.5 font-bold mb-2 text-blue-900">
                          <ClipboardCheck className="w-4 h-4 text-blue-600" /> Metodologia de Cálculo (100% Determinística)
                        </div>
                        <p className="mb-2">
                          A pontuação geral e os scores dimensionais são baseados estritamente nas fórmulas cientificamente validadas de cada ferramenta exposta no dossiê:
                        </p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li><strong>NASA-TLX:</strong> Média simples dos 6 fatores de sobrecarga.</li>
                          <li><strong>COPSOQ II:</strong> Escalonamento de respostas lineares transformadas de 0 a 100%.</li>
                          <li><strong>JDS:</strong> Escore de Potencial Motivacional (MPS).</li>
                          <li><strong>TQWL-42:</strong> Escalonamento e cálculo dimensional por esferas orgânicas de QVT.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <div className="border-b border-slate-100 pb-3 mb-4">
                      <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                        <HeartHandshake className="w-5 h-5 text-rose-500" />
                        Avaliação Ocupacional &amp; Análise do Posto
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Informações ocupacionais e observações ergonômicas registradas para este questionário.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/60 space-y-3">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Empresa / Organização</span>
                          <span className="text-xs font-bold text-slate-800 block mt-1">
                            {selectedResponse.respondent.companyName || <em className="text-slate-400 font-normal">Não informada</em>}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">O que faz? (Descrição Real)</span>
                          <p className="text-xs text-slate-700 mt-1 leading-relaxed whitespace-pre-line font-medium">
                            {selectedResponse.respondent.jobDescription || <em className="text-slate-400 font-normal">Não informado</em>}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">O que foi contratado para fazer? (Atribuições Contratuais)</span>
                          <p className="text-xs text-slate-700 mt-1 leading-relaxed whitespace-pre-line font-medium">
                            {selectedResponse.respondent.hiredRoleActivities || <em className="text-slate-400 font-normal">Não informado</em>}
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/60 space-y-3">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Reclamações Específicas / Queixas</span>
                          <p className="text-xs text-slate-700 mt-1 leading-relaxed whitespace-pre-line font-medium">
                            {selectedResponse.respondent.specificComplaints || <em className="text-slate-400 font-normal font-medium text-slate-400/70">Nenhuma queixa específica registrada</em>}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Reclamações de Problemas / Sintomas Gerais</span>
                          <p className="text-xs text-slate-700 mt-1 leading-relaxed whitespace-pre-line font-medium">
                            {selectedResponse.respondent.problemComplaints || <em className="text-slate-400 font-normal font-medium text-slate-400/70">Nenhuma reclamação de problemas registrada</em>}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Postura Percebida pelo Avaliador</span>
                          <p className="text-xs text-slate-700 mt-1 leading-relaxed whitespace-pre-line font-medium">
                            {selectedResponse.respondent.observedPosture || <em className="text-slate-400 font-normal font-medium text-slate-400/70">Nenhuma observação postural registrada</em>}
                          </p>
                        </div>
                      </div>

                      <div className="md:col-span-2 bg-slate-50/55 p-4 rounded-2xl border border-slate-100/60">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Comentários e Notas Gerais do Avaliador</span>
                        <p className="text-xs text-slate-700 mt-1.5 leading-relaxed whitespace-pre-line font-medium">
                          {selectedResponse.respondent.generalComments || <em className="text-slate-400 font-normal font-medium text-slate-400/70">Nenhum comentário adicional do avaliador</em>}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <div className="border-b border-slate-100 pb-3 mb-4">
                      <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                        <Award className="w-5 h-5 text-blue-600" />
                        Análise Detalhada por Subescala
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Diagnóstico pontual sobre cada construto avaliado pelo método ocupacional.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(selectedResponse.calculatedScores.dimensionScores).map(([dimName, val]) => (
                          <div key={dimName} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative">
                            <span className="block font-extrabold text-[10px] text-slate-400 uppercase tracking-wider">{dimName}</span>
                            <strong className="block text-xl font-mono font-black text-slate-800 mt-1">
                              {val}{selectedResponse.questionnaireId === 'jds' ? '' : (selectedResponse.questionnaireId === 'ergo_anamnese' ? '/10' : '%')}
                            </strong>
                            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                              {selectedResponse.calculatedScores.metricsDescription?.[dimName] || 'Interpretação padrão baseada em amostragem populacional brasileira.'}
                            </p>
                          </div>
                        ))}
                      </div>

                      {reportConfig.showDetailsTable && (
                        <div className="mt-6 border-t border-slate-100 pt-6">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Matriz de Respostas Coletadas</h4>
                          <div className="border border-slate-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-150">
                                  <th className="p-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Questão (Cód.)</th>
                                  <th className="p-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Resposta Fornecida</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(selectedResponse.answers).map(([qKey, qVal]) => {
                                  const allQs = activeQuestionnaire.sections.flatMap(s => s.questions);
                                  const qObj = allQs.find(q => q.id === qKey);
                                  const label = qObj ? qObj.text.split(':')[0] : qKey;
                                  return (
                                    <tr key={qKey} className="border-b border-slate-100 hover:bg-slate-50/50">
                                      <td className="p-3 font-semibold text-slate-600 font-mono text-[11px]">{qKey} <span className="font-sans text-slate-400 font-normal">({label})</span></td>
                                      <td className="p-3 text-slate-800 font-medium">{qVal}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {reportConfig.showComments && (
                        <div className="mt-6 border-t border-slate-100 pt-6 space-y-3">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                            <Terminal className="w-4 h-4 text-blue-600" />
                            Console de Auditoria Científica (Sem IA)
                          </h4>
                          <div className="bg-slate-950 rounded-2xl p-4 font-mono text-[10px] text-slate-300 space-y-2 overflow-x-auto border border-slate-800">
                            <p className="text-blue-400">[INFO] {new Date(selectedResponse.createdAt).toLocaleString('pt-BR')} - Inicializando escopo matemático para {activeQuestionnaire.title} ({activeQuestionnaire.acronym})</p>
                            <p className="text-slate-500">&gt; Total de {Object.keys(selectedResponse.answers).length} variáveis computacionais de entrada processadas localmente.</p>
                            <div className="pl-4 py-1 border-l border-slate-800 my-1 text-slate-400 space-y-1">
                              {Object.entries(selectedResponse.answers).map(([qKey, qVal]) => {
                                const allQs = activeQuestionnaire.sections.flatMap(s => s.questions);
                                const qObj = allQs.find(q => q.id === qKey);
                                const label = qObj ? qObj.text.split(':')[0] : qKey;
                                return (
                                  <div key={qKey} className="truncate">
                                    <span className="font-mono text-slate-400">{qKey}:</span> {qVal} <span className="text-[9px] text-slate-600">({label})</span>
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-purple-400">[CÁLCULO] Executando algoritmos oficiais do instrumento...</p>
                            <div className="pl-4 py-1.5 border-l border-purple-900/50 my-1 text-slate-300">
                              <p className="font-bold text-emerald-400">Escore Geral / Global Resolvido: {selectedResponse.calculatedScores.globalScore}{selectedResponse.questionnaireId === 'jds' ? ' (MPS)' : (selectedResponse.questionnaireId === 'ergo_anamnese' ? '/10' : '%')}</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 font-sans text-[11px]">
                                {Object.entries(selectedResponse.calculatedScores.dimensionScores).map(([dimName, val]) => (
                                  <div key={dimName} className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                                    <span className="block font-bold text-slate-400 text-[10px]">{dimName}</span>
                                    <span className="block text-emerald-400 font-mono font-black mt-0.5">{val}{selectedResponse.questionnaireId === 'jds' ? '' : (selectedResponse.questionnaireId === 'ergo_anamnese' ? '/10' : '%')}</span>
                                    <span className="block text-[9px] text-slate-500 mt-0.5 leading-tight">{selectedResponse.calculatedScores.metricsDescription?.[dimName]}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <p className="text-emerald-400 font-bold">[SUCESSO] Processamento e persistência local concluídos de forma 100% íntegra e sem dados interpolados ou inventados.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-600/15 text-blue-600 flex items-center justify-center font-bold text-base border border-blue-100">
                          {activeProfile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase text-blue-600 tracking-wider">Perfil Único Cadastrado</span>
                          <h2 className="text-lg font-black text-slate-800 leading-tight">{activeProfile.name}</h2>
                          <p className="text-xs text-slate-400 mt-0.5">{activeProfile.role} &bull; {activeProfile.department}</p>
                        </div>
                      </div>
                      {confirmDeleteProfileId === activeProfile.id ? (
                        <div className="flex items-center gap-2 animate-fade-in">
                          <span className="text-[10px] text-red-600 font-bold">Confirmar exclusão?</span>
                          <button
                            onClick={() => {
                              onDeleteProfile(activeProfile.id);
                              setConfirmDeleteProfileId(null);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg cursor-pointer"
                          >
                            Excluir
                          </button>
                          <button
                            onClick={() => setConfirmDeleteProfileId(null)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteProfileId(activeProfile.id)}
                          className="text-[10px] text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Excluir Perfil
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 text-xs text-slate-500">
                      <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Idade</span>
                        <strong className="text-slate-700 font-bold mt-0.5 block">{activeProfile.age ? `${activeProfile.age} anos` : 'Não informada'}</strong>
                      </div>
                      <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Gênero</span>
                        <strong className="text-slate-700 font-bold mt-0.5 block">{activeProfile.gender}</strong>
                      </div>
                      <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tempo de Empresa</span>
                        <strong className="text-slate-700 font-bold mt-0.5 block">{activeProfile.tenureMonths ? `${activeProfile.tenureMonths} meses` : 'Não informado'}</strong>
                      </div>
                      <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Estado Civil</span>
                        <strong className="text-slate-700 font-bold mt-0.5 block">{activeProfile.maritalStatus}</strong>
                      </div>
                      <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 col-span-2 sm:col-span-4">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Grau de Instrução</span>
                        <strong className="text-slate-700 font-bold mt-0.5 block">{activeProfile.education}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl border bg-slate-50 border-slate-200 shadow-sm space-y-4 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                          <Download className="w-5 h-5 text-blue-600" />
                          Dossiê de Exportação Consolidado
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {activeProfileResponses.length === questionnairesData.length
                            ? `Todos os ${questionnairesData.length} questionários foram concluídos! O dossiê completo por perfil está liberado para download.`
                            : `Preencha todos os ${questionnairesData.length} métodos para liberar a exportação unificada por perfil (atualmente: ${activeProfileResponses.length} de ${questionnairesData.length} concluídos).`}
                        </p>
                      </div>

                      {activeProfileResponses.length === questionnairesData.length ? (
                        <div className="flex flex-wrap gap-2 shrink-0">
                          <button
                            onClick={() => exportProfileToPDF(activeProfile, activeProfileResponses, reportConfig, evaluator)}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" /> PDF (.pdf)
                          </button>
                          <button
                            onClick={() => exportProfileToWord(activeProfile, activeProfileResponses, reportConfig, evaluator)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" /> Word (.docx)
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-amber-50 text-amber-800 text-xs font-bold px-4 py-2.5 rounded-xl border border-amber-200 shrink-0">
                          <Lock className="w-4 h-4 text-amber-500" /> Exportação Bloqueada
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
                      <ClipboardList className="w-5 h-5 text-blue-600" />
                      Status dos Questionários Associados
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {questionnairesData.map(q => {
                        const resp = activeProfileResponses.find(r => r.questionnaireId === q.id);
                        
                        return (
                          <div
                            key={q.id}
                            className={`p-5 rounded-2xl border transition-all ${
                              resp
                                ? 'bg-emerald-50/10 border-emerald-200/80'
                                : 'bg-white border-slate-200/60 border-dashed hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-sm">
                                {q.acronym}
                              </span>
                              {resp ? (
                                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Respondido
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/50">
                                  <Clock className="w-3.5 h-3.5" /> Pendente
                                </span>
                              )}
                            </div>

                            <h4 className="font-bold text-slate-800 text-sm mt-3 leading-snug">{q.title}</h4>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{q.description}</p>

                            {resp ? (
                              <div className="mt-4 pt-3 border-t border-slate-100/60 flex items-center justify-between gap-3">
                                <div>
                                  <span className="block text-[9px] text-slate-400 uppercase font-black">Score Global</span>
                                  <strong className="text-emerald-600 font-mono font-black text-sm block">
                                    {resp.calculatedScores.globalScore}{q.id === 'jds' ? ' (MPS)' : (q.id === 'ergo_anamnese' ? '/10' : '%')}
                                  </strong>
                                </div>
                                <div className="flex gap-1.5">
                                  {confirmDeleteResponseId === resp.id ? (
                                    <div className="flex items-center gap-1.5 animate-fade-in">
                                      <button
                                        onClick={() => {
                                          onDeleteResponse(resp.id);
                                          if (activeViewResponseId === resp.id) {
                                            setActiveViewResponseId(null);
                                          }
                                          setConfirmDeleteResponseId(null);
                                        }}
                                        className="bg-red-600 hover:bg-red-700 text-white text-[9px] font-bold px-2 py-1 rounded cursor-pointer"
                                      >
                                        Sim
                                      </button>
                                      <button
                                        onClick={() => setConfirmDeleteResponseId(null)}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-bold px-2 py-1 rounded cursor-pointer"
                                      >
                                        Não
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setConfirmDeleteResponseId(resp.id)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg border border-transparent hover:border-red-100 transition-colors cursor-pointer"
                                      title="Excluir resposta"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      handleSelectResponse(resp);
                                      setActiveViewResponseId(resp.id);
                                    }}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] px-3.5 py-2 rounded-lg transition-all cursor-pointer uppercase tracking-wider"
                                  >
                                    Analisar Laudo
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-4 pt-3 border-t border-slate-100/60 flex justify-end">
                                <button
                                  onClick={() => onNewResponse(q.id, activeProfile.id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-4 py-2 rounded-lg transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Iniciar Questionário
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {clinicalOpinion && (
                    <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-slate-200 border border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                        <ClipboardCheck className="w-5 h-5 text-emerald-400" />
                        <h3 className="font-extrabold text-white text-base tracking-tight">Parecer Técnico Consolidado (Dossiê Ergonômico)</h3>
                      </div>

                      <div className="space-y-3 text-xs leading-relaxed">
                        <p className="text-slate-300 font-medium text-[11px] uppercase tracking-wider text-slate-400">Diagnóstico Agregado por Instrumentos Científicos:</p>
                        <ul className="space-y-2.5">
                          {clinicalOpinion.elements.map((el, i) => (
                            <li key={i} className="flex items-start gap-2 text-slate-200">
                              <span className="text-blue-400 mt-0.5">•</span>
                              <span>{el}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl space-y-2 mt-4">
                          <p className="font-bold text-amber-400 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" /> Recomendações e Diretrizes de Engenharia Humana:
                          </p>
                          <ul className="space-y-1.5 text-slate-300 pl-4 list-decimal">
                            {clinicalOpinion.recommendations.map((rec, i) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                        <span>✓ Emissão 100% matemática baseada nas fórmulas científicas (Sem IA)</span>
                        <span className="font-mono text-emerald-400">[Console Ativo]</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl shadow-xs">
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <h3 className="font-bold text-slate-800 text-base">Nenhum Colaborador Ativo</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  Crie ou selecione um perfil de colaborador na barra lateral esquerda para gerenciar seus questionários unificados e gerar pareceres integrados.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}