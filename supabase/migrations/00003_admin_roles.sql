-- Migration 00003: Add Admin Roles and Subscription Status

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'free';
