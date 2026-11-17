import { ECreditRates } from '../modules/payment/constants';

export default function calculateCharge(amount: number): {
  charge: number;
  afterCharge: number;
} {
  if (amount <= 10000) {
    return {
      charge: amount * ECreditRates.MIN_10000,
      afterCharge: amount - amount * ECreditRates.MIN_10000,
    };
  }
  if (amount > 10000 && amount <= 100000) {
    return {
      charge: amount * ECreditRates.MIN_10001_MAX_100000,
      afterCharge: amount - amount * ECreditRates.MIN_10001_MAX_100000,
    };
  }
  if (amount > 100000 && amount <= 1000000) {
    return {
      charge: amount * ECreditRates.MIN_100001_MAX_1000000,
      afterCharge: amount - amount * ECreditRates.MIN_100001_MAX_1000000,
    };
  }
  if (amount > 1000000) {
    return {
      charge: amount * ECreditRates.MIN_1000001,
      afterCharge: amount - amount * ECreditRates.MIN_1000001,
    };
  }

  return {
    charge: 0,
    afterCharge: 0,
  };
}
