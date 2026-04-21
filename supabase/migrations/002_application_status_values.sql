-- Add 'contacted' and 'approved' to applications.status
-- Supports the dashboard application review flow (Approve / Reject / Mark as Contacted).
-- 'reviewed' and 'onboarded' remain for existing rows and downstream onboarding.

ALTER TABLE applications DROP CONSTRAINT applications_status_check;

ALTER TABLE applications ADD CONSTRAINT applications_status_check
  CHECK (status IN (
    'pending',
    'contacted',
    'approved',
    'rejected',
    'reviewed',
    'onboarded'
  ));
