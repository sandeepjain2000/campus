'use client';
import { formatStatus, getStatusColor, getRoleDisplayName } from '@/lib/utils';

const users = [
  { id: 1, name: 'Platform Admin', email: 'admin@placementhub.com', role: 'super_admin', active: true },
  { id: 2, name: 'Rajesh Kumar', email: 'admin@iitm.edu', role: 'college_admin', active: true },
  { id: 3, name: 'Priya Sharma', email: 'admin@nitt.edu', role: 'college_admin', active: true },
  { id: 4, name: 'Anita Desai', email: 'hr@techcorp.com', role: 'employer', active: true },
  { id: 5, name: 'Arjun Verma', email: 'arjun.verma@iitm.edu', role: 'student', active: true },
  { id: 6, name: 'Sneha Iyer', email: 'sneha.iyer@iitm.edu', role: 'student', active: true },
];

export default function AdminUsersPage() {
  return (
    <div className="animate-fadeIn">
      <div className="page-header"><div className="page-header-left"><h1>👥 Manage Users</h1><p>All users across the platform</p></div></div>
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{users.map(u => (
            <tr key={u.id}>
              <td><div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}><div className="avatar avatar-sm">{u.name.split(' ').map(n=>n[0]).join('')}</div><span className="font-semibold">{u.name}</span></div></td>
              <td className="text-sm">{u.email}</td>
              <td><span className={`badge badge-${u.role === 'super_admin' ? 'red' : u.role === 'college_admin' ? 'indigo' : u.role === 'employer' ? 'green' : 'blue'}`}>{getRoleDisplayName(u.role)}</span></td>
              <td><span className="badge badge-green badge-dot">Active</span></td>
              <td><button className="btn btn-ghost btn-sm" onClick={() => alert("Feature coming soon! (Wireframe Action)")}>Edit</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
