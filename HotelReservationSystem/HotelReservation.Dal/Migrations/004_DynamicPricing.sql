-- Migration 004: Dynamic Pricing
-- Run against HotelReservationsDB

-- 1. Add RoomType and Status to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS roomtype VARCHAR(50) NOT NULL DEFAULT 'Standard';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS status   VARCHAR(50) NOT NULL DEFAULT 'Available';

-- 2. Price rules table
CREATE TABLE IF NOT EXISTS price_rules (
    priceruleid              SERIAL PRIMARY KEY,
    name                     VARCHAR(200) NOT NULL,
    ruletype                 VARCHAR(50)  NOT NULL,  -- Season | DayOfWeek | Occupancy | Duration
    seasonmonthfrom          INTEGER,                -- 1-12
    seasonmonthto            INTEGER,                -- 1-12
    applicabledayofweek      INTEGER,                -- 0=Sun .. 6=Sat
    occupancythresholdpercent DECIMAL(5,2),          -- e.g. 70.00
    mindurationdays          INTEGER,                -- min nights for long-stay discount
    coefficient              DECIMAL(6,3) NOT NULL,
    isactive                 BOOLEAN NOT NULL DEFAULT TRUE,
    createdat                TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Price history table
CREATE TABLE IF NOT EXISTS price_history (
    pricehistoryid SERIAL PRIMARY KEY,
    roomid         INTEGER NOT NULL REFERENCES rooms(roomid) ON DELETE CASCADE,
    oldprice       DECIMAL(10,2) NOT NULL,
    newprice       DECIMAL(10,2) NOT NULL,
    reason         VARCHAR(500),
    changedat      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_roomid ON price_history(roomid);
CREATE INDEX IF NOT EXISTS idx_price_rules_type_active ON price_rules(ruletype, isactive);

-- 4. Sample rules (adjust coefficients as needed)
INSERT INTO price_rules (name, ruletype, seasonmonthfrom, seasonmonthto, coefficient, isactive) VALUES
    ('Summer High Season',   'Season', 6, 8,   1.30, TRUE),
    ('Winter Holidays',      'Season', 12, 1,  1.20, TRUE);

INSERT INTO price_rules (name, ruletype, applicabledayofweek, coefficient, isactive) VALUES
    ('Weekend Saturday',  'DayOfWeek', 6, 1.15, TRUE),
    ('Weekend Sunday',    'DayOfWeek', 0, 1.10, TRUE);

INSERT INTO price_rules (name, ruletype, occupancythresholdpercent, coefficient, isactive) VALUES
    ('High Occupancy 70%+', 'Occupancy', 70.00, 1.15, TRUE),
    ('Peak Occupancy 90%+', 'Occupancy', 90.00, 1.30, TRUE);

INSERT INTO price_rules (name, ruletype, mindurationdays, coefficient, isactive) VALUES
    ('Weekly Discount 7+',   'Duration', 7,  0.92, TRUE),
    ('Monthly Discount 21+', 'Duration', 21, 0.85, TRUE);
