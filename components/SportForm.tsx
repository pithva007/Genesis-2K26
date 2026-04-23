"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { SportConfig } from "@/config/sports.config";
import type { RegisteredInfo } from "@/components/SportPageClient";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
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
  memberCount: z.string().optional(),
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
  const isTeam = sport.type === "team";
  const maxMemberOptions = Array.from({ length: sport.maxMembers - 1 }, (_, i) => i + 1);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      members: [],
      memberCount: "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "members" });
  const memberCount = watch("memberCount");
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (!isTeam) return;
    const count = memberCount === "" ? 0 : parseInt(memberCount ?? "0", 10);
    if (isNaN(count)) return;
    const prev = prevCountRef.current;
    prevCountRef.current = count;

    if (count > prev) {
      for (let i = prev; i < count; i++) {
        append({ name: "", phone: "", year: "", dept: "" });
      }
    } else if (count < prev) {
      for (let i = prev - 1; i >= count; i--) {
        remove(i);
      }
    }
  }, [memberCount, isTeam, append, remove]);

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
        members: isTeam ? (values.members ?? []) : [],
      };

      const res = await fetch("/api/teams/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json() as { teamCode?: string; error?: string };

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
        localStorage.setItem(`genesis_registered_${sport.slug}`, JSON.stringify(info));
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
          {errors.teamName && <p className={errorClass}>{errors.teamName.message}</p>}
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
        {errors.category && <p className={errorClass}>{errors.category.message}</p>}
      </div>

      {/* Captain Details */}
      <div className="pt-2 border-t border-white/10">
        <h4 className="font-semibold text-white/90 mb-4 text-base">👑 Captain Details</h4>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Full Name *</label>
            <input
              {...register("captain.name")}
              placeholder="Captain's full name"
              className={inputClass}
            />
            {errors.captain?.name && <p className={errorClass}>{errors.captain.name.message}</p>}
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
            {errors.captain?.phone && <p className={errorClass}>{errors.captain.phone.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Year *</label>
            <select {...register("captain.year")} className={selectClass}>
              <option value="">Select Year...</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            {errors.captain?.year && <p className={errorClass}>{errors.captain.year.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Department *</label>
            <select {...register("captain.dept")} className={selectClass}>
              <option value="">Select Department...</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {errors.captain?.dept && <p className={errorClass}>{errors.captain.dept.message}</p>}
          </div>
        </div>
      </div>

      {/* Team Members — team sports only */}
      {isTeam && (
        <div className="pt-2 border-t border-white/10">
          <h4 className="font-semibold text-white/90 mb-4 text-base">👥 Team Members</h4>

          {maxMemberOptions.length > 0 && (
            <div className="mb-5">
              <label className={labelClass}>How many members? (excluding you as captain)</label>
              <select {...register("memberCount")} className={selectClass}>
                <option value="">None</option>
                {maxMemberOptions.map((n) => (
                  <option key={n} value={String(n)}>{n}</option>
                ))}
              </select>
            </div>
          )}

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10"
            >
              <p className="text-white/70 text-sm font-semibold mb-3">Member {index + 1}</p>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Name *</label>
                  <input
                    {...register(`members.${index}.name`)}
                    placeholder="Full name"
                    className={inputClass}
                  />
                  {errors.members?.[index]?.name && (
                    <p className={errorClass}>{errors.members[index]?.name?.message}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Phone (optional)</label>
                  <input
                    {...register(`members.${index}.phone`)}
                    placeholder="10-digit mobile (optional)"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    className={inputClass}
                  />
                  {errors.members?.[index]?.phone && (
                    <p className={errorClass}>{errors.members[index]?.phone?.message}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Year *</label>
                  <select {...register(`members.${index}.year`)} className={selectClass}>
                    <option value="">Select Year...</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  {errors.members?.[index]?.year && (
                    <p className={errorClass}>{errors.members[index]?.year?.message}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Department *</label>
                  <select {...register(`members.${index}.dept`)} className={selectClass}>
                    <option value="">Select Department...</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {errors.members?.[index]?.dept && (
                    <p className={errorClass}>{errors.members[index]?.dept?.message}</p>
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
        {loading ? "Registering..." : isTeam ? "🚀 Register Team" : "🚀 Register Now"}
      </button>
    </form>
  );
}
