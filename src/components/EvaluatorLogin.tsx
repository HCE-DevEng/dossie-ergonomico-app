import React, { useState } from 'react';
import { Evaluator } from '../types';
import { User, Award, Briefcase, Building, LogIn, ClipboardList } from 'lucide-react';

interface EvaluatorLoginProps {
  onLogin: (evaluator: Evaluator) => void;
  initialEvaluator?: Evaluator | null;
}

export default function EvaluatorLogin({ onLogin, initialEvaluator }: EvaluatorLoginProps) {
  const [name, setName] = useState(initialEvaluator?.name || '');
  const [isStudent, setIsStudent] = useState(initialEvaluator?.isStudent || false);
  const [professionalId, setProfessionalId] = useState(initialEvaluator?.professionalId || '');
  const [role, setRole] = useState(initialEvaluator?.role || '');
  const [organization, setOrganization] = useState(initialEvaluator?.organization || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do avaliador é obrigatório.');
      return;
    }
    setError('');
    onLogin({
      name: name.trim(),
      isStudent,
      professionalId: isStudent ? undefined : (professionalId.trim() || undefined),
      role: role.trim() || undefined,
      organization: organization.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-900 p-4 sm:p-6 text-slate-100">
      {/* Visual background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header/Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 mb-2">
            <ClipboardList className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Dossiê Ergonômico
          </h1>
          <p className="text-sm text-slate-400">
            Identificação do Avaliador Ocupacional
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-200">
              Configuração Inicial
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Forneça suas credenciais técnicas. Estas informações serão impressas nos cabeçalhos, pareceres e assinaturas de todos os laudos gerados.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-3 rounded-xl animate-shake">
                {error}
              </div>
            )}

            {/* Is Student Switch */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-4">
              <div>
                <span className="block text-xs font-bold text-slate-200">Perfil de Estudante</span>
                <span className="block text-[10px] text-slate-400">Marque se você for estudante acadêmico</span>
              </div>
              <label htmlFor="evaluator-is-student" className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  id="evaluator-is-student"
                  type="checkbox"
                  checked={isStudent}
                  onChange={(e) => {
                    setIsStudent(e.target.checked);
                    if (e.target.checked) {
                      setRole('Estudante');
                    } else {
                      setRole('');
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white" />
              </label>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="evaluator-name" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Nome do Avaliador *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  id="evaluator-name"
                  type="text"
                  required
                  placeholder={isStudent ? "Ex: Gabriel Silva" : "Ex: Dr. Roberto Alencar"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            {/* Role / Profession */}
            <div className="space-y-1.5">
              <label htmlFor="evaluator-role" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isStudent ? "Curso / Universidade" : "Cargo / Especialidade"}
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  id="evaluator-role"
                  type="text"
                  placeholder={isStudent ? "Ex: Fisioterapia - USP / 8º período" : "Ex: Ergonomista / Fisioterapeuta do Trabalho"}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            {/* Professional Registration (Hidden if Student) */}
            {!isStudent && (
              <div className="space-y-1.5 animate-fade-in">
                <label htmlFor="evaluator-prof-id" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Registro Profissional (e.g. CREFITO, CRM, COREN)
                </label>
                <div className="relative">
                  <Award className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-500" />
                  <input
                    id="evaluator-prof-id"
                    type="text"
                    placeholder="Ex: CREFITO 12345-F / CRM 98765"
                    value={professionalId}
                    onChange={(e) => setProfessionalId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Organization */}
            <div className="space-y-1.5">
              <label htmlFor="evaluator-org" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isStudent ? "Instituição de Ensino / Empresa" : "Empresa / Instituição"}
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  id="evaluator-org"
                  type="text"
                  placeholder={isStudent ? "Ex: Universidade de São Paulo" : "Ex: OcupaSaúde Consultoria"}
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-extrabold text-sm py-3 rounded-xl transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer mt-6"
            >
              <LogIn className="w-4 h-4" /> Acessar Sistema
            </button>
          </form>
        </div>

        {/* Informative Footer */}
        <p className="text-center text-[11px] text-slate-500">
          Sua sessão e os dados de laudos são armazenados de forma 100% privada e local no navegador.
        </p>
      </div>
    </div>
  );
}
