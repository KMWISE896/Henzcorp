create table "public"."crypto_assets" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "asset_symbol" text not null,
    "amount" numeric(18,8) not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."referrals" (
    "id" uuid not null default gen_random_uuid(),
    "referrer_id" uuid not null,
    "referee_id" uuid not null,
    "referred_at" timestamp with time zone default now()
);


create table "public"."transactions" (
    "id" uuid not null default gen_random_uuid(),
    "wallet_id" uuid not null,
    "type" text not null,
    "amount" numeric(18,2) not null,
    "status" text not null,
    "reference" text not null,
    "metadata" jsonb,
    "created_at" timestamp with time zone default now()
);


create table "public"."user_profiles" (
    "id" uuid not null default gen_random_uuid(),
    "first_name" text not null,
    "last_name" text not null,
    "phone" text not null,
    "profile_image_url" text,
    "verification_status" text default 'pending'::text,
    "referral_code" text not null,
    "referred_by" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."wallets" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "balance" numeric(18,2) not null default 0.00,
    "currency" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


CREATE UNIQUE INDEX crypto_assets_pkey ON public.crypto_assets USING btree (id);

CREATE UNIQUE INDEX referrals_pkey ON public.referrals USING btree (id);

CREATE UNIQUE INDEX transactions_pkey ON public.transactions USING btree (id);

CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id);

CREATE UNIQUE INDEX wallets_pkey ON public.wallets USING btree (id);

alter table "public"."crypto_assets" add constraint "crypto_assets_pkey" PRIMARY KEY using index "crypto_assets_pkey";

alter table "public"."referrals" add constraint "referrals_pkey" PRIMARY KEY using index "referrals_pkey";

alter table "public"."transactions" add constraint "transactions_pkey" PRIMARY KEY using index "transactions_pkey";

alter table "public"."user_profiles" add constraint "user_profiles_pkey" PRIMARY KEY using index "user_profiles_pkey";

alter table "public"."wallets" add constraint "wallets_pkey" PRIMARY KEY using index "wallets_pkey";

alter table "public"."crypto_assets" add constraint "crypto_assets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES user_profiles(id) not valid;

alter table "public"."crypto_assets" validate constraint "crypto_assets_user_id_fkey";

alter table "public"."referrals" add constraint "referrals_referee_id_fkey" FOREIGN KEY (referee_id) REFERENCES user_profiles(id) not valid;

alter table "public"."referrals" validate constraint "referrals_referee_id_fkey";

alter table "public"."referrals" add constraint "referrals_referrer_id_fkey" FOREIGN KEY (referrer_id) REFERENCES user_profiles(id) not valid;

alter table "public"."referrals" validate constraint "referrals_referrer_id_fkey";

alter table "public"."transactions" add constraint "transactions_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text]))) not valid;

alter table "public"."transactions" validate constraint "transactions_status_check";

alter table "public"."transactions" add constraint "transactions_type_check" CHECK ((type = ANY (ARRAY['deposit'::text, 'withdrawal'::text, 'transfer'::text, 'airtime_purchase'::text, 'crypto_purchase'::text, 'crypto_sale'::text]))) not valid;

alter table "public"."transactions" validate constraint "transactions_type_check";

alter table "public"."transactions" add constraint "transactions_wallet_id_fkey" FOREIGN KEY (wallet_id) REFERENCES wallets(id) not valid;

alter table "public"."transactions" validate constraint "transactions_wallet_id_fkey";

alter table "public"."user_profiles" add constraint "user_profiles_referred_by_fkey" FOREIGN KEY (referred_by) REFERENCES user_profiles(id) not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_referred_by_fkey";

alter table "public"."user_profiles" add constraint "user_profiles_verification_status_check" CHECK ((verification_status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text]))) not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_verification_status_check";

alter table "public"."wallets" add constraint "wallets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES user_profiles(id) not valid;

alter table "public"."wallets" validate constraint "wallets_user_id_fkey";

grant delete on table "public"."crypto_assets" to "anon";

grant insert on table "public"."crypto_assets" to "anon";

grant references on table "public"."crypto_assets" to "anon";

grant select on table "public"."crypto_assets" to "anon";

grant trigger on table "public"."crypto_assets" to "anon";

grant truncate on table "public"."crypto_assets" to "anon";

grant update on table "public"."crypto_assets" to "anon";

grant delete on table "public"."crypto_assets" to "authenticated";

grant insert on table "public"."crypto_assets" to "authenticated";

grant references on table "public"."crypto_assets" to "authenticated";

grant select on table "public"."crypto_assets" to "authenticated";

grant trigger on table "public"."crypto_assets" to "authenticated";

grant truncate on table "public"."crypto_assets" to "authenticated";

grant update on table "public"."crypto_assets" to "authenticated";

grant delete on table "public"."crypto_assets" to "service_role";

