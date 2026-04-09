SET client_encoding = 'UTF8';

UPDATE clients SET fullname = 'Соломія Гаврилюк',  phone = '+380671112233', loyalty_tier = 'regular' WHERE clientid = 6;
UPDATE clients SET fullname = 'Тарас Мельник',      phone = '+380502223344', loyalty_tier = 'vip'     WHERE clientid = 7;
UPDATE clients SET fullname = 'Оксана Романенко',   phone = '+380633334455', loyalty_tier = 'regular' WHERE clientid = 8;
UPDATE clients SET fullname = 'Дмитро Савченко',    phone = '+380504445566', loyalty_tier = 'new'     WHERE clientid = 9;
UPDATE clients SET fullname = 'Юлія Кравченко',     phone = '+380675556677', loyalty_tier = 'regular' WHERE clientid = 10;
UPDATE clients SET fullname = 'Василь Ткаченко',    phone = '+380506667788', loyalty_tier = 'vip'     WHERE clientid = 11;
UPDATE clients SET fullname = 'Інна Поліщук',       phone = '+380637778899', loyalty_tier = 'new'     WHERE clientid = 12;
UPDATE clients SET fullname = 'Роман Кузьменко',    phone = '+380508889900', loyalty_tier = 'vip'     WHERE clientid = 13;
UPDATE clients SET fullname = 'Аліна Бойко',        phone = '+380679990011', loyalty_tier = 'new'     WHERE clientid = 14;
UPDATE clients SET fullname = 'Максим Дорошенко',   phone = '+380500001122', loyalty_tier = 'new'     WHERE clientid = 15;
UPDATE clients SET fullname = 'Ганна Пономаренко',  phone = '+380671234567', loyalty_tier = 'regular' WHERE clientid = 16;
UPDATE clients SET fullname = 'Сергій Білоус',      phone = '+380502345678', loyalty_tier = 'new'     WHERE clientid = 17;

-- Синхронізуємо fullname у таблиці users
UPDATE users u SET fullname = c.fullname
FROM clients c WHERE c.clientid = u.clientid;
