/* How a company is run: the model's name, one sentence, and what it rewards and punishes. Shown before you take a job,
   when you found a federation, and on the Company overview. */
import { E } from '../engine';

export function ModelCard(p: { id: string | null | undefined; short?: boolean }) {
  const M = E.MODELS[p.id || 'classic'] || E.MODELS.classic;
  return <>
    <p><b>{M.n}.</b> {M.d}</p>
    {!p.short && M.good.length ? <ul class="fits mt1">
      {M.good.map((x: string) => <li class="good">{'▲'} {x}</li>)}
      {M.bad.map((x: string) => <li class="bad">{'▼'} {x}</li>)}
    </ul> : null}
  </>;
}
