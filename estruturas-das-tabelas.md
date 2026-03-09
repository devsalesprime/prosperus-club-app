| table_name                | column_name           | data_type                | is_nullable | column_default                                   |
| ------------------------- | --------------------- | ------------------------ | ----------- | ------------------------------------------------ |
| analytics_events          | id                    | uuid                     | NO          | gen_random_uuid()                                |
| analytics_events          | user_id               | uuid                     | YES         | null                                             |
| analytics_events          | event_type            | text                     | NO          | null                                             |
| analytics_events          | metadata              | jsonb                    | YES         | '{}'::jsonb                                      |
| analytics_events          | page_url              | text                     | YES         | null                                             |
| analytics_events          | session_id            | text                     | YES         | null                                             |
| analytics_events          | device_info           | jsonb                    | YES         | '{}'::jsonb                                      |
| analytics_events          | created_at            | timestamp with time zone | NO          | now()                                            |
| app_settings              | id                    | integer                  | NO          | 1                                                |
| app_settings              | support_email         | text                     | YES         | 'suporte@prosperusclub.com.br'::text             |
| app_settings              | support_phone         | text                     | YES         | '+55 11 99999-9999'::text                        |
| app_settings              | account_manager_name  | text                     | YES         | 'Sua Gerente de Conta'::text                     |
| app_settings              | account_manager_phone | text                     | YES         | '+55 11 99999-9999'::text                        |
| app_settings              | account_manager_email | text                     | YES         | 'gerente@prosperusclub.com.br'::text             |
| app_settings              | financial_email       | text                     | YES         | 'financeiro@prosperusclub.com.br'::text          |
| app_settings              | financial_phone       | text                     | YES         | '+55 11 99999-9999'::text                        |
| app_settings              | terms_url             | text                     | YES         | 'https://prosperusclub.com.br/termos'::text      |
| app_settings              | privacy_url           | text                     | YES         | 'https://prosperusclub.com.br/privacidade'::text |
| app_settings              | faq_url               | text                     | YES         | 'https://prosperusclub.com.br/faq'::text         |
| app_settings              | updated_at            | timestamp with time zone | YES         | now()                                            |
| app_settings              | updated_by            | uuid                     | YES         | null                                             |
| articles                  | id                    | uuid                     | NO          | uuid_generate_v4()                               |
| articles                  | title                 | text                     | NO          | null                                             |
| articles                  | slug                  | text                     | NO          | null                                             |
| articles                  | author                | text                     | YES         | null                                             |
| articles                  | published_date        | timestamp with time zone | YES         | null                                             |
| articles                  | image_url             | text                     | YES         | null                                             |
| articles                  | excerpt               | text                     | YES         | null                                             |
| articles                  | content               | text                     | YES         | null                                             |
| articles                  | category_name         | text                     | YES         | null                                             |
| articles                  | status                | USER-DEFINED             | YES         | 'DRAFT'::article_status                          |
| articles                  | views                 | integer                  | YES         | 0                                                |
| articles                  | created_at            | timestamp with time zone | YES         | now()                                            |
| articles                  | updated_at            | timestamp with time zone | YES         | now()                                            |
| banners                   | id                    | uuid                     | NO          | uuid_generate_v4()                               |
| banners                   | title                 | text                     | NO          | null                                             |
| banners                   | subtitle              | text                     | YES         | null                                             |
| banners                   | image_url             | text                     | NO          | null                                             |
| banners                   | link_url              | text                     | YES         | null                                             |
| banners                   | link_type             | USER-DEFINED             | YES         | 'INTERNAL'::link_type                            |
| banners                   | start_date            | timestamp with time zone | YES         | null                                             |
| banners                   | end_date              | timestamp with time zone | YES         | null                                             |
| banners                   | is_active             | boolean                  | YES         | true                                             |
| banners                   | placement             | USER-DEFINED             | YES         | 'HOME'::banner_placement                         |
| banners                   | priority              | integer                  | YES         | 0                                                |
| banners                   | created_at            | timestamp with time zone | YES         | now()                                            |
| banners                   | updated_at            | timestamp with time zone | YES         | now()                                            |
| benefit_analytics         | id                    | uuid                     | NO          | gen_random_uuid()                                |
| benefit_analytics         | benefit_owner_id      | uuid                     | NO          | null                                             |
| benefit_analytics         | visitor_id            | uuid                     | YES         | null                                             |
| benefit_analytics         | action                | text                     | NO          | null                                             |
| benefit_analytics         | metadata              | jsonb                    | YES         | '{}'::jsonb                                      |
| benefit_analytics         | created_at            | timestamp with time zone | NO          | now()                                            |
| club_events               | id                    | uuid                     | NO          | gen_random_uuid()                                |
| club_events               | title                 | text                     | NO          | null                                             |
| club_events               | description           | text                     | YES         | ''::text                                         |
| club_events               | date                  | timestamp with time zone | NO          | null                                             |
| club_events               | end_date              | timestamp with time zone | YES         | null                                             |
| club_events               | type                  | text                     | NO          | 'MEMBER'::text                                   |
| club_events               | category              | text                     | NO          | 'PRESENTIAL'::text                               |
| club_events               | target_member_id      | uuid                     | YES         | null                                             |
| club_events               | target_member_name    | text                     | YES         | null                                             |
| club_events               | location              | text                     | YES         | null                                             |
| club_events               | map_link              | text                     | YES         | null                                             |
| club_events               | link                  | text                     | YES         | null                                             |
| club_events               | meeting_password      | text                     | YES         | null                                             |
| club_events               | video_url             | text                     | YES         | null                                             |
| club_events               | cover_image           | text                     | YES         | null                                             |
| club_events               | banner_url            | text                     | YES         | null                                             |
| club_events               | materials             | jsonb                    | YES         | '[]'::jsonb                                      |
| club_events               | sessions              | jsonb                    | YES         | '[]'::jsonb                                      |
| club_events               | created_at            | timestamp with time zone | YES         | now()                                            |
| club_events               | updated_at            | timestamp with time zone | YES         | now()                                            |
| club_events               | max_rsvps             | integer                  | YES         | null                                             |
| club_events               | rsvp_deadline         | timestamp with time zone | YES         | null                                             |
| conversation_participants | conversation_id       | uuid                     | NO          | null                                             |
| conversation_participants | user_id               | uuid                     | NO          | null                                             |
| conversation_participants | joined_at             | timestamp with time zone | YES         | now()                                            |
| conversations             | id                    | uuid                     | NO          | uuid_generate_v4()                               |
| conversations             | created_at            | timestamp with time zone | YES         | now()                                            |
| conversations             | updated_at            | timestamp with time zone | YES         | now()                                            |
| event_rsvp_summary        | event_id              | uuid                     | YES         | null                                             |
| event_rsvp_summary        | event_title           | text                     | YES         | null                                             |
| event_rsvp_summary        | event_date            | timestamp with time zone | YES         | null                                             |
| event_rsvp_summary        | max_rsvps             | integer                  | YES         | null                                             |
| event_rsvp_summary        | confirmed_count       | bigint                   | YES         | null                                             |
| event_rsvp_summary        | waitlist_count        | bigint                   | YES         | null                                             |
| event_rsvp_summary        | is_full               | boolean                  | YES         | null                                             |
| event_rsvps               | id                    | uuid                     | NO          | gen_random_uuid()                                |
| event_rsvps               | event_id              | uuid                     | NO          | null                                             |
| event_rsvps               | user_id               | uuid                     | NO          | null                                             |
| event_rsvps               | status                | text                     | NO          | 'CONFIRMED'::text                                |
| event_rsvps               | confirmed_at          | timestamp with time zone | YES         | now()                                            |
| event_rsvps               | cancelled_at          | timestamp with time zone | YES         | null                                             |
| event_rsvps               | notes                 | text                     | YES         | null                                             |
| event_rsvps               | created_at            | timestamp with time zone | YES         | now()                                            |
| event_rsvps               | updated_at            | timestamp with time zone | YES         | now()                                            |
| events                    | id                    | uuid                     | NO          | uuid_generate_v4()                               |
| events                    | title                 | text                     | NO          | null                                             |
| events                    | description           | text                     | YES         | null                                             |