export const Permission = {
  OFFERING_READ: "offering:read",
  OFFERING_PUBLISH: "offering:publish",
  TAX_CREDIT_READ: "tax_credit:read",
  TAX_CREDIT_CERTIFY: "tax_credit:certify",
  AUDIT_READ: "audit:read",
  INVESTOR_READ: "investor:read",
  PROGRAM_ADMIN: "program:admin",
  MANAGER_WRITE: "manager:write",
  IMPACT_VERIFY: "impact:verify",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  CITIZEN_INVESTOR: [],
  COMMERCE_REVIEWER: [
    Permission.OFFERING_READ,
    Permission.TAX_CREDIT_READ,
    Permission.INVESTOR_READ,
    Permission.IMPACT_VERIFY,
  ],
  COMMERCE_PROGRAM_ADMIN: [
    Permission.OFFERING_READ,
    Permission.OFFERING_PUBLISH,
    Permission.TAX_CREDIT_READ,
    Permission.INVESTOR_READ,
    Permission.PROGRAM_ADMIN,
    Permission.AUDIT_READ,
    Permission.IMPACT_VERIFY,
  ],
  COMMERCE_TAX_ADMIN: [
    Permission.OFFERING_READ,
    Permission.TAX_CREDIT_READ,
    Permission.TAX_CREDIT_CERTIFY,
    Permission.INVESTOR_READ,
    Permission.AUDIT_READ,
  ],
  COMPLIANCE_OFFICER: [
    Permission.OFFERING_READ,
    Permission.TAX_CREDIT_READ,
    Permission.INVESTOR_READ,
    Permission.AUDIT_READ,
    Permission.IMPACT_VERIFY,
  ],
  FUND_MANAGER: [Permission.OFFERING_READ, Permission.MANAGER_WRITE],
  FUND_MANAGER_EDITOR: [Permission.OFFERING_READ, Permission.MANAGER_WRITE],
  AUDITOR_READ_ONLY: [
    Permission.OFFERING_READ,
    Permission.TAX_CREDIT_READ,
    Permission.INVESTOR_READ,
    Permission.AUDIT_READ,
  ],
  SYSTEM_ADMIN: Object.values(Permission),
};

export function permissionsForRoles(roles: string[]): Set<Permission> {
  const set = new Set<Permission>();
  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role] ?? []) {
      set.add(permission);
    }
  }
  return set;
}

export function hasPermission(roles: string[], permission: Permission): boolean {
  return permissionsForRoles(roles).has(permission);
}
