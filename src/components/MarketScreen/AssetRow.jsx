import { useRef, useEffect, useState } from 'react';
import Sparkline from './Sparkline';
import { formatPrice } from '../../utils/formatters';

const RISK_LABELS = ['', '★', '★★', '★★★', '★★★★', '★★★★★'];

export default function AssetRow({ asset, selected, onClick }) {
  const [flashClass, setFlashClass] = useState('');
  const prevPrice = useRef(asset.currentPrice);

  useEffect(() => {
    if (asset.currentPrice !== prevPrice.current) {
      const dir = asset.currentPrice > prevPrice.current ? 'price-up' : 'price-down';
      setFlashClass(dir);
      const t = setTimeout(() => setFlashClass(''), 700);
      prevPrice.current = asset.currentPrice;
      return () => clearTimeout(t);
    }
  }, [asset.currentPrice]);

  const changeColor = asset.changePct >= 0 ? '#00FF66' : '#FF3B30';
  const changeSign = asset.changePct >= 0 ? '▲' : '▼';

  return (
    <tr
      className={flashClass}
      onClick={onClick}
      style={{
        cursor: 'pointer',
        background: selected ? 'rgba(255,102,0,0.08)' : 'transparent',
        borderLeft: selected ? '2px solid #FF6A00' : '2px solid transparent',
      }}
    >
      {/* Ticker — always visible */}
      <td style={{ padding: '6px 8px', textAlign: 'left' }}>
        <div style={{ fontWeight: 700, color: '#FF6A00', fontSize: '13px', letterSpacing: '0.05em' }}>
          {asset.ticker}
        </div>
        <div style={{ color: '#555', fontSize: '10px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {asset.name}
        </div>
      </td>

      {/* Class/Sector — hidden on mobile */}
      <td className="market-col-hide" style={{ padding: '6px 4px', textAlign: 'left' }}>
        <span style={{ fontSize: '9px', color: '#555', border: '1px solid #333', padding: '1px 4px', letterSpacing: '0.06em' }}>
          {asset.class}
        </span>
      </td>

      {/* Price — always visible */}
      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#fff', fontSize: '13px' }}>
        {formatPrice(asset.currentPrice)}
      </td>

      {/* Change % — always visible */}
      <td style={{ padding: '6px 8px', textAlign: 'right', color: changeColor, fontWeight: 700, fontSize: '12px' }}>
        {changeSign} {Math.abs(asset.changePct).toFixed(2)}%
      </td>

      {/* Change $ — hidden on mobile */}
      <td className="market-col-hide" style={{ padding: '6px 8px', textAlign: 'right', color: changeColor, fontSize: '11px' }}>
        {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}
      </td>

      {/* Sparkline — hidden on mobile */}
      <td className="market-col-hide" style={{ padding: '4px 8px', textAlign: 'center' }}>
        <Sparkline history={asset.history} width={72} height={22} />
      </td>

      {/* Risk — hidden on mobile */}
      <td className="market-col-hide" style={{ padding: '6px 8px', textAlign: 'right' }}>
        <span style={{ color: '#FFB300', fontSize: '10px', letterSpacing: '-1px' }}>
          {RISK_LABELS[asset.risk] ?? '?'}
        </span>
      </td>
    </tr>
  );
}
