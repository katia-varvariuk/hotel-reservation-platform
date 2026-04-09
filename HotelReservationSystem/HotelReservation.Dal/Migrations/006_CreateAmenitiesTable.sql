-- Migration 006: Amenities
-- Run against HotelReservationsDB

CREATE TABLE IF NOT EXISTS amenities (
    amenityid   SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    icon        VARCHAR(10)  NOT NULL DEFAULT '✓'
);

CREATE TABLE IF NOT EXISTS room_amenities (
    roomid      INTEGER NOT NULL REFERENCES rooms(roomid)     ON DELETE CASCADE,
    amenityid   INTEGER NOT NULL REFERENCES amenities(amenityid) ON DELETE CASCADE,
    PRIMARY KEY (roomid, amenityid)
);

CREATE INDEX IF NOT EXISTS idx_room_amenities_roomid    ON room_amenities(roomid);
CREATE INDEX IF NOT EXISTS idx_room_amenities_amenityid ON room_amenities(amenityid);

INSERT INTO amenities (name, icon) VALUES
    ('Wi-Fi',           '📶'),
    ('Кондиціонер',     '❄️'),
    ('Телевізор',       '📺'),
    ('Міні-бар',        '🍷'),
    ('Сейф',            '🔒'),
    ('Фен',             '💨'),
    ('Балкон',          '🌅'),
    ('Ванна',           '🛁'),
    ('Джакузі',         '🫧'),
    ('Вид на море',     '🌊');
