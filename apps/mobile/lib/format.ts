export function usd(value?: string) {
  const whole = (value ?? "0").split(".")[0];
  const amount = Number(whole);
  const formatted = `$${Math.abs(amount).toLocaleString("en-US")}`;
  return amount < 0 ? `-${formatted}` : formatted;
}

export function signedUsd(value?: string) {
  const whole = (value ?? "0").split(".")[0];
  const amount = Number(whole);
  const formatted = `$${Math.abs(amount).toLocaleString("en-US")}`;
  if (amount > 0) {
    return `+${formatted}`;
  }
  if (amount < 0) {
    return `-${formatted}`;
  }
  return formatted;
}

export function pct(value?: string) {
  const ratio = Number(value ?? "0");
  return `${(ratio * 100).toFixed(1)}%`;
}
