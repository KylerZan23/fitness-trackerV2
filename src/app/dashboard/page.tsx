import { createClient } from '@/utils/supabase/server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm">
      <h2 className="text-lg font-medium">Ready to Train?</h2>
      <p className="mt-1 text-sm text-gray-500">
        Log a new workout to get started.
      </p>
      <div className="mt-4">
        <Button asChild>
          <Link href="/workout/new">Start New Workout</Link>
        </Button>
      </div>
    </div>
  );
}
