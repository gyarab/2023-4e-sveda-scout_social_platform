create table districts
(
    id           bigserial primary key,
    name         varchar not null,
    address      varchar not null,
    year_founded integer
);

create table groups
(
    id           bigserial primary key,
    name         varchar not null,
    year_founded integer,
    district_id  bigint references districts
);

create table troops
(
    id          bigserial primary key,
    name        varchar not null,
    district_id bigint references districts,
    group_id    bigint references groups
);

create table users
(
    id          bigserial primary key,
    username    varchar not null unique,
    nickname    varchar,
    email       varchar not null,
    district_id bigint references districts,
    group_id    bigint references groups,
    troop_id    bigint references troops
);

create table district_leaders
(
    district_id bigint not null unique references districts,
    user_id     bigint not null references users
);

create table group_leaders
(
    group_id bigint not null unique references groups,
    user_id  bigint not null references users
);

create table troop_leaders
(
    troop_id bigint not null unique references troops,
    user_id  bigint not null references users
);