import React, { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  ResponsiveContainer,
} from "recharts";

const DEFAULT_SPREADSHEET_ID = "17mXamIrhpbmZtdlmk4H9VNNhoqWPuype";
const POSTS_SHEET = "Posts brutos";
const GENERAL_SHEET = "Dados gerais";
const DAILY_SHEET = "Dados por dia";
const NEWS_EMAIL_CLICKS_SHEET = "HistoricoNewsEmailClicks";
const NEWS_LINKEDIN_SHEET = "HistoricoNewsLinkedin";
const NEWS_EMAIL_SHEET_ALIASES = [
  "HistoricoNewsEmail",
  "HistoricoNewsEmails",
  "Histórico da news",
  "Historico da news",
  "Histórico News",
  "Historico News",
];

const BRAND_BLUE = "#1B5ECE";
const DARK_GRAY = "#111827";
const CREAM = "#FFF1D6";
const NILIT_LOGO_URL = "https://res.cloudinary.com/daa3hsnkh/image/upload/v1778015070/logonilit_ep4jwy.jpg";
const XCOM_LOGO_URL = "https://res.cloudinary.com/daa3hsnkh/image/upload/v1778017157/logoxcom_ws81he.jpg";
const DEFAULT_POST_IMAGE_URL = "https://res.cloudinary.com/daa3hsnkh/image/upload/v1778176710/imagem_geral_nilit_tnqez7.jpg";
const DASHBOARD_COMPARE_KEYS = new Set(["reactions", "comments", "share", "impressions", "engagementRate"]);

const TABS = ["Dashboard", "Published Posts", "PULSE", "Next Steps"];

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const DASHBOARD_METRICS = [
  { key: "postsProduced", label: "Posts produced", aliases: ["posts produced", "posts produzidos", "produced posts"] },
  { key: "postsPublished", label: "Posts published", aliases: ["posts published", "posts publicados", "published posts"] },
  { key: "totalFollowers", label: "Total followers", aliases: ["total followers", "followers", "seguidores", "total seguidores"] },
  { key: "newFollowers", label: "New followers", aliases: ["new followers", "novos seguidores", "ganhos de seguidores"] },
  { key: "reactions", label: "Reactions", aliases: ["reactions", "reações", "reacoes", "gostaram", "likes"] },
  { key: "comments", label: "Comments", aliases: ["comments", "comentários", "comentarios"] },
  { key: "share", label: "Share", aliases: ["share", "shares", "compartilhamentos", "compartilhamento"] },
  { key: "impressions", label: "Impressions", aliases: ["impressions", "impressões", "impressoes"] },
  { key: "engagementRate", label: "Engagement rate", aliases: ["engagement rate", "taxa de engajamento", "engajamento"], isPercent: true },
];

const POST_FIELDS = {
  title: ["Título da publicação", "Titulo da publicação", "Titulo da publicacao", "Title"],
  date: ["Criação", "Criacao", "Data", "Date"],
  link: ["Link da publicação", "Link da publicacao", "Link"],
  impressions: ["Impressões", "Impressoes", "Impressions"],
  clicks: ["Cliques", "Clicks"],
  likes: ["Gostaram", "Likes", "Reações", "Reacoes", "Reactions"],
  comments: ["Comentários", "Comentarios", "Comments"],
  shares: ["Compartilhamentos", "Shares", "Share"],
  image: ["Imagens", "Imagem", "Image", "Post image"],
  analysis: ["Analises", "Análises", "Analise", "Análise", "Analysis"],
};

const NEWS_FIELDS = {
  news: ["News"],
  sent: ["Sent"],
  openRate: ["Open Rate", "Open rate"],
  clickRate: ["Click Rate", "Click rate"],
  bounces: ["Bounces"],
  unsubscribes: ["Unsubscribes", "Unsubscribe"],
  date: ["Date"],
  day: ["Day"],
  time: ["Time"],
};

function Icon({ name, size = 22, color = "currentColor" }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </>
    ),
    refresh: (
      <>
        <path d="M21 12a9 9 0 0 1-15.5 6.2" />
        <path d="M3 12A9 9 0 0 1 18.5 5.8" />
        <path d="M18 2v4h-4" />
        <path d="M6 22v-4h4" />
      </>
    ),
  };

  return <svg {...common}>{paths[name] || paths.info}</svg>;
}

function NilitLogo() {
  return (
    <div className="flex items-center" aria-label="NILIT">
      <img src={NILIT_LOGO_URL} alt="NILIT" className="h-16 w-auto object-contain" />
    </div>
  );
}

function AgencyBrand() {
  return (
    <div className="flex items-center justify-end gap-3 text-right">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Powered by</span>
      <img src={XCOM_LOGO_URL} alt="XCOM Comunicação e Marketing" className="h-10 w-auto object-contain" />
    </div>
  );
}

function LastUpdateBar({ lastUpdate, onRefresh }) {
  return (
    <div className="ml-auto flex shrink-0 items-center gap-3 pl-4 text-right text-xs text-slate-500">
      <div>
        <span className="font-medium text-slate-700">Last update: </span>
        <span>{lastUpdate || "Not loaded yet"}</span>
      </div>
      <button onClick={onRefresh} className="rounded-full border border-slate-200 bg-white p-2 shadow-sm transition hover:bg-slate-50" title="Refresh data">
        <Icon name="refresh" size={16} color={BRAND_BLUE} />
      </button>
    </div>
  );
}

function cleanGoogleSheetsJson(text) {
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) throw new Error("Spreadsheet response does not contain valid JSON.");
  return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeValue(value) {
  if (value === null || value === undefined || value === "" || value === "-") return 0;
  if (typeof value === "number") return value;

  const raw = String(value).trim();
  if (raw.includes("%")) {
    const percentNumber = Number(raw.replace("%", "").replace(/\s/g, "").replace(",", "."));
    return Number.isNaN(percentNumber) ? value : percentNumber / 100;
  }

  const normalized = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const number = Number(normalized);
  return Number.isNaN(number) ? value : number;
}

function toNumber(value) {
  const normalized = normalizeValue(value);
  const number = Number(normalized);
  return Number.isNaN(number) ? 0 : number;
}

function categoryMatches(category, aliases) {
  const normalizedCategory = normalizeText(category);
  return aliases.some((alias) => normalizedCategory === normalizeText(alias) || normalizedCategory.includes(normalizeText(alias)));
}

function getField(row, aliases) {
  const keys = Object.keys(row || {});

  let key = keys.find((candidate) => aliases.some((alias) => normalizeText(candidate) === normalizeText(alias)));
  if (key) return row[key];

  key = keys.find((candidate) => {
    const normalizedCandidate = normalizeText(candidate);
    return aliases.some((alias) => {
      const normalizedAlias = normalizeText(alias);
      return normalizedCandidate.includes(normalizedAlias) || normalizedAlias.includes(normalizedCandidate);
    });
  });

  return key ? row[key] : 0;
}

function getNumberField(row, aliases) {
  return toNumber(getField(row, aliases));
}

function getPostDateValue(row) {
  return getField(row, POST_FIELDS.date);
}

function parseGoogleMatrix(table) {
  const columnCount = table.cols?.length || 0;
  return table.rows.map((row) => Array.from({ length: columnCount }, (_, index) => normalizeValue(row.c?.[index]?.v ?? row.c?.[index]?.f)));
}

function parseGoogleTable(table) {
  const matrix = parseGoogleMatrix(table);
  const columnLabels = (table.cols || []).map((col, index) => String(col.label || col.id || `Column ${index + 1}`).trim());
  const knownHeaders = [
    "year", "ano", "month", "mes", "dashboard", "metrics", "published posts",
    "titulo da publicacao", "criacao", "impressoes", "cliques", "gostaram",
    "comentarios", "compartilhamentos", "data", "impressoes organicas",
    "news", "sent", "open rate", "click rate",
  ];
  const hasUsefulColumnLabels = columnLabels.some((label) => knownHeaders.includes(normalizeText(label)));
  const headers = hasUsefulColumnLabels ? columnLabels : matrix[0] || [];
  const dataRows = hasUsefulColumnLabels ? matrix : matrix.slice(1);
  const rows = dataRows
    .map((row) => {
      const item = {};
      headers.forEach((header, index) => {
        item[String(header || `Column ${index + 1}`).trim()] = row[index] ?? 0;
      });
      return item;
    })
    .filter((row) => Object.values(row).some((value) => value !== 0 && value !== ""));
  return { headers, rows, matrix, hasUsefulColumnLabels };
}

function isPublishedPostsHeaderRow(row) {
  const normalizedCells = row.map((cell) => normalizeText(cell));
  const hasTitle = POST_FIELDS.title.some((alias) => normalizedCells.includes(normalizeText(alias)));
  const hasDate = POST_FIELDS.date.some((alias) => normalizedCells.includes(normalizeText(alias)));
  const hasImpressions = POST_FIELDS.impressions.some((alias) => normalizedCells.includes(normalizeText(alias)));
  return hasTitle && hasDate && hasImpressions;
}

function buildPublishedRowsFromFixedColumns(matrix, headerRowIndex) {
  const rows = matrix
    .slice(headerRowIndex + 1)
    .map((row) => ({
      Conta: row[0] ?? 0,
      "Título da publicação": row[1] ?? 0,
      "Link da publicação": row[2] ?? 0,
      Criação: row[6] ?? 0,
      Impressões: row[10] ?? 0,
      Cliques: row[13] ?? 0,
      Gostaram: row[15] ?? 0,
      Comentários: row[16] ?? 0,
      Compartilhamentos: row[17] ?? 0,
      Imagens: row[22] ?? 0,
      Analises: row[23] ?? 0,
    }))
    .filter((row) => Boolean(row["Título da publicação"] && row["Título da publicação"] !== 0 && row.Criação && row.Criação !== 0));

  return {
    headers: ["Conta", "Título da publicação", "Link da publicação", "Criação", "Impressões", "Cliques", "Gostaram", "Comentários", "Compartilhamentos", "Imagens", "Analises"],
    rows,
  };
}

function parsePublishedPostsTable(table) {
  const parsed = parseGoogleTable(table);
  const matrixHeaderIndex = parsed.matrix.findIndex((row) => isPublishedPostsHeaderRow(row));
  const headerIndex = matrixHeaderIndex >= 0 ? matrixHeaderIndex : 0;
  return { ...buildPublishedRowsFromFixedColumns(parsed.matrix, headerIndex), matrix: parsed.matrix };
}

async function fetchSheet(sheetName, options = {}) {
  const query = options.range ? `range=${encodeURIComponent(options.range)}&` : "";
  const url = `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/gviz/tq?${query}tqx=out:json&headers=0&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} error while loading ${sheetName}`);
  const text = await res.text();
  return parseGoogleTable(cleanGoogleSheetsJson(text).table);
}

function parseLinkedInSheetTable(table) {
  const columnLabels = (table.cols || []).map((col, index) => String(col.label || col.id || `Column ${index + 1}`).trim());
  const rawMatrix = (table.rows || []).map((row) => {
    const cells = row.c || [];
    return Array.from({ length: Math.max(columnLabels.length, cells.length) }, (_, index) => {
      const cell = cells[index];
      if (!cell) return 0;
      return cell.f ?? cell.v ?? 0;
    });
  });

  const firstColumnLabel = normalizeText(columnLabels[0]);
  const labelsAreHeaderRow = firstColumnLabel === "metrica edicao" || firstColumnLabel === "metric edition";
  const matrix = labelsAreHeaderRow ? [columnLabels, ...rawMatrix] : rawMatrix;

  return { headers: matrix[0] || [], rows: [], matrix };
}

