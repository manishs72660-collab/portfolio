export const PROJECT_CATEGORIES = [
  'Full Stack',
  'Frontend',
  'Backend',
  'AI',
  'Chrome Extension',
];

const PROJECT_CATEGORY_ORDER = ['full stack', 'backend', 'ai', 'frontend', 'chrome extension'];

export function sortProjectsByCategory(projects) {
  return projects
    .map((project, index) => ({ project, index }))
    .sort((a, b) => {
      const aRank = PROJECT_CATEGORY_ORDER.indexOf(a.project.category?.toLowerCase());
      const bRank = PROJECT_CATEGORY_ORDER.indexOf(b.project.category?.toLowerCase());
      return (aRank < 0 ? PROJECT_CATEGORY_ORDER.length : aRank)
        - (bRank < 0 ? PROJECT_CATEGORY_ORDER.length : bRank) || a.index - b.index;
    })
    .map(({ project }) => project);
}
