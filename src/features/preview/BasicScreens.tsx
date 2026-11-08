import { useState } from 'react'
import { Icon } from '@/components/Icon'
import PreviewDialog from '@/components/PreviewDialog'
import { assets } from '@/services/market'
import { tradeAmounts } from '@/utils/commission.mjs'
import { useI18n } from '@/i18n/I18n'

export function FundingPreview({ cash, onClose }: { cash?: number; onClose: () => void }) {
  const { t, money } = useI18n()
  const [value, setValue] = useState('10000')
  const [review, setReview] = useState(false)
  const amount = Number(value)
  const valid = Number.isFinite(amount) && amount >= 1 && amount <= 1000000 && /^\d+(\.\d{1,2})?$/.test(value)
  return <PreviewDialog title={review ? t('fp.reviewTitle') : t('modal.fund')} onClose={onClose}>
    <p className="preview-intro">{t('fp.intro')}</p>
    {!review ? <form onSubmit={event => { event.preventDefault(); if (valid) setReview(true) }}>
      <label>{t('fund.amount')}<input type="number" min="1" max="1000000" step="0.01" required value={value} onChange={event => setValue(event.target.value)}/></label>
      <div className="amount-options">{[1000, 5000, 10000].map(preset => <button type="button" key={preset} className={amount === preset ? 'selected' : ''} onClick={() => setValue(String(preset))}>{money(preset)}</button>)}</div>
      <p className="preview-caption">{t('fp.caption')}</p>
      <div className="demo-note">{t('fp.note')}</div>
      <button type="submit" className="button button-primary full" disabled={!valid}>{t('fp.review')} <Icon name="arrow" size={17}/></button>
    </form> : <>
      <dl className="preview-breakdown"><div><dt>{t('fp.cash')}</dt><dd>{cash === undefined ? t('fp.pending') : money(cash)}</dd></div><div><dt>{t('fp.proposed')}</dt><dd>{money(amount)}</dd></div><div><dt>{t('fp.projected')}</dt><dd>{cash === undefined ? t('fp.pending') : money(cash + amount)}</dd></div></dl>
      <div className="demo-note">{t('fp.localNote')}</div>
      <button type="button" className="button button-primary full" disabled>{t('fp.previewButton')}</button>
      <div className="preview-actions"><button type="button" className="text-link" onClick={() => setReview(false)}>{t('fp.edit')}</button><button type="button" className="text-link" onClick={onClose}>{t('fp.close')}</button></div>
    </>}
  </PreviewDialog>
}

export function FundsScreen({ cash, onAdd }: { cash?: number; onAdd: () => void }) {
  const { t, money } = useI18n()
  return <div className="basic-screen">
    <div className="preview-hero"><div><span className="section-tag">{t('funds.tag')}</span><h2>{t('funds.title')}</h2><p>{t('funds.text')}</p><button type="button" className="button button-primary" onClick={onAdd}><Icon name="plus" size={17}/> {t('funds.prepare')}</button></div><Icon name="wallet" size={72}/></div>
    <div className="workspace-overview"><article className="card"><div className="card-heading"><h3>{t('funds.demoCash')}</h3><span className="pill">USD</span></div><strong className="preview-balance">{cash === undefined ? t('fp.pending') : money(cash)}</strong><p className="workspace-copy">{cash === undefined ? t('funds.noCash') : t('funds.virtual')}</p></article><article className="card"><h3>{t('funds.journey')}</h3><ol className="preview-steps"><li>{t('funds.journey1')}</li><li>{t('funds.journey2')}</li><li>{t('funds.journey3')}</li></ol></article></div>
    <article className="card"><div className="card-heading"><div><h3>{t('funds.history')}</h3><p>{t('funds.historySub')}</p></div><span className="pill">{t('funds.preview')}</span></div><div className="table-scroll"><table><thead><tr><th>{t('table.date')}</th><th>{t('funds.movement')}</th><th>{t('funds.amountUsd')}</th><th>{t('table.status')}</th></tr></thead><tbody><tr><td colSpan={4}><div className="empty-state"><Icon name="wallet" size={27}/><p>{t('funds.noMoves')}</p></div></td></tr></tbody></table></div><p className="report-table-note">{t('funds.pendingNote')}</p></article>
  </div>
}

