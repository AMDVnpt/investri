import { DocumentAccessLevel, PrismaClient, RoleName } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ROLE_PERMISSIONS } from "@investri/domain";

const prisma = new PrismaClient();

const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "DemoPass123!";

async function seedRoles() {
  const permissionKeys = [...new Set(Object.values(ROLE_PERMISSIONS).flat())];
  const permissions = await Promise.all(
    permissionKeys.map((key) =>
      prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key },
      }),
    ),
  );
  const permissionByKey = Object.fromEntries(permissions.map((p) => [p.key, p]));

  for (const name of Object.values(RoleName)) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    const keys = ROLE_PERMISSIONS[name] ?? [];
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (keys.length) {
      await prisma.rolePermission.createMany({
        data: keys.map((key) => ({
          roleId: role.id,
          permissionId: permissionByKey[key].id,
        })),
      });
    }
  }
}

async function seedUsers() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const roles = await prisma.role.findMany();
  const roleByName = Object.fromEntries(roles.map((r) => [r.name, r]));

  const users = [
    {
      email: "alex.smith@demo.investri.ri",
      firstName: "Alex",
      lastName: "Smith",
      roles: [RoleName.CITIZEN_INVESTOR],
    },
    {
      email: "reviewer@commerce.ri.gov",
      firstName: "Jordan",
      lastName: "Costa",
      roles: [RoleName.COMMERCE_REVIEWER, RoleName.COMMERCE_TAX_ADMIN],
    },
    {
      email: "admin@investri.local",
      firstName: "Riley",
      lastName: "Admin",
      roles: [RoleName.SYSTEM_ADMIN],
    },
    {
      email: "manager@demo.investri.ri",
      firstName: "Sam",
      lastName: "Okoro",
      roles: [RoleName.FUND_MANAGER],
    },
  ];

  for (const user of users) {
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: { passwordHash, firstName: user.firstName, lastName: user.lastName },
      create: {
        email: user.email,
        passwordHash,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
    await prisma.userRole.deleteMany({ where: { userId: record.id } });
    await prisma.userRole.createMany({
      data: user.roles.map((name) => ({
        userId: record.id,
        roleId: roleByName[name].id,
      })),
    });
  }
}

async function seedDisclosures() {
  const items = [
    {
      key: "target-return-not-guaranteed",
      name: "Target return disclaimer",
      title: "Target returns are not guaranteed",
      body: "Any target return is an illustration only. Investors can lose some or all of their principal. Past performance, where shown, does not predict future results.",
    },
    {
      key: "proposed-tax-credit",
      name: "Proposed tax-credit disclaimer",
      title: "Rhode Island tax credit is proposed",
      body: "The InvestRI Resident Investment Credit is a proposed program configuration for this demonstration. Eligibility, timing, certification, and ability to use any credit depend on enabling legislation, Commerce certification, and your circumstances. A tax credit is not investment return and is not cash back.",
    },
    {
      key: "illiquidity",
      name: "Illiquidity",
      title: "This investment is illiquid",
      body: "There is no guaranteed early redemption. You should be prepared to hold for the full target term.",
    },
    {
      key: "loss-of-principal",
      name: "Loss of principal",
      title: "You can lose money",
      body: "Private-market investments can decline in value. Do not invest money you cannot afford to leave invested or lose.",
    },
    {
      key: "residency-attestation",
      name: "Rhode Island residency attestation",
      title: "Rhode Island residency",
      body: "You attest that you are a Rhode Island resident for purposes of this demonstration offering. Non-residents are not eligible to invest in this POC.",
    },
    {
      key: "privacy",
      name: "Privacy notice",
      title: "How InvestRI uses your information",
      body: "Identity and residency checks in this demonstration are performed by mock providers. We store a provider token and, at most, the last four digits of a mock SSN — never a full Social Security number.",
    },
    {
      key: "electronic-delivery",
      name: "Electronic delivery",
      title: "Electronic delivery of documents",
      body: "You agree to receive offering documents, statements, and tax-credit notices electronically in this demonstration.",
    },
    {
      key: "conflicts",
      name: "Conflicts",
      title: "Conflicts and related-party disclosure",
      body: "This is a fictional demonstration. Seeded managers, projects, and reviewers are illustrative and do not represent live related-party transactions.",
    },
  ];

  for (const item of items) {
    const template = await prisma.disclosureTemplate.upsert({
      where: { key: item.key },
      update: { name: item.name },
      create: { key: item.key, name: item.name },
    });
    const existing = await prisma.disclosureVersion.findUnique({
      where: { templateId_version: { templateId: template.id, version: 1 } },
    });
    if (!existing) {
      await prisma.disclosureVersion.create({
        data: {
          templateId: template.id,
          version: 1,
          title: item.title,
          body: item.body,
        },
      });
    }
  }
}

