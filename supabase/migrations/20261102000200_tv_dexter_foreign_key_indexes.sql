-- Cover item foreign keys for efficient cascade and joins.
create index if not exists favorites_item_id_idx on tv_dexter.favorites(item_id);
create index if not exists playback_progress_item_id_idx on tv_dexter.playback_progress(item_id);
