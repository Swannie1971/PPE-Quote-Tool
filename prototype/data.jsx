/* Mock data for Power Panels & Electrical quote tool */

const CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'enclosure', label: 'Enclosures' },
  { id: 'protection', label: 'Circuit Protection' },
  { id: 'copper', label: 'Copper Work' },
  { id: 'internal', label: 'Internal Comp.' },
  { id: 'wiring', label: 'Wiring' },
  { id: 'automation', label: 'Automation' },
  { id: 'metering', label: 'Metering' },
  { id: 'labour', label: 'Labour' },
  { id: 'misc', label: 'Misc.' },
];

// Sample BOM lines for a fictional project — realistic part numbers, plausible ZAR pricing
const INITIAL_BOM = [
  // Enclosure
  { id: 'L001', code: 'RIT-AE-1380.500', cat: 'enclosure', supplier: 'Rittal',
    desc: 'AE 1380.500 Wall-mount enclosure 800×600×250mm IP66 steel',
    unit: 'ea', qty: 1, cost: 4850, markup: 28, notes: '' },
  { id: 'L002', code: 'SCH-NSYS3D8625', cat: 'enclosure', supplier: 'Schneider',
    desc: 'Spacial S3D floor-standing 1800×800×600mm RAL7035',
    unit: 'ea', qty: 1, cost: 18200, markup: 25, notes: 'Confirm cable entry — bottom plinth' },

  // Protection
  { id: 'L003', code: 'SCH-LV432693', cat: 'protection', supplier: 'Schneider',
    desc: 'Compact NSX160F TMD 160A 3P3D 36kA MCCB',
    unit: 'ea', qty: 1, cost: 6420, markup: 30, notes: '' },
  { id: 'L004', code: 'ABB-1SDA068153R1', cat: 'protection', supplier: 'ABB',
    desc: 'Tmax XT2N 160 TMD 100A 3P F F MCCB 36kA',
    unit: 'ea', qty: 2, cost: 4180, markup: 30, notes: '' },
  { id: 'L005', code: 'SCH-A9F44116', cat: 'protection', supplier: 'Schneider',
    desc: 'Acti9 iC60N 1P C16A 10kA MCB',
    unit: 'ea', qty: 18, cost: 285, markup: 35, notes: '' },
  { id: 'L006', code: 'SCH-A9R51225', cat: 'protection', supplier: 'Schneider',
    desc: 'Acti9 iID 2P 25A 30mA AC-type RCCB',
    unit: 'ea', qty: 6, cost: 1240, markup: 32, notes: '' },
  { id: 'L007', code: 'EAT-PLS6-C16/1-MW', cat: 'protection', supplier: 'Eaton',
    desc: 'PLS6 1P C16A 6kA MCB',
    unit: 'ea', qty: 12, cost: 168, markup: 38, notes: '' },
  { id: 'L008', code: 'DEH-DG-M-TT-2P', cat: 'protection', supplier: 'Dehn',
    desc: 'DEHNguard M TT 2P 275 surge protection device Type 2',
    unit: 'ea', qty: 1, cost: 3850, markup: 28, notes: '' },

  // Copper
  { id: 'L009', code: 'CU-40X10-TIN', cat: 'copper', supplier: 'African Cables',
    desc: 'Copper busbar 40×10mm tinned — 250A rated',
    unit: 'm', qty: 4.2, cost: 920, markup: 35, notes: '' },
  { id: 'L010', code: 'CU-25X5-BARE', cat: 'copper', supplier: 'African Cables',
    desc: 'Copper earth bar 25×5mm — drilled & predrilled',
    unit: 'm', qty: 1.6, cost: 380, markup: 35, notes: '' },
  { id: 'L011', code: 'CU-INSUL-SUPP', cat: 'copper', supplier: 'In-house',
    desc: 'Busbar insulator support 40mm — DIN 43673 polyester',
    unit: 'ea', qty: 12, cost: 95, markup: 40, notes: '' },

  // Internal
  { id: 'L012', code: 'PXC-DIN35-2M', cat: 'internal', supplier: 'Phoenix Contact',
    desc: 'NS 35/7.5 perforated DIN rail — 2m length',
    unit: 'm', qty: 6.5, cost: 64, markup: 35, notes: '' },
  { id: 'L013', code: 'LGR-60X60-PVC', cat: 'internal', supplier: 'Legrand',
    desc: 'Slotted PVC trunking 60×60mm grey w/ cover',
    unit: 'm', qty: 14, cost: 78, markup: 38, notes: '' },
  { id: 'L014', code: 'PXC-UT2.5', cat: 'internal', supplier: 'Phoenix Contact',
    desc: 'UT 2.5 screw terminal block 2.5mm² grey',
    unit: 'ea', qty: 120, cost: 18, markup: 45, notes: '' },
  { id: 'L015', code: 'WGO-FR-EF', cat: 'internal', supplier: 'Wago',
    desc: 'End plate / partition for TOPJOB® S — grey',
    unit: 'ea', qty: 12, cost: 12, markup: 50, notes: '' },

  // Wiring
  { id: 'L016', code: 'TC-H07V-K-2.5-BL', cat: 'wiring', supplier: 'Top Cable',
    desc: 'H07V-K 2.5mm² flexible single core — blue (control)',
    unit: 'm', qty: 180, cost: 11.80, markup: 40, notes: '' },
  { id: 'L017', code: 'TC-N2XY-4G16', cat: 'wiring', supplier: 'Top Cable',
    desc: 'N2XY 4G16mm² LV power cable — black',
    unit: 'm', qty: 22, cost: 248, markup: 35, notes: '' },
  { id: 'L018', code: 'CMB-CL-16-M6', cat: 'wiring', supplier: 'Cembre',
    desc: 'Tubular Cu lug 16mm² M6 — pre-insulated',
    unit: 'ea', qty: 24, cost: 18, markup: 45, notes: '' },

  // Automation
  { id: 'L019', code: 'SIE-6ES7214-1AG40', cat: 'automation', supplier: 'Siemens',
    desc: 'SIMATIC S7-1200 CPU 1214C DC/DC/DC 14DI/10DO/2AI',
    unit: 'ea', qty: 1, cost: 9650, markup: 25, notes: 'Programming separate' },
  { id: 'L020', code: 'SIE-6AV2123-2GB03', cat: 'automation', supplier: 'Siemens',
    desc: 'SIMATIC HMI KTP700 Basic 7" colour touch panel',
    unit: 'ea', qty: 1, cost: 11200, markup: 25, notes: '' },
  { id: 'L021', code: 'PXC-QUINT-PS-24DC', cat: 'automation', supplier: 'Phoenix Contact',
    desc: 'QUINT4-PS/1AC/24DC/10 power supply 24V 10A',
    unit: 'ea', qty: 1, cost: 4280, markup: 28, notes: '' },
  { id: 'L022', code: 'FNL-22.3T.91.5024', cat: 'automation', supplier: 'Finder',
    desc: '38.51 PLC relay module 24V DC 6A SPDT — w/ socket',
    unit: 'ea', qty: 16, cost: 168, markup: 40, notes: '' },

  // Metering
  { id: 'L023', code: 'JNZ-UMG96RM-CBM', cat: 'metering', supplier: 'Janitza',
    desc: 'UMG 96RM-CBM power quality meter — Modbus RTU',
    unit: 'ea', qty: 1, cost: 14800, markup: 22, notes: '' },
  { id: 'L024', code: 'ABB-CT-200/5', cat: 'metering', supplier: 'ABB',
    desc: 'Current transformer 200/5A class 0.5 — split core',
    unit: 'ea', qty: 3, cost: 720, markup: 35, notes: '' },
  { id: 'L025', code: 'SCH-XB5AVB1', cat: 'metering', supplier: 'Schneider',
    desc: 'Harmony XB5 Ø22 LED pilot light — white 24V',
    unit: 'ea', qty: 8, cost: 195, markup: 45, notes: '' },
];