async function seedAlexOnboarding() {
  const alex = await prisma.user.findUniqueOrThrow({
    where: { email: "alex.smith@demo.investri.ri" },
  });

  await prisma.identityVerification.upsert({
    where: { userId: alex.id },
    update: {
      status: "passed",
      lastErrorReason: null,
      ssnLastFour: "1234",
      legalFirstName: "Alex",
      legalLastName: "Smith",
    },
    create: {
      userId: alex.id,
      applicantId: "kyc_seed_alex",
      providerToken: "kyc_tok_seed_alex",
      ssnLastFour: "1234",
      legalFirstName: "Alex",
      legalLastName: "Smith",
      dateOfBirth: new Date("1990-05-15T12:00:00.000Z"),
      phone: "401-555-0142",
      status: "passed",
    },
  });

  await prisma.residencyVerification.upsert({
    where: { userId: alex.id },
    update: { status: "passed", lastErrorReason: null, attestedRiResident: true, state: "RI" },
    create: {
      userId: alex.id,
      street: "12 Benefit Street",
      city: "Providence",
      state: "RI",
      postalCode: "02903",
      evidenceId: "res_seed_alex",
      attestedRiResident: true,
      status: "passed",
    },
  });

  await prisma.investorProfile.upsert({
    where: { userId: alex.id },
    update: { canBearLoss: true, acceptsIlliquidity: true },
    create: {
      userId: alex.id,
      legalFirstName: "Alex",
      legalLastName: "Smith",
      dateOfBirth: new Date("1990-05-15T12:00:00.000Z"),
      phone: "401-555-0142",
      citizenship: "US",
      employmentStatus: "employed",
      occupation: "Teacher",
      experienceBand: "some",
      incomeRange: "50k-100k",
      netWorthRange: "50k-250k",
      accredited: false,
      canBearLoss: true,
      acceptsIlliquidity: true,
      trustedContactName: "Casey Smith",
      trustedContactPhone: "401-555-0199",
    },
  });

  await prisma.investorEligibility.upsert({
    where: { userId: alex.id },
    update: { suitable: true, residentQualified: true, status: "passed", reasonCode: null },
    create: {
      userId: alex.id,
      suitable: true,
      accredited: false,
      residentQualified: true,
      status: "passed",
    },
  });

  const templates = await prisma.disclosureTemplate.findMany({
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });
  for (const template of templates) {
    const version = template.versions[0];
    if (!version) {
      continue;
    }
    await prisma.investorAcknowledgement.upsert({
      where: {
        userId_disclosureVersionId_scopeKey: {
          userId: alex.id,
          disclosureVersionId: version.id,
          scopeKey: "global",
        },
      },
      update: {},
      create: {
        userId: alex.id,
        disclosureVersionId: version.id,
        scopeKey: "global",
      },
    });
  }
}

