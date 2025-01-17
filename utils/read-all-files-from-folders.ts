import fs from "fs";
import path from "path";

export function* readAllFiles(dir: string): Generator<string> {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    if (file.isDirectory()) {
      yield* readAllFiles(path.join(dir, file.name));
    } else {
      yield path.join(dir, file.name);
    }
  }
}

// usage:
// for (const file of readAllFiles('path/to/folder')) {
//     console.log(file);
//}
