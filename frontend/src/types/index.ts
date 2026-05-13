export interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  modules: number;
  progress: number;
  completedModules: number;
  hours: number;
  students: number;
  rating: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  words: { word: string; hint: string }[];
}

export interface AgentPersona {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  tag: string;
  tagColor: string;
  elapsed: number;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  tasks: KanbanTask[];
}
