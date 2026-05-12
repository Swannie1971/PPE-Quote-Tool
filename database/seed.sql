-- Seed data for Power Panels & Electrical Quote Tool
-- Run AFTER schema.sql

-- ─────────────────────────────────────────────
-- Default admin user
-- DO NOT use this INSERT directly — the hash below is a placeholder.
-- Instead, run setup.php on the server to create your admin account properly.
-- ─────────────────────────────────────────────
-- INSERT INTO users ... (use setup.php instead)

-- ─────────────────────────────────────────────
-- Default settings
-- ─────────────────────────────────────────────
INSERT INTO settings (`key`, `value`) VALUES
('quote_prefix',        'PQ'),
('quote_year',          YEAR(NOW())),
('quote_next_number',   '1'),
('default_vat_rate',    '15'),
('default_validity',    '30'),
('default_markup',      '30'),
('labour_markup',       '45'),
('margin_target',       '25'),
('company_name',        'Power Panels & Electrical (Pty) Ltd'),
('company_sub',         'Distribution Boards · MCCs · Control Panels'),
('company_address',     '12 Anvil Rd, Isando 1600'),
('company_phone',       '+27 11 974 4218'),
('company_email',       'sales@powerpanels.co.za'),
('company_website',     'powerpanels.co.za'),
('company_reg',         '2014/118472/07'),
('company_vat',         '4520271883'),
('company_cert',        'ISO 9001:2015 · SANS 1973 accredited assembler'),
('copper_price_per_m',  '358'),
('copper_waste_pct',    '12'),
('copper_fab_rate',     '520'),
('copper_size_prices',  '[{"w":30,"h":10,"price":687.5},{"w":40,"h":10,"price":937.5},{"w":50,"h":10,"price":1125},{"w":60,"h":10,"price":1375},{"w":80,"h":10,"price":1812.5},{"w":100,"h":10,"price":2250},{"w":120,"h":10,"price":2687.5}]');

-- ─────────────────────────────────────────────
-- Sample pricing items
-- ─────────────────────────────────────────────
INSERT INTO pricing_items (item_code, description, category, supplier, unit, cost_price, default_markup) VALUES
-- Enclosures
('RIT-AE-1380.500',  'AE 1380.500 Wall-mount enclosure 800×600×250mm IP66 steel',           'enclosure',  'Rittal',          'ea',  4850.00, 28),
('SCH-NSYS3D8625',   'Spacial S3D floor-standing 1800×800×600mm RAL7035',                    'enclosure',  'Schneider',       'ea', 18200.00, 25),
('RIT-TS8805.000',   'TS 8805.000 Baying enclosure 2000×600×500mm IP55',                    'enclosure',  'Rittal',          'ea', 22500.00, 25),
-- Circuit Protection
('SCH-LV432693',     'Compact NSX160F TMD 160A 3P3D 36kA MCCB',                             'protection', 'Schneider',       'ea',  6420.00, 30),
('ABB-1SDA068153R1', 'Tmax XT2N 160 TMD 100A 3P F F MCCB 36kA',                             'protection', 'ABB',             'ea',  4180.00, 30),
('SCH-A9F44116',     'Acti9 iC60N 1P C16A 10kA MCB',                                        'protection', 'Schneider',       'ea',   285.00, 35),
('SCH-A9F44132',     'Acti9 iC60N 1P C32A 10kA MCB',                                        'protection', 'Schneider',       'ea',   295.00, 35),
('SCH-A9R51225',     'Acti9 iID 2P 25A 30mA AC-type RCCB',                                  'protection', 'Schneider',       'ea',  1240.00, 32),
('EAT-PLS6-C16/1',   'PLS6 1P C16A 6kA MCB',                                               'protection', 'Eaton',           'ea',   168.00, 38),
('DEH-DG-M-TT-2P',   'DEHNguard M TT 2P 275 surge protection device Type 2',               'protection', 'Dehn',            'ea',  3850.00, 28),
-- Copper
('CU-40X10-TIN',     'Copper busbar 40×10mm tinned — 250A rated',                           'copper',     'African Cables',  'm',    920.00, 35),
('CU-25X5-BARE',     'Copper earth bar 25×5mm — drilled & predrilled',                      'copper',     'African Cables',  'm',    380.00, 35),
('CU-INSUL-SUPP',    'Busbar insulator support 40mm — DIN 43673 polyester',                 'copper',     'In-house',        'ea',    95.00, 40),
-- Internal
('PXC-DIN35-2M',     'NS 35/7.5 perforated DIN rail — 2m length',                          'internal',   'Phoenix Contact', 'm',     64.00, 35),
('LGR-60X60-PVC',    'Slotted PVC trunking 60×60mm grey w/ cover',                         'internal',   'Legrand',         'm',     78.00, 38),
('PXC-UT2.5',        'UT 2.5 screw terminal block 2.5mm² grey',                             'internal',   'Phoenix Contact', 'ea',    18.00, 45),
('WGO-FR-EF',        'End plate / partition for TOPJOB® S — grey',                          'internal',   'Wago',            'ea',    12.00, 50),
-- Wiring
('TC-H07V-K-2.5-BL', 'H07V-K 2.5mm² flexible single core — blue (control)',               'wiring',     'Top Cable',       'm',     11.80, 40),
('TC-N2XY-4G16',     'N2XY 4G16mm² LV power cable — black',                               'wiring',     'Top Cable',       'm',    248.00, 35),
('CMB-CL-16-M6',     'Tubular Cu lug 16mm² M6 — pre-insulated',                            'wiring',     'Cembre',          'ea',    18.00, 45),
-- Automation
('SIE-6ES7214-1AG40','SIMATIC S7-1200 CPU 1214C DC/DC/DC 14DI/10DO/2AI',                  'automation', 'Siemens',         'ea',  9650.00, 25),
('SIE-6AV2123-2GB03','SIMATIC HMI KTP700 Basic 7" colour touch panel',                    'automation', 'Siemens',         'ea', 11200.00, 25),
('PXC-QUINT-PS-24DC','QUINT4-PS/1AC/24DC/10 power supply 24V 10A',                        'automation', 'Phoenix Contact', 'ea',  4280.00, 28),
('FNL-22.3T.91.5024','38.51 PLC relay module 24V DC 6A SPDT — w/ socket',                 'automation', 'Finder',          'ea',   168.00, 40),
-- Metering
('JNZ-UMG96RM-CBM',  'UMG 96RM-CBM power quality meter — Modbus RTU',                     'metering',   'Janitza',         'ea', 14800.00, 22),
('ABB-CT-200/5',     'Current transformer 200/5A class 0.5 — split core',                  'metering',   'ABB',             'ea',   720.00, 35),
('SCH-XB5AVB1',      'Harmony XB5 Ø22 LED pilot light — white 24V',                       'metering',   'Schneider',       'ea',   195.00, 45);
