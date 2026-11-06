// Executado somente no build, nunca no computador do destinatário.
// O proxy/CA do ambiente é respeitado pelo curl ou pelo PowerShell do Windows.
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const { execFileSync } = require("node:child_process");
const { createHash } = require("node:crypto");
const VERSION = "2.46.4";
const SHA256 =
  "0490380bf59e00c94cf6cb12bfac5152791b91bb8009aceef53c49815b45a56f";
const root = path.resolve(__dirname, "..");
const destination = path.join(root, "vendor", "spicetify");
const asset = `https://github.com/spicetify/cli/releases/download/v${VERSION}/spicetify-${VERSION}-windows-x64.zip`;
function download(url, file) {
  if (process.platform === "win32") {
    execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "$ErrorActionPreference='Stop'; Invoke-WebRequest -UseBasicParsing -Uri $env:SCP_DOWNLOAD_URL -OutFile $env:SCP_DOWNLOAD_FILE",
      ],
      {
        stdio: "inherit",
        env: { ...process.env, SCP_DOWNLOAD_URL: url, SCP_DOWNLOAD_FILE: file },
      },
    );
  } else
    execFileSync(
      "curl",
      [
        "--fail",
        "--location",
        "--retry",
        "2",
        "--max-time",
        "180",
        "--output",
        file,
        url,
      ],
      { stdio: "inherit" },
    );
}
(async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "scp-vendor-"));
  try {
    const zip = path.join(tmp, "spicetify.zip");
    download(asset, zip);
    const digest = createHash("sha256")
      .update(await fs.readFile(zip))
      .digest("hex");
    if (digest !== SHA256)
      throw Error(
        "SHA-256 do Spicetify diverge do release oficial fixado. Build interrompido.",
      );
    const extracted = path.join(tmp, "extracted");
    await fs.mkdir(extracted);
    if (process.platform === "win32")
      execFileSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-NonInteractive",
          "-Command",
          "$ErrorActionPreference='Stop'; Expand-Archive -LiteralPath $env:SCP_ZIP_FILE -DestinationPath $env:SCP_ZIP_DEST",
        ],
        {
          stdio: "inherit",
          env: { ...process.env, SCP_ZIP_FILE: zip, SCP_ZIP_DEST: extracted },
        },
      );
    else
      execFileSync("unzip", ["-q", zip, "-d", extracted], { stdio: "inherit" });
    // O ZIP verificado contém a árvore de recursos de que o CLI precisa, não só o exe.
    const binary = path.join(extracted, "spicetify.exe");
    await fs.access(binary);
    download(
      `https://raw.githubusercontent.com/spicetify/cli/v${VERSION}/LICENSE`,
      path.join(extracted, "LICENSE-Spicetify.txt"),
    );
    const sourceArchive = path.join(
      extracted,
      `SOURCE-Spicetify-v${VERSION}.tar.gz`,
    );
    download(
      `https://codeload.github.com/spicetify/cli/tar.gz/refs/tags/v${VERSION}`,
      sourceArchive,
    );
    const sourceHash = createHash("sha256")
      .update(await fs.readFile(sourceArchive))
      .digest("hex");
    if (
      sourceHash !==
      "d62b1e2316fa79a34b9283d5846b78b50f88f01b5de40052da94def8c2f97421"
    )
      throw Error("SHA-256 dos fontes Spicetify diverge. Build interrompido.");
    await fs.writeFile(
      path.join(extracted, "ORIGIN.json"),
      JSON.stringify(
        {
          name: "Spicetify CLI",
          version: VERSION,
          url: asset,
          sha256: SHA256,
          source: `https://github.com/spicetify/cli/tree/v${VERSION}`,
        },
        null,
        2,
      ),
    );
    await fs.rm(destination, { recursive: true, force: true });
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.cp(extracted, destination, { recursive: true });
    console.log(
      `Spicetify ${VERSION} x64 verificado e pronto para empacotamento.`,
    );
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
