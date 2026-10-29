"use client";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { relationships, validateMemory } from "../lib/memory-policy";
import { memoryApi } from "../lib/memory-client";
const initial = {
  name: "",
  publicName: "",
  email: "",
  phone: "",
  relationship: "",
  title: "",
  story: "",
  photoCaption: "",
  photoDate: "",
  attribution: "named",
  consentStory: "false",
  consentPhoto: "false",
  consentContact: "false",
};
export function MemorySubmissionForm() {
  const [values, setValues] = useState(initial),
    [photo, setPhoto] = useState<File | null>(null),
    [photoUrl, setPhotoUrl] = useState(""),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [preview, setPreview] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [receipt, setReceipt] = useState<{ id: string; code: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null),
    fileRef = useRef<HTMLInputElement>(null),
    busyRef = useRef(false),
    key = useRef("");
  useEffect(() => {
    key.current = crypto.randomUUID();
  }, []);
  useEffect(() => {
    if (!photo) {
      setPhotoUrl("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  function update(name: string, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: "" }));
  }
  function showErrors(e: Record<string, string>) {
    setErrors(e);
    setMessage("চিহ্নিত ঘরগুলো ঠিক করুন। আপনার লেখা সংরক্ষিত আছে।");
    setTimeout(
      () =>
        formRef.current
          ?.querySelector<HTMLElement>(`[name="${Object.keys(e)[0]}"]`)
          ?.focus(),
      0,
    );
  }
  function choose(file?: File) {
    if (!file) {
      setPhoto(null);
      setErrors((e) => ({ ...e, photo: "" }));
      return;
    }
    if (
      file.size > 5 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    ) {
      setErrors((e) => ({
        ...e,
        photo: "সর্বোচ্চ ৫ MB-এর JPG, PNG বা WebP ছবি দিন।",
      }));
      if (fileRef.current) fileRef.current.value = "";
      setPhoto(null);
      return;
    }
    setPhoto(file);
    setErrors((e) => ({ ...e, photo: "" }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busyRef.current) return;
    const e = validateMemory(values, !!photo);
    if (Object.keys(e).length) {
      setPreview(false);
      showErrors(e);
      return;
    }
    if (errors.photo) return;
    if (!preview) {
      setMessage("");
      setPreview(true);
      setTimeout(
        () => document.getElementById("memory-preview-title")?.focus(),
        0,
      );
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setMessage("");
    const data = new FormData();
    Object.entries(values).forEach(([k, v]) => data.set(k, v));
    data.set("submissionKey", key.current);
    data.set(
      "website",
      String(new FormData(formRef.current!).get("website") || ""),
    );
    if (photo) data.set("photo", photo);
    const controller = new AbortController(),
      timer = setTimeout(() => controller.abort(), 45000);
    try {
      const r = await fetch(`${memoryApi()}/api/memories`, {
        method: "POST",
        body: data,
        signal: controller.signal,
      });
      const result = (await r.json()) as {
        id: string;
        code: string;
        error?: string;
        errors?: Record<string, string>;
      };
      if (!r.ok) {
        if (result.errors) {
          setPreview(false);
          showErrors(result.errors);
        }
        throw Error(result.error || "চিহ্নিত ঘরগুলো ঠিক করে আবার চেষ্টা করুন।");
      }
      setReceipt({ id: result.id, code: result.code });
      setTimeout(() => document.getElementById("memory-success")?.focus(), 0);
    } catch (error) {
      setMessage(
        error instanceof Error && error.name !== "AbortError"
          ? error.message
          : "সংযোগে সময় বেশি লাগছে। আপনার লেখা আছে—আবার জমা দিন; একই জমা দুবার তৈরি হবে না।",
      );
    } finally {
      clearTimeout(timer);
      busyRef.current = false;
      setBusy(false);
    }
  }
  function saveReceipt() {
    if (!receipt) return;
    const body = `স্মৃতির খাতা — জমার রসিদ\nজমার নম্বর: ${receipt.id}\nগোপন কোড: ${receipt.code}\nঅবস্থা / সংশোধন / প্রত্যাহার: https://zeauddinahmed.com/memories#manage-memory\nএই কোড গোপন রাখুন। কোডধারী ব্যক্তি গল্প প্রত্যাহার করতে পারবেন।`;
    const url = URL.createObjectURL(
      new Blob([body], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "memory-receipt.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (receipt)
    return (
      <div className="memory-success" id="memory-success" tabIndex={-1}>
        <p className="eyebrow">ধন্যবাদ</p>
        <h3>আপনার স্মৃতি পর্যালোচনার জন্য জমা হয়েছে।</h3>
        <p>
          সম্পাদকীয় পর্যালোচনা শেষ হওয়ার আগে এটি প্রকাশিত হবে না। নিচের রসিদটি
          নিজের কাছে রাখুন।
        </p>
        <dl>
          <dt>জমার নম্বর</dt>
          <dd>{receipt.id}</dd>
          <dt>গোপন ব্যবস্থাপনা কোড</dt>
          <dd className="memory-code">{receipt.code}</dd>
        </dl>
        <p>
          এই কোড দিয়ে অবস্থা জানতে, সংশোধন চাইতে বা প্রকাশ থেকে প্রত্যাহার করতে
          পারবেন। কোডটি কাউকে দেবেন না।
        </p>
        <div className="memory-button-row">
          <button className="button button-accent" onClick={saveReceipt}>
            রসিদ সংরক্ষণ করুন ↓
          </button>
          <a className="text-link" href="#manage-memory">
            জমা পরিচালনা করুন
          </a>
        </div>
        <button
          className="memory-read-more"
          onClick={() => {
            setReceipt(null);
            setValues(initial);
            setPhoto(null);
            setPreview(false);
            key.current = crypto.randomUUID();
          }}
        >
          আরেকটি স্মৃতি লিখুন
        </button>
      </div>
    );
  const field = (
    name: keyof typeof initial,
    label: string,
    options: {
      required?: boolean;
      type?: string;
      help?: string;
      max?: number;
      autoComplete?: string;
    } = {},
  ) => (
    <label className="memory-field" key={name} htmlFor={`memory-${name}`}>
      <span>
        {label}
        {options.required && <span aria-hidden="true"> *</span>}
      </span>
      <input
        id={`memory-${name}`}
        name={name}
        type={options.type || "text"}
        autoComplete={options.autoComplete}
        value={values[name]}
        required={options.required}
        maxLength={options.max}
        aria-invalid={!!errors[name]}
        aria-describedby={`${name}-help ${name}-error`}
        onChange={(e) => update(name, e.target.value)}
      />
      <small id={`${name}-help`}>{options.help}</small>
      <span className="field-error" id={`${name}-error`}>
        {errors[name]}
      </span>
    </label>
  );
  return (
    <form
      ref={formRef}
      className="memory-form"
      aria-label="স্মৃতি জমাদান"
      onSubmit={submit}
      noValidate
    >
      <label className="honeypot" hidden aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      {message && (
        <p className="memory-error-summary" role="alert">
          {message}
        </p>
      )}
      {preview ? (
        <section
          className="memory-preview"
          aria-labelledby="memory-preview-title"
        >
          <p className="eyebrow">পাঠকেরা যেভাবে দেখবেন</p>
          <h3 id="memory-preview-title" tabIndex={-1}>
            {values.title || "একটি স্মৃতি"}
          </h3>
          <p className="memory-byline">
            {values.attribution === "anonymous"
              ? "নাম প্রকাশে অনিচ্ছুক"
              : values.publicName}{" "}
            · {values.relationship}
          </p>
          {photoUrl && (
            <figure>
              <img
                src={photoUrl}
                alt={values.photoCaption || "আপনার নির্বাচিত ছবি"}
              />
              <figcaption>
                {values.photoCaption}
                {values.photoDate && ` · ${values.photoDate}`}
              </figcaption>
            </figure>
          )}
          <p className="memory-story-text">{values.story}</p>
          <p className="memory-private-note">
            আপনার ব্যক্তিগত নাম, ইমেইল ও ফোন নম্বর এই প্রকাশ্য পাঠে থাকবে না।
          </p>
          <div className="memory-button-row">
            <button
              className="button"
              type="button"
              disabled={busy}
              onClick={() => setPreview(false)}
            >
              ← ফিরে সম্পাদনা করুন
            </button>
            <button
              className="button button-accent"
              type="submit"
              disabled={busy}
            >
              {busy ? "জমা দেওয়া হচ্ছে…" : "পর্যালোচনার জন্য জমা দিন →"}
            </button>
          </div>
        </section>
      ) : (
        <fieldset disabled={busy}>
          <legend className="sr-only">আপনার স্মৃতি ও প্রকাশের অনুমতি</legend>
          <p className="memory-required-note">
            * চিহ্নিত ঘরগুলো পূরণ করুন। নাম, ইমেইল ও ফোন ব্যক্তিগত থাকবে।
          </p>
          <div className="memory-fields-two">
            {field("name", "আপনার নাম", {
              required: true,
              max: 160,
              autoComplete: "name",
            })}
            <label className="memory-field" htmlFor="memory-relationship">
              <span>আপনার পরিচয় *</span>
              <select
                id="memory-relationship"
                name="relationship"
                value={values.relationship}
                onChange={(e) => update("relationship", e.target.value)}
                required
                aria-invalid={!!errors.relationship}
                aria-describedby="relationship-error"
              >
                <option value="">বেছে নিন</option>
                {relationships.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <span id="relationship-error" className="field-error">
                {errors.relationship}
              </span>
            </label>
          </div>
          <div className="memory-fields-two">
            {field("email", "ইমেইল (ব্যক্তিগত)", {
              required: true,
              type: "email",
              autoComplete: "email",
              max: 254,
              help: "এই জমা নিয়ে প্রয়োজনীয় যোগাযোগের জন্য।",
            })}
            {field("phone", "ফোন নম্বর (ঐচ্ছিক, ব্যক্তিগত)", {
              type: "tel",
              autoComplete: "tel",
              max: 32,
              help: "দেশের কোডসহ, যেমন +৮৮০…",
            })}
          </div>
          {field("title", "স্মৃতির শিরোনাম (ঐচ্ছিক)", {
            max: 160,
            help: "একটি ছোট শিরোনাম দিতে পারেন।",
          })}
          <label className="memory-field" htmlFor="memory-story">
            <span>আপনার স্মৃতি বা গল্প *</span>
            <span id="story-guidance" className="sr-only">
              বড় লেখা প্রয়োজন নেই। আপনার নিজের দেখা কোনো ঘটনা বা অভিজ্ঞতাই
              মূল্যবান। প্রথম পরিচয়ের কথা মনে আছে? একসঙ্গে কাজ করার কোনো
              অভিজ্ঞতা? তাঁর কোনো কথা বা লেখা মনে রয়ে গেছে?
            </span>
            <textarea
              id="memory-story"
              name="story"
              value={values.story}
              rows={9}
              maxLength={6000}
              required
              aria-invalid={!!errors.story}
              aria-describedby="story-guidance story-help story-error"
              placeholder={
                "বড় লেখা প্রয়োজন নেই। আপনার নিজের দেখা কোনো ঘটনা বা অভিজ্ঞতাই মূল্যবান।\n\n• প্রথম পরিচয়ের কথা মনে আছে?\n• একসঙ্গে কাজ করার কোনো অভিজ্ঞতা?\n• তাঁর কোনো কথা বা লেখা মনে রয়ে গেছে?"
              }
              onChange={(e) => update("story", e.target.value)}
            />
            <small id="story-help">
              ২০–৬০০০ অক্ষর · {values.story.length.toLocaleString("bn-BD")} /
              ৬০০০
            </small>
            <span id="story-error" className="field-error">
              {errors.story}
            </span>
          </label>
          <fieldset className="memory-attribution">
            <legend>আপনার পরিচয় কীভাবে প্রকাশিত হবে?</legend>
            <label>
              <input
                name="attribution"
                type="radio"
                value="named"
                checked={values.attribution === "named"}
                onChange={() => update("attribution", "named")}
              />{" "}
              আমার বেছে নেওয়া নামে
            </label>
            <label>
              <input
                name="attribution"
                type="radio"
                value="anonymous"
                checked={values.attribution === "anonymous"}
                onChange={() => update("attribution", "anonymous")}
              />{" "}
              নাম প্রকাশ না করে
            </label>
            {values.attribution === "named" &&
              field("publicName", "প্রকাশের জন্য নাম", {
                required: true,
                max: 160,
                help: "শুধু এই নামটিই গল্পের পাশে দেখা যাবে।",
              })}
          </fieldset>
          <details className="memory-photo-section">
            <summary>একটি ছবি যোগ করুন (ঐচ্ছিক)</summary>
            <label className="memory-field" htmlFor="memory-photo">
              <span>ছবি নির্বাচন</span>
              <input
                ref={fileRef}
                id="memory-photo"
                name="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => choose(e.target.files?.[0])}
                aria-describedby="photo-help photo-error"
                aria-invalid={!!errors.photo}
              />
              <small id="photo-help">JPG, PNG বা WebP · সর্বোচ্চ ৫ MB</small>
              <span id="photo-error" className="field-error">
                {errors.photo}
              </span>
            </label>
            {photoUrl && (
              <div className="memory-photo-preview">
                <img
                  src={photoUrl}
                  alt="নির্বাচিত ছবির প্রিভিউ"
                  onError={() => {
                    setErrors((e) => ({
                      ...e,
                      photo: "ছবিটি খোলা যাচ্ছে না। অন্য ছবি দিন।",
                    }));
                  }}
                />
                <button
                  type="button"
                  className="memory-read-more"
                  onClick={() => {
                    setPhoto(null);
                    setErrors((e) => ({ ...e, photo: "" }));
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                >
                  ছবি সরান ×
                </button>
              </div>
            )}
            {field("photoCaption", "ছবির বিবরণ (ঐচ্ছিক)", {
              max: 500,
              help: "ছবিতে কারা আছেন ও কী উপলক্ষ, সংক্ষেপে লিখুন।",
            })}
            {field("photoDate", "ছবির আনুমানিক সময় (ঐচ্ছিক)", {
              max: 100,
              help: "যেমন: আনুমানিক ১৯৯৫ সাল",
            })}
          </details>
          <fieldset className="memory-permissions">
            <legend>আপনার অনুমতি</legend>
            {(
              [
                [
                  "consentStory",
                  "আমার গল্প সম্পাদকীয় পর্যালোচনার পর প্রকাশের জন্য বিবেচনা করা যেতে পারে।",
                  true,
                ],
                [
                  "consentPhoto",
                  "ছবি দিলে: এটি প্রকাশের অধিকার ও ছবিতে থাকা ব্যক্তিদের প্রয়োজনীয় অনুমতি আমার আছে; ছবিটি প্রকাশ করা যেতে পারে।",
                  false,
                ],
                [
                  "consentContact",
                  "এই জমার বাইরে ভবিষ্যতেও আমার সঙ্গে যোগাযোগ করা যেতে পারে। (ঐচ্ছিক)",
                  false,
                ],
              ] as const
            ).map(([name, label, required]) => (
              <div key={name}>
                <label>
                  <input
                    name={name}
                    type="checkbox"
                    checked={values[name] === "true"}
                    onChange={(e) => update(name, String(e.target.checked))}
                    required={required}
                    aria-describedby={`${name}-error`}
                  />
                  {label}
                  {required && " *"}
                </label>
                <span className="field-error" id={`${name}-error`}>
                  {errors[name]}
                </span>
              </div>
            ))}
          </fieldset>

          <div className="memory-process memory-form-process">
            <h3>জমার পর কী হয়?</h3>
            <ol>
              <li>আপনার জমা ব্যক্তিগতভাবে সংরক্ষিত হয়।</li>
              <li>সম্পাদক গল্প, অনুমতি ও ছবি পর্যালোচনা করেন।</li>
              <li>অনুমোদিত স্মৃতি আপনার বেছে নেওয়া পরিচয়ে প্রকাশিত হয়।</li>
            </ol>
            <p className="memory-private-note">
              ব্যক্তিগত যোগাযোগের তথ্য প্রকাশিত হবে না।{" "}
              <a href="/policies#memory-privacy">গোপনীয়তা ও প্রকাশের নীতি ↗</a>
            </p>
          </div>
          <p className="memory-private-note">
            জমার পরে পাওয়া গোপন কোড দিয়ে প্রকাশ থেকে প্রত্যাহার বা সংশোধনের
            অনুরোধ করতে পারবেন। <a href="#manage-memory">আরও জানুন</a>
          </p>
          <button className="button button-accent" type="submit">
            আগে দেখে নিন →
          </button>
        </fieldset>
      )}
    </form>
  );
}
