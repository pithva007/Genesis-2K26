"use client"

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SportConfig } from '@/config/sports.config';

const formSchema = z.object({
  teamName: z.string().min(2, "Team name must be at least 2 characters"),
  category: z.string().min(1, "Please select a category"),
  captain: z.object({
    name: z.string().min(2, "Name is required"),
    phone: z.string().min(10, "Valid phone number required"),
    year: z.string().min(1, "Year is required"),
    dept: z.string().min(2, "Department is required"),
  })
});

export default function SportForm({ sport }: { sport: SportConfig }) {
  const [loading, setLoading] = useState(false);
  const [teamCode, setTeamCode] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const res = await fetch('/api/teams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, sport: sport.slug })
      });
      const data = await res.json();
      if (res.ok) setTeamCode(data.teamCode);
      else alert(data.error);
    } catch (err) {
      alert("Failed to create team.");
    } finally {
      setLoading(false);
    }
  };

  if (teamCode) {
    return (
      <div className="bg-primary/10 border border-primary p-6 rounded-lg text-center">
        <h3 className="text-xl font-bold mb-2">Team Created Successfully!</h3>
        <p className="mb-4">Share this code with your members to join:</p>
        <div className="text-4xl font-mono tracking-widest text-primary font-bold mb-4">{teamCode}</div>
        <button onClick={() => navigator.clipboard.writeText(teamCode)} className="px-4 py-2 bg-primary text-black rounded font-medium">
          Copy Code
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Team Name</label>
        <input {...register('teamName')} className="w-full bg-background border border-border rounded px-3 py-2" />
        {errors.teamName && <span className="text-red-500 text-xs">{errors.teamName.message}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select {...register('category')} className="w-full bg-background border border-border rounded px-3 py-2">
          <option value="">Select Category...</option>
          {sport.categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {errors.category && <span className="text-red-500 text-xs">{errors.category.message}</span>}
      </div>

      <div className="pt-4 border-t border-border">
        <h4 className="font-medium mb-4">Captain Details</h4>
        <div className="space-y-4">
          <input placeholder="Full Name" {...register('captain.name')} className="w-full bg-background border border-border rounded px-3 py-2" />
          <input placeholder="Phone Number" {...register('captain.phone')} className="w-full bg-background border border-border rounded px-3 py-2" />
          <input placeholder="Year" {...register('captain.year')} className="w-full bg-background border border-border rounded px-3 py-2" />
          <input placeholder="Department" {...register('captain.dept')} className="w-full bg-background border border-border rounded px-3 py-2" />
        </div>
      </div>

      <button disabled={loading} type="submit" className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-md mt-6">
        {loading ? "Creating..." : "Create Team"}
      </button>
    </form>
  )
}
