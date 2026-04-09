-- Migration: Create users table for JWT authentication
-- Run this against HotelReservationsDB

CREATE TABLE IF NOT EXISTS users (
    userid      SERIAL PRIMARY KEY,
    email       VARCHAR(255) UNIQUE NOT NULL,
    passwordhash VARCHAR(255) NOT NULL,
    role        VARCHAR(50)  NOT NULL DEFAULT 'Client',
    clientid    INTEGER REFERENCES clients(clientid) ON DELETE SET NULL,
    createdat   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
