"use client"

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const formSchema = z.object({
  teamCode: z.string().length(6, "Team code must be exactly 6 characters"),
  member: z.object({
    name: z.string().min(2, "Name is required"),
    phone: z.string().min(10, "Valid phone number required"),
    year: z.string().min(1, "Year is required"),
    dept: z.string().min(2, "Department is required"),
  })
});

export default function JoinTeamForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const res = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const data = await res.json();
      if (res.ok) setSuccess(true);
      else alert(data.error);
    } catch (err) {
      alert("Failed to join team.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-primary/10 border border-primary p-6 rounded-lg text-center">
        <h3 className="text-xl font-bold mb-2">Joined Successfully!</h3>
        <p>You are now a member of the team.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Team Code</label>
        <input placeholder="e.g. CRK7X2" {...register('teamCode')} className="w-full bg-background border border-border rounded px-3 py-2 font-mono uppercase" />
        {errors.teamCode && <span className="text-red-500 text-xs">{errors.teamCode.message}</span>}
      </div>

      <div className="pt-4 border-t border-border">
        <h4 className="font-medium mb-4">Your Details</h4>
        <div className="space-y-4">
          <input placeholder="Full Name" {...register('member.name')} className="w-full bg-background border border-border rounded px-3 py-2" />
          <input placeholder="Phone Number" {...register('member.phone')} className="w-full bg-background border border-border rounded px-3 py-2" />
          <input placeholder="Year" {...register('member.year')} className="w-full bg-background border border-border rounded px-3 py-2" />
          <input placeholder="Department" {...register('member.dept')} className="w-full bg-background border border-border rounded px-3 py-2" />
        </div>
      </div>

      <button disabled={loading} type="submit" className="w-full bg-secondary text-secondary-foreground font-bold py-3 rounded-md mt-6 border border-border">
        {loading ? "Joining..." : "Join Team"}
      </button>
    </form>
  )
}
