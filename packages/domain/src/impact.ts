import { money, moneyString, type MoneyInput } from "./money";

export const ImpactVerificationStatus = {
  SELF_REPORTED: "SELF_REPORTED",
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
} as const;

export type ImpactVerificationStatus =
  (typeof ImpactVerificationStatus)[keyof typeof ImpactVerificationStatus];

export type ImpactReportInput = {
  key: string;
  value: MoneyInput;
  verificationStatus: ImpactVerificationStatus | string;
};

export function aggregateImpact(reports: ImpactReportInput[]) {
  const totals: Record<string, string> = {};
  let includesSelfReported = false;
  for (const report of reports) {
    if (report.verificationStatus === ImpactVerificationStatus.REJECTED) {
      continue;
    }
    if (report.verificationStatus !== ImpactVerificationStatus.VERIFIED) {
      includesSelfReported = true;
    }
    const current = money(totals[report.key] ?? "0");
    totals[report.key] = moneyString(current.add(money(report.value)));
  }
  return { totals, includesSelfReported };
}