async function seedMarketplace() {
  const program = await prisma.taxCreditProgram.upsert({
    where: { id: "00000000-0000-4000-8000-000000000001" },
    update: { totalProgramCap: "50000000.0000", annualProgramCap: "12500000.0000" },
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      name: "InvestRI Resident Investment Credit",
      authorityCitation: "Proposed — subject to enabling legislation",
      status: "PROPOSED",
      creditRate: "0.200000",
      vestingMethod: "ANNUAL_EQUAL",
      carryforwardYears: 5,
      refundable: false,
      transferable: false,
      residencyRequired: true,
      minimumHoldingPeriodMonths: 48,
      recaptureEnabled: true,
      totalProgramCap: "50000000.0000",
      annualProgramCap: "12500000.0000",
      disclaimerKey: "proposed-tax-credit",
    },
  });

  await prisma.taxCreditSchedule.deleteMany({ where: { programId: program.id } });
  await prisma.taxCreditSchedule.createMany({
    data: [0, 1, 2, 3].map((yearIndex) => ({
      programId: program.id,
      yearIndex,
      rate: "0.050000",
    })),
  });

  const manager = await prisma.fundManager.upsert({
    where: { id: "00000000-0000-4000-8000-000000000010" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000010",
      name: "Narragansett Partners",
      shortName: "Narragansett",
      description:
        "An illustrative Rhode Island private-markets manager created for this demonstration. Fictional organization.",
    },
  });

  const offering = await prisma.offering.upsert({
    where: { slug: "investri-growth-fund-i" },
    update: {
      heroImageUrl: "/assets/photos/growth-fund-hero.jpg",
      heroImageAlt:
        "Providence River looking toward downtown mills and the Superman Building",
      galleryJson: [
        {
          url: "/assets/photos/welcome-waterfront.jpg",
          alt: "Mohegan Bluffs coastline on Block Island, Rhode Island",
          credit: "John Angel — Unsplash License",
        },
        {
          url: "/assets/photos/newport-ocean-tech.jpg",
          alt: "Newport harbor cottage, rocky shore, and the Claiborne Pell Bridge",
          credit: "Larry Pozza — Unsplash License",
        },
        {
          url: "/assets/photos/pawtucket-housing.jpg",
          alt: "Brick mill and chimney typical of the Blackstone Valley",
          credit: "Mark Hamilton — Unsplash License",
        },
      ],
    },
    create: {
      slug: "investri-growth-fund-i",
      name: "InvestRI Growth Fund I",
      shortName: "Growth Fund I",
      managerId: manager.id,
      framework: "DEMO",
      governingRegulator: "Demonstration only — no exemption selected",
      status: "LIVE",
      category: "Rhode Island Growth",
      description:
        "An illustrative, diversified private-markets fund designed to put resident capital to work across Rhode Island housing, small business, historic reuse, manufacturing, innovation, and resiliency.",
      thesis:
        "Rhode Island’s next decade will be built in its neighborhoods, mills, harbors, and Main Streets. Growth Fund I is a demonstration of how everyday residents could own a stake in professionally managed local investments — with investment economics kept separate from any proposed state tax incentive.",
      heroImageUrl: "/assets/photos/growth-fund-hero.jpg",
      heroImageAlt:
        "Providence River looking toward downtown mills and the Superman Building",
      galleryJson: [
        {
          url: "/assets/photos/welcome-waterfront.jpg",
          alt: "Mohegan Bluffs coastline on Block Island, Rhode Island",
          credit: "John Angel — Unsplash License",
        },
        {
          url: "/assets/photos/newport-ocean-tech.jpg",
          alt: "Newport harbor cottage, rocky shore, and the Claiborne Pell Bridge",
          credit: "Larry Pozza — Unsplash License",
        },
        {
          url: "/assets/photos/pawtucket-housing.jpg",
          alt: "Brick mill and chimney typical of the Blackstone Valley",
          credit: "Mark Hamilton — Unsplash License",
        },
      ],
      minInvestment: "100.0000",
      targetRaise: "25000000.0000",
      raisedAmount: "7425000.0000",
      targetReturnLow: "0.070000",
      targetReturnHigh: "0.100000",
      targetTermMonths: 60,
      liquidityDescription:
        "Long-term investment. No guaranteed early redemption.",
      distributionFrequency: "Annual",
      riskLevel: "Moderate-High",
      residentOnly: true,
      taxCreditProgramId: program.id,
      taxFormType: "Illustrative K-1 / state certificate",
      openAt: new Date("2026-01-15T00:00:00.000Z"),
      closeAt: new Date("2026-12-31T00:00:00.000Z"),
      publishedAt: new Date("2026-01-15T00:00:00.000Z"),
      isIllustrative: true,
    },
  });

  await prisma.offeringTerm.deleteMany({ where: { offeringId: offering.id } });
  await prisma.offeringTerm.createMany({
    data: [
      { label: "Minimum", value: "$100", sortOrder: 0 },
      { label: "Target term", value: "5 years", sortOrder: 1 },
      { label: "Target return", value: "7%–10% annually, not guaranteed", sortOrder: 2 },
      { label: "Distributions", value: "Annual", sortOrder: 3 },
      { label: "Liquidity", value: "Illiquid", sortOrder: 4 },
      { label: "Residency", value: "Rhode Island residents", sortOrder: 5 },
    ].map((row) => ({ ...row, offeringId: offering.id })),
  });

  await prisma.offeringFee.deleteMany({ where: { offeringId: offering.id } });
  await prisma.offeringFee.createMany({
    data: [
      {
        name: "Management fee",
        description: "Annual fee on committed capital. Illustrative only.",
        amountLabel: "1.50% / year",
        sortOrder: 0,
      },
      {
        name: "Placement / servicing",
        description: "Paid to a future regulated intermediary if one is selected.",
        amountLabel: "0.50% at subscription",
        sortOrder: 1,
      },
    ].map((row) => ({ ...row, offeringId: offering.id })),
  });

  await prisma.offeringRisk.deleteMany({ where: { offeringId: offering.id } });
  await prisma.offeringRisk.createMany({
    data: [
      {
        title: "Loss of principal",
        summary: "You can lose some or all of the money you invest.",
        body: "Underlying holdings are illiquid private assets. Values can decline. This is a risk you should read before anything else.",
        isSummary: true,
        sortOrder: 0,
      },
      {
        title: "Illiquidity",
        summary: "No guaranteed early redemption.",
        body: "You should assume your capital is committed for the full target term.",
        isSummary: true,
        sortOrder: 1,
      },
      {
        title: "Target returns are not promises",
        summary: "7%–10% is an illustration, not a guarantee.",
        body: "Market conditions, credit losses, construction delays, and valuation changes can produce results far below the target range.",
        isSummary: false,
        sortOrder: 2,
      },
      {
        title: "Proposed tax credit is not investment return",
        summary: "Any state incentive is separate and not enacted.",
        body: "Do not invest because of a tax credit. The credit shown in this POC is a proposed configuration pending legislation and Commerce certification.",
        isSummary: false,
        sortOrder: 3,
      },
    ].map((row) => ({ ...row, offeringId: offering.id })),
  });

  await prisma.offeringDocument.deleteMany({ where: { offeringId: offering.id } });
  await prisma.offeringDocument.createMany({
    data: [
      {
        title: "Private placement memorandum (illustrative)",
        category: "PPM",
        accessLevel: DocumentAccessLevel.AUTHENTICATED,
        url: "/assets/documents/growth-fund-ppm.txt",
        sortOrder: 0,
      },
      {
        title: "Offering memorandum (illustrative)",
        category: "Offering",
        accessLevel: DocumentAccessLevel.AUTHENTICATED,
        url: "/assets/documents/growth-fund-offering-memorandum.txt",
        sortOrder: 1,
      },
      {
        title: "Investor fact sheet",
        category: "FactSheet",
        accessLevel: DocumentAccessLevel.PUBLIC,
        url: "/assets/documents/growth-fund-fact-sheet.txt",
        sortOrder: 2,
      },
      {
        title: "Subscription agreement (illustrative)",
        category: "Subscription",
        accessLevel: DocumentAccessLevel.AUTHENTICATED,
        url: "/assets/documents/growth-fund-subscription.txt",
        sortOrder: 3,
      },
      {
        title: "Risk factors",
        category: "Risk",
        accessLevel: DocumentAccessLevel.AUTHENTICATED,
        url: "/assets/documents/growth-fund-risk-factors.txt",
        sortOrder: 4,
      },
      {
        title: "Offering disclosures",
        category: "Disclosure",
        accessLevel: DocumentAccessLevel.AUTHENTICATED,
        url: "/assets/documents/growth-fund-disclosures.txt",
        sortOrder: 5,
      },
      {
        title: "Tax disclosure",
        category: "Tax",
        accessLevel: DocumentAccessLevel.PUBLIC,
        url: "/assets/documents/growth-fund-tax-disclosure.txt",
        sortOrder: 6,
      },
      {
        title: "Due diligence overview (illustrative)",
        category: "Diligence",
        accessLevel: DocumentAccessLevel.PUBLIC,
        url: "/assets/documents/growth-fund-diligence-overview.pdf",
        sortOrder: 10,
      },
      {
        title: "Due diligence memorandum (illustrative)",
        category: "Diligence",
        accessLevel: DocumentAccessLevel.AUTHENTICATED,
        url: "/assets/documents/growth-fund-diligence-memo.pdf",
        sortOrder: 11,
      },
      {
        title: "Financial summary (illustrative)",
        category: "Diligence",
        accessLevel: DocumentAccessLevel.AUTHENTICATED,
        url: "/assets/documents/growth-fund-financials.pdf",
        sortOrder: 12,
      },
      {
        title: "Manager background (illustrative)",
        category: "Diligence",
        accessLevel: DocumentAccessLevel.AUTHENTICATED,
        url: "/assets/documents/growth-fund-manager-background.pdf",
        sortOrder: 13,
      },
    ].map((row) => ({ ...row, offeringId: offering.id })),
  });

  await prisma.offeringAllocation.deleteMany({ where: { offeringId: offering.id } });
  await prisma.offeringAllocation.createMany({
    data: [
      { key: "housing", label: "Housing / workforce housing", percentage: "0.350000", sortOrder: 0 },
      { key: "lending", label: "Small business lending", percentage: "0.250000", sortOrder: 1 },
      { key: "historic", label: "Historic redevelopment", percentage: "0.150000", sortOrder: 2 },
      { key: "manufacturing", label: "Manufacturing", percentage: "0.100000", sortOrder: 3 },
      { key: "innovation", label: "Innovation", percentage: "0.100000", sortOrder: 4 },
      { key: "resiliency", label: "Resiliency / clean energy", percentage: "0.050000", sortOrder: 5 },
    ].map((row) => ({ ...row, offeringId: offering.id })),
  });

  await prisma.offeringEligibilityRule.deleteMany({ where: { offeringId: offering.id } });
  await prisma.offeringEligibilityRule.createMany({
    data: [
      { key: "residency", value: "RI" },
      { key: "minimum", value: "100.0000" },
    ].map((row) => ({ ...row, offeringId: offering.id })),
  });

  await prisma.offeringUpdate.deleteMany({ where: { offeringId: offering.id } });
  await prisma.offeringUpdate.create({
    data: {
      offeringId: offering.id,
      title: "First-quarter deployment note",
      body: "Illustrative update: capital continues to be reserved against the four demonstration projects. This is not a live fund report.",
    },
  });

  await prisma.offeringVersion.upsert({
    where: { offeringId_version: { offeringId: offering.id, version: 1 } },
    update: {},
    create: {
      offeringId: offering.id,
      version: 1,
      snapshot: {
        name: offering.name,
        thesis: offering.thesis,
        minInvestment: "100.0000",
      },
    },
  });

  const metricDefs = [
    { key: "housing_units", label: "Housing units", unit: "units" },
    { key: "jobs", label: "Jobs created / retained", unit: "jobs" },
    { key: "businesses", label: "Small businesses financed", unit: "businesses" },
    { key: "historic_buildings", label: "Historic buildings reused", unit: "buildings" },
  ];
  for (const def of metricDefs) {
    await prisma.impactMetricDefinition.upsert({
      where: { key: def.key },
      update: def,
      create: def,
    });
  }
  const defs = Object.fromEntries(
    (await prisma.impactMetricDefinition.findMany()).map((d) => [d.key, d]),
  );

  const projects = [
    {
      slug: "main-street-housing-redevelopment",
      name: "Main Street Housing Redevelopment",
      description:
        "Fictional historic mixed-use rehabilitation on a Pawtucket Main Street block. Illustrative POC project.",
      sector: "Historic mixed-use housing",
      municipality: "Pawtucket",
      statewide: false,
      latitude: "41.878700",
      longitude: "-71.382600",
      amount: "3500000.0000",
      useOfCapital: "Acquisition, historic mill rehabilitation, and 72 mixed-income apartments.",
      capitalStack: [
        { label: "InvestRI allocation", amount: "3500000" },
        { label: "Other public incentive", amount: "1200000" },
        { label: "Private", amount: "1800000" },
      ],
      heroImageUrl: "/assets/photos/pawtucket-housing.jpg",
      beforeImageUrl: "/assets/photos/pawtucket-housing.jpg",
      afterImageUrl: "/assets/photos/providence-housing.jpg",
      imageAlt: "Brick mill and chimney typical of the Blackstone Valley",
      imageCredit: "Mark Hamilton — Unsplash License",
      metrics: [
        { key: "housing_units", value: "72.0000", status: "VERIFIED" as const },
        { key: "historic_buildings", value: "1.0000", status: "VERIFIED" as const },
      ],
      milestones: [
        { title: "Closing", body: "Illustrative acquisition closed.", occurredAt: "2025-03-01", sortOrder: 0 },
        { title: "Construction start", body: "Rehabilitation of the mill block began.", occurredAt: "2025-06-15", sortOrder: 1 },
      ],
    },
    {
      slug: "ocean-technology-expansion",
      name: "Ocean Technology Expansion",
      description:
        "Fictional expansion of an advanced manufacturing / ocean-tech facility in Newport. Illustrative POC project.",
      sector: "Advanced manufacturing / ocean tech",
      municipality: "Newport",
      statewide: false,
      latitude: "41.490100",
      longitude: "-71.312800",
      amount: "1250000.0000",
      useOfCapital: "Fit-out of a waterfront manufacturing bay and equipment.",
      capitalStack: [
        { label: "InvestRI allocation", amount: "1250000" },
        { label: "Other public incentive", amount: "400000" },
        { label: "Private", amount: "900000" },
      ],
      heroImageUrl: "/assets/photos/newport-ocean-tech.jpg",
      beforeImageUrl: "/assets/photos/newport-ocean-tech.jpg",
      afterImageUrl: "/assets/photos/welcome-waterfront.jpg",
      imageAlt: "Newport harbor cottage, rocky shore, and the Claiborne Pell Bridge",
      imageCredit: "Larry Pozza — Unsplash License",
      metrics: [{ key: "jobs", value: "35.0000", status: "VERIFIED" as const }],
      milestones: [
        { title: "Site control", body: "Lease executed for the expansion bay.", occurredAt: "2025-02-01", sortOrder: 0 },
        { title: "Hiring", body: "First production roles posted.", occurredAt: "2025-09-01", sortOrder: 1 },
      ],
    },
    {
      slug: "workforce-housing-fund",
      name: "Workforce Housing Fund",
      description:
        "Fictional multifamily workforce housing in Providence. Illustrative POC project.",
      sector: "Multifamily housing",
      municipality: "Providence",
      statewide: false,
      latitude: "41.824000",
      longitude: "-71.412800",
      amount: "4000000.0000",
      useOfCapital: "New construction of 110 workforce apartments.",
      capitalStack: [
        { label: "InvestRI allocation", amount: "4000000" },
        { label: "Other public incentive", amount: "2500000" },
        { label: "Private", amount: "5500000" },
      ],
      heroImageUrl: "/assets/photos/providence-housing.jpg",
      beforeImageUrl: "/assets/photos/providence-housing.jpg",
      afterImageUrl: "/assets/photos/growth-fund-hero.jpg",
      imageAlt: "Red-brick mill building among trees in Providence",
      imageCredit: "Yilei (Jerry) Bao — Unsplash License",
      metrics: [{ key: "housing_units", value: "110.0000", status: "VERIFIED" as const }],
      milestones: [
        { title: "Groundbreaking", body: "Site work began on the west-side parcel.", occurredAt: "2025-04-10", sortOrder: 0 },
        { title: "First leases", body: "Pre-leasing opened for the first building.", occurredAt: "2026-01-08", sortOrder: 1 },
      ],
    },
    {
      slug: "ri-small-business-credit-pool",
      name: "Rhode Island Small Business Credit Pool",
      description:
        "Fictional statewide small-business lending pool. Illustrative POC project.",
      sector: "Small-business loans",
      municipality: "Statewide",
      statewide: true,
      latitude: null,
      longitude: null,
      amount: "5000000.0000",
      useOfCapital: "Participations in term loans to Rhode Island small businesses.",
      capitalStack: [
        { label: "InvestRI allocation", amount: "5000000" },
        { label: "Other public incentive", amount: "2000000" },
        { label: "Private", amount: "3000000" },
      ],
      heroImageUrl: "/assets/photos/statewide-small-business.jpg",
      beforeImageUrl: "/assets/photos/statewide-small-business.jpg",
      afterImageUrl: "/assets/photos/welcome-waterfront.jpg",
      imageAlt: "Neighborhood storefronts on Cranston Street in Providence",
      imageCredit: "Unsplash — Cranston Street, Providence",
      metrics: [{ key: "businesses", value: "40.0000", status: "VERIFIED" as const }],
      milestones: [
        { title: "First close", body: "Credit pool began originating.", occurredAt: "2025-01-15", sortOrder: 0 },
        { title: "40th business", body: "Fortieth illustrative borrower closed.", occurredAt: "2025-11-20", sortOrder: 1 },
      ],
    },
  ];

  for (const project of projects) {
    const record = await prisma.project.upsert({
      where: { slug: project.slug },
      update: {
        heroImageUrl: project.heroImageUrl,
        beforeImageUrl: project.beforeImageUrl,
        afterImageUrl: project.afterImageUrl,
        imageAlt: project.imageAlt,
        imageCredit: project.imageCredit,
        useOfCapital: project.useOfCapital,
        capitalStackJson: project.capitalStack,
      },
      create: {
        slug: project.slug,
        name: project.name,
        description: project.description,
        sector: project.sector,
        status: "ACTIVE",
        isIllustrative: true,
        useOfCapital: project.useOfCapital,
        capitalStackJson: project.capitalStack,
        heroImageUrl: project.heroImageUrl,
        beforeImageUrl: project.beforeImageUrl,
        afterImageUrl: project.afterImageUrl,
        imageAlt: project.imageAlt,
        imageCredit: project.imageCredit,
      },
    });
    await prisma.projectLocation.deleteMany({ where: { projectId: record.id } });
    await prisma.projectLocation.create({
      data: {
        projectId: record.id,
        municipality: project.municipality,
        isStatewide: project.statewide,
        latitude: project.latitude,
        longitude: project.longitude,
      },
    });
    await prisma.projectInvestment.deleteMany({
      where: { projectId: record.id, offeringId: offering.id },
    });
    await prisma.projectInvestment.create({
      data: {
        projectId: record.id,
        offeringId: offering.id,
        amountDeployed: project.amount,
      },
    });
    await prisma.projectMilestone.deleteMany({ where: { projectId: record.id } });
    await prisma.projectMilestone.createMany({
      data: project.milestones.map((row) => ({
        projectId: record.id,
        title: row.title,
        body: row.body,
        occurredAt: new Date(`${row.occurredAt}T12:00:00.000Z`),
        sortOrder: row.sortOrder,
      })),
    });
    await prisma.impactEvidence.deleteMany({
      where: { report: { projectId: record.id } },
    });
    await prisma.impactMetricReport.deleteMany({ where: { projectId: record.id } });
    await prisma.impactMetricReport.createMany({
      data: project.metrics.map((metric) => ({
        projectId: record.id,
        definitionId: defs[metric.key].id,
        value: metric.value,
        source: "Illustrative seed data",
        period: "2026 POC",
        verificationStatus: metric.status,
      })),
    });
  }

  const newport = await prisma.project.findUniqueOrThrow({ where: { slug: "ocean-technology-expansion" } });
  await prisma.impactMetricReport.create({
    data: {
      projectId: newport.id,
      definitionId: defs.jobs.id,
      value: "4.0000",
      source: "manager@narragansett.example",
      period: "2026 addendum",
      verificationStatus: "PENDING_VERIFICATION",
    },
  });
}

