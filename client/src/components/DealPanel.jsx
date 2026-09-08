import { useState } from 'react';
import { useI18n } from '../i18n';

const money = (n) => `${new Intl.NumberFormat().format(n)} €`;

export default function DealPanel({ player, mode, budget, busy, onOffer, onSign, onClose }) {
  const { t } = useI18n();
  const [amount, setAmount] = useState(String(Math.min(budget, Math.round(player.value * .85))));
  const price = player.agreedPrice ?? player.counterPrice ?? player.value;
  const canNegotiate = player.agreedPrice == null && player.attemptsLeft > 0;
  return (
    <div className="deal-panel">
      <div className="deal-heading">
        <strong>{t(mode === 'loan' ? 'deals.loanTitle' : 'deals.negotiate')}</strong>
        <button type="button" className="btn-ghost" onClick={onClose} disabled={busy} aria-label={t('deals.close')}>×</button>
      </div>
      {mode === 'loan' ? <>
        <p>{t('deals.loanTerms', { fee: money(player.loanFee), season: player.loanEndSeason })}</p>
        <p>{t('deals.loanRules')}</p>
        <button className="btn-primary" disabled={busy || budget < player.loanFee} onClick={() => onSign(player, 'loan')}>
          {t('deals.confirmLoan', { price: money(player.loanFee) })}
        </button>
      </> : <>
        <p>{t('deals.asking', { price: money(player.value) })}</p>
        <div aria-live="polite">
          {player.agreedPrice != null && <p className="deal-response">{t('deals.accepted', { price: money(price) })}</p>}
          {player.counterPrice != null && <p className="deal-response">{t('deals.counter', { price: money(price) })}</p>}
        </div>
        {canNegotiate ? <form onSubmit={e => { e.preventDefault(); onOffer(player, Number(amount)); }}>
          <label htmlFor={`offer-${player.id}`}>{t('deals.yourOffer')}</label>
          <input id={`offer-${player.id}`} type="number" min={(player.lastOffer || 0) + 1} max={Math.min(budget, player.value)} step="1"
            required value={amount} onChange={e => setAmount(e.target.value)} disabled={busy} />
          <small>{t('deals.attempts', { n: player.attemptsLeft })}</small>
          <button className="btn-secondary" disabled={busy || budget <= (player.lastOffer || 0)}>{t('deals.sendOffer')}</button>
        </form> : player.agreedPrice == null && <p>{t('deals.finalOffer')}</p>}
        <p>{t('deals.noCharge')}</p>
        <button className="btn-primary" disabled={busy || budget < price} onClick={() => onSign(player, 'buy')}>
          {t('deals.sign', { price: money(price) })}
        </button>
      </>}
    </div>
  );
}
