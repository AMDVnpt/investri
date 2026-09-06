import { config as loadDotenv } from "dotenv";
import path from "node:path";

loadDotenv({ path: path.resolve(__dirname, "../../../.env") });
loadDotenv({ path: path.resolve(__dirname, "../.env") });
