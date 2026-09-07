import { describe, expect, it } from "vitest";
import { DocumentAccessLevel } from "@investri/domain";
import { DEMO_DILIGENCE_DOCUMENTS, withDiligenceDocuments } from "./diligence-documents";

function canRead(level: string, authenticated: boolean) {
  if (level === DocumentAccessLevel.PUBLIC) {
    return true;
  }
  return authenticated && level === DocumentAccessLevel.AUTHENTICATED;
}

describe("diligence documents", () => {
  it("fills a complete diligence pack when an offering has none", () => {
    const docs = withDiligenceDocuments([], true, canRead);
    expect(docs).toHaveLength(DEMO_DILIGENCE_DOCUMENTS.length);
    expect(docs.some((doc) => doc.category === "PPM")).toBe(true);
    expect(docs.some((doc) => doc.category === "FactSheet")).toBe(true);
    expect(docs.some((doc) => doc.category === "Subscription")).toBe(true);
    expect(docs.filter((doc) => doc.category === "Diligence").length).toBeGreaterThan(0);
  });

  it("adds only missing categories to seeded offerings", () => {
    const docs = withDiligenceDocuments(
      [
        {
          category: "Tax",
          accessLevel: DocumentAccessLevel.PUBLIC,
          sortOrder: 3,
          url: "/assets/documents/growth-fund-tax-disclosure.txt",
        },
      ],
      true,
      canRead,
    );
    expect(docs.filter((doc) => doc.category === "Tax")).toHaveLength(1);
    expect(docs.some((doc) => doc.category === "PPM")).toBe(true);
    expect(docs.some((doc) => doc.category === "Diligence" && String(doc.url).endsWith(".pdf"))).toBe(true);
  });

  it("keeps public documents visible while hiding authenticated files", () => {
    const docs = withDiligenceDocuments([], false, canRead);
    expect(docs.every((doc) => doc.accessLevel === DocumentAccessLevel.PUBLIC)).toBe(true);
    expect(docs.some((doc) => doc.category === "FactSheet")).toBe(true);
    expect(docs.some((doc) => doc.category === "Diligence")).toBe(true);
    expect(docs.some((doc) => doc.category === "PPM")).toBe(false);
  });
});
