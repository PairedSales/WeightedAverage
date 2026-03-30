/**
 * Insert chunk recovery at the start of <head> in exported HTML.
 * Next injects async _next scripts before layout children, so listeners must run first.
 * Recovers from stale cached HTML after deploy (old chunk hashes → 404 / ChunkLoadError).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "out");

const MARKER = "wa-chunk-recovery-injected";

const INLINE = `
<script id="${MARKER}">
(function(){
  var key="__wa_chunk_reload_once";
  function tryReload(){
    if(!sessionStorage.getItem(key)){
      sessionStorage.setItem(key,"1");
      location.reload();
    }
  }
  window.addEventListener("error",function(e){
    var t=e.target;
    if(t&&t.tagName==="SCRIPT"&&t.src&&t.src.indexOf("_next")!==-1){
      tryReload();
      return;
    }
    var msg=String(e.message||"");
    var err=e.error;
    if(err&&err.name==="ChunkLoadError"){tryReload();return;}
    if(msg.indexOf("ChunkLoadError")!==-1||msg.indexOf("Loading chunk")!==-1){tryReload();}
  },true);
  window.addEventListener("unhandledrejection",function(e){
    var msg=String((e.reason&&e.reason.message)||e.reason||"");
    if(msg.indexOf("ChunkLoadError")!==-1||msg.indexOf("Loading chunk")!==-1){tryReload();}
  });
})();
</script>`;

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  let html = fs.readFileSync(filePath, "utf8");
  if (html.includes(`id="${MARKER}"`)) return false;
  const needle = "<head>";
  const i = html.indexOf(needle);
  if (i === -1) {
    console.warn("inject-chunk-recovery: no <head> in", filePath);
    return false;
  }
  const at = i + needle.length;
  fs.writeFileSync(filePath, html.slice(0, at) + INLINE + html.slice(at), "utf8");
  console.log("inject-chunk-recovery: patched", path.relative(root, filePath));
  return true;
}

if (!fs.existsSync(outDir)) {
  console.warn("inject-chunk-recovery: no out/ directory, skip");
  process.exit(0);
}

patchFile(path.join(outDir, "index.html"));
patchFile(path.join(outDir, "404.html"));
