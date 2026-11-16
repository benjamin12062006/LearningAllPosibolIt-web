/** Ámbito común de las rutas REST de un proyecto dentro de una organización. */
export interface ProjectScope {
  organizationId: string;
  projectId: string;
}

export function scopePath({ organizationId, projectId }: ProjectScope) {
  return `/organizations/${encodeURIComponent(organizationId)}/projects/${encodeURIComponent(projectId)}`;
}
