'use client';

import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { StorefrontCertification, StorefrontTeamMember } from '@/services/storefront';

export function StorefrontTeamCertsSection({
  team,
  certifications,
  onTeamChange,
  onCertsChange,
}: {
  team: StorefrontTeamMember[];
  certifications: StorefrontCertification[];
  onTeamChange: (items: StorefrontTeamMember[]) => void;
  onCertsChange: (items: StorefrontCertification[]) => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team</CardTitle>
          <CardDescription>Optional — introduce your staff.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {team.map((m, i) => (
            <div key={m.id} className="space-y-2 rounded-lg border border-border/60 p-3">
              <div className="flex justify-end">
                <button type="button" onClick={() => onTeamChange(team.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
              <Input
                placeholder="Name"
                value={m.name}
                onChange={(e) =>
                  onTeamChange(team.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                }
              />
              <Input
                placeholder="Role"
                value={m.role}
                onChange={(e) =>
                  onTeamChange(team.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))
                }
              />
              <Input
                placeholder="Photo URL"
                value={m.photo_url ?? ''}
                onChange={(e) =>
                  onTeamChange(
                    team.map((x, j) => (j === i ? { ...x, photo_url: e.target.value || null } : x)),
                  )
                }
              />
              <Textarea
                placeholder="Bio"
                value={m.description ?? ''}
                rows={2}
                onChange={(e) =>
                  onTeamChange(
                    team.map((x, j) =>
                      j === i ? { ...x, description: e.target.value || null } : x,
                    ),
                  )
                }
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onTeamChange([
                ...team,
                { id: crypto.randomUUID(), name: '', role: '', description: '', photo_url: null },
              ])
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Add team member
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Certifications</CardTitle>
          <CardDescription>GST, trade license, hygiene certificates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {certifications.map((c, i) => (
            <div key={c.id} className="space-y-2 rounded-lg border border-border/60 p-3">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onCertsChange(certifications.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={c.title}
                  onChange={(e) =>
                    onCertsChange(
                      certifications.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)),
                    )
                  }
                />
              </div>
              <Input
                placeholder="Issuer"
                value={c.issuer ?? ''}
                onChange={(e) =>
                  onCertsChange(
                    certifications.map((x, j) =>
                      j === i ? { ...x, issuer: e.target.value || null } : x,
                    ),
                  )
                }
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onCertsChange([
                ...certifications,
                { id: crypto.randomUUID(), title: '', issuer: null, image_url: null },
              ])
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Add certification
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
