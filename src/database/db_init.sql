-- UTILS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SCOUT HIERARCHY
create table if not exists districts
(
    id           bigserial primary key,
    name         varchar not null,
    phone_number varchar,
    address      varchar,
    town         varchar not null,
    year_founded integer
);

create table if not exists groups
(
    id           bigserial primary key,
    name         varchar not null,
    year_founded integer,
    district_id  bigint references districts
);

create table if not exists troops
(
    id          bigserial primary key,
    name        varchar not null,
    district_id bigint references districts,
    group_id    bigint references groups
);

create table if not exists users
(
    id          bigserial primary key,
    username    varchar not null unique,
    nickname    varchar,
    email       varchar not null,
    password    varchar not null,
    --is_district boolean not null default false,
    district_id bigint references districts,
    group_id    bigint references groups,
    troop_id    bigint references troops,
    is_active   boolean not null default true
);

create table if not exists district_admin
(
    district_id bigint not null references districts,
    user_id     bigint not null references users
);

create table if not exists group_admin
(
    group_id bigint not null references groups,
    user_id  bigint not null references users
);

create table if not exists troop_admin
(
    troop_id bigint not null references troops,
    user_id  bigint not null references users
);


-- AUTHENTICATION
create table if not exists sessions
(
    id         bigserial primary key,
    token      uuid   not null default uuid_generate_v4(),
    expires_on bigint not null,
    user_id    bigint not null references users
);

-- EVENT PLANNING
create table if not exists events
(
    id            bigserial primary key,
    event_id      varchar not null,
    name          varchar not null,
    description   varchar,
    decision_date bigint  not null,
    date          bigint default null -- if null => event is still not closed
);

create table if not exists event_participants
(
    id       bigserial primary key,
    user_id  bigint not null references users,
    event_id bigint not null references events
);

create table if not exists event_terms
(
    id       bigserial primary key,
    date     bigint not null,
    event_id bigint not null references events
);

create table if not exists event_term_votes
(
    id      bigserial primary key,
    vote    integer not null default 0, -- 0 = no decision; 1 = want to attend; 2 = don't want to attend; 3 = if needed
    user_id bigint  not null references users,
    term_id bigint  not null references event_terms
);

create table if not exists event_admins
(
    id       bigserial primary key,
    user_id  bigint not null references users,
    event_id bigint not null references events
);

/*
LIST EVENTŮ
- název eventu
- kdy se koná

TVORBA EVENTŮ
- název eventu
- popis eventu
- kdo je zván
- čas, do kdy se má zvolit
- možnosti konání - datum + čas


ROZKLIKNUTÍ EVENTU
- název eventu
- popis eventu
- možnosti s počty voleb
- kdo hlasoval a kdo nehlasoval
- !! před načtením dat kontrola, zda hlasování neuzavřeno
    - uzavřeno ==> název, popis, čas konání, kdo je zván

 */

--COMMUNICATION
create table if not exists message_groups
(
    id        bigserial primary key,
    name      varchar not null,
    type      varchar not null,
    edited_on bigint  not null,
    room_id   varchar not null
);

create table if not exists message_group_members
(
    id               bigserial primary key,
    added_on         bigint not null,
    is_admin         boolean default false,
    user_id          bigint not null references users,
    message_group_id bigint not null references message_groups
);

create table if not exists messages
(
    id               bigserial primary key,
    message          varchar not null,
    sent_on          bigint  not null,
    user_id          bigint  not null references users,
    message_group_id bigint  not null references message_groups
);

-- POSTS
-- add photo/video representation
create table if not exists posts
(
    id          bigserial primary key,
    description varchar,
    place       varchar,
    user_id     bigint    not null references users,
    created_on  timestamp not null default current_timestamp
);

-- (rating == true)  -> like
-- (rating == false) -> dislike
create table if not exists ratings
(
    id      bigserial primary key,
    rating  boolean not null default true,
    user_id bigint  not null references users,
    post_id bigint  not null references posts
);

create table if not exists comments
(
    id         bigserial primary key,
    text       varchar   not null,
    created_by bigint    not null references users,
    created_on timestamp not null default current_timestamp,
    post_id    bigint    not null references posts
);

-- (rating == true)  -> like
-- (rating == false) -> dislike
create table if not exists comment_ratings
(
    id         bigserial primary key,
    rating     boolean not null default true,
    comment_id bigint  not null references comments
);

create table if not exists media
(
    id               bigserial primary key,
    path             varchar not null,
    type             varchar not null,
    posted_on        bigint  not null,
    user_id          bigint  not null,
    message_group_id bigint  not null references message_groups
);


-- CREATING FEED
-- 1st layer - posts from people the user follows
-- 2nd layer - posts from people who are from the same troop -> group -> district
-- 3rd layer - posts from districts that are based in the same town as user's mother-district
-- // how to represent district as a user?
