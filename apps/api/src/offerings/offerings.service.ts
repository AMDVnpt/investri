import { Injectable, NotFoundException } from "@nestjs/common";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "@investri/database";
import {
  DocumentAccessLevel,
  PUBLIC_OFFERING_STATUSES,
  formatPercentRange,
  formatUsd,
  fundingRatio,
  illustrateTaxCredit,
  moneyString,
} from "@investri/domain";
import type { OfferingListQuery } from "@investri/validation";
import { withDiligenceDocuments } from "./diligence-documents";

function assetsDir() {
  const candidates = [
    path.join(__dirname, "assets"),
    path.join(__dirname, "../assets"),
    path.resolve(process.cwd(), "packages/assets"),
    path.resolve(process.cwd(), "assets"),
  ];
  return candidates.find((dir) => existsSync(dir)) ?? candidates[0];
}

function readDocumentBody(url: string) {
  const relative = url.replace(/^\/assets\//, "");
  const filePath = path.join(assetsDir(), relative);
  if (!existsSync(filePath)) {
    return {
      body: "This illustrative document is available in the demonstration pack. Content could not be loaded from disk.",
      contentType: url.endsWith(".pdf") ? "application/pdf" : "text/plain",
    };
  }
  if (url.endsWith(".pdf")) {
    return {
      body: "This diligence PDF is illustrative. Use Open to download or view the file. It is not an offering of securities.",
      contentType: "application/pdf",
    };
  }
  return { body: readFileSync(filePath, "utf8"), contentType: "text/plain" };
}

function toDocumentCard(doc: {
  id: string;
  title: string;
  category: string;
  url: string;
  accessLevel?: string;
  sortOrder?: number;
}) {
  return {
    id: doc.id,
    title: doc.title,
    category: doc.category,
    url: doc.url,
    accessLevel: doc.accessLevel ?? null,
    sortOrder: doc.sortOrder ?? 0,
  };
}

@Injectable()
export class OfferingsService {
  async list(query: OfferingListQuery) {
    const offerings = await prisma.offering.findMany({
      where: {
        isIllustrative: true,
        status: query.status ?? { in: PUBLIC_OFFERING_STATUSES },
        category: query.category,
        residentOnly: query.residentOnly,
        riskLevel: query.riskLevel,
        taxCreditProgramId: query.taxCreditEligible === true ? { not: null } : undefined,
        minInvestment: query.minInvestmentMax ? { lte: query.minInvestmentMax } : undefined,
        projectInvestments: query.municipality
          ? {
              some: {
                project: {
                  locations: {
                    some: {
                      municipality: { contains: query.municipality, mode: "insensitive" },
                    },
                  },
                },
              },
            }
          : undefined,
        allocations: query.impactCategory ? { some: { key: query.impactCategory } } : undefined,
      },
      include: {
        manager: true,
        taxCreditProgram: true,
        allocations: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { name: "asc" },
    });

    return offerings.map((offering) => this.toCard(offering));
  }

  async detail(idOrSlug: string, authenticated: boolean) {
    const offering = await prisma.offering.findFirst({
      where: {
        OR: this.idOrSlug(idOrSlug),
        status: { in: PUBLIC_OFFERING_STATUSES },
      },
      include: {
        manager: true,
        taxCreditProgram: { include: { schedules: { orderBy: { yearIndex: "asc" } } } },
        terms: { orderBy: { sortOrder: "asc" } },
        fees: { orderBy: { sortOrder: "asc" } },
        risks: { orderBy: { sortOrder: "asc" } },
        documents: { orderBy: { sortOrder: "asc" } },
        allocations: { orderBy: { sortOrder: "asc" } },
        updates: { orderBy: { publishedAt: "desc" } },
        eligibilityRules: true,
        projectInvestments: {
          include: {
            project: {
              include: {
                locations: true,
                metrics: { include: { definition: true } },
              },
            },
          },
        },
      },
    });
    if (!offering) {
      throw new NotFoundException("Offering not found");
    }
    return this.toDetail(offering, authenticated);
  }

  async documents(id: string, authenticated: boolean) {
    const offering = await this.requireOffering(id);
    return withDiligenceDocuments(offering.documents, authenticated, (level, auth) =>
      this.canRead(level as DocumentAccessLevel, auth),
    ).map(toDocumentCard);
  }

  async document(id: string, docId: string, authenticated: boolean) {
    const docs = await this.documents(id, authenticated);
    const doc = docs.find((row) => row.id === docId);
    if (!doc) {
      throw new NotFoundException("Document not found");
    }
    return { ...doc, ...readDocumentBody(doc.url) };
  }

  async risks(id: string, authenticated: boolean) {
    const offering = await this.requireOffering(id);
    return offering.risks.filter((risk) => authenticated || risk.isSummary);
  }

  async fees(id: string) {
    const offering = await this.requireOffering(id);
    return offering.fees;
  }

  async allocations(id: string) {
    const offering = await this.requireOffering(id);
    return offering.allocations.map((row) => ({
      ...row,
      percentage: moneyString(row.percentage.toString(), 6),
    }));
  }

  async projects(id: string) {
    const offering = await this.requireOffering(id);
    return offering.projectInvestments.map((link) => this.toProject(link));
  }

  async updates(id: string) {
    const offering = await this.requireOffering(id);
    return offering.updates;
  }

  private async requireOffering(id: string) {
    const offering = await prisma.offering.findFirst({
      where: {
        OR: this.idOrSlug(id),
      },
      include: {
        fees: { orderBy: { sortOrder: "asc" } },
        risks: { orderBy: { sortOrder: "asc" } },
        documents: { orderBy: { sortOrder: "asc" } },
        allocations: { orderBy: { sortOrder: "asc" } },
        updates: { orderBy: { publishedAt: "desc" } },
        projectInvestments: {
          include: {
            project: {
              include: {
                locations: true,
                metrics: { include: { definition: true } },
              },
            },
          },
        },
      },
    });
    if (!offering) {
      throw new NotFoundException("Offering not found");
    }
    return offering;
  }

  private toCard(offering: {
    id: string;
    slug: string;
    name: string;
    shortName: string;
    category: string;
    thesis: string;
    heroImageUrl: string | null;
    heroImageAlt: string | null;
    minInvestment: { toString(): string };
    targetRaise: { toString(): string };
    raisedAmount: { toString(): string };
    targetReturnLow: { toString(): string } | null;
    targetReturnHigh: { toString(): string } | null;
    targetTermMonths: number | null;
    distributionFrequency: string;
    riskLevel: string;
    residentOnly: boolean;
    closeAt: Date | null;
    status: string;
    isIllustrative: boolean;
    taxCreditProgram: { status: string; creditRate: { toString(): string } } | null;
    manager: { name: string };
  }) {
    return {
      id: offering.id,
      slug: offering.slug,
      name: offering.name,
      shortName: offering.shortName,
      category: offering.category,
      thesis: offering.thesis,
      heroImageUrl: offering.heroImageUrl,
      heroImageAlt: offering.heroImageAlt,
      managerName: offering.manager.name,
      minInvestment: moneyString(offering.minInvestment.toString()),
      minInvestmentLabel: formatUsd(offering.minInvestment.toString()),
      targetRaise: moneyString(offering.targetRaise.toString()),
      raisedAmount: moneyString(offering.raisedAmount.toString()),
      fundingRatio: fundingRatio(
        offering.raisedAmount.toString(),
        offering.targetRaise.toString(),
      ).toFixed(4),
      targetReturnLabel: formatPercentRange(
        offering.targetReturnLow?.toString() ?? null,
        offering.targetReturnHigh?.toString() ?? null,
      ),
      targetTermMonths: offering.targetTermMonths,
      distributionFrequency: offering.distributionFrequency,
      riskLevel: offering.riskLevel,
      residentOnly: offering.residentOnly,
      status: offering.status,
      isIllustrative: offering.isIllustrative,
      closeAt: offering.closeAt,
      taxCredit: offering.taxCreditProgram
        ? {
            eligible: true,
            programStatus: offering.taxCreditProgram.status,
            badge: "Proposed tax credit",
          }
        : { eligible: false },
    };
  }

  private toDetail(
    offering: Awaited<ReturnType<OfferingsService["requireOffering"]>> & {
      manager: { name: string; description: string };
      taxCreditProgram:
        | {
            id: string;
            name: string;
            status: string;
            creditRate: { toString(): string };
            disclaimerKey: string;
            vestingMethod: string;
            schedules: { yearIndex: number; rate: { toString(): string } }[];
          }
        | null;
      terms: unknown[];
      eligibilityRules: unknown[];
      description: string;
      thesis: string;
      liquidityDescription: string;
      galleryJson: unknown;
      framework: string;
    },
    authenticated: boolean,
  ) {
    const card = this.toCard({
      ...offering,
      taxCreditProgram: offering.taxCreditProgram,
    });
    const illustration = offering.taxCreditProgram
      ? {
          ...illustrateTaxCredit("1000", offering.taxCreditProgram.creditRate.toString()),
          disclaimer:
            "Illustrative: A $1,000 qualifying investment could be eligible for up to $200 of Rhode Island tax credits under the current program configuration. Eligibility, timing, certification and ability to use the credit depend on applicable law and your circumstances. This is not cash back and is not investment return.",
          programStatus: offering.taxCreditProgram.status,
          vestingMethod: offering.taxCreditProgram.vestingMethod,
          programId: offering.taxCreditProgram.id,
        }
      : null;

    return {
      ...card,
      description: offering.description,
      thesis: offering.thesis,
      liquidityDescription: offering.liquidityDescription,
      framework: offering.framework,
      gallery: offering.galleryJson,
      terms: offering.terms,
      fees: offering.fees,
      allocations: offering.allocations,
      eligibilityRules: offering.eligibilityRules,
      risks: offering.risks.filter((risk) => authenticated || risk.isSummary),
      documents: withDiligenceDocuments(offering.documents, authenticated, (level, auth) =>
        this.canRead(level as DocumentAccessLevel, auth),
      ).map(toDocumentCard),
      updates: authenticated ? offering.updates : [],
      projects: offering.projectInvestments.map((link) => this.toProject(link)),
      taxCreditIllustration: illustration,
    };
  }

  private toProject(link: {
    amountDeployed: { toString(): string };
    project: {
      id: string;
      name: string;
      slug: string;
      description: string;
      sector: string;
      status: string;
      isIllustrative: boolean;
      heroImageUrl: string | null;
      imageAlt: string | null;
      imageCredit: string | null;
      locations: { municipality: string; isStatewide: boolean }[];
      metrics: {
        value: { toString(): string };
        source: string;
        period: string;
        verificationStatus: string;
        definition: { key: string; label: string; unit: string };
      }[];
    };
  }) {
    return {
      id: link.project.id,
      name: link.project.name,
      slug: link.project.slug,
      description: link.project.description,
      sector: link.project.sector,
      status: link.project.status,
      isIllustrative: link.project.isIllustrative,
      heroImageUrl: link.project.heroImageUrl,
      imageAlt: link.project.imageAlt,
      imageCredit: link.project.imageCredit,
      municipality: link.project.locations[0]?.municipality ?? "Rhode Island",
      statewide: link.project.locations[0]?.isStatewide ?? false,
      amountDeployed: moneyString(link.amountDeployed.toString()),
      amountDeployedLabel: formatUsd(link.amountDeployed.toString()),
      metrics: link.project.metrics.map((metric) => ({
        key: metric.definition.key,
        label: metric.definition.label,
        unit: metric.definition.unit,
        value: moneyString(metric.value.toString()),
        source: metric.source,
        period: metric.period,
        verified: metric.verificationStatus === "VERIFIED",
        verificationStatus: metric.verificationStatus,
      })),
    };
  }

  private canRead(level: DocumentAccessLevel, authenticated: boolean) {
    if (level === DocumentAccessLevel.PUBLIC) {
      return true;
    }
    if (level === DocumentAccessLevel.AUTHENTICATED) {
      return authenticated;
    }
    return false;
  }

  private idOrSlug(value: string) {
    const uuid = /^[0-9a-f-]{36}$/i.test(value) ? value : null;
    return uuid ? [{ id: uuid }, { slug: value }] : [{ slug: value }];
  }
}
