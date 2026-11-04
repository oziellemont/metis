-- Revierte 0021 (mêtis CEO · WhatsApp real). Se pierde la bitácora de WhatsApp, los códigos y los consentimientos.
-- Las partidas, el correo y el historial de los jugadores no se tocan.
delete from ceo.flags where key = 'whatsapp';
drop table if exists ceo.wa_messages;
drop table if exists ceo.wa_otp;
alter table ceo.players drop constraint if exists players_wa_channel_chk;
alter table ceo.players drop column if exists wa_sent;
alter table ceo.players drop column if exists wa_channel;
alter table ceo.players drop column if exists wa_revoked_at;
alter table ceo.players drop column if exists wa_consent_at;
alter table ceo.players drop column if exists wa_verified_at;
alter table ceo.players drop column if exists wa_phone;
notify pgrst, 'reload schema';
