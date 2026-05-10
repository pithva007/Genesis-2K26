"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function TeamCodeDisplay({
  teamCode,
  teamName,
}: {
  teamCode: string;
  teamName: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(teamCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <Card className="border-gold-400/30 bg-gradient-to-br from-gold-400/10 to-white/5">
      <CardContent className="space-y-4 p-6 text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-gold-300">Team Code</p>
        <div className="rounded-3xl border border-gold-400/20 bg-black/30 px-4 py-6">
          <div className="font-mono text-4xl font-black tracking-[0.2em] text-gold-300 sm:text-5xl">
            {teamCode}
          </div>
        </div>
        <p className="text-sm text-white/70">
          Share this code with members for <span className="font-semibold text-white">{teamName}</span>.
        </p>
        <Button type="button" className="w-full" onClick={copyCode}>
          {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? "Copied" : "Copy Code"}
        </Button>
      </CardContent>
    </Card>
  );
}

