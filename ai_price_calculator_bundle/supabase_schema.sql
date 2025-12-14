create table if not exists current_prices (
  id bigserial primary key,
  provider text not null,
  model text not null,
  input_per_mtok numeric,
  output_per_mtok numeric,
  effective_date date not null,
  is_active boolean default true,
  unique(provider, model, effective_date)
);