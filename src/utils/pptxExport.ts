export type PresentationSlide = {
  title?: string | null;
  bullets?: Array<string | number | null | undefined>;
  section?: string | null;
  metrics?: Array<{ label?: string | null; value?: unknown }>;
  table?: Array<Record<string, unknown>>;
};

export type PresentationTheme = {
  primary?: string | null;
  accent?: string | null;
  background?: string | null;
};

const PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const encoder = new TextEncoder();

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

const crc32 = (bytes: Uint8Array) => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const pushU16 = (target: number[], value: number) => {
  target.push(value & 0xff, (value >>> 8) & 0xff);
};

const pushU32 = (target: number[], value: number) => {
  target.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
};

const pushBytes = (target: number[], bytes: Uint8Array) => {
  for (const byte of bytes) target.push(byte);
};

const dosDateTime = (date = new Date()) => {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
};

const createZip = (files: Record<string, string>) => {
  const output: number[] = [];
  const entries: Array<{ name: Uint8Array; crc: number; size: number; offset: number }> = [];
  const stamp = dosDateTime();

  for (const [name, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(content);
    const crc = crc32(data);
    const offset = output.length;

    pushU32(output, 0x04034b50);
    pushU16(output, 20);
    pushU16(output, 0);
    pushU16(output, 0);
    pushU16(output, stamp.time);
    pushU16(output, stamp.date);
    pushU32(output, crc);
    pushU32(output, data.length);
    pushU32(output, data.length);
    pushU16(output, nameBytes.length);
    pushU16(output, 0);
    pushBytes(output, nameBytes);
    pushBytes(output, data);

    entries.push({ name: nameBytes, crc, size: data.length, offset });
  }

  const centralDirectoryOffset = output.length;
  for (const entry of entries) {
    pushU32(output, 0x02014b50);
    pushU16(output, 20);
    pushU16(output, 20);
    pushU16(output, 0);
    pushU16(output, 0);
    pushU16(output, stamp.time);
    pushU16(output, stamp.date);
    pushU32(output, entry.crc);
    pushU32(output, entry.size);
    pushU32(output, entry.size);
    pushU16(output, entry.name.length);
    pushU16(output, 0);
    pushU16(output, 0);
    pushU16(output, 0);
    pushU16(output, 0);
    pushU32(output, 0);
    pushU32(output, entry.offset);
    pushBytes(output, entry.name);
  }

  const centralDirectorySize = output.length - centralDirectoryOffset;
  pushU32(output, 0x06054b50);
  pushU16(output, 0);
  pushU16(output, 0);
  pushU16(output, entries.length);
  pushU16(output, entries.length);
  pushU32(output, centralDirectorySize);
  pushU32(output, centralDirectoryOffset);
  pushU16(output, 0);

  return new Uint8Array(output);
};

const xml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const color = (value: string | null | undefined, fallback: string) => {
  const cleaned = String(value ?? fallback).replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
  return cleaned.length === 6 ? cleaned.toUpperCase() : fallback;
};

const asText = (value: unknown) => String(value ?? "").trim();

const slideBullets = (slide: PresentationSlide) => {
  const bullets = (slide.bullets ?? []).map(asText).filter(Boolean);
  const metricBullets = (slide.metrics ?? [])
    .map((metric) => `${asText(metric.label)}: ${asText(metric.value)}`)
    .filter((item) => item !== ": ");
  const tableBullets = (slide.table ?? []).slice(0, 6).map((row) =>
    Object.entries(row)
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${asText(value)}`)
      .join(" | "),
  );
  return [...bullets, ...metricBullets, ...tableBullets].slice(0, 13);
};

const paragraph = (text: string, size: number, options: { bold?: boolean; color?: string } = {}) =>
  `<a:p><a:r><a:rPr lang="en-US" sz="${size}"${options.bold ? ' b="1"' : ""}>${
    options.color ? `<a:solidFill><a:srgbClr val="${options.color}"/></a:solidFill>` : ""
  }</a:rPr><a:t>${xml(text)}</a:t></a:r></a:p>`;

const slideXml = (slide: PresentationSlide, index: number, theme: Required<PresentationTheme>) => {
  const title = asText(slide.title) || `Slide ${index + 1}`;
  const content = slideBullets(slide);
  const primary = color(theme.primary, "1E88E5");
  const accent = color(theme.accent, "10B981");
  const background = color(theme.background, "FFFFFF");
  const titleBlock = paragraph(title, index === 0 ? 3600 : 2800, { bold: true, color: primary });
  const contentBlock = content.map((item) => paragraph(`- ${item}`, index === 0 ? 1900 : 1650, { color: "1F2937" })).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg><p:bgPr><a:solidFill><a:srgbClr val="${background}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="640000" y="420000"/><a:ext cx="10900000" cy="780000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
        <p:txBody><a:bodyPr wrap="square"/><a:lstStyle/>${titleBlock}</p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Content"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="820000" y="1350000"/><a:ext cx="10560000" cy="4920000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
        <p:txBody><a:bodyPr wrap="square"/><a:lstStyle/>${contentBlock || paragraph("No content available.", 1650, { color: "1F2937" })}</p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="4" name="Accent"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="150000" cy="6858000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="${accent}"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr>
      </p:sp>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
};

const contentTypes = (slideCount: number) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  ${Array.from({ length: slideCount }, (_, index) => `<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join("")}
</Types>`;

const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

const appProps = (slideCount: number) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Taruvi Kaizen</Application><Slides>${slideCount}</Slides></Properties>`;

const coreProps = (title: string) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xml(title)}</dc:title><dc:creator>Taruvi Kaizen</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created></cp:coreProperties>`;

const presentationXml = (slideCount: number) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>${Array.from({ length: slideCount }, (_, index) => `<p:sldId id="${256 + index}" r:id="rId${index + 2}"/>`).join("")}</p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;

const presentationRels = (slideCount: number) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  ${Array.from({ length: slideCount }, (_, index) => `<Relationship Id="rId${index + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${index + 1}.xml"/>`).join("")}
</Relationships>`;

const slideMaster = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
  <p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles>
</p:sldMaster>`;

const slideMasterRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`;

const slideLayout = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;

const slideLayoutRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`;

const themeXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Taruvi"><a:themeElements><a:clrScheme name="Taruvi"><a:dk1><a:srgbClr val="1F2937"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="111827"/></a:dk2><a:lt2><a:srgbClr val="F3F4F6"/></a:lt2><a:accent1><a:srgbClr val="1E88E5"/></a:accent1><a:accent2><a:srgbClr val="10B981"/></a:accent2><a:accent3><a:srgbClr val="F57C00"/></a:accent3><a:accent4><a:srgbClr val="004369"/></a:accent4><a:accent5><a:srgbClr val="C2185B"/></a:accent5><a:accent6><a:srgbClr val="596365"/></a:accent6><a:hlink><a:srgbClr val="1E88E5"/></a:hlink><a:folHlink><a:srgbClr val="004369"/></a:folHlink></a:clrScheme><a:fontScheme name="Taruvi"><a:majorFont><a:latin typeface="Aptos Display"/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/></a:minorFont></a:fontScheme><a:fmtScheme name="Taruvi"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`;

export const createPresentationPptxBlob = (
  slides: PresentationSlide[],
  options: { title?: string; theme?: PresentationTheme } = {},
) => {
  const normalizedSlides = slides.length > 0 ? slides : [{ title: options.title ?? "Innovation Day Review", bullets: ["No slide data available."] }];
  const theme: Required<PresentationTheme> = {
    primary: options.theme?.primary ?? "1E88E5",
    accent: options.theme?.accent ?? "10B981",
    background: options.theme?.background ?? "FFFFFF",
  };
  const title = options.title ?? asText(normalizedSlides[0]?.title) ?? "Innovation Day Review";
  const files: Record<string, string> = {
    "[Content_Types].xml": contentTypes(normalizedSlides.length),
    "_rels/.rels": rootRels,
    "docProps/app.xml": appProps(normalizedSlides.length),
    "docProps/core.xml": coreProps(title),
    "ppt/presentation.xml": presentationXml(normalizedSlides.length),
    "ppt/_rels/presentation.xml.rels": presentationRels(normalizedSlides.length),
    "ppt/slideMasters/slideMaster1.xml": slideMaster,
    "ppt/slideMasters/_rels/slideMaster1.xml.rels": slideMasterRels,
    "ppt/slideLayouts/slideLayout1.xml": slideLayout,
    "ppt/slideLayouts/_rels/slideLayout1.xml.rels": slideLayoutRels,
    "ppt/theme/theme1.xml": themeXml,
  };

  normalizedSlides.forEach((slide, index) => {
    files[`ppt/slides/slide${index + 1}.xml`] = slideXml(slide, index, theme);
    files[`ppt/slides/_rels/slide${index + 1}.xml.rels`] =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>';
  });

  return new Blob([createZip(files)], { type: PPTX_MIME });
};

export const downloadPresentationPptx = (
  fileName: string,
  slides: PresentationSlide[],
  options: { title?: string; theme?: PresentationTheme } = {},
) => {
  const blob = createPresentationPptxBlob(slides, options);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName.endsWith(".pptx") ? fileName : `${fileName}.pptx`;
  anchor.click();
  URL.revokeObjectURL(url);
};