async function seedAlexPortfolio() {
  const alex = await prisma.user.findUniqueOrThrow({
    where: { email: "alex.smith@demo.investri.ri" },
  });
  const offering = await prisma.offering.findUniqueOrThrow({
    where: { slug: "investri-growth-fund-i" },
  });
  const account = await prisma.investorAccount.upsert({
    where: { userId: alex.id },
    update: {},
    create: { userId: alex.id },
  });

  let position = await prisma.investmentPosition.findFirst({
    where: { investorAccountId: account.id, offeringId: offering.id, status: "OPEN" },
  });

  if (!position) {
    const order = await prisma.investmentOrder.upsert({
      where: { idempotencyKey: "seed-alex-growth-fund-i" },
      update: {},
      create: {
        investorAccountId: account.id,
        offeringId: offering.id,
        idempotencyKey: "seed-alex-growth-fund-i",
        requestedAmount: "1000.0000",
        feeAmount: "0.0000",
        status: "SETTLED",
      },
    });
    await prisma.investmentSubscription.upsert({
      where: { orderId: order.id },
      update: {},
      create: {
        orderId: order.id,
        offeringId: offering.id,
        offeringVersion: 1,
        amount: "1000.0000",
        snapshot: { name: offering.name, seeded: true },
      },
    });
    position = await prisma.investmentPosition.create({
      data: {
        investorAccountId: account.id,
        offeringId: offering.id,
        orderId: order.id,
        settledAmount: "1000.0000",
        costBasis: "1000.0000",
        currentValue: "1032.0000",
        totalDistributions: "20.0000",
        status: "OPEN",
        openedAt: new Date("2025-06-01T12:00:00.000Z"),
      },
    });
    await prisma.investmentCashFlow.create({
      data: {
        positionId: position.id,
        type: "CONTRIBUTION",
        amount: "1000.0000",
        occurredAt: new Date("2025-06-01T12:00:00.000Z"),
        idempotencyKey: "seed-alex-contribution",
      },
    });
  } else {
    await prisma.investmentPosition.update({
      where: { id: position.id },
      data: { currentValue: "1032.0000", totalDistributions: "20.0000", costBasis: "1000.0000" },
    });
  }

  await prisma.valuation.deleteMany({ where: { positionId: position.id, source: "SEED" } });
  await prisma.valuation.createMany({
    data: [
      {
        positionId: position.id,
        asOf: new Date("2025-06-01T12:00:00.000Z"),
        value: "1000.0000",
        source: "SEED",
      },
      {
        positionId: position.id,
        asOf: new Date("2026-01-15T12:00:00.000Z"),
        value: "1032.0000",
        source: "SEED",
      },
    ],
  });

  await prisma.distribution.deleteMany({ where: { positionId: position.id, periodLabel: "2025 annual" } });
  await prisma.distribution.create({
    data: {
      positionId: position.id,
      amount: "20.0000",
      paidAt: new Date("2025-12-15T12:00:00.000Z"),
      periodLabel: "2025 annual",
    },
  });
  await prisma.investmentCashFlow.upsert({
    where: {
      positionId_type_idempotencyKey: {
        positionId: position.id,
        type: "DISTRIBUTION",
        idempotencyKey: "seed-alex-distribution",
      },
    },
    update: { amount: "20.0000" },
    create: {
      positionId: position.id,
      type: "DISTRIBUTION",
      amount: "20.0000",
      occurredAt: new Date("2025-12-15T12:00:00.000Z"),
      idempotencyKey: "seed-alex-distribution",
    },
  });

  await prisma.investorDocument.deleteMany({
    where: { userId: alex.id, title: "2025 annual statement (illustrative)" },
  });
  await prisma.investorDocument.create({
    data: {
      userId: alex.id,
      positionId: position.id,
      category: "STATEMENT",
      taxYear: 2025,
      title: "2025 annual statement (illustrative)",
      url: "/assets/documents/growth-fund-tax-disclosure.txt",
      publishedAt: new Date("2026-01-20T12:00:00.000Z"),
    },
  });

  const update = await prisma.offeringUpdate.findFirst({
    where: { offeringId: offering.id },
    orderBy: { publishedAt: "desc" },
  });
  await prisma.portfolioActivity.deleteMany({
    where: { userId: alex.id, type: { in: ["contribution", "settlement", "distribution", "valuation_update", "manager_update", "document_published"] } },
  });
  await prisma.portfolioActivity.createMany({
    data: [
      {
        userId: alex.id,
        positionId: position.id,
        type: "contribution",
        title: "Contribution settled",
        body: "$1,000 contributed to InvestRI Growth Fund I.",
        occurredAt: new Date("2025-06-01T12:00:00.000Z"),
      },
      {
        userId: alex.id,
        positionId: position.id,
        type: "distribution",
        title: "Distribution received",
        body: "$20 2025 annual distribution.",
        occurredAt: new Date("2025-12-15T12:00:00.000Z"),
      },
      {
        userId: alex.id,
        positionId: position.id,
        type: "valuation_update",
        title: "Value update",
        body: "Estimated value $1,032. Illustrative manager report.",
        occurredAt: new Date("2026-01-15T12:00:00.000Z"),
      },
      {
        userId: alex.id,
        positionId: position.id,
        type: "document_published",
        title: "Statement available",
        body: "2025 annual statement (illustrative).",
        occurredAt: new Date("2026-01-20T12:00:00.000Z"),
      },
      {
        userId: alex.id,
        positionId: position.id,
        type: "manager_update",
        title: update?.title ?? "Fund update",
        body: update?.body ?? "Illustrative manager update.",
        occurredAt: update?.publishedAt ?? new Date("2026-01-15T12:00:00.000Z"),
      },
    ],
  });
}

