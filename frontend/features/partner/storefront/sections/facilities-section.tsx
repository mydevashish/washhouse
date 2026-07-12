'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function StorefrontFacilitiesSection({
  selected,
  options,
  onChange,
}: {
  selected: string[];
  options: string[];
  onChange: (facilities: string[]) => void;
}) {
  function toggle(name: string) {
    if (selected.includes(name)) {
      onChange(selected.filter((f) => f !== name));
    } else {
      onChange([...selected, name]);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Facilities</CardTitle>
        <CardDescription>Select what your laundry offers — shown as badges on your shop.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {options.map((name) => {
          const on = selected.includes(name);
          return (
            <button key={name} type="button" onClick={() => toggle(name)}>
              <Badge
                variant={on ? 'default' : 'outline'}
                className="cursor-pointer px-3 py-1.5 text-sm"
              >
                {name}
              </Badge>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
