"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { SportConfig } from "@/config/sports.config";
import type { RegisteredInfo } from "@/components/SportPageClient";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Intern", "SR", "HOD", "Associate Professor", "Assistant Professor"];
const DEPARTMENTS = [
  "UG student",
  "Anatomy", "Physiology", "Biochemistry", "PSM", "Pharmacology",
  "Pathology", "Microbiology", "Medicine", "Surgery", "Obs-Gyne",
  "Ophthalmology", "Pediatrics", "ENT", "Radiology", "Forensic",
  "Orthopedics", "Psychiatry", "Dermatology", "Anesthesia",
];

const memberSchema = z.object({
  name: z.string().min(2, "Name required"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[6-9]\d{9}$/.test(val),
      "Enter valid 10-digit number"
    ),
  year: z.string().min(1, "Select year"),
  dept: z.string().min(1, "Select department"),
});

const teamFormSchema = z.object({
  teamName: z.string().min(2, "Team name required").optional(),
  category: z.string().min(1, "Select category"),
  captain: z.object({
    name: z.string().min(2, "Name required"),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Enter valid 10-digit number"),
    year: z.string().min(1, "Select year"),
    dept: z.string().min(1, "Select department"),
  }),
  members: z.array(memberSchema).optional(),
});

type FormValues = z.infer<typeof teamFormSchema>;

const inputClass =
  "w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-white/40 text-base focus:outline-none focus:border-yellow-400/60 focus:bg-white/10 transition";
const selectClass =
  "w-full bg-[#0d1530] border border-white/15 rounded-lg px-4 py-3 text-white text-base focus:outline-none focus:border-yellow-400/60 transition appearance-none";
const labelClass = "block text-sm font-medium text-white/70 mb-1";
const errorClass = "text-red-400 text-xs mt-1";

interface SportFormProps {
  sport: SportConfig;
  onRegistered: (info: RegisteredInfo) => void;
}

