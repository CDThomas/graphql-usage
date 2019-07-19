import fs from "fs";
import path from "path";
import { promisify } from "util";

interface File {
  filepath: string;
  name: string;
  ext: string;
  stat: fs.Stats;
  base: string;
}

async function readFiles(dir: string) {
  let files: File[] = [];

  const fileNames = await promisify(fs.readdir)(dir);
  const promises = fileNames.map(async filename => {
    const name = path.parse(filename).name;
    const ext = path.parse(filename).ext;
    const base = path.parse(filename).base;
    const filepath = path.resolve(dir, filename);
    const stat = await promisify(fs.stat)(filepath);
    const isDirectory = stat.isDirectory();

    if (isDirectory) {
      const nestedFiles = await readFiles(filepath);
      files = [...files, ...nestedFiles];
    } else {
      files.push({ filepath, name, ext, stat, base });
    }
  });

  await Promise.all(promises);

  files.sort((a, b) => {
    // natural sort alphanumeric strings
    // https://stackoverflow.com/a/38641281
    return a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base"
    });
  });

  return files;
}

export default readFiles;
