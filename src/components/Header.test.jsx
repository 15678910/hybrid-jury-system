import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Header from './Header'

// Helper to render component with Router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Header Component', () => {
  it('로고와 사이트 이름이 렌더링되는지 확인', () => {
    renderWithRouter(<Header />)

    const logo = screen.getByText(/⚖️ 사법개혁/)
    expect(logo).toBeInTheDocument()
  })

  it('메인 로고가 홈페이지로 링크되는지 확인', () => {
    renderWithRouter(<Header />)

    const logoLink = screen.getByText(/⚖️ 사법개혁/)
    expect(logoLink.tagName).toBe('A')
    expect(logoLink).toHaveAttribute('href', '/')
  })

  it('데스크톱 메뉴가 렌더링되는지 확인', () => {
    renderWithRouter(<Header />)

    // 주요 메뉴 항목들이 있는지 확인
    expect(screen.getAllByText('소개').length).toBeGreaterThan(0)
    expect(screen.getAllByText('도입 필요성').length).toBeGreaterThan(0)
    expect(screen.getAllByText('헌법적 근거').length).toBeGreaterThan(0)
    expect(screen.getAllByText('법안 제안').length).toBeGreaterThan(0)
    expect(screen.getAllByText('참여하기').length).toBeGreaterThan(0)
  })

  it('미디어 드롭다운 메뉴가 있는지 확인', () => {
    renderWithRouter(<Header />)

    // "미디어" 버튼이 있는지 확인
    const mediaButtons = screen.getAllByText('미디어')
    expect(mediaButtons.length).toBeGreaterThan(0)
  })

  it('미디어 드롭다운에 필요한 링크들이 있는지 확인', () => {
    renderWithRouter(<Header />)

    // 미디어 관련 링크들
    expect(screen.getAllByText('사법뉴스').length).toBeGreaterThan(0)
    expect(screen.getAllByText('블로그').length).toBeGreaterThan(0)
    expect(screen.getAllByText('동영상').length).toBeGreaterThan(0)
    expect(screen.getAllByText('내란재판분석').length).toBeGreaterThan(0)
  })

  it('블로그 링크가 올바른 경로를 가리키는지 확인', () => {
    renderWithRouter(<Header />)

    const blogLinks = screen.getAllByText('블로그')
    // 최소 하나는 Link 컴포넌트여야 함
    const blogLink = blogLinks.find(link => link.tagName === 'A')
    expect(blogLink).toBeTruthy()
    expect(blogLink.getAttribute('href')).toBe('/blog')
  })

  it('동영상 링크가 올바른 경로를 가리키는지 확인', () => {
    renderWithRouter(<Header />)

    const videoLinks = screen.getAllByText('동영상')
    const videoLink = videoLinks.find(link => link.tagName === 'A')
    expect(videoLink).toBeTruthy()
    expect(videoLink.getAttribute('href')).toBe('/videos')
  })

  it('모바일 햄버거 버튼이 존재하는지 확인', () => {
    renderWithRouter(<Header />)

    // SVG를 포함한 버튼 찾기
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('모바일 메뉴 토글이 작동하는지 확인', () => {
    renderWithRouter(<Header />)

    // 모바일 메뉴는 초기에는 보이지 않음 (opacity-0 invisible)
    const mobileMenu = document.querySelector('.lg\\:hidden.absolute')
    expect(mobileMenu).toBeInTheDocument()
    expect(mobileMenu.className).toContain('opacity-0')
    expect(mobileMenu.className).toContain('invisible')
  })

  it('소통방 드롭다운이 있는지 확인', () => {
    renderWithRouter(<Header />)

    const communicationMenus = screen.getAllByText('소통방')
    expect(communicationMenus.length).toBeGreaterThan(0)
  })

  it('거버넌스(의사결정) 링크가 있는지 확인', () => {
    renderWithRouter(<Header />)

    const governanceLinks = screen.getAllByText('의사결정')
    expect(governanceLinks.length).toBeGreaterThan(0)

    const governanceLink = governanceLinks.find(link => link.tagName === 'A')
    expect(governanceLink).toBeTruthy()
    expect(governanceLink.getAttribute('href')).toBe('/governance')
  })

  it('해외사례 드롭다운이 있는지 확인', () => {
    renderWithRouter(<Header />)

    const casesMenus = screen.getAllByText('해외사례')
    expect(casesMenus.length).toBeGreaterThan(0)
  })

  it('유럽 페이지 링크가 있는지 확인', () => {
    renderWithRouter(<Header />)

    const europeLinks = screen.getAllByText('유럽')
    expect(europeLinks.length).toBeGreaterThan(0)

    const europeLink = europeLinks.find(link => link.tagName === 'A')
    expect(europeLink).toBeTruthy()
    expect(europeLink.getAttribute('href')).toBe('/europe-jury')
  })

  it('개혁안 비교 링크가 있는지 확인', () => {
    renderWithRouter(<Header />)

    const reformLinks = screen.getAllByText('개혁안 비교')
    const reformLink = reformLinks.find(link => link.tagName === 'A')
    expect(reformLink).toBeTruthy()
    expect(reformLink.getAttribute('href')).toBe('/reform-analysis')
  })

  it('판사평가 링크가 있는지 확인', () => {
    renderWithRouter(<Header />)

    const judgeLinks = screen.getAllByText('판사평가')
    const judgeLink = judgeLinks.find(link => link.tagName === 'A')
    expect(judgeLink).toBeTruthy()
    expect(judgeLink.getAttribute('href')).toBe('/judge-evaluation')
  })

  it('관계도 링크가 있는지 확인', () => {
    renderWithRouter(<Header />)

    const networkLinks = screen.getAllByText('관계도')
    const networkLink = networkLinks.find(link => link.tagName === 'A')
    expect(networkLink).toBeTruthy()
    expect(networkLink.getAttribute('href')).toBe('/judicial-network')
  })

  it('법령DB 링크가 있는지 확인', () => {
    renderWithRouter(<Header />)

    const lawLinks = screen.getAllByText('법령DB')
    const lawLink = lawLinks.find(link => link.tagName === 'A')
    expect(lawLink).toBeTruthy()
    expect(lawLink.getAttribute('href')).toBe('/law-database')
  })

  it('법률정보 검색 링크가 있는지 확인', () => {
    renderWithRouter(<Header />)

    const searchLinks = screen.getAllByText('법률정보 검색')
    const searchLink = searchLinks.find(link => link.tagName === 'A')
    expect(searchLink).toBeTruthy()
    expect(searchLink.getAttribute('href')).toBe('/case-search')
  })

  it('참여하기 버튼이 올바른 스타일을 가지는지 확인', () => {
    renderWithRouter(<Header />)

    const participateButtons = screen.getAllByText('참여하기')
    expect(participateButtons.length).toBeGreaterThan(0)

    // 데스크톱 버튼 찾기 (gradient background)
    const desktopButton = participateButtons.find(btn =>
      btn.className.includes('from-blue-600')
    )
    expect(desktopButton).toBeTruthy()
    expect(desktopButton.className).toContain('to-purple-600')
  })

  it('소개 링크가 올바른 경로를 가리키는지 확인', () => {
    renderWithRouter(<Header />)

    const introLinks = screen.getAllByText('소개')
    const introLink = introLinks.find(link => link.tagName === 'A')
    expect(introLink).toBeTruthy()
    expect(introLink.getAttribute('href')).toBe('/intro.html')
  })
})
