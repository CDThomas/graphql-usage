import fs from "fs";
import path from "path";

interface File {
  filepath: string;
  name: string;
  ext: string;
  stat: fs.Stats;
  base: string;
}

function readFilesSync(dir: string) {
  let files: File[] = [];

  fs.readdirSync(dir).forEach(filename => {
    const name = path.parse(filename).name;
    const ext = path.parse(filename).ext;
    const base = path.parse(filename).base;
    const filepath = path.resolve(dir, filename);
    const stat = fs.statSync(filepath);
    const isDirectory = stat.isDirectory();

    if (isDirectory) {
      const nestedFiles = readFilesSync(filepath);
      files = [...files, ...nestedFiles];
    } else {
      files.push({ filepath, name, ext, stat, base });
    }
  });

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

export default readFilesSync;
