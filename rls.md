| tablename                 | policyname                                       | permissive | roles           | cmd    | qual                                                                                                                                                     |
| ------------------------- | ------------------------------------------------ | ---------- | --------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| analytics_events          | Allow admins to read analytics                   | PERMISSIVE | {authenticated} | SELECT | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (upper((profiles.role)::text) = ANY (ARRAY['ADMIN'::text, 'TEAM'::text]))))) |
| analytics_events          | Allow authenticated users to insert analytics    | PERMISSIVE | {authenticated} | INSERT | null                                                                                                                                                     |
| app_settings              | Admins can insert settings                       | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                     |
| app_settings              | Admins can update settings                       | PERMISSIVE | {public}        | UPDATE | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::user_role))))                                      |
| app_settings              | Anyone can read settings                         | PERMISSIVE | {public}        | SELECT | true                                                                                                                                                     |
| articles                  | Admins can create articles                       | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                     |
| articles                  | Admins can delete articles                       | PERMISSIVE | {public}        | DELETE | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['ADMIN'::user_role, 'TEAM'::user_role])))))      |
| articles                  | Admins can update articles                       | PERMISSIVE | {public}        | UPDATE | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['ADMIN'::user_role, 'TEAM'::user_role])))))      |
| articles                  | Published articles are viewable by everyone      | PERMISSIVE | {public}        | SELECT | ((status = 'PUBLISHED'::article_status) OR (auth.uid() IS NOT NULL))                                                                                     |
| banners                   | Admins can delete banners                        | PERMISSIVE | {public}        | DELETE | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['ADMIN'::user_role, 'TEAM'::user_role])))))      |
| banners                   | Admins can insert banners                        | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                     |
| banners                   | Admins can update banners                        | PERMISSIVE | {public}        | UPDATE | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['ADMIN'::user_role, 'TEAM'::user_role])))))      |
| banners                   | Admins can view all banners                      | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['ADMIN'::user_role, 'TEAM'::user_role])))))      |
| banners                   | Banners viewable by authenticated users          | PERMISSIVE | {authenticated} | SELECT | true                                                                                                                                                     |
| banners                   | Public can view active banners                   | PERMISSIVE | {public}        | SELECT | (is_active = true)                                                                                                                                       |
| benefit_analytics         | Admins can view all analytics                    | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['ADMIN'::user_role, 'TEAM'::user_role])))))      |
| benefit_analytics         | Admins can view all benefit analytics            | PERMISSIVE | {authenticated} | SELECT | user_has_admin_role()                                                                                                                                    |
| benefit_analytics         | Authenticated users can track analytics          | PERMISSIVE | {authenticated} | INSERT | null                                                                                                                                                     |
| benefit_analytics         | Authenticated users can track benefit events     | PERMISSIVE | {authenticated} | INSERT | null                                                                                                                                                     |
| benefit_analytics         | Users can view own benefit analytics             | PERMISSIVE | {authenticated} | SELECT | (benefit_owner_id = auth.uid())                                                                                                                          |
| benefit_analytics         | Users can view their own benefit analytics       | PERMISSIVE | {public}        | SELECT | (auth.uid() = benefit_owner_id)                                                                                                                          |
| club_events               | Admins can manage events                         | PERMISSIVE | {public}        | ALL    | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['ADMIN'::user_role, 'TEAM'::user_role])))))      |
| club_events               | Members can read public events                   | PERMISSIVE | {public}        | SELECT | ((type <> 'PRIVATE'::text) OR (target_member_id = auth.uid()))                                                                                           |
| conversation_participants | cp_delete                                        | PERMISSIVE | {public}        | DELETE | ((user_id = auth.uid()) OR is_admin_or_team())                                                                                                           |
| conversation_participants | cp_insert                                        | PERMISSIVE | {authenticated} | INSERT | null                                                                                                                                                     |
| conversation_participants | cp_select                                        | PERMISSIVE | {public}        | SELECT | ((conversation_id IN ( SELECT get_my_conversation_ids() AS get_my_conversation_ids)) OR is_admin_or_team())                                              |
| conversations             | conversations_delete                             | PERMISSIVE | {public}        | DELETE | is_admin_or_team()                                                                                                                                       |
| conversations             | conversations_insert                             | PERMISSIVE | {authenticated} | INSERT | null                                                                                                                                                     |
| conversations             | conversations_select                             | PERMISSIVE | {authenticated} | SELECT | true                                                                                                                                                     |
| conversations             | conversations_update                             | PERMISSIVE | {public}        | UPDATE | ((id IN ( SELECT get_my_conversation_ids() AS get_my_conversation_ids)) OR is_admin_or_team())                                                           |
| event_rsvps               | rsvp_delete                                      | PERMISSIVE | {authenticated} | DELETE | ((user_id = auth.uid()) OR is_admin_or_team())                                                                                                           |
| event_rsvps               | rsvp_insert                                      | PERMISSIVE | {authenticated} | INSERT | null                                                                                                                                                     |
| event_rsvps               | rsvp_select                                      | PERMISSIVE | {authenticated} | SELECT | ((user_id = auth.uid()) OR (status = 'CONFIRMED'::text) OR is_admin_or_team())                                                                           |
| event_rsvps               | rsvp_update                                      | PERMISSIVE | {authenticated} | UPDATE | ((user_id = auth.uid()) OR is_admin_or_team())                                                                                                           |
| events                    | Admins can delete events                         | PERMISSIVE | {public}        | DELETE | user_has_admin_role(auth.uid())                                                                                                                          |
| events                    | Admins can insert events                         | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                     |
| events                    | Admins can update events                         | PERMISSIVE | {public}        | UPDATE | user_has_admin_role(auth.uid())                                                                                                                          |
| events                    | Events viewable by target or all                 | PERMISSIVE | {public}        | SELECT | ((target_member_id IS NULL) OR (target_member_id = auth.uid()) OR user_has_admin_role(auth.uid()))                                                       |
| gallery_albums            | Allow admins to delete gallery albums            | PERMISSIVE | {authenticated} | DELETE | user_has_admin_role(auth.uid())                                                                                                                          |
| gallery_albums            | Allow admins to insert gallery albums            | PERMISSIVE | {authenticated} | INSERT | null                                                                                                                                                     |
| gallery_albums            | Allow admins to update gallery albums            | PERMISSIVE | {authenticated} | UPDATE | user_has_admin_role(auth.uid())                                                                                                                          |
| gallery_albums            | Allow authenticated users to read gallery albums | PERMISSIVE | {authenticated} | SELECT | true                                                                                                                                                     |
| gallery_config            | Admins can manage gallery config                 | PERMISSIVE | {public}        | ALL    | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['ADMIN'::user_role, 'TEAM'::user_role])))))      |
| gallery_config            | Gallery config is viewable by everyone           | PERMISSIVE | {public}        | SELECT | true                                                                                                                                                     |
| member_deals              | Admins can view all deals                        | PERMISSIVE | {authenticated} | SELECT | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['ADMIN'::user_role, 'TEAM'::user_role])))))      |
| member_deals              | Sellers can create deals                         | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                     |
| member_deals              | Users can view their own deals                   | PERMISSIVE | {public}        | SELECT | ((auth.uid() = seller_id) OR (auth.uid() = buyer_id))                                                                                                    |
| member_progress_files     | Admins can delete progress files                 | PERMISSIVE | {authenticated} | DELETE | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::user_role))))                                      |
| member_progress_files     | Admins can insert progress files                 | PERMISSIVE | {authenticated} | INSERT | null                                                                                                                                                     |
| member_progress_files     | Admins can view all progress files               | PERMISSIVE | {authenticated} | SELECT | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::user_role))))                                      |
| member_progress_files     | Members can view own progress files              | PERMISSIVE | {authenticated} | SELECT | (member_id = auth.uid())                                                                                                                                 |
| member_referrals          | Referrers can create referrals                   | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                     |
| member_referrals          | Users can view their referrals                   | PERMISSIVE | {public}        | SELECT | ((auth.uid() = referrer_id) OR (auth.uid() = receiver_id))                                                                                               |
| messages                  | messages_delete                                  | PERMISSIVE | {public}        | DELETE | is_admin_or_team()                                                                                                                                       |
| messages                  | messages_insert                                  | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                     |
| messages                  | messages_select                                  | PERMISSIVE | {public}        | SELECT | ((conversation_id IN ( SELECT get_my_conversation_ids() AS get_my_conversation_ids)) OR is_admin_or_team())                                              |
| messages                  | messages_update                                  | PERMISSIVE | {authenticated} | UPDATE | ((conversation_id IN ( SELECT get_my_conversation_ids() AS get_my_conversation_ids)) OR is_admin_or_team())                                              |
| notifications             | Admins can create notifications                  | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                     |
| notifications             | Admins can delete notifications                  | PERMISSIVE | {public}        | DELETE | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['ADMIN'::user_role, 'TEAM'::user_role])))))      |
| notifications             | Admins can update notifications                  | PERMISSIVE | {public}        | UPDATE | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['ADMIN'::user_role, 'TEAM'::user_role])))))      |
| notifications             | Admins can view all notifications                | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['ADMIN'::user_role, 'TEAM'::user_role])))))      |
| profile_history           | Admins can update history                        | PERMISSIVE | {public}        | UPDATE | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['ADMIN'::user_role, 'TEAM'::user_role])))))      |
| profile_history           | Admins can view all history                      | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['ADMIN'::user_role, 'TEAM'::user_role])))))      |
| profile_history           | System can insert history                        | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                     |
| profile_history           | Users can view their own history                 | PERMISSIVE | {public}        | SELECT | (auth.uid() = profile_id)                                                                                                                                |
| profiles                  | members_see_only_members                         | PERMISSIVE | {authenticated} | SELECT | ((get_my_role() = ANY (ARRAY['ADMIN'::text, 'TEAM'::text])) OR ((role = 'MEMBER'::user_role) AND (is_active = true)))                                    |
| profiles                  | profiles_admin_update_all                        | PERMISSIVE | {authenticated} | UPDATE | is_admin()                                                                                                                                               |
| profiles                  | profiles_insert_own                              | PERMISSIVE | {authenticated} | INSERT | null                                                                                                                                                     |
| profiles                  | profiles_select_all_authenticated                | PERMISSIVE | {authenticated} | SELECT | true                                                                                                                                                     |
| profiles                  | profiles_select_own                              | PERMISSIVE | {authenticated} | SELECT | (auth.uid() = id)                                                                                                                                        |
| profiles                  | profiles_update_own                              | PERMISSIVE | {authenticated} | UPDATE | (auth.uid() = id)                                                                                                                                        |
| profiles                  | users_insert_own_profile                         | PERMISSIVE | {authenticated} | INSERT | null                                                                                                                                                     |
| profiles                  | users_update_own_profile                         | PERMISSIVE | {authenticated} | UPDATE | (id = auth.uid())                                                                                                                                        |
| push_subscriptions        | Users can delete own push subscriptions          | PERMISSIVE | {public}        | DELETE | (auth.uid() = user_id)                                                                                                                                   |
| push_subscriptions        | Users can insert own push subscriptions          | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                     |
| push_subscriptions        | Users can update own push subscriptions          | PERMISSIVE | {public}        | UPDATE | (auth.uid() = user_id)                                                                                                                                   |
| push_subscriptions        | Users can view own push subscriptions            | PERMISSIVE | {public}        | SELECT | (auth.uid() = user_id)                                                                                                                                   |
| tools_solutions           | Admins can delete solutions                      | PERMISSIVE | {authenticated} | DELETE | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::user_role))))                                      |
| tools_solutions           | Admins can insert solutions                      | PERMISSIVE | {authenticated} | INSERT | null                                                                                                                                                     |
| tools_solutions           | Admins can update solutions                      | PERMISSIVE | {authenticated} | UPDATE | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::user_role))))                                      |
| tools_solutions           | Admins can view all solutions                    | PERMISSIVE | {authenticated} | SELECT | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'ADMIN'::user_role))))                                      |
| tools_solutions           | Authenticated users can view active solutions    | PERMISSIVE | {authenticated} | SELECT | (is_active = true)                                                                                                                                       |
| user_devices              | Admins can view all devices                      | PERMISSIVE | {public}        | SELECT | user_has_admin_role(auth.uid())                                                                                                                          |
| user_devices              | Users can manage their own devices               | PERMISSIVE | {public}        | ALL    | (auth.uid() = user_id)                                                                                                                                   |
| user_favorites            | Admins can view all favorites                    | PERMISSIVE | {public}        | SELECT | user_has_admin_role(auth.uid())                                                                                                                          |
| user_favorites            | Users can delete own favorites                   | PERMISSIVE | {public}        | DELETE | (auth.uid() = user_id)                                                                                                                                   |
| user_favorites            | Users can insert own favorites                   | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                     |
| user_favorites            | Users can view own favorites                     | PERMISSIVE | {public}        | SELECT | (auth.uid() = user_id)                                                                                                                                   |
| user_notifications        | System can create user notifications             | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                     |
| user_notifications        | Users can delete own notifications               | PERMISSIVE | {public}        | DELETE | (auth.uid() = user_id)                                                                                                                                   |
| user_notifications        | Users can update their own notifications         | PERMISSIVE | {public}        | UPDATE | (user_id = auth.uid())                                                                                                                                   |
| user_notifications        | Users can view their own notifications           | PERMISSIVE | {public}        | SELECT | (user_id = auth.uid())                                                                                                                                   |
| video_categories          | video_categories_delete                          | PERMISSIVE | {public}        | DELETE | true                                                                                                                                                     |
| video_categories          | video_categories_insert                          | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                     |
| video_categories          | video_categories_select_all                      | PERMISSIVE | {public}        | SELECT | true                                                                                                                                                     |
| video_categories          | video_categories_update                          | PERMISSIVE | {public}        | UPDATE | true                                                                                                                                                     |
| video_progress            | Admins can view all progress                     | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['ADMIN'::user_role, 'TEAM'::user_role])))))      |
| video_progress            | Users can create own progress                    | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                     |
| video_progress            | Users can update own progress                    | PERMISSIVE | {public}        | UPDATE | (auth.uid() = user_id)                                                                                                                                   |
| video_progress            | Users can view own progress                      | PERMISSIVE | {public}        | SELECT | (auth.uid() = user_id)                                                                                                                                   |