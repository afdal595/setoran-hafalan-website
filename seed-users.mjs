import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://setoran_user:password_aman@localhost:5432/setoran_hafalan'
});

const users = [
  { name: 'Admin', email: 'admin@ldk.ac.id', role: 'admin', active: true },
  { name: 'Musyrif Test', email: 'musyrif1@ldk.ac.id', role: 'musyrif', active: true },
  { name: 'Anggota Test', email: 'anggota1@ldk.ac.id', role: 'anggota', active: true }
];

async function seedUsers() {
  try {
    for (const user of users) {
      const check = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND role = $2',
        [user.email, user.role]
      );

      if (check.rows.length === 0) {
        const result = await pool.query(
          'INSERT INTO users (name, email, role, active) VALUES ($1, $2, $3, $4) RETURNING id, email, role',
          [user.name, user.email, user.role, user.active]
        );
        console.log(`Created: ${result.rows[0].email} (${result.rows[0].role})`);
      } else {
        console.log(`Already exists: ${user.email} (${user.role})`);
      }
    }

    const all = await pool.query('SELECT email, role, active FROM users ORDER BY role');
    console.log('\nAll users:');
    all.rows.forEach(row => console.log(`  ${row.email} - ${row.role} (${row.active ? 'active' : 'inactive'})`));

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

seedUsers();
