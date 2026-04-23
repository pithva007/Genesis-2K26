"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { SportConfig } from "@/config/sports.config";
import type { RegisteredInfo } from "@/components/SportPageClient";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML', 'CSD', 'MBA', 'MCA', 'Other'];

const formSchema = z.object({
  teamCode: z.string().length(6, "Team code must be exactly 6 characters").toUpperCase(),
  member: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
    year: z.string().min(1, "Please select your year"),
    dept: z.string().min(1, "Please select your department"),
  }),
});

type FormValues = z.infer<typeof formSchema>;

const inputClass = "w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-white/40 text-base focus:outline-none focus:border-yellow-400/60 focus:bg-white/10 transition";
const selectClass = "w-full bg-[#0d1530] border border-white/15 rounded-lg px-4 py-3 text-white text-base focus:outline-none focus:border-yellow-400/60 transition appearance-none";
const labelClass = "block text-sm font-medium text-white/70 mb-1";
const errorClass = "text-red-400 text-xs mt-1";

interface JoinTeamFormProps {
  sport: SportConfig;
  onRegistered: (info: RegisteredInfo) => void;
}

export default function JoinTeamForm({ sport, onRegistered }: JoinTeamFormProps) {
  const [loading, setLoading] = useState(false);
  const [successTeam, setSuccessTeam] = useState<{ teamName: string; captainName: string } | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sportSlug: sport.slug,
          teamCode: values.teamCode.toUpperCase(),
          member: values.member,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const info: RegisteredInfo = {
          teamCode: values.teamCode.toUpperCase(),
          teamName: data.team.teamName,
          role: 'member',
          memberName: values.member.name,
          sportSlug: sport.slug,
          sportName: sport.name,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(`genesis_registered_${sport.slug}`, JSON.stringify(info));
        setSuccessTeam({ teamName: data.team.teamName, captainName: data.team.captain.name });
        toast.success("Successfully joined the team!");
        onRegistered(info);
      } else if (
        data.error === 'Member already joined' ||
        data.error?.toLowerCase().includes('already joined') ||
        data.error?.toLowerCase().includes('already registered')
      ) {
        const teamRes = await fetch(`/api/teams/${values.teamCode.toUpperCase()}`);
        const teamData = teamRes.ok ? await teamRes.json() : null;
        const teamName: string = teamData?.teamName ?? 'Your Team';

        toast.success('You are already registered in this team!');

        const info: RegisteredInfo = {
          teamCode: values.teamCode.toUpperCase(),
          teamName,
          role: 'member',
          memberName: values.member.name,
          sportSlug: sport.slug,
          sportName: sport.name,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(`genesis_registered_${sport.slug}`, JSON.stringify(info));
        if (onRegistered) onRegistered(info);
      } else {
        toast.error(data.error || "Failed to join team");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (successTeam) {
    return (
      <div className="rounded-xl border border-green-400/30 bg-green-400/10 p-6 text-center space-y-3">
        <div className="text-4xl">✅</div>
        <h3 className="text-xl font-bold text-white">Joined Successfully!</h3>
        <p className="text-white/70 text-sm">You are now part of</p>
        <p className="text-green-400 font-bold text-lg">{successTeam.teamName}</p>
        <p className="text-white/50 text-xs">Captain: {successTeam.captainName}</p>
        <button onClick={() => setSuccessTeam(null)} className="text-white/40 text-xs underline hover:text-white/60">
          Join another team
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className={labelClass}>Team Code *</label>
        <input
          {...register("teamCode")}
          placeholder="e.g. CRK7X2"
          maxLength={6}
          className={`${inputClass} font-mono uppercase tracking-widest text-yellow-400`}
          onChange={(e) => { e.target.value = e.target.value.toUpperCase(); }}
        />
        {errors.teamCode && <p className={errorClass}>{errors.teamCode.message}</p>}
      </div>

      <div className="pt-2 border-t border-white/10">
        <h4 className="font-semibold text-white/90 mb-4 text-base">👤 Your Details</h4>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Full Name *</label>
            <input {...register("member.name")} placeholder="Your full name" className={inputClass} />
            {errors.member?.name && <p className={errorClass}>{errors.member.name.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Phone Number *</label>
            <input {...register("member.phone")} placeholder="10-digit mobile number" type="tel" inputMode="numeric" maxLength={10} className={inputClass} />
            {errors.member?.phone && <p className={errorClass}>{errors.member.phone.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Year *</label>
            <select {...register("member.year")} className={selectClass}>
              <option value="">Select Year...</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            {errors.member?.year && <p className={errorClass}>{errors.member.year.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Department *</label>
            <select {...register("member.dept")} className={selectClass}>
              <option value="">Select Department...</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.member?.dept && <p className={errorClass}>{errors.member.dept.message}</p>}
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-base transition mt-2">
        {loading ? "Joining Team..." : "🔗 Join Team"}
      </button>
    </form>
  );
}
