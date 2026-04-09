SET client_encoding = 'UTF8';

-- ── Додаткові клієнти (6–15) ──────────────────────────────────────────────
INSERT INTO clients (clientid, fullname, phone, email, createdat, loyalty_tier)
OVERRIDING SYSTEM VALUE VALUES
  (6,  'Соломія Гаврилюк',  '+380671112233', 'solomiya@gmail.com',   NOW() - INTERVAL '180 days', 'regular'),
  (7,  'Тарас Мельник',     '+380502223344', 'taras.m@ukr.net',      NOW() - INTERVAL '150 days', 'vip'),
  (8,  'Оксана Романенко',  '+380633334455', 'oksana.r@gmail.com',   NOW() - INTERVAL '120 days', 'regular'),
  (9,  'Дмитро Савченко',   '+380504445566', 'dmitro.s@gmail.com',   NOW() - INTERVAL '100 days', 'new'),
  (10, 'Юлія Кравченко',    '+380675556677', 'yulia.k@ukr.net',      NOW() - INTERVAL '90 days',  'regular'),
  (11, 'Василь Ткаченко',   '+380506667788', 'vasyl.t@gmail.com',    NOW() - INTERVAL '75 days',  'new'),
  (12, 'Інна Поліщук',      '+380637778899', 'inna.p@gmail.com',     NOW() - INTERVAL '60 days',  'new'),
  (13, 'Роман Кузьменко',   '+380508889900', 'roman.k@ukr.net',      NOW() - INTERVAL '45 days',  'vip'),
  (14, 'Катерина Лисенко',  '+380679990011', 'katya.l@gmail.com',    NOW() - INTERVAL '30 days',  'new'),
  (15, 'Максим Дорошенко',  '+380500001122', 'maks.d@gmail.com',     NOW() - INTERVAL '14 days',  'new')
ON CONFLICT (clientid) DO NOTHING;

SELECT setval('clients_clientid_seq', (SELECT MAX(clientid) FROM clients));

-- ── Акаунти для нових клієнтів (пароль Test1234!) ──────────────────────────
-- Використовуємо той самий bcrypt-хеш що і у першого клієнта
INSERT INTO users (email, passwordhash, role, clientid, fullname, createdat)
SELECT
  c.email,
  '$2a$11$vaHb4cCRij772YbYKD/tquCs9/o7VZkKAydnlvuXc8TH2eZistkHy',
  'Client',
  c.clientid,
  c.fullname,
  c.createdat
FROM clients c
WHERE c.clientid BETWEEN 6 AND 15
ON CONFLICT (email) DO NOTHING;

-- ── Бронювання ────────────────────────────────────────────────────────────
INSERT INTO reservations (clientid, roomid, checkindate, checkoutdate, totalprice, status) VALUES

-- Завершені (CheckedOut) – для статистики доходу і топ-кімнат
(7,  5,  NOW()-INTERVAL '120 days', NOW()-INTERVAL '114 days', 33000.00, 'CheckedOut'),
(7,  12, NOW()-INTERVAL '90 days',  NOW()-INTERVAL '87 days',  18600.00, 'CheckedOut'),
(13, 5,  NOW()-INTERVAL '80 days',  NOW()-INTERVAL '75 days',  27500.00, 'CheckedOut'),
(6,  3,  NOW()-INTERVAL '75 days',  NOW()-INTERVAL '72 days',  6600.00,  'CheckedOut'),
(8,  9,  NOW()-INTERVAL '70 days',  NOW()-INTERVAL '67 days',  8400.00,  'CheckedOut'),
(10, 7,  NOW()-INTERVAL '65 days',  NOW()-INTERVAL '62 days',  4200.00,  'CheckedOut'),
(13, 11, NOW()-INTERVAL '60 days',  NOW()-INTERVAL '57 days',  14400.00, 'CheckedOut'),
(6,  13, NOW()-INTERVAL '55 days',  NOW()-INTERVAL '52 days',  9600.00,  'CheckedOut'),
(7,  5,  NOW()-INTERVAL '50 days',  NOW()-INTERVAL '46 days',  22000.00, 'CheckedOut'),
(10, 3,  NOW()-INTERVAL '45 days',  NOW()-INTERVAL '43 days',  4400.00,  'CheckedOut'),
(8,  14, NOW()-INTERVAL '40 days',  NOW()-INTERVAL '38 days',  6000.00,  'CheckedOut'),
(1,  9,  NOW()-INTERVAL '35 days',  NOW()-INTERVAL '32 days',  8400.00,  'CheckedOut'),
(2,  10, NOW()-INTERVAL '30 days',  NOW()-INTERVAL '28 days',  4800.00,  'CheckedOut'),
(13, 12, NOW()-INTERVAL '25 days',  NOW()-INTERVAL '23 days',  12400.00, 'CheckedOut'),

-- Скасовані
(9,  2,  NOW()-INTERVAL '50 days',  NOW()-INTERVAL '48 days',  1800.00,  'Cancelled'),
(11, 4,  NOW()-INTERVAL '20 days',  NOW()-INTERVAL '18 days',  2200.00,  'Cancelled'),
(14, 6,  NOW()-INTERVAL '10 days',  NOW()-INTERVAL '8 days',   2100.00,  'Cancelled'),

-- Заселені зараз (CheckedIn)
(13, 5,  NOW()-INTERVAL '2 days',   NOW()+INTERVAL '3 days',   27500.00, 'CheckedIn'),
(7,  9,  NOW()-INTERVAL '1 day',    NOW()+INTERVAL '4 days',   11200.00, 'CheckedIn'),
(6,  3,  NOW(),                     NOW()+INTERVAL '5 days',   11000.00, 'CheckedIn'),

-- Підтверджені (майбутні)
(10, 11, NOW()+INTERVAL '2 days',   NOW()+INTERVAL '5 days',   14400.00, 'Confirmed'),
(8,  12, NOW()+INTERVAL '3 days',   NOW()+INTERVAL '6 days',   18600.00, 'Confirmed'),
(15, 7,  NOW()+INTERVAL '4 days',   NOW()+INTERVAL '7 days',   4200.00,  'Confirmed'),
(12, 13, NOW()+INTERVAL '5 days',   NOW()+INTERVAL '8 days',   9600.00,  'Confirmed'),
(3,  5,  NOW()+INTERVAL '7 days',   NOW()+INTERVAL '10 days',  16500.00, 'Confirmed'),

-- Очікують підтвердження (Pending)
(9,  15, NOW()+INTERVAL '3 days',   NOW()+INTERVAL '6 days',   5400.00,  'Pending'),
(11, 1,  NOW()+INTERVAL '5 days',   NOW()+INTERVAL '8 days',   3600.00,  'Pending'),
(14, 10, NOW()+INTERVAL '6 days',   NOW()+INTERVAL '9 days',   7200.00,  'Pending'),
(4,  2,  NOW()+INTERVAL '8 days',   NOW()+INTERVAL '11 days',  2700.00,  'Pending'),
(5,  4,  NOW()+INTERVAL '10 days',  NOW()+INTERVAL '13 days',  3300.00,  'Pending');
