import { useState } from 'react';
import tactics from '../../../shared/tactics.json';
import { api } from '../api/client';
import { useI18n } from '../i18n';
import './TacticsPanel.css';

export default function TacticsPanel({ team, managerId, disabled, onUpdate, onBusy }) {
  const { t } = useI18n();
  const [error, setError] = useState('');
  const selected = Object.hasOwn(tactics, team.tactic) ? team.tactic : 'balanced';

  async function choose(tactic) {
    if (disabled || tactic === selected) return;
    onBusy(true);
    setError('');
    try {
      const result = await api.setTactic(team.id, managerId, tactic);
      onUpdate(result.team);
    } catch (err) { setError(err.message); }
    finally { onBusy(false); }
  }

  return (
    <section className="tactics-panel" aria-labelledby="tactics-title">
      <div className="tactics-heading">
        <h3 id="tactics-title">{t('tactics.title')}</h3>
        <p>{t('tactics.hint')}</p>
      </div>
      <div className="tactics-options" role="group" aria-label={t('tactics.title')}>
        {Object.entries(tactics).map(([id, values]) => (
          <button key={id} type="button" className={`tactic-option ${selected === id ? 'selected' : ''}`}
            aria-pressed={selected === id} disabled={disabled} onClick={() => choose(id)}>
            <strong>{t(`tactics.${id}.name`)}{selected === id && <span aria-hidden="true"> ✓</span>}</strong>
            <span>{t(`tactics.${id}.description`)}</span>
            <small>{t('tactics.fatigue', { n: values.fatigue })}</small>
          </button>
        ))}
      </div>
      <p className="tactics-note">{t('tactics.note')}</p>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
