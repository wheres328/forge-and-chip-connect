export interface RepositoryConfig {
  name: string;
  owner: string;
  repo: string;
  category: 'driver' | 'program' | 'utility';
  description: string;
  tags: string[];
  filePatterns?: string[];
  website?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const categories: Category[] = [
  {
    id: 'driver',
    name: 'Drivers',
    description: 'NVIDIA, AMD, Intel drivers and more',
    icon: '⚙'
  },
  {
    id: 'program',
    name: 'Programs',
    description: 'Applications and software',
    icon: '📦'
  },
  {
    id: 'utility',
    name: 'Utilities',
    description: 'Tools and helpers',
    icon: '🔧'
  }
];

export const repositories: RepositoryConfig[] = [
  {
    name: 'NVIDIA GeForce Experience',
    owner: 'nvidia',
    repo: 'geforce-experience',
    category: 'driver',
    description: 'NVIDIA driver management utility',
    tags: ['nvidia', 'gpu', 'driver', 'graphics'],
    filePatterns: ['*.exe', '*Setup*.exe']
  },
  {
    name: 'VSCode',
    owner: 'microsoft',
    repo: 'vscode',
    category: 'program',
    description: 'Visual Studio Code Editor',
    tags: ['editor', 'code', 'ide', 'microsoft'],
    filePatterns: ['*.exe', '*win32-x64*.exe']
  },
  {
    name: '7-Zip',
    owner: 'ip7z',
    repo: '7zip',
    category: 'utility',
    description: 'File archiver with high compression ratio',
    tags: ['archive', 'compress', 'zip', 'utility'],
    filePatterns: ['*-x64.exe', '*.msi']
  },
  {
    name: 'Git for Windows',
    owner: 'git-for-windows',
    repo: 'git',
    category: 'utility',
    description: 'Distributed version control system',
    tags: ['git', 'version-control', 'scm'],
    filePatterns: ['*64-bit.exe', '*64.exe']
  },
  {
    name: 'Node.js LTS',
    owner: 'nodejs',
    repo: 'node',
    category: 'utility',
    description: 'JavaScript runtime',
    tags: ['node', 'javascript', 'runtime'],
    filePatterns: ['*x64.msi', '*x64.exe']
  },
  {
    name: 'Docker Desktop',
    owner: 'docker',
    repo: 'docker-desktop',
    category: 'program',
    description: 'Containerization platform',
    tags: ['docker', 'container', 'devops'],
    filePatterns: ['*x86_64.exe', '*amd64.exe']
  },
  {
    name: 'Python',
    owner: 'python',
    repo: 'cpython',
    category: 'utility',
    description: 'Python programming language',
    tags: ['python', 'programming', 'language'],
    filePatterns: ['*amd64.exe', '*x86_64.exe', '*64.exe']
  },
  {
    name: 'Brave Browser',
    owner: 'brave',
    repo: 'brave-browser',
    category: 'program',
    description: 'Privacy-focused web browser',
    tags: ['browser', 'chromium', 'privacy'],
    filePatterns: ['*x64.exe', '*Setup.exe']
  }
];

export function getRepositoriesByCategory(categoryId: string): RepositoryConfig[] {
  return repositories.filter(repo => repo.category === categoryId);
}

export function searchRepositories(query: string): RepositoryConfig[] {
  const lowerQuery = query.toLowerCase();
  return repositories.filter(repo =>
    repo.name.toLowerCase().includes(lowerQuery) ||
    repo.description.toLowerCase().includes(lowerQuery) ||
    repo.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

export function getRepositoryById(owner: string, repo: string): RepositoryConfig | undefined {
  return repositories.find(r => r.owner === owner && r.repo === repo);
}