// Labour estimate
const INITIAL_LABOUR = [
  { id: 'LB1', cat: 'Mechanical assembly', hours: 18, rate: 420, skill: 'Skilled' },
  { id: 'LB2', cat: 'Copper fabrication',  hours: 6.5, rate: 520, skill: 'Specialist' },
  { id: 'LB3', cat: 'Wiring',              hours: 28, rate: 380, skill: 'Skilled' },
  { id: 'LB4', cat: 'PLC / automation',    hours: 12, rate: 680, skill: 'Engineer' },
  { id: 'LB5', cat: 'Testing & FAT',       hours: 8,  rate: 580, skill: 'Engineer' },
  { id: 'LB6', cat: 'QC sign-off',         hours: 2,  rate: 580, skill: 'Engineer' },
];

const QUOTES = [
  { num: 'PQ-2026-0184', client: 'Anglo Plat — Mogalakwena', project: 'MCC Refurb — Section 4', value: 487250, margin: 28.4, status: 'sent', estimator: 'D. Mokoena', date: '2026-05-08' },
  { num: 'PQ-2026-0183', client: 'Sasol Secunda',          project: 'Distribution Board DB-12B',    value: 184600, margin: 31.2, status: 'won',   estimator: 'D. Mokoena', date: '2026-05-07' },
  { num: 'PQ-2026-0182', client: 'Engen Refinery',         project: 'Emergency Lighting Panel',      value: 92300,  margin: 24.1, status: 'sent', estimator: 'C. van Wyk', date: '2026-05-06' },
  { num: 'PQ-2026-0181', client: 'Tongaat Hulett',         project: 'PLC Control Panel — Mill 3',    value: 298400, margin: 33.8, status: 'won',   estimator: 'D. Mokoena', date: '2026-05-05' },
  { num: 'PQ-2026-0180', client: 'Exxaro Grootegeluk',     project: 'Substation MCC × 3',            value: 1240500, margin: 22.6, status: 'draft', estimator: 'D. Mokoena', date: '2026-05-04' },
  { num: 'PQ-2026-0179', client: 'Mondi Richards Bay',     project: 'Pump Station Control Panel',    value: 156800, margin: 29.4, status: 'lost',  estimator: 'C. van Wyk', date: '2026-05-01' },
  { num: 'PQ-2026-0178', client: 'Sibanye Stillwater',     project: 'Underground feeder DB',         value: 211900, margin: 26.7, status: 'won',   estimator: 'C. van Wyk', date: '2026-04-29' },
  { num: 'PQ-2026-0177', client: 'PetroSA Mossel Bay',     project: 'Motor Control Centre',          value: 658200, margin: 30.1, status: 'sent', estimator: 'D. Mokoena', date: '2026-04-28' },
];

const CURRENT_PROJECT = {
  num: 'PQ-2026-0185',
  customer: 'Sasol Secunda',
  contact: 'J. Pretorius',
  phone: '+27 82 419 6627',
  email: 'jp.pretorius@sasol.com',
  address: '1 Klasie Havenga Rd, Secunda, 2302',
  project: 'PLC Control Panel — Reactor 7',
  site: 'Sasol Secunda Operations — Bldg C7',
  estimator: 'D. Mokoena',
  date: '2026-05-11',
  validity: 30,
  currency: 'ZAR',
  notes: 'Panel to mount adjacent to existing DB-7. Confirm hot-work permit lead time.',
};

window.PPE = { CATEGORIES, INITIAL_BOM, INITIAL_LABOUR, QUOTES, CURRENT_PROJECT };
