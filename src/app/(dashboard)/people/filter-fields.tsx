/**
 * The segment editor's conditions: the People page's filter chips, kept in
 * the form. They submit under GET /v1/people's parameter names, which the
 * segment actions read back with `audienceFilter`.
 */
import type { Member } from '@mentio-dev/sdk';
import { FormFilters } from '@/components/url-filters';
import { filterDefaults } from '@/lib/filter-defaults';
import { audienceFilterDefs } from './filter-defs';
import type { AudienceFilter } from './filters';

export function FilterFields({ filter, members }: { filter: AudienceFilter; members: Member[] }) {
  return <FormFilters filters={audienceFilterDefs(members)} defaults={filterDefaults(filter)} empty="No conditions: everyone." />;
}
