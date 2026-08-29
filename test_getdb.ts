import { getDb } from "./src/db/index.ts";
import dotenv from "dotenv";
dotenv.config();
console.log(getDb() ? "DB available" : "DB is null");