async function seedAlexTaxCredit() {
  const alex = await prisma.user.findUniqueOrThrow({
    where: { email: "alex.smith@demo.investri.ri" },
  });
  const program = await prisma.taxCreditProgram.findUniqueOrThrow({
    where: { id: "00000000-0000-4000-8000-000000000001" },
  });
  const account = await prisma.investorAccount.findUniqueOrThrow({ where: { userId: alex.id } });
  const position = await prisma.investmentPosition.findFirstOrThrow({
    where: { investorAccountId: account.id, status: "OPEN" },
  });

  await prisma.programCap.upsert({
    where: { id: "00000000-0000-4000-8000-000000000201" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000201",
      programId: program.id,
      authorizedAmount: "50000000.0000",
    },
  });
  await prisma.programCapLedger.upsert({
    where: { idempotencyKey: "authorized-program-seed" },
    update: {},
    create: {
      programId: program.id,
      entryType: "AUTHORIZED",
      amount: "50000000.0000",
      idempotencyKey: "authorized-program-seed",
    },
  });

  const entitlement = await prisma.taxCreditEntitlement.upsert({
    where: { positionId: position.id },
    update: {
      potentialCredit: "200.0000",
      certifiedCredit: "50.0000",
      earnedCredit: "50.0000",
      status: "certified",
    },
    create: {
      userId: alex.id,
      positionId: position.id,
      programId: program.id,
      qualifiedBasis: "1000.0000",
      potentialCredit: "200.0000",
      earnedCredit: "50.0000",
      certifiedCredit: "50.0000",
      claimedCredit: "0.0000",
      status: "certified",
    },
  });
  await prisma.programCapLedger.upsert({
    where: { idempotencyKey: `reserve-${position.id}` },
    update: {},
    create: {
      programId: program.id,
      entryType: "RESERVED",
      amount: "200.0000",
      offeringId: position.offeringId,
      entitlementId: entitlement.id,
      idempotencyKey: `reserve-${position.id}`,
    },
  });
  await prisma.taxCreditVestingEvent.deleteMany({ where: { entitlementId: entitlement.id } });
  await prisma.taxCreditVestingEvent.createMany({
    data: [0, 1, 2, 3].map((yearIndex) => ({
      entitlementId: entitlement.id,
      yearIndex,
      amount: "50.0000",
      vestsOn: new Date(Date.UTC(2026 + yearIndex, 0, 15)),
      status: yearIndex === 0 ? "certified" : "scheduled",
    })),
  });

  const document = await prisma.investorDocument.upsert({
    where: { id: "00000000-0000-4000-8000-000000000301" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000301",
      userId: alex.id,
      positionId: position.id,
      category: "RI_TAX_CREDIT_CERTIFICATE",
      taxYear: 2026,
      title: "Rhode Island investment tax credit certificate RI-INV-2026-0001",
      url: `/api/v1/tax-credits/${entitlement.id}/certificate`,
    },
  });
  await prisma.taxCreditCertificate.upsert({
    where: { number: "RI-INV-2026-0001" },
    update: { entitlementId: entitlement.id, documentId: document.id },
    create: {
      entitlementId: entitlement.id,
      number: "RI-INV-2026-0001",
      taxYear: 2026,
      certifiedAmount: "50.0000",
      availableAmount: "50.0000",
      documentId: document.id,
      commerceApprovedBy: "seed",
      validationCode: "demo-seed",
      carryforwardExpiresOn: new Date("2031-12-31T00:00:00.000Z"),
    },
  });
  await prisma.programCapLedger.upsert({
    where: { idempotencyKey: "certify-alex-seed" },
    update: {},
    create: {
      programId: program.id,
      entryType: "CERTIFIED",
      amount: "50.0000",
      entitlementId: entitlement.id,
      idempotencyKey: "certify-alex-seed",
    },
  });
}

