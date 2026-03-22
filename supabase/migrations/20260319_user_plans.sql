-- Tabela de planos por usuário
-- Controla quais verticais cada usuário tem acesso (medicina, oab, enem, vestibular)

create table if not exists user_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  vertical text not null check (vertical in ('medicina', 'oab', 'enem', 'vestibular')),
  status text not null default 'active' check (status in ('active', 'inactive', 'trial')),
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- RLS: usuário só vê seus próprios planos
alter table user_plans enable row level security;

create policy "Users can view own plans" on user_plans
  for select using (auth.uid() = user_id);
