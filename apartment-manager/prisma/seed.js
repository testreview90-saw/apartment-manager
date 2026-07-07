const path = require('path')
const { DatabaseSync } = require('node:sqlite')

const DB_PATH = path.join(process.cwd(), 'dev.db')
const db = new DatabaseSync(DB_PATH)

/* ------------------------------------------------------------------ */
/* Schema (same as db.ts — idempotent)                                 */
/* ------------------------------------------------------------------ */
db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT, room_number TEXT UNIQUE NOT NULL,
    floor INTEGER NOT NULL, monthly_rent REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'available', notes TEXT,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT, room_id INTEGER UNIQUE NOT NULL,
    full_name TEXT NOT NULL, phone TEXT NOT NULL, id_photo TEXT,
    move_in_date TEXT NOT NULL, deposit REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', notes TEXT,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
  );
  CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id INTEGER NOT NULL, room_id INTEGER NOT NULL,
    billing_month TEXT NOT NULL, rent_amount REAL NOT NULL,
    water_prev REAL DEFAULT 0, water_curr REAL DEFAULT 0, water_units REAL DEFAULT 0,
    water_rate REAL DEFAULT 0, water_amount REAL DEFAULT 0,
    elec_prev REAL DEFAULT 0, elec_curr REAL DEFAULT 0, elec_units REAL DEFAULT 0,
    elec_rate REAL DEFAULT 0, elec_amount REAL DEFAULT 0,
    total_amount REAL DEFAULT 0, due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unpaid', paid_date TEXT, notes TEXT,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    UNIQUE(tenant_id, billing_month)
  );
  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT, room_id INTEGER,
    applicant_name TEXT NOT NULL, phone TEXT NOT NULL, notes TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL, setting_value TEXT NOT NULL
  );
`)

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */
const setSetting = db.prepare(
  `INSERT INTO settings(setting_key, setting_value) VALUES(?,?)
   ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value`
)
setSetting.run('water_rate',       '18')
setSetting.run('electricity_rate', '7')
setSetting.run('due_day',          '5')
setSetting.run('building_name',    'My Apartments')

/* ------------------------------------------------------------------ */
/* Rooms — 20 rooms, floors 1-4, 5 per floor                         */
/* ------------------------------------------------------------------ */
const insertRoom = db.prepare(
  `INSERT INTO rooms(room_number, floor, monthly_rent, status)
   VALUES(?,?,?,?)
   ON CONFLICT(room_number) DO NOTHING`
)
for (let floor = 1; floor <= 4; floor++) {
  for (let n = 1; n <= 5; n++) {
    insertRoom.run(String(floor * 100 + n), floor, 3500, 'available')
  }
}

/* ------------------------------------------------------------------ */
/* Occupied rooms + tenants + this month's bills                      */
/* ------------------------------------------------------------------ */
const occupied = [
  { roomNum: '101', name: 'สมชาย ใจดี',     phone: '081-234-5678' },
  { roomNum: '102', name: 'วิไล แสนสุข',     phone: '082-345-6789' },
  { roomNum: '103', name: 'ประเสริฐ มีสุข',  phone: '083-456-7890' },
  { roomNum: '201', name: 'นงนุช ทองดี',     phone: '084-567-8901' },
  { roomNum: '202', name: 'สุรชัย พรมมา',    phone: '085-678-9012' },
  { roomNum: '301', name: 'มาลี สมใจ',       phone: '086-789-0123' },
  { roomNum: '302', name: 'ธนกร วงษ์ดี',     phone: '087-890-1234' },
  { roomNum: '303', name: 'พิมพ์ใจ ดีงาม',  phone: '088-901-2345' },
  { roomNum: '401', name: 'อำนาจ ศรีดี',     phone: '089-012-3456' },
]

const now   = new Date()
const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
const dueDate = new Date(now.getFullYear(), now.getMonth(), 5).toISOString().split('T')[0]

const getRoom      = db.prepare('SELECT id FROM rooms WHERE room_number = ?')
const getTenant    = db.prepare('SELECT id FROM tenants WHERE room_id = ?')
const insertTenant = db.prepare(
  `INSERT INTO tenants(room_id, full_name, phone, move_in_date, deposit, status)
   VALUES(?,?,?,?,?,?) ON CONFLICT(room_id) DO NOTHING`
)
const insertBill = db.prepare(
  `INSERT INTO bills(tenant_id,room_id,billing_month,rent_amount,
     water_prev,water_curr,water_units,water_rate,water_amount,
     elec_prev,elec_curr,elec_units,elec_rate,elec_amount,
     total_amount,due_date,status,paid_date)
   VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
   ON CONFLICT(tenant_id,billing_month) DO NOTHING`
)

for (let i = 0; i < occupied.length; i++) {
  const { roomNum, name, phone } = occupied[i]
  const room = getRoom.get(roomNum)
  if (!room) continue

  db.prepare(`UPDATE rooms SET status='occupied' WHERE id=?`).run(room.id)
  insertTenant.run(room.id, name, phone, '2024-01-01', 7000, 'active')

  const tenant = getTenant.get(room.id)
  if (!tenant) continue

  const wUnits = Math.floor(Math.random() * 10) + 3
  const eUnits = Math.floor(Math.random() * 100) + 50
  const wAmt   = wUnits * 18
  const eAmt   = eUnits * 7
  const total  = 3500 + wAmt + eAmt
  const isPaid = i < 4  // first 4 = paid, rest = unpaid

  insertBill.run(
    tenant.id, room.id, month, 3500,
    100, 100 + wUnits, wUnits, 18, wAmt,
    500, 500 + eUnits, eUnits, 7, eAmt,
    total, dueDate,
    isPaid ? 'paid' : 'unpaid',
    isPaid ? now.toISOString().split('T')[0] : null
  )
}

// One room under maintenance
db.prepare(`UPDATE rooms SET status='maintenance' WHERE room_number='204'`).run()

console.log('✓ Seed complete! Rooms: 20, Tenants: 9, Bills:', month)
