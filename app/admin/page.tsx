import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Team from '@/models/Team';

export default async function AdminPage() {
  const headersList = headers();
  const authHeader = headersList.get('authorization');

  // Admin is protected by middleware.ts using Basic Auth.
  if (!process.env.ADMIN_PASSWORD) {
    return <div>Admin password not configured in ENV.</div>;
  }

  await connectDB();
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
              <tr key={t._id.toString()} className="border-b border-border hover:bg-secondary/20">
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
