'use server';

import { redirect } from 'next/navigation';
import { run, type ActionState } from '@/lib/action';
import { str } from '@/lib/form';
import { mentio, unwrap } from '@/lib/mentio';
import { money } from '@/lib/format';

/** Opens a hosted checkout for the amount typed; the balance is credited when the payment lands. */
export async function topUpAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const dollars = Number(str(form, 'amount'));
    const { minTopUpCents: min, maxTopUpCents: max } = unwrap(await mentio().getWallet());
    const amountCents = Math.round(dollars * 100);
    if (!Number.isFinite(dollars) || amountCents < min || amountCents > max) {
      throw new Error(`Top up between ${money(min)} and ${money(max)}.`);
    }
    const { url } = unwrap(await mentio().createTopUp({ body: { amountCents } }));
    redirect(url);
  });
}
