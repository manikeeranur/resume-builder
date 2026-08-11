import { transform } from "sucrase";
import React from "react";
import {
  Mail, Phone, MapPin, Globe, Globe2, Link, Link2, Calendar, Clock, User, Users, Users2,
  Building, Building2, Home, Briefcase, GraduationCap, Award, Star, Trophy, Target,
  BookOpen, Book, FileText, File, Download, ExternalLink, CheckCircle, CheckCircle2,
  Check, Circle, Dot, Languages, Flag, Heart, ThumbsUp, MessageCircle, MessageSquare,
  Send, Printer, Camera, Image, Palette, Code, Code2, Terminal, Database, Server,
  Cloud, Cpu, Layers, PenTool, Pencil, Edit, Edit2, Edit3, Quote, Zap, TrendingUp,
  BarChart, BarChart2, PieChart, LineChart, Activity, Compass, Navigation, Bookmark,
  Tag, Tags, Folder, FolderOpen, Package, Box, ShoppingBag, ShoppingCart, DollarSign,
  CreditCard, Wallet, Landmark, School, Library, Stethoscope, Scale, Gavel, Wrench,
  Hammer, Settings, Cog, Shield, ShieldCheck, Lock, Unlock, Key, Eye, EyeOff, Search,
  Filter, Plus, Minus, X, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ChevronRight,
  ChevronLeft, ChevronUp, ChevronDown, MoreHorizontal, MoreVertical, Menu, Grid, List,
  LayoutGrid, LayoutList, Rocket, Lightbulb, Puzzle, Handshake, UserCheck, UserPlus,
  Network, Share2, Paperclip, Clipboard, ClipboardCheck, ClipboardList,
} from "lucide-react";
import {
  IconBrandGithub, IconBrandLinkedin, IconBrandX, IconBrandTwitter, IconBrandFacebook,
  IconBrandInstagram, IconBrandYoutube, IconBrandBehance, IconBrandDribbble, IconBrandMedium,
  IconBrandDiscord, IconBrandSlack, IconBrandFigma, IconBrandGitlab, IconBrandBitbucket,
  IconBrandStackoverflow, IconBrandCodepen, IconBrandTelegram, IconBrandWhatsapp,
  IconBrandTiktok, IconBrandPinterest, IconBrandReddit, IconBrandVimeo, IconBrandUpwork,
  IconBrandFiverr, IconWorld, IconMail, IconPhone, IconBrandThreads, IconBrandLeetcode,
  IconBrandNpm, IconBrandDocker, IconBrandChrome,
} from "@tabler/icons-react";
import { totalExperienceDuration } from "@/lib/experienceDuration";
import * as helpers from "@/components/templates/helpers";