grant insert on table "public"."crypto_assets" to "service_role";

grant references on table "public"."crypto_assets" to "service_role";

grant select on table "public"."crypto_assets" to "service_role";

grant trigger on table "public"."crypto_assets" to "service_role";

grant truncate on table "public"."crypto_assets" to "service_role";

grant update on table "public"."crypto_assets" to "service_role";

grant delete on table "public"."referrals" to "anon";

grant insert on table "public"."referrals" to "anon";

grant references on table "public"."referrals" to "anon";

grant select on table "public"."referrals" to "anon";

grant trigger on table "public"."referrals" to "anon";

grant truncate on table "public"."referrals" to "anon";

grant update on table "public"."referrals" to "anon";

grant delete on table "public"."referrals" to "authenticated";

grant insert on table "public"."referrals" to "authenticated";

grant references on table "public"."referrals" to "authenticated";

grant select on table "public"."referrals" to "authenticated";

grant trigger on table "public"."referrals" to "authenticated";

grant truncate on table "public"."referrals" to "authenticated";

grant update on table "public"."referrals" to "authenticated";

grant delete on table "public"."referrals" to "service_role";

grant insert on table "public"."referrals" to "service_role";

grant references on table "public"."referrals" to "service_role";

grant select on table "public"."referrals" to "service_role";

grant trigger on table "public"."referrals" to "service_role";

grant truncate on table "public"."referrals" to "service_role";

grant update on table "public"."referrals" to "service_role";

grant delete on table "public"."transactions" to "anon";

grant insert on table "public"."transactions" to "anon";

grant references on table "public"."transactions" to "anon";

grant select on table "public"."transactions" to "anon";

grant trigger on table "public"."transactions" to "anon";

grant truncate on table "public"."transactions" to "anon";

grant update on table "public"."transactions" to "anon";

grant delete on table "public"."transactions" to "authenticated";

grant insert on table "public"."transactions" to "authenticated";

grant references on table "public"."transactions" to "authenticated";

grant select on table "public"."transactions" to "authenticated";

grant trigger on table "public"."transactions" to "authenticated";

grant truncate on table "public"."transactions" to "authenticated";

grant update on table "public"."transactions" to "authenticated";

grant delete on table "public"."transactions" to "service_role";

grant insert on table "public"."transactions" to "service_role";

grant references on table "public"."transactions" to "service_role";

grant select on table "public"."transactions" to "service_role";

grant trigger on table "public"."transactions" to "service_role";

grant truncate on table "public"."transactions" to "service_role";

grant update on table "public"."transactions" to "service_role";

grant delete on table "public"."user_profiles" to "anon";

grant insert on table "public"."user_profiles" to "anon";

grant references on table "public"."user_profiles" to "anon";

grant select on table "public"."user_profiles" to "anon";

grant trigger on table "public"."user_profiles" to "anon";

grant truncate on table "public"."user_profiles" to "anon";

grant update on table "public"."user_profiles" to "anon";

grant delete on table "public"."user_profiles" to "authenticated";

grant insert on table "public"."user_profiles" to "authenticated";

grant references on table "public"."user_profiles" to "authenticated";

grant select on table "public"."user_profiles" to "authenticated";

grant trigger on table "public"."user_profiles" to "authenticated";

grant truncate on table "public"."user_profiles" to "authenticated";

grant update on table "public"."user_profiles" to "authenticated";

grant delete on table "public"."user_profiles" to "service_role";

grant insert on table "public"."user_profiles" to "service_role";

grant references on table "public"."user_profiles" to "service_role";

grant select on table "public"."user_profiles" to "service_role";

grant trigger on table "public"."user_profiles" to "service_role";

grant truncate on table "public"."user_profiles" to "service_role";

grant update on table "public"."user_profiles" to "service_role";

grant delete on table "public"."wallets" to "anon";

grant insert on table "public"."wallets" to "anon";

grant references on table "public"."wallets" to "anon";

grant select on table "public"."wallets" to "anon";

grant trigger on table "public"."wallets" to "anon";

grant truncate on table "public"."wallets" to "anon";

grant update on table "public"."wallets" to "anon";

grant delete on table "public"."wallets" to "authenticated";

grant insert on table "public"."wallets" to "authenticated";

grant references on table "public"."wallets" to "authenticated";

grant select on table "public"."wallets" to "authenticated";

grant trigger on table "public"."wallets" to "authenticated";

grant truncate on table "public"."wallets" to "authenticated";

grant update on table "public"."wallets" to "authenticated";

grant delete on table "public"."wallets" to "service_role";

grant insert on table "public"."wallets" to "service_role";

grant references on table "public"."wallets" to "service_role";

grant select on table "public"."wallets" to "service_role";

grant trigger on table "public"."wallets" to "service_role";

grant truncate on table "public"."wallets" to "service_role";

grant update on table "public"."wallets" to "service_role";


