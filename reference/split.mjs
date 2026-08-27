import fs from "node:fs";

const html = fs.readFileSync("reference/source.html", "utf8");
const bodyStart = html.indexOf("<body");
const body = html.slice(bodyStart);

function splitByTag(body, tag) {
  const re = new RegExp("<" + tag + "(?:\\s[^>]*)?>|</" + tag + ">", "g");
  const out = [];
  let depth = 0;
  let start = -1;
  let m;
  while ((m = re.exec(body))) {
    if (m[0].startsWith("</")) {
      depth--;
      if (depth === 0) {
        out.push(body.slice(start, m.index + ("</" + tag + ">").length));
        start = -1;
      }
    } else {
      if (depth === 0) start = m.index;
      depth++;
    }
  }
  return out;
}

const sections = splitByTag(body, "section");
fs.mkdirSync("reference/sections", { recursive: true });
const index = [];
sections.forEach((s, i) => {
  const clsMatch = s.match(/class="([^"]*)"/);
  const raw = clsMatch ? clsMatch[1] : "section_" + i;
  const name = raw.split(" ")[0].replace(/[^a-z0-9-]/gi, "_");
  fs.writeFileSync("reference/sections/" + name + ".html", s);
  index.push({ order: i, name, preview: s.slice(0, 140).replace(/\n/g, " ") });
});

// Navbar is a <div class="navbar w-nav">, not a <section>; extract it up to the hero.
const navStart = body.indexOf('class="navbar w-nav"');
const divOpen = navStart >= 0 ? body.lastIndexOf("<div", navStart) : -1;
const heroIdx = body.indexOf('<section class="home-hero-section"');
if (divOpen >= 0 && heroIdx > divOpen) {
  const nav = body.slice(divOpen, heroIdx);
  fs.writeFileSync("reference/sections/navbar.html", nav);
  index.unshift({ order: -1, name: "navbar", preview: nav.slice(0, 140) });
}

fs.writeFileSync("reference/sections/index.json", JSON.stringify(index, null, 2));
console.log("sections:", sections.length, "| files in reference/sections");
index.forEach((e) => console.log(`  ${e.order}\t${e.name}`));
