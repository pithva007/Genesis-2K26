import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/Team';

export default async function AdminPage() {
  const headersList = headers();
  const authHeader = headersList.get('authorization');

  // Basic Auth setup
  if (!process.env.ADMIN_PASSWORD) {
    return <div>Admin password not configured in ENV.</div>;
  }

  if (authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    // Note: In Next14 App router, you should handle true basic auth via middleware
    // This is a simplified token check for demonstration per prompt instructions.
    return (
      <div className="p-8 max-w-md mx-auto mt-24 bg-card border border-border rounded-xl">
        <h1 className="text-xl font-bold mb-4">Admin Access</h1>
        <p className="text-sm text-muted-foreground mb-4">Please pass your admin password as a Bearer token in the Authorization header to view, or implement middleware for true browser Basic Auth.</p>
      </div>
    )
  }

  await dbConnect();
  const teams = await Team.find({}).sort({ createdAt: -1 });

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/50 border-b border-border">
            <tr>
              <th className="px-6 py-4">Team Config/Code</th>
              <th className="px-6 py-4">Sport & Category</th>
              <th className="px-6 py-4">Members</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t._id} className="border-b border-border hover:bg-secondary/20">
                <td className="px-6 py-4">
                  <div className="font-bold">{t.teamName}</div>
                  <div className="text-muted-foreground text-xs font-mono">{t.teamCode}</div>
                </td>
                <td className="px-6 py-4">
                  <div>{t.sport}</div>
                  <div className="text-xs">{t.category}</div>
                </td>
                <td className="px-6 py-4">
                  {t.members.length} / {t.maxMembers}
                  <div className="text-xs text-muted-foreground mt-1 text-wrap">
                    Captain: {t.captain.name} ({t.captain.phone})
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${t.status === 'open' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
