import path from "path";
import { readFileSync, writeFileSync } from "fs";
import { convertToNewDidDocument } from "./transform-did";

const [, , filename] = process.argv;

if (!filename) throw new Error(`Missing filename`);

const legacyDidDocument = JSON.parse(
  readFileSync(path.resolve(filename)).toString("utf-8")
);

const did = convertToNewDidDocument(legacyDidDocument);

console.log(did);

writeFileSync(path.resolve(filename).replace(".json", "-output.txt"), did);
