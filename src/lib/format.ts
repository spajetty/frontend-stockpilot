const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
export const formatPeso = (n: number) => peso.format(n);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

// "PartiallyRefunded" -> "Partially refunded"
export const spaceCamel = (s: string) => {
  const spaced = s.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};