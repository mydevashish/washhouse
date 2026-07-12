'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/auth.store';
import {
  askQuestion,
  listPublicQuestions,
  type CustomerQuestion,
} from '@/services/customer-experience';

export function StorefrontQuestionsSection({ laundryId }: { laundryId: string }) {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [question, setQuestion] = useState('');

  const questionsQ = useQuery({
    queryKey: ['storefront-questions', laundryId],
    queryFn: () => listPublicQuestions(laundryId),
    staleTime: 60_000,
  });

  const askM = useMutation({
    mutationFn: () => askQuestion(laundryId, question.trim()),
    onSuccess: () => {
      toast.success('Question submitted — the shop will reply soon.');
      setQuestion('');
      void qc.invalidateQueries({ queryKey: ['storefront-questions', laundryId] });
    },
    onError: () => toast.error('Could not submit question'),
  });

  const answered = questionsQ.data ?? [];

  return (
    <section aria-labelledby="qa-heading" className="rounded-2xl border border-border/60 p-6">
      <h2 id="qa-heading" className="text-xl font-bold">
        Questions & answers
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Ask about silk care, stain removal, express service, and more.
      </p>

      {answered.length > 0 && (
        <ul className="mt-4 space-y-3">
          {answered.map((q: CustomerQuestion) => (
            <li key={q.id} className="rounded-xl bg-muted/40 p-4">
              <p className="font-medium">{q.question}</p>
              {q.answer && <p className="mt-2 text-sm text-muted-foreground">{q.answer}</p>}
            </li>
          ))}
        </ul>
      )}

      {user?.role === 'customer' && (
        <div className="mt-4 space-y-2">
          <Label htmlFor="customer-question">Your question</Label>
          <Textarea
            id="customer-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Do you clean silk? Can you remove wine stains?"
            rows={3}
          />
          <Button
            type="button"
            size="sm"
            disabled={question.trim().length < 5 || askM.isPending}
            onClick={() => askM.mutate()}
          >
            Submit question
          </Button>
        </div>
      )}
    </section>
  );
}
