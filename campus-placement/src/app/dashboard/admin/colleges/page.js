'use client';

const colleges = [
  { id: 1, name: 'IIT Mumbai', slug: 'iit-mumbai', city: 'Mumbai', naac: 'A++', students: 1250, placed: 478, active: true },
  { id: 2, name: 'NIT Trichy', slug: 'nit-trichy', city: 'Tiruchirappalli', naac: 'A+', students: 980, placed: 356, active: true },
  { id: 3, name: 'BITS Pilani', slug: 'bits-pilani', city: 'Pilani', naac: 'A+', students: 1100, placed: 412, active: true },
];

export default function AdminCollegesPage() {
  return (
    <div className="animate-fadeIn">
      <div className="page-header"><div className="page-header-left"><h1>🏫 Manage Colleges</h1><p>All registered colleges on the platform</p></div><button className="btn btn-primary" onClick={() => alert("Feature coming soon! (Wireframe Action)")}>+ Add College</button></div>
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>College</th><th>City</th><th>NAAC</th><th>Students</th><th>Placed</th><th>Rate</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {colleges.map(c => (
              <tr key={c.id}>
                <td className="font-semibold">{c.name}</td><td>{c.city}</td><td><span className="badge badge-indigo">{c.naac}</span></td>
                <td>{c.students}</td><td>{c.placed}</td><td className="font-bold">{Math.round(c.placed/c.students*100)}%</td>
                <td><span className="badge badge-green badge-dot">{c.active ? 'Active' : 'Inactive'}</span></td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => alert("Feature coming soon! (Wireframe Action)")}>View</button><button className="btn btn-ghost btn-sm" onClick={() => alert("Feature coming soon! (Wireframe Action)")}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
