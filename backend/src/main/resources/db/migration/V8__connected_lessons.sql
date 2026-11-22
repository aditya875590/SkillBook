ALTER TABLE users ADD COLUMN photo BYTEA;
ALTER TABLE users ADD COLUMN intro_video VARCHAR(2048);
ALTER TABLE users ADD COLUMN google_subject VARCHAR(255) UNIQUE;
ALTER TABLE bookings ADD COLUMN meeting_url VARCHAR(2048);
CREATE TABLE direct_messages (
    id UUID PRIMARY KEY, sender_id UUID NOT NULL REFERENCES users(id),
    recipient_id UUID NOT NULL REFERENCES users(id), body VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP NOT NULL, updated_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_direct_pair ON direct_messages(sender_id,recipient_id,created_at);
CREATE TABLE lesson_reviews (
    id UUID PRIMARY KEY, booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id),
    tutor_id UUID NOT NULL REFERENCES users(id), stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
    comment VARCHAR(1200) NOT NULL, created_at TIMESTAMP NOT NULL, updated_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_reviews_tutor ON lesson_reviews(tutor_id,created_at);
