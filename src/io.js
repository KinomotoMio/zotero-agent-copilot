(function() {
  var OS = globalThis.OS;
  if (!OS) {
    OS = ChromeUtils.importESModule("chrome://zotero/content/osfile.mjs").OS;
  }

  function splitPathSegments(path) {
    return String(path)
      .split(/[\\/]+/)
      .filter(Boolean);
  }

  function nsIFile(path) {
    return Zotero.File.pathToFile(path);
  }

  async function pathExists(path) {
    return OS.File.exists(path);
  }

  async function ensureDir(path) {
    await Zotero.File.createDirectoryIfMissingAsync(path);
    return path;
  }

  async function removePath(path) {
    if (!(await pathExists(path))) {
      return;
    }
    let file = nsIFile(path);
    file.remove(true);
  }

  async function writeText(path, contents) {
    await ensureDir(parent(path));
    await Zotero.File.putContentsAsync(path, contents);
  }

  async function readText(path) {
    return Zotero.File.getContentsAsync(path);
  }

  async function writeJSON(path, data) {
    await writeText(path, JSON.stringify(data, null, 2));
  }

  async function readJSON(path) {
    return JSON.parse(await readText(path));
  }

  function shellQuote(value) {
    return `'${String(value).replace(/'/g, `'\"'\"'`)}'`;
  }

  async function readBytes(path) {
    return OS.File.read(path);
  }

  async function writeBytes(path, bytes) {
    await ensureDir(parent(path));
    await OS.File.writeAtomic(path, bytes, {
      tmpPath: `${path}.tmp`
    });
  }

  function expandHome(path) {
    if (!path?.startsWith("~/")) {
      return path;
    }
    let homeDir = Services.dirsvc.get("Home", Components.interfaces.nsIFile).path;
    return join(homeDir, ...splitPathSegments(path.slice(2)));
  }

  function join() {
    let parts = Array.from(arguments).filter(part => part !== undefined && part !== null && part !== "");
    if (parts.length === 0) {
      throw new Error("join() requires at least one path part");
    }
    let [first, ...rest] = parts.map(part => String(part));
    let normalizedRest = rest.flatMap(splitPathSegments);
    return PathUtils.join(first, ...normalizedRest);
  }

  function parent(path) {
    return PathUtils.parent(path);
  }

  function basename(path) {
    let value = String(path || "");
    if (!value) {
      return "";
    }
    if (!/[\\/]/.test(value)) {
      return value;
    }
    return PathUtils.filename(value);
  }

  function randomSuffix() {
    return Zotero.Utilities.randomString(8);
  }

  async function createTempDir(prefix) {
    let base = Services.dirsvc.get("TmpD", Components.interfaces.nsIFile).path;
    let dir = join(base, `${prefix}-${randomSuffix()}`);
    await ensureDir(dir);
    return dir;
  }

  async function copyRecursive(source, destination, shouldInclude) {
    let sourceFile = nsIFile(source);
    if (!sourceFile.exists()) {
      return false;
    }
    if (sourceFile.isDirectory()) {
      if (shouldInclude && !shouldInclude(source, true)) {
        return false;
      }
      await ensureDir(destination);
      let iterator = new OS.File.DirectoryIterator(source);
      try {
        await iterator.forEach(async (entry) => {
          let nextSource = entry.path;
          let nextDestination = join(destination, entry.name);
          await copyRecursive(nextSource, nextDestination, shouldInclude);
        });
      }
      finally {
        iterator.close();
      }
      return true;
    }

    if (shouldInclude && !shouldInclude(source, false)) {
      return false;
    }
    await ensureDir(parent(destination));
    let target = destination;
    if (await pathExists(target)) {
      await removePath(target);
    }
    await OS.File.copy(source, target);
    return true;
  }

  async function movePath(source, destination) {
    if (!(await pathExists(source))) {
      return false;
    }
    await ensureDir(parent(destination));
    await copyRecursive(source, destination);
    await removePath(source);
    return true;
  }

  async function listRelativeFiles(rootPath) {
    let files = [];
    if (!(await pathExists(rootPath))) {
      return files;
    }

    async function walk(currentPath) {
      let iterator = new OS.File.DirectoryIterator(currentPath);
      try {
        await iterator.forEach(async (entry) => {
          if (entry.isDir) {
            await walk(entry.path);
            return;
          }
          let relative = entry.path.slice(rootPath.length).replace(/^[\\/]+/, "").replace(/\\/g, "/");
          files.push(relative);
        });
      }
      finally {
        iterator.close();
      }
    }

    await walk(rootPath);
    return files.sort();
  }

  function runProcess(executablePath, args, blocking) {
    let process = Components.classes["@mozilla.org/process/util;1"]
      .createInstance(Components.interfaces.nsIProcess);
    process.init(nsIFile(executablePath));
    process.runw(Boolean(blocking), args, args.length);
    return process.exitValue;
  }

  function runShell(command, blocking) {
    return runProcess("/bin/sh", ["-lc", command], blocking);
  }

  function openPath(path) {
    return runProcess("/usr/bin/open", [path], true);
  }

  function revealPath(path) {
    return runProcess("/usr/bin/open", ["-R", path], true);
  }

  function fileToURL(path) {
    return Services.io.newFileURI(nsIFile(path)).spec;
  }

  ZoteroAgentCopilot.IO = {
    basename,
    copyRecursive,
    createTempDir,
    ensureDir,
    expandHome,
    fileToURL,
    join,
    listRelativeFiles,
    movePath,
    openPath,
    parent,
    pathExists,
    readBytes,
    readJSON,
    readText,
    removePath,
    revealPath,
    runProcess,
    runShell,
    shellQuote,
    splitPathSegments,
    writeBytes,
    writeJSON,
    writeText
  };
})();