export function HelpScreen({ navigate }: { navigate: (section: string) => void }) {
  const { t, locale } = useI18n()
  const [search, setSearch] = useState('')
  const guides = [
    { icon: 'shield', key: 'guide1', section: 'Mi perfil' },
    { icon: 'chart', key: 'guide2', section: 'Explorar mercado' },
    { icon: 'orders', key: 'guide3', section: 'Mis órdenes' },
    { icon: 'wallet', key: 'guide4', section: 'Reportes' },
  ]
  const questions = [1, 2, 3, 4, 5].map(n => [t(`hc.q${n}`), t(`hc.a${n}`)])
    .filter(([question, answer]) => `${question} ${answer}`.toLocaleLowerCase(locale).includes(search.trim().toLocaleLowerCase(locale)))
  return <div className="basic-screen"><div className="preview-hero"><div><span className="section-tag">{t('hc.tag')}</span><h2>{t('hc.title')}</h2><p>{t('hc.text')}</p></div><Icon name="sun" size={75}/></div><div className="help-guide-grid">{guides.map(guide => <article className="card help-guide" key={guide.key}><span className="preview-icon"><Icon name={guide.icon} size={23}/></span><h3>{t(`hc.${guide.key}.title`)}</h3><p>{t(`hc.${guide.key}.body`)}</p><button type="button" className="text-link" onClick={() => navigate(guide.section)}>{t(`hc.${guide.key}.action`)} <Icon name="arrow" size={15}/></button></article>)}</div><article className="card"><div className="card-heading"><h3>{t('hc.faq')}</h3></div><label className="help-search">{t('hc.search')}<input type="search" placeholder={t('hc.searchPh')} value={search} onChange={event => setSearch(event.target.value)}/></label><div className="help-questions">{questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>{!questions.length && <div className="empty-state">{t('hc.none')}</div>}</article></div>
}

export function ProtectionScreen() {
  const { t, money } = useI18n()
  const [kind, setKind] = useState('Stop Loss')
  const [symbol, setSymbol] = useState('AAPL')
  const [quantity, setQuantity] = useState('1')
  const [price, setPrice] = useState('220')
  const [validity, setValidity] = useState<'DAY' | 'GTC'>('GTC')
  const [review, setReview] = useState(false)
  const count = Number(quantity), threshold = Number(price)
  const valid = Number.isSafeInteger(count) && count > 0 && count <= 1000000 && /^\d+(\.\d{1,2})?$/.test(price) && threshold > 0 && threshold <= 1000000
  const amounts = valid ? tradeAmounts(threshold, count) : null
  return <div className="basic-screen"><div className="preview-hero"><div><span className="section-tag">{t('prot.tag')}</span><h2>{t('prot.title')}</h2><p>{t('prot.text')}</p></div><Icon name="shield" size={75}/></div><div className="workspace-overview"><article className="card"><div className="trade-tabs">{['Stop Loss', 'Take Profit'].map(value => <button type="button" key={value} className={kind === value ? 'selected' : ''} onClick={() => { setKind(value); setPrice(value === 'Stop Loss' ? '220' : '260') }}>{value}</button>)}</div><p className="workspace-copy">{kind === 'Stop Loss' ? t('prot.stopDesc') : t('prot.takeDesc')}</p><form onSubmit={event => { event.preventDefault(); if (valid) setReview(true) }}><label>{t('prot.stock')}<select value={symbol} onChange={event => setSymbol(event.target.value)}>{assets.map(asset => <option key={asset.symbol} value={asset.symbol}>{asset.symbol} · {asset.name}</option>)}</select></label><div className="field-row"><label>{t('prot.quantity')}<input type="number" min="1" max="1000000" step="1" required value={quantity} onChange={event => setQuantity(event.target.value)}/></label><label>{t('prot.trigger')}<input type="number" min="0.01" max="1000000" step="0.01" required value={price} onChange={event => setPrice(event.target.value)}/></label></div><label>{t('prot.validity')}<select value={validity} onChange={event => setValidity(event.target.value as 'DAY' | 'GTC')}><option value="DAY">{t('prot.DAY')}</option><option value="GTC">{t('prot.GTC')}</option></select></label><button type="submit" className="button button-primary full" disabled={!valid}>{t('prot.review')} <Icon name="arrow" size={17}/></button></form></article><article className="card"><span className="preview-icon"><Icon name="help" size={25}/></span><h3>{t('prot.before')}</h3><ol className="preview-steps"><li>{t('prot.before1')}</li><li>{t('prot.before2')}</li><li>{t('prot.before3')}</li></ol><div className="demo-note">{t('prot.note')}</div></article></div>{review && amounts && <PreviewDialog title={t('prot.dialogTitle', { kind })} onClose={() => setReview(false)}><p className="preview-intro">{t('prot.sale', { quantity, symbol, validity: t(`prot.${validity}`) })}</p><dl className="preview-breakdown"><div><dt>{t('prot.activation')}</dt><dd>{kind === 'Stop Loss' ? t('prot.fallTo') : t('prot.riseTo')} {money(threshold)}</dd></div><div><dt>{t('prot.thresholdValue')}</dt><dd>{money(amounts.gross)}</dd></div><div><dt>{t('prot.commission')}</dt><dd>{money(amounts.commission)}</dd></div><div><dt>{t('prot.net')}</dt><dd>{money(amounts.gross - amounts.commission)}</dd></div></dl><div className="demo-note">{t('prot.calcNote')}</div><button type="button" className="button button-primary full" disabled>{t('prot.pending')}</button><button type="button" className="text-link preview-back" onClick={() => setReview(false)}>{t('prot.back')}</button></PreviewDialog>}</div>
}
