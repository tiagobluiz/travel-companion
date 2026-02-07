-- Users table: stores user accounts for authentication
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(LOWER(email));

-- Trips table: each trip belongs to a user
CREATE TABLE trips (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    itinerary_items JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_trip_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_trips_user_id ON trips(user_id);

-- Expenses table: expenses belong to a trip
CREATE TABLE expenses (
    id UUID PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(19, 4) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) NOT NULL,
    description VARCHAR(1000) DEFAULT '',
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
