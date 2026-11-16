/**
 * Si el lateral de la app está plegado en iconos. Lo comparten el layout, que
 * lo dibuja, y la plantilla «Espacio de datos», que lo pliega al entrar para
 * dejar el ancho a la tabla (plan ui 04, §3.2).
 */
export function useSidebarCollapsed() {
  return useState('sidebar-collapsed', () => false);
}
