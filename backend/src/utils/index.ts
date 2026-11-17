export const generateVerificationCode = () => {
  // 6-length number
  return Math.floor(100000 + Math.random() * 900000);
};

export const omit = (obj: any, keys: string[]) => {
  return Object.keys(obj).reduce((acc, key) => {
    if (!keys.includes(key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {} as any);
};
