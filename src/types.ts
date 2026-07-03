export type QuestionnaireId = 'nasa_tlx' | 'copsoq_ii' | 'jds' | 'tqwl_42' | 'ergo_anamnese';

export interface Option {
  label: string;
  value: number;
}

export interface QuestionLabels {
  left: string;
  right: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'radio' | 'slider' | 'select' | 'text' | 'number';
  category?: string; // subscale/dimension
  options?: Option[];
  labels?: QuestionLabels;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export interface QuestionnaireSection {
  title: string;
  description?: string;
  questions: Question[];
}

export interface Questionnaire {
  id: QuestionnaireId;
  title: string;
  acronym: string;
  description: string;
  origin: string;
  sections: QuestionnaireSection[];
}

export interface RespondentMetadata {
  name: string;
  date: string;
  department: string;
  role: string;
  age?: number;
  gender?: string;
  maritalStatus?: string;
  education?: string;
  tenureMonths?: number;
  companyName?: string;
  jobDescription?: string;
  hiredRoleActivities?: string;
  specificComplaints?: string;
  problemComplaints?: string;
  observedPosture?: string;
  generalComments?: string;
  [key: string]: any;
}

export interface Profile {
  id: string;
  name: string;
  department: string;
  role: string;
  age?: number;
  gender?: string;
  maritalStatus?: string;
  education?: string;
  tenureMonths?: number;
  createdAt: string;
  companyName?: string;
  jobDescription?: string;
  hiredRoleActivities?: string;
  specificComplaints?: string;
  problemComplaints?: string;
  observedPosture?: string;
  generalComments?: string;
}

export interface QuestionnaireResponse {
  id: string;
  questionnaireId: QuestionnaireId;
  profileId?: string; // Linked profile ID
  respondent: RespondentMetadata;
  answers: Record<string, number | string>;
  createdAt: string;
  calculatedScores: {
    globalScore: number;
    dimensionScores: Record<string, number>;
    metricsDescription?: Record<string, string>;
  };
}

export interface Evaluator {
  name: string;
  professionalId?: string; // Registro Profissional (e.g. CREFITO, CRM)
  organization?: string; // Empresa / Consultoria
  role?: string; // Cargo (e.g. Ergonomista, Fisioterapeuta)
  isStudent?: boolean; // Se é estudante
}

export interface ReportConfig {
  themeColor: string; // Hex color for highlights
  showCharts: boolean;
  showComments: boolean;
  showDetailsTable: boolean;
  title: string;
  subtitle: string;
}
