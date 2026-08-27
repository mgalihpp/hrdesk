// Money is integer minor units. Mongo stores it as an integer, never a float.
// Float math is banned in the entire money path.

export type Cents = number & { readonly __brand: "Cents" };

export function cents(n: number): Cents {
  if (!Number.isInteger(n)) {
    throw new Error("Money must be integer cents");
  }
  return n as Cents;
}

export function moneyAdd(a: Cents, b: Cents): Cents {
  return cents(a + b);
}

export function moneySub(a: Cents, b: Cents): Cents {
  return cents(a - b);
}

export function moneyGte(a: Cents, b: Cents): boolean {
  return a >= b;
}

export function moneyToMajor(c: Cents): string {
  return (c / 100).toFixed(2);
}