async function fetchLinkedInSheet() {
  const url = `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/gviz/tq?range=A:AZ&tqx=out:json&headers=0&sheet=${encodeURIComponent(NEWS_LINKEDIN_SHEET)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} error while loading ${NEWS_LINKEDIN_SHEET}`);
  const text = await res.text();
  return parseLinkedInSheetTable(cleanGoogleSheetsJson(text).table);
}

function numberToColumnLetter(number) {
  let column = "";
  let current = Number(number);

  while (current > 0) {
    const remainder = (current - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    current = Math.floor((current - 1) / 26);
  }

  return column;
}

async function fetchLinkedInAnalysisCell(selectedNews) {
  const edition = Number(selectedNews);
  if (!edition || edition < 1) return "";

  const columnLetter = numberToColumnLetter(edition + 1);
  const range = `${columnLetter}10:${columnLetter}10`;
  const url = `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/gviz/tq?range=${encodeURIComponent(range)}&tqx=out:json&headers=0&sheet=${encodeURIComponent(NEWS_LINKEDIN_SHEET)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} error while loading ${NEWS_LINKEDIN_SHEET} analysis cell`);
  const text = await res.text();
  const table = cleanGoogleSheetsJson(text).table;
  const cell = table.rows?.[0]?.c?.[0];
  const value = cell?.f ?? cell?.v ?? "";
  return String(value || "").trim();
}

async function fetchPublishedPostsSheet() {
  const url = `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/gviz/tq?range=A:Z&tqx=out:json&headers=0&sheet=${encodeURIComponent(POSTS_SHEET)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} error while loading ${POSTS_SHEET}`);
  const text = await res.text();
  return parsePublishedPostsTable(cleanGoogleSheetsJson(text).table);
}

function parseDailySheet(table) {
  const matrix = parseGoogleMatrix(table);
  const headerIndex = matrix.findIndex((row) => normalizeText(row[0]) === "data");
  const startIndex = headerIndex >= 0 ? headerIndex + 1 : 0;
  const rows = matrix
    .slice(startIndex)
    .map((row) => ({
      Data: row[0] ?? 0,
      "Impressoes organicas": row[1] ?? 0,
      "Cliques organicos": row[5] ?? 0,
    }))
    .filter((row) => row.Data && row.Data !== 0);
  return { headers: ["Data", "Impressoes organicas", "Cliques organicos"], rows, matrix };
}

async function fetchDailySheet() {
  const range = "A:F";
  const encodedSheetName = encodeURIComponent(DAILY_SHEET);
  const encodedRange = encodeURIComponent(range);
  const url = "https://docs.google.com/spreadsheets/d/" + DEFAULT_SPREADSHEET_ID + "/gviz/tq?range=" + encodedRange + "&tqx=out:json&headers=0&sheet=" + encodedSheetName;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} error while loading ${DAILY_SHEET}`);
  const text = await res.text();
  return parseDailySheet(cleanGoogleSheetsJson(text).table);
}

function parseNewsletterSheet(table) {
  const matrix = parseGoogleMatrix(table);
  const headerIndex = matrix.findIndex((row) => normalizeText(row[0]) === "news");
  const startIndex = headerIndex >= 0 ? headerIndex + 1 : 0;
  const rows = matrix
    .slice(startIndex)
    .map((row) => ({
      News: row[0] ?? 0,
      Sent: row[1] ?? 0,
      "Open Rate": row[2] ?? 0,
      "Click Rate": row[3] ?? 0,
      Bounces: row[7] ?? 0,
      Unsubscribes: row[8] ?? 0,
      Date: row[9] ?? 0,
      Day: row[10] ?? 0,
      Time: row[11] ?? 0,
    }))
    .filter((row) => row.News && row.News !== 0);
  return { headers: ["News", "Sent", "Open Rate", "Click Rate", "Bounces", "Unsubscribes", "Date", "Day", "Time"], rows, matrix };
}

function parseNewsletterClicksSheet(table) {
  const matrix = parseGoogleMatrix(table);
  const headerIndex = matrix.findIndex((row) => normalizeText(row[0]) === "email address");
  const startIndex = headerIndex >= 0 ? headerIndex + 1 : 0;
  const rows = matrix
    .slice(startIndex)
    .map((row) => ({
      emailAddress: row[0] ?? "",
      clickedLinkAddress: row[1] ?? "",
      clickedAt: row[2] ?? "",
    }))
    .filter((row) => row.emailAddress && row.clickedLinkAddress && row.clickedAt);
  return { headers: ["Email address", "Clicked Link Address", "Clicked At"], rows, matrix };
}

async function fetchNewsletterClicksSheet() {
  const range = "A:C";
  const encodedSheetName = encodeURIComponent(NEWS_EMAIL_CLICKS_SHEET);
  const encodedRange = encodeURIComponent(range);
  const url = "https://docs.google.com/spreadsheets/d/" + DEFAULT_SPREADSHEET_ID + "/gviz/tq?range=" + encodedRange + "&tqx=out:json&headers=0&sheet=" + encodedSheetName;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} error while loading ${NEWS_EMAIL_CLICKS_SHEET}`);
  const text = await res.text();
  return parseNewsletterClicksSheet(cleanGoogleSheetsJson(text).table);
}

