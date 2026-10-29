"use client";
import { useRef, useState } from "react";
import { memoryApi } from "../lib/memory-client";
import {
  requestCategories,
  validateEditorialRequest,
} from "../lib/editorial-requests";
export function EditorialRequestForm() {
  const [values, setValues] = useState({
    category: "correction",
    articleUrl: "",
    email: "",
    message: "",
    consent: false,
    website: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [receipt, setReceipt] = useState("");
  const key = useRef(""),
    sending = useRef(false),
    form = useRef<HTMLFormElement>(null);
  function update(name: string, value: string | boolean) {
    key.current = "";
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: "" }));
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending.current) return;
    key.current ||= crypto.randomUUID();
    const payload = { ...values, submissionKey: key.current };
    const issues = validateEditorialRequest(payload);
    setErrors(issues);
    setMessage("");
    if (Object.keys(issues).length) {
      form.current
        ?.querySelector<HTMLElement>(`[name="${Object.keys(issues)[0]}"]`)
        ?.focus();
      return;
    }
    sending.current = true;
    setBusy(true);
    try {
      const r = await fetch(`${memoryApi()}/api/editorial-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });
      const d = (await r.json()) as {
        id?: string;
        error?: string;
        errors?: Record<string, string>;
      };
      if (!r.ok) {
        setErrors(d.errors || {});
        throw Error(d.error || "এখন জমা নেওয়া যাচ্ছে না।");
      }
      setReceipt(d.id!);
    } catch (e) {
      setMessage(
        e instanceof Error && e.name !== "TimeoutError"
          ? e.message
          : "সংযোগে সমস্যা হয়েছে। তথ্য অক্ষত আছে; আবার চেষ্টা করুন।",
      );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  if (receipt)
    return (
      <div className="policy-receipt" role="status">
        <h3>অনুরোধটি ব্যক্তিগতভাবে সংরক্ষিত হয়েছে</h3>
        <p>
          জমার নম্বর: <code>{receipt}</code>
        </p>
        <p>
          নম্বরটি রেখে দিন। সম্পাদক অনুরোধটি পর্যালোচনা করবেন; প্রয়োজন হলে আপনার
          দেওয়া ইমেইলে যোগাযোগ করবেন। জমা দিলেই কোনো লেখা পরিবর্তিত বা অপসারিত
          হয় না।
        </p>
        <button
          className="button"
          onClick={() => {
            setReceipt("");
            setValues({
              category: "correction",
              articleUrl: "",
              email: "",
              message: "",
              consent: false,
              website: "",
            });
            key.current = "";
          }}
        >
          নতুন অনুরোধ
        </button>
      </div>
    );
  return (
    <form
      ref={form}
      className="policy-request-form"
      aria-label="ব্যক্তিগত সম্পাদকীয় অনুরোধ"
      onSubmit={submit}
      noValidate
    >
      <h3>সম্পাদককে অনুরোধ পাঠান</h3>
      <p className="policy-form-note">
        ইমেইল ও অনুরোধের বিবরণ প্রকাশিত হয় না। * চিহ্নিত ঘরগুলো পূরণ করুন।
      </p>
      <label className="memory-field" htmlFor="request-category">
        <span>অনুরোধের ধরন *</span>
        <select
          id="request-category"
          name="category"
          value={values.category}
          onChange={(e) => update("category", e.target.value)}
        >
          {Object.entries(requestCategories).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      {(
        [
          [
            "articleUrl",
            values.category === "privacy"
              ? "লেখার লিংক (প্রযোজ্য হলে)"
              : "লেখার লিংক *",
            "url",
          ],
          ["email", "ইমেইল (ব্যক্তিগত) *", "email"],
        ] as const
      ).map(([name, label, type]) => (
        <label className="memory-field" key={name} htmlFor={`request-${name}`}>
          <span>{label}</span>
          <input
            id={`request-${name}`}
            name={name}
            type={type}
            value={values[name]}
            maxLength={name === "email" ? 254 : 2000}
            autoComplete={name === "email" ? "email" : "url"}
            required={name === "email" || values.category !== "privacy"}
            aria-invalid={!!errors[name]}
            aria-describedby={`request-${name}-error`}
            onChange={(e) => update(name, e.target.value)}
            placeholder={
              name === "articleUrl"
                ? "https://zeauddinahmed.com/articles/…"
                : undefined
            }
          />
          <small className="memory-error" id={`request-${name}-error`}>
            {errors[name]}
          </small>
        </label>
      ))}
      <label className="memory-field" htmlFor="request-message">
        <span>অনুরোধের বিবরণ *</span>
        <textarea
          id="request-message"
          name="message"
          rows={6}
          required
          minLength={20}
          maxLength={4000}
          value={values.message}
          aria-invalid={!!errors.message}
          aria-describedby="request-message-help request-message-error"
          placeholder="কোন অংশটি নিয়ে অনুরোধ, কী পরিবর্তন চান এবং সমর্থনে কোনো উৎস থাকলে তার লিংক লিখুন। অপ্রয়োজনীয় ব্যক্তিগত বা সংবেদনশীল তথ্য দেবেন না।"
          onChange={(e) => update("message", e.target.value)}
        />
        <small id="request-message-help">
          ২০–৪০০০ অক্ষর। কোনো ফাইল সংযুক্ত করার প্রয়োজন নেই।
        </small>
        <small className="memory-error" id="request-message-error">
          {errors.message}
        </small>
      </label>
      <label className="memory-check">
        <input
          name="consent"
          type="checkbox"
          checked={values.consent}
          required
          aria-invalid={!!errors.consent}
          aria-describedby="request-consent-error"
          onChange={(e) => update("consent", e.target.checked)}
        />
        <span>
          অনুরোধটি পর্যালোচনা এবং এ বিষয়ে আমার ইমেইলে যোগাযোগ করা যেতে পারে। *
        </span>
      </label>
      <small id="request-consent-error" className="memory-error">
        {errors.consent}
      </small>
      <div className="memory-honeypot" aria-hidden="true">
        <label>
          Website
          <input
            name="website"
            value={values.website}
            tabIndex={-1}
            autoComplete="off"
            onChange={(e) => update("website", e.target.value)}
          />
        </label>
      </div>
      {message && (
        <p role="alert" className="memory-error">
          {message}
        </p>
      )}
      <button className="button button-accent" disabled={busy} type="submit">
        {busy ? "জমা হচ্ছে…" : "অনুরোধ পাঠান →"}
      </button>
    </form>
  );
}
