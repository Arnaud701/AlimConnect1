// EUR to FCFA conversion (1 EUR = 655.957 FCFA)
const EUR_TO_FCFA = 655.957;

export const convertToFcfa = (priceInEur: number): number => {
  return Math.round(priceInEur * EUR_TO_FCFA);
};

export const formatPriceFcfa = (priceInEur: number): string => {
  const fcfa = convertToFcfa(priceInEur);
  return `${fcfa.toLocaleString('fr-FR')} FCFA`;
};
