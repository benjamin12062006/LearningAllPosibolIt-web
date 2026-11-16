export default defineNuxtPlugin(() => {
  const { t } = useAppLocale();
  return { provide: { t } };
});
