// Relative import so Vercel's Nest bundler inlines the polyfill instead of
// emitting `require("reflect-metadata")` against a missing node_modules copy.
import "./vendor/reflect-metadata.js";
import "./env";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { json, static as expressStatic, type Express } from "express";
import path from "node:path";
import { AppModule } from "./app.module";
import { loadConfig } from "@investri/config";

function allowedOrigins() {
  const config = loadConfig();
  const origins = new Set<string>([
    config.WEB_ORIGIN,
    config.MANAGER_ORIGIN,
    "http://localhost:3000",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:8081",
    "http://localhost:19006",
  ]);
  for (const host of [process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL]) {
    if (!host) continue;
    origins.add(host.startsWith("http") ? host : `https://${host}`);
  }
  return origins;
}

export async function createApp() {
  const config = loadConfig();
  const app = await NestFactory.create(AppModule, { cors: false });
  app.setGlobalPrefix("api/v1", { exclude: ["assets/{*path}", "api/docs"] });
  app.use(cookieParser());
  app.use(json());
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins().has(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  });

  const assetsDir = path.resolve(__dirname, "../../../packages/assets");
  app.use("/assets", expressStatic(assetsDir));

  const swagger = new DocumentBuilder()
    .setTitle("InvestRI API")
    .setDescription("POC API. All offering and tax-credit terms are illustrative.")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, swagger));

  await app.init();
  return app;
}

async function listen() {
  const config = loadConfig();
  const app = await createApp();
  await app.listen(config.API_PORT);
  console.log(`InvestRI API listening on ${config.API_PUBLIC_URL}`);
}

const isVercel = Boolean(process.env.VERCEL);

export default isVercel
  ? createApp().then((app) => app.getHttpAdapter().getInstance() as Express)
  : undefined;

if (!isVercel) {
  void listen();
}