export default function SportForm({ sport, onRegistered }: SportFormProps) {
  const [loading, setLoading] = useState(false);
  // memberCount tracks the number of team-sport members the captain wants to add
  const [memberCount, setMemberCount] = useState(0);

  const isTeam = sport.type === "team";

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: { members: [] },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "members",
  });

  const selectedCategory = watch("category");

  // ── Racket/board sports: auto-adjust member fields when category changes ──
  useEffect(() => {
    if (!sport.formatMemberCount || !selectedCategory) return;
    const allowed = (sport.formatMemberCount[selectedCategory] ?? 1) - 1;
    // Replace all current fields with the correct blank slate
    replace(
      allowed === 1 ? [{ name: "", phone: "", year: "", dept: "" }] : []
    );
    setMemberCount(allowed);
  }, [selectedCategory, sport.formatMemberCount, replace]);

  // ── Determine how many members should be shown / selectable ──────────────
  const getAllowedMemberCount = (): number => {
    // No members ever for pure individual sports
    if (sport.slug === "weight-lifting" || sport.slug === "athletics") return 0;

    // Racket/board sports — format dictates the count
    if (sport.formatMemberCount && selectedCategory) {
      return (sport.formatMemberCount[selectedCategory] ?? 1) - 1;
    }

    // Team sports — captain chooses (return sentinel -1)
    if (sport.type === "team") return -1;

    return 0;
  };

  const allowedMembers = getAllowedMemberCount();

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const teamName = isTeam
        ? (values.teamName ?? "")
        : values.captain.name;

      const body = {
        sportSlug: sport.slug,
        category: values.category,
        captain: values.captain,
        teamName,
        members: values.members ?? [],
      };

      const res = await fetch("/api/teams/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as { teamCode?: string; error?: string };

      if (res.ok) {
        const info: RegisteredInfo = {
          teamCode: data.teamCode ?? "",
          teamName,
          role: "captain",
          memberName: values.captain.name,
          sportSlug: sport.slug,
          sportName: sport.name,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(
          `genesis_registered_${sport.slug}`,
          JSON.stringify(info)
        );
        toast.success(isTeam ? "Team registered successfully!" : "Registered successfully!");
        onRegistered(info);
      } else {
        toast.error(data.error ?? "Failed to register");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Team name — team sports only */}
      {isTeam && (
        <div>
          <label className={labelClass}>Team Name *</label>
          <input
            {...register("teamName")}
            placeholder="Enter your team name"
            className={inputClass}
          />
          {errors.teamName && (
            <p className={errorClass}>{errors.teamName.message}</p>
          )}
        </div>
      )}

      {/* Category */}
      <div>
        <label className={labelClass}>Category *</label>
        <select {...register("category")} className={selectClass}>
          <option value="">Select Category...</option>
          {sport.categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {errors.category && (
          <p className={errorClass}>{errors.category.message}</p>
        )}
      </div>

      {/* Captain Details */}
      <div className="pt-2 border-t border-white/10">
        <h4 className="font-semibold text-white/90 mb-4 text-base">
          👑 Captain Details
        </h4>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Full Name *</label>
            <input
              {...register("captain.name")}
              placeholder="Captain's full name"
              className={inputClass}
            />
            {errors.captain?.name && (
              <p className={errorClass}>{errors.captain.name.message}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Phone Number *</label>
            <input
              {...register("captain.phone")}
              placeholder="10-digit mobile number"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              className={inputClass}
            />
            {errors.captain?.phone && (
              <p className={errorClass}>{errors.captain.phone.message}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Year *</label>
            <select {...register("captain.year")} className={selectClass}>
              <option value="">Select Year...</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            {errors.captain?.year && (
              <p className={errorClass}>{errors.captain.year.message}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Department *</label>
            <select {...register("captain.dept")} className={selectClass}>
              <option value="">Select Department...</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {errors.captain?.dept && (
              <p className={errorClass}>{errors.captain.dept.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── CASE 2: Racket sport — Singles selected (info box, no partner needed) */}
      {sport.formatMemberCount && selectedCategory && allowedMembers === 0 && (
        <div className="rounded-xl border border-blue-400/20 bg-blue-400/10 p-3 text-center">
          <p className="text-blue-300 text-sm">
            ℹ️ Singles format — only your details are needed. No partner required.
          </p>
        </div>
      )}

      {/* ── CASE 3: Racket sport — Doubles / Mixed Doubles (exactly 1 partner) */}
      {sport.formatMemberCount && selectedCategory && allowedMembers === 1 && (
        <div className="pt-2 border-t border-white/10">
          <h4 className="font-semibold text-white/90 mb-4 text-base">
            👥 Partner Details
          </h4>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Partner Full Name *</label>
              <input
                {...register("members.0.name")}
                placeholder="Partner's full name"
                className={inputClass}
              />
              {errors.members?.[0]?.name && (
                <p className={errorClass}>{errors.members[0].name.message}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Partner Phone (optional)</label>
              <input
                {...register("members.0.phone")}
                placeholder="10-digit mobile number"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                className={inputClass}
              />
              {errors.members?.[0]?.phone && (
                <p className={errorClass}>{errors.members[0].phone.message}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Partner Year *</label>
              <select {...register("members.0.year")} className={selectClass}>
                <option value="">Select Year...</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              {errors.members?.[0]?.year && (
                <p className={errorClass}>{errors.members[0].year.message}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Partner Department *</label>
              <select {...register("members.0.dept")} className={selectClass}>
                <option value="">Select Department...</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {errors.members?.[0]?.dept && (
                <p className={errorClass}>{errors.members[0].dept.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CASE 4: Team sports — member count dropdown + dynamic fields */}
      {allowedMembers === -1 && (
        <div className="pt-2 border-t border-white/10">
          <h4 className="font-semibold text-white/90 mb-4 text-base">
            👥 Team Members
          </h4>

          {/* Member count selector */}
          <div className="mb-5">
            <label className={labelClass}>
              Number of Members to Add (excluding you as captain)
            </label>
            <select
              value={memberCount}
              onChange={(e) => {
                const count = parseInt(e.target.value, 10);
                setMemberCount(count);
                const current = fields.length;
                if (count > current) {
                  for (let i = current; i < count; i++) {
                    append({ name: "", phone: "", year: "", dept: "" });
                  }
                } else {
                  for (let i = current; i > count; i--) {
                    remove(i - 1);
                  }
                }
              }}
              className={selectClass}
            >
              <option value={0}>0 — Register captain only</option>
              {Array.from(
                { length: sport.maxMembers - 1 },
                (_, i) => i + 1
              ).map((n) => (
                <option key={n} value={n}>
                  {n} member{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic member fields */}
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="mb-6 p-4 rounded-xl border border-white/10 bg-white/5"
            >
              <div className="flex justify-between items-center mb-3">
                <h5 className="text-white/80 font-medium text-sm">
                  Member {index + 1}
                </h5>
                <button
                  type="button"
                  onClick={() => {
                    remove(index);
                    setMemberCount((prev) => prev - 1);
                  }}
                  className="text-red-400/70 text-xs hover:text-red-400 transition"
                >
                  Remove
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <input
                    {...register(`members.${index}.name`)}
                    placeholder="Full name *"
                    className={inputClass}
                  />
                  {errors.members?.[index]?.name && (
                    <p className={errorClass}>
                      {errors.members[index]?.name?.message}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    {...register(`members.${index}.phone`)}
                    placeholder="Phone (optional)"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    className={inputClass}
                  />
                  {errors.members?.[index]?.phone && (
                    <p className={errorClass}>
                      {errors.members[index]?.phone?.message}
                    </p>
                  )}
                </div>
                <div>
                  <select
                    {...register(`members.${index}.year`)}
                    className={selectClass}
                  >
                    <option value="">Select Year *</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  {errors.members?.[index]?.year && (
                    <p className={errorClass}>
                      {errors.members[index]?.year?.message}
                    </p>
                  )}
                </div>
                <div>
                  <select
                    {...register(`members.${index}.dept`)}
                    className={selectClass}
                  >
                    <option value="">Select Department *</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {errors.members?.[index]?.dept && (
                    <p className={errorClass}>
                      {errors.members[index]?.dept?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold py-3.5 rounded-xl text-base transition mt-2"
      >
        {loading
          ? "Registering..."
          : isTeam
          ? "🚀 Register Team"
          : "🚀 Register Now"}
      </button>
    </form>
  );
}
