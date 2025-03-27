import { zip } from "zip-a-folder";

const src = process.argv[2];
const zip_name = process.argv[3];

await zip(src, zip_name);
