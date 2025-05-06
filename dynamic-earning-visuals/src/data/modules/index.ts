import { LearningModule } from '@/types/learn';
import { riskManagementModule } from './risk-management';

export const modules: Record<string, LearningModule> = {
  [riskManagementModule.id]: riskManagementModule,
  // Add more modules here as they are created
};

export const getModuleById = (id: string): LearningModule | undefined => {
  return modules[id];
};

export const getAllModules = (): LearningModule[] => {
  return Object.values(modules);
}; 