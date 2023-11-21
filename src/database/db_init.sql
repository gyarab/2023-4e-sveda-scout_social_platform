-- UTILS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SCOUT HIERARCHY
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


-- AUTHENTICATION
create table sessions
(
    id         bigserial primary key,
    token      uuid   not null default uuid_generate_v4(),
    expires_on bigint not null,
    user_id    bigint not null references users
);


-- POSTS
-- add photo/video representation
create table posts
(
    id          bigserial primary key,
    description varchar,
    place       varchar,
    user_id     bigint    not null references users,
    created_on  timestamp not null default current_timestamp
);

-- (rating == true)  -> like
-- (rating == false) -> dislike
create table ratings
(
    id      bigserial primary key,
    rating  boolean not null default true,
    user_id bigint  not null references users,
    post_id bigint  not null references posts
);

create table comments
(
    id         bigserial primary key,
    text       varchar   not null,
    created_by bigint    not null references users,
    created_on timestamp not null default current_timestamp,
    post_id    bigint    not null references posts
);

-- (rating == true)  -> like
-- (rating == false) -> dislike
create table comment_ratings
(
    id         bigserial primary key,
    rating     boolean not null default true,
    comment_id bigint  not null references comments
);

create table videos
(
    id   bigserial primary key,
    path varchar not null
);

create table photos
(
    id   bigserial primary key,
    path varchar not null
);

create table post_video
(
    post_id  bigint not null references posts,
    video_id bigint not null references videos
);

create table post_photo
(
    post_id  bigint not null references posts,
    photo_id bigint not null references photos
);


-- EVENT PLANNING
create table plans
(
    id   bigserial primary key,
    name varchar not null
);

create table plan_invitations
(
    id      bigserial primary key,
    user_id bigint not null references users,
    plan_id bigint not null references plans
);

create table term_options
(
    id      bigserial primary key,
    date    timestamp not null,
    plan_id bigint    not null references plans
);

-- (attend == null)  -> maybe
-- (attend == true)  -> yes
-- (attend == false) -> no
create table term_option_votes
(
    id             bigserial primary key,
    attend         boolean default null,
    user_id        bigint not null references users,
    term_option_id bigint not null references term_options
);

create table events
(
    id   bigserial primary key,
    name varchar   not null,
    date timestamp not null
);

create table event_participants
(
    id       bigserial primary key,
    attend   boolean default null,
    user_id  bigint not null references users,
    event_id bigint not null references events
);

--COMMUNICATION
create table message_groups
(
    id              bigserial primary key,
    name            varchar not null,
    is_direct_group boolean default true
);

create table message_group_members
(
    is_admin         boolean default false,
    user_id          bigint not null references users,
    message_group_id bigint not null references message_groups
);

create table messages
(
    id               bigserial primary key,
    user_id          bigint not null references users,
    message_group_id bigint not null references message_groups
);
