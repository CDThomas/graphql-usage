import fs from "fs";
import path from "path";

interface File {
  filepath: string;
  name: string;
  ext: string;
  stat: fs.Stats;
  content: string;
  base: string;
}

function readFilesSync(dir: string) {
  const files: File[] = [];

  fs.readdirSync(dir).forEach(filename => {
    // TODO: handle nested dirs
    const name = path.parse(filename).name;
    const ext = path.parse(filename).ext;
    const base = path.parse(filename).base;
    const filepath = path.resolve(dir, filename);
    const stat = fs.statSync(filepath);
    const isFile = stat.isFile();
    const content = fs.readFileSync(filepath, {
      encoding: "utf-8"
    });

    if (isFile) files.push({ filepath, name, ext, stat, content, base });
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
