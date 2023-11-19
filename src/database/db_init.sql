create table users (
    id bigserial primary key,
    username varchar unique not null,
    nickname varchar,
    email varchar not null,
    district_id integer references districts,
    unit_id integer references units,
    troop_id integer references troops,
)

create table districts (
    id bigserial primary key,
    name varchar not null,
    address varchar not null,
    year_founded integer,
)

create table units (
    id bigserial primary key,
    name varchar not null,
    year_founded integer,
    district_id integer references districts,
)

create table troops (
    id bigserial primary key,
    name varchar not null,
    district_id integer references districts,
    unit_id integer references units,
)