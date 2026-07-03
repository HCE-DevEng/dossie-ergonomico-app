import React, { useState } from 'react';
import { Questionnaire, QuestionnaireResponse, RespondentMetadata, Profile } from '../types';
import { calculateScores } from '../data/questionnaires';
import { ChevronRight, ChevronLeft, Save, AlertCircle, Calendar, User, Briefcase, Landmark } from 'lucide-react';

interface QuestionnaireFormProps {
  questionnaire: Questionnaire;
  onSave: (response: QuestionnaireResponse) => void;
  onCancel: () => void;
  prefilledProfile?: Profile;
}

export default function QuestionnaireForm({ questionnaire, onSave, onCancel, prefilledProfile }: QuestionnaireFormProps) {
  // Step 0: Respondent metadata
  // Step 1+: Questionnaire Sections
  const [currentStep, setCurrentStep] = useState(prefilledProfile ? 1 : 0);
  const [metadata, setMetadata] = useState<Partial<RespondentMetadata>>({
    name: prefilledProfile?.name || '',
    date: new Date().toLocaleDateString('pt-BR'),
    department: prefilledProfile?.department || '',
    role: prefilledProfile?.role || '',
    age: prefilledProfile?.age,
    gender: prefilledProfile?.gender || 'Masculino',
    maritalStatus: prefilledProfile?.maritalStatus || 'Solteiro(a)',
    education: prefilledProfile?.education || 'Ensino Superior completo',
    tenureMonths: prefilledProfile?.tenureMonths,
    companyName: prefilledProfile?.companyName || '',
    jobDescription: prefilledProfile?.jobDescription || '',
    hiredRoleActivities: prefilledProfile?.hiredRoleActivities || '',
    specificComplaints: prefilledProfile?.specificComplaints || '',
    problemComplaints: prefilledProfile?.problemComplaints || '',
    observedPosture: prefilledProfile?.observedPosture || '',
    generalComments: prefilledProfile?.generalComments || '',
  });

  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalSteps = questionnaire.sections.length + 1; // +1 for metadata step

  const handleMetadataChange = (field: keyof RespondentMetadata, value: any) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
  };

  const handleAnswerChange = (questionId: string, value: number | string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const validateStep = (): boolean => {
    setErrorMsg(null);

    if (currentStep === 0) {
      // Validate metadata
      if (!metadata.name?.trim()) {
        setErrorMsg('Por favor, digite o nome do colaborador.');
        return false;
      }
      if (!metadata.department?.trim()) {
        setErrorMsg('Por favor, especifique o setor ou departamento.');
        return false;
      }
      if (!metadata.role?.trim()) {
        setErrorMsg('Por favor, especifique o cargo.');
        return false;
      }
      return true;
    }

    // Validate current section answers
    const currentSection = questionnaire.sections[currentStep - 1];
    const missingAnswers = currentSection.questions.filter(q => {
      const val = answers[q.id];
      return val === undefined || val === null || (typeof val === 'string' && val.trim() === '');
    });
    
    if (missingAnswers.length > 0) {
      setErrorMsg(`Por favor, responda todas as questões desta seção para continuar. Faltam ${missingAnswers.length} perguntas.`);
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    setCurrentStep(prev => Math.max(prefilledProfile ? 1 : 0, prev - 1));
  };

  const handleSubmit = () => {
    if (!validateStep()) return;

    // Compile response
    const scores = calculateScores(questionnaire.id, answers);
    
    const response: QuestionnaireResponse = {
      id: `resp_${Date.now()}`,
      questionnaireId: questionnaire.id,
      profileId: prefilledProfile?.id,
      respondent: {
        name: metadata.name || 'Colaborador Anônimo',
        date: metadata.date || new Date().toLocaleDateString('pt-BR'),
        department: metadata.department || 'Geral',
        role: metadata.role || 'Geral',
        age: metadata.age,
        gender: metadata.gender,
        maritalStatus: metadata.maritalStatus,
        education: metadata.education,
        tenureMonths: metadata.tenureMonths,
        companyName: metadata.companyName,
        jobDescription: metadata.jobDescription,
        hiredRoleActivities: metadata.hiredRoleActivities,
        specificComplaints: metadata.specificComplaints,
        problemComplaints: metadata.problemComplaints,
        observedPosture: metadata.observedPosture,
        generalComments: metadata.generalComments,
      },
      answers,
      createdAt: new Date().toISOString(),
      calculatedScores: scores
    };

    onSave(response);
  };

  // Render step progress indicator
 const renderProgress = () => {
  // Calcula quantas etapas já foram completadas
  const etapasCompletas = currentStep;
  const totalEtapas = totalSteps - 1;
  const progresso = totalEtapas > 0 ? (etapasCompletas / totalEtapas) * 100 : 0;
  
  // Ajusta o texto para mostrar corretamente
  const etapaAtual = currentStep + 1;
  const totalExibido = totalSteps;
  
  // Se começou com perfil (pulou a etapa 0), ajusta a exibição
  const exibeEtapa = prefilledProfile ? etapaAtual - 1 : etapaAtual;
  const exibeTotal = prefilledProfile ? totalExibido - 1 : totalExibido;
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Progresso de Avaliação
        </span>
        <span className="text-sm font-bold text-blue-600">
          Etapa {exibeEtapa} de {exibeTotal}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progresso}%` }}
        />
      </div>
    </div>
  );
};

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-4xl mx-auto shadow-sm" id="questionnaire-form-container">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div>
          <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-sm uppercase tracking-wider">
            {questionnaire.acronym}
          </span>
          <h2 className="text-xl font-bold text-slate-800 mt-1">{questionnaire.title}</h2>
        </div>
        <button
          onClick={onCancel}
          className="text-xs text-slate-500 hover:text-slate-800 transition-colors bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg cursor-pointer font-bold"
        >
          Voltar ao Início
        </button>
      </div>

      {renderProgress()}

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-800 animate-pulse" id="step-validation-error">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-red-900">Ação requerida</h4>
            <p className="text-xs text-red-700/95 mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* STEP 0: RESPONDENT DEMOGRAPHIC INFORMATION */}
      {currentStep === 0 && (
        <div className="space-y-6" id="metadata-step-view">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-base">Dados Identificadores do Colaborador</h3>
            <p className="text-xs text-slate-500 mt-0.5">Preencha as informações básicas do funcionário e posto avaliado antes de iniciar o questionário.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5" htmlFor="resp-name">
                Nome do Colaborador *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                <input
                  id="resp-name"
                  type="text"
                  required
                  className="w-full text-sm border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden transition-all"
                  placeholder="Ex: João da Silva"
                  value={metadata.name}
                  onChange={(e) => handleMetadataChange('name', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5" htmlFor="resp-date">
                Data de Aplicação *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                <input
                  id="resp-date"
                  type="text"
                  className="w-full text-sm border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden transition-all"
                  placeholder="Ex: DD/MM/AAAA"
                  value={metadata.date}
                  onChange={(e) => handleMetadataChange('date', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5" htmlFor="resp-dept">
                Setor / Departamento *
              </label>
              <div className="relative">
                <Landmark className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                <input
                  id="resp-dept"
                  type="text"
                  required
                  className="w-full text-sm border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden transition-all"
                  placeholder="Ex: Produção, Administrativo, TI"
                  value={metadata.department}
                  onChange={(e) => handleMetadataChange('department', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5" htmlFor="resp-role">
                Cargo / Posto Avaliado *
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                <input
                  id="resp-role"
                  type="text"
                  required
                  className="w-full text-sm border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden transition-all"
                  placeholder="Ex: Operador de Máquina, Analista de Sistemas"
                  value={metadata.role}
                  onChange={(e) => handleMetadataChange('role', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h4 className="font-bold text-slate-700 text-xs mb-3 uppercase tracking-wider">Dados Demográficos Opcionais (Recomendados)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1" htmlFor="resp-age">Idade (anos)</label>
                <input
                  id="resp-age"
                  type="number"
                  min="16"
                  max="90"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden transition-all"
                  placeholder="Ex: 34"
                  value={metadata.age || ''}
                  onChange={(e) => handleMetadataChange('age', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1" htmlFor="resp-gender">Gênero</label>
                <select
                  id="resp-gender"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden transition-all cursor-pointer"
                  value={metadata.gender}
                  onChange={(e) => handleMetadataChange('gender', e.target.value)}
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro / Prefere não responder</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1" htmlFor="resp-tenure">Tempo de Empresa (meses)</label>
                <input
                  id="resp-tenure"
                  type="number"
                  min="0"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden transition-all"
                  placeholder="Ex: 48"
                  value={metadata.tenureMonths || ''}
                  onChange={(e) => handleMetadataChange('tenureMonths', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1" htmlFor="resp-marital">Estado Civil</label>
                <select
                  id="resp-marital"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden transition-all cursor-pointer"
                  value={metadata.maritalStatus}
                  onChange={(e) => handleMetadataChange('maritalStatus', e.target.value)}
                >
                  <option value="Solteiro(a)">Solteiro(a)</option>
                  <option value="Casado(a) / União estável">Casado(a) / União estável</option>
                  <option value="Divorciado(a) / Separado(a)">Divorciado(a) / Separado(a)</option>
                  <option value="Viúvo(a)">Viúvo(a)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1" htmlFor="resp-education">Grau de Instrução</label>
                <select
                  id="resp-education"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden transition-all cursor-pointer"
                  value={metadata.education}
                  onChange={(e) => handleMetadataChange('education', e.target.value)}
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
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h4 className="font-bold text-slate-700 text-xs mb-3 uppercase tracking-wider">Avaliação Ocupacional &amp; Observações Ergonômicas (Opcional)</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1" htmlFor="resp-companyName">Empresa / Organização</label>
                <input
                  id="resp-companyName"
                  type="text"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden transition-all"
                  placeholder="Nome da empresa do colaborador"
                  value={metadata.companyName || ''}
                  onChange={(e) => handleMetadataChange('companyName', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1" htmlFor="resp-jobDescription">O que você faz? (Descrição Real das Atividades)</label>
                  <textarea
                    id="resp-jobDescription"
                    rows={3}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden transition-all resize-none"
                    placeholder="Descrição livre das tarefas reais do dia a dia..."
                    value={metadata.jobDescription || ''}
                    onChange={(e) => handleMetadataChange('jobDescription', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1" htmlFor="resp-hiredRoleActivities">O que foi contratado para fazer? (Atribuições Contratuais)</label>
                  <textarea
                    id="resp-hiredRoleActivities"
                    rows={3}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden transition-all resize-none"
                    placeholder="O que está estabelecido em contrato / descrição oficial do cargo..."
                    value={metadata.hiredRoleActivities || ''}
                    onChange={(e) => handleMetadataChange('hiredRoleActivities', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1" htmlFor="resp-specificComplaints">Reclamações Específicas / Queixas</label>
                  <textarea
                    id="resp-specificComplaints"
                    rows={3}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden transition-all resize-none"
                    placeholder="Dores recorrentes, desconfortos por posto, etc..."
                    value={metadata.specificComplaints || ''}
                    onChange={(e) => handleMetadataChange('specificComplaints', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1" htmlFor="resp-problemComplaints">Reclamações de Problemas / Sintomas Gerais</label>
                  <textarea
                    id="resp-problemComplaints"
                    rows={3}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden transition-all resize-none"
                    placeholder="Problemas de estresse, sono, cansaço mental, cobranças, etc..."
                    value={metadata.problemComplaints || ''}
                    onChange={(e) => handleMetadataChange('problemComplaints', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1" htmlFor="resp-observedPosture">Postura Percebida pelo Avaliador</label>
                  <textarea
                    id="resp-observedPosture"
                    rows={3}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden transition-all resize-none"
                    placeholder="Análise postural visual (cifose, rotações de tronco, apoio de punho, etc)..."
                    value={metadata.observedPosture || ''}
                    onChange={(e) => handleMetadataChange('observedPosture', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1" htmlFor="resp-generalComments">Comentários e Notas Gerais do Avaliador</label>
                  <textarea
                    id="resp-generalComments"
                    rows={3}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden transition-all resize-none"
                    placeholder="Quaisquer observações clínicas adicionais do ergonomista..."
                    value={metadata.generalComments || ''}
                    onChange={(e) => handleMetadataChange('generalComments', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEPS 1+: QUESTIONNAIRE SECTIONS */}
      {currentStep > 0 && (
        <div className="space-y-6">
          {(() => {
            const section = questionnaire.sections[currentStep - 1];
            return (
              <div className="space-y-6" id={`form-section-${currentStep}`}>
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-lg">{section.title}</h3>
                  {section.description && (
                    <p className="text-xs text-slate-400 mt-1 whitespace-pre-line leading-relaxed">{section.description}</p>
                  )}
                </div>

                <div className="space-y-8">
                  {section.questions.map((q, idx) => {
                    const currentVal = answers[q.id];

                    return (
                      <div
                        key={q.id}
                        className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 hover:border-slate-300 hover:bg-slate-50/80 transition-all"
                        id={`q-card-${q.id}`}
                      >
                        <div className="flex items-start gap-2.5 mb-4">
                          <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-sm select-none shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-semibold text-slate-800 leading-relaxed">
                            {q.text}
                          </span>
                        </div>

                        {/* RENDER DYNAMIC COMPONENT BASED ON QUESTION TYPE */}
                        {q.type === 'slider' && q.min !== undefined && q.max !== undefined && (
                          <div className="px-2 py-2">
                            {/* NASA-TLX 20 clickable intervals scale simulation */}
                            <div className="flex grid grid-cols-20 border border-slate-200 rounded-lg overflow-hidden h-10 select-none">
                              {Array.from({ length: 20 }, (_, idx) => {
                                const val = (idx + 1) * 5; // 5 to 100
                                const isSelected = currentVal === val;
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleAnswerChange(q.id, val)}
                                    className={`h-full border-r border-slate-100 last:border-r-0 text-[10px] font-bold flex items-center justify-center cursor-pointer transition-colors ${
                                      isSelected
                                        ? 'bg-blue-600 text-white border-blue-600 font-extrabold scale-102 shadow-xs'
                                        : 'bg-white hover:bg-slate-100 text-slate-400'
                                    }`}
                                  >
                                    {/* display simple tick marker inside scale */}
                                    {isSelected ? '✓' : ''}
                                  </button>
                                );
                              })}
                            </div>
                            
                            {/* Left and Right scale indicators */}
                            {q.labels && (
                              <div className="flex items-center justify-between mt-2.5 text-xs text-slate-500 font-medium px-1">
                                <span className="text-left font-semibold text-blue-700/80">{q.labels.left}</span>
                                {currentVal !== undefined && (
                                  <span className="bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">
                                    Valor Selecionado: {currentVal}
                                  </span>
                                )}
                                <span className="text-right font-semibold text-red-700/80">{q.labels.right}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {q.type === 'radio' && q.options && (
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-3 mt-2">
                            {q.options.map((opt) => {
                              const isChecked = currentVal === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => handleAnswerChange(q.id, opt.value)}
                                  className={`px-3 py-3 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                                    isChecked
                                      ? 'bg-blue-50/50 border-blue-500 text-blue-900 shadow-xs ring-1 ring-blue-500/20'
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50/60 hover:border-slate-300'
                                  }`}
                                >
                                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                    isChecked ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                                  }`}>
                                    {isChecked && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </span>
                                  <span className="leading-tight">{opt.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {q.type === 'text' && (
                          <textarea
                            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden transition-all resize-none"
                            rows={3}
                            placeholder={q.placeholder || 'Digite sua resposta aqui...'}
                            value={(currentVal as string) || ''}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          />
                        )}

                        {q.type === 'number' && (
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min={q.min ?? 1}
                              max={q.max ?? 10}
                              step={q.step ?? 1}
                              className="w-32 text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden transition-all"
                              placeholder={q.placeholder || ''}
                              value={currentVal !== undefined ? String(currentVal) : ''}
                              onChange={(e) => handleAnswerChange(q.id, e.target.value ? Number(e.target.value) : '')}
                            />
                            <span className="text-xs text-slate-400 font-semibold">
                              (Digite uma nota de {q.min ?? 1} a {q.max ?? 10})
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* FOOTER ACTIONS AND STEPPERS */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-8">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className={`flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
            currentStep === 0
              ? 'text-slate-300 cursor-not-allowed bg-transparent'
              : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ChevronLeft className="w-4 h-4" /> Anterior
        </button>

        {currentStep < totalSteps - 1 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            Próximo <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" /> Finalizar e Calcular
          </button>
        )}
      </div>
    </div>
  );
}
