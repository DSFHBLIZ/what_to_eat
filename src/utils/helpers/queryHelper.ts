export const getQueryString = (values: string[]): string => {
  if (!values || values.length === 0) return '';
  return values.join(',');
}; 