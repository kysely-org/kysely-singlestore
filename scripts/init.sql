DROP DATABASE IF EXISTS test;

CREATE DATABASE test;

USE test;

CREATE ROWSTORE TABLE person (
    id INTEGER UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(255),
    middle_name VARCHAR(255),
    last_name VARCHAR(255),
    age DOUBLE NOT NULL,
    gender VARCHAR(6) NOT NULL,
    SHARD KEY (id)
);

CREATE ROWSTORE TABLE pet (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id INTEGER UNSIGNED NOT NULL,
    species VARCHAR(7) NOT NULL,
    SHARD KEY (id),
    KEY pet_owner_id_index (owner_id) USING HASH
);

CREATE ROWSTORE TABLE toy (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(13,4) UNSIGNED NOT NULL,
    pet_id INTEGER UNSIGNED NOT NULL,
    SHARD KEY (id),
    KEY toy_pet_id_index (pet_id) USING HASH
);

CREATE ROWSTORE TABLE data_type_test (
    bigint_col BIGINT NOT NULL
    ,binary_col BINARY(16) NOT NULL
    ,bit_col BIT(64) NOT NULL
    ,blob_col BLOB(16) NOT NULL
    ,bool_col BOOL NOT NULL
    ,boolean_col BOOLEAN NOT NULL
    ,char_col CHAR(16) NOT NULL
    ,date_col DATE NOT NULL
    ,datetime_col DATETIME NOT NULL
    ,datetime6_col DATETIME(6) NOT NULL
    ,dec_col DEC(18,4) NOT NULL
    ,decimal_col DECIMAL(18,4) NOT NULL
    -- double_col DOUBLE NOT NULL,
    -- enum_col ENUM('apple', 'orange') NOT NULL,
    -- fixed_col FIXED(18,4) NOT NULL,
    -- float_col FLOAT NOT NULL,
    -- geography_col GEOGRAPHY NOT NULL,
    -- geographypoint_col GEOGRAPHYPOINT NOT NULL,
    -- int_col INT NOT NULL,
    -- integer_col INTEGER NOT NULL,
    -- json_col JSON NOT NULL,
    -- longblob_col LONGBLOB NOT NULL,
    -- longtext_col LONGTEXT NOT NULL,
    -- mediumblob_col MEDIUMBLOB NOT NULL,
    -- mediumint_col MEDIUMINT NOT NULL,
    -- mediumtext_col MEDIUMTEXT NOT NULL,
    -- numeric_col NUMERIC(18,4) NOT NULL,
    -- real_col REAL NOT NULL,
    -- set_col SET('apple', 'orange') NOT NULL,
    -- smallint_col SMALLINT NOT NULL,
    -- text_col TEXT(16) NOT NULL,
    -- time_col TIME NOT NULL,
    -- time6_col TIME(6) NOT NULL,
    -- timestamp_col TIMESTAMP NOT NULL,
    -- timestamp6_col TIMESTAMP(6) NOT NULL,
    -- tinyblob_col TINYBLOB NOT NULL,
    -- tinyint_col TINYINT NOT NULL,
    -- tinytext_col TINYTEXT NOT NULL,
    -- varbinary_col VARBINARY(16) NOT NULL,
    -- varchar_col VARCHAR(16) NOT NULL,
    -- year_col YEAR NOT NULL,
    -- null_col BIT
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

INSERT INTO data_type_test 
VALUES (
    9223372036854775807
    ,'binary'
    ,b'10'
    ,'blob'
    ,0
    ,127
    ,'char'
    ,'9999-12-31'
    ,'9999-12-31 23:59:59'
    ,'9999-12-31 23:59:59.999999'
    ,99999999999999.9999
    ,-99999999999999.9999
    -- 999999999.99,
    -- 'orange',
    -- 0,
    -- 9999.99,
    -- 'POLYGON((1 1,2 1,2 2, 1 2, 1 1))',
    -- 'POINT(1.5 1.5)',
    -- 2147483647,
    -- -2147483648,
    -- '{"x":"foo","y":null,"z":[]}',
    -- 'longblob',
    -- 'longtext',
    -- 'mediumblob',
    -- 8388607,
    -- 'mediumtext',
    -- 99999999999999.9999,
    -- -999999999.99,
    -- 'apple,orange',
    -- 32767,
    -- 'text',
    -- '838:59:59',
    -- '839:59:59.999999',
    -- '2038-01-19 03:14:07',
    -- '2038-01-19 03:14:07.999999',
    -- 'tinyblob',
    -- -128,
    -- 'tinytext',
    -- 'varbinary',
    -- 'varchar',
    -- '2155',
    -- null
)