async function seedAlexNotifications() {
  const alex = await prisma.user.findUniqueOrThrow({
    where: { email: "alex.smith@demo.investri.ri" },
  });
  const entitlement = await prisma.taxCreditEntitlement.findFirst({ where: { userId: alex.id } });
  const position = await prisma.investmentPosition.findFirst({
    where: { account: { userId: alex.id } },
  });
  await prisma.notificationPreference.upsert({
    where: { userId: alex.id },
    update: {},
    create: { userId: alex.id },
  });
  const rows = [
    {
      type: "tax_credit_certified",
      title: "Tax credit certified",
      body: "Your Rhode Island investment tax credit has been certified.",
      entityType: "TaxCreditEntitlement",
      entityId: entitlement?.id ?? "seed-credit",
    },
    {
      type: "investment_settled",
      title: "Investment settled",
      body: "Your demonstration investment has settled.",
      entityType: "InvestmentPosition",
      entityId: position?.id ?? "seed-position",
    },
    {
      type: "distribution_received",
      title: "Distribution received",
      body: "A $20 illustrative distribution was posted.",
      entityType: "Distribution",
      entityId: position ? `dist-${position.id}` : "seed-dist",
    },
  ];
  for (const row of rows) {
    await prisma.notification.upsert({
      where: {
        userId_type_entityId: { userId: alex.id, type: row.type, entityId: row.entityId },
      },
      update: {},
      create: { userId: alex.id, ...row },
    });
  }
}

