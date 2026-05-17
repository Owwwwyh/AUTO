"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import type { Receipt } from "@/lib/schema";

type Submission = Receipt & { id: number; createdAt: string };

const EMPTY: Receipt = { merchant: "", date: "", total: 0, currency: "" };

function isoToDdmmyyyy(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

function ddmmyyyyToIso(s: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
}

function todayLabel() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function Home() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Receipt>(EMPTY);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    try {
      const res = await fetch("/api/submissions");
      if (!res.ok) return;
      setSubmissions(await res.json());
    } catch {}
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  const acceptFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onSelectFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
  };

  const loadSample = async (path: string, label: string) => {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error("Sample not found");
      const blob = await res.blob();
      const filename = path.split("/").pop() ?? "sample";
      acceptFile(new File([blob], filename, { type: blob.type }));
      toast.success(`Loaded ${label}`);
    } catch {
      toast.error("Could not load sample");
    }
  };

  const onExtract = async () => {
    if (!file) {
      toast.error("Choose a receipt image first");
      return;
    }
    setExtracting(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/extract", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Extraction failed");
      const r = data as Receipt;
      setForm({ ...r, date: isoToDdmmyyyy(r.date) });
      toast.success("Fields extracted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const iso = ddmmyyyyToIso(form.date);
    if (!iso) {
      toast.error("Date must be in dd/mm/yyyy format");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, date: iso }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      toast.success("Filed in the ledger");
      setForm(EMPTY);
      setFile(null);
      setPreview(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = !!form.merchant && !!form.date && !!form.currency && form.total > 0 && !saving;

  return (
    <main className="mx-auto w-full max-w-[1240px] px-6 lg:px-10 pt-10 pb-24">
      {/* MASTHEAD */}
      <header className="rise">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-ink-2 border-b border-ink pb-2">
          <span>Vol. I · No. 001</span>
          <span className="hidden sm:inline">{todayLabel()}</span>
          <span>Edition · Web</span>
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(56px,11vw,168px)] leading-[0.85] tracking-tight mt-4">
          The&nbsp;
          <span style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }} className="italic text-accent">
            Ledger
          </span>
        </h1>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-3">
          <p className="font-[family-name:var(--font-display)] italic text-lg md:text-xl text-ink-2 max-w-2xl">
            A modest broadsheet for receipts — uploaded, parsed by a language model,
            corrected by a human, and filed under glass.
          </p>
          <span className="text-[11px] uppercase tracking-[0.22em] text-ink-2 tabular">
            Established · 2026 · Kuala Lumpur
          </span>
        </div>
      </header>

      {/* THREE-COLUMN LAYOUT */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-10">
        {/* COLUMN 1 — INTAKE */}
        <section className="lg:col-span-5 rise" style={{ animationDelay: "60ms" }}>
          <ColumnLabel n="I" title="Intake" />
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f && f.type.startsWith("image/")) acceptFile(f);
            }}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            className={[
              "group relative cursor-pointer select-none",
              "border border-ink bg-paper-2",
              "transition-[transform,background-color] duration-300",
              dragOver ? "bg-[#F6E8D8]" : "",
              "hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_#1A1812]",
            ].join(" ")}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onSelectFile}
              className="sr-only"
            />

            {preview ? (
              <div className="p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Receipt preview"
                  className="w-full max-h-[520px] object-contain bg-paper border border-rule"
                />
                <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-ink-2">
                  <span className="tabular">{file?.name}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                    className="underline underline-offset-2 hover:text-accent"
                  >
                    Replace
                  </button>
                </div>
              </div>
            ) : (
              <div className="aspect-[4/5] flex flex-col items-center justify-center text-center p-10">
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="text-ink">
                  <rect x="8" y="6" width="40" height="44" stroke="currentColor" strokeWidth="1.25" fill="none" />
                  <path d="M14 16h28M14 22h28M14 28h20M14 34h24M14 40h16" stroke="currentColor" strokeWidth="1" />
                  <circle cx="42" cy="42" r="7" stroke="currentColor" strokeWidth="1.25" fill="var(--paper-2)" />
                  <path d="M42 39v6M39 42h6" stroke="currentColor" strokeWidth="1.25" />
                </svg>
                <p className="mt-5 font-[family-name:var(--font-display)] italic text-2xl">
                  Drop a receipt here
                </p>
                <p className="mt-1 text-sm text-ink-2">
                  or <span className="underline underline-offset-2">browse the archive</span>
                </p>
                <p className="mt-6 text-[10px] uppercase tracking-[0.22em] text-ink-2">
                  JPG · PNG · WEBP · HEIC
                </p>

                <div
                  className="mt-7 pt-5 border-t border-dashed border-ink/30 w-full max-w-[260px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-[10px] uppercase tracking-[0.28em] text-ink-2 mb-3">
                    Or try a sample
                  </p>
                  <div className="flex gap-3 justify-center">
                    <SampleChip
                      label="Sample A"
                      onClick={() => loadSample("/samples/example1.webp", "Sample A")}
                    />
                    <SampleChip
                      label="Sample B"
                      onClick={() => loadSample("/samples/example2.png", "Sample B")}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onExtract}
            disabled={!file || extracting}
            className={[
              "mt-5 w-full relative overflow-hidden",
              "border border-ink bg-ink text-paper-2",
              "px-5 py-4 text-sm uppercase tracking-[0.22em]",
              "transition-[transform,box-shadow] duration-200",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "enabled:hover:-translate-y-[2px] enabled:hover:shadow-[5px_5px_0_0_var(--accent)]",
            ].join(" ")}
          >
            <span className="inline-flex items-center justify-center gap-3">
              {extracting ? (
                <>
                  <span className="inline-block w-3 h-3 border border-paper-2 border-t-transparent rounded-full animate-spin" />
                  <span className="shimmer">Reading the paper…</span>
                </>
              ) : (
                <>
                  <span>Extract with Gemini</span>
                  <span aria-hidden>→</span>
                </>
              )}
            </span>
          </button>

          <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-ink-2">
            Powered by Google · Gemini 2.5 Flash · via Vercel AI SDK
          </p>
        </section>

        {/* COLUMN 2 — RECEIPT FORM (the centerpiece) */}
        <section className="lg:col-span-7 rise" style={{ animationDelay: "140ms" }}>
          <ColumnLabel n="II" title="Examination" align="between" right={
            <span className="text-[11px] uppercase tracking-[0.22em] text-ink-2">
              {extracting ? "Parsing…" : form.merchant ? "Awaiting your signature" : "Empty docket"}
            </span>
          } />

          {/* RECEIPT-AS-FORM */}
          <article className="relative">
            {/* Scalloped top */}
            <div className="h-3 bg-ink scallop-top" />
            <form
              onSubmit={onSubmit}
              className="bg-paper-2 border-x border-ink px-7 sm:px-10 py-8 sm:py-10 relative"
            >
              {/* Stamp */}
              <div className="absolute right-6 top-6 select-none pointer-events-none">
                <div className="relative w-[88px] h-[88px]">
                  <svg viewBox="0 0 88 88" className={`absolute inset-0 ${extracting ? "spin-slow" : ""}`}>
                    <defs>
                      <path id="circ" d="M44,44 m-32,0 a32,32 0 1,1 64,0 a32,32 0 1,1 -64,0" />
                    </defs>
                    <circle cx="44" cy="44" r="36" fill="none" stroke="var(--accent)" strokeWidth="1" />
                    <circle cx="44" cy="44" r="32" fill="none" stroke="var(--accent)" strokeWidth="1.25" />
                    <text fill="var(--accent)" fontSize="8.5" letterSpacing="2.5" fontFamily="var(--font-geist-mono)">
                      <textPath href="#circ" startOffset="2%">
                        VERIFIED · MACHINE-READ · {new Date().getFullYear()} ·
                      </textPath>
                    </text>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-[family-name:var(--font-display)] italic text-accent text-xl">
                    LDG
                  </div>
                </div>
              </div>

              <header className="pr-24">
                <p className="text-[10px] uppercase tracking-[0.32em] text-ink-2">No. {String(submissions.length + 1).padStart(4, "0")}</p>
                <h2 className="font-[family-name:var(--font-display)] text-4xl mt-1">
                  Receipt of Record
                </h2>
                <p className="font-[family-name:var(--font-display)] italic text-ink-2 mt-1">
                  As transcribed by the machine, attested by the bearer.
                </p>
              </header>

              <div className="my-7 perf h-px" />

              {/* MERCHANT — single line, large */}
              <BigField
                label="Merchant"
                value={form.merchant}
                onChange={(v) => setForm({ ...form, merchant: v })}
                placeholder="—"
              />

              <div className="my-6 perf h-px" />

              {/* DATE & CURRENCY row */}
              <div className="grid grid-cols-2 gap-8">
                <SmallField
                  label="Date of Issue"
                  value={form.date}
                  onChange={(v) => setForm({ ...form, date: v })}
                  placeholder="dd/mm/yyyy"
                  maxLength={10}
                  mono
                />
                <SmallField
                  label="Currency"
                  value={form.currency}
                  onChange={(v) => setForm({ ...form, currency: v.toUpperCase() })}
                  placeholder="MYR"
                  maxLength={3}
                  mono
                />
              </div>

              <div className="my-6 perf h-px" />

              {/* TOTAL — hero number */}
              <div className="flex items-end justify-between gap-6">
                <label className="block w-full">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-ink-2">Grand Total</span>
                  <div className="mt-1 flex items-baseline gap-3">
                    <span className="font-[family-name:var(--font-display)] italic text-3xl text-ink-2 tabular w-[3.5ch] text-right">
                      {form.currency || "—"}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      value={form.total ? String(form.total) : ""}
                      onChange={(e) => setForm({ ...form, total: Number(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="ink-focus flex-1 bg-transparent border-0 border-b border-ink/0 hover:border-ink/40 focus:border-ink font-[family-name:var(--font-display)] text-[64px] sm:text-[88px] leading-none tabular tracking-tight outline-none px-0 py-0 placeholder:text-rule"
                    />
                  </div>
                </label>
              </div>

              <div className="mt-8 perf h-px" />

              {/* SIGNATURE / SUBMIT */}
              <div className="mt-8 flex flex-col-reverse sm:flex-row items-stretch sm:items-end gap-5 sm:gap-8">
                <div className="flex-1">
                  <div className="border-b border-ink h-10" />
                  <p className="mt-2 text-[10px] uppercase tracking-[0.28em] text-ink-2">
                    Signature of the bearer · attests to accuracy
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={[
                    "group relative px-7 py-4 border border-ink text-sm uppercase tracking-[0.22em]",
                    "bg-accent text-paper-2",
                    "transition-[transform,box-shadow]",
                    "disabled:bg-rule disabled:text-ink-2 disabled:border-rule disabled:cursor-not-allowed",
                    "enabled:hover:-translate-y-[2px] enabled:hover:shadow-[5px_5px_0_0_#1A1812]",
                  ].join(" ")}
                >
                  {saving ? "Filing…" : "File in the ledger"}
                </button>
              </div>
            </form>
            {/* Scalloped bottom */}
            <div className="h-3 bg-ink scallop-bottom" />
          </article>
        </section>

        {/* COLUMN 3 — LEDGER (full width) */}
        <section className="lg:col-span-12 mt-6 rise" style={{ animationDelay: "220ms" }}>
          <ColumnLabel n="III" title="The Ledger" right={
            <span className="text-[11px] uppercase tracking-[0.22em] text-ink-2 tabular">
              {submissions.length} {submissions.length === 1 ? "entry" : "entries"}
            </span>
          } align="between" />

          {submissions.length === 0 ? (
            <div className="border border-dashed border-ink py-16 text-center">
              <p className="font-[family-name:var(--font-display)] italic text-2xl text-ink-2">
                The ledger is empty.
              </p>
              <p className="mt-2 text-sm text-ink-2">
                File your first receipt above and it will appear here, bound and dated.
              </p>
            </div>
          ) : (
            <div className="border border-ink bg-paper-2 overflow-x-auto">
              <table className="w-full text-left text-sm tabular border-collapse">
                <thead>
                  <tr className="border-b border-ink">
                    <Th className="w-[5%]">№</Th>
                    <Th className="w-[35%]">Merchant</Th>
                    <Th className="w-[15%]">Date</Th>
                    <Th className="w-[10%]">Cur.</Th>
                    <Th className="w-[15%] text-right">Total</Th>
                    <Th className="w-[20%] text-right">Filed</Th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s, i) => (
                    <tr
                      key={s.id}
                      className={`border-b border-rule-soft last:border-0 ${i % 2 === 0 ? "" : "bg-[rgba(184,65,10,0.025)]"}`}
                    >
                      <Td className="text-ink-2 font-[family-name:var(--font-display)] italic text-base">
                        {String(submissions.length - i).padStart(3, "0")}
                      </Td>
                      <Td className="font-[family-name:var(--font-display)] text-lg">{s.merchant}</Td>
                      <Td>{isoToDdmmyyyy(s.date)}</Td>
                      <Td className="uppercase text-ink-2">{s.currency}</Td>
                      <Td className="text-right">
                        <span className="font-[family-name:var(--font-display)] text-lg">
                          {Number(s.total).toFixed(2)}
                        </span>
                      </Td>
                      <Td className="text-right text-ink-2 text-xs">
                        {new Date(s.createdAt).toLocaleString("en-GB", {
                          day: "2-digit", month: "short", year: "2-digit",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* COLOPHON */}
      <footer className="mt-20 border-t border-ink pt-4 flex flex-wrap items-center justify-between text-[11px] uppercase tracking-[0.22em] text-ink-2">
        <span>Set in Fraunces · Geist · Geist Mono</span>
        <span className="hidden md:inline">Printed on cream stock · 90gsm digital</span>
        <span>© {new Date().getFullYear()} · The Ledger</span>
      </footer>
    </main>
  );
}

function ColumnLabel({
  n,
  title,
  right,
  align = "start",
}: {
  n: string;
  title: string;
  right?: React.ReactNode;
  align?: "start" | "between";
}) {
  return (
    <div className={`mb-4 flex items-center ${align === "between" ? "justify-between" : "gap-4"} border-b border-ink pb-2`}>
      <div className="flex items-baseline gap-3">
        <span className="font-[family-name:var(--font-display)] italic text-2xl text-accent">{n}.</span>
        <h2 className="text-[11px] uppercase tracking-[0.32em]">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function BigField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.32em] text-ink-2">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="ink-focus mt-1 w-full bg-transparent border-0 border-b border-ink/30 hover:border-ink focus:border-ink font-[family-name:var(--font-display)] text-3xl sm:text-4xl tracking-tight outline-none px-0 py-2 placeholder:text-rule"
      />
    </label>
  );
}

function SmallField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.32em] text-ink-2">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={[
          "ink-focus mt-1 w-full bg-transparent border-0 border-b border-ink/30 hover:border-ink focus:border-ink",
          "text-2xl sm:text-3xl tracking-tight outline-none px-0 py-2 placeholder:text-rule tabular",
          mono ? "font-[family-name:var(--font-geist-mono)]" : "font-[family-name:var(--font-display)]",
        ].join(" ")}
      />
    </label>
  );
}

function SampleChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-2 text-[11px] uppercase tracking-[0.2em] border border-ink bg-paper-2 hover:bg-ink hover:text-paper-2 transition-colors"
    >
      {label}
    </button>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-[10px] uppercase tracking-[0.28em] text-ink-2 font-medium ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
