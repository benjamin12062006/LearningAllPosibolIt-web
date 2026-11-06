import { accessDestination, isCurrentRoute } from '../utils/access-destination';
import { isGuardedPath } from '../utils/access-route';

export default defineNuxtRouteMiddleware(async (to) => {
  // Flujos de acceso antiguos vuelven a /: conservar sus parámetros de callback.
  if (to.path === '/') {
    return navigateTo({ path: '/auth', query: to.query }, { replace: true });
  }
  if (import.meta.server || !isGuardedPath(to.path)) return;

  // El SSR y el primer render del cliente deben mostrar el mismo marcado de
  // carga; la sesión se restaura tras la hidratación, en el plugin de acceso.
  if (useNuxtApp().isHydrating) return;

  const { state, actions } = useAccess();
  await actions.start();
  const destination = accessDestination(state.value, to);
  if (!isCurrentRoute(destination, to)) {
    return navigateTo(destination, { replace: true });
  }
});