async function main() {
  const reset = process.argv.includes("--reset");
  if (reset) {
    await prisma.notification.deleteMany();
    await prisma.notificationPreference.deleteMany();
    await prisma.auditEvent.deleteMany();
    await prisma.taxCreditRecaptureCase.deleteMany();
    await prisma.taxCreditAdjustment.deleteMany();
    await prisma.taxCreditCertificate.deleteMany();
    await prisma.taxCreditVestingEvent.deleteMany();
    await prisma.programCapLedger.deleteMany();
    await prisma.programCap.deleteMany();
    await prisma.taxCreditEntitlement.deleteMany();
    await prisma.investorDocument.deleteMany();
    await prisma.portfolioActivity.deleteMany();
    await prisma.distribution.deleteMany();
    await prisma.valuation.deleteMany();
    await prisma.investmentCashFlow.deleteMany();
    await prisma.investmentPosition.deleteMany();
    await prisma.investmentSubscription.deleteMany();
    await prisma.investmentOrder.deleteMany();
    await prisma.investorAccount.deleteMany();
    await prisma.investorAcknowledgement.deleteMany();
    await prisma.investorEligibility.deleteMany();
    await prisma.investorProfile.deleteMany();
    await prisma.residencyVerification.deleteMany();
    await prisma.identityVerification.deleteMany();
    await prisma.impactEvidence.deleteMany();
    await prisma.projectMilestone.deleteMany();
    await prisma.impactMetricReport.deleteMany();
    await prisma.projectInvestment.deleteMany();
    await prisma.projectLocation.deleteMany();
    await prisma.project.deleteMany();
    await prisma.offeringUpdate.deleteMany();
    await prisma.offeringEligibilityRule.deleteMany();
    await prisma.offeringAllocation.deleteMany();
    await prisma.offeringDocument.deleteMany();
    await prisma.offeringRisk.deleteMany();
    await prisma.offeringFee.deleteMany();
    await prisma.offeringTerm.deleteMany();
    await prisma.offeringVersion.deleteMany();
    await prisma.offering.deleteMany();
    await prisma.taxCreditSchedule.deleteMany();
    await prisma.session.deleteMany();
  }

  await seedRoles();
  await seedUsers();
  await seedDisclosures();
  await seedAlexOnboarding();
  await seedMarketplace();
  await seedAlexPortfolio();
  await seedAlexTaxCredit();
  await seedAlexNotifications();
  console.log("InvestRI seed complete. Demo password is for local POC only.");
  if (reset) {
    console.log(`
Demo ready
- Citizen: alex.smith@demo.investri.ri / DemoPass123!
- Reviewer: reviewer@commerce.ri.gov / DemoPass123!
- Manager: manager@demo.investri.ri / DemoPass123!
- Mobile Expo, Admin http://localhost:3003, API http://localhost:3001
`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