async function fetchNewsletterSheet() {
  const range = "A:L";
  let lastError = null;
  for (const sheetName of NEWS_EMAIL_SHEET_ALIASES) {
    try {
      const encodedSheetName = encodeURIComponent(sheetName);
      const encodedRange = encodeURIComponent(range);
      const url = "https://docs.google.com/spreadsheets/d/" + DEFAULT_SPREADSHEET_ID + "/gviz/tq?range=" + encodedRange + "&tqx=out:json&headers=0&sheet=" + encodedSheetName;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} error while loading ${sheetName}`);
      const text = await res.text();
      const parsed = parseNewsletterSheet(cleanGoogleSheetsJson(text).table);
      if (parsed.rows.length) return parsed;
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return { headers: [], rows: [], matrix: [] };
}

function parseGoogleDateString(raw) {
  const match = String(raw).match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)/);
  if (!match) return null;
  const [, year, month, day, hour = 0, minute = 0, second = 0] = match;
  return new Date(Number(year), Number(month), Number(day), Number(hour), Number(minute), Number(second));
}

function parsePostDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
  }
  const raw = String(value).trim();
  const googleDate = parseGoogleDateString(raw);
  if (googleDate) return googleDate;
  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, first, second, year] = slash;
    const firstNumber = Number(first);
    const secondNumber = Number(second);
    const yearNumber = Number(year);
    if (firstNumber > 12) return new Date(yearNumber, secondNumber - 1, firstNumber);
    return new Date(yearNumber, firstNumber - 1, secondNumber);
  }
  const iso = new Date(raw);
  return Number.isNaN(iso.getTime()) ? null : iso;
}

function parseNewsletterClickDate(value) {
  const parsedDate = parsePostDate(value);
  if (parsedDate) return parsedDate;

  const raw = String(value || "").trim();
  const dateTimePattern = new RegExp("^([0-9]{1,2})/([0-9]{1,2})/([0-9]{4})[ ]+([0-9]{1,2}):([0-9]{2})[ ]*(am|pm)?$", "i");
  const match = raw.match(dateTimePattern);
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  let hour = Number(match[4]);
  const minute = Number(match[5]);
  const meridiem = String(match[6] || "").toLowerCase();

  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;

  return new Date(year, month - 1, day, hour, minute);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function formatPercent(value) {
  return `${((Number(value) || 0) * 100).toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function formatDashboardNumber(value, isPercent = false) {
  if (isPercent) return formatPercent(value);
  if (Number.isFinite(Number(value))) return formatNumber(value);
  return value || "—";
}

function replaceUnsupportedCanvasColor(value, fallback) {
  const raw = String(value || "").trim();
  if (!raw || raw === "transparent" || raw === "none") return raw;
  const lower = raw.toLowerCase();
  if (lower.includes("oklch") || lower.includes("lab(") || lower.includes("lch(") || lower.includes("color(")) return fallback;
  return raw;
}

function cloneElementAsPdfSafeNode(sourceNode) {
  const clone = sourceNode.cloneNode(true);
  const sourceElements = [sourceNode, ...Array.from(sourceNode.querySelectorAll("*"))];
  const cloneElements = [clone, ...Array.from(clone.querySelectorAll("*"))];
  const propertiesToCopy = [
    "display", "position", "boxSizing", "width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight",
    "margin", "marginTop", "marginRight", "marginBottom", "marginLeft", "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
    "font", "fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "letterSpacing", "textAlign", "textTransform", "whiteSpace",
    "flexDirection", "alignItems", "justifyContent", "gap", "rowGap", "columnGap", "flexWrap", "flexGrow", "flexShrink",
    "gridTemplateColumns", "gridTemplateRows", "gridAutoColumns", "gridAutoRows", "gridColumn", "gridRow",
    "borderRadius", "borderWidth", "borderStyle", "overflow", "opacity", "objectFit",
  ];

  cloneElements.forEach((element, index) => {
    const sourceElement = sourceElements[index];
    if (!sourceElement || !element.style) return;
    const style = window.getComputedStyle(sourceElement);

    element.removeAttribute("class");
    propertiesToCopy.forEach((property) => {
      element.style[property] = style[property];
    });

    element.style.color = replaceUnsupportedCanvasColor(style.color, DARK_GRAY) || DARK_GRAY;
    element.style.backgroundColor = replaceUnsupportedCanvasColor(style.backgroundColor, "transparent") || "transparent";
    element.style.borderColor = replaceUnsupportedCanvasColor(style.borderColor, "#E5E7EB") || "#E5E7EB";
    element.style.borderTopColor = replaceUnsupportedCanvasColor(style.borderTopColor, "#E5E7EB") || "#E5E7EB";
    element.style.borderRightColor = replaceUnsupportedCanvasColor(style.borderRightColor, "#E5E7EB") || "#E5E7EB";
    element.style.borderBottomColor = replaceUnsupportedCanvasColor(style.borderBottomColor, "#E5E7EB") || "#E5E7EB";
    element.style.borderLeftColor = replaceUnsupportedCanvasColor(style.borderLeftColor, "#E5E7EB") || "#E5E7EB";
    element.style.outlineColor = replaceUnsupportedCanvasColor(style.outlineColor, "#E5E7EB") || "#E5E7EB";
    element.style.textDecorationColor = replaceUnsupportedCanvasColor(style.textDecorationColor, DARK_GRAY) || DARK_GRAY;
    element.style.boxShadow = "none";
    element.style.textShadow = "none";

    const fill = element.getAttribute("fill");
    const stroke = element.getAttribute("stroke");
    if (fill && fill !== "none") element.setAttribute("fill", replaceUnsupportedCanvasColor(fill, "#FFFFFF"));
    if (stroke && stroke !== "none") element.setAttribute("stroke", replaceUnsupportedCanvasColor(stroke, "#E5E7EB"));
  });

  clone.style.position = "absolute";
  clone.style.left = "0";
  clone.style.top = "0";
  clone.style.width = `${sourceNode.scrollWidth}px`;
  clone.style.height = "auto";
  clone.style.backgroundColor = "#F6F8FB";
  return clone;
}

async function capturePdfSafeCanvas(section, options = {}) {
  const scale = options.scale || 1.25;
  const sandbox = document.createElement("div");
  sandbox.setAttribute("data-pdf-sandbox", "true");
  sandbox.style.position = "fixed";
  sandbox.style.left = "0";
  sandbox.style.top = "0";
  sandbox.style.zIndex = "-1";
  sandbox.style.width = `${section.scrollWidth}px`;
  sandbox.style.minHeight = `${section.scrollHeight}px`;
  sandbox.style.backgroundColor = "#F6F8FB";
  sandbox.style.pointerEvents = "none";
  sandbox.style.opacity = "0";

  const safeClone = cloneElementAsPdfSafeNode(section);
  sandbox.appendChild(safeClone);
  document.body.appendChild(sandbox);

  try {
    await new Promise((resolve) => window.requestAnimationFrame(() => resolve(null)));
    return await html2canvas(safeClone, {
      scale,
      backgroundColor: "#F6F8FB",
      useCORS: true,
      allowTaint: false,
      logging: false,
      imageTimeout: 8000,
      windowWidth: safeClone.scrollWidth,
      windowHeight: safeClone.scrollHeight,
    });
  } finally {
    document.body.removeChild(sandbox);
  }
}

function waitForBrowserPaint(delay = 80) {
  return new Promise((resolve) => window.setTimeout(resolve, delay));
}

function getPdfSectionTitle(section, fallback) {
  return section.getAttribute("data-pdf-title") || fallback;
}

function formatNewsletterSendInfo(newsletter) {
  if (!newsletter) return "Send date: —";

  const date = parsePostDate(newsletter.date);
  const formattedDate = date ? date.toLocaleDateString("en-US") : String(newsletter.date || "—");
  const weekday = newsletter.day && newsletter.day !== 0
    ? String(newsletter.day)
    : date
      ? date.toLocaleDateString("en-US", { weekday: "long" })
      : "—";
  const time = newsletter.time && newsletter.time !== 0 ? String(newsletter.time) : "—";

  return `Send date: ${formattedDate}, ${weekday}, ${time}`;
}

function findDashboardColumnIndex(matrix, selectedYear, selectedMonth) {
  const yearRowIndex = matrix.findIndex((row) => normalizeText(row[0]) === "year" || normalizeText(row[0]) === "ano");
  const monthRowIndex = matrix.findIndex((row) => normalizeText(row[0]) === "month" || normalizeText(row[0]) === "mes");
  if (yearRowIndex === -1 || monthRowIndex === -1) return -1;
  const yearRow = matrix[yearRowIndex];
  const monthRow = matrix[monthRowIndex];
  for (let index = 1; index < Math.max(yearRow.length, monthRow.length); index += 1) {
    if (Number(yearRow[index]) === Number(selectedYear) && Number(monthRow[index]) === Number(selectedMonth)) return index;
  }
  return -1;
}

function buildDashboardMetrics(generalMatrix, selectedYear, selectedMonth) {
  const columnIndex = findDashboardColumnIndex(generalMatrix, selectedYear, selectedMonth);
  return DASHBOARD_METRICS.map((metric) => {
    const rowIndex = generalMatrix.findIndex((row) => categoryMatches(row[0], metric.aliases));
    const value = columnIndex >= 0 && rowIndex >= 0 ? generalMatrix[rowIndex]?.[columnIndex] : 0;
    const previousValue = columnIndex > 1 && rowIndex >= 0 ? generalMatrix[rowIndex]?.[columnIndex - 1] : undefined;
    return {
      ...metric,
      value: value ?? 0,
      previous: previousValue,
      showPrevious: DASHBOARD_COMPARE_KEYS.has(metric.key),
    };
  });
}

function buildGeneralMetricTimeSeries(generalMatrix, selectedYear, selectedMonth, aliases, monthsBack = 12) {
  if (!generalMatrix || generalMatrix.length === 0) return [];
  const yearRowIndex = generalMatrix.findIndex((row) => normalizeText(row[0]) === "year" || normalizeText(row[0]) === "ano");
  const monthRowIndex = generalMatrix.findIndex((row) => normalizeText(row[0]) === "month" || normalizeText(row[0]) === "mes");
  const metricRowIndex = generalMatrix.findIndex((row) => categoryMatches(row[0], aliases));
  if (yearRowIndex === -1 || monthRowIndex === -1 || metricRowIndex === -1) return [];
  const selectedDate = new Date(Number(selectedYear), Number(selectedMonth) - 1, 1).getTime();
  return generalMatrix[yearRowIndex]
    .map((yearValue, index) => {
      const year = Number(yearValue);
      const month = Number(generalMatrix[monthRowIndex]?.[index]);
      const value = toNumber(generalMatrix[metricRowIndex]?.[index]);
      if (!year || !month) return null;
      const date = new Date(year, month - 1, 1).getTime();
      if (date > selectedDate) return null;
      const label = `${MONTHS.find((item) => item.value === month)?.label?.slice(0, 3) || String(month)}/${String(year).slice(-2)}`;
      return { year, month, date, label, value };
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date)
    .slice(-monthsBack);
}

function addMovingAverage(data, valueKey = "value", outputKey = "movingAvg", windowSize = 12) {
  return data.map((item, index, array) => {
    const window = array.slice(Math.max(0, index - windowSize + 1), index + 1);
    const avg = window.reduce((acc, row) => acc + (Number(row[valueKey]) || 0), 0) / window.length;
    return { ...item, [outputKey]: avg };
  });
}

function buildGeneralAnalysis(generalMatrix, generalAnalysisMatrix, selectedYear, selectedMonth, tabName) {
  if (!generalMatrix || generalMatrix.length === 0) return "";
  const columnIndex = findDashboardColumnIndex(generalMatrix, selectedYear, selectedMonth);
  if (columnIndex === -1) return "";
  const getExactTextFromMatrix = (matrix) => {
    if (!matrix || matrix.length === 0) return "";
    const analysisSectionIndex = matrix.findIndex((row) => normalizeText(row[0]) === "analysis");
    const startIndex = analysisSectionIndex >= 0 ? analysisSectionIndex + 1 : 0;
    const rowIndex = matrix.findIndex((row, index) => {
      if (index < startIndex) return false;
      return normalizeText(row[0]) === normalizeText(tabName);
    });
    if (rowIndex === -1) return "";
    const value = matrix[rowIndex]?.[columnIndex];
    if (!value || String(value).trim() === "0") return "";
    if (Number.isFinite(Number(value))) return "";
    return String(value);
  };
  return getExactTextFromMatrix(generalMatrix) || getExactTextFromMatrix(generalAnalysisMatrix);
}

function formatDateKey(date) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatPostLabel(title) {
  const words = String(title || "").split(" ").filter(Boolean);
  const line1 = words.slice(0, 3).join(" ");
  const line2Words = words.slice(3, 5).join(" ");
  const line2 = line2Words ? `${line2Words}...` : "...";
  return `${line1}\n${line2}`;
}

function buildPostLabelsByDate(posts) {
  const labels = {};
  posts.forEach((post) => {
    const date = parsePostDate(getPostDateValue(post));
    if (!date) return;
    const key = formatDateKey(date);
    if (!labels[key]) labels[key] = formatPostLabel(getField(post, POST_FIELDS.title));
  });
  return labels;
}

function buildDailyOrganicImpressions(rows, selectedYear, selectedMonth) {
  return rows
    .map((row) => {
      const dateValue = getField(row, ["Data", "Date"]);
      const date = parsePostDate(dateValue);
      const impressions = getNumberField(row, ["Impressões (orgânicas)", "Impressoes (organicas)", "Impressões orgânicas", "Impressoes organicas", "Organic impressions"]);
      const clicks = getNumberField(row, ["Cliques (orgânicos)", "Cliques (organicos)", "Cliques orgânicos", "Cliques organicos", "Organic clicks"]);
      if (!date) return null;
      if (date.getFullYear() !== Number(selectedYear) || date.getMonth() + 1 !== Number(selectedMonth)) return null;
      return {
        date,
        day: date.toLocaleDateString("en-US", { day: "2-digit" }),
        label: date.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit" }),
        impressions,
        clicks,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function normalizeImageUrl(url) {
  if (!url || url === 0) return DEFAULT_POST_IMAGE_URL;
  const normalizedUrl = String(url).trim();
  return normalizedUrl && normalizedUrl !== "0" ? normalizedUrl : DEFAULT_POST_IMAGE_URL;
}

function truncateWords(text, limit = 7) {
  const words = String(text || "").split(" ").filter(Boolean);
  if (words.length <= limit) return words.join(" ");
  return `${words.slice(0, limit).join(" ")}...`;
}

function buildPublishedPostCards(rows) {
  return [...rows]
    .sort((a, b) => {
      const dateA = parsePostDate(getPostDateValue(a))?.getTime() || 0;
      const dateB = parsePostDate(getPostDateValue(b))?.getTime() || 0;
      return dateA - dateB;
    })
    .map((row, index) => {
      const likes = getNumberField(row, POST_FIELDS.likes);
      const comments = getNumberField(row, POST_FIELDS.comments);
      const shares = getNumberField(row, POST_FIELDS.shares);
      const impressions = getNumberField(row, POST_FIELDS.impressions);
      const clicks = getNumberField(row, POST_FIELDS.clicks);
      const engagements = likes + comments + shares;
      const fullTitle = String(getField(row, POST_FIELDS.title) || "Untitled post");
      return {
        id: String(getField(row, POST_FIELDS.link) || fullTitle || index),
        title: fullTitle,
        shortTitle: truncateWords(fullTitle, 7),
        date: parsePostDate(getPostDateValue(row)),
        link: String(getField(row, POST_FIELDS.link) || ""),
        imageUrl: normalizeImageUrl(getField(row, POST_FIELDS.image)),
        analysis: String(getField(row, POST_FIELDS.analysis) || "Analysis has not been added for this post yet."),
        impressions,
        clicks,
        likes,
        comments,
        shares,
        engagements,
      };
    });
}

function buildNewsletterRows(rows) {
  return rows
    .map((row) => {
      const news = getNumberField(row, NEWS_FIELDS.news);
      if (!news) return null;
      return {
        news,
        sent: getNumberField(row, NEWS_FIELDS.sent),
        openRate: getNumberField(row, NEWS_FIELDS.openRate),
        clickRate: getNumberField(row, NEWS_FIELDS.clickRate),
        bounces: getNumberField(row, NEWS_FIELDS.bounces),
        unsubscribes: getNumberField(row, NEWS_FIELDS.unsubscribes),
        date: getField(row, NEWS_FIELDS.date),
        day: getField(row, NEWS_FIELDS.day),
        time: getField(row, NEWS_FIELDS.time),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.news - b.news);
}

function getNewsletterAverageWindow(newsRows, selectedNews) {
  return newsRows
    .filter((row) => row.news <= Number(selectedNews))
    .sort((a, b) => b.news - a.news)
    .slice(0, 12)
    .sort((a, b) => a.news - b.news);
}

function medianNewsletterValue(rows, key) {
  const values = rows
    .map((row) => Number(row?.[key]))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
  if (!values.length) return null;
  const middle = Math.floor(values.length / 2);
  return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
}

function addRollingNewsletterMedian(rows, valueKey, outputKey, windowSize = 12) {
  return rows.map((row, index, array) => {
    const previousRows = array.slice(Math.max(0, index - windowSize), index);
    return {
      ...row,
      [outputKey]: medianNewsletterValue(previousRows, valueKey),
    };
  });
}

function getPreviousNewsletter(newsRows, selectedNews) {
  const previousRows = [...newsRows]
    .filter((row) => row.news < Number(selectedNews))
    .sort((a, b) => b.news - a.news);
  return previousRows[0] || null;
}

function getNewsletterStats(newsRows, selectedNews) {
  const selected = newsRows.find((row) => Number(row.news) === Number(selectedNews)) || null;
  const previous = getPreviousNewsletter(newsRows, selectedNews);
  const averageRows = getNewsletterAverageWindow(newsRows, selectedNews);
  return { selected, previous, averageRows };
}

function getEmailDomain(email) {
  const raw = String(email || "").trim().toLowerCase();
  const parts = raw.split("@");
  return parts.length > 1 ? parts.pop().replace(/^www\./, "") : "unknown";
}

function getUrlDomain(url) {
  const raw = String(url || "").trim();
  if (!raw) return "unknown";

  try {
    const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return parsed.hostname.toLowerCase().replace(/^www\./, "");
  } catch (error) {
    return raw
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0]
      .toLowerCase() || "unknown";
  }
}

function countTopDomains(rows, getDomain, limit = 10) {
  const counts = new Map();
  rows.forEach((row) => {
    const domain = getDomain(row);
    if (!domain || domain === "unknown") return;
    counts.set(domain, (counts.get(domain) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([domain, clicks]) => ({ domain, clicks }))
    .sort((a, b) => b.clicks - a.clicks || a.domain.localeCompare(b.domain))
    .slice(0, limit);
}

function buildNewsletterClickWindow(clickRows, selectedNewsletter) {
  if (!selectedNewsletter) return [];

  const sentDate = parsePostDate(selectedNewsletter.date);
  if (!sentDate) return [];

  const start = new Date(sentDate.getFullYear(), sentDate.getMonth(), sentDate.getDate(), 0, 0, 0, 0);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  end.setHours(23, 59, 59, 999);

  return clickRows.filter((row) => {
    const clickedDate = parseNewsletterClickDate(row.clickedAt);
    return clickedDate && clickedDate >= start && clickedDate <= end;
  });
}

function buildNewsletterClickDomainData(clickRows, selectedNewsletter) {
  const windowRows = buildNewsletterClickWindow(clickRows, selectedNewsletter);
  return {
    clickRows: windowRows,
    readerDomains: countTopDomains(windowRows, (row) => getEmailDomain(row.emailAddress), 10),
    destinationDomains: countTopDomains(windowRows, (row) => getUrlDomain(row.clickedLinkAddress), 10),
  };
}

function findEditionColumnIndex(matrix, selectedNews) {
  const targetNumber = Number(selectedNews);
  const headerRow = matrix.find((row) => {
    const firstCell = normalizeText(row[0]);
    const hasEditionLabel = firstCell.includes("metrica") || firstCell.includes("metric") || firstCell.includes("edicao") || firstCell.includes("edition");
    const sequentialMatches = row.slice(1, 14).filter((value, index) => Number(value) === index + 1).length;
    return hasEditionLabel || sequentialMatches >= 3;
  });

  if (headerRow) {
    for (let index = 1; index < headerRow.length; index += 1) {
      const value = headerRow[index];
      if (Number(value) === targetNumber) return index;
      if (normalizeText(value) === normalizeText(`News ${selectedNews}`)) return index;
    }
  }

  return matrix[0] && matrix[0].length > targetNumber ? targetNumber : -1;
}

function findPreviousEditionColumnIndex(matrix, selectedNews, selectedColumnIndex) {
  const previousNumber = Number(selectedNews) - 1;
  const targetText = normalizeText(`News ${previousNumber}`);
  const searchRows = matrix.slice(0, Math.min(matrix.length, 5));

  for (const row of searchRows) {
    for (let index = 1; index < row.length; index += 1) {
      const value = row[index];
      if (Number(value) === previousNumber) return index;
      if (normalizeText(value) === targetText) return index;
    }
  }

  return selectedColumnIndex > 1 ? selectedColumnIndex - 1 : -1;
}

function isPercentMetricLabel(label) {
  const normalized = normalizeText(label);
  return normalized.includes("rate") || normalized.includes("percent") || normalized.includes("percentage") || normalized.includes("taxa");
}

function buildLinkedInEditionMetrics(matrix, selectedNews) {
  const selectedColumnIndex = findEditionColumnIndex(matrix, selectedNews);
  if (selectedColumnIndex === -1) return [];

  const previousColumnIndex = findPreviousEditionColumnIndex(matrix, selectedNews, selectedColumnIndex);

  return matrix
    .map((row, index) => {
      const label = String(row[0] || "").trim();
      const normalizedLabel = normalizeText(label);
      const value = row[selectedColumnIndex];
      const previous = previousColumnIndex >= 0 ? row[previousColumnIndex] : undefined;
      if (!label || index === 0 || normalizedLabel === "news" || normalizedLabel === "analysis") return null;
      if (value === undefined || value === null || value === "") return null;
      return {
        label,
        value: toNumber(value),
        previous: previous === undefined || previous === null || previous === "" ? undefined : toNumber(previous),
        isPercent: isPercentMetricLabel(label),
      };
    })
    .filter(Boolean);
}

function getEditionNumberFromColumn(matrix, columnIndex) {
  const searchRows = matrix.slice(0, Math.min(matrix.length, 5));

  for (const row of searchRows) {
    const value = row[columnIndex];
    const numericValue = Number(value);
    if (numericValue && Number.isFinite(numericValue)) return numericValue;

    const parts = String(value || "").split(" ");
    for (const part of parts) {
      const number = Number(part);
      if (number && Number.isFinite(number)) return number;
    }
  }

  return columnIndex;
}

function buildLinkedInMetricSeries(matrix, selectedNews, rowNumber, valueKey) {
  const metricRow = matrix[rowNumber - 1] || [];
  const selectedColumnIndex = findEditionColumnIndex(matrix, selectedNews);
  if (selectedColumnIndex === -1 || !metricRow.length) return [];

  const rows = [];
  for (let index = 1; index <= selectedColumnIndex; index += 1) {
    const edition = getEditionNumberFromColumn(matrix, index);
    if (edition > Number(selectedNews)) continue;
    rows.push({
      news: edition,
      [valueKey]: toNumber(metricRow[index]),
    });
  }

  return addMovingAverage(rows.sort((a, b) => a.news - b.news).slice(-12), valueKey, "movingAvg", 12);
}

function getLinkedInAnalysis(matrix, selectedNews) {
  if (!matrix || !matrix.length) return "";

  const targetEdition = Number(selectedNews);
  const directColumnIndex = targetEdition;
  const detectedColumnIndex = findEditionColumnIndex(matrix, targetEdition);
  const possibleColumnIndexes = [directColumnIndex, detectedColumnIndex]
    .filter((value, index, array) => Number.isFinite(value) && value >= 0 && array.indexOf(value) === index);

  const analysisRow = matrix.find((row) => normalizeText(row[0]) === "analysis");
  if (!analysisRow) return "";

  for (const columnIndex of possibleColumnIndexes) {
    const value = analysisRow[columnIndex];
    const valueText = String(value ?? "").trim();
    if (valueText && valueText !== "0") return valueText;
  }

  const editionPattern = new RegExp(`(^|\D)${targetEdition}(\D|$)`);
  const valueFromRow = analysisRow.find((cell, index) => {
    if (index === 0) return false;
    const valueText = String(cell ?? "").trim();
    if (!valueText || valueText === "0") return false;
    return editionPattern.test(valueText);
  });

  return valueFromRow ? String(valueFromRow).trim() : "";
}

function getStoredValue(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch (error) {
    return fallback;
  }
}

function setStoredValue(key, value) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch (error) {
    // localStorage can be blocked in preview environments.
  }
}

function buildPublishedPostMetrics(rows) {
  const totalPosts = rows.length;
  const impressions = rows.reduce((acc, row) => acc + getNumberField(row, POST_FIELDS.impressions), 0);
  const clicks = rows.reduce((acc, row) => acc + getNumberField(row, POST_FIELDS.clicks), 0);
  const likes = rows.reduce((acc, row) => acc + getNumberField(row, POST_FIELDS.likes), 0);
  const comments = rows.reduce((acc, row) => acc + getNumberField(row, POST_FIELDS.comments), 0);
  const shares = rows.reduce((acc, row) => acc + getNumberField(row, POST_FIELDS.shares), 0);
  const engagements = likes + comments + shares;
  return { totalPosts, impressions, clicks, likes, comments, shares, engagements };
}

function buildMonthlyPostAverages(posts) {
  const totalPosts = posts.length || 1;
  return posts.reduce((acc, post) => ({
    impressions: acc.impressions + (Number(post.impressions) || 0) / totalPosts,
    clicks: acc.clicks + (Number(post.clicks) || 0) / totalPosts,
    likes: acc.likes + (Number(post.likes) || 0) / totalPosts,
    comments: acc.comments + (Number(post.comments) || 0) / totalPosts,
    shares: acc.shares + (Number(post.shares) || 0) / totalPosts,
    engagements: acc.engagements + (Number(post.engagements) || 0) / totalPosts,
  }), {
    impressions: 0,
    clicks: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    engagements: 0,
  });
}

function runDevTests() {
  console.assert(normalizeValue("34,3%") === 0.343, "normalizeValue should convert Brazilian percentage format to decimal.");
  console.assert(normalizeValue("34.3%") === 0.343, "normalizeValue should convert dot-based percentage format to decimal.");
  console.assert(normalizeValue("5.3%") === 0.053, "normalizeValue should convert dot-based click rate to decimal.");
  console.assert(normalizeValue("1.234") === 1234, "normalizeValue should convert Brazilian thousands format.");
  console.assert(getNumberField({ Impressões: 123 }, POST_FIELDS.impressions) === 123, "getNumberField should read numbers.");
  console.assert(parsePostDate("03/30/2026")?.getFullYear() === 2026, "parsePostDate should read MM/DD/YYYY dates.");
  console.assert(parsePostDate("Date(2026,2,30)")?.getMonth() === 2, "parsePostDate should read Google Sheets Date(...) values.");
  console.assert(formatPercent(0.1027) === "10.3%", "formatPercent should round using the official app locale.");
  console.assert(categoryMatches("Reações", ["reactions", "reações"]), "categoryMatches should compare accented text.");
  console.assert(replaceUnsupportedCanvasColor("oklch(0.7 0.1 240)", "#FFFFFF") === "#FFFFFF", "PDF export should replace unsupported oklch colors.");
  console.assert(replaceUnsupportedCanvasColor("OKLCH(0.7 0.1 240)", "#FFFFFF") === "#FFFFFF", "PDF export should replace uppercase OKLCH colors.");

  const sampleRows = [
    { Impressões: 100, Cliques: 10, Gostaram: 8, Comentários: 1, Compartilhamentos: 1 },
    { Impressões: 200, Cliques: 20, Gostaram: 10, Comentários: 2, Compartilhamentos: 3 },
  ];
  const metrics = buildPublishedPostMetrics(sampleRows);
  console.assert(metrics.totalPosts === 2, "buildPublishedPostMetrics should count posts.");
  console.assert(metrics.impressions === 300, "buildPublishedPostMetrics should sum impressions.");
  console.assert(metrics.engagements === 25, "buildPublishedPostMetrics should sum engagements.");

  const averages = buildMonthlyPostAverages([{ impressions: 100, clicks: 10, likes: 2, comments: 1, shares: 1, engagements: 4 }, { impressions: 300, clicks: 30, likes: 6, comments: 3, shares: 3, engagements: 12 }]);
  console.assert(averages.impressions === 200, "Monthly post averages should calculate impressions average.");
  console.assert(averages.engagements === 8, "Monthly post averages should calculate engagement average.");

  const generalSample = [
    ["Year", 2026, 2026, 2026],
    ["Month", 1, 2, 3],
    ["Reactions", 10, 20, 30],
    ["Impressions", 100, 200, 300],
    ["Engagement rate", 0.1, 0.2, 0.3],
    ["Analysis", 0, 0, 0],
    ["Published Posts", "Jan", "Feb", "Mar"],
  ];
  console.assert(buildDashboardMetrics(generalSample, 2026, 3).find((item) => item.key === "reactions")?.value === 30, "Dashboard should fetch data by month number.");
  console.assert(buildGeneralMetricTimeSeries(generalSample, 2026, 3, ["Impressions"], 12).at(-1)?.value === 300, "Historical series should fetch metrics from General Data.");
  console.assert(buildGeneralAnalysis(generalSample, [], 2026, 3, "Published Posts") === "Mar", "Analysis should fetch text from the exact month column.");

  const dailyRowsSample = [
    { Data: "04/01/2026", "Impressões (orgânicas)": 281 },
    { Data: "04/02/2026", "Impressões (orgânicas)": 261 },
    { Data: "03/01/2026", "Impressões (orgânicas)": 999 },
  ];
  const dailyParsed = buildDailyOrganicImpressions(dailyRowsSample, 2026, 4);
  console.assert(dailyParsed.length === 2, "Daily data should filter by selected month.");
  console.assert(dailyParsed[0].impressions === 281, "Daily data should read organic impressions.");

  const cardRows = [{ "Título da publicação": "One two three four five six seven eight", Criação: "04/01/2026", Imagens: "https://res.cloudinary.com/demo/image/upload/sample.jpg" }];
  const cards = buildPublishedPostCards(cardRows);
  console.assert(cards[0].shortTitle === "One two three four five six seven...", "Card should truncate title to seven words.");
  console.assert(cards[0].imageUrl.includes("cloudinary"), "Card should preserve the Cloudinary URL.");
  const cardWithoutImage = buildPublishedPostCards([{ "Título da publicação": "Post without image", Criação: "04/01/2026", Imagens: "" }]);
  console.assert(cardWithoutImage[0].imageUrl === DEFAULT_POST_IMAGE_URL, "Card should use the default NILIT image when the post image is missing.");

  const newsletterSample = buildNewsletterRows([
    { News: 11, Sent: 2532, "Open Rate": "34.3%", "Click Rate": "5.3%", Bounces: 79, Unsubscribes: 4 },
    { News: 10, Sent: 2261, "Open Rate": "34.9%", "Click Rate": "7.7%", Bounces: 60, Unsubscribes: 0 },
    { News: 9, Sent: 2400, "Open Rate": "35.0%", "Click Rate": "4.0%", Bounces: 50, Unsubscribes: 1 },
  ]);
  const news9 = newsletterSample.find((row) => row.news === 9);
  const news10 = newsletterSample.find((row) => row.news === 10);
  const news11 = newsletterSample.find((row) => row.news === 11);
  console.assert(newsletterSample.length === 3, "Newsletter should keep all three test editions.");
  console.assert(news9?.openRate === 0.35, "Newsletter should sort by edition ascending.");
  console.assert(news11?.clickRate === 0.053, "Newsletter should convert dot-based Click Rate values.");
  console.assert(getNewsletterStats(newsletterSample, 11).selected?.news === 11, "Newsletter should select the right edition.");
  console.assert(getNewsletterStats(newsletterSample, 11).previous?.news === 10, "Newsletter should compare with the previous edition.");
  console.assert(news10?.sent === 2261, "Newsletter should preserve previous edition values.");
  const newsletterWindow = getNewsletterAverageWindow(newsletterSample, 11);
  const newsletterWithMedian = addRollingNewsletterMedian(newsletterWindow, "clickRate", "clickRateMedian", 12);
  const medianNews9 = newsletterWithMedian.find((row) => row.news === 9);
  const medianNews10 = newsletterWithMedian.find((row) => row.news === 10);
  const medianNews11 = newsletterWithMedian.find((row) => row.news === 11);
  console.assert(medianNews9?.clickRateMedian === null, "First edition should not have a previous rolling median.");
  console.assert(Math.abs((medianNews10?.clickRateMedian ?? 0) - 0.04) < 0.00001, "Second edition should use only the first edition in the rolling median.");
  console.assert(Math.abs((medianNews11?.clickRateMedian ?? 0) - 0.0585) < 0.00001, "Third edition should use the two previous editions in the rolling median.");
  const linkedInAnalysisSample = [
    ["Métrica/Edição", 1, 2, 3],
    ["New Subscribers", 0, 0, 0],
    ["Impressions", 100, 200, 300],
    ["Unique Impressions", 50, 100, 150],
    ["Clicks", 5, 10, 15],
    ["Engagement Rate", "1%", "2%", "3%"],
    ["Views", 20, 30, 40],
    ["E-mails Sent", 100, 200, 300],
    ["Open Rate (e-mail)", "20%", "21%", "22%"],
    ["Analysis", "Analysis 1", "Analysis 2", "Analysis 3"],
  ];
  console.assert(getLinkedInAnalysis(linkedInAnalysisSample, 3) === "Analysis 3", "LinkedIn analysis should read row 10 for the selected edition.");

  const linkedInScreenshotShape = [
    ["Métrica/Edição", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    ["New Subscribers", 0, 0, 0, 0, 0, 0, 0, 0, 0, 88, 21, 29],
    ["Impressions", 0, 0, 0, 0, 0, 0, 0, 0, 0, 759, 1000, 718],
    ["Unique Impressions", 0, 0, 0, 0, 0, 0, 0, 0, 0, 443, 487, 315],
    ["Clicks", 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 32, 7],
    ["Engagement Rate", 0, 0, 0, 0, 0, 0, 0, 0, 0, "8.40%", "7.00%", "4.70%"],
    ["Views", 0, 0, 0, 0, 0, 0, 0, 0, 0, 522, 549, 496],
    ["E-mails Sent", 0, 0, 0, 0, 0, 0, 0, 0, 0, 1084, 1174, 1196],
    ["Open Rate (e-mail)", 0, 0, 0, 0, 0, 0, 0, 0, 0, "28%", "29%", "28%"],
    ["Analysis", 0, 0, 0, 0, 0, 0, 0, 0, 0, "Análise 10", "Análise 11", "Análise 12"],
  ];
  console.assert(getLinkedInAnalysis(linkedInScreenshotShape, 11) === "Análise 11", "LinkedIn analysis should read column L for edition 11 in the screenshot layout.");
  console.assert(typeof HistoricalCharts === "function", "HistoricalCharts should be defined before use.");
}

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const storedTab = getStoredValue("nilit_active_tab", "Dashboard");
    if (storedTab === "PULSE E-mail") return "PULSE";
    if (storedTab === "Metrics" || storedTab === "PULSE LinkedIn") return "Dashboard";
    return TABS.includes(storedTab) ? storedTab : "Dashboard";
  });
  const [postRows, setPostRows] = useState([]);
  const [dailyRows, setDailyRows] = useState([]);
  const [newsletterRows, setNewsletterRows] = useState([]);
  const [newsletterClickRows, setNewsletterClickRows] = useState([]);
  const [linkedinMatrix, setLinkedinMatrix] = useState([]);
  const [linkedinAnalysisText, setLinkedinAnalysisText] = useState("");
  const [generalMatrix, setGeneralMatrix] = useState([]);
  const [generalAnalysisMatrix, setGeneralAnalysisMatrix] = useState([]);
  const [year, setYear] = useState(() => Number(getStoredValue("nilit_year", 2026)));
  const [month, setMonth] = useState(() => Number(getStoredValue("nilit_month", 3)));
  const [selectedNews, setSelectedNews] = useState(() => Number(getStoredValue("nilit_selected_news", 11)));
  const [status, setStatus] = useState("Loading spreadsheet data...");
  const [lastUpdate, setLastUpdate] = useState("");
  const exportRootRef = useRef(null);
  const pdfBlobRef = useRef(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState("");
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");

  useEffect(() => {
    runDevTests();
    loadAllSheets();
  }, []);

  useEffect(() => {
    setStoredValue("nilit_active_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    setStoredValue("nilit_year", year);
  }, [year]);

  useEffect(() => {
    setStoredValue("nilit_month", month);
  }, [month]);

  useEffect(() => {
    setStoredValue("nilit_selected_news", selectedNews);
  }, [selectedNews]);

  useEffect(() => {
    loadLinkedInAnalysisForSelectedNews(selectedNews);
  }, [selectedNews]);

  async function loadLinkedInAnalysisForSelectedNews(newsEdition) {
    try {
      const analysis = await fetchLinkedInAnalysisCell(newsEdition);
      setLinkedinAnalysisText(analysis);
    } catch (error) {
      console.error(error);
      setLinkedinAnalysisText("");
    }
  }

  async function loadAllSheets() {
    try {
      setStatus("Loading data from Posts, Daily Data, Email News, LinkedIn News, Clicks, and General Data sheets...");
      const [posts, daily, newsletter, newsletterClicks, linkedin, general, generalAnalysis] = await Promise.all([
        fetchPublishedPostsSheet(),
        fetchDailySheet(),
        fetchNewsletterSheet(),
        fetchNewsletterClicksSheet(),
        fetchLinkedInSheet(),
        fetchSheet(GENERAL_SHEET, { range: "A:AZ" }),
        fetchSheet(GENERAL_SHEET, { range: "A18:AZ25" }),
      ]);

      setPostRows(posts.rows);
      setDailyRows(daily.rows);
      setNewsletterClickRows(newsletterClicks.rows);
      setLinkedinMatrix(linkedin.matrix);
      const analysisCell = await fetchLinkedInAnalysisCell(selectedNews);
      setLinkedinAnalysisText(analysisCell);
      const parsedNewsletterRows = buildNewsletterRows(newsletter.rows);
      setNewsletterRows(parsedNewsletterRows);
      if (parsedNewsletterRows.length && !parsedNewsletterRows.some((row) => Number(row.news) === Number(selectedNews))) {
        setSelectedNews(parsedNewsletterRows[parsedNewsletterRows.length - 1].news);
      }
      setGeneralMatrix(general.matrix);
      setGeneralAnalysisMatrix(generalAnalysis.matrix);
      setLastUpdate(new Date().toLocaleString("en-US"));
      setStatus("Data loaded successfully.");
    } catch (error) {
      console.error(error);
      setStatus("Error loading data. Check whether the spreadsheet is public and whether the required sheets exist.");
    }
  }

  async function triggerPdfDownload(blob, fileName, options = {}) {
    if (!blob) {
      setStatus("PDF is not available yet. Please export it again.");
      return false;
    }

    const safeFileName = fileName || "nilit-communication-results.pdf";

    if (options.useFilePicker && window.showSaveFilePicker) {
      try {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: safeFileName,
          types: [
            {
              description: "PDF document",
              accept: { "application/pdf": [".pdf"] },
            },
          ],
        });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        setStatus("PDF saved successfully.");
        setPdfProgress("PDF saved successfully.");
        return true;
      } catch (filePickerError) {
        if (filePickerError?.name === "AbortError") return false;
        console.warn("File picker download failed; falling back to browser download.", filePickerError);
      }
    }

    const objectUrl = URL.createObjectURL(blob);

    try {
      const downloadLink = document.createElement("a");
      downloadLink.href = objectUrl;
      downloadLink.download = safeFileName;
      downloadLink.target = "_blank";
      downloadLink.rel = "noopener noreferrer";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      if (options.openPreview) {
        window.setTimeout(() => {
          window.open(objectUrl, "_blank", "noopener,noreferrer");
        }, 150);
      }

      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      return true;
    } catch (downloadError) {
      console.warn("Direct download failed; trying to open PDF in a new tab.", downloadError);
      try {
        window.open(objectUrl, "_blank", "noopener,noreferrer");
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
        return true;
      } catch (openError) {
        URL.revokeObjectURL(objectUrl);
        setStatus("The browser blocked the PDF download. Try the deployed Vercel version or allow pop-ups/downloads for this page.");
        setPdfProgress("PDF download was blocked by the browser.");
        return false;
      }
    }
  }

  async function handleManualPdfDownload() {
    const downloaded = await triggerPdfDownload(pdfBlobRef.current, pdfFileName || "nilit-communication-results.pdf", {
      useFilePicker: true,
      openPreview: true,
    });

    if (downloaded) {
      setStatus("PDF download requested. If nothing appears, check your browser downloads bar or pop-up blocker.");
      setPdfProgress("PDF download requested.");
    }
  }

  async function handleExportPdf() {
    if (!exportRootRef.current || isExportingPdf) return;

    try {
      if (pdfDownloadUrl) URL.revokeObjectURL(pdfDownloadUrl);
      setPdfDownloadUrl("");
      setPdfFileName("");
      pdfBlobRef.current = null;
      setIsExportingPdf(true);
      setPdfProgress("Preparing PDF export...");
      setStatus("Preparing PDF export...");
      await waitForBrowserPaint(250);

      const sections = Array.from(exportRootRef.current.querySelectorAll("[data-pdf-section]"));
      if (!sections.length) {
        setStatus("PDF export failed: no export sections were found.");
        return;
      }

      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4", compress: true });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const contentWidth = pageWidth - margin * 2;
      let isFirstPage = true;

      for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
        const section = sections[sectionIndex];
        const sectionTitle = getPdfSectionTitle(section, `Section ${sectionIndex + 1}`);
        const progressMessage = `Capturing ${sectionTitle} (${sectionIndex + 1}/${sections.length})...`;
        setPdfProgress(progressMessage);
        setStatus(progressMessage);
        await waitForBrowserPaint(120);

        let canvas;
        try {
          canvas = await capturePdfSafeCanvas(section, { scale: 1.25 });
        } catch (captureError) {
          console.error(captureError);
          throw new Error(`PDF export failed while capturing ${sectionTitle}.`);
        }

        const pageContentHeightInCanvas = Math.floor((pageHeight - margin * 2) * (canvas.width / contentWidth));
        let sourceY = 0;
        let pageInSection = 1;

        while (sourceY < canvas.height) {
          setPdfProgress(`Adding ${sectionTitle} page ${pageInSection}...`);
          await waitForBrowserPaint(20);

          if (!isFirstPage) pdf.addPage();
          isFirstPage = false;

          const sliceHeight = Math.min(pageContentHeightInCanvas, canvas.height - sourceY);
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceHeight;

          const context = sliceCanvas.getContext("2d");
          if (!context) throw new Error("Could not create PDF canvas context.");
          context.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

          const imageData = sliceCanvas.toDataURL("image/jpeg", 0.88);
          const imageHeight = (sliceHeight * contentWidth) / canvas.width;
          pdf.addImage(imageData, "JPEG", margin, margin, contentWidth, imageHeight);

          sourceY += sliceHeight;
          pageInSection += 1;
        }
      }

      setPdfProgress("Saving PDF...");
      setStatus("Saving PDF...");
      await waitForBrowserPaint(100);

      const monthSlug = String(month).padStart(2, "0");
      const fileName = `nilit-communication-results-${year}-${monthSlug}-news-${selectedNews}.pdf`;
      const pdfBlob = pdf.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      pdfBlobRef.current = pdfBlob;
      setPdfFileName(fileName);
      setPdfDownloadUrl(pdfUrl);

      await triggerPdfDownload(pdfBlob, fileName);

      setStatus("PDF exported successfully. If the automatic download is blocked, click Download / Open PDF below.");
      setPdfProgress("PDF ready for download.");
    } catch (error) {
      console.error(error);
      const message = error?.message || "Error exporting PDF. Try again after all images and charts finish loading.";
      setStatus(message);
      setPdfProgress(message);
    } finally {
      setIsExportingPdf(false);
      window.setTimeout(() => setPdfProgress(""), 5000);
    }
  }

  const availableYears = useMemo(() => {
    const years = new Set([2026]);
    postRows.forEach((row) => {
      const date = parsePostDate(getPostDateValue(row));
      if (date) years.add(date.getFullYear());
    });
    return [...years].sort((a, b) => b - a);
  }, [postRows]);

  const filteredPosts = useMemo(() => postRows.filter((row) => {
    const date = parsePostDate(getPostDateValue(row));
    return date && date.getFullYear() === Number(year) && date.getMonth() + 1 === Number(month);
  }), [postRows, year, month]);

  const monthLabel = MONTHS.find((item) => item.value === Number(month))?.label || "March";

  function renderTab() {
    if (activeTab === "Dashboard") {
      return <DashboardTab generalMatrix={generalMatrix} generalAnalysisMatrix={generalAnalysisMatrix} month={month} monthLabel={monthLabel} year={year} />;
    }
    if (activeTab === "Published Posts") {
      return <PublishedPostsTab rows={filteredPosts} dailyRows={dailyRows} generalMatrix={generalMatrix} generalAnalysisMatrix={generalAnalysisMatrix} month={month} year={year} />;
    }
    if (activeTab === "PULSE") {
      return <PulseTab rows={newsletterRows} clickRows={newsletterClickRows} linkedinMatrix={linkedinMatrix} selectedNews={selectedNews} linkedInAnalysis={linkedinAnalysisText} />;
    }
    return <NextStepsTab generalMatrix={generalMatrix} generalAnalysisMatrix={generalAnalysisMatrix} month={month} monthLabel={monthLabel} year={year} />;
  }

  function renderControlsBar() {
    if (activeTab === "PULSE") {
      const editions = newsletterRows.map((row) => row.news).sort((a, b) => b - a);
      const options = editions.length ? editions : [selectedNews];
      return (
        <section className="text-white" style={{ backgroundColor: BRAND_BLUE }}>
          <div className="mx-auto grid max-w-7xl gap-5 px-6 py-6 md:grid-cols-[280px_1fr] md:items-end">
            <label className="space-y-2">
              <span className="text-sm font-medium text-white/90">Newsletter edition</span>
              <select
                className="w-full rounded-xl border border-white/30 bg-white px-4 py-3 text-lg font-medium text-slate-900 shadow-sm outline-none"
                value={selectedNews}
                onChange={(event) => setSelectedNews(Number(event.target.value))}
              >
                {options.map((edition) => <option key={edition} value={edition}>News {edition}</option>)}
              </select>
            </label>
            <div className="hidden items-center gap-4 rounded-xl bg-white/10 p-4 md:flex">
              <Icon name="calendar" size={34} color="white" />
              <div>
                <p className="text-sm text-white/80">Selected edition</p>
                <p className="text-2xl font-bold">News {selectedNews}</p>
              </div>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="text-white" style={{ backgroundColor: BRAND_BLUE }}>
        <div className="mx-auto grid max-w-7xl gap-5 px-6 py-6 md:grid-cols-[280px_280px_1fr] md:items-end">
          <label className="space-y-2">
            <span className="text-sm font-medium text-white/90">Year</span>
            <select className="w-full rounded-xl border border-white/30 bg-white px-4 py-3 text-lg font-medium text-slate-900 shadow-sm outline-none" value={year} onChange={(event) => setYear(Number(event.target.value))}>
              {availableYears.map((availableYear) => <option key={availableYear} value={availableYear}>{availableYear}</option>)}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-white/90">Month</span>
            <select className="w-full rounded-xl border border-white/30 bg-white px-4 py-3 text-lg font-medium text-slate-900 shadow-sm outline-none" value={month} onChange={(event) => setMonth(Number(event.target.value))}>
              {MONTHS.map((monthItem) => <option key={monthItem.value} value={monthItem.value}>{monthItem.label}</option>)}
            </select>
          </label>
          <div className="hidden items-center gap-4 rounded-xl bg-white/10 p-4 md:flex">
            <Icon name="calendar" size={34} color="white" />
            <div>
              <p className="text-sm text-white/80">Selected period</p>
              <p className="text-2xl font-bold">{monthLabel} {year}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-900">
      <div className="h-2 w-full" style={{ backgroundColor: BRAND_BLUE }} />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-7">
            <NilitLogo />
            <div className="h-12 w-px bg-slate-300" />
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Communication Results</h1>
          </div>
          <AgencyBrand />
        </div>
        <nav className="border-t border-slate-100 bg-white">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
            <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
              {TABS.map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className="rounded-xl px-4 py-3 text-sm font-semibold transition" style={activeTab === tab ? { backgroundColor: BRAND_BLUE, color: "white" } : { color: DARK_GRAY }}>
                  {tab}
                </button>
              ))}
            </div>
            <LastUpdateBar lastUpdate={lastUpdate} onRefresh={loadAllSheets} />
          </div>
        </nav>
      </header>

      {renderControlsBar()}

      <main className="mx-auto max-w-7xl space-y-5 px-6 py-6">
        <div className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p>{status}</p>
            {pdfProgress ? <p className="mt-1 text-xs font-semibold" style={{ color: BRAND_BLUE }}>{pdfProgress}</p> : null}
            {pdfDownloadUrl ? (
              <button
                type="button"
                onClick={handleManualPdfDownload}
                className="mt-2 inline-flex rounded-md border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold transition hover:bg-blue-100"
                style={{ color: BRAND_BLUE }}
              >
                Download / Open PDF
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={loadAllSheets} className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90" style={{ backgroundColor: BRAND_BLUE }}>Load data</button>
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ color: BRAND_BLUE }}
            >
              {isExportingPdf ? "Exporting..." : "Export PDF"}
            </button>
          </div>
        </div>
        {renderTab()}
      </main>

      <PdfExportRoot
        ref={exportRootRef}
        year={year}
        month={month}
        monthLabel={monthLabel}
        selectedNews={selectedNews}
        filteredPosts={filteredPosts}
        dailyRows={dailyRows}
        newsletterRows={newsletterRows}
        newsletterClickRows={newsletterClickRows}
        linkedinMatrix={linkedinMatrix}
        linkedInAnalysis={linkedinAnalysisText}
        generalMatrix={generalMatrix}
        generalAnalysisMatrix={generalAnalysisMatrix}
      />
    </div>
  );
}

const PdfExportRoot = React.forwardRef(function PdfExportRoot({
  year,
  month,
  monthLabel,
  selectedNews,
  filteredPosts,
  dailyRows,
  newsletterRows,
  newsletterClickRows,
  linkedinMatrix,
  linkedInAnalysis,
  generalMatrix,
  generalAnalysisMatrix,
}, ref) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-[-10000px] top-0 w-[1200px] bg-[#F6F8FB] p-6 text-slate-900"
    >
      <section data-pdf-section data-pdf-title="Dashboard" className="mb-8 bg-[#F6F8FB] p-2">
        <PdfSectionHeader title="Dashboard" subtitle={`${monthLabel} ${year}`} />
        <DashboardTab generalMatrix={generalMatrix} generalAnalysisMatrix={generalAnalysisMatrix} month={month} monthLabel={monthLabel} year={year} />
      </section>

      <section data-pdf-section data-pdf-title="Published Posts" className="mb-8 bg-[#F6F8FB] p-2">
        <PdfSectionHeader title="Published Posts" subtitle={`${monthLabel} ${year}`} />
        <PublishedPostsTab rows={filteredPosts} dailyRows={dailyRows} generalMatrix={generalMatrix} generalAnalysisMatrix={generalAnalysisMatrix} month={month} year={year} />
      </section>

      <section data-pdf-section data-pdf-title="PULSE" className="mb-8 bg-[#F6F8FB] p-2">
        <PdfSectionHeader title="PULSE" subtitle={`News ${selectedNews}`} />
        <PulseTab rows={newsletterRows} clickRows={newsletterClickRows} linkedinMatrix={linkedinMatrix} selectedNews={selectedNews} linkedInAnalysis={linkedInAnalysis} />
      </section>

      <section data-pdf-section data-pdf-title="Next Steps" className="mb-8 bg-[#F6F8FB] p-2">
        <PdfSectionHeader title="Next Steps" subtitle={`${monthLabel} ${year}`} />
        <NextStepsTab generalMatrix={generalMatrix} generalAnalysisMatrix={generalAnalysisMatrix} month={month} monthLabel={monthLabel} year={year} />
      </section>
    </div>
  );
});

function PdfSectionHeader({ title, subtitle }) {
  return (
    <div className="mb-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
      <div className="flex items-center gap-5">
        <NilitLogo />
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Communication Results</p>
          <h1 className="text-3xl font-black text-slate-950">{title}</h1>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-slate-500">{subtitle}</p>
        <p className="mt-1 text-xs text-slate-400">Generated from the selected dashboard filters</p>
      </div>
    </div>
  );
}

function DashboardTab({ generalMatrix, generalAnalysisMatrix, month, monthLabel, year }) {
  const metrics = useMemo(() => buildDashboardMetrics(generalMatrix, year, month), [generalMatrix, year, month]);
  const analysis = useMemo(() => buildGeneralAnalysis(generalMatrix, generalAnalysisMatrix, year, month, "Dashboard"), [generalMatrix, generalAnalysisMatrix, year, month]);
  const impressionsHistory = useMemo(() => buildGeneralMetricTimeSeries(generalMatrix, year, month, ["Impressions", "Impressões", "Impressoes"], 12), [generalMatrix, year, month]);
  const impressionsWithAverage = useMemo(() => addMovingAverage(impressionsHistory, "value", "movingAvg", 12), [impressionsHistory]);
  const engagementHistory = useMemo(() => buildGeneralMetricTimeSeries(generalMatrix, year, month, ["Engagement rate", "Taxa de engajamento"], 12), [generalMatrix, year, month]);
  const engagementWithAverage = useMemo(() => addMovingAverage(engagementHistory, "value", "movingAvg", 12), [engagementHistory]);
  const followersHistory = useMemo(() => {
    const totalFollowers = buildGeneralMetricTimeSeries(generalMatrix, year, month, ["Followers", "Total followers", "Seguidores", "Total seguidores"], 12);
    const newFollowers = buildGeneralMetricTimeSeries(generalMatrix, year, month, ["New followers", "Novos seguidores"], 12);
    return totalFollowers.map((item) => {
      const match = newFollowers.find((candidate) => candidate.year === item.year && candidate.month === item.month);
      const followers = item.value;
      const newFollowersValue = match?.value ?? 0;
      return { ...item, followers, existingFollowers: Math.max(followers - newFollowersValue, 0), newFollowers: newFollowersValue };
    });
  }, [generalMatrix, year, month]);
  const leftMetrics = metrics.slice(0, 4);
  const rightMetrics = metrics.slice(4);

  return (
    <section className="space-y-6">
      <h2 className="text-4xl font-black tracking-tight text-slate-950">Dashboard – {MONTHS.find((item) => item.value === Number(month))?.label || monthLabel}</h2>
      <div className="grid gap-4 lg:grid-cols-[210px_1fr]">
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-amber-100/80 p-4 shadow-sm ring-1 ring-white/60" style={{ backgroundColor: CREAM }}>{leftMetrics.slice(0, 2).map((metric) => <DashboardMetric key={metric.key} metric={metric} />)}</div>
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-amber-100/80 p-4 shadow-sm ring-1 ring-white/60" style={{ backgroundColor: CREAM }}>{leftMetrics.slice(2, 4).map((metric) => <DashboardMetric key={metric.key} metric={metric} />)}</div>
        </div>
        <div className="rounded-2xl border border-amber-100/80 p-5 shadow-sm ring-1 ring-white/60" style={{ backgroundColor: CREAM }}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">{rightMetrics.map((metric) => <DashboardMetric key={metric.key} metric={metric} large />)}</div>
          <p className="mt-4 border-t border-amber-200/70 pt-3 text-center text-xs font-medium text-slate-500">Comparative values after the slash refer to the previous month.</p>
        </div>
      </div>
      <HistoricalCharts impressionsWithAverage={impressionsWithAverage} engagementWithAverage={engagementWithAverage} followersHistory={followersHistory} />
      <AnalysisBlock text={analysis} />
      <p className="text-xs italic text-slate-600">*Numbers count every interaction made with posts on the page during the month, including posts from previous months.</p>
    </section>
  );
}

function DashboardMetric({ metric, large = false }) {
  const currentValue = formatDashboardNumber(metric.value, metric.isPercent);
  const previousValue = metric.previous === undefined || metric.previous === null
    ? "—"
    : formatDashboardNumber(metric.previous, metric.isPercent);

  return (
    <div className="flex min-w-0 flex-col items-center justify-center rounded-xl px-2 py-3 text-center transition">
      <p className="min-h-[2rem] text-xs font-medium leading-tight text-slate-700 underline decoration-red-500 decoration-wavy underline-offset-4">{metric.label}</p>
      <p className={`${large ? "text-3xl" : "text-2xl"} mt-2 flex flex-wrap items-baseline justify-center gap-x-1 gap-y-0.5 font-black leading-none text-black`}>
        <span>{currentValue}</span>
        {metric.showPrevious ? (
          <span className="text-sm font-bold leading-none text-slate-400">/ {previousValue}</span>
        ) : null}
      </p>
    </div>
  );
}

function PostPointLabel({ x, y, value, payload }) {
  if (!value || x === undefined || y === undefined) return null;
  const day = Number(payload?.day || 0);
  const lines = String(value).split("\n");
  const line1 = lines[0] || "";
  const line2 = lines[1] || "...";
  const textAnchor = day < 15 ? "start" : day > 15 ? "end" : "middle";
  const labelX = day < 15 ? x + 10 : day > 15 ? x - 10 : x;
  const verticalOffset = day % 2 === 0 ? 34 : 18;
  const labelY = y - verticalOffset;
  const maxChars = Math.max(line1.length, line2.length);
  const boxWidth = Math.max(72, maxChars * 6.2 + 16);
  const boxHeight = 34;
  const boxX = textAnchor === "start" ? labelX - 6 : textAnchor === "end" ? labelX - boxWidth + 6 : labelX - boxWidth / 2;
  const boxY = labelY - 14;
  return (
    <g>
      <rect x={boxX} y={boxY} width={boxWidth} height={boxHeight} rx={6} fill="white" stroke="#E5E7EB" opacity={0.94} />
      <text x={labelX} y={labelY} textAnchor={textAnchor} fontSize={11} fontWeight={700} fill={DARK_GRAY}>
        <tspan x={labelX} dy="0">{line1}</tspan>
        <tspan x={labelX} dy="13">{line2}</tspan>
      </text>
    </g>
  );
}

function PublishedPostsTab({ rows, dailyRows, generalMatrix, generalAnalysisMatrix, month, year }) {
  const postCards = useMemo(() => buildPublishedPostCards(rows), [rows]);
  const postLabelsByDate = useMemo(() => buildPostLabelsByDate(rows), [rows]);
  const dailyOrganicImpressions = useMemo(() => {
    return buildDailyOrganicImpressions(dailyRows, year, month).map((item) => ({
      ...item,
      postLabel: postLabelsByDate[formatDateKey(item.date)] || "",
    }));
  }, [dailyRows, year, month, postLabelsByDate]);
  const publishedPostsAnalysis = useMemo(() => buildGeneralAnalysis(generalMatrix, generalAnalysisMatrix, year, month, "Published Posts"), [generalMatrix, generalAnalysisMatrix, year, month]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-1"><h2 className="text-2xl font-bold text-slate-950">Published Posts</h2></div>
      <ChartCard title="Organic impressions/clicks per day">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={dailyOrganicImpressions} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis tickFormatter={(value) => formatNumber(value)} />
            <Tooltip formatter={(value) => formatNumber(value)} labelFormatter={(label) => `Day ${label}`} />
            <Legend />
            <Line type="monotone" dataKey="impressions" name="Organic impressions" stroke={BRAND_BLUE} strokeWidth={3} dot={{ r: 4, fill: "white", stroke: BRAND_BLUE, strokeWidth: 2 }} activeDot={{ r: 6 }}>
              <LabelList dataKey="postLabel" content={<PostPointLabel />} />
            </Line>
            <Line type="monotone" dataKey="clicks" name="Organic clicks" stroke="#6B7280" strokeWidth={2} dot={{ r: 3, fill: "white", stroke: "#6B7280", strokeWidth: 2 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <PostCardsList posts={postCards} />
      <AnalysisBlock text={publishedPostsAnalysis || "Analysis has not been added for this period yet."} />
    </section>
  );
}

function PulseTab({ rows, clickRows = [], linkedinMatrix = [], selectedNews, linkedInAnalysis = "" }) {

  return (
    <section className="space-y-8">
      <PulseLinkedInSection matrix={linkedinMatrix} selectedNews={selectedNews} />
      <PulseEmailSection rows={rows} clickRows={clickRows} selectedNews={selectedNews} />
      <AnalysisBlock text={linkedInAnalysis || "LinkedIn analysis has not been added for the selected edition yet."} />
    </section>
  );
}

function PulseLinkedInSection({ matrix = [], selectedNews }) {
  const metrics = useMemo(() => buildLinkedInEditionMetrics(matrix, selectedNews), [matrix, selectedNews]);
  const impressionsSeries = useMemo(() => buildLinkedInMetricSeries(matrix, selectedNews, 3, "impressions"), [matrix, selectedNews]);
  const openRateSeries = useMemo(() => buildLinkedInMetricSeries(matrix, selectedNews, 9, "openRate"), [matrix, selectedNews]);

  if (!matrix.length) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <h2 className="text-2xl font-bold text-slate-950">PULSE - LINKEDIN</h2>
        <p className="mt-2 text-slate-500">LinkedIn newsletter data has not been loaded yet.</p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-1"><h2 className="text-2xl font-bold text-slate-950">PULSE - LINKEDIN</h2></div>
      {metrics.length ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
            {metrics.map((metric) => (
              <NewsletterKpi key={metric.label} label={metric.label} value={metric.value} previous={metric.previous} isPercent={metric.isPercent} />
            ))}
          </div>
          <p className="text-xs text-slate-500">Values after the slash compare the selected edition with the immediately previous edition.</p>
        </>
      ) : (
        <EmptyChartMessage message="No LinkedIn data found for the selected edition." />
      )}

      <ChartCard title="LinkedIn Impressions — last editions">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={impressionsSeries} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="news" tickFormatter={(value) => `News ${value}`} />
            <YAxis tickFormatter={(value) => formatNumber(value)} />
            <Tooltip formatter={(value) => formatNumber(value)} labelFormatter={(label) => `News ${label}`} />
            <Legend />
            <Line type="monotone" dataKey="impressions" name="Impressions" stroke={BRAND_BLUE} strokeWidth={3} dot={{ r: 4, fill: "white", stroke: BRAND_BLUE, strokeWidth: 2 }} />
            <Line type="monotone" dataKey="movingAvg" name="Moving average" stroke="#6B7280" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-2 text-xs text-slate-600">Blue line: Impressions | Gray line: moving average of up to 12 editions</div>
      </ChartCard>

      <ChartCard title="LinkedIn Open Rate — last editions">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={openRateSeries} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="news" tickFormatter={(value) => `News ${value}`} />
            <YAxis tickFormatter={(value) => formatPercent(value)} />
            <Tooltip formatter={(value) => formatPercent(value)} labelFormatter={(label) => `News ${label}`} />
            <Legend />
            <Line type="monotone" dataKey="openRate" name="Open Rate" stroke={BRAND_BLUE} strokeWidth={3} dot={{ r: 4, fill: "white", stroke: BRAND_BLUE, strokeWidth: 2 }} />
            <Line type="monotone" dataKey="movingAvg" name="Moving average" stroke="#6B7280" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-2 text-xs text-slate-600">Blue line: Open Rate | Gray line: moving average of up to 12 editions</div>
      </ChartCard>
    </section>
  );
}

function PulseEmailSection({ rows, clickRows = [], selectedNews }) {
  const stats = useMemo(() => getNewsletterStats(rows, selectedNews), [rows, selectedNews]);
  const chartRows = useMemo(() => {
    const baseRows = getNewsletterAverageWindow(rows, selectedNews);
    const withOpenMedian = addRollingNewsletterMedian(baseRows, "openRate", "openRateMedian", 12);
    return addRollingNewsletterMedian(withOpenMedian, "clickRate", "clickRateMedian", 12);
  }, [rows, selectedNews]);
  const clickDomainData = useMemo(() => buildNewsletterClickDomainData(clickRows, stats.selected), [clickRows, stats.selected]);

  if (!rows.length) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
        <h2 className="text-2xl font-bold text-slate-950">PULSE - EMAIL</h2>
        <p className="mt-2 text-slate-500">Email newsletter data has not been loaded yet.</p>
      </section>
    );
  }

  const selected = stats.selected;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-1"><h2 className="text-2xl font-bold text-slate-950">PULSE - EMAIL</h2></div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
        <NewsletterKpi label="Sent" value={selected?.sent} previous={stats.previous?.sent} />
        <NewsletterKpi label="Open Rate" value={selected?.openRate} previous={stats.previous?.openRate} isPercent />
        <NewsletterKpi label="Click Rate" value={selected?.clickRate} previous={stats.previous?.clickRate} isPercent />
        <NewsletterKpi label="Bounces" value={selected?.bounces} previous={stats.previous?.bounces} />
        <NewsletterKpi label="Unsubscribes" value={selected?.unsubscribes} previous={stats.previous?.unsubscribes} />
      </div>
      <p className="text-xs text-slate-500">Values after the slash compare the selected edition with the immediately previous edition.</p>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-700">
          <span className="font-semibold text-slate-900">{formatNewsletterSendInfo(selected)}</span>
        </p>
      </div>
      <ChartCard title="Open Rate — last editions">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartRows} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="news" tickFormatter={(value) => `News ${value}`} />
            <YAxis domain={[0.3, "auto"]} tickFormatter={(value) => formatPercent(value)} />
            <Tooltip formatter={(value) => formatPercent(value)} labelFormatter={(label) => `News ${label}`} />
            <Legend />
            <Line type="monotone" dataKey="openRate" name="Open Rate" stroke={BRAND_BLUE} strokeWidth={3} dot={{ r: 4, fill: "white", stroke: BRAND_BLUE, strokeWidth: 2 }} />
            <Line type="monotone" dataKey="openRateMedian" name="Rolling median" stroke="#6B7280" strokeWidth={2} dot={false} strokeDasharray="6 4" connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-2 text-xs text-slate-600">Blue line: Open Rate | Dashed gray line: rolling median of up to 12 previous editions</div>
      </ChartCard>
      <ChartCard title="Click Rate — last editions">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartRows} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="news" tickFormatter={(value) => `News ${value}`} />
            <YAxis tickFormatter={(value) => formatPercent(value)} />
            <Tooltip formatter={(value) => formatPercent(value)} labelFormatter={(label) => `News ${label}`} />
            <Legend />
            <Line type="monotone" dataKey="clickRate" name="Click Rate" stroke={BRAND_BLUE} strokeWidth={3} dot={{ r: 4, fill: "white", stroke: BRAND_BLUE, strokeWidth: 2 }} />
            <Line type="monotone" dataKey="clickRateMedian" name="Rolling median" stroke="#6B7280" strokeWidth={2} dot={false} strokeDasharray="6 4" connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-2 text-xs text-slate-600">Blue line: Click Rate | Dashed gray line: rolling median of up to 12 previous editions</div>
      </ChartCard>
      <NewsletterClickDomainCharts data={clickDomainData} />
    </section>
  );
}

function NewsletterClickDomainCharts({ data }) {
  const readerDomains = data?.readerDomains || [];
  const destinationDomains = data?.destinationDomains || [];
  const totalClicks = data?.clickRows?.length || 0;

  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <ChartCard title="Top reader email domains">
        {readerDomains.length ? (
          <>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={readerDomains} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => formatNumber(value)} />
                <YAxis type="category" dataKey="domain" width={120} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Bar dataKey="clicks" name="Clicks" fill={BRAND_BLUE}>
                  <LabelList dataKey="clicks" position="right" formatter={(value) => formatNumber(value)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-2 text-xs text-slate-600">Based on {formatNumber(totalClicks)} clicks from the selected edition send date through the following 7 days.</p>
          </>
        ) : (
          <EmptyChartMessage message="No click data found for this edition window." />
        )}
      </ChartCard>

      <ChartCard title="Top clicked destination domains">
        {destinationDomains.length ? (
          <>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={destinationDomains} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => formatNumber(value)} />
                <YAxis type="category" dataKey="domain" width={120} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Bar dataKey="clicks" name="Clicks" fill={BRAND_BLUE}>
                  <LabelList dataKey="clicks" position="right" formatter={(value) => formatNumber(value)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-2 text-xs text-slate-600">Domains are normalized by removing the www. prefix.</p>
          </>
        ) : (
          <EmptyChartMessage message="No destination click data found for this edition window." />
        )}
      </ChartCard>
    </section>
  );
}

function EmptyChartMessage({ message }) {
  return (
    <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function NewsletterKpi({ label, value, previous, isPercent = false }) {
  const currentValue = isPercent ? formatPercent(value) : formatNumber(Math.round(Number(value || 0)));
  const previousValue = previous === null || previous === undefined
    ? "—"
    : isPercent
      ? formatPercent(previous)
      : formatNumber(Math.round(Number(previous || 0)));
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs font-semibold leading-tight text-slate-600">{label}</p>
      <p className="mt-2 text-xl font-black leading-none text-slate-950">
        {currentValue}
        <span className="ml-1 text-xs font-bold text-slate-400">/ {previousValue}</span>
      </p>
    </div>
  );
}

function PostCardsList({ posts }) {
  const averages = useMemo(() => buildMonthlyPostAverages(posts), [posts]);

  if (!posts.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
        No posts found for the selected period.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-xl font-black tracking-tight text-slate-950">Monthly posts</h3>
      </div>

      <div className="grid gap-5">
        {posts.map((post) => (
          <article key={post.id} className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[250px_1fr]">
            <div className="flex w-full max-w-[250px] justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {post.imageUrl ? (
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  loading="lazy"
                  className="w-[250px] max-w-full object-contain"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                    const fallback = event.currentTarget.nextElementSibling;
                    if (fallback) fallback.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div className={`min-h-[220px] w-[250px] max-w-full items-center justify-center px-6 text-center text-sm text-slate-400 ${post.imageUrl ? "hidden" : "flex"}`}>
                Image not loaded
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {post.date ? post.date.toLocaleDateString("en-US") : "Date not available"}
                </p>
                <h4 className="mt-1 text-2xl font-black leading-tight text-slate-950" title={post.title}>{post.shortTitle}</h4>
              </div>

              <div>
                <h5 className="mb-2 text-base font-black underline decoration-red-500 decoration-wavy underline-offset-4">Analysis</h5>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{post.analysis}</p>
              </div>

              <div className="grid gap-2 rounded-xl bg-slate-50 p-3 text-sm md:grid-cols-3 lg:grid-cols-6">
                <PostMetric label="Impressions" value={post.impressions} average={averages.impressions} />
                <PostMetric label="Clicks" value={post.clicks} average={averages.clicks} />
                <PostMetric label="Reactions" value={post.likes} average={averages.likes} />
                <PostMetric label="Comments" value={post.comments} average={averages.comments} />
                <PostMetric label="Share" value={post.shares} average={averages.shares} />
                <PostMetric label="Engagement" value={post.engagements} average={averages.engagements} />
              </div>

              <p className="text-xs text-slate-500">Values after the slash show the monthly average for each category.</p>

              {post.link && post.link !== "0" ? (
                <a href={post.link} target="_blank" rel="noreferrer" className="text-sm font-semibold" style={{ color: BRAND_BLUE }}>
                  Open post on LinkedIn
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PostMetric({ label, value, average }) {
  const roundedAverage = Math.round(Number(average || 0));

  return (
    <div className="rounded-lg bg-white px-3 py-2 text-center shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-black text-slate-950">
        {formatNumber(value)}
        <span className="ml-1 text-xs font-bold text-slate-400">/ {formatNumber(roundedAverage)}</span>
      </p>
    </div>
  );
}

function HistoricalCharts({ impressionsWithAverage, engagementWithAverage, followersHistory }) {
  return (
    <>
      <ChartCard title="Impressions — last 12 months">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={impressionsWithAverage} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip formatter={(value) => formatNumber(value)} />
            <Legend />
            <Line type="monotone" dataKey="value" name="Impressions" stroke={BRAND_BLUE} strokeWidth={3} />
            <Line type="monotone" dataKey="movingAvg" name="Moving average" stroke="#6B7280" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-2 text-xs text-slate-600">Blue line: Impressions | Gray line: Moving average (12 months)</div>
      </ChartCard>
      <ChartCard title="Engagement rate — last 12 months">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={engagementWithAverage} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis tickFormatter={(v) => `${Math.round(v * 100)}%`} />
            <Tooltip formatter={(value) => formatPercent(value)} />
            <Legend />
            <Line type="monotone" dataKey="value" name="Engagement rate" stroke={BRAND_BLUE} strokeWidth={3} />
            <Line type="monotone" dataKey="movingAvg" name="Moving average" stroke="#6B7280" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-2 text-xs text-slate-600">Blue line: Engagement rate | Gray line: Moving average (12 months)</div>
      </ChartCard>
      <ChartCard title="Followers and new followers — last 12 months">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={followersHistory} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis type="number" domain={[4800, 6500]} allowDataOverflow tickFormatter={(value) => formatNumber(value)} />
            <Tooltip formatter={(value) => formatNumber(value)} />
            <Legend />
            <Bar dataKey="existingFollowers" stackId="followers" name="Follower base" fill={BRAND_BLUE} />
            <Bar dataKey="newFollowers" stackId="followers" name="New followers" fill="#6B7280">
              <LabelList dataKey="newFollowers" position="top" formatter={(value) => formatNumber(value)} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 text-xs text-slate-600">Blue bar: follower base | Gray bar: new followers this month</div>
      </ChartCard>
    </>
  );
}

function AnalysisBlock({ text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-3 text-xl font-black underline decoration-red-500 decoration-wavy underline-offset-4">Analysis</h3>
      <p className="whitespace-pre-line text-sm leading-relaxed text-slate-800">{text}</p>
    </div>
  );
}

function NextStepsTab({ generalMatrix, generalAnalysisMatrix, month, monthLabel, year }) {
  const nextSteps = useMemo(
    () => buildGeneralAnalysis(generalMatrix, generalAnalysisMatrix, year, month, "Next Steps"),
    [generalMatrix, generalAnalysisMatrix, year, month]
  );

  return (
    <section className="space-y-5">
      <h2 className="text-3xl font-black tracking-tight text-slate-950">Next Steps - {monthLabel}</h2>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-800">
          {nextSteps || "Next steps have not been added for the selected period yet."}
        </p>
      </div>
    </section>
  );
}

function PlaceholderTab({ tabName, monthLabel, year }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white" style={{ backgroundColor: BRAND_BLUE }}><Icon name="info" size={26} color="white" /></div>
      <h2 className="mt-5 text-2xl font-bold text-slate-950">{tabName}</h2>
      <p className="mt-2 text-slate-500">Content in development for {monthLabel} {year}.</p>
    </section>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2"><h3 className="text-lg font-bold text-slate-950">{title}</h3><Icon name="info" size={16} color="#94A3B8" /></div>
      {children}
    </div>
  );
}
