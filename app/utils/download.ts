/**
 * Guarda en el equipo un archivo ya descargado con el token. Se crea un enlace
 * temporal a la memoria del navegador y se libera después de usarlo.
 */
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  // Dar tiempo al navegador a empezar la descarga antes de liberar la memoria.
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
