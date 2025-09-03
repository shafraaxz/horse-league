// ===========================================
// FILE: pages/admin/index.js (UPDATE - Add Fair Play Link)
// Add this to the Quick Actions section around line 230
// ===========================================

{/* Add this new card to the Quick Actions grid */}
<div className="card">
  <h3 className="text-lg font-semibold mb-4">Disciplinary Management</h3>
  <div className="space-y-2">
    <button
      onClick={() => router.push('/admin/fairplay')}
      className="w-full btn btn-primary"
    >
      Manage Fair Play
    </button>
    <button
      onClick={() => router.push('/standings')}
      className="w-full btn btn-secondary"
    >
      View Standings
    </button>
  </div>
</div>
