import { Link } from 'react-router-dom'
import { PublicArtText as T } from './PublicArtText'
import './game-web-bar.css'

type NavLink = { label: string; to?: string; onClick?: () => void }
export function GameWebBar({ theme, logo, home, title, links, signedIn, busy, onCreate, onAccount }: {
  theme: 'forest' | 'wine'; logo: string; home: string; title: string; links: NavLink[];
  signedIn: boolean; busy?: boolean; onCreate: () => void; onAccount: () => void
}) {
  return <header className={`game-web-bar theme-${theme}`} id="dau-trang">
    <Link className="game-web-brand" to={home} aria-label={title}><img src={logo} alt={title} draggable={false}/></Link>
    <nav aria-label="Mục lục">{links.map(link => link.to
      ? <Link key={link.label} to={link.to}><T text={link.label}/></Link>
      : <button key={link.label} type="button" onClick={link.onClick}><T text={link.label}/></button>)}</nav>
    <div className="game-web-account"><button className="game-web-create" disabled={busy} onClick={onCreate}><T text="Tạo phòng" bold/></button><button disabled={busy} onClick={onAccount}><T text={signedIn ? 'Đăng xuất' : 'Đăng nhập'}/></button></div>
  </header>
}
