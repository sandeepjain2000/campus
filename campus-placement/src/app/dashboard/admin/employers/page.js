'use client';

export default function AdminEmployersPage() {
  const employers = [
    { name: 'TechCorp Solutions', industry: 'IT', hires: 245, verified: true, blacklisted: false },
    { name: 'GlobalSoft Technologies', industry: 'IT', hires: 180, verified: true, blacklisted: false },
    { name: 'Infosys Limited', industry: 'IT', hires: 520, verified: true, blacklisted: false },
  ];
  return (
    <div className="animate-fadeIn">
      <div className="page-header"><div className="page-header-left"><h1>🏢 Manage Employers</h1></div></div>
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Company</th><th>Industry</th><th>Total Hires</th><th>Verified</th><th>Actions</th></tr></thead>
          <tbody>{employers.map((e,i) => (
            <tr key={i}><td className="font-semibold">{e.name}</td><td>{e.industry}</td><td>{e.hires}</td>
            <td>{e.verified ? <span className="badge badge-green">✅ Verified</span> : <span className="badge badge-amber">Pending</span>}</td>
            <td><button className="btn btn-ghost btn-sm" onClick={() => alert("Feature coming soon! (Wireframe Action)")}>View</button></td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
