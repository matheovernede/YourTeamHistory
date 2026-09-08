import { useI18n } from '../i18n';

export default function StudioWelcome() {
  const { t } = useI18n();
  return (
    <div className="studio-welcome studio-only">
      <div className="studio-kicker"><span />{t('interface.welcomeKicker')}</div>
      <h1>{t('interface.heroLine1')}<br /><em>{t('interface.heroLine2')}</em></h1>
      <p className="studio-hero-copy">{t('interface.heroCopy')}</p>
      <div className="studio-cover" aria-hidden="true">
        <div className="studio-cover-caption"><span>YOUR TEAM. YOUR RULES.</span><span>01 / 07</span></div>
        <svg className="studio-field-art" viewBox="0 0 640 290" fill="none">
          <g stroke="currentColor" strokeWidth="1.2" opacity=".65">
            <path d="M90 35h460v220H90zM320 35v220" /><circle cx="320" cy="145" r="49" />
            <path d="M90 85h80v120H90m460-120h-80v120h80M90 115h30v60H90m460-60h-30v60h30" />
            <circle cx="320" cy="145" r="3" fill="currentColor" /><path d="m232 175 98-64 83 39 51-72" strokeDasharray="7 7" /><path d="m452 82 13-6-1 14" />
          </g>
          {[[130,145,'1'],[232,65,'3'],[211,117,'4'],[211,180,'5'],[232,229,'2'],[305,94,'6'],[305,205,'8'],[375,145,'10'],[418,63,'7'],[456,145,'9'],[418,227,'11']].map(([x,y,n]) => <g key={n}><circle cx={x} cy={y} r="16" fill={n === '10' ? '#ff7354' : '#f4f2ed'} /><text x={x} y={Number(y)+4} textAnchor="middle" fill="#15213a" fontSize="11" fontWeight="800" fontFamily="Arial, sans-serif">{n}</text></g>)}
        </svg>
        <div className="studio-cover-bottom"><strong>{t('interface.artCaption')}</strong><span>YTH / FOOTBALL CLUB</span></div>
      </div>
      <div className="studio-facts">
        <div><strong>07</strong><span>{t('interface.divisions')}</span></div>
        <div><strong>26</strong><span>{t('interface.matchdays')}</span></div>
        <div><strong>01</strong><span>{t('interface.yourStory')}</span></div>
      </div>
    </div>
  );
}
