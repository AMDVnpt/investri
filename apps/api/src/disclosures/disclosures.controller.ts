import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { prisma } from "@investri/database";

@Controller("disclosures")
export class DisclosuresController {
  @Get()
  list() {
    return prisma.disclosureTemplate.findMany({
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
      orderBy: { name: "asc" },
    });
  }

  @Get(":key")
  async get(@Param("key") key: string) {
    const template = await prisma.disclosureTemplate.findUnique({
      where: { key },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });
    const version = template?.versions[0];
    if (!template || !version) {
      throw new NotFoundException("Disclosure not found");
    }
    return {
      key: template.key,
      name: template.name,
      version: version.version,
      title: version.title,
      body: version.body,
      publishedAt: version.publishedAt,
    };
  }
}