// Everything a template's code can reference as a bare identifier, beyond
// React itself — ./helpers' exports, lib/experienceDuration, and a
// generous, hand-picked set of icons from lucide-react + @tabler/icons-react
// (contact/resume-shaped icons plus common brand/social logos) covering
// what a resume template would plausibly need. Named (not `import *` or a
// per-icon dynamic import) so these tree-shake into the bundle instead of
// either icon library whole — this scope is evaluated for every dynamic
// template a real user's resume renders, not just in the admin editor, and
// both alternatives were tried and rejected: `import *`/dynamic-import of
// the full libraries bloats every such page with ~12,000 unused icons, and
// (confirmed against this app's own dev server) blows up webpack's dev
// compile time from seconds to minutes. If a template needs an icon that
// isn't in this list, add its named import here (and to the matching
// package above) — same as any of the ones already listed.
const SCOPE = {
  ...helpers,
  Mail, Phone, MapPin, Globe, Globe2, Link, Link2, Calendar, Clock, User, Users, Users2,
  Building, Building2, Home, Briefcase, GraduationCap, Award, Star, Trophy, Target,
  BookOpen, Book, FileText, File, Download, ExternalLink, CheckCircle, CheckCircle2,
  Check, Circle, Dot, Languages, Flag, Heart, ThumbsUp, MessageCircle, MessageSquare,
  Send, Printer, Camera, Image, Palette, Code, Code2, Terminal, Database, Server,
  Cloud, Cpu, Layers, PenTool, Pencil, Edit, Edit2, Edit3, Quote, Zap, TrendingUp,
  BarChart, BarChart2, PieChart, LineChart, Activity, Compass, Navigation, Bookmark,
  Tag, Tags, Folder, FolderOpen, Package, Box, ShoppingBag, ShoppingCart, DollarSign,
  CreditCard, Wallet, Landmark, School, Library, Stethoscope, Scale, Gavel, Wrench,
  Hammer, Settings, Cog, Shield, ShieldCheck, Lock, Unlock, Key, Eye, EyeOff, Search,
  Filter, Plus, Minus, X, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ChevronRight,
  ChevronLeft, ChevronUp, ChevronDown, MoreHorizontal, MoreVertical, Menu, Grid, List,
  LayoutGrid, LayoutList, Rocket, Lightbulb, Puzzle, Handshake, UserCheck, UserPlus,
  Network, Share2, Paperclip, Clipboard, ClipboardCheck, ClipboardList,
  IconBrandGithub, IconBrandLinkedin, IconBrandX, IconBrandTwitter, IconBrandFacebook,
  IconBrandInstagram, IconBrandYoutube, IconBrandBehance, IconBrandDribbble, IconBrandMedium,
  IconBrandDiscord, IconBrandSlack, IconBrandFigma, IconBrandGitlab, IconBrandBitbucket,
  IconBrandStackoverflow, IconBrandCodepen, IconBrandTelegram, IconBrandWhatsapp,
  IconBrandTiktok, IconBrandPinterest, IconBrandReddit, IconBrandVimeo, IconBrandUpwork,
  IconBrandFiverr, IconWorld, IconMail, IconPhone, IconBrandThreads, IconBrandLeetcode,
  IconBrandNpm, IconBrandDocker, IconBrandChrome,
  totalExperienceDuration,
};
const SCOPE_NAMES = Object.keys(SCOPE);

export class TemplateCompileError extends Error {}

// Compiles admin-authored JSX template source into a renderable React
// component. Runs identically in the browser (the admin editor's live
// preview) and in Node (the print page / PDF pipeline) — sucrase's JSX
// transform has no DOM or bundler dependency either way, so a template
// created in the admin panel needs no build step to go live.
//
// Templates can't `import` anything (there's no bundler at this point) —
// any `import ... from "...";` statement (single- or multi-line, e.g. a
// wrapped `import { a, b, c } from "...";`) is stripped so an admin can
// paste an existing Template*.jsx file's body in verbatim. SCOPE above
// covers every name the built-ins actually import, injected instead, so
// template code can reference them as bare identifiers exactly like the
// built-ins do.
//
// Trust boundary: this evaluates the stored code with `new Function`. Only
// admins (server-checked via requireAdmin on every write route) can ever
// get code into the `code` field, so this is equivalent to any other
// admin-only server capability — never wire a non-admin write path to it.
export function compileTemplateComponent(rawCode) {
  if (typeof rawCode !== "string" || !rawCode.trim()) {
    throw new TemplateCompileError("Template code is empty.");
  }

  const withoutImports = rawCode.replace(/^\s*import\s+[\s\S]*?from\s+["'][^"']+["'];?\s*\n/gm, "");

  let transformed;
  try {
    transformed = transform(withoutImports, { transforms: ["jsx"], jsxRuntime: "classic" }).code;
  } catch (err) {
    throw new TemplateCompileError(`Syntax error: ${err.message}`);
  }

  if (!/export\s+default\s+/.test(transformed)) {
    throw new TemplateCompileError('Template code must have an "export default function ...(...) { }" component.');
  }
  const body = transformed.replace(/export\s+default\s+/, "return ");

  let factory;
  try {
    // eslint-disable-next-line no-new-func
    factory = new Function("React", ...SCOPE_NAMES, `"use strict";\n${body}`);
  } catch (err) {
    throw new TemplateCompileError(`Syntax error: ${err.message}`);
  }

  let Component;
  try {
    Component = factory(React, ...SCOPE_NAMES.map((name) => SCOPE[name]));
  } catch (err) {
    throw new TemplateCompileError(`Failed to evaluate template: ${err.message}`);
  }

  if (typeof Component !== "function") {
    throw new TemplateCompileError("Template's default export must be a function component.");
  }

  return Component;
}
