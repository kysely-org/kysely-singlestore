CREATE DATABASE test;

USE test;

CREATE ROWSTORE TABLE person (
    id INTEGER UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(255),
    middle_name VARCHAR(255),
    last_name VARCHAR(255),
    age DOUBLE NOT NULL,
    gender VARCHAR(6) NOT NULL
);

CREATE ROWSTORE TABLE pet (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    owner_id INTEGER UNSIGNED NOT NULL,
    species VARCHAR(7) NOT NULL,
    KEY pet_owner_id_index (owner_id) USING HASH
);

CREATE ROWSTORE TABLE toy (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(13,4) UNSIGNED NOT NULL,
    pet_id INTEGER UNSIGNED NOT NULL
);

INSERT INTO person (id, first_name, last_name, gender, age)
VALUES 
    (1, 'Jennifer', 'Aniston', 'female', 25),
    (2, 'Arnold', 'Schwarzenegger', 'male', 46),
    (3, 'Syvester', 'Stallone', 'male', 75);

INSERT INTO pet (id, name, owner_id, species)
VALUES 
    (1, 'Catto', 1, 'cat'),
    (2, 'Doggo', 2, 'dog'),
    (3, 'Hammo', 3, 'hamster');
