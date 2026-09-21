create index final_score_email_activation_activated_by_idx
  on private.final_score_email_activation (activated_by)
  where activated_by is not null;
