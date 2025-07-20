import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Project, ApiResponse } from '../types';
import { api } from '../utils/api';

interface ProjectContextType {
  projects: Project[];
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  getProject: (id: string) => Promise<Project | null>;
  createProject: (name: string, requirements: string) => Promise<string | null>;
  runProject: (projectId: string, nodes?: string[]) => Promise<boolean>;
  cancelProject: (projectId: string) => Promise<boolean>;
}

const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  loading: false,
  error: null,
  fetchProjects: async () => {},
  getProject: async () => null,
  createProject: async () => null,
  runProject: async () => false,
  cancelProject: async () => false,
});

export const useProjects = () => useContext(ProjectContext);

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get<ApiResponse<{ projects: Project[] }>>('/api/projects');
      setProjects(response.data.projects);
    } catch (err) {
      setError('Failed to fetch projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getProject = async (id: string): Promise<Project | null> => {
    try {
      const response = await api.get<Project>(`/api/projects/${id}`);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch project:', err);
      return null;
    }
  };

  const createProject = async (name: string, requirements: string): Promise<string | null> => {
    try {
      const response = await api.post<ApiResponse<{ project_id: string }>>('/api/projects', {
        name,
        requirements,
      });
      
      // Update projects list
      await fetchProjects();
      
      return response.data.project_id;
    } catch (err) {
      console.error('Failed to create project:', err);
      return null;
    }
  };

  const runProject = async (projectId: string, nodes?: string[]): Promise<boolean> => {
    try {
      const payload = nodes ? { nodes } : undefined;
      await api.post(`/api/projects/${projectId}/run`, payload);
      return true;
    } catch (err) {
      console.error('Failed to run project:', err);
      return false;
    }
  };

  const cancelProject = async (projectId: string): Promise<boolean> => {
    try {
      await api.post(`/api/projects/${projectId}/cancel`);
      return true;
    } catch (err) {
      console.error('Failed to cancel project:', err);
      return false;
    }
  };

  // Load projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        loading,
        error,
        fetchProjects,
        getProject,
        createProject,
        runProject,
        cancelProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};